// src/pages/Homepage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Users, Target, ChevronDown, ChevronRight } from 'lucide-react';
import { useCountryData, formatCurrency } from '../hooks/useFrappeData';
import { useFilters } from '../contexts/FilterContext';
import { COLORS } from '../constants/theme';
import KPICard from '../components/common/KPICard';
import FilterPanel from '../components/common/FilterPanel';
import StackedBarChart, { formatCurrencyCompact, formatNumberCompact } from '../components/charts/StackedBarChart';
import SmoothLineChart from '../components/charts/SmoothLineChart';
import PieChart from '../components/charts/PieChart';
import DataTable from '../components/common/DataTable';
import Breadcrumb from '@/components/common/BreadCrumb';

export default function Homepage() {
    const navigate = useNavigate();
    const { globalFilters, updateFilters, resetFilters } = useFilters();

    const [localFilters, setLocalFilters] = useState(globalFilters);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    useEffect(() => {
        setLocalFilters(globalFilters);
    }, [globalFilters]);

    const { data, isLoading, error } = useCountryData(globalFilters);

    const handleApplyFilters = () => {
        updateFilters(localFilters);
    };

    const handleResetFilters = () => {
        setLocalFilters({});
        resetFilters();
    };

    const handleRegionClick = (regionId, dealType = null) => {
        if (dealType) {
            const newFilters = { ...globalFilters, dealType };
            updateFilters(newFilters);
        }
        navigate(`/region/${regionId}`);
    };

    const handleStackClick = (entry) => {
        const dealTypeMap = {
            'amcRenewal': 'AMC Renewal',
            'warrantyConversion': 'Warranty Conversion',
            'lostAmcConversion': 'Lost AMC Conversion',
            'lostWarrantyConversion': 'Lost Warranty Conversion'
        };

        const dealType = dealTypeMap[entry.stackKey];
        handleRegionClick(entry.regionId, dealType);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Chart data calculations
    // src/pages/Homepage.jsx - Update chartData useMemo

    const chartData = useMemo(() => {
        if (!data) return null;

        const { rawData } = data;

        // Only show parent regions and standalone regions in charts (not sub-regions)
        const chartRegions = data.regions.filter(r => r.isParent || !r.parentRegionId);

        const revenueByVertical = () => {
            const map = new Map();
            rawData.contracts.forEach(c => {
                const v = c.parent_vertical || 'Uncategorized';
                map.set(v, (map.get(v) || 0) + parseFloat(c.amount || 0));
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

        // Initialize chart data with all categories including Others
        const contractsByRegionStacked = chartRegions.map(r => ({
            name: r.regionName,
            regionId: r.regionId,
            amcRenewal: 0,
            warrantyConversion: 0,
            lostAmcConversion: 0,
            lostWarrantyConversion: 0,
            others: 0
        }));

        const revenueByRegionStacked = chartRegions.map(r => ({
            name: r.regionName,
            regionId: r.regionId,
            amcRenewal: 0,
            warrantyConversion: 0,
            lostAmcConversion: 0,
            lostWarrantyConversion: 0,
            others: 0
        }));

        const REGION_HIERARCHY = {
            'EAST': ['EAST-1', 'EAST-2'],
            'NORTH': ['NORTH-1', 'NORTH-2']
        };

        // Helper function to categorize deal type
        const categorizeDealType = (dealType) => {
            const type = (dealType || "").toLowerCase().trim();

            if (type === "amc renewal") return 'amcRenewal';
            if (type === "warranty conversion" || type === "warranty amc conversion") return 'warrantyConversion';
            if (type === "lost amc conversion") return 'lostAmcConversion';
            if (type === "lost warranty conversion") return 'lostWarrantyConversion';
            return 'others';
        };

        // Aggregate contracts for revenue chart
        rawData.contracts.forEach(contract => {
            const region = chartRegions.find(r => {
                if (r.isParent) {
                    return REGION_HIERARCHY[r.regionId]?.includes(contract.region);
                } else {
                    return r.regionId === contract.region;
                }
            });

            if (region) {
                const revenueRegion = revenueByRegionStacked.find(cr => cr.regionId === region.regionId);
                const contractRegion = contractsByRegionStacked.find(cr => cr.regionId === region.regionId);

                if (revenueRegion && contractRegion) {
                    const amount = parseFloat(contract.amount || 0);
                    const category = categorizeDealType(contract.deal_type);

                    // Add to revenue chart
                    revenueRegion[category] += amount;

                    // Add to contracts chart
                    contractRegion[category] += 1;
                }
            }
        });

        return {
            revenueByVertical: revenueByVertical(),
            contractTimeline: contractTimeline(),
            contractsByRegionStacked,
            revenueByRegionStacked
        };
    }, [data]);

    // Sorted regions
    const sortedRegions = useMemo(() => {
        if (!data) return [];

        let result = [...data.regions];

        if (sortConfig.key) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, sortConfig]);

    const regionColumns = [
        { key: "regionName", label: "Region", bold: true },
        { key: "regionHead", label: "Region Head" },
        { key: "revenue", label: "Revenue", align: "right", render: v => formatCurrency(v) },
        { key: "contracts", label: "Total Contracts", align: "right" },
        { key: "amcRenewal", label: "AMC Renewal", align: "right" },
        { key: "warrantyConversion", label: "Warranty Conversion", align: "right" },
        { key: "lostAmcConversion", label: "Lost AMC Conversion", align: "right" },
        { key: "lostWarrantyConversion", label: "Lost Warranty Conversion", align: "right" },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl font-semibold" style={{ color: COLORS.text.secondary }}>
                    Loading dashboard...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
                    <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Dashboard</h3>
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
                    <Breadcrumb items={[]} />
                    <h1 className="text-3xl font-bold" style={{ color: COLORS.text.primary }}>
                        All India Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">National overview of all regions</p>
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
                        value={data.summary.activeContracts.toLocaleString()}
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
                        <StackedBarChart
                            data={chartData.revenueByRegionStacked}
                            title="Revenue by Region"
                            stacks={[
                                { dataKey: 'amcRenewal', name: 'AMC Renewal', color: '#10b981' },
                                { dataKey: 'warrantyConversion', name: 'Warranty Conversion', color: '#3b82f6' },
                                { dataKey: 'lostAmcConversion', name: 'Lost AMC Conversion', color: '#f59e0b' },
                                { dataKey: 'lostWarrantyConversion', name: 'Lost Warranty Conversion', color: '#ef4444' },
                                // { dataKey: 'others', name: 'Others', color: '#9ca3af' }
                            ]}
                            onBarClick={handleStackClick}
                            yAxisFormatter={formatCurrencyCompact}
                            valueFormatter={formatCurrency}
                        />

                        <StackedBarChart
                            data={chartData.contractsByRegionStacked}
                            title="Contracts by Region"
                            stacks={[
                                { dataKey: 'amcRenewal', name: 'AMC Renewal', color: '#10b981' },
                                { dataKey: 'warrantyConversion', name: 'Warranty Conversion', color: '#3b82f6' },
                                { dataKey: 'lostAmcConversion', name: 'Lost AMC Conversion', color: '#f59e0b' },
                                { dataKey: 'lostWarrantyConversion', name: 'Lost Warranty Conversion', color: '#ef4444' },
                                // { dataKey: 'others', name: 'Others', color: '#9ca3af' }
                            ]}
                            onBarClick={handleStackClick}
                        />

                        <SmoothLineChart
                            data={chartData.contractTimeline}
                            title="Contract Timeline"
                            xAxisTitle="Month"
                            yAxisTitleLeft="Contracts"
                            yAxisTitleRight="Revenue"
                            yAxisFormatterLeft={formatNumberCompact}
                            yAxisFormatterRight={formatCurrencyCompact}
                            lines={[
                                { dataKey: 'count', name: 'Count', color: COLORS.chart?.[0] || '#8b5cf6' },
                                { dataKey: 'revenue', name: 'Revenue', color: COLORS.chart?.[1] || '#06b6d4', yAxisId: 'right' }
                            ]}
                            valueFormatter={(v, key) => key === 'revenue' ? formatCurrency(v) : v}
                        />

                        <PieChart
                            data={chartData.revenueByVertical}
                            title="Revenue by Vertical"
                            valueFormatter={formatCurrency}
                        />
                    </div>
                )}

                <DataTable
                    title="Regions Overview"
                    columns={regionColumns}
                    data={sortedRegions}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    onRowClick={(row) => handleRegionClick(row.regionId)}
                    actionButton={{
                        label: 'View Details',
                        onClick: (row) => handleRegionClick(row.regionId)
                    }}
                />
            </div>
        </div>
    );
}