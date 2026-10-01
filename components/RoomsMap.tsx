"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { mergeRoomEdits } from "@/lib/roomEdits";
import type { Room } from "@/lib/types";

type Props = {
  rooms: Room[];
  live: boolean;
  error?: string;
};

function pinKey(rooms: Room[]): string {
  return rooms
    .map((r) => `${r.slug}:${r.latitude},${r.longitude}`)
    .join("|");
}

export default function RoomsMap({ rooms, live, error }: Props) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const gesturingRef = useRef(false);
  const destroyQueuedRef = useRef(false);
  const pinKeyRef = useRef<string>("");
  const [editTick, setEditTick] = useState(0);
  const [mapReady, setMapReady] = useState(0);

  useEffect(() => {
    const bump = () => setEditTick((t) => t + 1);
    window.addEventListener("poker-room-edits-changed", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("poker-room-edits-changed", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const merged = useMemo(() => {
    void editTick;
    return mergeRoomEdits(rooms);
  }, [rooms, editTick]);

  const pinned = useMemo(
    () => merged.filter((r) => r.latitude != null && r.longitude != null),
    [merged],
  );

  // Create the map once; never tear it down on pin-list identity churn.
  useEffect(() => {
    let cancelled = false;
    let touchEndHandler: (() => void) | null = null;
    let pointerUpHandler: (() => void) | null = null;

    async function init() {
      if (!mapEl.current || mapRef.current) return;
      const L = await import("leaflet");
      // Leaflet CSS (client-only)
      // @ts-expect-error side-effect CSS import
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !mapEl.current || mapRef.current) return;

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

      leafletRef.current = L;

      // Avoid "Map container is being reused" if a prior instance lingered.
      const el = mapEl.current as HTMLElement & { _leaflet_id?: number };
      if (el._leaflet_id) {
        el._leaflet_id = undefined;
        el.innerHTML = "";
      }

      const map = L.map(el, {
        scrollWheelZoom: true,
        worldCopyJump: true,
        preferCanvas: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);

      const markGesture = () => {
        gesturingRef.current = true;
      };
      const clearGesture = () => {
        gesturingRef.current = false;
        if (destroyQueuedRef.current) {
          destroyQueuedRef.current = false;
          try {
            map.remove();
          } catch {
            /* map may already be gone */
          }
          if (mapRef.current === map) mapRef.current = null;
          layerRef.current = null;
        }
      };
      map.on("dragstart zoomstart", markGesture);
      map.on("dragend zoomend", clearGesture);
      touchEndHandler = clearGesture;
      pointerUpHandler = clearGesture;
      map.getContainer().addEventListener("touchend", touchEndHandler, {
        passive: true,
      });
      map.getContainer().addEventListener("pointerup", pointerUpHandler);

      map.setView([39.8283, -98.5795], 4);
      setTimeout(() => map.invalidateSize(), 50);
      setMapReady((n) => n + 1);
    }

    void init();

    return () => {
      cancelled = true;
      const map = mapRef.current;
      if (map && touchEndHandler) {
        map.getContainer().removeEventListener("touchend", touchEndHandler);
      }
      if (map && pointerUpHandler) {
        map.getContainer().removeEventListener("pointerup", pointerUpHandler);
      }
      if (!map) return;
      if (gesturingRef.current) {
        destroyQueuedRef.current = true;
        return;
      }
      try {
        map.remove();
      } catch {
        /* ignore teardown races */
      }
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Sync markers when pin coords/identity actually change — never remount map.
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    const layer = layerRef.current;
    if (!map || !L || !layer) return;

    const nextKey = pinKey(pinned);
    if (nextKey === pinKeyRef.current) return;
    pinKeyRef.current = nextKey;

    layer.clearLayers();
    const bounds: import("leaflet").LatLngExpression[] = [];
    for (const room of pinned) {
      const lat = room.latitude as number;
      const lon = room.longitude as number;
      const pt: import("leaflet").LatLngExpression = [lat, lon];
      bounds.push(pt);
      const marker = L.marker(pt);
      marker.bindTooltip(room.name, { direction: "top", opacity: 0.9 });
      marker.addTo(layer);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 12);
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 8 });
    } else {
      map.setView([39.8283, -98.5795], 4);
    }
    setTimeout(() => map.invalidateSize(), 50);
  }, [pinned, mapReady]);

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
        <div
          ref={mapEl}
          className="map-canvas"
          role="application"
          aria-label="US poker rooms map"
        />
      </div>
    </section>
  );
}
