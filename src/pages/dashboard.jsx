import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Area, AreaChart, RadialBarChart, RadialBar
} from 'recharts';
import {
    ArrowLeft, TrendingUp, TrendingDown, Users, DollarSign,
    Package, Activity, ChevronRight, MapPin, Filter, Calendar,
    FileText, Briefcase, TrendingDown as ArrowDown
} from 'lucide-react';

// ERPNext API Configuration
const ERPNEXT_CONFIG = {
    baseUrl: 'https://your-erpnext-instance.com',
    apiKey: 'YOUR_API_KEY',
    apiSecret: 'YOUR_API_SECRET'
};

// Fetch data from ERPNext with filters
const fetchERPNextData = async (doctype, filters = {}, fields = ['*']) => {
    const params = new URLSearchParams({
        fields: JSON.stringify(fields),
        filters: JSON.stringify(filters),
        limit_page_length: 9999
    });

    try {
        const response = await fetch(
            `${ERPNEXT_CONFIG.baseUrl}/api/resource/${doctype}?${params}`,
            {
                headers: {
                    'Authorization': `token ${ERPNEXT_CONFIG.apiKey}:${ERPNEXT_CONFIG.apiSecret}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('ERPNext API Error:', error);
        return [];
    }
};

// Colors for charts
const COLORS = {
    primary: ['#0366d6', '#6f42c1', '#28a745', '#fd7e14', '#dc3545', '#17a2b8'],
    gradient: ['#667eea', '#764ba2', '#f093fb', '#4facfe'],
    status: {
        active: '#28a745',
        pending: '#ffc107',
        expired: '#dc3545',
        won: '#0366d6',
        lost: '#6c757d'
    }
};

// Date Filter Component
const DateFilter = ({ startDate, endDate, onDateChange }) => (
    <div className="date-filter">
        <div className="filter-item">
            <label><Calendar size={16} /> Start Date</label>
            <input
                type="date"
                value={startDate}
                onChange={(e) => onDateChange('start', e.target.value)}
            />
        </div>
        <div className="filter-item">
            <label><Calendar size={16} /> End Date</label>
            <input
                type="date"
                value={endDate}
                onChange={(e) => onDateChange('end', e.target.value)}
            />
        </div>
    </div>
);

// Status Filter Component
const StatusFilter = ({ selectedStatus, onStatusChange, statuses }) => (
    <div className="status-filter">
        <label><Filter size={16} /> Filter by Status</label>
        <select value={selectedStatus} onChange={(e) => onStatusChange(e.target.value)}>
            <option value="all">All Statuses</option>
            {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
            ))}
        </select>
    </div>
);

// Enhanced Metric Card with Trend
const MetricCard = ({ title, value, change, icon: Icon, trend, subtitle }) => (
    <div className="metric-card">
        <div className="metric-header">
            <div className="metric-icon" style={{
                background: trend === 'up' ? '#d4edda' : trend === 'down' ? '#f8d7da' : '#d1ecf1',
                color: trend === 'up' ? '#28a745' : trend === 'down' ? '#dc3545' : '#0366d6'
            }}>
                <Icon size={24} />
            </div>
            <span className="metric-title">{title}</span>
        </div>
        <div className="metric-value">{value}</div>
        {subtitle && <div className="metric-subtitle">{subtitle}</div>}
        {change && (
            <div className={`metric-change ${trend}`}>
                {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{change}</span>
            </div>
        )}
    </div>
);

// Donut Chart Component
const DonutChart = ({ data, title, dataKey, nameKey }) => (
    <div className="chart-card">
        <h3 className="chart-title">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey={dataKey}
                    nameKey={nameKey}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e1e4e8',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    </div>
);

// Enhanced Drilldown Card
const DrilldownCard = ({ item, onClick, type, metrics }) => (
    <div className="drilldown-card" onClick={() => onClick(item)}>
        <div className="drilldown-header">
            <div className="drilldown-title">
                <MapPin size={18} />
                <div>
                    <h3>{item.name}</h3>
                    {item.code && <span className="branch-code">{item.code}</span>}
                </div>
            </div>
            <ChevronRight size={20} className="drilldown-arrow" />
        </div>
        <div className="drilldown-metrics">
            {metrics.map((metric, idx) => (
                <div key={idx} className="drilldown-metric">
                    <span className="label">{metric.label}</span>
                    <span className={`value ${metric.className || ''}`}>{metric.value}</span>
                </div>
            ))}
        </div>
    </div>
);

// Breadcrumb Navigation
const Breadcrumb = ({ path, onNavigate }) => (
    <div className="breadcrumb">
        {path.map((item, index) => (
            <React.Fragment key={index}>
                <span
                    className={index === path.length - 1 ? 'active' : 'clickable'}
                    onClick={() => index < path.length - 1 && onNavigate(index)}
                >
                    {item.name}
                </span>
                {index < path.length - 1 && <ChevronRight size={16} />}
            </React.Fragment>
        ))}
    </div>
);

export default function EnhancedDashboard() {
    const [navigationPath, setNavigationPath] = useState([{
        name: 'All India',
        level: 'country',
        id: 'all'
    }]);

    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        status: 'all',
        dealType: 'all'
    });

    const [dashboardData, setDashboardData] = useState({
        metrics: {
            totalContracts: 0,
            activeContracts: 0,
            totalRevenue: 0,
            totalCustomers: 0,
            totalOpportunities: 0,
            wonDeals: 0,
            avgContractValue: 0,
            conversionRate: 0
        },
        children: [],
        charts: {
            contractsByStatus: [],
            dealsByType: [],
            revenueByRegion: [],
            monthlyTrend: [],
            verticalDistribution: []
        }
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [navigationPath, filters]);

    const loadDashboardData = async () => {
        setLoading(true);
        const current = navigationPath[navigationPath.length - 1];

        try {
            // Build filters based on current level and date range
            const dateFilter = {
                date: ['between', [filters.startDate, filters.endDate]]
            };

            let regionFilter = {};
            if (current.level === 'region') {
                regionFilter = { region: current.id };
            } else if (current.level === 'branch') {
                regionFilter = { branch: current.id };
            }

            // Fetch Contracts
            const contracts = await fetchERPNextData('CRM Contract', {
                ...dateFilter,
                ...regionFilter,
                ...(filters.status !== 'all' && { status: filters.status })
            }, ['name', 'customer_name', 'amount', 'total_usd', 'date', 'expiry_date',
                'region', 'branch', 'deal_type', 'status', 'total_hp']);

            // Fetch Organizations (Customers)
            const customers = await fetchERPNextData('CRM Organization', {
                ...(current.level !== 'country' && regionFilter)
            }, ['name', 'organization_name', 'region', 'branch_name', 'industry', 'parent_vertical']);

            // Fetch Deals (Opportunities)
            const deals = await fetchERPNextData('CRM Deal', {
                ...dateFilter,
                ...regionFilter
            }, ['name', 'customer_name', 'status', 'deal_type', 'annual_revenue',
                'region', 'branch', 'warranty_amc_status']);

            // Fetch Quotations
            const quotations = await fetchERPNextData('CRM Quotation', {
                ...dateFilter,
                ...regionFilter,
                ...(filters.status !== 'all' && { status: filters.status })
            }, ['name', 'customer_name', 'amount', 'total_usd', 'status', 'zone', 'region', 'branch']);

            // Calculate metrics
            const metrics = calculateMetrics(contracts, customers, deals, quotations);

            // Generate chart data
            const charts = generateChartData(contracts, deals, quotations, current.level);

            // Get children for drilldown
            let children = [];
            if (current.level === 'country') {
                children = await fetchRegions(contracts, deals, customers);
            } else if (current.level === 'region') {
                children = await fetchBranches(current.id, contracts, deals, customers);
            }

            setDashboardData({
                metrics,
                children,
                charts
            });

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Set mock data for demonstration
            setDashboardData(getMockData(current.level, current.id));
        }

        setLoading(false);
    };

    const calculateMetrics = (contracts, customers, deals, quotations) => {
        const activeContracts = contracts.filter(c =>
            new Date(c.expiry_date) > new Date()
        ).length;

        const totalRevenue = contracts.reduce((sum, c) => sum + (c.total_usd || c.amount || 0), 0);
        const wonDeals = deals.filter(d => d.status === 'Won').length;
        const totalDeals = deals.length;

        return {
            totalContracts: contracts.length,
            activeContracts,
            totalRevenue,
            totalCustomers: customers.length,
            totalOpportunities: deals.length,
            wonDeals,
            avgContractValue: contracts.length > 0 ? totalRevenue / contracts.length : 0,
            conversionRate: totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0
        };
    };

    const generateChartData = (contracts, deals, quotations, level) => {
        // Contracts by Status
        const statusCount = contracts.reduce((acc, c) => {
            const status = c.docstatus === 1 ? 'Active' : 'Draft';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const contractsByStatus = Object.entries(statusCount).map(([name, value]) => ({
            name,
            value
        }));

        // Deals by Type
        const typeCount = deals.reduce((acc, d) => {
            const type = d.deal_type || 'Other';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        const dealsByType = Object.entries(typeCount).map(([name, value]) => ({
            name,
            value
        }));

        // Revenue by Region (if country level)
        const regionRevenue = contracts.reduce((acc, c) => {
            const region = c.region || 'Unknown';
            acc[region] = (acc[region] || 0) + (c.total_usd || c.amount || 0);
            return acc;
        }, {});

        const revenueByRegion = Object.entries(regionRevenue)
            .map(([name, revenue]) => ({
                name,
                revenue: revenue / 100000, // Convert to lakhs
                contracts: contracts.filter(c => c.region === name).length
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // Monthly Trend
        const monthlyData = contracts.reduce((acc, c) => {
            const month = new Date(c.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (!acc[month]) {
                acc[month] = { month, revenue: 0, contracts: 0 };
            }
            acc[month].revenue += (c.total_usd || c.amount || 0) / 100000;
            acc[month].contracts += 1;
            return acc;
        }, {});

        const monthlyTrend = Object.values(monthlyData).sort((a, b) =>
            new Date(a.month) - new Date(b.month)
        );

        // Vertical Distribution
        const verticalCount = contracts.reduce((acc, c) => {
            // Get vertical from parent_vertical or industry
            const vertical = c.parent_vertical || c.industry || 'Others';
            acc[vertical] = (acc[vertical] || 0) + 1;
            return acc;
        }, {});

        const verticalDistribution = Object.entries(verticalCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        return {
            contractsByStatus,
            dealsByType,
            revenueByRegion,
            monthlyTrend,
            verticalDistribution
        };
    };

    const fetchRegions = async (contracts, deals, customers) => {
        // Fetch all regions
        const regions = await fetchERPNextData('Region Master', {},
            ['name', 'region_name', 'region_head', 'region_head_name']);

        return regions.map(region => {
            const regionContracts = contracts.filter(c => c.region === region.name);
            const regionDeals = deals.filter(d => d.region === region.name);
            const regionCustomers = customers.filter(c => c.region === region.name);

            const revenue = regionContracts.reduce((sum, c) => sum + (c.total_usd || c.amount || 0), 0);

            return {
                id: region.name,
                name: region.region_name,
                revenue,
                contracts: regionContracts.length,
                customers: regionCustomers.length,
                opportunities: regionDeals.length,
                head: region.region_head_name,
                growth: calculateGrowth(regionContracts)
            };
        }).sort((a, b) => b.revenue - a.revenue);
    };

    const fetchBranches = async (regionId, contracts, deals, customers) => {
        // Fetch branches for the region
        const branches = await fetchERPNextData('Region Branches', {
            region: regionId
        }, ['name', 'branch_name', 'branch_code', 'branch_head', 'branch_head_name']);

        return branches.map(branch => {
            const branchContracts = contracts.filter(c => c.branch === branch.name);
            const branchDeals = deals.filter(d => d.branch === branch.name);
            const branchCustomers = customers.filter(c => c.branch === branch.name);

            const revenue = branchContracts.reduce((sum, c) => sum + (c.total_usd || c.amount || 0), 0);

            return {
                id: branch.name,
                name: branch.branch_name,
                code: branch.branch_code,
                revenue,
                contracts: branchContracts.length,
                customers: branchCustomers.length,
                opportunities: branchDeals.length,
                head: branch.branch_head_name,
                growth: calculateGrowth(branchContracts)
            };
        }).sort((a, b) => b.revenue - a.revenue);
    };

    const calculateGrowth = (contracts) => {
        const now = new Date();
        const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
        const twoMonthsAgo = new Date(now.setMonth(now.getMonth() - 1));

        const lastMonthRevenue = contracts
            .filter(c => new Date(c.date) >= lastMonth)
            .reduce((sum, c) => sum + (c.total_usd || c.amount || 0), 0);

        const previousMonthRevenue = contracts
            .filter(c => new Date(c.date) >= twoMonthsAgo && new Date(c.date) < lastMonth)
            .reduce((sum, c) => sum + (c.total_usd || c.amount || 0), 0);

        if (previousMonthRevenue === 0) return 0;
        return ((lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    };

    const getMockData = (level, id) => {
        // Mock data structure for demonstration
        return {
            metrics: {
                totalContracts: 450,
                activeContracts: 320,
                totalRevenue: 15000000,
                totalCustomers: 180,
                totalOpportunities: 95,
                wonDeals: 68,
                avgContractValue: 33333,
                conversionRate: 71.6
            },
            children: level === 'country' ? [
                { id: 'NORTH-1', name: 'NORTH-1', revenue: 5500000, contracts: 150, customers: 60, opportunities: 30, head: 'Shashank Shekhar', growth: 18.5 },
                { id: 'NORTH-2', name: 'NORTH-2', revenue: 4200000, contracts: 120, customers: 48, opportunities: 25, head: 'Regional Head', growth: 12.3 },
                { id: 'SOUTH', name: 'SOUTH', revenue: 3100000, contracts: 100, customers: 40, opportunities: 22, head: 'Regional Head', growth: 14.7 },
                { id: 'EAST', name: 'EAST', revenue: 2200000, contracts: 80, customers: 32, opportunities: 18, head: 'Regional Head', growth: 16.2 }
            ] : [],
            charts: {
                contractsByStatus: [
                    { name: 'Active', value: 320 },
                    { name: 'Expired', value: 80 },
                    { name: 'Draft', value: 50 }
                ],
                dealsByType: [
                    { name: 'AMC Renewal', value: 45 },
                    { name: 'Warranty AMC Conversion', value: 30 },
                    { name: 'Lost AMC Conversion', value: 15 },
                    { name: 'Lost Warranty Conversion', value: 5 }
                ],
                revenueByRegion: [
                    { name: 'NORTH-1', revenue: 55, contracts: 150 },
                    { name: 'NORTH-2', revenue: 42, contracts: 120 },
                    { name: 'SOUTH', revenue: 31, contracts: 100 },
                    { name: 'EAST', revenue: 22, contracts: 80 }
                ],
                monthlyTrend: [
                    { month: 'Jan 2026', revenue: 45, contracts: 42 },
                    { month: 'Feb 2026', revenue: 52, contracts: 48 },
                    { month: 'Mar 2026', revenue: 58, contracts: 52 }
                ],
                verticalDistribution: [
                    { name: 'Manufacturing', value: 120 },
                    { name: 'IT', value: 85 },
                    { name: 'Healthcare', value: 65 },
                    { name: 'Retail', value: 55 },
                    { name: 'Education', value: 45 },
                    { name: 'Government', value: 40 },
                    { name: 'Hospitality', value: 25 },
                    { name: 'Others', value: 15 }
                ]
            }
        };
    };

    const handleDrilldown = (item) => {
        const current = navigationPath[navigationPath.length - 1];

        let newLevel;
        if (current.level === 'country') newLevel = 'region';
        else if (current.level === 'region') newLevel = 'branch';
        else return; // No drilldown from branch level

        setNavigationPath([...navigationPath, {
            name: item.name,
            level: newLevel,
            id: item.id,
            ...item
        }]);
    };

    const handleNavigateUp = (index) => {
        setNavigationPath(navigationPath.slice(0, index + 1));
    };

    const handleDateChange = (type, value) => {
        setFilters(prev => ({
            ...prev,
            [type === 'start' ? 'startDate' : 'endDate']: value
        }));
    };

    const handleStatusChange = (status) => {
        setFilters(prev => ({ ...prev, status }));
    };

    if (loading) {
        return <div className="loading">Loading Dashboard Data...</div>;
    }

    const { metrics, children, charts } = dashboardData;
    const current = navigationPath[navigationPath.length - 1];

    return (
        <div className="dashboard-container">
            <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .breadcrumb span {
          font-size: 0.9rem;
          color: #6a737d;
          transition: all 0.3s ease;
        }

        .breadcrumb span.active {
          color: #0366d6;
          font-weight: 600;
        }

        .breadcrumb span.clickable {
          cursor: pointer;
          color: #0366d6;
        }

        .breadcrumb span.clickable:hover {
          color: #024c9e;
          text-decoration: underline;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 2rem;
          color: white;
        }

        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .dashboard-subtitle {
          font-size: 1.1rem;
          opacity: 0.95;
        }

        .filters-section {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .filters-container {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .date-filter {
          display: flex;
          gap: 1rem;
        }

        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-item label,
        .status-filter label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #6a737d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-item input,
        .status-filter select {
          padding: 0.6rem 1rem;
          border: 2px solid #e1e4e8;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: white;
        }

        .filter-item input:focus,
        .status-filter select:focus {
          outline: none;
          border-color: #0366d6;
          box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .metric-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
        }

        .metric-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-title {
          font-size: 0.85rem;
          color: #6a737d;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1d29;
          margin-bottom: 0.5rem;
          font-family: 'IBM Plex Mono', monospace;
        }

        .metric-subtitle {
          font-size: 0.85rem;
          color: #6a737d;
          margin-bottom: 0.5rem;
        }

        .metric-change {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .metric-change.up {
          color: #28a745;
        }

        .metric-change.down {
          color: #dc3545;
        }

        .charts-section {
          margin-bottom: 2rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .chart-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .chart-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1d29;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #e1e4e8;
        }

        .drilldown-section {
          margin-top: 2rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 1.5rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .drilldown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .drilldown-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .drilldown-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .drilldown-card:hover .drilldown-title h3,
        .drilldown-card:hover .label,
        .drilldown-card:hover .value {
          color: white;
        }

        .drilldown-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e1e4e8;
        }

        .drilldown-card:hover .drilldown-header {
          border-bottom-color: rgba(255, 255, 255, 0.3);
        }

        .drilldown-title {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .drilldown-title h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #1a1d29;
          margin-bottom: 0.25rem;
        }

        .branch-code {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #e1e4e8;
          color: #6a737d;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .drilldown-card:hover .branch-code {
          background: rgba(255, 255, 255, 0.3);
          color: white;
        }

        .drilldown-arrow {
          color: #8b92a0;
          transition: all 0.3s ease;
        }

        .drilldown-card:hover .drilldown-arrow {
          transform: translateX(5px);
          color: white;
        }

        .drilldown-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .drilldown-metric {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .drilldown-metric .label {
          font-size: 0.75rem;
          color: #6a737d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .drilldown-metric .value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a1d29;
          font-family: 'IBM Plex Mono', monospace;
        }

        .drilldown-metric .value.growth {
          color: #28a745;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-size: 1.5rem;
          color: white;
          font-weight: 600;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }

          .dashboard-title {
            font-size: 2rem;
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .drilldown-grid {
            grid-template-columns: 1fr;
          }

          .filters-container {
            flex-direction: column;
          }

          .date-filter {
            flex-direction: column;
            width: 100%;
          }
        }
      `}</style>

            <Breadcrumb path={navigationPath} onNavigate={handleNavigateUp} />

            <div className="dashboard-header">
                <h1 className="dashboard-title">{current.name} Dashboard</h1>
                <p className="dashboard-subtitle">Real-time CRM Analytics & Insights</p>
            </div>

            <div className="filters-section">
                <div className="filters-container">
                    <DateFilter
                        startDate={filters.startDate}
                        endDate={filters.endDate}
                        onDateChange={handleDateChange}
                    />
                    <StatusFilter
                        selectedStatus={filters.status}
                        onStatusChange={handleStatusChange}
                        statuses={['Draft', 'Active', 'Expired', 'Cancelled']}
                    />
                </div>
            </div>

            <div className="metrics-grid">
                <MetricCard
                    title="Total Revenue"
                    value={`₹${(metrics.totalRevenue / 10000000).toFixed(2)}Cr`}
                    subtitle={`${metrics.totalContracts} Contracts`}
                    icon={DollarSign}
                    change={`Avg: ₹${(metrics.avgContractValue / 100000).toFixed(1)}L`}
                    trend="up"
                />
                <MetricCard
                    title="Active Contracts"
                    value={metrics.activeContracts}
                    subtitle={`${((metrics.activeContracts / metrics.totalContracts) * 100).toFixed(1)}% Active`}
                    icon={FileText}
                    change={`${metrics.totalContracts - metrics.activeContracts} Expired`}
                    trend="up"
                />
                <MetricCard
                    title="Total Customers"
                    value={metrics.totalCustomers}
                    subtitle="Unique Organizations"
                    icon={Users}
                    change={`${(metrics.totalRevenue / metrics.totalCustomers / 100000).toFixed(1)}L per customer`}
                    trend="up"
                />
                <MetricCard
                    title="Opportunities"
                    value={metrics.totalOpportunities}
                    subtitle={`${metrics.wonDeals} Won Deals`}
                    icon={Briefcase}
                    change={`${metrics.conversionRate.toFixed(1)}% Conversion`}
                    trend="up"
                />
            </div>

            <div className="charts-section">
                <div className="charts-grid">
                    <DonutChart
                        data={charts.contractsByStatus}
                        title="Contracts by Status"
                        dataKey="value"
                        nameKey="name"
                    />

                    <DonutChart
                        data={charts.dealsByType}
                        title="Opportunities by Type"
                        dataKey="value"
                        nameKey="name"
                    />
                </div>

                <div className="charts-grid">
                    <div className="chart-card">
                        <h3 className="chart-title">Revenue by {current.level === 'country' ? 'Region' : 'Branch'}</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={charts.revenueByRegion}>
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
                                <Bar dataKey="contracts" fill="#28a745" name="Contracts" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <DonutChart
                        data={charts.verticalDistribution}
                        title="Industry Vertical Distribution"
                        dataKey="value"
                        nameKey="name"
                    />
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">Monthly Revenue & Contracts Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={charts.monthlyTrend}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0366d6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#0366d6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorContracts" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#28a745" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#28a745" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e1e4e8" />
                            <XAxis dataKey="month" stroke="#6a737d" />
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
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#0366d6"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                name="Revenue (Lakhs)"
                            />
                            <Area
                                type="monotone"
                                dataKey="contracts"
                                stroke="#28a745"
                                fillOpacity={1}
                                fill="url(#colorContracts)"
                                name="Contracts"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {children.length > 0 && (
                <div className="drilldown-section">
                    <h2 className="section-title">
                        {current.level === 'country' ? '🗺️ Regions Overview' : '🏢 Branches Overview'}
                    </h2>
                    <div className="drilldown-grid">
                        {children.map((item) => (
                            <DrilldownCard
                                key={item.id}
                                item={item}
                                onClick={handleDrilldown}
                                type={current.level}
                                metrics={[
                                    { label: 'Revenue', value: `₹${(item.revenue / 100000).toFixed(1)}L` },
                                    { label: 'Contracts', value: item.contracts },
                                    { label: 'Customers', value: item.customers },
                                    { label: 'Opportunities', value: item.opportunities },
                                    { label: 'Growth', value: `${item.growth >= 0 ? '+' : ''}${item.growth.toFixed(1)}%`, className: 'growth' },
                                    { label: 'Head', value: item.head || 'Not Assigned' }
                                ]}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}