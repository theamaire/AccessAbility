
import { HazardDataTable } from "@/components/hazard-data-table/data-table";
import { UserHazardColumns } from "@/components/hazard-data-table/user-columns";
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
    .eq("status", "resolved")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Hazard[];
}

export default async function UserHazardResolvedPage() {
  const data = await getData();

  return (
    <>
      <div className="container mx-auto py-10">
        <h1 className="text-xl font-bold">Resolved Hazards</h1>
        <HazardDataTable columns={UserHazardColumns} data={data} />
      </div>
    </>
  );
}
