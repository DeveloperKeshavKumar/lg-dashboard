// Frappe API Configuration and Utility Functions
// DocType Mappings:
// CRM Organization -> Customers
// CRM Deal -> Opportunities  
// CRM Contract -> Contracts
// CRM Quotation -> Quotations
// Region Master -> Regions
// Region Branches -> Branches

const FRAPPE_CONFIG = {
    baseUrl: import.meta.env.VITE_FRAPPE_URL || 'http://localhost:8000',
    apiKey: import.meta.env.VITE_API_KEY || '43c6724d09a2c5e',
    apiSecret: import.meta.env.VITE_API_SECRET || '959df24d70059e4'
};

/**
 * Generic function to fetch data from Frappe v15 API
 * @param {string} doctype - The Frappe doctype to query
 * @param {object} filters - Filters to apply to the query
 * @param {array} fields - Fields to return (default: all)
 * @param {object} options - Additional options (limit, order_by, etc.)
 * @returns {Promise<array>} - Array of documents
 */
export const fetchFrappeData = async (doctype, filters = {}, fields = ['*'], options = {}) => {
    const params = new URLSearchParams({
        fields: JSON.stringify(fields),
        filters: JSON.stringify(filters),
        limit_page_length: options.limit || 999,
        ...(options.order_by && { order_by: options.order_by })
    });

    try {
        const response = await fetch(
            `${FRAPPE_CONFIG.baseUrl}/api/resource/${doctype}?${params}`,
            {
                headers: {
                    'Authorization': `token ${FRAPPE_CONFIG.apiKey}:${FRAPPE_CONFIG.apiSecret}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Frappe API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Frappe API Error:', error);
        throw error;
    }
};

/**
 * Execute a Frappe method/function
 * @param {string} method - The method path (e.g., 'frappe.desk.reportview.get')
 * @param {object} args - Arguments to pass to the method
 * @returns {Promise<any>} - Method response
 */
export const callFrappeMethod = async (method, args = {}) => {
    try {
        const response = await fetch(
            `${FRAPPE_CONFIG.baseUrl}/api/method/${method}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `token ${FRAPPE_CONFIG.apiKey}:${FRAPPE_CONFIG.apiSecret}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(args)
            }
        );

        if (!response.ok) {
            throw new Error(`Frappe Method Error: ${response.status}`);
        }

        const data = await response.json();
        return data.message;
    } catch (error) {
        console.error('Frappe Method Error:', error);
        throw error;
    }
};

/**
 * Fetch all regions with their branches
 */
const fetchRegionsWithBranches = async () => {
    try {
        // Fetch all Region Master documents
        const regions = await fetchFrappeData('Region Master', {
            // is_sub_region: 1  // Only get sub-regions, not parent HO
        }, ['name', 'region_name', 'region_head', 'region_head_name']);

        // Fetch all branches
        const branches = await fetchFrappeData('Region Branches', {},
            ['name', 'branch_code', 'branch_name', 'branch_head', 'branch_head_name', 'branch_id', 'region']
        );

        // Create a map of regions to their branches
        const regionMap = new Map();

        regions.forEach(region => {
            regionMap.set(region.name, {
                ...region,
                branches: []
            });
        });

        // Assign branches to their regions
        branches.forEach(branch => {
            if (regionMap.has(branch.region)) {
                regionMap.get(branch.region).branches.push(branch);
            }
        });

        return Array.from(regionMap.values());
    } catch (error) {
        console.error('Error fetching regions with branches:', error);
        return [];
    }
};

/**
 * Fetch aggregated country-level data
 */
export const getCountryData = async () => {
    try {
        // Fetch contracts, deals, organizations, and quotations
        const [contracts, deals, organizations, quotations, regionsData] = await Promise.all([
            fetchFrappeData('CRM Contract', { docstatus: ['!=', 2] },
                ['name', 'customer_name', 'total_usd', 'amount', 'date', 'region', 'branch', 'start_date', 'expiry_date']
            ),
            fetchFrappeData('CRM Deal', { docstatus: ['!=', 2] },
                ['name', 'customer_name', 'annual_revenue', 'status', 'probability', 'region', 'branch', 'register_date']
            ),
            fetchFrappeData('CRM Organization', { docstatus: ['!=', 2] },
                ['name', 'organization_name', 'region', 'branch', 'industry']
            ),
            fetchFrappeData('CRM Quotation', { docstatus: ['!=', 2] },
                ['name', 'customer_name', 'total_usd', 'grand_total_inr', 'status', 'region', 'branch', 'date']
            ),
            fetchRegionsWithBranches()
        ]);

        // Aggregate by region
        const regionMap = new Map();
        const customerSet = new Set();

        // Initialize regions from Region Master
        regionsData.forEach(region => {
            regionMap.set(region.name, {
                id: region.name.toLowerCase().replace(/\s+/g, '-'),
                name: region.region_name || region.name,
                regionHead: region.region_head_name,
                revenue: 0,
                contracts: 0,
                customers: new Set(),
                opportunities: 0,
                branches: region.branches
            });
        });

        // Aggregate contracts by region
        contracts.forEach(contract => {
            if (!contract.region) return;

            if (!regionMap.has(contract.region)) {
                regionMap.set(contract.region, {
                    id: contract.region.toLowerCase().replace(/\s+/g, '-'),
                    name: contract.region,
                    revenue: 0,
                    contracts: 0,
                    customers: new Set(),
                    opportunities: 0,
                    branches: []
                });
            }

            const regionData = regionMap.get(contract.region);
            regionData.revenue += (contract.total_usd || contract.amount || 0);
            regionData.contracts += 1;
            if (contract.customer_name) {
                regionData.customers.add(contract.customer_name);
                customerSet.add(contract.customer_name);
            }
        });

        // Aggregate deals by region
        deals.forEach(deal => {
            if (!deal.region) return;

            if (regionMap.has(deal.region)) {
                regionMap.get(deal.region).opportunities += 1;
            }
        });

        // Calculate growth (mock for now - would need historical data)
        const regions = Array.from(regionMap.values()).map(r => ({
            ...r,
            customers: r.customers.size,
            growth: Math.random() * 15 + 5 // Replace with actual growth calculation
        }));

        const totalRevenue = regions.reduce((sum, r) => sum + r.revenue, 0);
        const totalContracts = regions.reduce((sum, r) => sum + r.contracts, 0);
        const totalCustomers = customerSet.size;
        const totalOpportunities = regions.reduce((sum, r) => sum + r.opportunities, 0);
        const avgGrowth = regions.reduce((sum, r) => sum + r.growth, 0) / (regions.length || 1);

        return {
            metrics: {
                totalRevenue,
                totalContracts,
                totalCustomers,
                totalOpportunities,
                growth: avgGrowth
            },
            children: regions
        };
    } catch (error) {
        console.error('Error fetching country data:', error);
        throw error; // Throw error instead of returning mock data
    }
};

/**
 * Fetch region-level data
 */
export const getRegionData = async (regionId, regionName) => {
    try {
        // Fetch all contracts, deals, and organizations for this region
        const [contracts, deals, organizations, branches] = await Promise.all([
            fetchFrappeData('CRM Contract', {
                docstatus: ['!=', 2],
                region: regionName
            }, ['name', 'customer_name', 'total_usd', 'amount', 'date', 'branch', 'start_date', 'expiry_date']),

            fetchFrappeData('CRM Deal', {
                docstatus: ['!=', 2],
                region: regionName
            }, ['name', 'customer_name', 'annual_revenue', 'status', 'probability', 'branch', 'register_date']),

            fetchFrappeData('CRM Organization', {
                docstatus: ['!=', 2],
                region: regionName
            }, ['name', 'organization_name', 'branch', 'industry']),

            fetchFrappeData('Region Branches', {
                region: regionName
            }, ['name', 'branch_code', 'branch_name', 'branch_head', 'branch_head_name', 'branch_id'])
        ]);

        // Aggregate by branch
        const branchMap = new Map();
        const customerSet = new Set();

        // Initialize branches
        branches.forEach(branch => {
            branchMap.set(branch.branch_name || branch.branch_code, {
                id: (branch.branch_code || branch.branch_name).toLowerCase(),
                name: branch.branch_name || branch.branch_code,
                code: branch.branch_code,
                branchHead: branch.branch_head_name,
                revenue: 0,
                contracts: 0,
                customers: new Set(),
                opportunities: 0
            });
        });

        // Aggregate contracts by branch
        contracts.forEach(contract => {
            const branchKey = contract.branch;
            if (!branchKey) return;

            if (!branchMap.has(branchKey)) {
                branchMap.set(branchKey, {
                    id: branchKey.toLowerCase(),
                    name: branchKey,
                    revenue: 0,
                    contracts: 0,
                    customers: new Set(),
                    opportunities: 0
                });
            }

            const branchData = branchMap.get(branchKey);
            branchData.revenue += (contract.total_usd || contract.amount || 0);
            branchData.contracts += 1;
            if (contract.customer_name) {
                branchData.customers.add(contract.customer_name);
                customerSet.add(contract.customer_name);
            }
        });

        // Aggregate deals by branch
        deals.forEach(deal => {
            const branchKey = deal.branch;
            if (branchMap.has(branchKey)) {
                branchMap.get(branchKey).opportunities += 1;
            }
        });

        const branchesList = Array.from(branchMap.values()).map(b => ({
            ...b,
            customers: b.customers.size,
            growth: Math.random() * 15 + 5 // Replace with actual growth calculation
        }));

        const totalRevenue = branchesList.reduce((sum, b) => sum + b.revenue, 0);
        const totalContracts = branchesList.reduce((sum, b) => sum + b.contracts, 0);
        const totalCustomers = customerSet.size;
        const totalOpportunities = branchesList.reduce((sum, b) => sum + b.opportunities, 0);
        const avgGrowth = branchesList.reduce((sum, b) => sum + b.growth, 0) / (branchesList.length || 1);

        return {
            metrics: {
                totalRevenue,
                totalContracts,
                totalCustomers,
                totalOpportunities,
                growth: avgGrowth
            },
            children: branchesList
        };
    } catch (error) {
        console.error('Error fetching region data:', error);
        throw error; // Throw error instead of returning mock data
    }
};

/**
 * Fetch branch-level data with area managers
 */
export const getBranchData = async (branchId, branchName) => {
    try {
        // Fetch all contracts and deals for this branch
        const [contracts, deals, organizations] = await Promise.all([
            fetchFrappeData('CRM Contract', {
                docstatus: ['!=', 2],
                branch: branchName
            }, ['name', 'customer_name', 'total_usd', 'amount', 'date', 'start_date', 'expiry_date', 'owner']),

            fetchFrappeData('CRM Deal', {
                docstatus: ['!=', 2],
                branch: branchName
            }, ['name', 'customer_name', 'annual_revenue', 'status', 'probability', 'owner', 'register_date']),

            fetchFrappeData('CRM Organization', {
                docstatus: ['!=', 2],
                branch: branchName
            }, ['name', 'organization_name', 'owner', 'industry'])
        ]);

        // Aggregate by owner (area manager/sales person)
        const managerMap = new Map();
        const customerSet = new Set();

        // Aggregate contracts by manager
        contracts.forEach(contract => {
            const manager = contract.owner || 'Unassigned';

            if (!managerMap.has(manager)) {
                managerMap.set(manager, {
                    id: manager.toLowerCase().replace(/[@.]/g, '-'),
                    name: manager.split('@')[0].replace(/\./g, ' ').toUpperCase(),
                    email: manager,
                    revenue: 0,
                    contracts: 0,
                    customers: new Set(),
                    opportunities: 0
                });
            }

            const managerData = managerMap.get(manager);
            managerData.revenue += (contract.total_usd || contract.amount || 0);
            managerData.contracts += 1;
            if (contract.customer_name) {
                managerData.customers.add(contract.customer_name);
                customerSet.add(contract.customer_name);
            }
        });

        // Aggregate deals by manager
        deals.forEach(deal => {
            const manager = deal.owner || 'Unassigned';
            if (managerMap.has(manager)) {
                managerMap.get(manager).opportunities += 1;
            }
        });

        const managers = Array.from(managerMap.values()).map(m => ({
            ...m,
            customers: m.customers.size,
            growth: Math.random() * 15 + 5 // Replace with actual growth calculation
        }));

        const totalRevenue = managers.reduce((sum, m) => sum + m.revenue, 0);
        const totalContracts = managers.reduce((sum, m) => sum + m.contracts, 0);
        const totalCustomers = customerSet.size;
        const totalOpportunities = managers.reduce((sum, m) => sum + m.opportunities, 0);
        const avgGrowth = managers.reduce((sum, m) => sum + m.growth, 0) / (managers.length || 1);

        return {
            metrics: {
                totalRevenue,
                totalContracts,
                totalCustomers,
                totalOpportunities,
                growth: avgGrowth
            },
            children: managers
        };
    } catch (error) {
        console.error('Error fetching branch data:', error);
        throw error; // Throw error instead of returning mock data
    }
};

export default {
    fetchFrappeData,
    callFrappeMethod,
    getCountryData,
    getRegionData,
    getBranchData
};