"use client";

import * as React from "react";


import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

import Image from "next/image";
import dynamic from "next/dynamic";

import { Hazard } from "@/types/hazard";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

import { Button } from "@/components/ui/button";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,

  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";









function ActionsCell({ hazard }: { hazard: Hazard }) {
  const supabase = getSupabaseBrowserClient();
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchImage = async () => {
      const { data } = await supabase
        .from("images")
        .select("url")
        .eq("hazard_id", hazard.hazard_id)
        .limit(1)
        .maybeSingle();

      if (data?.url) setPreview(data.url);
    };

    fetchImage();
  }, [hazard.hazard_id]);

  const MapWithNoSSR = dynamic(() => import("../map"), {
    ssr: false,
  });

  const coords = {
    lat: hazard.latitude,
    lng: hazard.longitude,
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setIsOpen(true);
            }}
          >
            View Hazard
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hazard Details</DialogTitle>
          <DialogDescription>View-only information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-medium text-sm">Image</p>

              {preview && (
                <>
                  <div className="relative w-full h-48 border rounded-md overflow-hidden">
                    <Image
                      src={preview}
                      alt="hazard"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>

                  <a
                    href={preview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Open full image in new tab
                  </a>
                </>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-medium text-sm">Location</p>

              <div className="h-48 border rounded-md overflow-hidden">
                <MapWithNoSSR mode="single" coords={coords} setCoords={() => {}}/>
              </div>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <div>
              <p className="font-medium">Title</p>
              <p>{hazard.title}</p>
            </div>

            <div>
              <p className="font-medium">Location</p>
              <p>{hazard.location}</p>
            </div>

            <div>
              <p className="font-medium">Type</p>
              <p>{hazard.hazard_type}</p>
            </div>

            <div>
              <p className="font-medium">Status</p>
              <p>{hazard.status}</p>
            </div>

            <div>
              <p className="font-medium">Description</p>
              <p>{hazard.description}</p>
            </div>

            <div>
              <p className="font-medium">Created At</p>
              <p>{new Date(hazard.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const UserHazardColumns: ColumnDef<Hazard>[] = [
  {
    accessorKey: "hazard_id",
    header: "Ticket Number",
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "location",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Location
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "created_at",
    cell: ({ row }) => {
      const dateValue = row.original.created_at;
      if (!dateValue) return "N/A";

      return new Date(dateValue.replace(" ", "T"))
        .toLocaleString("en-US", {
          month: "long",
          day: "2-digit",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .replace(",", " at");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell hazard={row.original} />,
  },
];
