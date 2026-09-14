"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import Image from "next/image";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { Spinner } from "../ui/spinner";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { toast } from "sonner";

/* MAP */
const MapWithNoSSR = dynamic(
  () => import("../map"),
  {
    ssr: false,
    loading: () => (
      <div className="flex w-full h-full items-center justify-center">
        <Spinner />
      </div>
    ),
  },
);


const hazardSchema = z.object({
  title: z.string().min(3),

  hazard_type: z.enum([
    "Electrical",
    "Structural",
    "Transportation",
    "Water/Drainage",
    "Public Safety",
    "Communication",
    "Other",
  ]),

  location: z.string().min(3),

  description: z.string().min(10),

  status: z.literal("pending"),

  latitude: z.number(),
  longitude: z.number(),
});

type HazardFormValues = z.infer<typeof hazardSchema>;

export function CreateHazard() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  /* ✅ SINGLE LOCATION ONLY */
  const [coords, setCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HazardFormValues>({
    resolver: zodResolver(hazardSchema),
    defaultValues: {
      status: "pending",
    },
  });

  const canShowDetails = preview && coords;

  /* IMAGE */
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
  };


  const clearForm = () => {
    reset({
      status: "pending",
      title: "",
      hazard_type: undefined as any,
      location: "",
      description: "",
      latitude: 0,
      longitude: 0,
    });

    setPreview(null);
    setCoords(null);

    const fileInput =
      document.querySelector<HTMLInputElement>("#image");

    if (fileInput) fileInput.value = "";
  };

 
  const onSubmit = async (data: HazardFormValues) => {
    try {
      const supabase = getSupabaseBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      const fileInput =
        document.querySelector<HTMLInputElement>(
          "#image",
        )?.files?.[0];

      let imageUrl: string | null = null;

      if (fileInput) {
        const fileName = `${user.id}/${Date.now()}-${fileInput.name}`;

        const { error: uploadError } =
          await supabase.storage
            .from("images")
            .upload(fileName, fileInput);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } =
          supabase.storage
            .from("images")
            .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

    
      const { data: hazard, error } =
        await supabase
          .from("hazards")
          .insert({
            ...data,
            profile_id: user.id,
            latitude: coords?.lat ?? null,
            longitude: coords?.lng ?? null,
          } as never)
          .select()
          .single();

      if (error) throw error;

    
      if (imageUrl) {
        const { error: imageError } =
          await supabase.from("images").insert({
            hazard_id: hazard.hazard_id,
            url: imageUrl,
          });

        if (imageError) throw imageError;
      }

      toast.success("Hazard created successfully");

      clearForm();
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error("Failed to create hazard", {
        description: err.message,
      });
    }
  };


  const handleCoordsChange = (value: {
    lat: number;
    lng: number;
  }) => {
    const single = {
      lat: value.lat,
      lng: value.lng,
    };

    setCoords(single);

    setValue("latitude", single.lat);
    setValue("longitude", single.lng);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Create Request
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Hazard Request</DialogTitle>
          <DialogDescription>
            Select ONE location, upload image, and submit.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto pr-2">
            <FieldGroup className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

           
                <Field>
                  <FieldLabel>Image</FieldLabel>

                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                  />

                  {preview && (
                    <div className="relative mt-2 w-full h-48 rounded-md border overflow-hidden">
                      <Image
                        src={preview}
                        alt="preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </Field>

               
                <Field>
                  <FieldLabel>Pick ONE Location</FieldLabel>

                  <div className="h-64 w-full border rounded-md overflow-hidden">
                    <MapWithNoSSR
                      mode="single"
                      coords={coords}
                      setCoords={handleCoordsChange}
                    />
                  </div>

                  {coords && (
                    <p className="text-xs mt-1 text-gray-500">
                      Lat: {coords.lat.toFixed(6)} | Lng:{" "}
                      {coords.lng.toFixed(6)}
                    </p>
                  )}
                </Field>
              </div>

           
              {canShowDetails && (
                <div className="space-y-4 border-t pt-4">

                  <Field>
                    <FieldLabel>Title</FieldLabel>
                    <Input {...register("title")} />
                  </Field>

                  <Field>
                    <FieldLabel>Type</FieldLabel>
                    <select
                      className="w-full border rounded-md px-3 py-2"
                      {...register("hazard_type")}
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
                    <FieldLabel>Location Name</FieldLabel>
                    <Input {...register("location")} />
                  </Field>

                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      className="w-full border rounded-md px-3 py-2 min-h-28"
                      {...register("description")}
                    />
                  </Field>

                  <input type="hidden" {...register("status")} />
                </div>
              )}
            </FieldGroup>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}