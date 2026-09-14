"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  ZoomControl,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// fix icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

type Coord = { lat: number; lng: number };

function LocationPicker({
  mode,
  setCoords,
  clickable,
}: {
  mode: "single" | "multi";
  setCoords: any;
  clickable: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!clickable) return;

      const point = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };

      if (mode === "single") {
        setCoords(point);
      } else {
        setCoords((prev: Coord[]) => [...prev, point]);
      }
    },
  });

  return null;
}

export default function Map({
  coords,
  setCoords,
  mode = "single",
  clickable = true,
}: {
  coords: Coord | Coord[] | null;
  setCoords: any;
  mode?: "single" | "multi";
  clickable?: boolean;
}) {
  const isArray = Array.isArray(coords);

  return (
    <MapContainer
      center={[11.6083, 125.4319]}
      zoom={13}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      zoomControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ZoomControl position="topright" />

      <LocationPicker
        mode={mode}
        setCoords={setCoords}
        clickable={clickable}
      />

      {mode === "single" && coords && !isArray && (
        <Marker position={[coords.lat, coords.lng]} />
      )}

      {mode === "multi" &&
        isArray &&
        coords.map((c, i) => (
          <Marker key={i} position={[c.lat, c.lng]} />
        ))}
    </MapContainer>
  );
}