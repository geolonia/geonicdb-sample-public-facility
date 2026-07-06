// Local type override for @geolonia/embed (fixes syntax error in package's embed.d.ts)
import type * as mapboxgl from 'mapbox-gl';

declare module '@geolonia/embed' {
  export const Map: typeof mapboxgl.Map;
  export const Marker: typeof mapboxgl.Marker;
  export type MapInstance = mapboxgl.Map;
  export type MarkerInstance = mapboxgl.Marker;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const geolonia: any;

  export type EmbedPlugin = (
    map: mapboxgl.Map,
    target: HTMLElement,
    atts: Record<string, string>,
  ) => void;
}
