import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const launcherSource = path.join(root, "outputs", "launcher", "win-unpacked");
const appSource = path.join(root, "outputs", "app-package", "win-unpacked");
const runtime = path.join(root, "outputs", "launcher-runtime");

for (const source of [launcherSource, appSource]) {
  if (!existsSync(source)) throw new Error(`빌드 산출물이 없습니다: ${source}`);
}

await rm(runtime, { recursive: true, force: true });
await mkdir(runtime, { recursive: true });
await cp(launcherSource, runtime, { recursive: true });
await mkdir(path.join(runtime, "app", "current"), { recursive: true });
await cp(appSource, path.join(runtime, "app", "current"), { recursive: true });
for (const directory of ["downloads", "temp"]) {
  await mkdir(path.join(runtime, "app", directory), { recursive: true });
}
for (const directory of ["backups", "launcher-data", "logs"]) {
  await mkdir(path.join(runtime, directory), { recursive: true });
}
await writeFile(
  path.join(runtime, "launcher-data", "local-version.json"),
  `${JSON.stringify({ version: packageJson.version, installedAt: new Date().toISOString() }, null, 2)}\n`,
  "utf8",
);

console.log(`[launcher] runtime prepared: ${runtime}`);
