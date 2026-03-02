import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getCountryData, formatCurrency, formatHP } from '../utils/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export default function Homepage() {
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
    });

    // Applied filters (used for actual data fetching)
    const [appliedFilters, setAppliedFilters] = useState({});

    useEffect(() => {
        fetchData();
    }, [appliedFilters]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Build Frappe filters based on applied filters
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
        setFilters({
            startDate: '',
            endDate: '',
            industry: '',
            vertical: '',
            dealType: '',
            status: '',
        });
        setAppliedFilters({});
    };

    const handleRegionClick = (regionId) => {
        navigate(`/region/${regionId}`);
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

    const getContractTypeBreakdown = () => {
        if (!data || !data.rawData) return [];

        const typeMap = new Map();
        data.rawData.contracts.forEach(contract => {
            const type = contract.deal_type || 'Standard';
            const current = typeMap.get(type) || { count: 0, revenue: 0 };
            typeMap.set(type, {
                count: current.count + 1,
                revenue: current.revenue + parseFloat(contract.amount || 0)
            });
        });

        return Array.from(typeMap.entries()).map(([name, data]) => ({
            name,
            count: data.count,
            revenue: data.revenue,
            formattedRevenue: formatCurrency(data.revenue)
        }));
    };

    const getIndustryDistribution = () => {
        if (!data || !data.rawData) return [];

        const industryMap = new Map();
        data.rawData.organizations.forEach(org => {
            const industry = org.industry || 'Uncategorized';
            const current = industryMap.get(industry) || 0;
            industryMap.set(industry, current + 1);
        });

        return Array.from(industryMap.entries()).map(([name, value]) => ({
            name,
            value,
            percentage: data.summary.totalCustomers > 0 ? ((value / data.summary.totalCustomers) * 100).toFixed(1) : 0
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading dashboard...</div>
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
                <h1 className="text-3xl font-bold text-gray-800">All India Dashboard</h1>
                <p className="text-gray-600 mt-1">National overview of all regions</p>
            </div>

            {/* Filters Section */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
                {/* Revenue by Region Bar Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Revenue by Region</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.regions}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="regionName" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Bar
                                dataKey="revenue"
                                fill="#0088FE"
                                name="Revenue"
                                onClick={(entry) => handleRegionClick(entry.regionId)}
                                style={{ cursor: 'pointer' }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Contracts by Region Bar Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Contracts by Region</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.regions}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="regionName" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar
                                dataKey="contracts"
                                fill="#00C49F"
                                name="Contracts"
                                onClick={(entry) => handleRegionClick(entry.regionId)}
                                style={{ cursor: 'pointer' }}
                            />
                        </BarChart>
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

                {/* Contract Type Breakdown */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Contract Type Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getContractTypeBreakdown()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip formatter={(value, name) => name === 'revenue' ? formatCurrency(value) : value} />
                            <Legend />
                            <Bar
                                yAxisId="left"
                                dataKey="count"
                                fill="#FFBB28"
                                name="Count"
                                onClick={(entry) => handleChartClick('Contract Type Breakdown', getContractTypeBreakdown())}
                                style={{ cursor: 'pointer' }}
                            />
                            <Bar
                                yAxisId="right"
                                dataKey="revenue"
                                fill="#FF8042"
                                name="Revenue"
                                onClick={(entry) => handleChartClick('Contract Type Breakdown', getContractTypeBreakdown())}
                                style={{ cursor: 'pointer' }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Industry Distribution Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Customers by Industry</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={getIndustryDistribution()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }) => `${name}: ${percentage}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                onClick={(entry) => handleChartClick('Customers by Industry', getIndustryDistribution())}
                                style={{ cursor: 'pointer' }}
                            >
                                {getIndustryDistribution().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Regions Table */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Regions Overview</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Head</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Contracts</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Customers</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Deals</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total HP</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.regions.map((region) => (
                                <tr key={region.regionId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{region.regionName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.regionHead}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(region.revenue)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{region.contracts}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{region.customers}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{region.deals}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatHP(region.totalHP)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                        <button
                                            onClick={() => handleRegionClick(region.regionId)}
                                            className="text-blue-600 hover:text-blue-900 font-medium"
                                        >
                                            View Details →
                                        </button>
                                    </td>
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
                                        {modalData && modalData[0] && modalData[0].count && (
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                                        )}
                                        {modalData && modalData[0] && modalData[0].revenue && (
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {modalData && modalData.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                {item.formattedValue || item.value}
                                            </td>
                                            {item.percentage && (
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.percentage}%</td>
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