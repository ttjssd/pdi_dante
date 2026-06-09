const { app, BrowserWindow, dialog, ipcMain, net: electronNet, protocol, shell } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const nodeNet = require("net");
const { pathToFileURL } = require("url");
const packageJson = require("../package.json");

const PORT = process.env.PDI_PORT || "3187";
const APP_URL = `http://127.0.0.1:${PORT}`;
const APP_TITLE = "PDI Backoffice";
let nextProcess;
let mainWindow;
let autoUpdater;

protocol.registerSchemesAsPrivileged([
  {
    scheme: "pdi-media",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

const BACKGROUND_EXTENSIONS = new Map([
  [".mp4", "video"],
  [".webm", "video"],
  [".ogv", "video"],
  [".png", "image"],
  [".jpg", "image"],
  [".jpeg", "image"],
  [".webp", "image"],
  [".gif", "image"],
]);

function getBackgroundDirectory() {
  return path.join(app.getPath("userData"), "backgrounds");
}

function ensureBackgroundDirectory() {
  const directory = getBackgroundDirectory();
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

function isPathInsideDirectory(candidate, directory) {
  const relative = path.relative(directory, candidate);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function getLocalBackgrounds() {
  const directory = ensureBackgroundDirectory();
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && BACKGROUND_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => {
      const extension = path.extname(entry.name).toLowerCase();
      const filePath = path.join(directory, entry.name);
      const displayName = path.basename(entry.name, extension).replace(/-\d{13}-[a-z0-9]{5}$/i, "");
      return {
        id: entry.name,
        name: displayName,
        type: BACKGROUND_EXTENSIONS.get(extension),
        url: `pdi-media://backgrounds/${encodeURIComponent(entry.name)}`,
        size: fs.statSync(filePath).size,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

async function setupLocalBackgroundProtocol() {
  protocol.handle("pdi-media", (request) => {
    const requestUrl = new URL(request.url);
    if (requestUrl.hostname !== "backgrounds") return new Response("Not found", { status: 404 });

    const directory = ensureBackgroundDirectory();
    const fileName = decodeURIComponent(requestUrl.pathname.replace(/^\/+/, ""));
    const filePath = path.resolve(directory, fileName);
    if (!isPathInsideDirectory(filePath, directory) || !fs.existsSync(filePath)) {
      return new Response("Not found", { status: 404 });
    }
    return electronNet.fetch(pathToFileURL(filePath).toString());
  });
}

function writeDebugLog(message) {
  try {
    const logPath = path.join(app.getPath("userData"), "pdi-electron.log");
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
  } catch {
    // Logging must never block the app.
  }
}

process.on("uncaughtException", (error) => {
  writeDebugLog(`uncaughtException: ${error.stack || error.message}`);
});

process.on("unhandledRejection", (reason) => {
  writeDebugLog(`unhandledRejection: ${reason?.stack || reason}`);
});

try {
  autoUpdater = require("electron-updater").autoUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
} catch (error) {
  writeDebugLog(`electron-updater load failed: ${error.message}`);
  autoUpdater = null;
}

function sendUpdateStatus(payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("updater:status", payload);
}


function getWindowMode() {
  if (!mainWindow || mainWindow.isDestroyed()) return { maximized: false, fullScreen: false };
  return {
    maximized: mainWindow.isMaximized(),
    fullScreen: mainWindow.isFullScreen(),
  };
}

function setupAutoUpdater() {
  if (!autoUpdater) return;
  autoUpdater.on("checking-for-update", () => {
    sendUpdateStatus({ state: "checking", message: "최신 버전 확인 중" });
  });
  autoUpdater.on("update-available", (info) => {
    sendUpdateStatus({ state: "available", version: info.version, message: "새 업데이트 발견" });
  });
  autoUpdater.on("update-not-available", () => {
    sendUpdateStatus({ state: "not-available", message: "최신 버전입니다" });
  });
  autoUpdater.on("download-progress", (progress) => {
    const percent = Math.round(progress.percent || 0);
    sendUpdateStatus({ state: "downloading", percent, message: `다운로드 중 ${percent}%` });
  });
  autoUpdater.on("update-downloaded", (info) => {
    sendUpdateStatus({ state: "downloaded", version: info.version, message: "다운로드 완료" });
  });
  autoUpdater.on("error", (error) => {
    sendUpdateStatus({ state: "error", message: "업데이트 확인 실패", detail: error.message });
  });
}

function waitForServer(url, timeoutMs = 20000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const socket = nodeNet.createConnection(Number(PORT), "127.0.0.1");
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`${url} 서버 시작 시간이 초과되었습니다.`));
          return;
        }
        setTimeout(check, 350);
      });
    };
    check();
  });
}

