import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getBranchData, formatCurrency, formatHP } from '../utils/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export default function Branch() {
    const { branchId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [modalTitle, setModalTitle] = useState('');

    // Filters state
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        industry: '',
        vertical: '',
        dealType: '',
        status: '',
        amcStatus: '',
        dealOwner: '',
    });

    // Applied filters
    const [appliedFilters, setAppliedFilters] = useState({});

    useEffect(() => {
        fetchData();
    }, [branchId, appliedFilters]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Build Frappe filters
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

    const handleApplyFilters = () => {
        setAppliedFilters({ ...filters });
    };

    const handleResetFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            industry: '',
            vertical: '',
            dealType: '',
            status: '',
            amcStatus: '',
            dealOwner: '',
        });
        setAppliedFilters({});
    };

    const handleChartClick = (chartType, chartData) => {
        setModalTitle(chartType);
        setModalData(chartData);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalData(null);
        setModalTitle('');
    };

    // Calculate chart data
    const getRevenueByManager = () => {
        if (!data || !data.managers) return [];

        return data.managers.map(manager => ({
            name: manager.managerName,
            revenue: manager.revenue,
            contracts: manager.contracts,
            formattedRevenue: formatCurrency(manager.revenue)
        }));
    };

    const getDealsByOwner = () => {
        if (!data || !data.managers) return [];

        return data.managers.map(manager => ({
            name: manager.managerName,
            deals: manager.deals,
            quotations: manager.quotations
        }));
    };

    const getRevenueByVertical = () => {
        if (!data || !data.rawData) return [];

        const verticalMap = new Map();
        data.rawData.contracts.forEach(contract => {
            const vertical = contract.parent_vertical || 'Uncategorized';
            const current = verticalMap.get(vertical) || 0;
            verticalMap.set(vertical, current + parseFloat(contract.amount || 0));
        });

        return Array.from(verticalMap.entries()).map(([name, value]) => ({
            name,
            value,
            formattedValue: formatCurrency(value)
        }));
    };

    const getDealStatusDistribution = () => {
        if (!data || !data.rawData) return [];

        const statusMap = new Map();
        data.rawData.deals.forEach(deal => {
            const status = deal.status || 'Unknown';
            const current = statusMap.get(status) || 0;
            statusMap.set(status, current + 1);
        });

        return Array.from(statusMap.entries()).map(([name, value]) => ({
            name,
            value,
            percentage: data.summary.totalDeals > 0 ? ((value / data.summary.totalDeals) * 100).toFixed(1) : 0
        }));
    };

    const getAMCStatusDistribution = () => {
        if (!data || !data.rawData) return [];

        const amcMap = new Map();
        data.rawData.deals.forEach(deal => {
            const status = deal.warranty_amc_status || 'Unknown';
            const current = amcMap.get(status) || 0;
            amcMap.set(status, current + 1);
        });

        return Array.from(amcMap.entries()).map(([name, value]) => ({
            name,
            value,
            percentage: data.summary.totalDeals > 0 ? ((value / data.summary.totalDeals) * 100).toFixed(1) : 0
        }));
    };

    const getIndustryRevenue = () => {
        if (!data || !data.rawData) return [];

        const industryMap = new Map();
        data.rawData.contracts.forEach(contract => {
            const industry = contract.industry || 'Uncategorized';
            const current = industryMap.get(industry) || { count: 0, revenue: 0 };
            industryMap.set(industry, {
                count: current.count + 1,
                revenue: current.revenue + parseFloat(contract.amount || 0)
            });
        });

        return Array.from(industryMap.entries()).map(([name, data]) => ({
            name,
            count: data.count,
            revenue: data.revenue,
            formattedRevenue: formatCurrency(data.revenue)
        }));
    };

    const getDealTypeDistribution = () => {
        if (!data || !data.rawData) return [];

        const typeMap = new Map();
        data.rawData.deals.forEach(deal => {
            const type = deal.deal_type || 'Unknown';
            const current = typeMap.get(type) || 0;
            typeMap.set(type, current + 1);
        });

        return Array.from(typeMap.entries()).map(([name, value]) => ({
            name,
            value,
            percentage: data.summary.totalDeals > 0 ? ((value / data.summary.totalDeals) * 100).toFixed(1) : 0
        }));
    };

    const getQuotationStatus = () => {
        if (!data || !data.rawData) return [];

        const statusMap = new Map();
        data.rawData.quotations.forEach(quote => {
            const status = quote.status || 'Unknown';
            const current = statusMap.get(status) || 0;
            statusMap.set(status, current + 1);
        });

        return Array.from(statusMap.entries()).map(([name, value]) => ({
            name,
            value,
            percentage: data.summary.totalQuotations > 0 ? ((value / data.summary.totalQuotations) * 100).toFixed(1) : 0
        }));
    };

    const getContractTimeline = () => {
        if (!data || !data.rawData) return [];

        const monthMap = new Map();
        data.rawData.contracts.forEach(contract => {
            if (contract.date) {
                const month = contract.date.substring(0, 7); // YYYY-MM
                const current = monthMap.get(month) || { count: 0, revenue: 0 };
                monthMap.set(month, {
                    count: current.count + 1,
                    revenue: current.revenue + parseFloat(contract.amount || 0)
                });
            }
        });

        return Array.from(monthMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, data]) => ({
                month,
                count: data.count,
                revenue: data.revenue,
                formattedRevenue: formatCurrency(data.revenue)
            }));
    };

    const getCustomerTypeDistribution = () => {
        if (!data || !data.rawData) return [];

        const typeMap = new Map();
        data.rawData.organizations.forEach(org => {
            const type = org.customer_type || 'Unknown';
            const current = typeMap.get(type) || 0;
            typeMap.set(type, current + 1);
        });

        return Array.from(typeMap.entries()).map(([name, value]) => ({
            name,
            value,
            percentage: data.summary.totalCustomers > 0 ? ((value / data.summary.totalCustomers) * 100).toFixed(1) : 0
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading branch data...</div>
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
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="text-blue-600 hover:text-blue-800 mb-2"
                >
                    ← Back to Region
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Branch Dashboard</h1>
                <p className="text-gray-600 mt-1">Detailed view of {branchId}</p>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                        <select
                            value={filters.industry}
                            onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Industries</option>
                            {data && data.rawData && Array.from(new Set(data.rawData.organizations.map(o => o.industry).filter(Boolean))).map(ind => (
                                <option key={ind} value={ind}>{ind}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vertical</label>
                        <select
                            value={filters.vertical}
                            onChange={(e) => setFilters({ ...filters, vertical: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Verticals</option>
                            {data && data.rawData && Array.from(new Set(data.rawData.organizations.map(o => o.parent_vertical).filter(Boolean))).map(vert => (
                                <option key={vert} value={vert}>{vert}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deal Type</label>
                        <select
                            value={filters.dealType}
                            onChange={(e) => setFilters({ ...filters, dealType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            {data && data.rawData && Array.from(new Set(data.rawData.deals.map(d => d.deal_type).filter(Boolean))).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deal Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            {data && data.rawData && Array.from(new Set(data.rawData.deals.map(d => d.status).filter(Boolean))).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">AMC Status</label>
                        <select
                            value={filters.amcStatus}
                            onChange={(e) => setFilters({ ...filters, amcStatus: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All AMC Status</option>
                            {data && data.rawData && Array.from(new Set(data.rawData.deals.map(d => d.warranty_amc_status).filter(Boolean))).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deal Owner</label>
                        <select
                            value={filters.dealOwner}
                            onChange={(e) => setFilters({ ...filters, dealOwner: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Owners</option>
                            {data && data.rawData && Array.from(new Set(data.rawData.deals.map(d => d.owner).filter(Boolean))).map(owner => (
                                <option key={owner} value={owner}>{owner}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleApplyFilters}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        Apply Filters
                    </button>
                    <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.summary.totalRevenue)}</p>
                    <p className="text-sm text-gray-600 mt-1">Avg: {formatCurrency(data.summary.avgContractValue)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Total Contracts</h3>
                    <p className="text-3xl font-bold text-gray-900">{data.summary.totalContracts.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-1">Total HP: {formatHP(data.summary.totalHP)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Total Customers</h3>
                    <p className="text-3xl font-bold text-gray-900">{data.summary.totalCustomers.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-1">Organizations</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Active Deals</h3>
                    <p className="text-3xl font-bold text-gray-900">{data.summary.totalDeals.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-1">Quotes: {data.summary.totalQuotations.toLocaleString()}</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue by Manager Bar Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Revenue by Manager</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getRevenueByManager()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Bar
                                dataKey="revenue"
                                fill="#0088FE"
                                name="Revenue"
                                onClick={(entry) => handleChartClick('Revenue by Manager', getRevenueByManager())}
                                style={{ cursor: 'pointer' }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Deals by Owner Bar Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Deals & Quotations by Owner</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getDealsByOwner()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                                dataKey="deals"
                                fill="#00C49F"
                                name="Deals"
                                onClick={(entry) => handleChartClick('Deals by Owner', getDealsByOwner())}
                                style={{ cursor: 'pointer' }}
                            />
                            <Bar
                                dataKey="quotations"
                                fill="#FFBB28"
                                name="Quotations"
                                onClick={(entry) => handleChartClick('Deals by Owner', getDealsByOwner())}
                                style={{ cursor: 'pointer' }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Contract Timeline */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Contract Timeline</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getContractTimeline()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip formatter={(value, name) => name === 'revenue' ? formatCurrency(value) : value} />
                            <Legend />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="count"
                                stroke="#8884d8"
                                name="Count"
                                onClick={(entry) => handleChartClick('Contract Timeline', getContractTimeline())}
                                style={{ cursor: 'pointer' }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="revenue"
                                stroke="#82ca9d"
                                name="Revenue"
                                onClick={(entry) => handleChartClick('Contract Timeline', getContractTimeline())}
                                style={{ cursor: 'pointer' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Deal Status Distribution Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Deal Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={getDealStatusDistribution()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={(entry) => handleChartClick('Deal Status Distribution', getDealStatusDistribution())}
                                style={{ cursor: 'pointer' }}
                            >
                                {getDealStatusDistribution().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* AMC Status Distribution Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">AMC Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={getAMCStatusDistribution()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={(entry) => handleChartClick('AMC Status Distribution', getAMCStatusDistribution())}
                                style={{ cursor: 'pointer' }}
                            >
                                {getAMCStatusDistribution().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Deal Type Distribution Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Deal Type Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={getDealTypeDistribution()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={(entry) => handleChartClick('Deal Type Distribution', getDealTypeDistribution())}
                                style={{ cursor: 'pointer' }}
                            >
                                {getDealTypeDistribution().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue by Vertical Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Revenue by Vertical</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={getRevenueByVertical()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={(entry) => handleChartClick('Revenue by Vertical', getRevenueByVertical())}
                                style={{ cursor: 'pointer' }}
                            >
                                {getRevenueByVertical().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Customer Type Distribution */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Customer Type Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={getCustomerTypeDistribution()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={(entry) => handleChartClick('Customer Type Distribution', getCustomerTypeDistribution())}
                                style={{ cursor: 'pointer' }}
                            >
                                {getCustomerTypeDistribution().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Quotation Status Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Quotation Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={getQuotationStatus()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={(entry) => handleChartClick('Quotation Status', getQuotationStatus())}
                                style={{ cursor: 'pointer' }}
                            >
                                {getQuotationStatus().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue by Industry */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Revenue by Industry</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getIndustryRevenue()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip formatter={(value, name) => name === 'revenue' ? formatCurrency(value) : value} />
                            <Legend />
                            <Bar
                                yAxisId="left"
                                dataKey="count"
                                fill="#FFBB28"
                                name="Count"
                                onClick={(entry) => handleChartClick('Revenue by Industry', getIndustryRevenue())}
                                style={{ cursor: 'pointer' }}
                            />
                            <Bar
                                yAxisId="right"
                                dataKey="revenue"
                                fill="#FF8042"
                                name="Revenue"
                                onClick={(entry) => handleChartClick('Revenue by Industry', getIndustryRevenue())}
                                style={{ cursor: 'pointer' }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Managers Table */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Managers/Owners Overview</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Contracts</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Deals</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quotations</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total HP</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.managers.map((manager, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{manager.managerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(manager.revenue)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{manager.contracts}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{manager.customers}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{manager.deals}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{manager.quotations}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatHP(manager.totalHP)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Chart Details */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">{modalTitle}</h2>
                            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                        {modalData && modalData[0] && modalData[0].percentage && (
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                                        )}
                                        {modalData && modalData[0] && modalData[0].contracts && (
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Contracts</th>
                                        )}
                                        {modalData && modalData[0] && modalData[0].deals && (
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Deals</th>
                                        )}
                                        {modalData && modalData[0] && modalData[0].quotations && (
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quotations</th>
                                        )}
                                        {modalData && modalData[0] && modalData[0].count && (
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                                        )}
                                        {modalData && modalData[0] && (modalData[0].revenue || modalData[0].formattedRevenue) && (
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {modalData && modalData.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name || item.month}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                {item.formattedValue || item.value}
                                            </td>
                                            {item.percentage && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.percentage}%</td>
                                            )}
                                            {item.contracts && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.contracts}</td>
                                            )}
                                            {item.deals && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.deals}</td>
                                            )}
                                            {item.quotations && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.quotations}</td>
                                            )}
                                            {item.count && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.count}</td>
                                            )}
                                            {item.formattedRevenue && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.formattedRevenue}</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}