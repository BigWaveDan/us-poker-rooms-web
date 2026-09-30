"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Room } from "@/lib/types";

type Props = {
  rooms: Room[];
  live: boolean;
  error?: string;
};

export default function RoomsMap({ rooms, live, error }: Props) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const [selected, setSelected] = useState<Room | null>(null);
  const pinned = useMemo(
    () => rooms.filter((r) => r.latitude != null && r.longitude != null),
    [rooms],
  );

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    async function init() {
      if (!mapEl.current || pinned.length === 0) return;
      const L = await import("leaflet");
      // Leaflet CSS (client-only)
      // @ts-expect-error side-effect CSS import
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapEl.current) return;

      // Fix default marker icons under bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      map = L.map(mapEl.current, {
        scrollWheelZoom: true,
        worldCopyJump: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const bounds: import("leaflet").LatLngExpression[] = [];
      for (const room of pinned) {
        const lat = room.latitude as number;
        const lon = room.longitude as number;
        const pt: import("leaflet").LatLngExpression = [lat, lon];
        bounds.push(pt);
        const marker = L.marker(pt);
        marker.bindTooltip(room.name, { direction: "top", opacity: 0.9 });
        marker.on("click", () => setSelected(room));
        marker.addTo(map);
      }

      map.on("click", () => setSelected(null));

      if (bounds.length === 1) {
        map.setView(bounds[0], 12);
      } else if (bounds.length > 1) {
        map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 8 });
      } else {
        map.setView([39.8283, -98.5795], 4);
      }

      // Ensure tiles paint after layout
      setTimeout(() => map?.invalidateSize(), 50);
    }

    void init();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pinned]);

  return (
    <section className="map-section">
      <div className="map-toolbar">
        <div>
          <strong>{pinned.length.toLocaleString()}</strong> rooms with
          coordinates
          {!live && (
            <span className="meta">
              {" "}
              · offline snapshot
              {error ? ` (${error})` : ""}
            </span>
          )}
          {live && <span className="meta"> · live API</span>}
        </div>
      </div>
      <div className="map-wrap">
        <div ref={mapEl} className="map-canvas" role="application" aria-label="US poker rooms map" />
        <aside className="map-pane card">
          {selected ? (
            <>
              <h3>{selected.name}</h3>
              <p className="meta">
                {[selected.address, [selected.city, selected.state].filter(Boolean).join(", ")]
                  .filter(Boolean)
                  .join(" · ") || selected.state}
              </p>
              <p className="meta">{selected.status}</p>
              {selected.phone ? <p className="meta">{selected.phone}</p> : null}
              <p>
                <Link href={`/rooms/${selected.slug}`} className="btn">
                  View details
                </Link>
              </p>
            </>
          ) : (
            <p className="meta">Tap a pin to preview a room.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
