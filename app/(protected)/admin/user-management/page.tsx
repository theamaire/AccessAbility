

import {  Profile } from "@/types/hazard";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { ProfileDataTable } from "@/components/user-management-table/data-table";
import { profileColumns } from "@/components/user-management-table/columns";


async function getData(): Promise<Profile[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Profile[]
}

export default async function UserManagementPage() {
  const data = await getData();

  return (
    <>
      <div className="container mx-auto py-10">
       
        <h1 className="text-xl font-bold">User Management</h1>
        <ProfileDataTable columns={profileColumns} data={data} />
        
      </div>
    </>
  );
}
