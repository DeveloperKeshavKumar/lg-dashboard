import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Users, Target, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { getBranchData, formatCurrency, formatHP } from '../utils/api';
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

export default function Branch() {
    const { branchId } = useParams();
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
    }, [branchId, appliedFilters]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const frappeFilters = {};
            if (appliedFilters.startDate && appliedFilters.endDate) {
                frappeFilters.date = ['between', [appliedFilters.startDate, appliedFilters.endDate]];
            }
            const result = await getBranchData(branchId, frappeFilters);
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

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

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
        }
        if (appliedFilters.status) {
            filtered.deals = filtered.deals.filter(d => d.status === appliedFilters.status);
        }
        if (appliedFilters.amcStatus) {
            filtered.deals = filtered.deals.filter(d => d.warranty_amc_status === appliedFilters.amcStatus);
        }
        if (appliedFilters.owner) {
            filtered.deals = filtered.deals.filter(d => d.owner === appliedFilters.owner);
            filtered.contracts = filtered.contracts.filter(c => c.owner === appliedFilters.owner);
        }

        return filtered;
    }, [data, appliedFilters]);

    const getRevenueByManager = () => {
        if (!data?.managers) return [];
        return data.managers.map(m => ({ name: m.managerName, revenue: m.revenue, contracts: m.contracts }));
    };

    const getDealsByOwner = () => {
        if (!data?.managers) return [];
        return data.managers.map(m => ({ name: m.managerName, deals: m.deals, quotations: m.quotations }));
    };

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

    const sortedManagers = useMemo(() => {
        if (!data || !filteredData) return [];

        const managerMap = new Map();

        // Initialize managers from backend structure only
        data.managers.forEach(m => {
            managerMap.set(m.managerId, {
                managerId: m.managerId,
                managerName: m.managerName,
                revenue: 0,
                contracts: 0,
                customers: 0,
                deals: 0,
                quotations: 0,
                totalHP: 0,
                amcRenewal: 0,
                warrantyConversion: 0,
                lostAmcConversion: 0,
                lostWarrantyConversion: 0
            });
        });

        // Aggregate CONTRACTS (strict equality)
        filteredData.contracts.forEach(contract => {
            const owner = contract.owner;
            if (!owner || !managerMap.has(owner)) return;

            const manager = managerMap.get(owner);

            manager.revenue += parseFloat(contract.amount || 0);
            manager.contracts += 1;
            manager.totalHP += parseFloat(contract.total_hp || 0);

            const type = (contract.deal_type || "").trim().toLowerCase();

            if (type === "amc renewal") manager.amcRenewal++;
            else if (type === "warranty conversion" || type === "warranty amc conversion") manager.warrantyConversion++;
            else if (type === "lost amc conversion") manager.lostAmcConversion++;
            else if (type === "lost warranty conversion") manager.lostWarrantyConversion++;
        });

        // Aggregate DEALS
        filteredData.deals.forEach(deal => {
            const owner = deal.owner;
            if (owner && managerMap.has(owner)) {
                managerMap.get(owner).deals++;
            }
        });

        // Aggregate QUOTATIONS
        filteredData.quotations.forEach(q => {
            const owner = q.owner;
            if (owner && managerMap.has(owner)) {
                managerMap.get(owner).quotations++;
            }
        });

        // Aggregate CUSTOMERS
        filteredData.organizations.forEach(org => {
            const owner = org.owner;
            if (owner && managerMap.has(owner)) {
                managerMap.get(owner).customers++;
            }
        });

        const result = Array.from(managerMap.values());

        if (sortConfig.key) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key])
                    return sortConfig.direction === "asc" ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key])
                    return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        return result;

    }, [data, filteredData, sortConfig]);

    const managerColumns = [
        { key: 'managerName', label: 'Manager', bold: true },
        { key: 'revenue', label: 'Revenue', align: 'right', render: (v) => formatCurrency(v) },
        { key: 'contracts', label: 'Total Contracts', align: 'right' },
        { key: 'amcRenewal', label: 'AMC Renewal', align: 'right' },
        { key: 'warrantyConversion', label: 'Warranty Conversion', align: 'right' },
        { key: 'lostAmcConversion', label: 'Lost AMC Conversion', align: 'right' },
        { key: 'lostWarrantyConversion', label: 'Lost Warranty Conversion', align: 'right' },
    ];

    if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-xl">Loading...</div></div>;
    if (error) return <div className="flex items-center justify-center h-screen"><div className="text-xl text-red-600">Error: {error}</div></div>;

    return (
        <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <Breadcrumb
                        items={[
                            { label: 'Branch', href: -1 }, // if region route known, replace with actual path
                            { label: branchId }
                        ]}
                    />
                    <h1 className="text-3xl font-bold" style={{ color: COLORS.text.primary }}>Branch Dashboard</h1>
                    <p className="text-gray-600 mt-1">Detailed view of {branchId}</p>
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
                        owners: data ? getUniqueValues(data.rawData.deals, 'owner') : [],
                    }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <KPICard title="Total Revenue" value={formatCurrency(filteredSummary.totalRevenue)} subtitle={`Avg: ${formatCurrency(filteredSummary.avgContractValue)}`} icon={DollarSign} />
                    <KPICard title="Total Contracts" value={filteredSummary.totalContracts.toLocaleString()} subtitle={`All: ${data.summary.totalContracts.toLocaleString()}`} icon={FileText} />
                    <KPICard title="Total Customers" value={filteredSummary.totalCustomers.toLocaleString()} subtitle={`All: ${data.summary.totalCustomers.toLocaleString()}`} icon={Users} />
                    <KPICard title="Active Opportunities" value={filteredSummary.totalDeals.toLocaleString()} subtitle={`Quotes: ${filteredSummary.totalQuotations.toLocaleString()}`} icon={Target} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                    {/* Revenue by Manager — Bar (comparison) */}
                    <RoundedBarChart
                        data={getRevenueByManager()}
                        title="Revenue by Manager"
                        bars={[
                            { dataKey: 'revenue', name: 'Revenue', color: COLORS.primary }
                        ]}
                        valueFormatter={formatCurrency}
                    />

                    {/* Opportunities & Quotations — Stacked Bar (category comparison) */}
                    <RoundedBarChart
                        data={getDealsByOwner()}
                        title="Opportunities & Quotations by Owner"
                        bars={[
                            { dataKey: 'deals', name: 'Deals', color: COLORS.solutek.blue },
                            { dataKey: 'quotations', name: 'Quotations', color: COLORS.chart[3] }
                        ]}
                    />

                    {/* Contract Timeline — Area (time series best practice) */}
                    <AreaChart
                        data={getContractTimeline()}
                        title="Contract Timeline"
                        areas={[
                            { dataKey: 'count', name: 'Count', color: COLORS.chart[0] },
                            { dataKey: 'revenue', name: 'Revenue', color: COLORS.chart[1] }
                        ]}
                    />

                    {/* Opportunity Status — Donut (clear categorical distribution) */}
                    {/* <DonutChart
                        data={getDealStatus()}
                        title="Opportunity Status"
                        onSegmentClick={(s) =>
                            handleChartClick('Opportunity Status Distribution', s)
                        }
                    /> */}

                    {/* AMC Status — Pie */}
                    <PieChart
                        data={getAMCStatus()}
                        title="AMC Status"
                        onSegmentClick={(s) =>
                            handleChartClick('AMC Status Distribution', s)
                        }
                    />

                    {/* Revenue by Vertical — Donut (financial composition) */}
                    <DonutChart
                        data={getRevenueByVertical()}
                        title="Revenue by Vertical"
                        valueFormatter={formatCurrency}
                        onSegmentClick={(s) =>
                            handleChartClick('Revenue by Vertical', s)
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

                </div>

                <DataTable
                    title="Managers/Owners Overview"
                    columns={managerColumns}
                    data={sortedManagers}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                />

                <DetailModal show={showModal} title={modalTitle} data={modalData} onClose={() => setShowModal(false)} />
            </div>
        </div>
    );
}