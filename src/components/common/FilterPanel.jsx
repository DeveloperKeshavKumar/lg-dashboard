// src/components/common/FilterPanel.jsx
import React, { useCallback } from 'react';
import { Filter, X } from 'lucide-react';
import { COLORS } from '../../constants/theme';
import DateRangeInput from './DateRangeInput';
import { useFilterOptions } from '../../hooks/useFilterOptions';

export default function FilterPanel({
    filters,
    setFilters,
    onApply,
    onReset,
    additionalOptions = {}
}) {
    const { verticals, dealTypes, statuses, isLoading, error } = useFilterOptions();

    // Get branches from additionalOptions
    const branches = additionalOptions.branches || [];

    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, [setFilters]);

    const handleDateRangeChange = useCallback(({ startDate, endDate }) => {
        setFilters(prev => ({
            ...prev,
            startDate,
            endDate
        }));
    }, [setFilters]);

    const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'startDate' || key === 'endDate') return false;
        return Boolean(value);
    }).length + ((filters.startDate || filters.endDate) ? 1 : 0);

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-red-200">
                <div className="flex items-center gap-2 text-red-600">
                    <Filter className="h-5 w-5" />
                    <span className="text-sm">Error loading filters: {error.message}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" style={{ color: COLORS.primary }} />
                    <h3 className="text-lg font-semibold" style={{ color: COLORS.text.primary }}>
                        Filters
                    </h3>
                    {activeFilterCount > 0 && (
                        <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                                backgroundColor: COLORS.primary,
                                color: 'white'
                            }}
                        >
                            {activeFilterCount} active
                        </span>
                    )}
                </div>
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50 transition-colors"
                    style={{
                        borderColor: COLORS.border,
                        color: COLORS.text.secondary
                    }}
                >
                    <X className="h-4 w-4" />
                    Clear All
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* Date Range */}
                <DateRangeInput
                    startDate={filters.startDate}
                    endDate={filters.endDate}
                    onChange={handleDateRangeChange}
                />

                {/* Vertical */}
                <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: COLORS.text.secondary }}>
                        Vertical
                    </label>
                    <select
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{ borderColor: COLORS.border }}
                        value={filters.vertical || ''}
                        onChange={(e) => handleFilterChange('vertical', e.target.value)}
                        disabled={isLoading}
                    >
                        <option value="">{isLoading ? 'Loading...' : 'All Verticals'}</option>
                        {verticals.map(vert => (
                            <option key={vert.value} value={vert.value}>{vert.label}</option>
                        ))}
                    </select>
                </div>

                {/* Deal Type */}
                <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: COLORS.text.secondary }}>
                        Contract Type
                    </label>
                    <select
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{ borderColor: COLORS.border }}
                        value={filters.dealType || ''}
                        onChange={(e) => handleFilterChange('dealType', e.target.value)}
                        disabled={isLoading}
                    >
                        <option value="">{isLoading ? 'Loading...' : 'All Types'}</option>
                        {dealTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>

                {/* Status */}
                <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: COLORS.text.secondary }}>
                        Status
                    </label>
                    <select
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{ borderColor: COLORS.border }}
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        disabled={isLoading}
                    >
                        <option value="">{isLoading ? 'Loading...' : 'All Statuses'}</option>
                        {statuses.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                    </select>
                </div>

                {/* Branch Filter (conditionally shown) */}
                {
                    // branches.length > 0 ? (
                    //     <div>
                    //         <label className="text-sm font-medium mb-2 block" style={{ color: COLORS.text.secondary }}>
                    //             Branch
                    //         </label>
                    //         <select
                    //             className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all"
                    //             style={{ borderColor: COLORS.border }}
                    //             value={filters.branch || ''}
                    //             onChange={(e) => handleFilterChange('branch', e.target.value)}
                    //         >
                    //             <option value="">All Branches</option>
                    //             {branches.map(branch => (
                    //                 <option key={branch.branchId} value={branch.branchId}>
                    //                     {branch.branchName}
                    //                 </option>
                    //             ))}
                    //         </select>
                    //     </div>
                    // ) : (
                    //     /* Apply Button */
                    // )
                }
                <div className="flex items-end">
                    <button
                        onClick={onApply}
                        disabled={isLoading}
                        className="w-full px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        {isLoading ? 'Loading...' : 'Apply Filters'}
                    </button>
                </div>
            </div>

            {/* Apply Button when branch filter is shown */}
            {/* {branches.length > 0 && (
                <div className="mt-4">
                    <button
                        onClick={onApply}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        {isLoading ? 'Loading...' : 'Apply Filters'}
                    </button>
                </div>
            )} */}
        </div>
    );
}