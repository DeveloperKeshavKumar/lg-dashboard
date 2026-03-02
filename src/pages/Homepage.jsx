import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, FileText, Users, Target,
    TrendingUp, TrendingDown, ArrowUpDown
} from 'lucide-react';
import { getCountryData, formatCurrency, formatHP } from '../utils/api';
import { COLORS } from '../constants/theme';
import KPICard from '../components/common/KPICard';
import FilterPanel from '../components/common/FilterPanel';
import DonutChart from '../components/charts/DonutChart';
import RoundedBarChart from '../components/charts/RoundedBarChart';
import SmoothLineChart from '../components/charts/SmoothLineChart';
import PieChart from '../components/charts/PieChart';
import AreaChart from '../components/charts/AreaChart';
import DetailModal from '../components/common/DetailModal';
import DataTable from '../components/common/DataTable';
import { generateModalData, getUniqueValues } from '../utils/dataHelpers';

export default function Homepage() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [modalTitle, setModalTitle] = useState('');

    const [filters, setFilters] = useState({});
    const [appliedFilters, setAppliedFilters] = useState({});

    // Table sorting
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    useEffect(() => {
        fetchData();
    }, [appliedFilters]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const frappeFilters = {};
            if (appliedFilters.startDate && appliedFilters.endDate) {
                frappeFilters.date = ['between', [appliedFilters.startDate, appliedFilters.endDate]];
            }
            const result = await getCountryData(frappeFilters);
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setAppliedFilters({ ...filters });
    };

    const handleResetFilters = () => {
        setFilters({});
        setAppliedFilters({});
    };

    const handleChartClick = (chartType, segment) => {
        const { data: detailedData, title } = generateModalData(chartType, segment, data.rawData);
        setModalTitle(title);
        setModalData(detailedData);
        setShowModal(true);
    };

    const handleRegionClick = (regionId) => {
        navigate(`/region/${regionId}`);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter data based on applied filters
    const filteredData = useMemo(() => {
        if (!data || !data.rawData) return null;

        let filtered = {
            contracts: [...data.rawData.contracts],
            deals: [...data.rawData.deals],
            organizations: [...data.rawData.organizations],
            quotations: [...data.rawData.quotations]
        };

        // Apply filters
        if (appliedFilters.industry) {
            filtered.contracts = filtered.contracts.filter(c => c.industry === appliedFilters.industry);
            filtered.organizations = filtered.organizations.filter(o => o.industry === appliedFilters.industry);
        }
        if (appliedFilters.vertical) {
            filtered.contracts = filtered.contracts.filter(c => c.parent_vertical === appliedFilters.vertical);
            filtered.organizations = filtered.organizations.filter(o => o.parent_vertical === appliedFilters.vertical);
        }
        if (appliedFilters.dealType) {
            filtered.deals = filtered.deals.filter(d => d.deal_type === appliedFilters.dealType);
            filtered.contracts = filtered.contracts.filter(c => c.deal_type === appliedFilters.dealType);
        }
        if (appliedFilters.status) {
            filtered.deals = filtered.deals.filter(d => d.status === appliedFilters.status);
        }

        return filtered;
    }, [data, appliedFilters]);

    // Chart calculations with filtered data
    const getRevenueByVertical = () => {
        if (!filteredData) return [];
        const map = new Map();
        filteredData.contracts.forEach(c => {
            const v = c.parent_vertical || 'Uncategorized';
            map.set(v, (map.get(v) || 0) + parseFloat(c.amount || 0));
        });
        return Array.from(map, ([name, value]) => ({ name, value }));
    };

    const getDealStatus = () => {
        if (!filteredData) return [];
        const map = new Map();
        filteredData.deals.forEach(d => {
            const s = d.status || 'Unknown';
            map.set(s, (map.get(s) || 0) + 1);
        });
        return Array.from(map, ([name, value]) => ({ name, value }));
    };

    const getCustomersByIndustry = () => {
        if (!filteredData) return [];
        const map = new Map();
        filteredData.organizations.forEach(o => {
            const i = o.industry || 'Uncategorized';
            map.set(i, (map.get(i) || 0) + 1);
        });
        return Array.from(map, ([name, value]) => ({ name, value }));
    };

    const getContractTimeline = () => {
        if (!filteredData) return [];
        const map = new Map();
        filteredData.contracts.forEach(c => {
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

    const getRevenueByRegion = () => {
        if (!filteredData) return [];
        const map = new Map();
        filteredData.contracts.forEach(c => {
            if (c.region) {
                map.set(c.region, (map.get(c.region) || 0) + parseFloat(c.amount || 0));
            }
        });
        return data.regions.map(r => ({
            name: r.regionName,
            revenue: map.get(r.regionId) || 0,
            regionId: r.regionId
        }));
    };

    const getContractsByRegion = () => {
        if (!filteredData) return [];
        const map = new Map();
        filteredData.contracts.forEach(c => {
            if (c.region) {
                map.set(c.region, (map.get(c.region) || 0) + 1);
            }
        });
        return data.regions.map(r => ({
            name: r.regionName,
            contracts: map.get(r.regionId) || 0,
            regionId: r.regionId
        }));
    };

    // Filtered summary
    const filteredSummary = useMemo(() => {
        if (!filteredData) return { totalRevenue: 0, totalContracts: 0, totalCustomers: 0, totalDeals: 0 };
        return {
            totalRevenue: filteredData.contracts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
            totalContracts: filteredData.contracts.length,
            totalCustomers: filteredData.organizations.length,
            totalDeals: filteredData.deals.length,
            avgContractValue: filteredData.contracts.length > 0
                ? filteredData.contracts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) / filteredData.contracts.length
                : 0
        };
    }, [filteredData]);

    // Sorted regions
    const sortedRegions = useMemo(() => {
        if (!data) return [];
        let sorted = [...data.regions];
        if (sortConfig.key) {
            sorted.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [data, sortConfig]);

    const regionColumns = [
        { key: 'regionName', label: 'Region', bold: true },
        { key: 'regionHead', label: 'Head' },
        {
            key: 'revenue',
            label: 'Revenue',
            align: 'right',
            render: (v) => formatCurrency(v)
        },
        {
            key: 'contracts',
            label: 'Contracts',
            align: 'right'
        },
        {
            key: 'customers',
            label: 'Customers',
            align: 'right'
        },
        {
            key: 'deals',
            label: 'Opportunities',
            align: 'right'
        },
        {
            key: 'totalHP',
            label: 'Total HP',
            align: 'right',
            render: (v) => formatHP(v)
        }
    ];

    if (loading) {
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
                <div className="text-xl text-red-600">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold" style={{ color: COLORS.text.primary }}>
                        All India Dashboard
                    </h1>
                    <p className="text-gray-600 mt-1">National overview of all regions</p>
                </div>

                {/* Filters */}
                <FilterPanel
                    filters={filters}
                    setFilters={setFilters}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                    availableOptions={{
                        industries: data ? getUniqueValues(data.rawData.organizations, 'industry') : [],
                        verticals: data ? getUniqueValues(data.rawData.organizations, 'parent_vertical') : [],
                        dealTypes: data ? getUniqueValues(data.rawData.deals, 'deal_type') : [],
                        statuses: data ? getUniqueValues(data.rawData.deals, 'status') : [],
                    }}
                />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <KPICard
                        title="Total Revenue"
                        value={formatCurrency(filteredSummary.totalRevenue)}
                        subtitle={`Avg: ${formatCurrency(filteredSummary.avgContractValue)}`}
                        icon={DollarSign}
                    />
                    <KPICard
                        title="Total Contracts"
                        value={filteredSummary.totalContracts.toLocaleString()}
                        subtitle={`All: ${data.summary.totalContracts.toLocaleString()}`}
                        icon={FileText}
                    />
                    <KPICard
                        title="Total Customers"
                        value={filteredSummary.totalCustomers.toLocaleString()}
                        subtitle={`All: ${data.summary.totalCustomers.toLocaleString()}`}
                        icon={Users}
                    />
                    <KPICard
                        title="Active Opportunities"
                        value={filteredSummary.totalDeals.toLocaleString()}
                        subtitle={`All: ${data.summary.totalDeals.toLocaleString()}`}
                        icon={Target}
                    />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Revenue by Region */}
                    <RoundedBarChart
                        data={getRevenueByRegion()}
                        title="Revenue by Region"
                        bars={[{ dataKey: 'revenue', name: 'Revenue', color: COLORS.primary }]}
                        onBarClick={(entry) => handleRegionClick(entry.regionId)}
                        valueFormatter={formatCurrency}
                    />

                    {/* Contracts by Region */}
                    <RoundedBarChart
                        data={getContractsByRegion()}
                        title="Contracts by Region"
                        bars={[{ dataKey: 'contracts', name: 'Contracts', color: COLORS.solutek.blue }]}
                        onBarClick={(entry) => handleRegionClick(entry.regionId)}
                    />

                    {/* Contract Timeline */}
                    <SmoothLineChart
                        data={getContractTimeline()}
                        title="Contract Timeline"
                        lines={[
                            { dataKey: 'count', name: 'Count', color: COLORS.chart[0] },
                            { dataKey: 'revenue', name: 'Revenue', color: COLORS.chart[1], yAxisId: 'right' }
                        ]}
                        valueFormatter={(v, n) => n === 'revenue' ? formatCurrency(v) : v}
                    />

                    {/* Revenue by Vertical */}
                    <PieChart
                        data={getRevenueByVertical()}
                        title="Revenue by Vertical"
                        onSegmentClick={(seg) => handleChartClick('Revenue by Vertical', seg)}
                        valueFormatter={formatCurrency}
                    />

                    {/* Opportunity Status */}
                    <DonutChart
                        data={getDealStatus()}
                        title="Opportunity Status Distribution"
                        onSegmentClick={(seg) => handleChartClick('Opportunity Status Distribution', seg)}
                    />

                    {/* Customers by Industry */}
                    <PieChart
                        data={getCustomersByIndustry()}
                        title="Customers by Industry"
                        onSegmentClick={(seg) => handleChartClick('Customers by Industry', seg)}
                    />
                </div>

                {/* Regions Table */}
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

                {/* Modal */}
                <DetailModal
                    show={showModal}
                    title={modalTitle}
                    data={modalData}
                    onClose={() => setShowModal(false)}
                />
            </div>
        </div>
    );
}