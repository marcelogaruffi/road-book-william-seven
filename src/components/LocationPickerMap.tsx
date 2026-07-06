// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Loader2, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface LocationPickerMapProps {
  initialAddress: string;
  initialCoords?: [number, number];
  onSave: (coords: [number, number]) => void;
  onCancel: () => void;
}

export function LocationPickerMap({ initialAddress, initialCoords, onSave, onCancel }: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<[number, number] | null>(initialCoords || null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function initMap() {
      if (!initialCoords && initialAddress.trim()) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(initialAddress)}&format=json&limit=1`, {
            headers: { "User-Agent": "RoadBookApp/1.0" }
          });
          const data = await res.json();
          if (active && data && data[0]) {
            setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          } else if (active) {
            setError("Endereço não localizado automaticamente. Arraste o mapa para encontrar o local.");
            // Center of Brazil as fallback
            setCoords([-14.235, -51.925]); 
          }
        } catch {
          if (active) setError("Erro ao buscar endereço.");
        }
      } else if (!initialCoords) {
        setCoords([-14.235, -51.925]);
      }
      if (active) setLoading(false);
    }

    initMap();

    return () => { active = false; };
  }, [initialAddress, initialCoords]);

  useEffect(() => {
    if (loading || !coords || !mapRef.current) return;

    let mapInstance: any;

    import("leaflet").then((LModule) => {
      const L = LModule.default || LModule;

      if (leafletMap.current) {
        leafletMap.current.remove();
      }

      const map = L.map(mapRef.current).setView(coords, initialCoords || !error ? 15 : 4);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      // Fix icon issues in Next/Vite
      const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transform: translate(-50%, -100%);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });

      const marker = L.marker(coords, { draggable: true, icon: customIcon }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", (e: any) => {
        const position = marker.getLatLng();
        setCoords([position.lat, position.lng]);
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        setCoords([e.latlng.lat, e.latlng.lng]);
      });

      leafletMap.current = map;
      mapInstance = map;
    });

    return () => {
      if (mapInstance) {
        mapInstance.remove();
        leafletMap.current = null;
      }
    };
  }, [loading]); // Only re-run when loading finishes, to draw the map once

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
      
      <div className="relative w-full h-[400px] bg-slate-100 rounded-lg overflow-hidden border">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" style={{ zIndex: 1 }} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 flex-1">
          <MapPin className="size-3 inline mr-1" />
          Arraste o pino ou clique no mapa para ajustar a localização exata.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={() => coords && onSave(coords)} disabled={!coords || loading}>
            Salvar Coordenadas
          </Button>
        </div>
      </div>
    </div>
  );
}
