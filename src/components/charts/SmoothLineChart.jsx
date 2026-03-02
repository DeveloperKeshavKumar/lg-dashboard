import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { COLORS, CHART_CONFIG } from '../../constants/theme';

export default function SmoothLineChart({
    data,
    title,
    lines = [],
    onPointClick,
    height = 350,
    showLegend = true
}) {
    const [activeKey, setActiveKey] = useState(null);

    const handleLegendClick = (dataKey) => {
        setActiveKey(prev => (prev === dataKey ? null : dataKey));
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;

        return (
            <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-800 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-gray-600">
                            {entry.name}: {entry.formatter ? entry.formatter(entry.value) : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    const renderLegend = (props) => {
        const { payload } = props;

        return (
            <div className="flex flex-wrap gap-3 justify-center mt-4">
                {payload.map((entry, index) => {
                    const isActive = activeKey === entry.dataKey;
                    const isDimmed = activeKey && activeKey !== entry.dataKey;

                    return (
                        <div
                            key={`legend-${index}`}
                            onClick={() => handleLegendClick(entry.dataKey)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition ${isDimmed ? 'opacity-40 bg-gray-100' : 'hover:bg-gray-50'
                                }`}
                            style={{ border: `1px solid ${entry.color}20` }}
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm font-medium text-gray-700">
                                {entry.value}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>

            {data.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-400">
                    No data available
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={height}>
                    <LineChart
                        data={data}
                        margin={{ top: 10, right: 20, left: 10, bottom: 30 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />

                        <XAxis
                            dataKey="name"
                            fontSize={12}
                            stroke={COLORS.text.secondary}
                        />

                        <YAxis fontSize={12} stroke={COLORS.text.secondary} />

                        <Tooltip content={<CustomTooltip />} />

                        {showLegend && <Legend content={renderLegend} />}

                        {lines.map((line, index) => {
                            const isHidden = activeKey && activeKey !== line.dataKey;

                            return (
                                <Line
                                    key={line.dataKey}
                                    type={CHART_CONFIG.curveType}
                                    dataKey={line.dataKey}
                                    name={line.name}
                                    stroke={
                                        line.color ||
                                        COLORS.chart[index % COLORS.chart.length]
                                    }
                                    strokeWidth={CHART_CONFIG.strokeWidth}
                                    dot={{
                                        r: 4,
                                        fill:
                                            line.color ||
                                            COLORS.chart[index % COLORS.chart.length]
                                    }}
                                    activeDot={{ r: 6, onClick: onPointClick }}
                                    animationDuration={
                                        CHART_CONFIG.animationDuration
                                    }
                                    yAxisId={line.yAxisId || 'left'}
                                    hide={isHidden}
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}