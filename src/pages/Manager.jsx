// src/pages/Manager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { DollarSign, FileText, Users, Target } from 'lucide-react';
import { useRegionData, formatCurrency } from '../hooks/useFrappeData';
import { useFilters } from '../contexts/FilterContext';
import { COLORS } from '../constants/theme';
import KPICard from '../components/common/KPICard';
import FilterPanel from '../components/common/FilterPanel';
import StackedBarChart, { formatCurrencyCompact } from '../components/charts/StackedBarChart';
import DonutChart from '../components/charts/DonutChart';
import PieChart from '../components/charts/PieChart';
import AreaChart from '../components/charts/AreaChart';
import Breadcrumb from '../components/common/BreadCrumb';
import DataTable from '../components/common/DataTable';

export default function Manager() {
    const { managerId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { globalFilters, updateFilters, resetFilters } = useFilters();

    const [localFilters, setLocalFilters] = useState(globalFilters);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const regionId = location.state?.regionId;
    const managerName = location.state?.managerName || managerId;
    const branchHeadId = location.state?.branchHeadId || managerId;

    useEffect(() => {
        setLocalFilters(globalFilters);
    }, [globalFilters]);

    const { data: regionData, isLoading, error } = useRegionData(regionId, globalFilters);

    const handleApplyFilters = () => {
        updateFilters(localFilters);
    };

    const handleResetFilters = () => {
        setLocalFilters({});
        resetFilters();
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleBranchClick = (branchId) => {
        navigate(`/branch/${branchId}`);
    };

    const managerData = useMemo(() => {
        if (!regionData) return null;

        const allContracts = regionData.rawData.contracts || [];
        const allDeals = regionData.rawData.deals || [];
        const allQuotations = regionData.rawData.quotations || [];
        const allOrganizations = regionData.rawData.organizations || [];
        const allBranches = regionData.branches || [];

        // Find branches managed by this branch head
        const managedBranchObjs = allBranches.filter(
            b => b.branchHead === branchHeadId || b.branchHead === managerId
        );

        const managedBranches = managedBranchObjs.map(b => b.branchId);
        const managedBranchSet = new Set(managedBranches);

        // Filter by branch
        let filteredContracts = allContracts.filter(c => managedBranchSet.has(c.branch));
        let filteredDeals = allDeals.filter(d => managedBranchSet.has(d.branch));
        let filteredQuotations = allQuotations.filter(q => managedBranchSet.has(q.branch));
        let filteredOrganizations = allOrganizations.filter(o => managedBranchSet.has(o.branch));

        // Apply branch filter if selected
        if (globalFilters.branch) {
            filteredContracts = filteredContracts.filter(c => c.branch === globalFilters.branch);
            filteredDeals = filteredDeals.filter(d => d.branch === globalFilters.branch);
            filteredQuotations = filteredQuotations.filter(q => q.branch === globalFilters.branch);
            filteredOrganizations = filteredOrganizations.filter(o => o.branch === globalFilters.branch);
        }

        const customerSet = new Set(filteredContracts.map(c => c.customer).filter(Boolean));
        const totalRevenue = filteredContracts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        const totalContracts = filteredContracts.length;
        const activeContracts = filteredContracts.filter(c => c.custom_contract_status === "Active").length;

        return {
            summary: {
                totalRevenue,
                totalContracts,
                activeContracts,
                totalCustomers: customerSet.size,
                totalDeals: filteredDeals.length,
                totalQuotations: filteredQuotations.length,
                totalBranches: managedBranches.length,
                avgContractValue: totalContracts > 0 ? totalRevenue / totalContracts : 0
            },
            rawData: {
                contracts: filteredContracts,
                deals: filteredDeals,
                quotations: filteredQuotations,
                organizations: filteredOrganizations,
                branches: managedBranches
            },
            branchDetails: managedBranchObjs
        };
    }, [regionData, managerId, branchHeadId, globalFilters]);

    const chartData = useMemo(() => {
        if (!managerData) return null;

        const { rawData, branchDetails } = managerData;

        const revenueByVertical = () => {
            const map = new Map();
            rawData.contracts.forEach(c => {
                const v = c.parent_vertical || 'Uncategorized';
                map.set(v, (map.get(v) || 0) + parseFloat(c.amount || 0));
            });
            return Array.from(map, ([name, value]) => ({ name, value }));
        };

        const dealStatus = () => {
            const map = new Map();
            rawData.deals.forEach(d => {
                const s = d.status || 'Unknown';
                map.set(s, (map.get(s) || 0) + 1);
            });
            return Array.from(map, ([name, value]) => ({ name, value }));
        };

        const dealTypeBreakdown = () => {
            const map = new Map();
            rawData.contracts.forEach(c => {
                const type = c.deal_type || 'Unknown';
                map.set(type, (map.get(type) || 0) + 1);
            });
            return Array.from(map, ([name, value]) => ({ name, value }));
        };

        const contractTimeline = () => {
            const map = new Map();
            rawData.contracts.forEach(c => {
                if (c.date) {
                    const month = c.date.substring(0, 7);
                    const curr = map.get(month) || { count: 0, revenue: 0 };
                    map.set(month, {
                        count: curr.count + 1,
                        revenue: curr.revenue + parseFloat(c.amount || 0)
                    });
                }
            });
            return Array.from(map.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([name, d]) => ({ name, count: d.count, revenue: d.revenue }));
        };

        const revenueByBranch = () => {
            const map = new Map();

            branchDetails.forEach(branch => {
                map.set(branch.branchId, {
                    name: branch.branchName,
                    branchId: branch.branchId,
                    amcRenewal: 0,
                    warrantyConversion: 0,
                    lostAmcConversion: 0,
                    lostWarrantyConversion: 0,
                });
            });

            rawData.contracts.forEach(c => {
                if (c.branch && map.has(c.branch)) {
                    const branch = map.get(c.branch);
                    const revenue = parseFloat(c.amount || 0);
                    const type = (c.deal_type || "").toLowerCase().trim();

                    if (type === "amc renewal") branch.amcRenewal += revenue;
                    else if (type === "warranty conversion" || type === "warranty amc conversion") branch.warrantyConversion += revenue;
                    else if (type === "lost amc conversion") branch.lostAmcConversion += revenue;
                    else if (type === "lost warranty conversion") branch.lostWarrantyConversion += revenue;
                }
            });

            return Array.from(map.values());
        };

        const contractsByBranchStacked = () => {
            const map = new Map();
            branchDetails.forEach(branch => {
                map.set(branch.branchId, {
                    name: branch.branchName,
                    branchId: branch.branchId,
                    amcRenewal: 0,
                    warrantyConversion: 0,
                    lostAmcConversion: 0,
                    lostWarrantyConversion: 0,
                });
            });

            rawData.contracts.forEach(c => {
                if (c.branch && map.has(c.branch)) {
                    const branch = map.get(c.branch);
                    const type = (c.deal_type || "").toLowerCase().trim();

                    if (type === "amc renewal") branch.amcRenewal += 1;
                    else if (type === "warranty conversion" || type === "warranty amc conversion") branch.warrantyConversion += 1;
                    else if (type === "lost amc conversion") branch.lostAmcConversion += 1;
                    else if (type === "lost warranty conversion") branch.lostWarrantyConversion += 1;
                }
            });

            return Array.from(map.values());
        };

        return {
            revenueByVertical: revenueByVertical(),
            dealStatus: dealStatus(),
            dealTypeBreakdown: dealTypeBreakdown(),
            contractTimeline: contractTimeline(),
            revenueByBranch: revenueByBranch(),
            contractsByBranchStacked: contractsByBranchStacked()
        };
    }, [managerData]);

    // Branch-wise summary table
    const branchSummary = useMemo(() => {
        if (!managerData) return [];

        const { rawData, branchDetails } = managerData;
        const branchMap = new Map();

        branchDetails.forEach(branch => {
            branchMap.set(branch.branchId, {
                branchId: branch.branchId,
                branchName: branch.branchName,
                revenue: 0,
                contracts: 0,
                activeContracts: 0,
                customers: new Set(),
                deals: 0,
                amcRenewal: 0,
                warrantyConversion: 0,
                lostAmcConversion: 0,
                lostWarrantyConversion: 0
            });
        });

        rawData.contracts.forEach(c => {
            if (c.branch && branchMap.has(c.branch)) {
                const branch = branchMap.get(c.branch);
                branch.revenue += parseFloat(c.amount || 0);
                branch.contracts += 1;
                if (c.custom_contract_status === "Active") branch.activeContracts += 1;
                if (c.customer) branch.customers.add(c.customer);

                const type = (c.deal_type || "").toLowerCase().trim();
                if (type === "amc renewal") branch.amcRenewal++;
                else if (type === "warranty conversion" || type === "warranty amc conversion") branch.warrantyConversion++;
                else if (type === "lost amc conversion") branch.lostAmcConversion++;
                else if (type === "lost warranty conversion") branch.lostWarrantyConversion++;
            }
        });

        rawData.deals.forEach(d => {
            if (d.branch && branchMap.has(d.branch)) {
                branchMap.get(d.branch).deals++;
            }
        });

        branchMap.forEach(branch => {
            branch.customers = branch.customers.size;
        });

        return Array.from(branchMap.values());
    }, [managerData]);

    const sortedContracts = useMemo(() => {
        if (!managerData) return [];
        let result = [...managerData.rawData.contracts];

        if (sortConfig.key) {
            result.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (sortConfig.key === 'amount') {
                    aVal = parseFloat(aVal || 0);
                    bVal = parseFloat(bVal || 0);
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [managerData, sortConfig]);

    const branchColumns = [
        { key: 'branchName', label: 'Branch', bold: true },
        { key: 'revenue', label: 'Revenue', align: 'right', render: v => formatCurrency(v) },
        { key: 'contracts', label: 'Total Contracts', align: 'right' },
        { key: 'amcRenewal', label: 'AMC Renewal', align: 'right' },
        { key: 'warrantyConversion', label: 'Warranty Conv.', align: 'right' },
        { key: 'lostAmcConversion', label: 'Lost AMC Conv.', align: 'right' },
        { key: 'lostWarrantyConversion', label: 'Lost Warranty Conv.', align: 'right' },
    ];

    const contractColumns = [
        { key: 'name', label: 'Contract ID', bold: true },
        { key: 'customer_name', label: 'Customer' },
        { key: 'branch', label: 'Branch' },
        { key: 'date', label: 'Date' },
        { key: 'amount', label: 'Amount', align: 'right', render: v => formatCurrency(v) },
        { key: 'deal_type', label: 'Deal Type' },
        { key: 'custom_contract_status', label: 'Status' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl font-semibold" style={{ color: COLORS.text.secondary }}>
                    Loading manager data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
                    <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Manager</h3>
                    <p className="text-gray-600">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!managerData) return null;

    return (
        <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            ...(regionId ? [{ label: regionId, href: `/region/${regionId}` }] : []),
                            { label: managerName }
                        ]}
                    />
                    <h1 className="text-3xl font-bold" style={{ color: COLORS.text.primary }}>
                        Area Manager Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">Performance overview for {managerName}</p>
                    {managerData.branchDetails.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                            Managing: {managerData.branchDetails.map(b => b.branchName).join(', ')}
                        </p>
                    )}
                </div>

                <FilterPanel
                    filters={localFilters}
                    setFilters={setLocalFilters}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                    additionalOptions={{
                        branches: managerData.branchDetails
                    }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <KPICard
                        title="Total Revenue"
                        value={formatCurrency(managerData.summary.totalRevenue)}
                        subtitle={`Avg: ${formatCurrency(managerData.summary.avgContractValue)}`}
                        icon={DollarSign}
                    />
                    <KPICard
                        title="Active Contracts"
                        value={managerData.summary.activeContracts.toLocaleString()}
                        subtitle={`Total: ${managerData.summary.totalContracts.toLocaleString()}`}
                        icon={FileText}
                    />
                    <KPICard
                        title="Total Customers"
                        value={managerData.summary.totalCustomers.toLocaleString()}
                        subtitle={`${managerData.summary.totalBranches} Branches`}
                        icon={Users}
                    />
                    <KPICard
                        title="Total Opportunities"
                        value={managerData.summary.totalDeals.toLocaleString()}
                        subtitle={`Quotes: ${managerData.summary.totalQuotations.toLocaleString()}`}
                        icon={Target}
                    />
                </div>

                {chartData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <StackedBarChart
                            data={chartData.revenueByBranch}
                            title="Revenue by Branch (Deal Type)"
                            stacks={[
                                { dataKey: 'amcRenewal', name: 'AMC Renewal', color: '#10b981' },
                                { dataKey: 'warrantyConversion', name: 'Warranty Conversion', color: '#3b82f6' },
                                { dataKey: 'lostAmcConversion', name: 'Lost AMC Conversion', color: '#f59e0b' },
                                { dataKey: 'lostWarrantyConversion', name: 'Lost Warranty Conversion', color: '#ef4444' },
                            ]}
                            yAxisFormatter={formatCurrencyCompact}
                            valueFormatter={formatCurrency}
                        />

                        <StackedBarChart
                            data={chartData.contractsByBranchStacked}
                            title="Contracts by Branch (Deal Type)"
                            stacks={[
                                { dataKey: 'amcRenewal', name: 'AMC Renewal', color: '#10b981' },
                                { dataKey: 'warrantyConversion', name: 'Warranty Conversion', color: '#3b82f6' },
                                { dataKey: 'lostAmcConversion', name: 'Lost AMC Conversion', color: '#f59e0b' },
                                { dataKey: 'lostWarrantyConversion', name: 'Lost Warranty Conversion', color: '#ef4444' },
                            ]}
                        />

                        <AreaChart
                            data={chartData.contractTimeline}
                            title="Contract Timeline"
                            xAxisTitle="Month"
                            yAxisTitle="Revenue / Count"
                            valueFormatter={formatCurrencyCompact}
                            areas={[
                                { dataKey: 'count', name: 'Count', color: COLORS.chart?.[0] || '#8b5cf6' },
                                { dataKey: 'revenue', name: 'Revenue', color: COLORS.chart?.[1] || '#06b6d4' }
                            ]}
                        />

                        <PieChart
                            data={chartData.dealTypeBreakdown}
                            title="Deal Type Breakdown"
                        />

                        <DonutChart
                            data={chartData.dealStatus}
                            title="Opportunity Status Distribution"
                        />

                        <DonutChart
                            data={chartData.revenueByVertical}
                            title="Revenue by Vertical"
                            valueFormatter={formatCurrency}
                        />
                    </div>
                )}

                {/* Branches Summary Table */}
                <DataTable
                    title="Branches Overview"
                    columns={branchColumns}
                    data={branchSummary}
                    onRowClick={(row) => handleBranchClick(row.branchId)}
                    actionButton={{
                        label: 'View Details',
                        onClick: (row) => handleBranchClick(row.branchId)
                    }}
                />

                {/* Contracts Table */}
                <div className="mt-6">
                    <DataTable
                        title="Contracts Overview"
                        columns={contractColumns}
                        data={sortedContracts}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                    />
                </div>
            </div>
        </div>
    );
}