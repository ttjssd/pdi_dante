"use client";

import { useEffect, useState } from "react";

type WindowMode = {
  maximized: boolean;
  fullScreen: boolean;
};

declare global {
  interface Window {
    pdiWindow?: {
      enterConsoleMode: () => Promise<WindowMode>;
      toggleMaximize: () => Promise<WindowMode>;
      getMode: () => Promise<WindowMode>;
    };
  }
}

export default function WindowModeControl() {
  const [mode, setMode] = useState<WindowMode>({ maximized: false, fullScreen: false });
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!window.pdiWindow) return;
    setAvailable(true);
    window.pdiWindow.getMode().then(setMode).catch(() => setAvailable(false));
  }, []);

  async function toggleMode() {
    if (!window.pdiWindow) return;
    const nextMode = await window.pdiWindow.toggleMaximize();
    setMode(nextMode);
  }

  if (!available) return null;

  return (
    <button className="window-mode-button" type="button" onClick={toggleMode}>
      {mode.maximized ? "창모드" : "전체화면"}
    </button>
  );
}
