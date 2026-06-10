/* eslint-disable @typescript-eslint/no-explicit-any */
import L from 'leaflet';
import * as d3hexbin from 'd3-hexbin';
import type { NoisePoint } from '../hooks/useNoiseMap';

// ── dB thresholds → colour ──────────────────────────────────────────────────
function dbToColor(db: number): string {
  if (db >= 75) return '#ef4444'; // red-500
  if (db >= 65) return '#f97316'; // orange-500
  if (db >= 55) return '#eab308'; // yellow-500
  if (db >= 45) return '#22c55e'; // green-500
  return '#06b6d4';               // cyan-500
}

function dbToOpacity(db: number): number {
  return Math.min(0.75, 0.25 + ((db - 30) / 55) * 0.5);
}

// ── avg dB of a hexbin bin ──────────────────────────────────────────────────
function binAvgDb(bin: any[]): number {
  if (!bin.length) return 0;
  return bin.reduce((sum, p) => sum + p[2], 0) / bin.length;
}

// ── Layer class ─────────────────────────────────────────────────────────────
export class NoiseHexLayer extends L.Layer {
  private _points: NoisePoint[] = [];
  private _svg: SVGSVGElement | null = null;
  private _container: HTMLElement | null = null;

  /** Радіус кожної соти в пікселях */
  private readonly _hexRadius = 28;

  constructor(points: NoisePoint[]) {
    super();
    this._points = points;
  }

  // ── Leaflet lifecycle ────────────────────────────────────────────────────

  onAdd(map: L.Map): this {
    this._container = map.getPanes().overlayPane;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'leaflet-zoom-hide noise-hex-svg');
    svg.style.cssText =
      'position:absolute;top:0;left:0;pointer-events:none;overflow:visible;';
    this._container.appendChild(svg);
    this._svg = svg;

    map.on('viewreset moveend zoomend', this._redraw, this);
    this._redraw();
    return this;
  }

  onRemove(map: L.Map): this {
    map.off('viewreset moveend zoomend', this._redraw, this);
    this._svg?.remove();
    this._svg = null;
    return this;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setPoints(points: NoisePoint[]): this {
    this._points = points;
    this._redraw();
    return this;
  }

  // ── Drawing ───────────────────────────────────────────────────────────────

  private _redraw(): void {
    const map = this._map as L.Map | undefined;
    if (!map || !this._svg) return;

    const svg = this._svg;

    // Очищаємо попередні соти
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    if (!this._points.length) return;

    // latLngToLayerPoint вже повертає координати відносно контейнера overlayPane!
    const projected = this._points.map((p) => {
      const px = map.latLngToLayerPoint([p.latitude, p.longitude]);
      return [px.x, px.y, p.db];
    });

    // Будуємо сітку
    const binGen = (d3hexbin.hexbin as any)()
      .radius(this._hexRadius)
      .x((d: any) => d[0])
      .y((d: any) => d[1]);

    const bins = binGen(projected);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    // Звідси ПРИБРАНО setAttribute('transform', ...), який "ламав" координати
    svg.appendChild(g);

    const hexPath = binGen.hexagon(); 

    bins.forEach((bin: any) => {
      const avgDb = binAvgDb(bin);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${bin.x},${bin.y}${hexPath}`);
      path.setAttribute('fill', dbToColor(avgDb));
      path.setAttribute('fill-opacity', String(dbToOpacity(avgDb)));
      path.setAttribute('stroke', dbToColor(avgDb));
      path.setAttribute('stroke-width', '0.8');
      path.setAttribute('stroke-opacity', '0.4');
      g.appendChild(path);
    });
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────
export function noiseHexLayer(points: NoisePoint[]): NoiseHexLayer {
  return new NoiseHexLayer(points);
}