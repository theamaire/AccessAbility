"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";

import { useEffect } from "react";
import L from "leaflet";

import { useMapContext } from "@/contexts/map-context";
import { hazardIconMap, selectedIcon } from "@/lib/hazard-icons";

import "leaflet/dist/leaflet.css";
import Image from "next/image";
import { Badge } from "./ui/badge";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FlyToSelected() {
  const map = useMap();
  const { selectedHazard } = useMapContext();

  useEffect(() => {
    if (selectedHazard) {
      map.flyTo([selectedHazard.latitude, selectedHazard.longitude], 17, {
        duration: 1,
      });
    }
  }, [selectedHazard, map]);

  return null;
}

export default function Map() {
  const { hazards, selectedHazard, setSelectedHazard } = useMapContext();

  return (
    <MapContainer
      center={[11.6087, 125.4315]}
      zoom={14}
      className="w-full h-full z-1"
      zoomControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ZoomControl position="topright" />
      {hazards.map((h) => {
        const isSelected = selectedHazard?.hazard_id === h.hazard_id;

        return (
          <Marker
            key={h.hazard_id}
            position={[h.latitude, h.longitude]}
            icon={isSelected ? selectedIcon : hazardIconMap[h.hazard_type]}
            eventHandlers={{
              click: () => {
                setSelectedHazard(h);
              },
            }}
          >
            {isSelected && (
              <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                <div className="w-[200px] space-y-2">
                  {h.images?.[0]?.url && (
                    <Image
                      alt={h.title}
                      src={h.images[0].url}
                      className="w-full h-[90px] object-cover rounded-md"
                      width={300}
                      height={300}
                      sizes="220px"
                    />
                  )}

                  <div className="text-sm font-bold">{h.title}</div>

                  <div className="text-[11px] text-gray-600">
                    <Badge variant="outline">{h.hazard_type}</Badge>
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    📍 {h.location}
                  </div>

                  {h.description && (
                    <div className="text-[11px]">{h.description}</div>
                  )}

                  {h.status == "under-maintenance" && (
                    <div className="text-[11px]">
                      <Badge variant="destructive">{h.status}</Badge>
                      <div className="text-[11px]">Maintenance Started: {h.started_at}</div>
                    </div>
                  )}
                </div>
              </Tooltip>
            )}
          </Marker>
        );
      })}

      <FlyToSelected />
    </MapContainer>
  );
}