function startNextServer() {
  writeDebugLog("startNextServer");
  const isDev = !app.isPackaged;
  const projectRoot = path.join(__dirname, "..");
  const serverFile = isDev
    ? path.join(projectRoot, "node_modules", "next", "dist", "bin", "next")
    : path.join(projectRoot, ".next", "standalone", "server.js");

  const args = isDev ? [serverFile, "dev", "-p", PORT] : [serverFile];
  nextProcess = spawn(process.execPath, args, {
    cwd: isDev ? projectRoot : path.join(projectRoot, ".next", "standalone"),
    env: {
      ...process.env,
      NODE_ENV: isDev ? "development" : "production",
      PORT,
      HOSTNAME: "127.0.0.1",
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: "ignore",
    windowsHide: true,
  });
}

async function createWindow() {
  writeDebugLog("createWindow start");
  startNextServer();
  await waitForServer(APP_URL);
  writeDebugLog("next server ready");

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: "#050816",
    title: APP_TITLE,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  await mainWindow.loadURL(APP_URL);
  writeDebugLog("window loaded");

  if (app.isPackaged) {
    sendUpdateStatus({ state: "checking", message: "최신 버전 확인 중" });
    if (!autoUpdater) {
      sendUpdateStatus({ state: "error", message: "업데이트 모듈을 불러오지 못했습니다" });
      return;
    }
    autoUpdater.checkForUpdates().catch((error) => {
      sendUpdateStatus({ state: "error", message: "업데이트 확인 실패", detail: error.message });
    });
  } else {
    sendUpdateStatus({ state: "disabled", message: "개발 환경에서는 자동 업데이트가 비활성화됩니다" });
  }
}

setupAutoUpdater();


ipcMain.handle("window:enter-console-mode", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return getWindowMode();
  mainWindow.maximize();
  return getWindowMode();
});

ipcMain.handle("window:toggle-maximize", () => {
  if (!mainWindow || mainWindow.isDestroyed()) return getWindowMode();
  if (mainWindow.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow.maximize();
  }
  return getWindowMode();
});

ipcMain.handle("window:get-mode", () => getWindowMode());

ipcMain.handle("updater:restart", () => {
  if (!autoUpdater) return false;
  autoUpdater.quitAndInstall(true, true);
  return true;
});

ipcMain.handle("backgrounds:list", () => getLocalBackgrounds());

ipcMain.handle("backgrounds:add", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "프라이빗 배경 추가",
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "영상 및 이미지", extensions: [...BACKGROUND_EXTENSIONS.keys()].map((ext) => ext.slice(1)) },
      { name: "영상", extensions: ["mp4", "webm", "ogv"] },
      { name: "이미지", extensions: ["png", "jpg", "jpeg", "webp", "gif"] },
    ],
  });

  if (result.canceled) return getLocalBackgrounds();

  const directory = ensureBackgroundDirectory();
  for (const sourcePath of result.filePaths) {
    const extension = path.extname(sourcePath).toLowerCase();
    if (!BACKGROUND_EXTENSIONS.has(extension)) continue;
    const safeBase = path.basename(sourcePath, extension)
      .normalize("NFKC")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "background";
    const suffix = Math.random().toString(36).slice(2, 7);
    const destination = path.join(directory, `${safeBase}-${Date.now()}-${suffix}${extension}`);
    fs.copyFileSync(sourcePath, destination);
  }
  return getLocalBackgrounds();
});

ipcMain.handle("backgrounds:remove", (_event, id) => {
  const directory = ensureBackgroundDirectory();
  const filePath = path.resolve(directory, String(id || ""));
  if (isPathInsideDirectory(filePath, directory) && fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
  }
  return getLocalBackgrounds();
});

ipcMain.handle("backgrounds:open-folder", async () => {
  await shell.openPath(ensureBackgroundDirectory());
});

app.whenReady().then(async () => {
  await setupLocalBackgroundProtocol();
  await createWindow();
});

app.on("window-all-closed", () => {
  if (nextProcess && !nextProcess.killed) nextProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.setName(APP_TITLE);

app.on("before-quit", () => {
  if (nextProcess && !nextProcess.killed) nextProcess.kill();
});
