const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, getPixel) {
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(raw);

  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const full = Buffer.concat([typeBuf, data]);
    let c = -1;
    for (let i = 0; i < full.length; i++) {
      c = (c >>> 8) ^ table[(c ^ full[i]) & 0xff];
    }
    c = (c ^ -1) >>> 0;
    crcBuf.writeUInt32BE(c, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function renderHRMLogo(x, y, w, h) {
  // Normalize to 0..1
  const nx = x / w;
  const ny = y / h;

  // Background gradient: Deep navy to slate (#0f172a to #1e293b)
  let bgR = Math.round(15 + ny * 15);
  let bgG = Math.round(23 + ny * 18);
  let bgB = Math.round(42 + ny * 17);

  // Rounded icon shield / rounded rect (radius 22%)
  const cx = 0.5, cy = 0.5;
  const dx = Math.abs(nx - cx);
  const dy = Math.abs(ny - cy);
  const radius = 0.44;
  const cornerR = 0.12;

  let inBadge = false;
  if (dx <= radius && dy <= radius) {
    if (dx > radius - cornerR && dy > radius - cornerR) {
      const cdx = dx - (radius - cornerR);
      const cdy = dy - (radius - cornerR);
      inBadge = (cdx * cdx + cdy * cdy) <= (cornerR * cornerR);
    } else {
      inBadge = true;
    }
  }

  if (!inBadge) {
    return [0, 0, 0, 0]; // Transparent outer padding for maskable
  }

  // Inside badge: vibrant sapphire blue gradient with subtle lighting
  const badgeGradient = ny * 0.7 + (nx - 0.5) * 0.3;
  let r = Math.round(37 + badgeGradient * 30);
  let g = Math.round(99 + badgeGradient * 40);
  let b = Math.round(235 + badgeGradient * 15);

  // Modern corporate "H" / Human Network Icon
  // Left pillar: 0.28 to 0.38, Y: 0.25 to 0.75
  // Right pillar: 0.62 to 0.72, Y: 0.25 to 0.75
  // Crossbar: 0.38 to 0.62, Y: 0.45 to 0.55
  // Top center circle / badge: cy: 0.33, cx: 0.50
  const isLeftPillar = (nx >= 0.27 && nx <= 0.39 && ny >= 0.24 && ny <= 0.76);
  const isRightPillar = (nx >= 0.61 && nx <= 0.73 && ny >= 0.24 && ny <= 0.76);
  const isCrossbar = (nx >= 0.36 && nx <= 0.64 && ny >= 0.45 && ny <= 0.55);

  // Center glowing node (represents people / leadership)
  const nodeDist = Math.hypot(nx - 0.5, ny - 0.5);
  const isCenterNode = nodeDist <= 0.10;

  if (isLeftPillar || isRightPillar || isCrossbar) {
    // Pure crisp white / cyan gradient
    const highlight = Math.max(0, 1 - (ny - 0.2) * 1.2);
    r = Math.round(240 + highlight * 15);
    g = Math.round(245 + highlight * 10);
    b = 255;
  }

  if (isCenterNode) {
    // Cyan glow node
    r = 56;
    g = 189;
    b = 248; // #38bdf8 Sky Cyan
  }

  return [r, g, b, 255];
}

console.log('Generating PWA icons...');
const buf192 = createPNG(192, 192, renderHRMLogo);
const buf512 = createPNG(512, 512, renderHRMLogo);

const targets = [
  path.join(__dirname, '../assets/icon-192.png'),
  path.join(__dirname, '../assets/icon-512.png'),
  path.join(__dirname, '../assets/apple-touch-icon.png'),
  path.join(__dirname, '../public/assets/icon-192.png'),
  path.join(__dirname, '../public/assets/icon-512.png'),
  path.join(__dirname, '../public/assets/apple-touch-icon.png')
];

fs.writeFileSync(targets[0], buf192);
fs.writeFileSync(targets[1], buf512);
fs.writeFileSync(targets[2], buf192);

if (fs.existsSync(path.join(__dirname, '../public/assets'))) {
  fs.writeFileSync(targets[3], buf192);
  fs.writeFileSync(targets[4], buf512);
  fs.writeFileSync(targets[5], buf192);
}

// Generate SVG Icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="50%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="glyph" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <g filter="url(#shadow)">
    <!-- Left Pillar -->
    <rect x="138" y="128" width="60" height="256" rx="20" fill="url(#glyph)"/>
    <!-- Right Pillar -->
    <rect x="314" y="128" width="60" height="256" rx="20" fill="url(#glyph)"/>
    <!-- Crossbar -->
    <rect x="180" y="232" width="152" height="48" rx="14" fill="url(#glyph)"/>
    <!-- Cyan Center Node -->
    <circle cx="256" cy="256" r="32" fill="#38bdf8"/>
    <!-- Top Crown Dot -->
    <circle cx="256" cy="168" r="22" fill="#67e8f9"/>
  </g>
</svg>`;

fs.writeFileSync(path.join(__dirname, '../assets/icon.svg'), svg, 'utf8');
if (fs.existsSync(path.join(__dirname, '../public/assets'))) {
  fs.writeFileSync(path.join(__dirname, '../public/assets/icon.svg'), svg, 'utf8');
}

console.log('✅ PWA Icons successfully generated!');
