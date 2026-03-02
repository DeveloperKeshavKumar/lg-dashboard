import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Package, Activity, ChevronRight, MapPin, ArrowLeft } from 'lucide-react';
import { getRegionData } from '../utils/api';

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

const BranchCard = ({ branch, onClick }) => (
    <div
        onClick={() => onClick(branch)}
        className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-blue-500 transition-all duration-300 group"
    >
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <MapPin size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
            </div>
            <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Revenue</p>
                <p className="text-lg font-bold text-gray-900 font-mono">₹{(branch.revenue / 100000).toFixed(1)}L</p>
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contracts</p>
                <p className="text-lg font-bold text-gray-900 font-mono">{branch.contracts.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Customers</p>
                <p className="text-lg font-bold text-gray-900 font-mono">{branch.customers.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Growth</p>
                <p className="text-lg font-bold text-green-600 font-mono">{branch.growth.toFixed(1)}%</p>
            </div>
        </div>
    </div>
);

export default function Region() {
    const { regionId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const regionName = location.state?.regionName || 'Region';

    useEffect(() => {
        loadData();
    }, [regionId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const regionData = await getRegionData(regionId, regionName);
            setData(regionData);
        } catch (error) {
            console.error('Error loading region data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBranchClick = (branch) => {
        navigate(`/branch/${branch.id}`, {
            state: {
                branchName: branch.name,
                regionName: regionName,
                branchData: branch
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg font-semibold text-gray-700">Loading region data...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const metrics = data.metrics;
    const branches = data.children;

    // Prepare chart data
    const revenueChartData = branches.map(b => ({
        name: b.name.replace(' Branch', ''),
        revenue: b.revenue / 100000,
        contracts: b.contracts
    }));

    const growthChartData = branches.map(b => ({
        name: b.name.replace(' Branch', ''),
        growth: b.growth
    }));

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6 text-sm">
                    <Link to="/" className="text-blue-600 hover:underline font-medium">All India</Link>
                    <ChevronRight size={16} className="text-gray-400" />
                    <span className="text-gray-900 font-semibold">{regionName}</span>
                </div>

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">{regionName}</h1>
                        <p className="text-gray-600">Regional performance and branch analytics</p>
                    </div>
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span>Back to Dashboard</span>
                    </Link>
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
                        title="Avg Order Value"
                        value={`₹${Math.round(metrics.totalRevenue / metrics.totalContracts).toLocaleString()}`}
                        change="+5.1%"
                        icon={Activity}
                        trend="up"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue & Contracts by Branch</h3>
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
                                <Bar dataKey="contracts" fill="#6f42c1" name="Contracts" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Growth Trend by Branch</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={growthChartData}>
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
                                <Line
                                    type="monotone"
                                    dataKey="growth"
                                    stroke="#28a745"
                                    strokeWidth={3}
                                    name="Growth (%)"
                                    dot={{ fill: '#28a745', r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Branches Grid */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Branches</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {branches.map((branch) => (
                            <BranchCard
                                key={branch.id}
                                branch={branch}
                                onClick={handleBranchClick}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}