import { AdminSectionCards } from "@/components/admin-section-cards copy";



export default async function AdminPage() {
 

  return (
    <>
      <h1 className="text-xl font-bold">Admin Dashboard</h1>

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <AdminSectionCards/>
          </div>
        </div>
      </div>
    </>
  );
}