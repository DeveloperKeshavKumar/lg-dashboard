// src/pages/Manager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { DollarSign, FileText, Users, Target } from 'lucide-react';
import { useRegionData, formatCurrency } from '../hooks/useFrappeData';
import { useFilters } from '../contexts/FilterContext';
import { COLORS } from '../constants/theme';
import KPICard from '../components/common/KPICard';
import FilterPanel from '../components/common/FilterPanel';
import StackedBarChart, { formatCurrencyCompact, formatNumberCompact } from '../components/charts/StackedBarChart';
import DonutChart from '../components/charts/DonutChart';
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

    const regionId = location.state?.regionId || 'EAST-1';
    const managerName = location.state?.managerName || managerId;
    const branchHeadId = location.state?.branchHeadId || managerId;

    useEffect(() => {
        setLocalFilters(globalFilters);
    }, [globalFilters]);

    const { data: regionData, isLoading, error } = useRegionData(regionId, {
        startDate: globalFilters.startDate,
        endDate: globalFilters.endDate,
        industry: globalFilters.industry,
        vertical: globalFilters.vertical,
        dealType: globalFilters.dealType,
        status: globalFilters.status
    });

    const handleApplyFilters = () => {
        updateFilters(localFilters);
    };

    const handleResetFilters = () => {
        setLocalFilters({});
        resetFilters();
    };

    const handleBranchClick = (branchId) => {
        navigate(`/branch/${branchId}`);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const managerData = useMemo(() => {
        if (!regionData) return null;

        const allBranches = regionData.branches || [];

        // Find ALL branches managed by this manager
        const managedBranchObjs = allBranches.filter(b => {
            const head = b.branchHead || '';
            return head === branchHeadId || head === managerId || head === managerName;
        });

        const managedBranchIds = managedBranchObjs.map(b => b.branchId);
        const managedBranchSet = new Set(managedBranchIds);

        // Get ALL contracts/deals for this manager's branches from rawData
        const allContracts = regionData.rawData?.contracts || [];
        const allDeals = regionData.rawData?.deals || [];
        const allQuotations = regionData.rawData?.quotations || [];
        const allOrganizations = regionData.rawData?.organizations || [];

        // Filter by managed branches ONLY (no other filters)
        let managerContracts = allContracts.filter(c => managedBranchSet.has(c.branch));
        let managerDeals = allDeals.filter(d => managedBranchSet.has(d.branch));
        let managerQuotations = allQuotations.filter(q => managedBranchSet.has(q.branch));
        let managerOrganizations = allOrganizations.filter(o => managedBranchSet.has(o.branch));

        // Apply branch-specific filter if user selected a specific branch
        if (globalFilters.branch && globalFilters.branch !== 'all') {
            managerContracts = managerContracts.filter(c => c.branch === globalFilters.branch);
            managerDeals = managerDeals.filter(d => d.branch === globalFilters.branch);
            managerQuotations = managerQuotations.filter(q => q.branch === globalFilters.branch);
            managerOrganizations = managerOrganizations.filter(o => o.branch === globalFilters.branch);
        }

        const customerSet = new Set();
        managerContracts.forEach(c => {
            if (c.customer) customerSet.add(c.customer);
        });

        const totalRevenue = managerContracts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
        const totalContracts = managerContracts.length;
        const activeContracts = managerContracts.filter(c => c.custom_contract_status === "Active").length;

        return {
            summary: {
                totalRevenue,
                totalContracts,
                activeContracts,
                totalCustomers: customerSet.size,
                totalDeals: managerDeals.length,
                totalQuotations: managerQuotations.length,
                totalBranches: managedBranchIds.length,
                avgContractValue: totalContracts > 0 ? totalRevenue / totalContracts : 0
            },
            rawData: {
                contracts: managerContracts,
                deals: managerDeals,
                quotations: managerQuotations,
                organizations: managerOrganizations,
                branches: managedBranchIds
            },
            branchDetails: managedBranchObjs
        };
    }, [regionData, managerId, branchHeadId, managerName, globalFilters.branch]);

    const chartData = useMemo(() => {
        if (!managerData) return null;

        const { rawData, branchDetails } = managerData;

        const categorizeDealType = (dealType) => {
            const type = (dealType || "").toLowerCase().trim();
            if (type === "amc renewal") return 'amcRenewal';
            if (type === "warranty conversion" || type === "warranty amc conversion") return 'warrantyConversion';
            if (type === "lost amc conversion") return 'lostAmcConversion';
            if (type === "lost warranty conversion") return 'lostWarrantyConversion';
            return 'others';
        };

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

        // Revenue by branch stacked
        const revenueByBranchStacked = branchDetails.map(b => ({
            name: b.branchName,
            branchId: b.branchId,
            amcRenewal: 0,
            warrantyConversion: 0,
            lostAmcConversion: 0,
            lostWarrantyConversion: 0,
            others: 0
        }));

        rawData.contracts.forEach(c => {
            const branch = revenueByBranchStacked.find(b => b.branchId === c.branch);
            if (branch) {
                const amount = parseFloat(c.amount || 0);
                const category = categorizeDealType(c.deal_type);
                branch[category] += amount;
            }
        });

        // Contracts by branch stacked
        const contractsByBranchStacked = branchDetails.map(b => ({
            name: b.branchName,
            branchId: b.branchId,
            amcRenewal: 0,
            warrantyConversion: 0,
            lostAmcConversion: 0,
            lostWarrantyConversion: 0,
            others: 0
        }));

        rawData.contracts.forEach(c => {
            const branch = contractsByBranchStacked.find(b => b.branchId === c.branch);
            if (branch) {
                const category = categorizeDealType(c.deal_type);
                branch[category] += 1;
            }
        });

        return {
            revenueByVertical: revenueByVertical(),
            dealStatus: dealStatus(),
            contractTimeline: contractTimeline(),
            revenueByBranchStacked,
            contractsByBranchStacked
        };
    }, [managerData]);

    const sortedBranches = useMemo(() => {
        if (!managerData) return [];

        const branchMap = new Map();

        // Initialize branches
        managerData.branchDetails.forEach(b => {
            branchMap.set(b.branchId, {
                branchId: b.branchId,
                branchName: b.branchName,
                branchHead: b.branchHead,
                revenue: 0,
                contracts: 0,
                deals: 0,
                customers: 0,
                amcRenewal: 0,
                warrantyConversion: 0,
                lostAmcConversion: 0,
                lostWarrantyConversion: 0,
                others: 0
            });
        });

        // Aggregate contracts
        managerData.rawData.contracts.forEach(c => {
            if (c.branch && branchMap.has(c.branch)) {
                const branch = branchMap.get(c.branch);
                branch.revenue += parseFloat(c.amount || 0);
                branch.contracts += 1;

                const type = (c.deal_type || "").toLowerCase().trim();
                if (type === "amc renewal") branch.amcRenewal++;
                else if (type === "warranty conversion" || type === "warranty amc conversion") branch.warrantyConversion++;
                else if (type === "lost amc conversion") branch.lostAmcConversion++;
                else if (type === "lost warranty conversion") branch.lostWarrantyConversion++;
                else branch.others++;
            }
        });

        // Aggregate deals
        managerData.rawData.deals.forEach(d => {
            if (d.branch && branchMap.has(d.branch)) {
                branchMap.get(d.branch).deals++;
            }
        });

        // Aggregate customers
        managerData.rawData.organizations.forEach(o => {
            if (o.branch && branchMap.has(o.branch)) {
                branchMap.get(o.branch).customers++;
            }
        });

        let result = Array.from(branchMap.values());

        if (sortConfig.key) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
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
        { key: 'others', label: 'Others', align: 'right' },
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
                            { label: 'Home', href: '/' },
                            { label: regionId, href: `/region/${regionId}` },
                            { label: managerName }
                        ]}
                    />
                    <h1 className="text-3xl font-bold" style={{ color: COLORS.text.primary }}>
                        Area Manager Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">{managerName} - {regionId}</p>
                </div>

                <FilterPanel
                    filters={localFilters}
                    setFilters={setLocalFilters}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                    additionalOptions={{
                        branches: managerData.branchDetails.map(b => ({
                            value: b.branchId,
                            label: b.branchName
                        }))
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
                        icon={Users}
                    />
                    <KPICard
                        title="Active Opportunities"
                        value={managerData.summary.totalDeals.toLocaleString()}
                        subtitle={`Branches: ${managerData.summary.totalBranches}`}
                        icon={Target}
                    />
                </div>

                {chartData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <StackedBarChart
                            data={chartData.revenueByBranchStacked}
                            title="Revenue by Branch"
                            stacks={[
                                { dataKey: 'amcRenewal', name: 'AMC Renewal', color: '#10b981' },
                                { dataKey: 'warrantyConversion', name: 'Warranty Conversion', color: '#3b82f6' },
                                { dataKey: 'lostAmcConversion', name: 'Lost AMC Conversion', color: '#f59e0b' },
                                { dataKey: 'lostWarrantyConversion', name: 'Lost Warranty Conversion', color: '#ef4444' },
                                { dataKey: 'others', name: 'Others', color: '#9ca3af' }
                            ]}
                            yAxisFormatter={formatCurrencyCompact}
                            valueFormatter={formatCurrency}
                        />

                        <StackedBarChart
                            data={chartData.contractsByBranchStacked}
                            title="Contracts by Branch"
                            stacks={[
                                { dataKey: 'amcRenewal', name: 'AMC Renewal', color: '#10b981' },
                                { dataKey: 'warrantyConversion', name: 'Warranty Conversion', color: '#3b82f6' },
                                { dataKey: 'lostAmcConversion', name: 'Lost AMC Conversion', color: '#f59e0b' },
                                { dataKey: 'lostWarrantyConversion', name: 'Lost Warranty Conversion', color: '#ef4444' },
                                { dataKey: 'others', name: 'Others', color: '#9ca3af' }
                            ]}
                        />

                        <AreaChart
                            data={chartData.contractTimeline}
                            title="Contract Timeline"
                            xAxisTitle="Month"
                            yAxisTitleLeft="Contracts"
                            yAxisTitleRight="Revenue (₹)"
                            yAxisFormatterLeft={formatNumberCompact}
                            yAxisFormatterRight={formatCurrencyCompact
                            }
                            valueFormatter={formatCurrencyCompact}
                            areas={[
                                {
                                    dataKey: "count",
                                    name: "Count",
                                    color: COLORS.chart?.[0] || "#8b5cf6",
                                    yAxisId: "left"
                                },
                                {
                                    dataKey: "revenue",
                                    name: "Revenue",
                                    color: COLORS.chart?.[1] || "#06b6d4",
                                    yAxisId: "right"
                                }
                            ]}
                        />

                        {/* <DonutChart
                            data={chartData.dealStatus}
                            title="Opportunity Status Distribution"
                        /> */}

                        <DonutChart
                            data={chartData.revenueByVertical}
                            title="Revenue by Vertical"
                            valueFormatter={formatCurrency}
                        />
                    </div>
                )}

                <DataTable
                    title="Branches Overview"
                    columns={branchColumns}
                    data={sortedBranches}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    onRowClick={(row) => handleBranchClick(row.branchId)}
                    actionButton={{
                        label: 'View Details',
                        onClick: (row) => handleBranchClick(row.branchId)
                    }}
                />
            </div>
        </div>
    );
}