import { createSupabaseServerClient } from "@/lib/supabase/server-client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardStats = {
  pending: number;
  approved: number;
  underMaintenance: number;
  resolved: number;
  totalUsers: number;
};

async function getStats(): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient();

  const [{ count: pending }, { count: approved }, { count: maintenance }, { count: resolved }, { count: users }] =
    await Promise.all([
      supabase.from("hazards").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("hazards").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("hazards").select("*", { count: "exact", head: true }).eq("status", "under-maintenance"),
      supabase.from("hazards").select("*", { count: "exact", head: true }).eq("status", "resolved"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
    ]);

  return {
    pending: pending ?? 0,
    approved: approved ?? 0,
    underMaintenance: maintenance ?? 0,
    resolved: resolved ?? 0,
    totalUsers: users ?? 0,
  };
}

export async function AdminSectionCards() {
  const stats = await getStats();

  return (
     <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-5 dark:*:data-[slot=card]:bg-card">

       <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Request</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.pending}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Approved Request</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.approved}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Under-Maintenance Hazards</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.underMaintenance}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Resolved Hazards</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.resolved}</CardTitle>
        </CardHeader>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{stats.totalUsers}</CardTitle>
        </CardHeader>
      </Card>


    </div>
  );
}