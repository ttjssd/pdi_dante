export type WindowMode = {
  maximized: boolean;
  fullScreen: boolean;
};

export type UpdaterState =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "applying"
  | "error"
  | "disabled";

export type UpdaterStatus = {
  state: UpdaterState;
  message: string;
  version?: string;
  percent?: number;
  detail?: string;
};

export type LauncherUpdateNotice = {
  id: string;
  type: "update-available";
  version: string;
  currentVersion?: string;
  detectedAt?: string;
  title: string;
  message: string;
  restartRequired?: boolean;
  actionText?: string;
  notes?: string[];
};

export type LocalBackground = {
  id: string;
  name: string;
  type: "video" | "image";
  url: string;
  size: number;
};

declare global {
  interface Window {
    pdiWindow?: {
      enterConsoleMode: () => Promise<WindowMode>;
      toggleMaximize: () => Promise<WindowMode>;
      getMode: () => Promise<WindowMode>;
    };
    pdiUpdater?: {
      onStatus: (callback: (payload: UpdaterStatus) => void) => () => void;
      restartToUpdate: () => Promise<void>;
    };
    pdiLauncherUpdateNotice?: {
      get: () => Promise<LauncherUpdateNotice | null>;
    };
    pdiBackgrounds?: {
      list: () => Promise<LocalBackground[]>;
      add: () => Promise<LocalBackground[]>;
      remove: (id: string) => Promise<LocalBackground[]>;
      openFolder: () => Promise<void>;
    };
  }
}

export {};
