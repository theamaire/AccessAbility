import { createSupabaseServerClient } from "@/lib/supabase/server-client";

import pendingIcon from "@/assets/file.png";
import approvedIcon from "@/assets/stamp.png";
import underMaintenanceIcon from "@/assets/under-construction-sign.png";
import resolvedIcon from "@/assets/error.png";
import usersIcon from "@/assets/user.png";
import adminsIcon from "@/assets/admin-panel.png";
import totalUsersIcon from "@/assets/team.png";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

type DashboardStats = {
  pending: number;
  approved: number;
  underMaintenance: number;
  resolved: number;
  users: number;
  admins: number;
  totalUsers: number;
};

async function getStats(): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient();
  const sample = await supabase.from("profiles").select("*");

  console.log("Sample count:", sample);

  const [
    { count: pending },
    { count: approved },
    { count: maintenance },
    { count: resolved },
    { count: users },
    { count: admins },
    { count: totalUsers },
  ] = await Promise.all([
    supabase
      .from("hazards")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("hazards")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("hazards")
      .select("*", { count: "exact", head: true })
      .eq("status", "under-maintenance"),
    supabase
      .from("hazards")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  return {
    pending: pending ?? 0,
    approved: approved ?? 0,
    underMaintenance: maintenance ?? 0,
    resolved: resolved ?? 0,
    users: users ?? 0,
    admins: admins ?? 0,
    totalUsers: totalUsers ?? 0,
  };
}

export async function AdminSectionCards() {
  const stats = await getStats();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Hazards</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="w-full @container/card">
          <CardHeader className="flex flex-row items-center gap-4">
            <div>
              <Image
                src={pendingIcon}
                width={32}
                height={32}
                alt="Pending Request"
              />
            </div>
            <div>
              <CardDescription>Pending Request</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.pending}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        <Card className="w-full @container/card">
          <CardHeader className="flex flex-row items-center gap-4">
            <div>
              <Image
                src={approvedIcon}
                width={32}
                height={32}
                alt="Approved Request"
              />
            </div>
            <div>
              <CardDescription>Approved Request</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.approved}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

    

        <Card className="w-full @container/card">
          <CardHeader className="flex flex-row items-center gap-4">
            <div>
              <Image
                src={underMaintenanceIcon}
                width={32}
                height={32}
                alt="Under-Maintenance Hazards"
              />
            </div>
            <div>
              <CardDescription>Under-Maintenance</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.underMaintenance}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        <Card className="w-full @container/card">
          <CardHeader className="flex flex-row items-center gap-4">
            <div>
              <Image
                src={resolvedIcon}
                width={32}
                height={32}
                alt="Resolved Hazards"
              />
            </div>
            <div>
              <CardDescription>Resolved Hazards</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.resolved}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>
      <h1 className="text-lg font-semibold">Users</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="w-full @container/card">
          <CardHeader className="flex flex-row items-center gap-4">
            <div>
              <Image src={usersIcon} width={32} height={32} alt="Users" />
            </div>
            <div>
              <CardDescription>Users</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.users}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        <Card className="w-full @container/card">
          <CardHeader className="flex flex-row items-center gap-4">
            <div>
              <Image src={adminsIcon} width={32} height={32} alt="Admins" />
            </div>
            <div>
              <CardDescription>Admins</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.admins}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>

        <Card className="w-full @container/card">
          <CardHeader className="flex flex-row items-center gap-4">
            <div>
              <Image
                src={totalUsersIcon}
                width={32}
                height={32}
                alt="Total Users"
              />
            </div>
            <div>
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stats.totalUsers}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
