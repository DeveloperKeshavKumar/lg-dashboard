// src/hooks/useFrappeData.js
import { useFrappeGetDocList } from 'frappe-react-sdk';
import { useMemo } from 'react';

const REGION_GROUPS = {
    "NORTH": ["NORTH", "NORTH-1", "NORTH-2"],
    "EAST": ["EAST", "EAST-1", "EAST-2"],
};

const REGION_HIERARCHY = {
    'EAST': ['EAST-1', 'EAST-2'],
    'NORTH': ['NORTH-1', 'NORTH-2']
};

/**
 * Custom hook to fetch country-level data with filters
 */
export function useCountryData(filters = {}) {
    // Build filter arrays
    const contractFilters = [];
    const quotationFilters = [['docstatus', '=', 1]];

    if (filters.startDate && filters.endDate) {
        contractFilters.push(['date', 'between', [filters.startDate, filters.endDate]]);
        quotationFilters.push(['date', 'between', [filters.startDate, filters.endDate]]);
    }

    // Fetch all required data
    const { data: contracts, error: contractsError, isLoading: contractsLoading } = useFrappeGetDocList(
        'CRM Contract',
        {
            fields: [
                'name', 'customer', 'customer_name', 'region', 'branch',
                'date', 'amount', 'total_usd', 'start_date', 'expiry_date',
                'total_hp', 'currency', 'docstatus', 'industry', 'parent_vertical',
                'deal_type', 'custom_contract_status'
            ],
            filters: contractFilters.length > 0 ? contractFilters : undefined,
            limit: 0,
        }
    );

    const { data: deals, error: dealsError, isLoading: dealsLoading } = useFrappeGetDocList(
        'CRM Deal',
        {
            fields: [
                'name', 'customer', 'customer_name', 'region', 'branch',
                'register_date', 'annual_revenue', 'status', 'deal_type',
                'warranty_amc_status', 'owner', 'industry', 'parent_vertical'
            ],
            limit: 0,
        }
    );

    const { data: organizations, error: orgsError, isLoading: orgsLoading } = useFrappeGetDocList(
        'CRM Organization',
        {
            fields: [
                'name', 'organization_name', 'customer_hc', 'region',
                'branch', 'industry', 'parent_vertical', 'customer_type'
            ],
            limit: 0,
        }
    );

    const { data: quotations, error: quotationsError, isLoading: quotationsLoading } = useFrappeGetDocList(
        'CRM Quotation',
        {
            fields: [
                'name', 'customer', 'customer_name', 'region', 'branch',
                'date', 'status', 'amount', 'total_usd', 'total_hp', 'docstatus'
            ],
            filters: quotationFilters,
            limit: 0,
        }
    );

    const { data: regions, error: regionsError, isLoading: regionsLoading } = useFrappeGetDocList(
        'Region Master',
        {
            fields: ['name', 'region_name', 'region_head', 'region_head_name'],
            limit: 0,
        }
    );

    const isLoading = contractsLoading || dealsLoading || orgsLoading || quotationsLoading || regionsLoading;
    const error = contractsError || dealsError || orgsError || quotationsError || regionsError;

    // Process and aggregate data
    const processedData = useMemo(() => {
        if (!contracts || !deals || !organizations || !quotations || !regions) {
            return null;
        }

        // Apply client-side filters
        let filteredContracts = contracts;
        let filteredDeals = deals;
        let filteredOrgs = organizations;

        if (filters.vertical) {
            filteredContracts = filteredContracts.filter(c => c.parent_vertical === filters.vertical);
            filteredOrgs = filteredOrgs.filter(o => o.parent_vertical === filters.vertical);
        }

        if (filters.dealType) {
            filteredContracts = filteredContracts.filter(c => c.deal_type === filters.dealType);
            filteredDeals = filteredDeals.filter(d => d.deal_type === filters.dealType);
        }

        if (filters.status) {
            filteredDeals = filteredDeals.filter(d => d.status === filters.status);
        }

        // Aggregate by region
        const regionMap = new Map();

        // Only add regions that are NOT parent regions (EAST, NORTH)
        regions.forEach(region => {
            // Skip if this is a parent region ID (EAST or NORTH)
            if (region.name === 'EAST' || region.name === 'NORTH') {
                return;
            }

            regionMap.set(region.name, {
                regionId: region.name,
                regionName: region.region_name,
                regionHead: region.region_head_name || region.region_head,
                revenue: 0,
                contracts: 0,
                deals: 0,
                amcRenewal: 0,
                warrantyConversion: 0,
                lostAmcConversion: 0,
                lostWarrantyConversion: 0,
                customers: new Set(),
                quotations: 0,
                totalHP: 0,
                isParent: false,
                parentRegionId: null,
            });
        });

        // Mark sub-regions and create VIRTUAL parent regions
        Object.entries(REGION_HIERARCHY).forEach(([parentId, childIds]) => {
            // Mark children with their parent
            childIds.forEach(childId => {
                if (regionMap.has(childId)) {
                    regionMap.get(childId).parentRegionId = parentId;
                }
            });

            // Create VIRTUAL parent region (NOT from database)
            regionMap.set(parentId, {
                regionId: parentId,
                regionName: parentId,
                regionHead: 'Multiple',
                revenue: 0,
                contracts: 0,
                deals: 0,
                amcRenewal: 0,
                warrantyConversion: 0,
                lostAmcConversion: 0,
                lostWarrantyConversion: 0,
                customers: new Set(),
                quotations: 0,
                totalHP: 0,
                isParent: true,
                parentRegionId: null,
                subRegions: childIds,
            });
        });

        // Aggregate filtered contracts
        filteredContracts.forEach(contract => {
            // Skip if contract.region is a parent region (EAST or NORTH)
            if (contract.region === 'EAST' || contract.region === 'NORTH') {
                return;
            }

            if (contract.region && regionMap.has(contract.region)) {
                const region = regionMap.get(contract.region);
                region.revenue += parseFloat(contract.amount || 0);
                region.contracts += 1;
                region.totalHP += parseFloat(contract.total_hp || 0);

                const type = (contract.deal_type || "").toLowerCase().trim();
                if (type === "amc renewal") region.amcRenewal++;
                else if (type === "warranty conversion" || type === "warranty amc conversion") region.warrantyConversion++;
                else if (type === "lost amc conversion") region.lostAmcConversion++;
                else if (type === "lost warranty conversion") region.lostWarrantyConversion++;

                if (contract.customer) {
                    region.customers.add(contract.customer);
                }

                // ONLY aggregate to parent if this is a sub-region (EAST-1, EAST-2, NORTH-1, NORTH-2)
                if (region.parentRegionId && regionMap.has(region.parentRegionId)) {
                    const parentRegion = regionMap.get(region.parentRegionId);
                    parentRegion.revenue += parseFloat(contract.amount || 0);
                    parentRegion.contracts += 1;
                    parentRegion.totalHP += parseFloat(contract.total_hp || 0);

                    if (type === "amc renewal") parentRegion.amcRenewal++;
                    else if (type === "warranty conversion" || type === "warranty amc conversion") parentRegion.warrantyConversion++;
                    else if (type === "lost amc conversion") parentRegion.lostAmcConversion++;
                    else if (type === "lost warranty conversion") parentRegion.lostWarrantyConversion++;

                    if (contract.customer) {
                        parentRegion.customers.add(contract.customer);
                    }
                }
            }
        });

        // Aggregate deals
        filteredDeals.forEach(deal => {
            // Skip if deal.region is a parent region
            if (deal.region === 'EAST' || deal.region === 'NORTH') {
                return;
            }

            if (deal.region && regionMap.has(deal.region)) {
                regionMap.get(deal.region).deals += 1;

                // Also aggregate to parent
                const region = regionMap.get(deal.region);
                if (region.parentRegionId && regionMap.has(region.parentRegionId)) {
                    regionMap.get(region.parentRegionId).deals += 1;
                }
            }
        });

        // Aggregate quotations
        quotations.forEach(quote => {
            // Skip if quote.region is a parent region
            if (quote.region === 'EAST' || quote.region === 'NORTH') {
                return;
            }

            if (quote.region && regionMap.has(quote.region)) {
                regionMap.get(quote.region).quotations += 1;

                // Also aggregate to parent
                const region = regionMap.get(quote.region);
                if (region.parentRegionId && regionMap.has(region.parentRegionId)) {
                    regionMap.get(region.parentRegionId).quotations += 1;
                }
            }
        });

        // Convert Set to count
        regionMap.forEach(region => {
            region.customers = region.customers.size;
        });

        const regionData = Array.from(regionMap.values());
        const totalRevenue = filteredContracts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        const totalContracts = filteredContracts.length;
        const activeContracts = filteredContracts.filter(c => c.custom_contract_status === "Active").length;
        const totalHP = filteredContracts.reduce((sum, c) => sum + parseFloat(c.total_hp || 0), 0);

        return {
            regions: regionData,
            summary: {
                totalRevenue,
                totalContracts,
                activeContracts,
                totalCustomers: filteredOrgs.length,
                totalDeals: filteredDeals.length,
                totalQuotations: quotations.length,
                totalHP,
                avgContractValue: totalContracts > 0 ? totalRevenue / totalContracts : 0,
            },
            rawData: {
                contracts: filteredContracts,
                deals: filteredDeals,
                organizations: filteredOrgs,
                quotations,
            },
        };
    }, [contracts, deals, organizations, quotations, regions, filters]);

    return { data: processedData, isLoading, error };
}

