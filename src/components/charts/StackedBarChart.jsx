import React, { useState, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { COLORS } from '../../constants/theme';

const formatCurrencyCompact = (value) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(value);

const formatNumberCompact = (value) =>
    new Intl.NumberFormat('en-IN', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(value);

export default function StackedBarChart({
    data,
    title,
    stacks = [],
    onBarClick,
    valueFormatter = (v) => v,
    yAxisFormatter = (v) => v,
    height = 400,
    xAxisLabel = "Region",
    yAxisLabel = "Value"
}) {

    const [activeKey, setActiveKey] = useState(null);

    const handleLegendClick = (key) => {
        setActiveKey(prev => prev === key ? null : key);
    };

    const displayData = useMemo(() => {
        if (!activeKey) return data;

        return data.map(row => {
            const filtered = { ...row };
            stacks.forEach(s => {
                if (s.dataKey !== activeKey) filtered[s.dataKey] = 0;
            });
            return filtered;
        });
    }, [data, activeKey, stacks]);

    const renderLegend = () => (
        <div className="flex flex-wrap gap-3 justify-center mt-4">
            {stacks.map((stack, i) => {

                const dim = activeKey && activeKey !== stack.dataKey;

                return (
                    <div
                        key={i}
                        onClick={() => handleLegendClick(stack.dataKey)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer transition ${dim ? 'opacity-40 bg-gray-100' : 'hover:bg-gray-50'
                            }`}
                        style={{ border: `1px solid ${stack.color}30` }}
                    >
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: stack.color }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                            {stack.name}
                        </span>
                    </div>
                );
            })}
        </div>
    );

    const renderXAxisTick = ({ x, y, payload }) => {
        return (
            <g transform={`translate(${x},${y + 10})`}>
                <text
                    transform="rotate(-35)"
                    textAnchor="end"
                    fill={COLORS.text.secondary}
                    fontSize={12}
                >
                    {payload.value}
                </text>
            </g>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">

            <h3 className="text-lg font-semibold mb-4" style={{ color: COLORS.text.primary }}>
                {title}
            </h3>

            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={displayData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    barCategoryGap="25%"
                >

                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />

                    <XAxis
                        dataKey="name"
                        interval={0}
                        tick={renderXAxisTick}
                        label={{
                            value: xAxisLabel,
                            position: "bottom",
                            offset: 15
                        }}
                    />

                    <YAxis
                        tick={{ fill: COLORS.text.secondary }}
                        tickFormatter={yAxisFormatter}
                        label={{
                            value: yAxisLabel,
                            angle: -90,
                            position: "left"
                        }}
                    />

                    <Tooltip
                        formatter={(v) => valueFormatter ? valueFormatter(v) : v}
                        contentStyle={{
                            backgroundColor: "white",
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 8
                        }}
                    />

                    {stacks.map((stack) => (
                        <Bar
                            key={stack.dataKey}
                            dataKey={stack.dataKey}
                            stackId="a"
                            fill={stack.color}
                            name={stack.name}
                            barSize={32}
                            onClick={(d) => onBarClick?.({ ...d, stackKey: stack.dataKey })}
                            cursor="pointer"
                        >
                            {displayData.map((entry, index) => {

                                const isTop = stacks
                                    .slice()
                                    .reverse()
                                    .find(s => entry[s.dataKey] > 0)?.dataKey === stack.dataKey;

                                const isBottom = stacks
                                    .find(s => entry[s.dataKey] > 0)?.dataKey === stack.dataKey;

                                return (
                                    <Cell
                                        key={index}
                                        radius={[
                                            isTop ? 8 : 0,
                                            isTop ? 8 : 0,
                                            isBottom ? 8 : 0,
                                            isBottom ? 8 : 0
                                        ]}
                                    />
                                );
                            })}
                        </Bar>
                    ))}

                </BarChart>
            </ResponsiveContainer>

            {renderLegend()}

        </div>
    );
}

export { formatCurrencyCompact, formatNumberCompact };