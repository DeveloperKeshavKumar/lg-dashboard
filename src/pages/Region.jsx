import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Users, Target, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { getRegionData, formatCurrency, formatHP } from '../utils/api';
import { COLORS } from '../constants/theme';
import KPICard from '../components/common/KPICard';
import FilterPanel from '../components/common/FilterPanel';
import DonutChart from '../components/charts/DonutChart';
import RoundedBarChart from '../components/charts/RoundedBarChart';
import SmoothLineChart from '../components/charts/SmoothLineChart';
import PieChart from '../components/charts/PieChart';
import AreaChart from '../components/charts/AreaChart';
import Breadcrumb from '../components/common/BreadCrumb';
import DetailModal from '../components/common/DetailModal';
import DataTable from '../components/common/DataTable';
import { generateModalData, getUniqueValues } from '../utils/dataHelpers';

export default function Region() {
    const { regionId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [modalTitle, setModalTitle] = useState('');

    const [filters, setFilters] = useState({});
    const [appliedFilters, setAppliedFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    useEffect(() => {
        fetchData();
    }, [regionId, appliedFilters]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const frappeFilters = {};
            if (appliedFilters.startDate && appliedFilters.endDate) {
                frappeFilters.date = ['between', [appliedFilters.startDate, appliedFilters.endDate]];
            }
            const result = await getRegionData(regionId, frappeFilters);
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChartClick = (chartType, segment) => {
        const { data: detailedData, title } = generateModalData(chartType, segment, data.rawData);
        setModalTitle(title);
        setModalData(detailedData);
        setShowModal(true);
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

    // Filtered data
    const filteredData = useMemo(() => {
        if (!data?.rawData) return null;
        let filtered = {
            contracts: [...data.rawData.contracts],
            deals: [...data.rawData.deals],
            organizations: [...data.rawData.organizations],
            quotations: [...data.rawData.quotations]
        };

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
        if (appliedFilters.amcStatus) {
            filtered.deals = filtered.deals.filter(d => d.warranty_amc_status === appliedFilters.amcStatus);
        }

        return filtered;
    }, [data, appliedFilters]);

    // Chart calculations
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

    const getAMCStatus = () => {
        if (!filteredData) return [];
        const map = new Map();
        filteredData.contracts.forEach(d => {
            const s = d.deal_type || 'Unknown';
            map.set(s, (map.get(s) || 0) + 1);
        });
        return Array.from(map, ([name, value]) => ({ name, value }));
    };

    const getQuotationStatus = () => {
        if (!filteredData) return [];
        const map = new Map();
        filteredData.quotations.forEach(q => {
            const s = q.status || 'Unknown';
            map.set(s, (map.get(s) || 0) + 1);
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
            .map(([name, d]) => ({ name, count: d.count, revenue: d.revenue, month: name }));
    };

    const getRevenueByBranch = () => {
        if (!filteredData) return [];
        const map = new Map();
        filteredData.contracts.forEach(c => {
            if (c.branch) map.set(c.branch, (map.get(c.branch) || 0) + parseFloat(c.amount || 0));
        });
        return data.branches.map(b => ({
            name: b.branchName,
            revenue: map.get(b.branchId) || 0,
            branchId: b.branchId
        }));
    };

    const getContractsByBranch = () => {
        if (!filteredData) return [];
        const map = new Map();
        filteredData.contracts.forEach(c => {
            if (c.branch) map.set(c.branch, (map.get(c.branch) || 0) + 1);
        });
        return data.branches.map(b => ({
            name: b.branchName,
            contracts: map.get(b.branchId) || 0,
            branchId: b.branchId
        }));
    };

    const filteredSummary = useMemo(() => {
        if (!filteredData) return { totalRevenue: 0, totalContracts: 0, totalCustomers: 0, totalDeals: 0 };
        return {
            totalRevenue: filteredData.contracts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0),
            totalContracts: filteredData.contracts.length,
            totalCustomers: filteredData.organizations.length,
            totalDeals: filteredData.deals.length,
            totalQuotations: filteredData.quotations.length,
            avgContractValue: filteredData.contracts.length > 0
                ? filteredData.contracts.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) / filteredData.contracts.length
                : 0
        };
    }, [filteredData]);

    const sortedBranches = useMemo(() => {
        if (!data || !filteredData) return [];

        const branchMap = new Map();

        // Initialize only structure (no prefilled numbers)
        data.branches.forEach(b => {
            branchMap.set(b.branchId, {
                branchId: b.branchId,
                branchName: b.branchName,
                branchHead: b.branchHead,
                revenue: 0,
                contracts: 0,
                customers: 0,
                deals: 0,
                totalHP: 0,
                nullType: 0,
                amcRenewal: 0,
                warrantyConversion: 0,
                lostAmcConversion: 0,
                lostWarrantyConversion: 0
            });
        });

        // STRICT aggregation from FILTERED contracts only
        filteredData.contracts.forEach(contract => {
            if (!contract.branch || !branchMap.has(contract.branch)) return;

            const branch = branchMap.get(contract.branch);

            branch.revenue += parseFloat(contract.amount || 0);
            branch.contracts += 1;
            branch.totalHP += parseFloat(contract.total_hp || 0);

            const type = (contract.deal_type || "").trim().toLowerCase();
            if (!type) branch.nullType++;
            if (type === "amc renewal") branch.amcRenewal++;
            else if (type === "warranty conversion" || type === "warranty amc conversion") branch.warrantyConversion++;
            else if (type === "lost amc conversion") branch.lostAmcConversion++;
            else if (type === "lost warranty conversion") branch.lostWarrantyConversion++;
        });

        // Aggregate deals (filtered)
        filteredData.deals.forEach(deal => {
            if (deal.branch && branchMap.has(deal.branch)) {
                branchMap.get(deal.branch).deals++;
            }
        });

        // Aggregate customers (filtered)
        filteredData.organizations.forEach(org => {
            if (org.branch && branchMap.has(org.branch)) {
                branchMap.get(org.branch).customers++;
            }
        });

        let result = Array.from(branchMap.values());

        if (sortConfig.key) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key])
                    return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key])
                    return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, filteredData, sortConfig]);

    const branchColumns = [
        { key: 'branchName', label: 'Branch', bold: true },
        { key: 'branchHead', label: 'Head' },
        { key: 'revenue', label: 'Revenue', align: 'right', render: v => formatCurrency(v) },
        { key: 'contracts', label: 'Total Contracts', align: 'right' },

        { key: 'amcRenewal', label: 'AMC Renewal', align: 'right' },
        { key: 'warrantyConversion', label: 'Warranty Conversion', align: 'right' },
        { key: 'lostAmcConversion', label: 'Lost AMC Conversion', align: 'right' },
        { key: 'lostWarrantyConversion', label: 'Lost Warranty Conversion', align: 'right' },
        { key: 'nullType', label: 'No Type', align: 'right' },

        // { key: 'customers', label: 'Customers', align: 'right' },
        // { key: 'deals', label: 'Opportunities', align: 'right' },
        // { key: 'totalHP', label: 'HP', align: 'right', render: v => formatHP(v) }
    ];

    if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-xl">Loading...</div></div>;
    if (error) return <div className="flex items-center justify-center h-screen"><div className="text-xl text-red-600">Error: {error}</div></div>;

    return (
        <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            { label: 'Region', href: -1 },
                            { label: regionId }
                        ]}
                    />
                    <h1 className="text-3xl font-bold" style={{ color: COLORS.text.primary }}>Region Dashboard</h1>
                    <p className="text-gray-600 mt-1">Detailed view of {regionId}</p>
                </div>

                <FilterPanel
                    filters={filters}
                    setFilters={setFilters}
                    onApply={() => setAppliedFilters({ ...filters })}
                    onReset={() => { setFilters({}); setAppliedFilters({}); }}
                    availableOptions={{
                        industries: data ? getUniqueValues(data.rawData.organizations, 'industry') : [],
                        verticals: data ? getUniqueValues(data.rawData.organizations, 'parent_vertical') : [],
                        dealTypes: data ? getUniqueValues(data.rawData.deals, 'deal_type') : [],
                        statuses: data ? getUniqueValues(data.rawData.deals, 'status') : [],
                        amcStatuses: data ? getUniqueValues(data.rawData.deals, 'warranty_amc_status') : [],
                    }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <KPICard title="Total Revenue" value={formatCurrency(filteredSummary.totalRevenue)} subtitle={`Avg: ${formatCurrency(filteredSummary.avgContractValue)}`} icon={DollarSign} />
                    <KPICard title="Total Contracts" value={filteredSummary.totalContracts.toLocaleString()} subtitle={`All: ${data.summary.totalContracts.toLocaleString()}`} icon={FileText} />
                    <KPICard title="Total Customers" value={filteredSummary.totalCustomers.toLocaleString()} subtitle={`All: ${data.summary.totalCustomers.toLocaleString()}`} icon={Users} />
                    <KPICard title="Active Opportunities" value={filteredSummary.totalDeals.toLocaleString()} subtitle={`Quotes: ${filteredSummary.totalQuotations.toLocaleString()}`} icon={Target} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                    {/* Revenue by Branch — Bar */}
                    <RoundedBarChart
                        data={getRevenueByBranch()}
                        title="Revenue by Branch"
                        bars={[{ dataKey: 'revenue', name: 'Revenue', color: COLORS.primary }]}
                        onBarClick={(e) => handleBranchClick(e.branchId)}
                        valueFormatter={formatCurrency}
                    />

                    {/* Contracts by Branch — Bar */}
                    <RoundedBarChart
                        data={getContractsByBranch()}
                        title="Contracts by Branch"
                        bars={[{ dataKey: 'contracts', name: 'Contracts', color: COLORS.solutek.blue }]}
                        onBarClick={(e) => handleBranchClick(e.branchId)}
                    />

                    {/* Contract Timeline — Area (better for time series) */}
                    <AreaChart
                        data={getContractTimeline()}
                        title="Contract Timeline"
                        areas={[
                            { dataKey: 'count', name: 'Count', color: COLORS.chart[0] },
                            { dataKey: 'revenue', name: 'Revenue', color: COLORS.chart[1] }
                        ]}
                    />

                    {/* Opportunity Status — Donut (status segmentation) */}
                    {/* <DonutChart
                        data={getDealStatus()}
                        title="Opportunity Status Distribution"
                        onSegmentClick={(s) =>
                            handleChartClick('Opportunity Status Distribution', s)
                        }
                    /> */}

                    {/* AMC Status — Pie */}
                    <PieChart
                        data={getAMCStatus()}
                        title="AMC Status Distribution"
                        onSegmentClick={(s) =>
                            handleChartClick('AMC Status Distribution', s)
                        }
                    />

                    {/* Quotation Status — Pie */}
                    <PieChart
                        data={getQuotationStatus()}
                        title="Quotation Status"
                        onSegmentClick={(s) =>
                            handleChartClick('Quotation Status', s)
                        }
                    />

                    {/* Revenue by Vertical — Donut (good for revenue composition) */}
                    <DonutChart
                        data={getRevenueByVertical()}
                        title="Revenue by Vertical"
                        onSegmentClick={(s) =>
                            handleChartClick('Revenue by Vertical', s)
                        }
                        valueFormatter={formatCurrency}
                    />

                </div>

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

                <DetailModal show={showModal} title={modalTitle} data={modalData} onClose={() => setShowModal(false)} />
            </div>
        </div>
    );
}