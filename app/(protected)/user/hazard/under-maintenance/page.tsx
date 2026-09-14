import { hazardColumns } from "@/components/hazard-data-table/columns";
import { HazardDataTable } from "@/components/hazard-data-table/data-table";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

import { Hazard } from "@/types/hazard";

async function getData(): Promise<Hazard[]> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) return [];

  const { data, error } = await supabase
    .from("hazards")
    .select("*")
    .eq("status", "under-maintenance")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Hazard[];
}

export default async function UserHazardMaintenancePage() {
  const data = await getData();

  return (
    <>
      <div className="container mx-auto py-10">
        <h1 className="text-xl font-bold">Under-Maintenance Hazards</h1>
        <HazardDataTable columns={hazardColumns} data={data} />
      </div>
    </>
  );
}
