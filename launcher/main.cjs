const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("child_process");
const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const DEFAULT_MANIFEST_URL = "https://github.com/ttjssd/pdi_dante/releases/latest/download/version.json";
const APP_EXECUTABLE = "PDI Backoffice.exe";
const LAUNCHER_VERSION = "1.0.0";
const SUPPORTED_BACKGROUND_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4"]);
const DEFAULT_SETTINGS = {
  manifestUrl: DEFAULT_MANIFEST_URL,
  privateModeEnabled: false,
  privateModeUnlocked: false,
  privateModePin: "3333",
  backgroundMode: "default",
  localBackgroundPath: "",
  backgroundDim: 0.45,
  backgroundBlur: 0,
  lastCheckUpdateAt: "",
  launcherTheme: "cyber",
};

let mainWindow;
let runningApp;
let privateModeUnlocked = false;
let state = {
  phase: "starting",
  message: "런처 환경을 준비하는 중",
  progress: 0,
  currentVersion: "0.0.0",
  latestVersion: null,
  updateAvailable: false,
  canStart: false,
  busy: true,
  launcherVersion: LAUNCHER_VERSION,
  releaseNotes: [],
  settings: null,
};

function getRuntimeRoot() {
  if (process.env.PDI_LAUNCHER_ROOT) return path.resolve(process.env.PDI_LAUNCHER_ROOT);
  return app.isPackaged
    ? path.dirname(process.execPath)
    : path.join(__dirname, "..", "outputs", "launcher-runtime");
}

function getPaths() {
  const root = getRuntimeRoot();
  return {
    root,
    current: path.join(root, "app", "current"),
    downloads: path.join(root, "app", "downloads"),
    temp: path.join(root, "app", "temp"),
    backups: path.join(root, "backups"),
    data: path.join(root, "launcher-data"),
    privateAssets: path.join(root, "launcher-data", "private-assets"),
    logs: path.join(root, "logs"),
    logFile: path.join(root, "logs", "launcher.log"),
    localVersion: path.join(root, "launcher-data", "local-version.json"),
    settings: path.join(root, "launcher-data", "settings.json"),
    transaction: path.join(root, "launcher-data", "update-state.json"),
  };
}

function ensureDirectories() {
  const paths = getPaths();
  for (const directory of [
    paths.downloads,
    paths.temp,
    paths.backups,
    paths.data,
    paths.privateAssets,
    paths.logs,
  ]) {
    fs.mkdirSync(directory, { recursive: true });
  }
  if (!fs.existsSync(paths.logFile)) fs.writeFileSync(paths.logFile, "", "utf8");
  return paths;
}

function log(message) {
  try {
    const { logFile } = ensureDirectories();
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
  } catch {}
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function loadSettings() {
  const paths = ensureDirectories();
  const stored = readJson(paths.settings);
  if (stored === null && fs.existsSync(paths.settings)) {
    const brokenPath = `${paths.settings}.broken-${Date.now()}`;
    try {
      fs.renameSync(paths.settings, brokenPath);
      log(`broken settings moved to ${brokenPath}`);
    } catch {}
  }

  const settings = {
    ...DEFAULT_SETTINGS,
    ...(stored || {}),
    privateModeUnlocked: false,
  };
  settings.backgroundDim = Math.min(0.8, Math.max(0.1, Number(settings.backgroundDim) || 0.45));
  settings.backgroundBlur = Math.min(12, Math.max(0, Number(settings.backgroundBlur) || 0));
  writeJson(paths.settings, settings);
  return settings;
}

function saveSettings(patch) {
  const paths = ensureDirectories();
  const settings = { ...loadSettings(), ...patch, privateModeUnlocked: false };
  writeJson(paths.settings, settings);
  return settings;
}

function getBackgroundState(settings = loadSettings()) {
  const configuredPath = settings.localBackgroundPath ? path.resolve(settings.localBackgroundPath) : "";
  const extension = configuredPath ? path.extname(configuredPath).toLowerCase() : "";
  const backgroundAvailable =
    Boolean(configuredPath) &&
    SUPPORTED_BACKGROUND_EXTENSIONS.has(extension) &&
    fs.existsSync(configuredPath);
  const privateModeActive =
    settings.privateModeEnabled &&
    privateModeUnlocked &&
    settings.backgroundMode === "local" &&
    backgroundAvailable;

  return {
    mode: settings.backgroundMode,
    privateModeEnabled: settings.privateModeEnabled,
    privateModeUnlocked,
    privateModeActive,
    backgroundAvailable,
    backgroundName: backgroundAvailable ? path.basename(configuredPath) : "",
    backgroundUrl: privateModeActive ? pathToFileURL(configuredPath).href : "",
    backgroundType: extension === ".mp4" ? "video" : "image",
    backgroundDim: settings.backgroundDim,
    backgroundBlur: settings.backgroundBlur,
  };
}

function getPublicSettings() {
  const settings = loadSettings();
  return {
    ...getBackgroundState(settings),
    lastCheckUpdateAt: settings.lastCheckUpdateAt,
    launcherTheme: settings.launcherTheme,
  };
}

function sendState(patch) {
  state = { ...state, ...patch, settings: getPublicSettings() };
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("launcher:state", state);
}

function compareVersions(left, right) {
  const a = String(left).split(".").map((part) => Number(part) || 0);
  const b = String(right).split(".").map((part) => Number(part) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) > (b[index] || 0)) return 1;
    if ((a[index] || 0) < (b[index] || 0)) return -1;
  }
  return 0;
}

