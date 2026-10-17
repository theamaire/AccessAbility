
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export type HazardReportItem = {
  id: string | number;
  title: string;
  status: string;
  createdAt: string;
};

export type HazardReportStats = {
  total: number;
  pending: number;
  approved: number;
  underMaintenance: number;
  resolved: number;
};

export type HazardReportResult = {
  stats: HazardReportStats;
  reports: HazardReportItem[];
};

export async function getHazardReportStats(
  startDate: string,
  endDate: string
): Promise<HazardReportResult> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start >= end ||
    end.getTime() - start.getTime() > 32 * 24 * 60 * 60 * 1000
  ) {
    throw new Error("Invalid report date range.");
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be signed in to view reports.");
  }

 

  const statuses = [
    "pending",
    "approved",
    "under-maintenance",
    "resolved",
  ] as const;

  const [totalResult, ...statusResults] = await Promise.all([
    supabase
      .from("hazards")
      .select("*", { count: "exact", head: true })
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString()),

    ...statuses.map((status) =>
      supabase
        .from("hazards")
        .select("*", { count: "exact", head: true })
        .eq("status", status)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
    ),
  ]);

  if (
    totalResult.error ||
    statusResults.some((result) => result.error)
  ) {
    throw new Error("Failed to fetch hazard statistics.");
  }

  // Fetch every hazard in the selected period, regardless of status.
  const { data, error } = await supabase
    .from("hazards")
    .select("*")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to fetch hazard reports.");
  }

  const [pending, approved, maintenance, resolved] =
    statusResults.map((result) => result.count ?? 0);

  const reports: HazardReportItem[] = (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;

    const rawId = record.hazard_id;
    const rawTitle =
      record.title ??
      record.name ??
      record.hazard_type ??
      record.description;

    return {
      id:
        typeof rawId === "string" || typeof rawId === "number"
          ? rawId
          : "N/A",
      title:
        typeof rawTitle === "string" && rawTitle.trim()
          ? rawTitle
          : "Hazard report",
      status:
        typeof record.status === "string"
          ? record.status
          : "Unknown",
      createdAt:
        typeof record.created_at === "string"
          ? record.created_at
          : "",
    };
  });

  return {
    stats: {
      total: totalResult.count ?? 0,
      pending,
      approved,
      underMaintenance: maintenance,
      resolved,
    },
    reports,
  };
}
