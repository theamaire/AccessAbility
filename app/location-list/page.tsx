"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";


const Map = dynamic(
  () => import("../../components/map-location-list"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner />
      </div>
    ),
  },
);

export default function LocationPage() {

  return (
    <div className="w-full h-full relative">
      <Map />
    </div>
  );
}