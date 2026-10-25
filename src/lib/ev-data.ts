import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ShortageStatus = "CRITICAL" | "MODERATE" | "ADEQUATE";

export interface DistrictRow {
  id: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  total_ev: number;
  two_wheeler_ev: number;
  three_wheeler_ev: number;
  four_wheeler_ev: number;
  station_count: number;
  charger_count: number;
  fast_charger_count: number;
  ev_per_charger: number;
  priority_score: number;
  shortage_status: ShortageStatus;
}

export interface StationRow {
  id: string;
  name: string;
  operator: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  total_chargers: number;
  fast_chargers: number;
  slow_chargers: number;
  power_kw: number;
  is_active: boolean | null;
}

// The view is not in generated types, so query through an untyped handle.
const db = supabase as unknown as { from: (t: string) => any };

export const districtsQuery = queryOptions({
  queryKey: ["v_district_shortage_analysis"],
  queryFn: async (): Promise<DistrictRow[]> => {
    const { data, error } = await db
      .from("v_district_shortage_analysis")
      .select("*")
      .order("priority_score", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d: any) => ({
      ...d,
      total_ev: Number(d.total_ev) || 0,
      two_wheeler_ev: Number(d.two_wheeler_ev) || 0,
      three_wheeler_ev: Number(d.three_wheeler_ev) || 0,
      four_wheeler_ev: Number(d.four_wheeler_ev) || 0,
      station_count: Number(d.station_count) || 0,
      charger_count: Number(d.charger_count) || 0,
      fast_charger_count: Number(d.fast_charger_count) || 0,
      ev_per_charger: Number(d.ev_per_charger) || 0,
      priority_score: Number(d.priority_score) || 0,
    }));
  },
});

export const stationsQuery = queryOptions({
  queryKey: ["charging_stations"],
  queryFn: async (): Promise<StationRow[]> => {
    const { data, error } = await supabase.from("charging_stations").select("*");
    if (error) throw error;
    return (data ?? []) as StationRow[];
  },
});

export interface ProjectionPoint {
  year: number;
  evs: number;
  required: number;
  existing: number;
  deficit: number;
}

/** Project EV fleet and charger deficit from baseYear through 2030. */
export function projectDeficit(
  totalEv: number,
  chargers: number,
  cagrPct: number,
  targetRatio: number,
  baseYear = 2025,
  endYear = 2030,
): ProjectionPoint[] {
  const out: ProjectionPoint[] = [];
  for (let y = baseYear; y <= endYear; y++) {
    const evs = Math.round(totalEv * Math.pow(1 + cagrPct / 100, y - baseYear));
    const required = Math.ceil(evs / targetRatio);
    out.push({ year: y, evs, required, existing: chargers, deficit: Math.max(0, required - chargers) });
  }
  return out;
}

export const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));
