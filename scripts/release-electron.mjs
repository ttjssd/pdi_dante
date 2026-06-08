import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const packagePath = path.join(root, "package.json");
const packageLockPath = path.join(root, "package-lock.json");
const configPath = path.join(root, "app", "config.ts");
const outputDir = path.join(root, "outputs", "electron");

const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const packageLock = JSON.parse(readFileSync(packageLockPath, "utf8"));
const configSource = readFileSync(configPath, "utf8");
const configVersion = configSource.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
const version = packageJson.version;
const tag = `v${version}`;
const setupName = `PDI-Backoffice-Setup-${version}.exe`;
const blockmapName = `${setupName}.blockmap`;
const requiredAssets = [setupName, blockmapName, "latest.yml"];

function fail(message) {
  console.error(`[release] ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    shell: false,
  });

  if (result.status !== 0 && !options.allowFailure) {
    if (result.stdout) console.error(result.stdout);
    if (result.stderr) console.error(result.stderr);
    fail(`${command} ${args.join(" ")} 실행에 실패했습니다.`);
  }

  return result;
}

if (!version || configVersion !== version) {
  fail(`버전 불일치: package.json=${version}, app/config.ts=${configVersion}`);
}

if (packageLock.version !== version || packageLock.packages?.[""]?.version !== version) {
  fail(`package-lock.json 버전이 ${version}과 일치하지 않습니다.`);
}

const gitStatus = run("git", ["status", "--porcelain"], { capture: true }).stdout.trim();
if (gitStatus) {
  fail("커밋되지 않은 변경사항이 있습니다. 먼저 릴리즈 커밋과 push를 완료하세요.");
}

const ghCheck = run("gh", ["--version"], { capture: true, allowFailure: true });
if (ghCheck.status !== 0) {
  fail("GitHub CLI(gh)가 없습니다. https://cli.github.com/ 에서 설치 후 gh auth login을 실행하세요.");
}

const authCheck = run("gh", ["auth", "status"], { capture: true, allowFailure: true });
if (authCheck.status !== 0) {
  fail("GitHub CLI 로그인이 필요합니다. gh auth login을 먼저 실행하세요.");
}

if (existsSync(outputDir)) {
  for (const name of readdirSync(outputDir)) {
    if (/^PDI-Backoffice-Setup-.*\.(exe|blockmap)$/.test(name) || name === "latest.yml") {
      rmSync(path.join(outputDir, name), { force: true });
      console.log(`[release] 이전 산출물 삭제: ${name}`);
    }
  }
}

const npmCli = process.env.npm_execpath;
if (!npmCli) fail("npm 실행 경로를 확인할 수 없습니다.");
run(process.execPath, [npmCli, "run", "build:electron"]);

for (const asset of requiredAssets) {
  if (!existsSync(path.join(outputDir, asset))) {
    fail(`필수 산출물이 없습니다: ${asset}`);
  }
}

const repo = "ttjssd/pdi_dante";
const releaseExists = run("gh", ["release", "view", tag, "--repo", repo], {
  capture: true,
  allowFailure: true,
}).status === 0;
const assetPaths = requiredAssets.map((name) => path.join(outputDir, name));

if (releaseExists) {
  run("gh", ["release", "upload", tag, ...assetPaths, "--clobber", "--repo", repo]);
} else {
  run("gh", [
    "release",
    "create",
    tag,
    ...assetPaths,
    "--repo",
    repo,
    "--title",
    `PDI Backoffice ${version}`,
    "--generate-notes",
  ]);
}

console.log(`[release] ${tag} 빌드 및 GitHub Release 업로드 완료`);
