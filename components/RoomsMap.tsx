"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { mergeRoomEdits } from "@/lib/roomEdits";
import type { Room } from "@/lib/types";
import { POKER_ROOM_STATUS_LABELS } from "@/lib/types";
import { STATE_BOUNDS } from "@/lib/stateBounds";
import { US_JURISDICTIONS } from "@/lib/states";

const STATE_NAMES: Record<string, string> = Object.fromEntries(
  US_JURISDICTIONS.map((s) => [s.code, s.name]),
);

function esc(v: unknown): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:" ? x.href : null;
  } catch {
    return null;
  }
}

function link(u: string | null | undefined, label?: string): string {
  const href = safeUrl(u);
  if (!href) return u ? esc(u) : "";
  let text = label;
  if (!text) {
    try {
      const x = new URL(href);
      text = x.host.replace(/^www\./, "") + (x.pathname !== "/" ? x.pathname : "");
    } catch {
      text = href;
    }
  }
  return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;
}

function trunc(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

function popupHtml(room: Room): string {
  const r = room as Room & { tables?: number | null };
  const rows: string[] = [];
  const row = (label: string, html: string) => {
    if (html) rows.push(`<dt>${esc(label)}</dt><dd>${html}</dd>`);
  };
  const type = r.type ? String(r.type).replace(/_/g, " ") : "";
  const st = r.state ? String(r.state).toUpperCase() : "";
  const stLink = st
    ? STATE_BOUNDS[st]
      ? `<a href="#" class="rp-state" data-state="${esc(st)}" title="Zoom to ${esc(STATE_NAMES[st] ?? st)}">${esc(st)}</a>`
      : esc(st)
    : "";
  const cityLine = [r.city ? esc(r.city) : "", [stLink, r.postal_code ? esc(r.postal_code) : ""].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const addr = [r.address ? esc(r.address) : "", cityLine].filter(Boolean).join("<br>");
  if (r.poker_room_status) {
    const lbl = POKER_ROOM_STATUS_LABELS[r.poker_room_status] ?? r.poker_room_status;
    const ev = r.poker_room_evidence ? trunc(r.poker_room_evidence, 90) : "";
    const evHtml = r.poker_room_evidence_url
      ? link(r.poker_room_evidence_url, ev ? `“${ev}”` : "evidence")
      : ev ? `“${esc(ev)}”` : "";
    row("Poker room", `<b class="rp-prs rp-prs-${esc(r.poker_room_status)}">${esc(lbl)}</b>${evHtml ? `<div class="rp-dim">${evHtml}</div>` : ""}`);
  }
  row("Address", addr);
  if (r.phone) {
    const tel = String(r.phone).replace(/[^0-9+]/g, "");
    row("Phone", tel ? `<a href="tel:${esc(tel)}">${esc(r.phone)}</a>` : esc(r.phone));
  }
  const games = Array.isArray(r.games) ? r.games.filter(Boolean).join(", ") : r.games || "";
  row("Games", games ? esc(games) : "");
  row("Stakes", r.stakes_notes ? esc(trunc(r.stakes_notes, 160)) : "");
  row("Hours", r.hours ? esc(trunc(r.hours, 200)) : "");
  row("Tables", r.tables != null && r.tables !== 0 ? esc(r.tables) : "");
  row("Tourneys", r.tournament_notes ? esc(trunc(r.tournament_notes, 160)) : "");
  row("Notes", r.notes ? esc(trunc(r.notes, 180)) : "");
  row("Website", r.website ? link(r.website) : "");
  const srcs = (r.sources ?? []).filter((s) => s && s.url);
  const pokerPage = srcs.find((s) => /official poker page/i.test(s.title ?? ""));
  if (pokerPage) row("Poker page", link(pokerPage.url));
  const other = srcs.filter((s) => s !== pokerPage && safeUrl(s.url) !== safeUrl(r.website));
  if (other.length) {
    row(
      "Sources",
      other
        .map((s) => {
          const t = s.title ? trunc(s.title.replace(/\s*\(.*?verify.*?\)\s*/i, ""), 60) : undefined;
          const d = s.retrieved_at ? ` <span class="rp-dim">${esc(s.retrieved_at.slice(0, 10))}</span>` : "";
          return `<div>${link(s.url, t)}${d}</div>`;
        })
        .join(""),
    );
  }
  const status = r.status && r.status !== "verified" ? String(r.status) : "";
  return `<div class="room-popup">
<div class="rp-name">${esc(r.name)}${status ? ` <span class="rp-status rp-${esc(status)}">${esc(status.toUpperCase())}</span>` : ""}</div>
${type ? `<div class="rp-type">${esc(type)}</div>` : ""}
<dl>${rows.join("")}</dl></div>`;
}

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
    () => merged.filter(
        (r) =>
          r.latitude != null &&
          r.longitude != null &&
          Math.abs(r.latitude) <= 90 &&
          Math.abs(r.longitude) <= 180,
      ),
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

      map.createPane("highways");
      const hp = map.getPane("highways");
      if (hp) {
        hp.style.zIndex = "350";
        hp.style.pointerEvents = "none";
      }
      const highways = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        {
          pane: "highways",
          maxZoom: 19,
          maxNativeZoom: 19,
          attribution:
            'Highways &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; OpenStreetMap contributors',
        },
      );
      L.control
        .layers(undefined, { Highways: highways }, { position: "topright", collapsed: false })
        .addTo(map);

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

      map.getContainer().addEventListener("click", (ev) => {
        const a = (ev.target as HTMLElement | null)?.closest?.("a.rp-state");
        if (!a) return;
        ev.preventDefault();
        ev.stopPropagation();
        const b = STATE_BOUNDS[a.getAttribute("data-state") ?? ""];
        if (!b) return;
        map.closePopup();
        map.flyToBounds(
          L.latLngBounds([b[0], b[1]], [b[2], b[3]]),
          { maxZoom: 7, padding: [20, 20], duration: 0.8 },
        );
      });

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

    let closeTimer: ReturnType<typeof setTimeout> | null = null;
    const cancelClose = () => {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = null;
    };
    const scheduleClose = (m: import("leaflet").Marker) => {
      cancelClose();
      closeTimer = setTimeout(() => {
        const el = m.getPopup()?.getElement();
        if (el && el.matches(":hover")) {
          el.addEventListener("mouseleave", () => scheduleClose(m), { once: true });
          return;
        }
        m.closePopup();
      }, 250);
    };

    layer.clearLayers();
    const bounds: import("leaflet").LatLngExpression[] = [];
    for (const room of pinned) {
      const lat = room.latitude as number;
      const lon = room.longitude as number;
      const pt: import("leaflet").LatLngExpression = [lat, lon];
      bounds.push(pt);
      const marker = L.marker(pt);
      marker.bindPopup(() => popupHtml(room), {
        maxWidth: 320,
        minWidth: 220,
        autoPan: true,
        className: "room-popup-wrap",
      });
      // Hover opens (desktop); tap/click opens via Leaflet default (touch).
      marker.on("mouseover", () => {
        if (gesturingRef.current) return;
        cancelClose();
        if (!marker.isPopupOpen()) marker.openPopup();
      });
      marker.on("mouseout", () => scheduleClose(marker));
      marker.addTo(layer);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 11);
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 11 });
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
