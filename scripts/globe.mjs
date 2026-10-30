// Bakes the globe's country map: public/globe/countries.png, an equirectangular raster whose pixel
// value is a country's index + 1 (0 = sea), and countries.json with the names in that order.
// Run once after changing the map: `node scripts/globe.mjs`. Source: Natural Earth via world-atlas.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { feature } from 'topojson-client';

const W = 720, H = 360; // half a degree per pixel
const topo = JSON.parse(readFileSync(new URL('../node_modules/world-atlas/countries-50m.json', import.meta.url)));
const countries = feature(topo, topo.objects.countries).features.filter((f) => f.geometry);
if (countries.length > 255) throw new Error('more countries than one byte holds');

// Each country as rings with a bounding box, for an even-odd point-in-polygon test.
const shapes = countries.map((f) => {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  // Rings that cross the antimeridian (Russia, Fiji) are unwrapped past 180°; points are tested at lon and lon + 360.
  const rings = polys.flat().map((r) => {
    const xs = r.map((p) => p[0]);
    return Math.max(...xs) - Math.min(...xs) > 180 ? r.map(([x, y]) => [x < 0 ? x + 360 : x, y]) : r;
  });
  const xs = rings.flat().map((p) => p[0]), ys = rings.flat().map((p) => p[1]);
  return { rings, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
});
const inside = (x, y, rings) => {
  let c = false;
  for (const r of rings) {
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
  }
  return c;
};

const px = new Uint8Array(W * H);
for (let row = 0; row < H; row++) {
  const lat = 90 - (row + 0.5) * (180 / H);
  for (let col = 0; col < W; col++) {
    const lon = -180 + (col + 0.5) * (360 / W);
    const k = shapes.findIndex(({ box: [x0, y0, x1, y1], rings }) => [lon, lon + 360].some((x) =>
      x >= x0 && x <= x1 && lat >= y0 && lat <= y1 && inside(x, lat, rings)));
    px[row * W + col] = k + 1;
  }
}

// A greyscale PNG, by hand: signature, IHDR, IDAT (each row prefixed with filter 0), IEND.
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => { let c = ~0; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return ~c >>> 0; };
const chunk = (type, data) => {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 0; // 8-bit greyscale
const raw = Buffer.alloc(H * (W + 1));
for (let row = 0; row < H; row++) Buffer.from(px.subarray(row * W, row * W + W)).copy(raw, row * (W + 1) + 1);
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
]);

mkdirSync(new URL('../public/globe/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/globe/countries.png', import.meta.url), png);
writeFileSync(new URL('../public/globe/countries.json', import.meta.url), JSON.stringify(countries.map((f) => f.properties.name)));

// Self-check: known places land in the right country.
const at = (lon, lat) => countries[px[Math.floor((90 - lat) / (180 / H)) * W + Math.floor((lon + 180) / (360 / W))] - 1]?.properties.name;
for (const [lon, lat, name] of [[13.4, 52.5, 'Germany'], [-100, 40, 'United States of America'], [51.4, 35.7, 'Iran'], [139.7, 35.7, 'Japan'], [100, 70, 'Russia'], [177, 66, 'Russia'], [-175, 66, 'Russia'], [100, 67, 'Russia'], [-20, 68, undefined], [-40, 72, 'Greenland'], [0, 72, undefined]]) {
  if (at(lon, lat) !== name) throw new Error(`(${lon}, ${lat}) is ${at(lon, lat)}, expected ${name}`);
}
console.log(`${countries.length} countries, ${png.length} bytes`);
