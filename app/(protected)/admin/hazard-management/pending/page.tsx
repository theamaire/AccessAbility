
import { HazardPendingDateFilter } from "@/app/(protected)/admin/actions/hazard-pending-date-filter";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { Hazard } from "@/types/hazard";

async function getData(): Promise<Hazard[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("hazards")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Hazard[];
}



export default async function HazardPendingPage() {
  const data = await getData();

  return (
    <div className="container mx-auto space-y-5 py-10">
      <h1 className="text-xl font-bold">Pending Request</h1>
      <HazardPendingDateFilter data={data} />
    </div>
  );
}
