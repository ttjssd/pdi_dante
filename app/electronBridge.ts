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
    pdiBackgrounds?: {
      list: () => Promise<LocalBackground[]>;
      add: () => Promise<LocalBackground[]>;
      remove: (id: string) => Promise<LocalBackground[]>;
      openFolder: () => Promise<void>;
    };
  }
}

export {};