function getLocalVersion() {
  const paths = ensureDirectories();
  const metadata = readJson(paths.localVersion, {});
  const executableExists = fs.existsSync(path.join(paths.current, APP_EXECUTABLE));
  return {
    version: executableExists ? metadata.version || "0.0.0" : "0.0.0",
    executableExists,
  };
}

async function readManifest(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) throw new Error(`버전 정보 요청 실패 (${response.status})`);
    return response.json();
  }
  const filePath = source.startsWith("file://") ? new URL(source) : path.resolve(source);
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function validateManifest(manifest) {
  const pkg = manifest?.packages?.windows;
  if (!manifest?.version || !pkg?.url || !pkg?.sha256 || !pkg?.size) {
    throw new Error("version.json 형식이 올바르지 않습니다.");
  }
  if (manifest.minLauncherVersion && compareVersions(LAUNCHER_VERSION, manifest.minLauncherVersion) < 0) {
    throw new Error(`Launcher ${manifest.minLauncherVersion} 이상이 필요합니다.`);
  }
  return manifest;
}

async function checkForUpdates({ installWhenMissing = true } = {}) {
  const local = getLocalVersion();
  sendState({
    phase: "checking",
    message: local.executableExists ? "최신 버전을 확인하는 중" : "최초 설치 패키지를 확인하는 중",
    progress: 0,
    currentVersion: local.version,
    latestVersion: null,
    updateAvailable: false,
    canStart: local.executableExists,
    busy: true,
  });

  try {
    const settings = loadSettings();
    const manifest = validateManifest(await readManifest(settings.manifestUrl));
    const updateAvailable = !local.executableExists || compareVersions(manifest.version, local.version) > 0;
    saveSettings({ lastCheckUpdateAt: new Date().toISOString() });
    sendState({
      phase: updateAvailable ? "available" : "ready",
      message: updateAvailable
        ? local.executableExists
          ? `새 버전 ${manifest.version} 사용 가능`
          : `PDI Backoffice ${manifest.version} 최초 설치 필요`
        : "최신 버전입니다",
      currentVersion: local.version,
      latestVersion: manifest.version,
      updateAvailable,
      progress: updateAvailable ? 0 : 100,
      canStart: local.executableExists,
      busy: false,
      manifest,
      releaseNotes: Array.isArray(manifest.notes) ? manifest.notes.slice(0, 3) : [],
    });

    if (!local.executableExists && updateAvailable && installWhenMissing) {
      return applyUpdate();
    }
    return state;
  } catch (error) {
    log(`update check failed: ${error.stack || error.message}`);
    sendState({
      phase: "error",
      message: local.executableExists
        ? "업데이트 확인에 실패했지만 기존 버전은 계속 사용할 수 있습니다."
        : `최초 설치 정보를 불러오지 못했습니다: ${error.message}`,
      canStart: local.executableExists,
      busy: false,
    });
    return state;
  }
}