/**
 * Custom hook to fetch region-level data
 */
export function useRegionData(regionId, filters = {}) {
    const regionFilterValue = REGION_GROUPS[regionId] || [regionId];

    const contractFilters = [['region', 'in', regionFilterValue]];
    const dealFilters = [['region', 'in', regionFilterValue]];
    const orgFilters = [['region', 'in', regionFilterValue]];
    const quotationFilters = [['region', 'in', regionFilterValue], ['docstatus', '=', 1]];

    if (filters.startDate && filters.endDate) {
        contractFilters.push(['date', 'between', [filters.startDate, filters.endDate]]);
        quotationFilters.push(['date', 'between', [filters.startDate, filters.endDate]]);
    }

    const { data: contracts, error: contractsError, isLoading: contractsLoading } = useFrappeGetDocList(
        'CRM Contract',
        {
            fields: [
                'name', 'customer', 'customer_name', 'region', 'branch',
                'date', 'amount', 'total_usd', 'start_date', 'expiry_date',
                'total_hp', 'currency', 'docstatus', 'industry', 'parent_vertical',
                'deal_type', 'custom_contract_status'
            ],
            filters: contractFilters,
            limit: 0,
        }
    );

    const { data: deals, error: dealsError, isLoading: dealsLoading } = useFrappeGetDocList(
        'CRM Deal',
        {
            fields: [
                'name', 'customer', 'customer_name', 'region', 'branch',
                'register_date', 'annual_revenue', 'status', 'deal_type',
                'warranty_amc_status', 'owner'
            ],
            filters: dealFilters,
            limit: 0,
        }
    );

    const { data: organizations, error: orgsError, isLoading: orgsLoading } = useFrappeGetDocList(
        'CRM Organization',
        {
            fields: [
                'name', 'organization_name', 'customer_hc', 'region',
                'branch', 'industry', 'parent_vertical', 'customer_type'
            ],
            filters: orgFilters,
            limit: 0,
        }
    );

    const { data: quotations, error: quotationsError, isLoading: quotationsLoading } = useFrappeGetDocList(
        'CRM Quotation',
        {
            fields: [
                'name', 'customer', 'customer_name', 'region', 'branch',
                'date', 'status', 'amount', 'total_usd', 'total_hp', 'docstatus'
            ],
            filters: quotationFilters,
            limit: 0,
        }
    );

    const { data: branches, error: branchesError, isLoading: branchesLoading } = useFrappeGetDocList(
        'Region Branches',
        {
            fields: ['name', 'branch_id', 'branch_name', 'branch_head', 'branch_head_name', 'region'],
            filters: [['region', 'in', regionFilterValue]],
            limit: 0,
        }
    );

    const isLoading = contractsLoading || dealsLoading || orgsLoading || quotationsLoading || branchesLoading;
    const error = contractsError || dealsError || orgsError || quotationsError || branchesError;

    const processedData = useMemo(() => {
        if (!contracts || !deals || !organizations || !quotations || !branches) {
            return null;
        }

        // Apply client-side filters
        let filteredContracts = contracts;
        let filteredDeals = deals;
        let filteredOrgs = organizations;

        if (filters.vertical) {
            filteredContracts = filteredContracts.filter(c => c.parent_vertical === filters.vertical);
            filteredOrgs = filteredOrgs.filter(o => o.parent_vertical === filters.vertical);
        }

        if (filters.dealType) {
            filteredContracts = filteredContracts.filter(c => c.deal_type === filters.dealType);
            filteredDeals = filteredDeals.filter(d => d.deal_type === filters.dealType);
        }

        if (filters.status) {
            filteredDeals = filteredDeals.filter(d => d.status === filters.status);
        }

        // Aggregate by branch
        const branchMap = new Map();

        branches.forEach(branch => {
            branchMap.set(branch.name, {
                branchId: branch.name,
                branchName: branch.branch_name,
                branchHead: branch.branch_head_name || branch.branch_head,
                revenue: 0,
                contracts: 0,
                deals: 0,
                customers: new Set(),
                quotations: 0,
                totalHP: 0,
            });
        });

        filteredContracts.forEach(contract => {
            if (contract.branch && branchMap.has(contract.branch)) {
                const branch = branchMap.get(contract.branch);
                branch.revenue += parseFloat(contract.amount || 0);
                branch.contracts += 1;
                branch.totalHP += parseFloat(contract.total_hp || 0);
                if (contract.customer) {
                    branch.customers.add(contract.customer);
                }
            }
        });

        filteredDeals.forEach(deal => {
            if (deal.branch && branchMap.has(deal.branch)) {
                branchMap.get(deal.branch).deals += 1;
            }
        });

        quotations.forEach(quote => {
            if (quote.branch && branchMap.has(quote.branch)) {
                branchMap.get(quote.branch).quotations += 1;
            }
        });

        branchMap.forEach(branch => {
            branch.customers = branch.customers.size;
        });

        const branchData = Array.from(branchMap.values());
        const totalRevenue = filteredContracts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        const totalContracts = filteredContracts.length;
        const activeContracts = filteredContracts.filter(c => c.custom_contract_status === "Active").length;
        const totalHP = filteredContracts.reduce((sum, c) => sum + parseFloat(c.total_hp || 0), 0);

        return {
            branches: branchData,
            summary: {
                totalRevenue,
                totalContracts,
                activeContracts,
                totalCustomers: filteredOrgs.length,
                totalDeals: filteredDeals.length,
                totalQuotations: quotations.length,
                totalHP,
                avgContractValue: totalContracts > 0 ? totalRevenue / totalContracts : 0,
            },
            rawData: {
                contracts: filteredContracts,
                deals: filteredDeals,
                organizations: filteredOrgs,
                quotations,
            },
        };
    }, [contracts, deals, organizations, quotations, branches, filters]);

    return { data: processedData, isLoading, error };
}

