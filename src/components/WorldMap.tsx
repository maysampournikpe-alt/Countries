import { useEffect, useMemo, useState } from 'react';
import { geoEqualEarth, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, Geometry } from 'geojson';
import { COUNTRIES } from '../data/countries';

type Shape = Feature<Geometry, Record<string, unknown>> & { id?: string };
let cache: Promise<Shape[]> | null = null;
function loadShapes(): Promise<Shape[]> {
  cache ??= import('world-atlas/countries-110m.json').then((m) => {
    const topo = (m.default ?? m) as unknown as Topology<{ countries: GeometryCollection }>;
    return (feature(topo, topo.objects.countries) as unknown as { features: Shape[] }).features;
  });
  return cache;
}

const W = 960;
const H = 470;
const projection = geoEqualEarth().scale(178).translate([W / 2, H / 2 + 20]);
const path = geoPath(projection);
const byCcn3 = new Map(COUNTRIES.map((c) => [c.ccn3, c]));

export function useShapes() {
  const [shapes, setShapes] = useState<Shape[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadShapes().then((s) => alive && setShapes(s));
    return () => {
      alive = false;
    };
  }, []);
  return shapes;
}

/**
 * World map. `fill(code)` colours each sovereign country; microstates missing from the
 * 1:110m outlines are drawn as dots at their coordinates so every country is clickable.
 */
export function WorldMap({ fill, onSelect, selected, highlight, label, compact = false }: { fill?: (code: string) => string; onSelect?: (code: string) => void; selected?: string; highlight?: string; label: string; compact?: boolean }) {
  const shapes = useShapes();
  const drawn = useMemo(() => new Set((shapes ?? []).map((s) => byCcn3.get(String(s.id))?.code).filter(Boolean) as string[]), [shapes]);
  if (!shapes) return <div className="aspect-[96/47] w-full rounded-2xl bg-raised animate-pulse" role="img" aria-label={`${label} (loading)`} />;

  const dots = COUNTRIES.filter((c) => !drawn.has(c.code));
  const interactive = !!onSelect;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label}>
      <rect width={W} height={H} fill="transparent" />
      {shapes.map((s, i) => {
        const c = byCcn3.get(String(s.id));
        const code = c?.code;
        const isHi = code && (code === highlight || code === selected);
        return (
          <path
            key={i}
            d={path(s) ?? ''}
            fill={code ? (highlight ? (code === highlight ? 'var(--primary)' : 'var(--raised)') : fill?.(code) ?? 'var(--raised)') : 'var(--line)'}
            stroke={isHi ? 'var(--ink)' : 'var(--surface)'}
            strokeWidth={isHi ? 1.6 : 0.5}
            className={interactive && code ? 'cursor-pointer hover:brightness-110' : ''}
            onClick={code && onSelect ? () => onSelect(code) : undefined}
          >
            {code && interactive && <title>{c!.name}</title>}
          </path>
        );
      })}
      {dots.map((c) => {
        const p = projection([c.latlng[1], c.latlng[0]]);
        if (!p) return null;
        const isHi = c.code === highlight || c.code === selected;
        const r = compact ? 5 : 4.2;
        return (
          <circle
            key={c.code}
            cx={p[0]}
            cy={p[1]}
            r={isHi ? r + 2 : r}
            fill={highlight ? (c.code === highlight ? 'var(--primary)' : 'transparent') : fill?.(c.code) ?? 'var(--raised)'}
            stroke={highlight && c.code !== highlight ? 'none' : 'var(--ink)'}
            strokeWidth={isHi ? 1.6 : 0.6}
            className={interactive ? 'cursor-pointer' : ''}
            onClick={onSelect ? () => onSelect(c.code) : undefined}
          >
            {interactive && <title>{c.name}</title>}
          </circle>
        );
      })}
    </svg>
  );
}
