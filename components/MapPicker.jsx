"use client";
import { useEffect, useRef, useState } from "react";

// Map location picker: OpenStreetMap tiles via Leaflet (loaded from CDN),
// reverse-geocoded through Nominatim. Calls onPick({ city, address, lat, lon })
// when the user confirms. GPS coordinates are embedded in the address text so
// the delivery team can navigate precisely even without street numbers.
const NKC = [18.0858, -15.9785]; // Nouakchott

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("ssr"));
    if (window.L) return resolve(window.L);
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("leaflet load failed"));
    document.head.appendChild(script);
  });
}

export default function MapPicker({ onPick, onClose, labels = {} }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const marker = useRef(null);
  const [picked, setPicked] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  const reverseGeocode = async (lat, lon) => {
    setResolving(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=ar,fr`
      );
      const data = await res.json();
      const a = data.address || {};
      const city = a.city || a.town || a.village || a.county || a.state || "Nouakchott";
      const parts = [a.road, a.neighbourhood, a.suburb, a.city_district].filter(Boolean);
      const line = parts.length ? parts.join("، ") : (data.display_name || "").split(",").slice(0, 3).join("،");
      const gps = `${lat.toFixed(6)},${lon.toFixed(6)}`;
      setPicked({ city, address: `${line} (GPS: ${gps})`, lat, lon });
    } catch {
      const gps = `${lat.toFixed(6)},${lon.toFixed(6)}`;
      setPicked({ city: "Nouakchott", address: `GPS: ${gps}`, lat, lon });
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapRef.current || leafletMap.current) return;
        const map = L.map(mapRef.current).setView(NKC, 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        const m = L.marker(NKC, { draggable: true }).addTo(map);
        const update = (latlng) => reverseGeocode(latlng.lat, latlng.lng);
        m.on("dragend", () => update(m.getLatLng()));
        map.on("click", (e) => {
          m.setLatLng(e.latlng);
          update(e.latlng);
        });
        leafletMap.current = map;
        marker.current = m;
      })
      .catch(() => setError("Map failed to load"));
    return () => {
      cancelled = true;
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (leafletMap.current && marker.current) {
          leafletMap.current.setView([latitude, longitude], 16);
          marker.current.setLatLng([latitude, longitude]);
        }
        reverseGeocode(latitude, longitude);
      },
      () => setError(labels.locationDenied || "Location permission denied")
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-souq-goldlight/60 p-3">
      <div ref={mapRef} className="h-64 rounded-xl overflow-hidden" dir="ltr" />
      {error && <p className="text-red-600 text-sm font-bold mt-2">{error}</p>}
      {picked && (
        <p className="text-sm mt-2 text-souq-ink/80">
          📍 {picked.city} — {picked.address}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={useMyLocation}
          className="text-sm font-bold border border-souq-green text-souq-green rounded-full px-4 py-2"
        >
          {labels.useMyLocation || "📡 موقعي الحالي"}
        </button>
        <button
          type="button"
          disabled={!picked || resolving}
          onClick={() => picked && onPick(picked)}
          className="flex-1 text-sm font-bold bg-souq-green text-white rounded-full px-4 py-2 disabled:opacity-50"
        >
          {resolving ? "..." : labels.confirm || "تأكيد الموقع"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-bold text-souq-ink/60 px-3"
        >
          {labels.cancel || "إلغاء"}
        </button>
      </div>
    </div>
  );
}
