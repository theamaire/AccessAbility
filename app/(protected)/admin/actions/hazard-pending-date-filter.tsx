"use client";

import { useMemo, useState } from "react";
import { hazardColumns } from "@/components/hazard-data-table/columns";
import { HazardDataTable } from "@/components/hazard-data-table/data-table";
import { Hazard } from "@/types/hazard";

type DateView = "day" | "week" | "month";

interface HazardPendingDateFilterProps {
  data: Hazard[];
}


function getFilterLabel(
  selectedDate: string,
  view: "day" | "week" | "month"
): string {
  if (!selectedDate) return "All dates";

  const date = new Date(`${selectedDate}T12:00:00`);

  if (view === "day") {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (view === "week") {
    const start = new Date(date);
    const daysFromMonday = (start.getDay() + 6) % 7;

    start.setDate(start.getDate() - daysFromMonday);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const format = (d: Date) =>
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    return `${format(start)} – ${format(end)}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}


export function HazardPendingDateFilter({
  data,
}: HazardPendingDateFilterProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [view, setView] = useState<DateView>("day");

  const filteredData = useMemo(() => {
    if (!selectedDate) return data;

    const selected = new Date(`${selectedDate}T00:00:00`);
    const start = new Date(selected);
    const end = new Date(selected);

    if (view === "day") {
      end.setDate(end.getDate() + 1);
    } else if (view === "week") {
      // Week starts on Monday.
      const daysFromMonday = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - daysFromMonday);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 7);
    } else {
      // Selected calendar month.
      start.setDate(1);
      end.setFullYear(end.getFullYear(), end.getMonth() + 1, 1);
    }

    return data.filter((hazard) => {
      if (!hazard.created_at) return false;

      const created = new Date(hazard.created_at);

      return created >= start && created < end;
    });
  }, [data, selectedDate, view]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <div className="space-y-2">
          <label htmlFor="pending-date" className="block text-sm font-medium">
            Filter by date
          </label>
          <input
            id="pending-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          />
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium">View</span>
          <div className="flex gap-2">
            {(["day", "week", "month"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                className={`rounded-md border px-4 py-2 text-sm capitalize ${
                  view === option
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedDate("");
            setView("day");
          }}
          className="h-10 rounded-md border px-4 text-sm hover:bg-muted"
        >
          Clear filter
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          Filtered period: {getFilterLabel(selectedDate, view)}
        </p>

        <p className="text-sm text-muted-foreground">
          {view.charAt(0).toUpperCase() + view.slice(1)} view
          {" · "}
          Showing {filteredData.length} of {data.length} pending requests
        </p>
      </div>

      <HazardDataTable columns={hazardColumns} data={filteredData} />
    </div>
  );
}
