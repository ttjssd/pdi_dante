import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const version = packageJson.version;
const source = path.join(root, "outputs", "app-package", "win-unpacked");
const output = path.join(root, "outputs", "launcher-releases");
const packageFileName = `pdi-backoffice-${version}.zip`;
const zipPath = path.join(output, packageFileName);
const useLocalUrl = process.argv.includes("--local");

if (!existsSync(source)) throw new Error("먼저 앱 패키지를 빌드하세요.");
await mkdir(output, { recursive: true });
await rm(zipPath, { force: true });

const result = spawnSync(
  "tar.exe",
  ["-a", "-c", "-f", zipPath, "-C", source, "."],
  { encoding: "utf8", stdio: "inherit", windowsHide: true },
);
if (result.status !== 0) throw new Error("앱 ZIP 생성에 실패했습니다.");

const sha256 = await new Promise((resolve, reject) => {
  const hash = createHash("sha256");
  const stream = createReadStream(zipPath);
  stream.on("data", (chunk) => hash.update(chunk));
  stream.on("error", reject);
  stream.on("end", () => resolve(hash.digest("hex")));
});
const size = (await stat(zipPath)).size;
const shaFilePath = path.join(output, `${packageFileName}.sha256`);
const packageUrl = useLocalUrl
  ? pathToFileURL(zipPath).href
  : `https://github.com/ttjssd/pdi_dante/releases/download/v${version}/${packageFileName}`;
const releaseDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const manifest = {
  version,
  minLauncherVersion: "1.0.0",
  releaseDate,
  notes: ["2.1.5 실행 중인 업무 앱에 새 업데이트 알림 배너 표시 및 재시작 안내 추가"],
  packages: {
    windows: {
      url: packageUrl,
      sha256,
      size,
    },
  },
};
await writeFile(path.join(output, "version.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await writeFile(shaFilePath, `${sha256}  ${packageFileName}\n`, "utf8");
console.log(`[launcher] release package created: ${zipPath}`);
console.log(`[launcher] manifest package URL: ${packageUrl}`);
console.log(`[launcher] SHA-256 file created: ${shaFilePath}`);
