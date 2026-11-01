/*
 * Generates every app icon from one glyph definition.
 *
 *   bun scripts/generate-icons.mjs
 *
 * The mark is a wayfinding signpost: two arrow boards on a post, drawn as one
 * solid shape on a 512-unit grid. Everything is monochrome to match the site's
 * neutral palette.
 *
 * Outputs:
 *   public/icons/favicon.svg          browser favicon, flips with the OS color scheme
 *   src/app/favicon.ico               16/32/48 fallback for browsers without SVG favicons
 *   public/icons/icon.svg             master artwork (tile + glyph)
 *   public/icons/icon-monochrome.svg  bare single-color glyph (Safari mask-icon, docs)
 *   public/icons/icon-{192,512}.png           manifest "any", full-bleed square
 *   public/icons/icon-maskable-{192,512}.png  manifest "maskable", full bleed, safe-zone glyph
 *   public/icons/icon-monochrome-{192,512}.png manifest "monochrome", white glyph on alpha
 *   public/icons/apple-touch-icon.png         180px, opaque full bleed
 *
 * Rasterizing uses sharp (librsvg), which Next.js already installs.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const INK = "#0a0a0a"; // matches --background in dark mode, oklch(0.145 0 0)
const PAPER = "#fafafa"; // matches --foreground in dark mode, oklch(0.985 0 0)
const TILE_TOP = "#262626";
const TILE_BOTTOM = INK;

/* ---------------------------------------------------------------- geometry */

/** Polygon with each corner rounded to its own radius, as an SVG path. */
function roundedPolygon(points) {
  const n = points.length;
  const corners = points.map(([x, y, r], i) => {
    const [ax, ay] = points[(i - 1 + n) % n];
    const [bx, by] = points[(i + 1) % n];
    const la = Math.hypot(ax - x, ay - y);
    const lb = Math.hypot(bx - x, by - y);
    const u1 = [(ax - x) / la, (ay - y) / la];
    const u2 = [(bx - x) / lb, (by - y) / lb];
    const angle = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1])));
    const t = r / Math.tan(angle / 2);
    const cross = (x - ax) * (by - y) - (y - ay) * (bx - x);
    return {
      r,
      start: [x + u1[0] * t, y + u1[1] * t],
      end: [x + u2[0] * t, y + u2[1] * t],
      sweep: cross > 0 ? 1 : 0,
    };
  });
  const f = (v) => Number(v.toFixed(2));
  const pt = ([x, y]) => `${f(x)} ${f(y)}`;
  let d = `M${pt(corners[0].end)}`;
  for (let i = 1; i <= n; i++) {
    const c = corners[i % n];
    d += `L${pt(c.start)}`;
    if (c.r > 0) d += `A${c.r} ${c.r} 0 0 ${c.sweep} ${pt(c.end)}`;
  }
  return `${d}Z`;
}

/*
 * The signpost is one solid silhouette: the post runs unbroken behind both
 * boards, with no knockout gaps around them. All subpaths wind clockwise, so
 * the overlaps union instead of cancelling.
 */
const BOARD_R = 14; // board corners
const TIP_R = 12; // arrow tips
const POST_CAP = 24; // round top of the post

// Display glyph, for anything drawn at 180px and up. The upper board points
// right (toward the next thing), the lower one points back.
const displayGlyph = [
  roundedPolygon([
    [232, 48, POST_CAP],
    [280, 48, POST_CAP],
    [280, 464, 10],
    [232, 464, 10],
  ]),
  roundedPolygon([
    [112, 128, BOARD_R],
    [352, 128, BOARD_R],
    [416, 176, TIP_R],
    [352, 224, BOARD_R],
    [112, 224, BOARD_R],
  ]),
  roundedPolygon([
    [400, 256, BOARD_R],
    [400, 352, BOARD_R],
    [160, 352, BOARD_R],
    [96, 304, TIP_R],
    [160, 256, BOARD_R],
  ]),
].join("");

/*
 * Favicon glyph, hinted for 16px and 32px tabs: the same signpost redrawn so
 * every edge sits on a multiple of 32 units (one pixel at 16px). It spans
 * 8x10px of a 16px tile and the post is a full 2px wide.
 */
const smallGlyph = [
  roundedPolygon([
    [224, 96, 16],
    [288, 96, 16],
    [288, 416, 8],
    [224, 416, 8],
  ]),
  roundedPolygon([
    [128, 128, 8],
    [320, 128, 0],
    [384, 176, 4],
    [320, 224, 0],
    [128, 224, 8],
  ]),
  roundedPolygon([
    [384, 256, 8],
    [384, 352, 8],
    [192, 352, 0],
    [128, 304, 4],
    [192, 256, 0],
  ]),
].join("");

