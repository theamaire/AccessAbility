import L from "leaflet";

function icon(color: string) {
  return new L.DivIcon({
    className: "",
    html: `
      <div
        style="
          width:22px;
          height:22px;
          background:${color};
          border-radius:9999px;
          border:4px solid white;
          box-shadow:
            0 0 0 2px rgba(0,0,0,0.75),
            0 0 14px ${color},
            0 0 24px ${color};
        "
      ></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export const hazardIconMap: Record<string, L.DivIcon> = {
  Electrical: icon("#facc15"),
  Structural: icon("#ef4444"),
  Transportation: icon("#3b82f6"),
  "Water/Drainage": icon("#06b6d4"),
  "Public Safety": icon("#f97316"),
  Communication: icon("#a855f7"),
  Other: icon("#9ca3af"),
};

export const selectedIcon = new L.DivIcon({
  className: "",
  html: `
    <div
      style="
        width:28px;
        height:28px;
        background:#ff0000;
        border-radius:9999px;
        border:5px solid white;
        box-shadow:
          0 0 0 3px rgba(0,0,0,0.85),
          0 0 18px #ff0000,
          0 0 32px #ff0000;
        animation:pulse-marker 1.5s infinite;
      "
    ></div>

    <style>
      @keyframes pulse-marker {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.18);
        }
        100% {
          transform: scale(1);
        }
      }
    </style>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});