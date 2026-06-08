const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pdiUpdater", {
  onStatus(callback) {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("updater:status", listener);
    return () => ipcRenderer.removeListener("updater:status", listener);
  },
  restartToUpdate() {
    return ipcRenderer.invoke("updater:restart");
  },
});

contextBridge.exposeInMainWorld("pdiWindow", {
  enterConsoleMode() {
    return ipcRenderer.invoke("window:enter-console-mode");
  },
  toggleMaximize() {
    return ipcRenderer.invoke("window:toggle-maximize");
  },
  getMode() {
    return ipcRenderer.invoke("window:get-mode");
  },
});