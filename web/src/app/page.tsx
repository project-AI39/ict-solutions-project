// Leaflet を使った地図表示の動作確認用コード
"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function Home() {
  // react-leaflet uses browser APIs; ensure client-only
  useEffect(() => {
    // no-op, just to confirm this runs on client
  }, []);

  return (
    <main style={{ width: "100%", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: 800, height: 600 }}>
        <MapContainer center={[35.6895, 139.6917]} zoom={13} style={{ width: "100%", height: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        </MapContainer>
      </div>
    </main>
  );
}
