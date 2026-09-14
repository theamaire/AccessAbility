"use client";

import {
  createContext,
  useContext,
  useState,
} from "react";

import type { Hazard } from "@/types/hazard";

export type Coordinate = {
  lat: number;
  lng: number;
};

type MapContextType = {
  hazards: Hazard[];
  setHazards: React.Dispatch<
    React.SetStateAction<Hazard[]>
  >;

  selectedHazard: Hazard | null;
  setSelectedHazard: React.Dispatch<
    React.SetStateAction<Hazard | null>
  >;

  coordinates: Coordinate[];
  setCoordinates: React.Dispatch<
    React.SetStateAction<Coordinate[]>
  >;

  selectedType: string;
  setSelectedType: React.Dispatch<
    React.SetStateAction<string>
  >;
};

const MapContext = createContext<
  MapContextType | undefined
>(undefined);

export function MapProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [selectedHazard, setSelectedHazard] =
    useState<Hazard | null>(null);
  const [coordinates, setCoordinates] = useState<
    Coordinate[]
  >([]);
  const [selectedType, setSelectedType] =
    useState("All");

  return (
    <MapContext.Provider
      value={{
        hazards,
        setHazards,
        selectedHazard,
        setSelectedHazard,
        coordinates,
        setCoordinates,
        selectedType,
        setSelectedType,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx)
    throw new Error(
      "useMapContext must be used inside MapProvider",
    );
  return ctx;
}