import React from 'react';
import { COLORS } from '../../constants/theme';

export default function FilterPanel({
    filters,
    setFilters,
    onApply,
    onReset,
    availableOptions = {}
}) {
    return (
        <div className="bg-white p-5 rounded-lg shadow-sm mb-6 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-4 items-end">
                {/* Date Range */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition text-sm"
                        style={{
                            focusRingColor: COLORS.primary,
                            borderColor: filters.startDate ? COLORS.primary : undefined
                        }}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                    </label>
                    <input
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition text-sm"
                        style={{
                            borderColor: filters.endDate ? COLORS.primary : undefined
                        }}
                    />
                </div>

                {/* Industry Filter */}
                {availableOptions.industries && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Industry
                        </label>
                        <select
                            value={filters.industry || ''}
                            onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition text-sm"
                        >
                            <option value="">All Industries</option>
                            {availableOptions.industries.map(ind => (
                                <option key={ind} value={ind}>{ind}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Vertical Filter */}
                {availableOptions.verticals && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vertical
                        </label>
                        <select
                            value={filters.vertical || ''}
                            onChange={(e) => setFilters({ ...filters, vertical: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition text-sm"
                        >
                            <option value="">All Verticals</option>
                            {availableOptions.verticals.map(vert => (
                                <option key={vert} value={vert}>{vert}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Deal Type Filter */}
                {availableOptions.dealTypes && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Opportunity Type
                        </label>
                        <select
                            value={filters.dealType || ''}
                            onChange={(e) => setFilters({ ...filters, dealType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition text-sm"
                        >
                            <option value="">All Types</option>
                            {availableOptions.dealTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Status Filter */}
                {availableOptions.statuses && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={filters.status || ''}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition text-sm"
                        >
                            <option value="">All Status</option>
                            {availableOptions.statuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* AMC Status Filter */}
                {availableOptions.amcStatuses && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            AMC Status
                        </label>
                        <select
                            value={filters.amcStatus || ''}
                            onChange={(e) => setFilters({ ...filters, amcStatus: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition text-sm"
                        >
                            <option value="">All AMC Status</option>
                            {availableOptions.amcStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Owner Filter */}
                {availableOptions.owners && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Owner
                        </label>
                        <select
                            value={filters.owner || ''}
                            onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 transition text-sm"
                        >
                            <option value="">All Owners</option>
                            {availableOptions.owners.map(owner => (
                                <option key={owner} value={owner}>{owner}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={onApply}
                        className="px-5 py-2 text-white rounded-md hover:opacity-90 transition font-medium shadow-sm text-sm whitespace-nowrap"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        Apply
                    </button>
                    <button
                        onClick={onReset}
                        className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition font-medium text-sm whitespace-nowrap"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}