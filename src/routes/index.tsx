import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, AlertTriangle, BatteryCharging, Map as MapIcon, Gauge, Zap, Car, FileText, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { StatusBadge } from "@/components/ev/StatusBadge";
import { districtsQuery, stationsQuery, projectDeficit, fmt, type DistrictRow } from "@/lib/ev-data";

const MapView = lazy(() => import("@/components/ev/MapView"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EV Infra Map India — Charging Shortage Intelligence" },
      { name: "description", content: "Executive EV infrastructure and charger shortage intelligence platform for MHI and ICAT, built for Techfest IIT Bombay." },
      { property: "og:title", content: "EV Infra Map India — Charging Shortage Intelligence" },
      { property: "og:description", content: "District-level EV registrations, charger gaps, 2030 projections and strategic recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ALL = "__all";
const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)" };

function Index() {
  const { data: districts = [], isLoading, error } = useQuery(districtsQuery);
  const { data: stations = [] } = useQuery(stationsQuery);
  const [state, setState] = useState(ALL);
  const [district, setDistrict] = useState(ALL);

  const states = useMemo(() => [...new Set(districts.map((d) => d.state))].sort(), [districts]);
  const scoped = useMemo(() => {
    let r = districts;
    if (state !== ALL) r = r.filter((d) => d.state === state);
    if (district !== ALL) r = r.filter((d) => d.district === district);
    return r;
  }, [districts, state, district]);
  const districtOptions = useMemo(() => districts.filter((d) => state === ALL || d.state === state), [districts, state]);
  const scopedStations = useMemo(() => stations.filter((s) => scoped.some((d) => d.district === s.district)), [stations, scoped]);
  const focus = district !== ALL ? scoped[0] : undefined;

  const national = useMemo(() => {
    const ev = districts.reduce((a, d) => a + d.total_ev, 0);
    const ch = districts.reduce((a, d) => a + d.charger_count, 0);
    return {
      ev,
      ch,
      stations: stations.length,
      ratio: ch ? ev / ch : 0,
      critical: districts.filter((d) => d.shortage_status === "CRITICAL").length,
    };
  }, [districts, stations]);

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-30 border-x-0 border-t-0">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-brand shadow-glow grid size-10 place-items-center rounded-lg">
              <Zap className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight">
                EV Infra Map <span className="text-gradient-brand">India</span>
              </h1>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Techfest IIT Bombay · MHI / ICAT</p>
            </div>
          </div>
          <div className="ml-auto grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Kpi icon={Car} label="Registered EVs" value={fmt(national.ev)} />
            <Kpi icon={BatteryCharging} label="Chargers" value={fmt(national.ch)} />
            <Kpi icon={MapIcon} label="Stations" value={fmt(national.stations)} />
            <Kpi icon={Gauge} label="EV / Charger" value={fmt(national.ratio)} />
            <Kpi icon={AlertTriangle} label="Critical Districts" value={String(national.critical)} danger />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-5 px-6 py-6">
        <div className="glass flex flex-wrap items-center gap-3 rounded-xl px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Filter</span>
          <Select value={state} onValueChange={(v) => { setState(v); setDistrict(ALL); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All States</SelectItem>
              {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-56"><SelectValue placeholder="District" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All Districts</SelectItem>
              {districtOptions.map((d) => <SelectItem key={d.id} value={d.district}>{d.district}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="ml-auto text-sm text-muted-foreground">
            {scoped.length} districts · {scopedStations.length} stations in scope
          </span>
        </div>

        {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">Couldn't load district data.</div>}

        <Tabs defaultValue="map">
          <TabsList className="h-auto flex-wrap bg-card p-1">
            <TabsTrigger value="map" className="gap-2"><MapIcon className="size-4" />3D Geospatial Map</TabsTrigger>
            <TabsTrigger value="dash" className="gap-2"><Activity className="size-4" />EV & Charger Analytics</TabsTrigger>
            <TabsTrigger value="sim" className="gap-2"><TrendingUp className="size-4" />Future Requirement Simulator</TabsTrigger>
            <TabsTrigger value="rec" className="gap-2"><FileText className="size-4" />ICAT Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="map">
            <div className="glass relative h-[640px] overflow-hidden rounded-xl">
              <ClientOnly fallback={<div className="grid h-full place-items-center text-muted-foreground">Loading map…</div>}>
                <Suspense fallback={<div className="grid h-full place-items-center text-muted-foreground">Loading map…</div>}>
                  <MapView districts={scoped} stations={scopedStations} focus={focus} />
                </Suspense>
              </ClientOnly>
              <div className="glass absolute bottom-4 left-4 space-y-1.5 rounded-lg p-3 text-xs">
                <p className="font-mono uppercase tracking-widest text-muted-foreground">Legend</p>
                <Legend2 cls="bg-destructive" label="Critical district" />
                <Legend2 cls="bg-warning" label="Moderate district" />
                <Legend2 cls="bg-primary" label="Adequate district" />
                <Legend2 cls="bg-accent rotate-45 rounded-none" label="Charging station" />
                <p className="pt-1 text-muted-foreground">Column height = EVs per charger</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dash"><Dashboard rows={scoped} loading={isLoading} /></TabsContent>
          <TabsContent value="sim"><Simulator rows={scoped} /></TabsContent>
          <TabsContent value="rec"><Recommendations rows={scoped} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, danger }: { icon: any; label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/60 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className={danger ? "size-3 text-destructive" : "size-3 text-accent"} />{label}
      </div>
      <div className={`font-mono text-lg font-semibold ${danger ? "text-destructive" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function Legend2({ cls, label }: { cls: string; label: string }) {
  return <div className="flex items-center gap-2"><span className={`size-2.5 rounded-full ${cls}`} />{label}</div>;
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`glass rounded-xl p-5 ${className}`}>
      <h3 className="mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Dashboard({ rows, loading }: { rows: DistrictRow[]; loading: boolean }) {
  const t = rows.reduce(
    (a, d) => ({ w2: a.w2 + d.two_wheeler_ev, w3: a.w3 + d.three_wheeler_ev, w4: a.w4 + d.four_wheeler_ev, ch: a.ch + d.charger_count, ev: a.ev + d.total_ev }),
    { w2: 0, w3: 0, w4: 0, ch: 0, ev: 0 },
  );
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat label="2-Wheeler EVs" value={fmt(t.w2)} />
        <Stat label="3-Wheeler EVs" value={fmt(t.w3)} />
        <Stat label="4-Wheeler EVs" value={fmt(t.w4)} />
        <Stat label="Total Chargers" value={fmt(t.ch)} />
        <Stat label="EV : Charger" value={`${fmt(t.ch ? t.ev / t.ch : 0)} : 1`} accent />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="EV registrations by segment">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rows}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="district" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="two_wheeler_ev" name="2W" stackId="a" fill="var(--chart-1)" />
              <Bar dataKey="three_wheeler_ev" name="3W" stackId="a" fill="var(--chart-2)" />
              <Bar dataKey="four_wheeler_ev" name="4W" stackId="a" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="EVs per charger">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rows}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="district" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="ev_per_charger" name="EV / charger" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <Panel title="District shortage register">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                {["District", "State", "2W", "3W", "4W", "Total EV", "Chargers", "Fast", "EV/Charger", "Alert"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody className="font-mono">
              {loading && <tr><td className="px-3 py-6 text-muted-foreground" colSpan={10}>Loading…</td></tr>}
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/40">
                  <td className="px-3 py-2.5 font-sans font-semibold">{d.district}</td>
                  <td className="px-3 py-2.5 font-sans text-muted-foreground">{d.state}</td>
                  <td className="px-3 py-2.5">{fmt(d.two_wheeler_ev)}</td>
                  <td className="px-3 py-2.5">{fmt(d.three_wheeler_ev)}</td>
                  <td className="px-3 py-2.5">{fmt(d.four_wheeler_ev)}</td>
                  <td className="px-3 py-2.5">{fmt(d.total_ev)}</td>
                  <td className="px-3 py-2.5">{d.charger_count}</td>
                  <td className="px-3 py-2.5">{d.fast_charger_count}</td>
                  <td className="px-3 py-2.5">{fmt(d.ev_per_charger)}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={d.shortage_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${accent ? "text-gradient-brand" : ""}`}>{value}</p>
    </div>
  );
}

function Simulator({ rows }: { rows: DistrictRow[] }) {
  const [cagr, setCagr] = useState(35);
  const [ratio, setRatio] = useState(20);
  const ev = rows.reduce((a, d) => a + d.total_ev, 0);
  const ch = rows.reduce((a, d) => a + d.charger_count, 0);
  const series = projectDeficit(ev, ch, cagr, ratio);
  const last = series[series.length - 1];
  const perDistrict = rows
    .map((d) => ({ d, p: projectDeficit(d.total_ev, d.charger_count, cagr, ratio).at(-1)! }))
    .sort((a, b) => b.p.deficit - a.p.deficit);

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <Panel title="Scenario controls">
        <div className="space-y-8">
          <div>
            <div className="mb-3 flex justify-between text-sm"><span>EV adoption CAGR</span><span className="font-mono text-primary">{cagr}%</span></div>
            <Slider min={10} max={60} step={1} value={[cagr]} onValueChange={(v) => setCagr(v[0])} />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground"><span>10%</span><span>60%</span></div>
          </div>
          <div>
            <div className="mb-3 flex justify-between text-sm"><span>Target ratio (EVs / charger)</span><span className="font-mono text-accent">{ratio}</span></div>
            <Slider min={5} max={100} step={1} value={[ratio]} onValueChange={(v) => setRatio(v[0])} />
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground"><span>5</span><span>100</span></div>
          </div>
          <div className="space-y-3 border-t border-border pt-5">
            <Row k="Projected EVs (2030)" v={fmt(last.evs)} />
            <Row k="Chargers required" v={fmt(last.required)} />
            <Row k="Existing chargers" v={fmt(ch)} />
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
              <p className="text-xs uppercase tracking-wider text-destructive">2030 charger deficit</p>
              <p className="font-mono text-3xl font-bold text-destructive">{fmt(last.deficit)}</p>
            </div>
          </div>
        </div>
      </Panel>
      <div className="space-y-5">
        <Panel title="Projected fleet vs charger requirement, 2025–2030">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={series}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis yAxisId="l" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis yAxisId="r" orientation="right" stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar yAxisId="l" dataKey="deficit" name="Charger deficit" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="l" dataKey="required" name="Chargers required" stroke="var(--chart-2)" strokeWidth={2} />
              <Line yAxisId="r" dataKey="evs" name="EV fleet" stroke="var(--chart-1)" strokeWidth={2} strokeDasharray="5 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="2030 deficit by district">
          <div className="space-y-2">
            {perDistrict.map(({ d, p }) => (
              <div key={d.id} className="flex items-center gap-3 text-sm">
                <span className="w-40 truncate">{d.district}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="bg-gradient-brand h-full" style={{ width: `${(p.deficit / (perDistrict[0]?.p.deficit || 1)) * 100}%` }} />
                </div>
                <span className="w-24 text-right font-mono">{fmt(p.deficit)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span className="font-mono">{v}</span></div>;
}

function brief(d: DistrictRow) {
  const fastShare = d.charger_count ? d.fast_charger_count / d.charger_count : 0;
  const dominant = d.two_wheeler_ev >= d.four_wheeler_ev && d.two_wheeler_ev >= d.three_wheeler_ev ? "2W" : d.three_wheeler_ev >= d.four_wheeler_ev ? "3W" : "4W";
  const actions: string[] = [];
  if (d.shortage_status === "CRITICAL") actions.push(`Fast-track PM E-DRIVE capital subsidy for ≥${Math.ceil(d.total_ev / 20 - d.charger_count)} additional chargers to reach 20:1.`);
  if (dominant === "2W" || dominant === "3W") actions.push(`Deploy battery-swapping & LEV AC points (${dominant}-dominant fleet); ICAT to certify swap interoperability.`);
  if (fastShare < 0.5) actions.push("Raise DC fast-charger share above 50% along highway & transit corridors.");
  else actions.push("Fast-charger share healthy — prioritise grid-capacity upgrades with DISCOMs.");
  actions.push("ICAT to audit station uptime and IS 17017 compliance in next quarter.");
  return actions;
}

function Recommendations({ rows }: { rows: DistrictRow[] }) {
  const queue = [...rows].sort((a, b) => b.priority_score - a.priority_score || b.ev_per_charger - a.ev_per_charger);
  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-5">
        <h3 className="text-lg font-semibold">Institutional Action Brief — <span className="text-gradient-brand">MHI / ICAT</span></h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Districts ranked by shortage priority score. {queue.filter((d) => d.shortage_status === "CRITICAL").length} of {queue.length} districts in scope require immediate intervention.
        </p>
      </div>
      {queue.map((d, i) => (
        <article key={d.id} className="glass grid gap-4 rounded-xl p-5 md:grid-cols-[80px_1fr_auto]">
          <div className="font-mono text-4xl font-bold text-gradient-brand">#{i + 1}</div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h4 className="text-lg font-semibold">{d.district}</h4>
              <span className="text-sm text-muted-foreground">{d.state}</span>
              <StatusBadge status={d.shortage_status} />
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {brief(d).map((a) => <li key={a} className="flex gap-2"><span className="text-primary">▸</span>{a}</li>)}
            </ul>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Shortage score</p>
            <p className="font-mono text-3xl font-bold">{d.priority_score}</p>
            <p className="font-mono text-xs text-muted-foreground">{fmt(d.ev_per_charger)} EV/charger</p>
          </div>
        </article>
      ))}
    </div>
  );
}
