import sharp from "sharp";
import { writeFile } from "node:fs/promises";

// Ejecutar desde la raíz con: node scripts/generate-brand-icons.mjs
const source = "public/brand/wordgrow-fox-v2.png";
const background = "#e8eaee";

async function icon(size, ratio) {
  const fox = await sharp(source).resize(Math.round(size * ratio)).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: fox, gravity: "centre" }])
    .png()
    .toBuffer();
}

await sharp(source).resize(256).webp({ quality: 90 }).toFile("public/brand/wordgrow-fox.webp");
for (const expression of ["celebrate", "retry"]) {
  await sharp(`public/brand/wordgrow-fox-${expression}.png`)
    .resize(256)
    .webp({ quality: 90 })
    .toFile(`public/brand/wordgrow-fox-${expression}.webp`);
}
for (const size of [192, 512]) {
  await writeFile(`public/icons/fox-${size}.png`, await icon(size, 0.88));
}
// La diagonal del dibujo queda dentro del círculo seguro central del 80%.
await writeFile("public/icons/fox-maskable-512.png", await icon(512, 0.56));
await writeFile("app/apple-icon.png", await icon(180, 0.8));
await sharp(source).resize(48).png().toFile("app/icon.png");

// ICO con imágenes PNG de varios tamaños, sin dependencias adicionales.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((size) => sharp(source).resize(size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile("app/favicon.ico", Buffer.concat([header, ...images]));