async function downloadPackage(url, destination, expectedSize) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (!/^https?:\/\//i.test(url)) {
    const source = url.startsWith("file://") ? new URL(url) : path.resolve(url);
    fs.copyFileSync(source, destination);
    sendState({ phase: "downloading", progress: 100, message: "패키지 다운로드 완료" });
    return;
  }

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok || !response.body) throw new Error(`패키지 다운로드 실패 (${response.status})`);
  const total = Number(response.headers.get("content-length")) || Number(expectedSize) || 0;
  const writer = fs.createWriteStream(destination);
  const reader = response.body.getReader();
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    writer.write(Buffer.from(value));
    received += value.byteLength;
    const progress = total ? Math.min(100, Math.round((received / total) * 100)) : 0;
    sendState({ phase: "downloading", progress, message: `업데이트 다운로드 중 ${progress}%` });
  }
  await new Promise((resolve, reject) => {
    writer.once("error", reject);
    writer.end(resolve);
  });
}

async function calculateSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function extractZip(zipPath, destination) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });
  await new Promise((resolve, reject) => {
    const child = spawn("tar.exe", ["-x", "-f", zipPath, "-C", destination], {
      windowsHide: true,
      stdio: "ignore",
    });
    child.once("error", reject);
    child.once("exit", (code) => (code === 0 ? resolve() : reject(new Error(`압축 해제 실패 (${code})`))));
  });
}

function findExtractedApp(directory) {
  const direct = path.join(directory, APP_EXECUTABLE);
  if (fs.existsSync(direct)) return directory;
  const children = fs.readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  for (const child of children) {
    const candidate = path.join(directory, child.name);
    if (fs.existsSync(path.join(candidate, APP_EXECUTABLE))) return candidate;
  }
  throw new Error(`${APP_EXECUTABLE}를 패키지에서 찾을 수 없습니다.`);
}

function recoverInterruptedUpdate() {
  const paths = ensureDirectories();
  const transaction = readJson(paths.transaction);
  if (!transaction) return;
  log(`recover transaction: ${JSON.stringify(transaction)}`);
  if (!fs.existsSync(paths.current) && transaction.backupPath && fs.existsSync(transaction.backupPath)) {
    fs.renameSync(transaction.backupPath, paths.current);
    log(`restored backup: ${transaction.backupPath}`);
  }
  fs.rmSync(paths.transaction, { force: true });
}

async function applyUpdate() {
  if (state.busy || !state.manifest) return state;
  const manifest = validateManifest(state.manifest);
  const paths = ensureDirectories();
  const packageName = `pdi-backoffice-${manifest.version}.zip`;
  const packagePath = path.join(paths.downloads, packageName);
  const extractPath = path.join(paths.temp, manifest.version);
  const local = getLocalVersion();
  let backupPath = null;

  sendState({
    phase: "downloading",
    message: local.executableExists ? "업데이트 다운로드 준비 중" : "업무 앱 최초 설치 준비 중",
    progress: 0,
    busy: true,
    canStart: local.executableExists,
  });

  try {
    await downloadPackage(manifest.packages.windows.url, packagePath, manifest.packages.windows.size);
    sendState({ phase: "verifying", message: "패키지 무결성 확인 중", progress: 100 });
    const actualHash = await calculateSha256(packagePath);
    if (actualHash.toLowerCase() !== manifest.packages.windows.sha256.toLowerCase()) {
      throw new Error("SHA-256 검증에 실패했습니다.");
    }

    sendState({ phase: "extracting", message: "업무 앱 압축 해제 중", progress: 100 });
    await extractZip(packagePath, extractPath);
    const extractedApp = findExtractedApp(extractPath);

    sendState({ phase: "applying", message: "업무 앱 파일 적용 중", progress: 100 });
    if (runningApp && runningApp.exitCode === null) {
      throw new Error("업무 앱을 종료한 뒤 업데이트해 주세요.");
    }

    if (fs.existsSync(paths.current)) {
      backupPath = path.join(paths.backups, `${local.version}-${Date.now()}`);
      fs.renameSync(paths.current, backupPath);
    }
    writeJson(paths.transaction, { phase: "applying", backupPath, targetVersion: manifest.version });
    fs.renameSync(extractedApp, paths.current);
    writeJson(paths.localVersion, {
      version: manifest.version,
      installedAt: new Date().toISOString(),
    });
    fs.rmSync(paths.transaction, { force: true });
    fs.rmSync(extractPath, { recursive: true, force: true });
    fs.rmSync(packagePath, { force: true });

    log(`app ${local.version} -> ${manifest.version} applied`);
    sendState({
      phase: "complete",
      message: local.executableExists
        ? `업데이트 ${manifest.version} 적용 완료`
        : `PDI Backoffice ${manifest.version} 설치 완료`,
      progress: 100,
      currentVersion: manifest.version,
      latestVersion: manifest.version,
      updateAvailable: false,
      canStart: true,
      busy: false,
    });
  } catch (error) {
    log(`update failed: ${error.stack || error.message}`);
    try {
      if (!fs.existsSync(paths.current) && backupPath && fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, paths.current);
        log(`backup restored after failure: ${backupPath}`);
      }
      fs.rmSync(paths.transaction, { force: true });
    } catch (restoreError) {
      log(`restore failed: ${restoreError.stack || restoreError.message}`);
    }
    const restored = getLocalVersion();
    sendState({
      phase: "error",
      message: restored.executableExists
        ? "업데이트에 실패했지만 기존 버전은 계속 사용할 수 있습니다. 로그를 확인해 주세요."
        : `업무 앱 설치에 실패했습니다: ${error.message}`,
      currentVersion: restored.version,
      canStart: restored.executableExists,
      busy: false,
    });
  }
  return state;
}

