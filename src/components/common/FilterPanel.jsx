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

    const activeFilterCount =
        Object.entries(filters).filter(([key, value]) => {
            if (key === 'startDate' || key === 'endDate' || key === 'usePoDate') return false;
            return Boolean(value);
        }).length + ((filters.startDate || filters.endDate) ? 1 : 0);

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-red-200">
                Error loading filters: {error.message}
            </div>
        );
    }

    // Determine grid columns based on whether branches are available
    const gridCols = branches.length > 0 ? 'lg:grid-cols-7' : 'lg:grid-cols-6';

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" style={{ color: COLORS.primary }} />
                    <h3 className="text-lg font-semibold">Filters</h3>

                    {activeFilterCount > 0 && (
                        <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: COLORS.primary, color: "white" }}
                        >
                            {activeFilterCount} active
                        </span>
                    )}
                </div>

                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
                    style={{ borderColor: COLORS.border }}
                >
                    <X className="h-4 w-4" />
                    Clear All
                </button>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-4`}>

                <DateRangeInput
                    startDate={filters.startDate}
                    endDate={filters.endDate}
                    onChange={handleDateRangeChange}
                />

                <div>
                    <label className="text-sm font-medium mb-2 block">Vertical</label>
                    <select
                        value={filters.vertical || ''}
                        onChange={(e) => handleFilterChange('vertical', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                        <option value="">All Verticals</option>
                        {verticals.map(v => (
                            <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">Contract Type</label>
                    <select
                        value={filters.dealType || ''}
                        onChange={(e) => handleFilterChange('dealType', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                        <option value="">All Types</option>
                        {dealTypes.map(v => (
                            <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                        <option value="">All Status</option>
                        {statuses.map(v => (
                            <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                    </select>
                </div>

                {/* Branch filter - only show if branches are provided */}
                {branches.length > 0 && (
                    <div>
                        <label className="text-sm font-medium mb-2 block">Branch</label>
                        <select
                            value={filters.branch || ''}
                            onChange={(e) => handleFilterChange('branch', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => (
                                <option key={b.value} value={b.value}>{b.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.usePoDate || false}
                            onChange={(e) => handleFilterChange('usePoDate', e.target.checked)}
                        />
                        Date of PO (Opportunity)
                    </label>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={onApply}
                        className="w-full px-4 py-2 text-sm font-medium text-white rounded-md"
                        style={{ backgroundColor: COLORS.primary }}
                    >
                        Apply Filters
                    </button>
                </div>

            </div>
        </div>
    );
}