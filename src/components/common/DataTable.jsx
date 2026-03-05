import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { COLORS } from '../../constants/theme';

export default function DataTable({
    title,
    columns,
    data,
    onRowClick,
    actionButton,
    sortConfig,
    onSort
}) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((col, index) => (
                                <th
                                    key={index}
                                    onClick={() => col.sortable !== false && onSort && onSort(col.key)}
                                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${col.align === 'right' ? 'text-right' :
                                        col.align === 'center' ? 'text-center' : 'text-left'
                                        } ${col.sortable !== false && onSort ? 'cursor-pointer hover:bg-gray-100 transition' : ''}`}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {col.sortable !== false && onSort && sortConfig && (
                                            sortConfig.key === col.key ? (
                                                sortConfig.direction === 'asc' ? (
                                                    <ArrowUp className="w-3 h-3" style={{ color: COLORS.primary }} />
                                                ) : (
                                                    <ArrowDown className="w-3 h-3" style={{ color: COLORS.primary }} />
                                                )
                                            ) : (
                                                <ArrowUpDown className="w-3 h-3 opacity-30" />
                                            )
                                        )}
                                    </div>
                                </th>
                            ))}
                            {actionButton && (
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={`hover:bg-gray-50 transition ${onRowClick ? 'cursor-pointer' : ''
                                    }`}
                                onClick={() => onRowClick && onRowClick(row)}
                            >
                                {columns.map((col, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`px-6 py-4 whitespace-nowrap text-sm ${col.bold ? 'font-medium text-gray-900' : 'text-gray-600'
                                            } ${col.align === 'right' ? 'text-right' :
                                                col.align === 'center' ? 'text-center' : 'text-left'
                                            }`}
                                    >
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                                {actionButton && (
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                actionButton.onClick(row);
                                            }}
                                            className="font-medium hover:opacity-80 transition"
                                            style={{ color: COLORS.primary }}
                                        >
                                            {actionButton.label} →
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}