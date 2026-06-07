import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");
const standaloneNext = path.join(standalone, ".next");

if (!existsSync(standalone)) {
  throw new Error(".next/standalone 폴더가 없습니다. 먼저 npm run build를 실행하세요.");
}

await mkdir(standaloneNext, { recursive: true });

const copyTargets = [
  [path.join(root, ".next", "static"), path.join(standaloneNext, "static")],
  [path.join(root, "public"), path.join(standalone, "public")],
];

for (const [from, to] of copyTargets) {
  if (!existsSync(from)) continue;
  await rm(to, { recursive: true, force: true });
  await cp(from, to, { recursive: true });
}

console.log("[electron] standalone assets prepared");
