import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Hostel } from "@/data/hostels";
import { Star, MapPin } from "lucide-react";

interface HostelMapProps {
  hostels: Hostel[];
}

const HostelMap = ({ hostels }: HostelMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([12.9416, 77.6500], 12);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    hostels.forEach((h) => {
      const vacancyColor = h.vacancies === 0 ? "#ef4444" : h.vacancies <= 3 ? "#eab308" : "#22c55e";
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background:hsl(16,85%,60%);color:white;padding:4px 8px;border-radius:8px;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-family:'Plus Jakarta Sans',sans-serif;">₹${h.rent.toLocaleString()}</div>`,
        iconSize: [0, 0],
        iconAnchor: [30, 15],
      });

      const marker = L.marker([h.lat, h.lng], { icon }).addTo(map);
      marker.bindPopup(
        `<div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:180px;">
          <img src="${h.image}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />
          <div style="font-weight:700;font-size:14px;">${h.name}</div>
          <div style="font-size:12px;color:#888;margin-top:2px;">📍 ${h.location}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
            <span style="font-weight:700;color:hsl(16,85%,60%);">₹${h.rent.toLocaleString()}/mo</span>
            <span style="font-size:12px;font-weight:600;color:${vacancyColor}">${h.vacancies === 0 ? "Full" : `${h.vacancies} beds`}</span>
          </div>
          <div style="font-size:12px;margin-top:4px;">⭐ ${h.rating}</div>
        </div>`,
        { maxWidth: 220 }
      );
    });

    if (hostels.length > 0) {
      const bounds = L.latLngBounds(hostels.map((h) => [h.lat, h.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [hostels]);

  return <div ref={mapRef} className="h-[calc(100vh-180px)] w-full rounded-xl overflow-hidden border border-border" />;
};

export default HostelMap;
