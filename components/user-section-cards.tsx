import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import pendingIcon from "@/assets/file.png";
import approvedIcon from "@/assets/stamp.png";
import underMaintenanceIcon from "@/assets/under-construction-sign.png";
import resolvedIcon from "@/assets/error.png";


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

};

async function getStats(): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    return {
      pending: 0,
      approved: 0,
      underMaintenance: 0,
      resolved: 0,
    };
  }

  const [
    { count: pending },
    { count: approved },
    { count: maintenance },
    { count: resolved },
  ] = await Promise.all([
    supabase
      .from("hazards")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .eq("status", "pending"),

    supabase
      .from("hazards")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .eq("status", "approved"),

    supabase
      .from("hazards")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .eq("status", "under-maintenance"),

    supabase
      .from("hazards")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .eq("status", "resolved"),
  ]);

  return {
    pending: pending ?? 0,
    approved: approved ?? 0,
    underMaintenance: maintenance ?? 0,
    resolved: resolved ?? 0,
  };
}

export async function UserSectionCards() {
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
   
      
    </div>
  );
}