async function startBackoffice() {
  const paths = ensureDirectories();
  const executable = path.join(paths.current, APP_EXECUTABLE);
  if (!fs.existsSync(executable)) {
    sendState({ phase: "error", message: "설치된 PDI Backoffice 앱이 없습니다.", canStart: false });
    return { ok: false, error: "설치된 PDI Backoffice 앱이 없습니다." };
  }
  if (runningApp && runningApp.exitCode === null) return { ok: true, alreadyRunning: true };

  sendState({ canStart: false, busy: true, message: "PDI Backoffice 실행 확인 중" });

  return new Promise((resolve) => {
    let launchConfirmed = false;
    const child = spawn(executable, ["--console", "--managed-by-launcher"], {
      cwd: paths.current,
      detached: false,
      windowsHide: false,
      env: { ...process.env, PDI_MANAGED_BY_LAUNCHER: "1" },
    });
    runningApp = child;

    child.once("error", (error) => {
      runningApp = null;
      log(`app launch failed: ${error.stack || error.message}`);
      sendState({
        phase: "error",
        message: `업무 앱 실행에 실패했습니다: ${error.message}`,
        canStart: true,
        busy: false,
      });
      resolve({ ok: false, error: error.message });
    });

    child.once("spawn", () => {
      setTimeout(() => {
        if (child.exitCode !== null || child.killed) return;
        launchConfirmed = true;
        log(`app launch confirmed: pid=${child.pid}`);
        sendState({ canStart: false, busy: false, message: "PDI Backoffice 실행 중" });
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
        resolve({ ok: true, hidden: true });
      }, 1200);
    });

    child.once("exit", (code) => {
      runningApp = null;
      if (!launchConfirmed) {
        log(`app exited before launch confirmation: code=${code}`);
        sendState({
          phase: "error",
          message: `업무 앱이 실행 직후 종료되었습니다. 로그를 확인해 주세요. (${code ?? "unknown"})`,
          canStart: true,
          busy: false,
        });
        resolve({ ok: false, error: `early exit: ${code}` });
        return;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
      sendState({ phase: "ready", canStart: true, busy: false, message: "업무 앱이 종료되었습니다" });
    });
  });
}

async function chooseLocalBackground() {
  let source = process.env.PDI_LAUNCHER_TEST_BACKGROUND || "";
  if (!source) {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "런처 로컬 배경 선택",
      properties: ["openFile"],
      filters: [
        { name: "이미지, GIF 및 MP4", extensions: ["png", "jpg", "jpeg", "webp", "gif", "mp4"] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) return { canceled: true };
    source = result.filePaths[0];
  }
  const extension = path.extname(source).toLowerCase();
  if (!SUPPORTED_BACKGROUND_EXTENSIONS.has(extension)) {
    return { canceled: false, error: "지원하지 않는 파일 형식입니다." };
  }

  const paths = ensureDirectories();
  const destination = path.join(paths.privateAssets, `private-background${extension}`);
  for (const file of fs.readdirSync(paths.privateAssets)) {
    if (file.startsWith("private-background.")) {
      fs.rmSync(path.join(paths.privateAssets, file), { force: true });
    }
  }
  fs.copyFileSync(source, destination);
  saveSettings({ backgroundMode: "local", localBackgroundPath: destination });
  log(`private background selected: ${path.basename(destination)}`);
  sendState({});
  return { canceled: false, settings: getPublicSettings() };
}

function setPrivateMode(pin) {
  const settings = loadSettings();
  if (settings.privateModeEnabled && privateModeUnlocked) {
    privateModeUnlocked = false;
    saveSettings({ privateModeEnabled: false });
    sendState({ message: "프라이빗 모드를 종료했습니다" });
    return { ok: true, settings: getPublicSettings() };
  }

  if (String(pin || "") !== String(settings.privateModePin || "3333")) {
    return { ok: false, error: "PIN이 맞지 않습니다." };
  }

  privateModeUnlocked = true;
  saveSettings({ privateModeEnabled: true });
  sendState({ message: "프라이빗 모드가 활성화되었습니다" });
  return { ok: true, settings: getPublicSettings() };
}

function updateAppearance(values) {
  const patch = {};
  if (values?.backgroundMode === "default" || values?.backgroundMode === "local") {
    patch.backgroundMode = values.backgroundMode;
  }
  if (values?.backgroundDim !== undefined) {
    patch.backgroundDim = Math.min(0.8, Math.max(0.1, Number(values.backgroundDim) || 0.45));
  }
  if (values?.backgroundBlur !== undefined) {
    patch.backgroundBlur = Math.min(12, Math.max(0, Number(values.backgroundBlur) || 0));
  }
  saveSettings(patch);
  sendState({});
  return getPublicSettings();
}

function resetBackground() {
  const paths = ensureDirectories();
  for (const file of fs.readdirSync(paths.privateAssets)) {
    if (file.startsWith("private-background.")) {
      fs.rmSync(path.join(paths.privateAssets, file), { force: true });
    }
  }
  saveSettings({
    backgroundMode: "default",
    localBackgroundPath: "",
    backgroundDim: DEFAULT_SETTINGS.backgroundDim,
    backgroundBlur: DEFAULT_SETTINGS.backgroundBlur,
  });
  log("private background reset");
  sendState({ message: "로컬 배경을 초기화했습니다" });
  return getPublicSettings();
}

async function createWindow() {
  recoverInterruptedUpdate();
  loadSettings();
  const local = getLocalVersion();
  state.currentVersion = local.version;
  state.canStart = local.executableExists;
  state.settings = getPublicSettings();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 980,
    minHeight: 650,
    title: "PDI Launcher",
    frame: false,
    backgroundColor: "#050816",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  await mainWindow.loadFile(path.join(__dirname, "index.html"));
  await checkForUpdates({ installWhenMissing: true });
}

ipcMain.handle("launcher:get-state", () => state);
ipcMain.handle("launcher:check", () => checkForUpdates({ installWhenMissing: true }));
ipcMain.handle("launcher:update", () => applyUpdate());
ipcMain.handle("launcher:start", () => startBackoffice());
ipcMain.handle("launcher:open-logs", () => shell.openPath(ensureDirectories().logFile));
ipcMain.handle("launcher:select-background", () => chooseLocalBackground());
ipcMain.handle("launcher:set-private-mode", (_event, pin) => setPrivateMode(pin));
ipcMain.handle("launcher:update-appearance", (_event, values) => updateAppearance(values));
ipcMain.handle("launcher:reset-background", () => resetBackground());
ipcMain.handle("launcher:get-settings", () => getPublicSettings());
ipcMain.handle("launcher:minimize", () => mainWindow?.minimize());
ipcMain.handle("launcher:close", () => mainWindow?.close());

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.setName("PDI Launcher");
