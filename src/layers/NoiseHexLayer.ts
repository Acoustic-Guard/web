/* eslint-disable @typescript-eslint/no-explicit-any */
import L from 'leaflet';
import * as d3hexbin from 'd3-hexbin';
import type { NoisePoint } from '../hooks/useNoiseMap';

/**
 * Конвертує рівень шуму в децибелах (дБ) у відповідний HEX-колір для індикації загрози.
 * @param db - Рівень шуму.
 * @returns Рядок з HEX-кодом кольору.
 */
function dbToColor(db: number): string {
  if (db >= 75) return '#ef4444';
  if (db >= 65) return '#f97316';
  if (db >= 55) return '#eab308';
  if (db >= 45) return '#22c55e';
  return '#06b6d4';              
}

/**
 * Розраховує динамічну прозорість заливки на основі рівня шуму. 
 * Зони з вищою інтенсивністю звуку мають більшу непрозорість.
 * @param db - Рівень шуму.
 * @returns Значення opacity (від 0.25 до 0.75).
 */
function dbToOpacity(db: number): number {
  return Math.min(0.75, 0.25 + ((db - 30) / 55) * 0.5);
}

/**
 * Обчислює середній рівень акустичного шуму для гексагонального кластера (біна).
 * @param bin - Масив точок даних, що потрапили у межі одного полігону.
 * @returns Середнє значення дБ.
 */
function binAvgDb(bin: any[]): number {
  if (!bin.length) return 0;
  return bin.reduce((sum, p) => sum + p[2], 0) / bin.length;
}

/**
 * Кастомний шар Leaflet для просторової агрегації та візуалізації телеметрії.
 * Використовує D3.js для групування координат (Hexbin) та рендерить результат 
 * як оптимізований SVG-оверлей поверх базової мапи.
 */
export class NoiseHexLayer extends L.Layer {
  private _points: NoisePoint[] = [];
  private _svg: SVGSVGElement | null = null;
  private _container: HTMLElement | null = null;

  private readonly _hexRadius = 28;

  constructor(points: NoisePoint[]) {
    super();
    this._points = points;
  }

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

  setPoints(points: NoisePoint[]): this {
    this._points = points;
    this._redraw();
    return this;
  }

  private _redraw(): void {
    const map = this._map as L.Map | undefined;
    if (!map || !this._svg) return;

    const svg = this._svg;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    if (!this._points.length) return;

    const projected = this._points.map((p) => {
      const px = map.latLngToLayerPoint([p.latitude, p.longitude]);
      return [px.x, px.y, p.db];
    });

    const binGen = (d3hexbin.hexbin as any)()
      .radius(this._hexRadius)
      .x((d: any) => d[0])
      .y((d: any) => d[1]);

    const bins = binGen(projected);

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
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

export function noiseHexLayer(points: NoisePoint[]): NoiseHexLayer {
  return new NoiseHexLayer(points);
}