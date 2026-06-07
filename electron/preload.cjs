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
