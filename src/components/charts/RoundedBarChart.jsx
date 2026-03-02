import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { COLORS, CHART_CONFIG } from '../../constants/theme';

export default function RoundedBarChart({
    data,
    title,
    bars = [],
    onBarClick,
    height = 350
}) {

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

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>

            {data.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-400">
                    No data available
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={height}>
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 20, left: 10, bottom: 30 }}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />

                        <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tickMargin={16}
                            interval={0}
                            padding={{ left: 10, right: 10 }}
                            fontSize={12}
                            stroke={COLORS.text.secondary}
                        />

                        <YAxis fontSize={12} stroke={COLORS.text.secondary} />

                        <Tooltip content={<CustomTooltip />} />

                        {bars.map((bar, index) => (
                            <Bar
                                key={bar.dataKey}
                                dataKey={bar.dataKey}
                                name={bar.name}
                                fill={bar.color || COLORS.chart[index % COLORS.chart.length]}
                                radius={CHART_CONFIG.barRadius}
                                onClick={onBarClick}
                                style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                                animationDuration={CHART_CONFIG.animationDuration}
                                yAxisId={bar.yAxisId || 'left'}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}