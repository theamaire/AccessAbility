"use client";

import icon from "@/assets/icon.png";
import {
  Bot,
  Command,
  Settings2,
  SquareTerminal,
  Building2,
} from "lucide-react";

import { NavAdmin } from "@/components/nav-admin";
import { NavUser } from "@/components/nav-user";
import { NavProfile } from "@/components/nav-profile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { CreateHazard } from "./create-hazard-dialog/create-hazard";
import Image from "next/image";

const data = {
  user: {
    name: "",
    email: "",
    avatar: "",
  },
  adminnavigation: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Hazards",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Pending",
          url: "/admin/hazard-management/pending",
        },
        {
          title: "Approved",
          url: "/admin/hazard-management/approved",
        },
        {
          title: "Under-Maintenance",
          url: "/admin/hazard-management/under-maintenance",
        },
        {
          title: "Resolved",
          url: "/admin/hazard-management/resolved",
        },
      ],
    },
    {
      title: "User Management",
      url: "/admin/user-management",
      icon: Bot,
    },
  ],
  usernavigation: [
    {
      title: "User Dashboard",
      url: "/user",
      icon: Settings2,
    },
    {
      title: "Hazard Request",
      url: "#",
      icon: Building2,
      isActive: true,
      items: [
        {
          title: "Pending",
          url: "/user/hazard/pending",
        },
        {
          title: "Approved",
          url: "/user/hazard/approved",
        },
        {
          title: "Under-Maintenance",
          url: "/user/hazard/under-maintenance",
        },
        {
          title: "Resolved",
          url: "/user/hazard/resolved",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setcurrentUser] = useState<{
    name?: string;
    email?: string;
    avatar?: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("profile_id", user.id)
          .single();

        setcurrentUser({
          name: profile?.full_name || "",
          email: profile?.email || "",
          avatar: user.user_metadata?.avatar_url || "",
          role: profile?.role || "",
        });


      }
    };

    fetchUser();
  }, [supabase]);



  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/location-list">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg ">
                  <Image
                    src={icon}
                    width={32}
                    height={32}
                    alt="AccessAbility"
                    className="size-full object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">AccessAbility</span>
                  <span className="truncate text-xs">System</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {currentUser?.role == "admin" && (
          <NavAdmin adminNav={data.adminnavigation} />
        )}
        {currentUser?.role == "user" && (
          <NavUser userNav={data.usernavigation} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <CreateHazard />
        <NavProfile user={currentUser || {}} />
      </SidebarFooter>
    </Sidebar>
  );
}
