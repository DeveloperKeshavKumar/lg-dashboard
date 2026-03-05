import React, { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { DateRange } from "react-date-range";
import { COLORS } from "../../constants/theme";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function DateRangeInput({ startDate, endDate, onChange }) {
    const [isOpen, setIsOpen] = useState(false);

    const [selectionRange, setSelectionRange] = useState({
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(),
        key: "selection",
    });

    const containerRef = useRef(null);

    useEffect(() => {
        setSelectionRange({
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : new Date(),
            key: "selection",
        });
    }, [startDate, endDate]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleApply = () => {
        onChange({
            startDate: selectionRange.startDate
                ?.toISOString()
                .split("T")[0],
            endDate: selectionRange.endDate
                ?.toISOString()
                .split("T")[0],
        });
        setIsOpen(false);
    };

    const handleClear = () => {
        const today = new Date();
        setSelectionRange({
            startDate: today,
            endDate: today,
            key: "selection",
        });

        onChange({
            startDate: "",
            endDate: "",
        });

        setIsOpen(false);
    };

    const formatDateRange = () => {
        if (!startDate && !endDate) return "Select date range";
        if (startDate && endDate) {
            return `${new Date(startDate).toLocaleDateString()} - ${new Date(
                endDate
            ).toLocaleDateString()}`;
        }
        if (startDate) return `From ${new Date(startDate).toLocaleDateString()}`;
        if (endDate) return `Until ${new Date(endDate).toLocaleDateString()}`;
    };

    return (
        <div className="relative" ref={containerRef}>
            <label
                className="text-sm font-medium mb-2 block"
                style={{ color: COLORS.text.secondary }}
            >
                Date Range
            </label>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border rounded-md text-sm text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                style={{ borderColor: COLORS.border }}
            >
                <span className={!startDate && !endDate ? "text-gray-400" : ""}>
                    {formatDateRange()}
                </span>
                <Calendar
                    className="h-4 w-4"
                    style={{ color: COLORS.text.secondary }}
                />
            </button>

            {isOpen && (
                <div
                    className="absolute z-50 mt-2 bg-white border rounded-xl shadow-xl p-4"
                    style={{ borderColor: COLORS.border }}
                >
                    <DateRange
                        ranges={[selectionRange]}
                        onChange={(ranges) => setSelectionRange(ranges.selection)}
                        moveRangeOnFirstSelection={false}
                        months={2}
                        direction="horizontal"
                        showDateDisplay={false}
                        rangeColors={[COLORS.primary]}
                    />

                    <div className="flex gap-2 pt-4">
                        <button
                            onClick={handleApply}
                            className="flex-1 px-3 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            Apply
                        </button>

                        <button
                            onClick={handleClear}
                            className="px-3 py-2 text-sm font-medium border rounded-md hover:bg-gray-50 transition-colors"
                            style={{
                                borderColor: COLORS.border,
                                color: COLORS.text.secondary,
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}