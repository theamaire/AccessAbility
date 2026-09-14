"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import { Button } from "./ui/button";
import { Card, CardContent } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Hazard } from "@/types/hazard";
import { Badge } from "./ui/badge";

import { useMapContext } from "@/contexts/map-context";
import { Command } from "lucide-react";

const hazardTypes = [
  "All",
  "Electrical",
  "Structural",
  "Transportation",
  "Water/Drainage",
  "Public Safety",
  "Communication",
  "Other",
];

const hazardColors: Record<string, string> = {
  Electrical: "bg-yellow-100 text-yellow-700",
  Structural: "bg-red-100 text-red-700",
  Transportation: "bg-blue-100 text-blue-700",
  "Water/Drainage": "bg-cyan-100 text-cyan-700",
  "Public Safety": "bg-orange-100 text-orange-700",
  Communication: "bg-purple-100 text-purple-700",
  Other: "bg-gray-100 text-gray-700",
};

async function getData(type: string): Promise<Hazard[]> {
  const supabase = getSupabaseBrowserClient();

  let query = supabase
    .from("hazards")
    .select(`*, images (*)`)
    .in("status", ["under-maintenance", "approved"])
    .order("created_at", { ascending: false });

  if (type !== "All") {
    query = query.eq("hazard_type", type);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as Hazard[];
}

export function MapSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const [mounted, setMounted] = React.useState(false);

  const [user, setUser] = React.useState<any>(null);

  const supabase = getSupabaseBrowserClient();

  const {
    hazards,
    setHazards,
    selectedHazard,
    setSelectedHazard,
    selectedType,
    setSelectedType,
  } = useMapContext();

  React.useEffect(() => {
    setMounted(true);

    const load = async () => {
      const data = await getData(selectedType);
      setHazards(data);
    };

    load();

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [selectedType]);

  if (!mounted) {
    return (
      <Sidebar {...props} className="w-[360px]">
        <SidebarHeader />
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
    );
  }

  const filtered =
    selectedType === "All"
      ? hazards
      : hazards.filter((h) => h.hazard_type === selectedType);

  return (
    <Sidebar {...props} className="z-[50]">
      <SidebarHeader className="space-y-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/location-list">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">AccessAbility</span>
                  <span className="truncate text-xs">System</span>
                </div>
              </a>
            </SidebarMenuButton>
            <div className="p-3 font-bold text-lg">Hazard List</div>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="px-4">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>

            <SelectContent
              position="popper"
              side="bottom"
              align="start"
              className="z-[9999]"
            >
              {hazardTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 space-y-3 overflow-y-auto">
        {filtered.map((item) => (
          <Card
            key={item.hazard_id}
            className={`cursor-pointer transition ${
              selectedHazard?.hazard_id === item.hazard_id
                ? "border-primary bg-muted/40"
                : ""
            }`}
            onClick={() => {
              setSelectedHazard(item);
            }}
          >
            <CardContent className="p-2 flex gap-3">
              <div className="relative w-[60px] h-[60px]">
                <Image
                  src={item.images?.[0]?.url || "/placeholder.jpg"}
                  alt={item.title}
                  fill
                  className="object-cover rounded-md"
                  sizes="220px"
                />
              </div>

              <div className="flex-1">
                <div className="text-sm font-semibold">{item.title}</div>

                <div className="text-xs text-muted-foreground">
                  {item.location}
                </div>
           
                <Badge className={hazardColors[item.hazard_type]}>
                  {item.hazard_type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="p-4">
        {user ? (
          <Link href="/user">
            <Button className="w-full">Dashboard</Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button className="w-full">Login</Button>
          </Link>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
