// src/pages/Branch.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Users, Target } from 'lucide-react';
import { useBranchData, formatCurrency } from '../hooks/useFrappeData';
import { useFilters } from '../contexts/FilterContext';
import { COLORS } from '../constants/theme';
import KPICard from '../components/common/KPICard';
import FilterPanel from '../components/common/FilterPanel';
import DonutChart from '../components/charts/DonutChart';
import PieChart from '../components/charts/PieChart';
import AreaChart from '../components/charts/AreaChart';
import StackedBarChart, { formatCurrencyCompact, formatNumberCompact } from '../components/charts/StackedBarChart';
import Breadcrumb from '../components/common/BreadCrumb';
import DataTable from '../components/common/DataTable';

export default function Branch() {
    const { branchId } = useParams();
    const navigate = useNavigate();
    const { globalFilters, updateFilters, resetFilters } = useFilters();

    const [localFilters, setLocalFilters] = useState(globalFilters);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    useEffect(() => {
        setLocalFilters(globalFilters);
    }, [globalFilters]);

    const { data, isLoading, error } = useBranchData(branchId, globalFilters);

    const handleApplyFilters = () => {
        updateFilters(localFilters);
    };

    const handleResetFilters = () => {
        setLocalFilters({});
        resetFilters();
    };

    // In src/pages/Branch.jsx, update handleManagerClick:

    const handleManagerClick = () => {
        if (!data?.branchInfo) return;

        const branchHeadId = data.branchInfo.branch_head_id || data.branchInfo.branch_head_name;
        const branchHeadName = data.branchInfo.branch_head_name || branchHeadId;
        const regionId = data.branchInfo.region;

        // Add branch filter to global filters
        const newFilters = {
            ...globalFilters,
            branch: branchId // Add the current branch as a filter
        };

        updateFilters(newFilters);

        navigate(`/manager/${branchHeadId}`, {
            state: {
                regionId,
                managerName: branchHeadName,
                branchHeadId: branchHeadId
            }
        });
    };

    // In src/pages/Branch.jsx, update the chartData useMemo to include stacked data:

    const chartData = useMemo(() => {
        if (!data) return null;

        const { rawData } = data;

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

        const quotationStatus = () => {
            const map = new Map();
            rawData.quotations.forEach(q => {
                const s = q.status || 'Unknown';
                map.set(s, (map.get(s) || 0) + 1);
            });
            return Array.from(map, ([name, value]) => ({ name, value }));
        };

        const dealTypeRevenue = () => {
            const map = new Map();
            rawData.contracts.forEach(c => {
                const type = c.deal_type || 'Others';
                map.set(type, (map.get(type) || 0) + parseFloat(c.amount || 0));
            });
            return Array.from(map, ([name, value]) => ({ name, value }));
        };

        const dealTypeContracts = () => {
            const map = new Map();
            rawData.contracts.forEach(c => {
                const type = c.deal_type || 'Others';
                map.set(type, (map.get(type) || 0) + 1);
            });
            return Array.from(map, ([name, value]) => ({ name, value }));
        };

        const contractTimeline = () => {
            const map = new Map();
            rawData.contracts.forEach(c => {
                if (!c.date) return;
                const month = c.date.substring(0, 7);
                const curr = map.get(month) || { count: 0, revenue: 0 };
                map.set(month, {
                    count: curr.count + 1,
                    revenue: curr.revenue + parseFloat(c.amount || 0)
                });
            });
            return Array.from(map.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([name, d]) => ({
                    name,
                    count: d.count,
                    revenue: d.revenue
                }));
        };

        // NEW: Revenue by Deal Type (Stacked) - for single bar
        const revenueByDealTypeStacked = () => {
            const result = {
                name: 'Revenue',
                amcRenewal: 0,
                warrantyConversion: 0,
                lostAmcConversion: 0,
                lostWarrantyConversion: 0,
            };

            rawData.contracts.forEach(c => {
                const amount = parseFloat(c.amount || 0);
                const type = (c.deal_type || "").toLowerCase().trim();

                if (type === "amc renewal") {
                    result.amcRenewal += amount;
                } else if (type === "warranty conversion" || type === "warranty amc conversion") {
                    result.warrantyConversion += amount;
                } else if (type === "lost amc conversion") {
                    result.lostAmcConversion += amount;
                } else if (type === "lost warranty conversion") {
                    result.lostWarrantyConversion += amount;
                }
            });

            return [result]; // Return as array with single item
        };

        // NEW: Contracts by Deal Type (Stacked) - for single bar
        const contractsByDealTypeStacked = () => {
            const result = {
                name: 'Contracts',
                amcRenewal: 0,
                warrantyConversion: 0,
                lostAmcConversion: 0,
                lostWarrantyConversion: 0,
            };

            rawData.contracts.forEach(c => {
                const type = (c.deal_type || "").toLowerCase().trim();

                if (type === "amc renewal") {
                    result.amcRenewal += 1;
                } else if (type === "warranty conversion" || type === "warranty amc conversion") {
                    result.warrantyConversion += 1;
                } else if (type === "lost amc conversion") {
                    result.lostAmcConversion += 1;
                } else if (type === "lost warranty conversion") {
                    result.lostWarrantyConversion += 1;
                }
            });

            return [result]; // Return as array with single item
        };

        return {
            revenueByVertical: revenueByVertical(),
            dealStatus: dealStatus(),
            quotationStatus: quotationStatus(),
            dealTypeRevenue: dealTypeRevenue(),
            dealTypeContracts: dealTypeContracts(),
            contractTimeline: contractTimeline(),
            revenueByDealTypeStacked: revenueByDealTypeStacked(),
            contractsByDealTypeStacked: contractsByDealTypeStacked()
        };
    }, [data]);

    // Branch head info for table
    const branchHeadInfo = useMemo(() => {
        if (!data?.managers?.[0]) return [];

        const manager = data.managers[0];
        const { rawData } = data;

        const breakdown = {
            amcRenewal: 0,
            warrantyConversion: 0,
            lostAmcConversion: 0,
            lostWarrantyConversion: 0
        };

        rawData.contracts.forEach(contract => {
            const type = (contract.deal_type || "").toLowerCase().trim();
            if (type === "amc renewal") breakdown.amcRenewal++;
            else if (type === "warranty conversion" || type === "warranty amc conversion") breakdown.warrantyConversion++;
            else if (type === "lost amc conversion") breakdown.lostAmcConversion++;
            else if (type === "lost warranty conversion") breakdown.lostWarrantyConversion++;
        });

        return [{
            managerName: manager.managerName,
            revenue: manager.revenue,
            contracts: manager.contracts,
            customers: manager.customers,
            deals: manager.deals,
            quotations: manager.quotations,
            ...breakdown
        }];
    }, [data]);

    const branchHeadColumns = [
        { key: 'managerName', label: 'Branch Head', bold: true },
        { key: 'revenue', label: 'Revenue', align: 'right', render: v => formatCurrency(v) },
        { key: 'contracts', label: 'Total Contracts', align: 'right' },
        { key: 'amcRenewal', label: 'AMC Renewal', align: 'right' },
        { key: 'warrantyConversion', label: 'Warranty Conv.', align: 'right' },
        { key: 'lostAmcConversion', label: 'Lost AMC Conv.', align: 'right' },
        { key: 'lostWarrantyConversion', label: 'Lost Warranty Conv.', align: 'right' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl font-semibold" style={{ color: COLORS.text.secondary }}>
                    Loading branch data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
                    <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Branch</h3>
                    <p className="text-gray-600">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            ...(data?.branchInfo?.region ? [{ label: data.branchInfo.region, href: `/region/${data.branchInfo.region}` }] : []),
                            { label: data?.branchInfo?.branch_name || branchId }
                        ]}
                    />
                    <h1 className="text-3xl font-bold" style={{ color: COLORS.text.primary }}>
                        Branch Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {data?.branchInfo?.branch_name || branchId}
                        {data?.branchInfo?.branch_head_name && ` - Head: ${data.branchInfo.branch_head_name}`}
                    </p>
                </div>

                <FilterPanel
                    filters={localFilters}
                    setFilters={setLocalFilters}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <KPICard
                        title="Total Revenue"
                        value={formatCurrency(data.summary.totalRevenue)}
                        subtitle={`Avg: ${formatCurrency(data.summary.avgContractValue)}`}
                        icon={DollarSign}
                    />
                    <KPICard
                        title="Active Contracts"
                        value={data.summary.activeContracts?.toLocaleString() || '0'}
                        subtitle={`Total: ${data.summary.totalContracts.toLocaleString()}`}
                        icon={FileText}
                    />
                    <KPICard
                        title="Total Customers"
                        value={data.summary.totalCustomers.toLocaleString()}
                        icon={Users}
                    />
                    <KPICard
                        title="Total Opportunities"
                        value={data.summary.totalDeals.toLocaleString()}
                        subtitle={`Quotes: ${data.summary.totalQuotations.toLocaleString()}`}
                        icon={Target}
                    />
                </div>

                {chartData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Revenue by Deal Type - Stacked Bar */}
                        <StackedBarChart
                            data={chartData.revenueByDealTypeStacked}
                            title="Revenue by Deal Type"
                            stacks={[
                                { dataKey: 'amcRenewal', name: 'AMC Renewal', color: '#10b981' },
                                { dataKey: 'warrantyConversion', name: 'Warranty Conversion', color: '#3b82f6' },
                                { dataKey: 'lostAmcConversion', name: 'Lost AMC Conversion', color: '#f59e0b' },
                                { dataKey: 'lostWarrantyConversion', name: 'Lost Warranty Conversion', color: '#ef4444' },
                            ]}
                            yAxisFormatter={formatCurrencyCompact}
                            valueFormatter={formatCurrency}
                            height={400} // Increase from 300
                            xAxisLabel=""
                            yAxisLabel="Revenue"
                        />

                        {/* Contracts by Deal Type - Stacked Bar */}
                        <StackedBarChart
                            data={chartData.contractsByDealTypeStacked}
                            title="Contracts by Deal Type"
                            stacks={[
                                { dataKey: 'amcRenewal', name: 'AMC Renewal', color: '#10b981' },
                                { dataKey: 'warrantyConversion', name: 'Warranty Conversion', color: '#3b82f6' },
                                { dataKey: 'lostAmcConversion', name: 'Lost AMC Conversion', color: '#f59e0b' },
                                { dataKey: 'lostWarrantyConversion', name: 'Lost Warranty Conversion', color: '#ef4444' },
                            ]}
                            height={400} // Increase from 300
                            xAxisLabel=""
                            yAxisLabel="Contracts"
                        />

                        {/* Contract Timeline */}
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

                        {/* Revenue by Vertical */}
                        <DonutChart
                            data={chartData.revenueByVertical}
                            title="Revenue by Vertical"
                            valueFormatter={formatCurrency}
                        />

                        {/* Quotation Status */}
                        <PieChart
                            data={chartData.quotationStatus}
                            title="Quotation Status"
                        />

                        {/* Opportunity Status */}
                        <DonutChart
                            data={chartData.dealStatus}
                            title="Opportunity Status Distribution"
                        />
                    </div>
                )}

                {/* Branch Head Info Table */}
                {branchHeadInfo.length > 0 && (
                    <DataTable
                        title="Branch Head Overview"
                        columns={branchHeadColumns}
                        data={branchHeadInfo}
                        onRowClick={handleManagerClick}
                        actionButton={{
                            label: 'View Manager Details',
                            onClick: handleManagerClick
                        }}
                    />
                )}
            </div>
        </div>
    );
}