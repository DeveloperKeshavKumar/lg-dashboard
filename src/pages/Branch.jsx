import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Package, Activity, ChevronRight, User, ArrowLeft } from 'lucide-react';
import { getBranchData } from '../utils/api';

const COLORS = ['#0366d6', '#6f42c1', '#28a745', '#fd7e14', '#dc3545'];

const MetricCard = ({ title, value, change, icon: Icon, trend }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white">
                <Icon size={24} />
            </div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</span>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-2 font-mono">{value}</div>
        <div className={`flex items-center gap-2 text-sm font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{change}</span>
        </div>
    </div>
);

const ManagerCard = ({ manager, rank }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-4 mb-4">
            <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {manager.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-gray-900">
                    #{rank}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-900">{manager.name}</h3>
                <p className="text-sm text-gray-500">Area Manager</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Revenue</p>
                <p className="text-lg font-bold text-blue-900 font-mono">₹{(manager.revenue / 100000).toFixed(1)}L</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Contracts</p>
                <p className="text-lg font-bold text-purple-900 font-mono">{manager.contracts.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Customers</p>
                <p className="text-lg font-bold text-green-900 font-mono">{manager.customers.toLocaleString()}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Growth</p>
                <p className="text-lg font-bold text-orange-900 font-mono">{manager.growth.toFixed(1)}%</p>
            </div>
        </div>
    </div>
);

export default function Branch() {
    const { branchId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const branchName = location.state?.branchName || 'Branch';
    const regionName = location.state?.regionName || 'Region';

    useEffect(() => {
        loadData();
    }, [branchId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const branchData = await getBranchData(branchId, branchName);
            setData(branchData);
        } catch (error) {
            console.error('Error loading branch data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-gray-700">Loading branch data...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const metrics = data.metrics;
    const managers = data.children;

    // Sort managers by revenue for ranking
    const rankedManagers = [...managers].sort((a, b) => b.revenue - a.revenue);

    // Prepare chart data
    const revenueChartData = managers.map(m => ({
        name: m.name.split(' ')[0],
        revenue: m.revenue / 100000
    }));

    const pieChartData = managers.map((m, idx) => ({
        name: m.name.split(' ')[0],
        value: m.revenue,
        color: COLORS[idx % COLORS.length]
    }));

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
                    <Link to="/" className="text-blue-600 hover:underline font-medium">All India</Link>
                    <ChevronRight size={16} className="text-gray-400" />
                    <Link to={`/region/${location.state?.branchData?.id || 'region'}`} className="text-blue-600 hover:underline font-medium">
                        {regionName}
                    </Link>
                    <ChevronRight size={16} className="text-gray-400" />
                    <span className="text-gray-900 font-semibold">{branchName}</span>
                </div>

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">{branchName}</h1>
                        <p className="text-gray-600">Branch performance and area manager analytics</p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span>Back</span>
                    </button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Total Revenue"
                        value={`₹${(metrics.totalRevenue / 10000000).toFixed(2)}Cr`}
                        change={`+${metrics.growth.toFixed(1)}%`}
                        icon={DollarSign}
                        trend="up"
                    />
                    <MetricCard
                        title="Total Contracts"
                        value={metrics.totalContracts.toLocaleString()}
                        change="+12.5%"
                        icon={Package}
                        trend="up"
                    />
                    <MetricCard
                        title="Total Customers"
                        value={metrics.totalCustomers.toLocaleString()}
                        change="+8.3%"
                        icon={Users}
                        trend="up"
                    />
                    <MetricCard
                        title="Area Managers"
                        value={managers.length}
                        change={`${managers.length} active`}
                        icon={Activity}
                        trend="up"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue by Area Manager</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e8" />
                                <XAxis dataKey="name" stroke="#6a737d" />
                                <YAxis stroke="#6a737d" />
                                <Tooltip
                                    contentStyle={{
                                        background: '#ffffff',
                                        border: '1px solid #e1e4e8',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="revenue" fill="#0366d6" name="Revenue (Lakhs)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                                    contentStyle={{
                                        background: '#ffffff',
                                        border: '1px solid #e1e4e8',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Area Managers Grid */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Area Managers Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rankedManagers.map((manager, index) => (
                            <ManagerCard
                                key={manager.id}
                                manager={manager}
                                rank={index + 1}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}