/** Glyph scaled about the canvas center (both glyphs are centered at 256,256). */
const glyph = (fill, { scale = 1, small = false, attrs = "" } = {}) =>
  `<path d="${small ? smallGlyph : displayGlyph}" fill="${fill}"${
    scale === 1 ? "" : ` transform="translate(256 256) scale(${scale}) translate(-256 -256)"`
  }${attrs}/>`;

/* ---------------------------------------------------------------- artwork */

const svg = (body, { size, defs = "", style = "" } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"${
    size ? ` width="${size}" height="${size}"` : ""
  }>${style ? `<style>${style}</style>` : ""}${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>\n`;

const tileGradient = `<linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TILE_TOP}"/><stop offset="1" stop-color="${TILE_BOTTOM}"/></linearGradient>`;

/**
 * Opaque square with the background running to the edges. Platforms that want
 * a rounded or circular icon (iOS, Android launchers) apply their own mask.
 * `small` swaps in the pixel-hinted favicon glyph.
 */
const tileIcon = (size, { small = false, scale = TILE_SCALE } = {}) =>
  svg(
    `<rect width="512" height="512" fill="url(#tile)"/>${glyph(PAPER, small ? { small } : { scale })}`,
    { size, defs: tileGradient },
  );

/** Single color on transparency; Android themed icons only read the alpha channel. */
const monochromeIcon = (size, fill, glyphScale = 1) =>
  svg(glyph(fill, { scale: glyphScale }), { size });

/**
 * Browser favicon. Dark tile on light browser chrome, light tile on dark chrome,
 * so the mark never sinks into a dark tab strip.
 */
const adaptiveFavicon = svg(
  `<rect class="t" width="512" height="512"/>${glyph(PAPER, { small: true, attrs: ' class="g"' })}`,
  {
    style: `.t{fill:${INK}}.g{fill:${PAPER}}@media (prefers-color-scheme:dark){.t{fill:${PAPER}}.g{fill:${INK}}}`,
  },
);

// Glyph size inside each container. At scale 1 the display glyph is 416 units
// tall; 0.72 brings it to ~60% of the tile, leaving the mark plenty of air.
const TILE_SCALE = 0.72;
// Android's maskable safe zone is a centered circle 80% of the icon wide, and
// launchers often crop tighter than that.
const MASKABLE_SCALE = 0.68;
// iOS applies its own squircle mask to the full-bleed square.
const APPLE_SCALE = 0.72;
// Themed icons get masked into a circle and drawn smaller still.
const MONOCHROME_SCALE = 0.64;

/* ---------------------------------------------------------------- output */

const png = (source) => sharp(Buffer.from(source)).png({ compressionLevel: 9 }).toBuffer();

/** PNG-compressed ICO (Vista+), one image per size. */
function encodeIco(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

const outputs = {
  "public/icons/favicon.svg": async () => adaptiveFavicon,
  "public/icons/icon.svg": async () => tileIcon(),
  "public/icons/icon-monochrome.svg": async () => monochromeIcon(undefined, INK),
  "public/icons/icon-192.png": () => png(tileIcon(192)),
  "public/icons/icon-512.png": () => png(tileIcon(512)),
  "public/icons/icon-maskable-192.png": () => png(tileIcon(192, { scale: MASKABLE_SCALE })),
  "public/icons/icon-maskable-512.png": () => png(tileIcon(512, { scale: MASKABLE_SCALE })),
  "public/icons/icon-monochrome-192.png": () =>
    png(monochromeIcon(192, "#ffffff", MONOCHROME_SCALE)),
  "public/icons/icon-monochrome-512.png": () =>
    png(monochromeIcon(512, "#ffffff", MONOCHROME_SCALE)),
  "public/icons/apple-touch-icon.png": () => png(tileIcon(180, { scale: APPLE_SCALE })),
  "src/app/favicon.ico": async () =>
    encodeIco(
      await Promise.all(
        [16, 32, 48].map(async (size) => ({
          size,
          data: await png(tileIcon(size, { small: true })),
        })),
      ),
    ),
};

const written = await Promise.all(
  Object.entries(outputs).map(async ([file, render]) => {
    const target = join(root, file);
    const [data] = await Promise.all([render(), mkdir(dirname(target), { recursive: true })]);
    await writeFile(target, data);
    return `${file} (${data.length} bytes)`;
  }),
);
console.log(`wrote ${written.length} icons:\n  ${written.join("\n  ")}`);
