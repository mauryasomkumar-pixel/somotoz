import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// CRC32 table for PNG chunk checksums
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(4 + 4 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function createPng(width, height, isMaskable = false) {
  const rowBytes = width * 4 + 1; // 1 filter byte per row
  const rawData = Buffer.alloc(height * rowBytes);

  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.38 : width * 0.46; // safe zone margin for maskable
  const innerRadius = radius * 0.6;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (isMaskable) {
        // Deep obsidian background for full maskable bleed
        let r = 7;
        let g = 7;
        let b = 18;
        let a = 255;

        if (dist <= radius) {
          // Cyan to purple gradient core
          const t = Math.max(0, Math.min(1, (x / width)));
          r = Math.round(0 * (1 - t) + 168 * t);
          g = Math.round(240 * (1 - t) + 85 * t);
          b = Math.round(255 * (1 - t) + 247 * t);

          // Stylized central 'S' lightning emblem
          const normX = dx / radius;
          const normY = dy / radius;
          if (Math.abs(normX) < 0.45 && Math.abs(normY) < 0.6) {
            if ((normY < -0.1 && normX > -0.35) || (normY > 0.1 && normX < 0.35) || (Math.abs(normY) <= 0.15)) {
              r = 255;
              g = 255;
              b = 255;
            }
          }
        }
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = a;
      } else {
        // Standard icon: circular badge with cyber cyan/purple glow
        if (dist <= radius) {
          const t = Math.max(0, Math.min(1, (x / width)));
          // Outer rim
          if (dist > radius - 6) {
            rawData[pxOffset] = 0;
            rawData[pxOffset + 1] = 240;
            rawData[pxOffset + 2] = 255;
            rawData[pxOffset + 3] = 255;
          } else {
            // Dark obsidian badge fill
            let r = 10;
            let g = 10;
            let b = 24;

            // Inner lightning / S shape
            const normX = dx / radius;
            const normY = dy / radius;
            if (dist <= innerRadius && Math.abs(normX) < 0.5 && Math.abs(normY) < 0.6) {
              if ((normY < -0.1 && normX > -0.3) || (normY > 0.1 && normX < 0.3) || (Math.abs(normY) <= 0.15)) {
                r = Math.round(0 * (1 - t) + 255 * t);
                g = Math.round(240 * (1 - t) + 100 * t);
                b = 255;
              }
            }
            rawData[pxOffset] = r;
            rawData[pxOffset + 1] = g;
            rawData[pxOffset + 2] = b;
            rawData[pxOffset + 3] = 255;
          }
        } else {
          // Transparent outside circle
          rawData[pxOffset] = 0;
          rawData[pxOffset + 1] = 0;
          rawData[pxOffset + 2] = 0;
          rawData[pxOffset + 3] = 0;
        }
      }
    }
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth: 8
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression: deflate
  ihdr[11] = 0; // filter: standard
  ihdr[12] = 0; // interlace: none
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate all standard PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));

// Generate icon.svg
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="50%" stop-color="#A855F7" />
      <stop offset="100%" stop-color="#FF007A" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="#070712" />
  <circle cx="256" cy="256" r="220" fill="none" stroke="url(#grad)" stroke-width="12" opacity="0.85" />
  <path d="M190 160 C230 140, 310 140, 330 180 C345 210, 315 240, 256 256 C190 270, 160 300, 180 340 C200 375, 290 375, 330 350" fill="none" stroke="url(#grad)" stroke-width="42" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="345" cy="180" r="14" fill="#00F0FF" />
  <circle cx="165" cy="340" r="14" fill="#FF007A" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

console.log('PWA icons successfully generated in /public directory.');