/**
 * Custom hook to fetch branch-level data
 */
export function useBranchData(branchId, filters = {}) {
    const contractFilters = [['branch', '=', branchId]];
    const quotationFilters = [['branch', '=', branchId], ['docstatus', '=', 1]];
    const dealFilters = [['branch', '=', branchId]];
    const orgFilters = [['branch', '=', branchId]];

    if (filters.startDate && filters.endDate) {
        contractFilters.push(['date', 'between', [filters.startDate, filters.endDate]]);
        quotationFilters.push(['date', 'between', [filters.startDate, filters.endDate]]);
    }

    const { data: branchInfo, error: branchInfoError, isLoading: branchInfoLoading } =
        useFrappeGetDocList('Region Branches', {
            fields: ['name', 'branch_id', 'branch_name', 'branch_head', 'branch_head_name', 'region'],
            filters: [['name', '=', branchId]],
            limit: 1
        });

    const { data: contracts, error: contractsError, isLoading: contractsLoading } =
        useFrappeGetDocList('CRM Contract', {
            fields: [
                'name', 'customer', 'customer_name', 'region', 'branch', 'date', 'amount',
                'start_date', 'expiry_date', 'total_hp', 'currency', 'docstatus',
                'industry', 'parent_vertical', 'deal_type', 'owner', 'custom_contract_status'
            ],
            filters: contractFilters,
            limit: 0
        });

    const { data: deals, error: dealsError, isLoading: dealsLoading } =
        useFrappeGetDocList('CRM Deal', {
            fields: [
                'name', 'customer', 'customer_name', 'region', 'branch',
                'register_date', 'annual_revenue', 'status', 'deal_type',
                'warranty_amc_status', 'owner'
            ],
            filters: dealFilters,
            limit: 0
        });

    const { data: organizations, error: orgsError, isLoading: orgsLoading } =
        useFrappeGetDocList('CRM Organization', {
            fields: [
                'name', 'organization_name', 'customer_hc', 'region',
                'branch', 'industry', 'parent_vertical', 'customer_type'
            ],
            filters: orgFilters,
            limit: 0
        });

    const { data: quotations, error: quotationsError, isLoading: quotationsLoading } =
        useFrappeGetDocList('CRM Quotation', {
            fields: [
                'name', 'customer', 'customer_name', 'region', 'branch',
                'date', 'status', 'amount', 'total_hp', 'docstatus', 'owner'
            ],
            filters: quotationFilters,
            limit: 0
        });

    const isLoading =
        contractsLoading ||
        dealsLoading ||
        orgsLoading ||
        quotationsLoading ||
        branchInfoLoading;

    const error =
        contractsError ||
        dealsError ||
        orgsError ||
        quotationsError ||
        branchInfoError;

    const processedData = useMemo(() => {
        if (!contracts || !deals || !organizations || !quotations || !branchInfo?.length) {
            return null;
        }

        const currentBranch = branchInfo[0];

        // Use branch_head_name as the ID (this matches what Region page uses)
        // branch_head field contains email, branch_head_name contains the actual name
        const branchHeadId = currentBranch.branch_head_name || currentBranch.branch_head || 'Unassigned';
        const branchHeadName = currentBranch.branch_head_name || currentBranch.branch_head || 'Unassigned';

        let filteredContracts = contracts;
        let filteredDeals = deals;
        let filteredOrgs = organizations;
        let filteredQuotations = quotations;

        if (filters.vertical) {
            filteredContracts = filteredContracts.filter(c => c.parent_vertical === filters.vertical);
            filteredOrgs = filteredOrgs.filter(o => o.parent_vertical === filters.vertical);
        }

        if (filters.dealType) {
            filteredContracts = filteredContracts.filter(c => c.deal_type === filters.dealType);
            filteredDeals = filteredDeals.filter(d => d.deal_type === filters.dealType);
        }

        if (filters.status) {
            filteredDeals = filteredDeals.filter(d => d.status === filters.status);
        }

        const customers = new Set();
        let revenue = 0;
        let contractsCount = 0;
        let dealsCount = 0;
        let quotationsCount = 0;
        let totalHP = 0;

        filteredContracts.forEach(c => {
            revenue += parseFloat(c.amount || 0);
            contractsCount += 1;
            totalHP += parseFloat(c.total_hp || 0);
            if (c.customer) customers.add(c.customer);
        });

        filteredDeals.forEach(() => dealsCount += 1);
        filteredQuotations.forEach(() => quotationsCount += 1);

        const managerData = [{
            managerId: branchHeadId,
            managerName: branchHeadName,
            revenue,
            contracts: contractsCount,
            deals: dealsCount,
            quotations: quotationsCount,
            customers: customers.size,
            totalHP,
            contractsList: filteredContracts,
            dealsList: filteredDeals,
            quotationsList: filteredQuotations
        }];

        const activeContracts =
            filteredContracts.filter(c => c.custom_contract_status === "Active").length;

        return {
            managers: managerData,
            branchInfo: {
                ...currentBranch,
                // Store both for reference
                branch_head_id: branchHeadId,
                branch_head_email: currentBranch.branch_head
            },

            summary: {
                totalRevenue: revenue,
                totalContracts: contractsCount,
                activeContracts,
                totalCustomers: filteredOrgs.length,
                totalDeals: dealsCount,
                totalQuotations: quotationsCount,
                totalHP,
                avgContractValue: contractsCount > 0 ? revenue / contractsCount : 0
            },

            rawData: {
                contracts: filteredContracts,
                deals: filteredDeals,
                organizations: filteredOrgs,
                quotations: filteredQuotations
            }
        };

    }, [contracts, deals, organizations, quotations, branchInfo, filters]);

    return { data: processedData, isLoading, error };
}

/**
 * Format currency value
 */
export function formatCurrency(value) {
    if (value >= 10000000) {
        return `₹${(value / 10000000).toFixed(2)}Cr`;
    } else if (value >= 100000) {
        return `₹${(value / 100000).toFixed(2)}L`;
    } else {
        return `₹${value.toFixed(2)}`;
    }
}

/**
 * Format HP value
 */
export function formatHP(value) {
    return `${value.toLocaleString()} HP`;
}