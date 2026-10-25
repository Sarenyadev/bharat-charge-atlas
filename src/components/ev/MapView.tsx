import { useEffect, useRef } from "react";
import { Map as MLMap, Marker, Popup, NavigationControl, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";

setWorkerUrl(workerUrl);
import "maplibre-gl/dist/maplibre-gl.css";
import type { DistrictRow, StationRow } from "@/lib/ev-data";

const STATUS_COLOR: Record<string, string> = {
  CRITICAL: "#f2545b",
  MODERATE: "#f5b544",
  ADEQUATE: "#2fd8a0",
};

export default function MapView({
  districts,
  stations,
  focus,
}: {
  districts: DistrictRow[];
  stations: StationRow[];
  focus?: DistrictRow;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markers = useRef<Marker[]>([]);

  useEffect(() => {
    if (!ref.current) return;
    const map = new MLMap({
      container: ref.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [78.9, 21.5],
      zoom: 4.2,
      pitch: 50,
      bearing: -12,
    });
    map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const draw = () => {
      markers.current.forEach((m) => m.remove());
      markers.current = [];

      // District extruded columns (height = EVs per charger)
      const fc = {
        type: "FeatureCollection" as const,
        features: districts.map((d) => {
          const r = 0.12;
          const coords = Array.from({ length: 13 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return [d.longitude + r * Math.cos(a), d.latitude + r * Math.sin(a)];
          });
          return {
            type: "Feature" as const,
            properties: { h: Math.min(d.ev_per_charger, 6000) * 60, c: STATUS_COLOR[d.shortage_status] },
            geometry: { type: "Polygon" as const, coordinates: [coords] },
          };
        }),
      };
      const src = map.getSource("districts") as GeoJSONSource | undefined;
      if (src) src.setData(fc);
      else {
        map.addSource("districts", { type: "geojson", data: fc });
        map.addLayer({
          id: "district-cols",
          type: "fill-extrusion",
          source: "districts",
          paint: {
            "fill-extrusion-color": ["get", "c"],
            "fill-extrusion-height": ["get", "h"],
            "fill-extrusion-opacity": 0.75,
          },
        });
      }

      districts.forEach((d) => {
        const el = document.createElement("div");
        el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${STATUS_COLOR[d.shortage_status]};box-shadow:0 0 0 4px ${STATUS_COLOR[d.shortage_status]}40,0 0 18px ${STATUS_COLOR[d.shortage_status]};cursor:pointer`;
        markers.current.push(
          new Marker({ element: el })
            .setLngLat([d.longitude, d.latitude])
            .setPopup(
              new Popup({ offset: 12 }).setHTML(
                `<div style="font-family:Space Grotesk;color:#111"><b>${d.district}</b>, ${d.state}<br/>EVs: ${d.total_ev.toLocaleString("en-IN")}<br/>Chargers: ${d.charger_count}<br/>EV/charger: ${Math.round(d.ev_per_charger)}<br/><b style="color:${STATUS_COLOR[d.shortage_status]}">${d.shortage_status}</b></div>`,
              ),
            )
            .addTo(map),
        );
      });

      stations.forEach((s) => {
        const el = document.createElement("div");
        el.style.cssText = "width:8px;height:8px;border-radius:2px;background:#4fd6f0;border:1px solid #0b1a22;transform:rotate(45deg)";
        markers.current.push(
          new Marker({ element: el })
            .setLngLat([s.longitude, s.latitude])
            .setPopup(
              new Popup({ offset: 8 }).setHTML(
                `<div style="font-family:Space Grotesk;color:#111"><b>${s.name}</b><br/>${s.operator}<br/>${s.total_chargers} chargers (${s.fast_chargers} fast) · ${s.power_kw} kW</div>`,
              ),
            )
            .addTo(map),
        );
      });
    };
    if (map.isStyleLoaded()) draw();
    else map.once("load", draw);
  }, [districts, stations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (focus) map.flyTo({ center: [focus.longitude, focus.latitude], zoom: 9, pitch: 55 });
    else map.flyTo({ center: [78.9, 21.5], zoom: 4.2, pitch: 50 });
  }, [focus]);

  return <div ref={ref} className="h-full w-full" />;
}
