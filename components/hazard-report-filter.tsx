"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import * as Popover from "@radix-ui/react-popover";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { DayPicker } from "react-day-picker";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, Loader2 } from "lucide-react";

import {
  getHazardReportStats,
  type HazardReportItem,
  type HazardReportStats,
} from "@/app/(protected)/admin/actions/report-actions";

import "react-day-picker/style.css";

type ReportPeriod = "day" | "week" | "month";

const initialStats: HazardReportStats = {
  total: 0,
  pending: 0,
  approved: 0,
  underMaintenance: 0,
  resolved: 0,
};

function formatStatus(status: string) {
  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-blue-100 text-blue-800";
    case "under-maintenance":
      return "bg-orange-100 text-orange-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function HazardReportsFilter() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [period, setPeriod] = useState<ReportPeriod>("day");
  const [stats, setStats] = useState(initialStats);
  const [reports, setReports] = useState<HazardReportItem[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return reports;

    return reports.filter((report) =>
      [
        String(report.id),
        report.title,
        report.status,
        formatStatus(report.status),
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [reports, searchTerm]);

  useEffect(() => {
    let start: Date;
    let end: Date;

    if (period === "day") {
      start = startOfDay(selectedDate);
      end = addDays(start, 1);
    } else if (period === "week") {
      start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      end = addWeeks(start, 1);
    } else {
      start = startOfMonth(selectedDate);
      end = addMonths(start, 1);
    }

    let cancelled = false;

    startTransition(async () => {
      try {
        setError("");

        const result = await getHazardReportStats(
          start.toISOString(),
          end.toISOString(),
        );

        if (!cancelled) {
          setStats(result.stats);
          setReports(result.reports);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load reports. Please try again.");
          setReports([]);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, period]);

  const periodLabel =
    period === "day"
      ? format(selectedDate, "MMMM d, yyyy")
      : period === "week"
      ? `${format(
          startOfWeek(selectedDate, { weekStartsOn: 1 }),
          "MMM d, yyyy",
        )} – ${format(
          addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6),
          "MMM d, yyyy",
        )}`
      : format(selectedDate, "MMMM yyyy");

  const cards = [
    { label: "Total Hazards", value: stats.total },
    { label: "Pending", value: stats.pending },
    { label: "Approved", value: stats.approved },
    { label: "Under Maintenance", value: stats.underMaintenance },
    { label: "Resolved", value: stats.resolved },
  ];

  return (
    <section className="mt-8 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Reports</h2>
        <p className="text-sm text-muted-foreground">
          Filter hazard reports by day, week, or month.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ToggleGroup.Root
          type="single"
          value={period}
          onValueChange={(value) => {
            if (value === "day" || value === "week" || value === "month") {
              setPeriod(value);
            }
          }}
          aria-label="Report period"
          className="inline-flex rounded-lg border p-1"
        >
          {(["day", "week", "month"] as const).map((item) => (
            <ToggleGroup.Item
              key={item}
              value={item}
              className="rounded-md px-4 py-2 text-sm capitalize transition-colors
                hover:bg-muted
                data-[state=on]:bg-primary
                data-[state=on]:text-primary-foreground
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring"
            >
              {item}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>

        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              <CalendarDays className="h-4 w-4" />
              {format(selectedDate, "MMM d, yyyy")}
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              sideOffset={8}
              align="end"
              className="z-50 rounded-lg border bg-background p-3 shadow-md"
            >
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) setSelectedDate(date);
                }}
                defaultMonth={selectedDate}
                showOutsideDays
              />
              <Popover.Arrow className="fill-border" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing reports for:{" "}
        <span className="font-medium text-foreground">{periodLabel}</span>
      </p>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                card.value
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Individual hazard reports table */}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold">Hazard Report Records</h3>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search ID, hazard, or status..."
              aria-label="Search hazard report records"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:w-72"
            />

            <p className="whitespace-nowrap text-sm text-muted-foreground">
              {isPending
                ? "Loading records..."
                : `${filteredReports.length} of ${reports.length} records`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">Ticket Number</th>
                <th className="px-4 py-3 font-medium">Hazard</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date Created</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {isPending ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    <span className="mt-2 block text-muted-foreground">
                      Loading hazard reports...
                    </span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-destructive"
                  >
                    Unable to load records.
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    {searchTerm.trim()
                      ? "No matching hazard reports found."
                      : "No hazard reports found for this period."}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                      {report.id}
                    </td>

                    <td className="min-w-48 px-4 py-3 font-medium">
                      {report.title}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(
                          report.status,
                        )}`}
                      >
                        {formatStatus(report.status)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {report.createdAt
                        ? format(
                            new Date(report.createdAt),
                            "MMM d, yyyy h:mm a",
                          )
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
