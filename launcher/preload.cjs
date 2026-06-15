const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pdiLauncher", {
  getState: () => ipcRenderer.invoke("launcher:get-state"),
  check: () => ipcRenderer.invoke("launcher:check"),
  update: () => ipcRenderer.invoke("launcher:update"),
  start: () => ipcRenderer.invoke("launcher:start"),
  openLogs: () => ipcRenderer.invoke("launcher:open-logs"),
  selectBackground: () => ipcRenderer.invoke("launcher:select-background"),
  setPrivateMode: (pin) => ipcRenderer.invoke("launcher:set-private-mode", pin),
  updateAppearance: (values) => ipcRenderer.invoke("launcher:update-appearance", values),
  resetBackground: () => ipcRenderer.invoke("launcher:reset-background"),
  getSettings: () => ipcRenderer.invoke("launcher:get-settings"),
  minimize: () => ipcRenderer.invoke("launcher:minimize"),
  close: () => ipcRenderer.invoke("launcher:close"),
  onState(callback) {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("launcher:state", listener);
    return () => ipcRenderer.removeListener("launcher:state", listener);
  },
});
