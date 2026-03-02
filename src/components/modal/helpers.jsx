import { formatCurrency, formatHP } from './api';

/**
 * Generate detailed modal data based on chart type and clicked segment
 */
export function generateModalData(chartType, segment, rawData) {
    let detailedData = [];
    let title = '';

    switch (chartType) {
        case 'Revenue by Vertical':
            detailedData = rawData.contracts
                .filter(c => (c.parent_vertical || 'Uncategorized') === segment.name)
                .map(c => ({
                    'Contract ID': c.name,
                    'Customer': c.customer_name,
                    'Date': c.date,
                    'Amount': formatCurrency(parseFloat(c.amount || 0)),
                    'HP': formatHP(parseFloat(c.total_hp || 0)),
                    'Region': c.region,
                    'Branch': c.branch,
                }));
            title = `${chartType} - ${segment.name} (${detailedData.length} contracts)`;
            break;

        case 'Deal Status Distribution':
            detailedData = rawData.deals
                .filter(d => (d.status || 'Unknown') === segment.name)
                .map(d => ({
                    'Deal ID': d.name,
                    'Customer': d.customer_name,
                    'Register Date': d.register_date,
                    'Status': d.status,
                    'Type': d.deal_type,
                    'Owner': d.owner,
                    'Region': d.region,
                    'Branch': d.branch,
                }));
            title = `${chartType} - ${segment.name} (${detailedData.length} deals)`;
            break;

        case 'Contract Type Breakdown':
            detailedData = rawData.contracts
                .filter(c => (c.deal_type || 'Standard') === segment.name)
                .map(c => ({
                    'Contract ID': c.name,
                    'Customer': c.customer_name,
                    'Date': c.date,
                    'Amount': formatCurrency(parseFloat(c.amount || 0)),
                    'HP': formatHP(parseFloat(c.total_hp || 0)),
                    'Type': c.deal_type,
                    'Region': c.region,
                    'Branch': c.branch,
                }));
            title = `${chartType} - ${segment.name} (${detailedData.length} contracts)`;
            break;

        case 'Customers by Industry':
            detailedData = rawData.organizations
                .filter(o => (o.industry || 'Uncategorized') === segment.name)
                .map(o => ({
                    'Customer ID': o.name,
                    'Organization': o.organization_name,
                    'HC': o.customer_hc,
                    'Vertical': o.parent_vertical,
                    'Type': o.customer_type,
                    'Region': o.region,
                    'Branch': o.branch,
                }));
            title = `${chartType} - ${segment.name} (${detailedData.length} customers)`;
            break;

        case 'AMC Status Distribution':
            detailedData = rawData.deals
                .filter(d => (d.warranty_amc_status || 'Unknown') === segment.name)
                .map(d => ({
                    'Deal ID': d.name,
                    'Customer': d.customer_name,
                    'AMC Status': d.warranty_amc_status,
                    'Register Date': d.register_date,
                    'Type': d.deal_type,
                    'Owner': d.owner,
                    'Region': d.region,
                    'Branch': d.branch,
                }));
            title = `${chartType} - ${segment.name} (${detailedData.length} deals)`;
            break;

        case 'Quotation Status':
            detailedData = rawData.quotations
                .filter(q => (q.status || 'Unknown') === segment.name)
                .map(q => ({
                    'Quotation ID': q.name,
                    'Customer': q.customer_name,
                    'Date': q.date,
                    'Status': q.status,
                    'Amount': formatCurrency(parseFloat(q.amount || 0)),
                    'HP': formatHP(parseFloat(q.total_hp || 0)),
                    'Region': q.region,
                    'Branch': q.branch,
                }));
            title = `${chartType} - ${segment.name} (${detailedData.length} quotations)`;
            break;

        case 'Deal Type Distribution':
            detailedData = rawData.deals
                .filter(d => (d.deal_type || 'Unknown') === segment.name)
                .map(d => ({
                    'Deal ID': d.name,
                    'Customer': d.customer_name,
                    'Type': d.deal_type,
                    'Status': d.status,
                    'Register Date': d.register_date,
                    'Owner': d.owner,
                    'Region': d.region,
                    'Branch': d.branch,
                }));
            title = `${chartType} - ${segment.name} (${detailedData.length} deals)`;
            break;

        case 'Customer Type Distribution':
            detailedData = rawData.organizations
                .filter(o => (o.customer_type || 'Unknown') === segment.name)
                .map(o => ({
                    'Customer ID': o.name,
                    'Organization': o.organization_name,
                    'Type': o.customer_type,
                    'HC': o.customer_hc,
                    'Industry': o.industry,
                    'Vertical': o.parent_vertical,
                    'Region': o.region,
                    'Branch': o.branch,
                }));
            title = `${chartType} - ${segment.name} (${detailedData.length} customers)`;
            break;

        case 'Revenue by Industry':
            detailedData = rawData.contracts
                .filter(c => (c.industry || 'Uncategorized') === segment.name)
                .map(c => ({
                    'Contract ID': c.name,
                    'Customer': c.customer_name,
                    'Industry': c.industry,
                    'Date': c.date,
                    'Amount': formatCurrency(parseFloat(c.amount || 0)),
                    'HP': formatHP(parseFloat(c.total_hp || 0)),
                    'Region': c.region,
                    'Branch': c.branch,
                }));
            title = `${chartType} - ${segment.name} (${detailedData.length} contracts)`;
            break;

        case 'Contract Timeline':
            detailedData = rawData.contracts
                .filter(c => c.date && c.date.substring(0, 7) === segment.month)
                .map(c => ({
                    'Contract ID': c.name,
                    'Customer': c.customer_name,
                    'Date': c.date,
                    'Amount': formatCurrency(parseFloat(c.amount || 0)),
                    'HP': formatHP(parseFloat(c.total_hp || 0)),
                    'Type': c.deal_type,
                    'Region': c.region,
                    'Branch': c.branch,
                }));
            title = `Contracts in ${segment.month} (${detailedData.length} contracts)`;
            break;

        case 'Revenue by Manager':
        case 'Deals by Owner':
            // For manager/branch level - show contracts/deals for specific manager
            if (segment.contractsList) {
                detailedData = segment.contractsList.map(c => ({
                    'Contract ID': c.name,
                    'Customer': c.customer_name,
                    'Date': c.date,
                    'Amount': formatCurrency(parseFloat(c.amount || 0)),
                    'HP': formatHP(parseFloat(c.total_hp || 0)),
                    'Branch': c.branch,
                }));
            } else if (segment.dealsList) {
                detailedData = segment.dealsList.map(d => ({
                    'Deal ID': d.name,
                    'Customer': d.customer_name,
                    'Status': d.status,
                    'Type': d.deal_type,
                    'Register Date': d.register_date,
                    'Branch': d.branch,
                }));
            }
            title = `${chartType} - ${segment.name} (${detailedData.length} records)`;
            break;

        default:
            title = chartType;
    }

    return { data: detailedData, title };
}

/**
 * Modal Component
 */
export function Modal({ show, title, data, onClose }) {
    if (!show || !data || data.length === 0) return null;

    const columns = Object.keys(data[0]);

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[85vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                {columns.map(col => (
                                    <th
                                        key={col}
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    {columns.map((col, vidx) => (
                                        <td
                                            key={vidx}
                                            className="px-4 py-3 whitespace-nowrap text-sm text-gray-900"
                                        >
                                            {row[col] || '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}