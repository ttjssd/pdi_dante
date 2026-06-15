import { cp, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const appVersion = packageJson.version;
const launcherVersion = "1.0.0";
const sourceFiles = [
  path.join(root, "outputs", "launcher-installer", `PDI-Launcher-Setup-${launcherVersion}.exe`),
  path.join(root, "outputs", "launcher-releases", "version.json"),
  path.join(root, "outputs", "launcher-releases", `pdi-backoffice-${appVersion}.zip`),
  path.join(root, "outputs", "launcher-releases", `pdi-backoffice-${appVersion}.zip.sha256`),
];
const destination = path.join(root, "outputs", "custom-release");

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });

for (const source of sourceFiles) {
  await cp(source, path.join(destination, path.basename(source)));
}

console.log(`[launcher] GitHub Release assets assembled: ${destination}`);
for (const source of sourceFiles) console.log(`  - ${path.basename(source)}`);
