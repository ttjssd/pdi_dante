import { copyFile, mkdir, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const sourceDirectory = join(homedir(), "Pictures", "Screenshots");
const targetDirectory = join(process.cwd(), "public", "guides", "remanufacturing");

const guideImages = [
  ["스크린샷 2026-06-07 163158.png", "guide-not-required-blackbox.png"],
  ["스크린샷 2026-06-07 163235.png", "guide-upload-example.png"],
  ["스크린샷 2026-06-07 163241.png", "guide-strikethrough-check.png"],
  ["스크린샷 2026-06-07 163245.png", "guide-process-status.png"],
];

await mkdir(targetDirectory, { recursive: true });

for (const [sourceName, targetName] of guideImages) {
  const sourcePath = join(sourceDirectory, sourceName);
  const targetPath = join(targetDirectory, targetName);

  try {
    await stat(sourcePath);
    await copyFile(sourcePath, targetPath);
    console.log(`[guide-image] ${targetName}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    console.warn(`[guide-image] 원본을 찾지 못해 건너뜀: ${sourceName}`);
  }
}
