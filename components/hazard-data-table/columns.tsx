"use client";

import * as React from "react";
import { format } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import dynamic from "next/dynamic";

import { Hazard } from "@/types/hazard";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../ui/field";

const hazardUpdateSchema = z.object({
  title: z.string().min(3, "Title is required"),
  location: z.string().min(3, "Location is required"),
  hazard_type: z.enum([
    "Electrical",
    "Structural",
    "Transportation",
    "Water/Drainage",
    "Public Safety",
    "Communication",
    "Other",
  ]),
  description: z.string().min(10, "Description is too short"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  status: z.enum(["pending", "approved", "under-maintenance", "resolved"]),
  started_at: z.date().nullable(),
  resolved_at: z.date().nullable(),
});

type HazardUpdateValues = z.infer<typeof hazardUpdateSchema>;

function ActionsCell({ hazard }: { hazard: Hazard }) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [preview, setPreview] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const fetchImage = async () => {
      const { data, error } = await supabase
        .from("images")
        .select("url")
        .eq("hazard_id", hazard.hazard_id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.log("Image fetch error:", error.message);
        return;
      }

      if (data?.url) {
        setPreview(data.url);
      }
    };

    fetchImage();
  }, [hazard.hazard_id]);

  React.useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("profile_id", user.id)
        .single();

      setIsAdmin(data?.role === "admin");
    };

    fetchUserRole();
  }, []);

  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
  } | null>({
    lat: hazard.latitude,
    lng: hazard.longitude,
  });

  const MapWithNoSSR = dynamic(() => import("../map"), {
    ssr: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HazardUpdateValues>({
    resolver: zodResolver(hazardUpdateSchema),
    defaultValues: {
      title: hazard.title,
      location: hazard.location,
      hazard_type: hazard.hazard_type,
      description: hazard.description,
      latitude: hazard.latitude,
      longitude: hazard.longitude,
      status: hazard.status,
      started_at: hazard.started_at ? new Date(hazard.started_at) : null,
      resolved_at: hazard.resolved_at ? new Date(hazard.resolved_at) : null,
    },
  });

  const [isAdmin, setIsAdmin] = useState(false);

  const status = watch("status");
  const startDate = watch("started_at");
  const resolvedDate = watch("resolved_at");

  const isStartDateRequiredButMissing = status === "resolved" && !startDate;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const handleCoordsChange = (value: { lat: number; lng: number }) => {
    setCoords(value);

    setValue("latitude", value.lat);
    setValue("longitude", value.lng);
  };

  const resetFormValues = async () => {
    reset({
      title: hazard.title,
      location: hazard.location,
      hazard_type: hazard.hazard_type,
      description: hazard.description,
      latitude: hazard.latitude,
      longitude: hazard.longitude,
      status: hazard.status,
      started_at: hazard.started_at ? new Date(hazard.started_at) : null,
      resolved_at: hazard.resolved_at ? new Date(hazard.resolved_at) : null,
    });

    setCoords({
      lat: hazard.latitude,
      lng: hazard.longitude,
    });

    const { data } = await supabase
      .from("images")
      .select("url")
      .eq("hazard_id", hazard.hazard_id)
      .limit(1)
      .maybeSingle();

    setPreview(data?.url ?? null);

    setIsEditing(false);
  };

  const handleUpdate = async (data: HazardUpdateValues) => {
    try {
      if (data.status === "under-maintenance" && !data.started_at) {
        toast.error("Start date is required for under-maintenance status");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      if (
        data.status === "resolved" &&
        (!data.started_at || !data.resolved_at)
      ) {
        toast.error("Start and resolved dates are required for resolve status");
        return;
      }

      let newImageUrl: string | null = null;

      const { data: currentImage } = await supabase
        .from("images")
        .select("*")
        .eq("hazard_id", hazard.hazard_id)
        .maybeSingle();

      const cameraFile = cameraInputRef.current?.files?.[0];
      const galleryFile = galleryInputRef.current?.files?.[0];

      const file = cameraFile ?? galleryFile;

      if (!file) {
        console.log("No image selected");
      }

      if (file) {
        let oldFileName: string | null = null;

        if (currentImage?.url) {
          const urlParts = currentImage.url.split("/");

          oldFileName = urlParts[urlParts.length - 1];
        }

        const fileName = `${user.id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, file);

        if (uploadError) {
          toast.error("Image upload failed", {
            description: uploadError.message,
          });

          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(fileName);

        newImageUrl = publicUrl;

        if (oldFileName) {
          const { error: deleteError } = await supabase.storage
            .from("images")
            .remove([oldFileName]);

          if (deleteError) {
            console.log("Old image delete failed:", deleteError.message);
          }
        }

        if (currentImage) {
          const { error: imageUpdateError } = await supabase
            .from("images")
            .update({
              url: publicUrl,
            } as never)
            .eq("hazard_id", hazard.hazard_id);

          if (imageUpdateError) {
            toast.error("Failed updating image", {
              description: imageUpdateError.message,
            });

            return;
          }
        } else {
          const { error: insertError } = await supabase.from("images").insert({
            hazard_id: hazard.hazard_id,
            url: publicUrl,
          });

          if (insertError) {
            toast.error("Failed saving image", {
              description: insertError.message,
            });

            return;
          }
        }
      }

      const { error } = await supabase
        .from("hazards")
        .update({
          title: data.title,
          location: data.location,
          hazard_type: data.hazard_type,
          description: data.description,
          latitude: coords?.lat ?? data.latitude,
          longitude: coords?.lng ?? data.longitude,
          status: data.status,
          started_at: data.started_at,
          resolved_at: data.resolved_at,
        } as never)
        .eq("hazard_id", hazard.hazard_id);

      if (error) {
        toast.error("Update failed", {
          description: error.message,
        });

        return;
      }

      toast.success("Hazard updated successfully", {
        description: `${data.title} has been saved`,
      });

      setIsEditing(false);
      setIsOpen(false);

      router.refresh();
    } catch (error: any) {
      toast.error("Something went wrong", {
        description: error.message,
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const { data: images, error: fetchError } = await supabase
        .from("images")
        .select("url")
        .eq("hazard_id", hazard.hazard_id);

      if (fetchError) throw fetchError;

      const fileNames =
        images
          ?.map((img) => {
            if (!img.url) return null;

            const urlParts = img.url.split("/");
            return urlParts[urlParts.length - 1];
          })
          .filter((name): name is string => name !== null) || [];

      if (fileNames.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("images")
          .remove(fileNames);

        if (storageError) throw storageError;
      }

      const { error } = await supabase
        .from("hazards")
        .delete()
        .eq("hazard_id", hazard.hazard_id);

      if (error) throw error;

      toast.success("Hazard deleted successfully", {
        description: `${hazard.title} was removed`,
      });

      setIsDeleteOpen(false);

      router.refresh();
    } catch (error: any) {
      toast.error("Delete failed", {
        description: error.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        <Dialog
          open={isOpen}
          onOpenChange={async (open) => {
            setIsOpen(open);

            if (!open) {
              await resetFormValues();
            }
          }}
        >
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();

              reset({
                title: hazard.title,
                location: hazard.location,
                hazard_type: hazard.hazard_type,
                description: hazard.description,
                latitude: hazard.latitude,
                longitude: hazard.longitude,
                status: hazard.status,
                started_at: hazard.started_at
                  ? new Date(hazard.started_at)
                  : null,
                resolved_at: hazard.resolved_at
                  ? new Date(hazard.resolved_at)
                  : null,
              });

              setCoords({
                lat: hazard.latitude,
                lng: hazard.longitude,
              });

              setIsEditing(false);
              setIsOpen(true);
            }}
          >
            View / Edit Hazard
          </DropdownMenuItem>

          <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Hazard</DialogTitle>

              <DialogDescription>
                Update hazard details below.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(handleUpdate)}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto pr-2">
                <FieldGroup className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Image</FieldLabel>

                      {/* Hidden Camera Input */}
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleImageChange}
                      />

                      {/* Hidden Gallery Input */}
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!isEditing}
                          onClick={() => cameraInputRef.current?.click()}
                        >
                          📷 Take Photo
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={!isEditing}
                          onClick={() => galleryInputRef.current?.click()}
                        >
                          🖼️ Upload Image
                        </Button>
                      </div>

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
                    </Field>

                    <Field>
                      <FieldLabel>Pick Location</FieldLabel>

                      <div className="h-64 w-full border rounded-md overflow-hidden">
                        <MapWithNoSSR
                          coords={coords}
                          setCoords={isEditing ? handleCoordsChange : undefined}
                          clickable={true}
                        />
                      </div>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Title</FieldLabel>

                    <Input {...register("title")} disabled={!isEditing} />
                  </Field>

                  <Field>
                    <FieldLabel>Hazard Type</FieldLabel>

                    <select
                      {...register("hazard_type")}
                      disabled={!isEditing}
                      className="w-full border p-2 rounded-md disabled:opacity-70"
                    >
                      <option value="Electrical">Electrical</option>

                      <option value="Structural">Structural</option>

                      <option value="Transportation">Transportation</option>

                      <option value="Water/Drainage">Water/Drainage</option>

                      <option value="Public Safety">Public Safety</option>

                      <option value="Communication">Communication</option>

                      <option value="Other">Other</option>
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel>Description</FieldLabel>

                    <textarea
                      {...register("description")}
                      disabled={!isEditing}
                      className="w-full border p-2 rounded-md disabled:opacity-70"
                    />
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Status</FieldLabel>

                      <select
                        {...register("status")}
                        disabled={!isEditing || !isAdmin}
                        className="w-full border p-2 rounded-md disabled:opacity-70"
                      >
                        <option value="pending">Pending</option>

                        <option value="approved">Approved</option>

                        <option value="under-maintenance">
                          Under-Maintenance
                        </option>

                        <option value="resolved">Resolved</option>
                      </select>
                    </Field>

                    {(status === "under-maintenance" ||
                      status === "resolved") && (
                      <Field>
                        <FieldLabel>Start Date</FieldLabel>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              className="w-full"
                              variant="outline"
                              disabled={!isEditing}
                            >
                              {startDate
                                ? format(startDate, "PPP")
                                : "Pick date"}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent>
                            <Calendar
                              mode="single"
                              selected={startDate ?? undefined}
                              onSelect={(v) =>
                                setValue("started_at", v ?? null)
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </Field>
                    )}

                    {status === "resolved" && (
                      <Field>
                        <FieldLabel>Resolved Date</FieldLabel>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              className="w-full"
                              variant="outline"
                              disabled={!isEditing}
                            >
                              {resolvedDate
                                ? format(resolvedDate, "PPP")
                                : "Pick date"}
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent>
                            <Calendar
                              mode="single"
                              selected={resolvedDate ?? undefined}
                              onSelect={(v) =>
                                setValue("resolved_at", v ?? null)
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </Field>
                    )}
                  </div>
                </FieldGroup>
              </div>

              <DialogFooter className="gap-2">
                {isStartDateRequiredButMissing && isEditing && (
                  <p className="text-sm text-red-500 mt-1">
                    Start date required before approving
                  </p>
                )}

                {!isEditing ? (
                  <>
                    <Button type="button" onClick={() => setIsEditing(true)}>
                      Edit
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetFormValues}
                    >
                      Cancel Edit
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSubmitting || isStartDateRequiredButMissing}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <DropdownMenuSeparator />

        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{hazard.title}</span>? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const hazardColumns: ColumnDef<Hazard>[] = [
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
