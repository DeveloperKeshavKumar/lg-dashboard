// src/contexts/FilterContext.jsx
import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export function FilterProvider({ children }) {
    const [globalFilters, setGlobalFilters] = useState({});

    const updateFilters = (newFilters) => {
        setGlobalFilters(prev => ({ ...prev, ...newFilters }));
    };

    const resetFilters = () => {
        setGlobalFilters({});
    };

    return (
        <FilterContext.Provider value={{ globalFilters, updateFilters, resetFilters }}>
            {children}
        </FilterContext.Provider>
    );
}

export function useFilters() {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilters must be used within FilterProvider');
    }
    return context;
}