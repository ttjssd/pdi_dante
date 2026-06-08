"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BrandIcon from "./components/BrandIcon";
import { APP_VERSION_LABEL } from "./config";
import { launcherBackgrounds } from "./launcherBackgrounds";
import {
  DEFAULT_PRIVATE_SETTINGS,
  loadPrivateSettings,
  PRIVATE_MODE_KEY,
  PRIVATE_VIDEO_OPTIONS,
  type PrivateModeSettings,
} from "./privateModeSettings";

type UpdaterState =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error"
  | "disabled";

type UpdaterStatus = {
  state: UpdaterState;
  message: string;
  version?: string;
  percent?: number;
  detail?: string;
};

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
    pdiUpdater?: {
      onStatus: (callback: (payload: UpdaterStatus) => void) => () => void;
      restartToUpdate: () => Promise<void>;
    };
  }
}

const loadingSteps = [
  { label: "Workspace Check", description: "로컬 작업공간 확인 중" },
  { label: "Module Loading", description: "업무 모듈 불러오는 중" },
  { label: "Console Preparing", description: "업무 콘솔 준비 중" },
  { label: "System Ready", description: "시스템 준비 완료" },
];

export default function LauncherClient() {
  const router = useRouter();
  const [entryLoading, setEntryLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [privateMode, setPrivateMode] = useState(false);
  const [pinPanelOpen, setPinPanelOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinMessage, setPinMessage] = useState("");
  const [privateVideoIndex, setPrivateVideoIndex] = useState(0);
  const [privateSettings, setPrivateSettings] = useState<PrivateModeSettings>(DEFAULT_PRIVATE_SETTINGS);
  const [updateStatus, setUpdateStatus] = useState<UpdaterStatus>({
    state: "idle",
    message: "업데이트 상태 대기 중",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setEntryLoading(false), 950);
    const settings = loadPrivateSettings(window.localStorage);
    setPrivateSettings(settings);
    const savedMode = window.localStorage.getItem(PRIVATE_MODE_KEY) === "on";
    setPrivateMode(settings.defaultWorkMode ? false : savedMode);
    if (settings.defaultWorkMode) window.localStorage.setItem(PRIVATE_MODE_KEY, "off");
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (launcherBackgrounds.length <= 1) return;
    const timer = window.setInterval(() => {
      setBackgroundIndex((current) => (current + 1) % launcherBackgrounds.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) return;

    const stepTimer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, loadingSteps.length - 1));
    }, 380);

    const routeTimer = window.setTimeout(() => {
      window.pdiWindow?.enterConsoleMode?.();
      router.push("/console");
    }, 1500);

    return () => {
      window.clearInterval(stepTimer);
      window.clearTimeout(routeTimer);
    };
  }, [isLoading, router]);

  useEffect(() => {
    if (!window.pdiUpdater) {
      setUpdateStatus({ state: "disabled", message: "웹 실행 환경에서는 자동 업데이트가 비활성화됩니다" });
      return;
    }

    return window.pdiUpdater.onStatus((payload) => {
      setUpdateStatus(payload);
    });
  }, []);

  const startConsole = () => {
    if (isLoading || entryLoading) return;
    setStepIndex(0);
    setIsLoading(true);
  };

  const togglePrivateMode = () => {
    if (privateMode) {
      window.localStorage.setItem(PRIVATE_MODE_KEY, "off");
      setPrivateMode(false);
      setPinPanelOpen(false);
      setPinInput("");
      setPinMessage("업무 모드로 전환했습니다.");
      return;
    }

    setPinPanelOpen((current) => !current);
    setPinMessage("");
  };

  const confirmPrivatePin = () => {
    const normalizedPin = pinInput.trim();
    if (normalizedPin.length < 4) {
      setPinMessage("PIN은 4자리 이상으로 입력해줘.");
      return;
    }

    if (normalizedPin === privateSettings.pin) {
      setPrivateVideoIndex(Math.floor(Math.random() * privateVideos.length));
      window.localStorage.setItem(PRIVATE_MODE_KEY, "on");
      setPrivateMode(true);
      setPinPanelOpen(false);
      setPinInput("");
      setPinMessage("개인 모드를 켰습니다.");
      return;
    }

    setPinMessage("PIN이 맞지 않습니다.");
  };

  const playNextPrivateMedia = () => {
    setPrivateVideoIndex((current) => (current + 1) % privateVideos.length);
  };

  const privateVideos = useMemo(() => {
    const videosById = new Map(PRIVATE_VIDEO_OPTIONS.map((video) => [video.id, video]));
    const enabledIds = new Set(privateSettings.enabledVideos);
    const ordered = privateSettings.playbackOrder
      .filter((id) => enabledIds.has(id))
      .map((id) => videosById.get(id))
      .filter((video): video is (typeof PRIVATE_VIDEO_OPTIONS)[number] => Boolean(video));

    return ordered.length > 0 ? ordered : [PRIVATE_VIDEO_OPTIONS[0]];
  }, [privateSettings]);

  useEffect(() => {
    if (privateVideoIndex >= privateVideos.length) setPrivateVideoIndex(0);
  }, [privateVideoIndex, privateVideos.length]);

  const currentBackground = launcherBackgrounds[backgroundIndex];

  return (
    <>
      <div className={`launcher-private-video ${privateMode ? "is-active" : ""}`} aria-hidden="true">
        {privateMode && (
          <video
            key={privateVideos[privateVideoIndex].src}
            src={privateVideos[privateVideoIndex].src}
            autoPlay
            muted
            playsInline
            preload="metadata"
            onEnded={playNextPrivateMedia}
            style={{ filter: `brightness(${privateSettings.brightness}) saturate(1.08) contrast(1.02)` }}
          />
        )}
      </div>

      <div className={`launcher-background-slide launcher-bg-${currentBackground.id}`} aria-hidden="true">
        <span>{currentBackground.title}</span>
      </div>

      <style jsx global>{`
        .launcher-app {
          --launcher-private-panel-alpha: ${privateMode ? "0.34" : "0.76"};
          --launcher-private-card-alpha: ${privateMode ? "0.3" : "0.42"};
          --launcher-private-border-alpha: ${privateMode ? "0.14" : "0.22"};
        }
      `}</style>

      <button className={`launcher-mode-toggle ${privateMode ? "is-private" : ""}`} type="button" onClick={togglePrivateMode}>
        {privateMode ? "PRIVATE MODE" : "WORK MODE"}
      </button>
      {pinPanelOpen && (
        <div className="launcher-pin-panel">
          <strong>PRIVATE MODE</strong>
          <span>PIN을 입력하면 개인 배경을 켭니다.</span>
          <div>
            <input
              type="password"
              value={pinInput}
              onChange={(event) => setPinInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") confirmPrivatePin();
                if (event.key === "Escape") setPinPanelOpen(false);
              }}
              autoFocus
              placeholder="PIN 입력"
            />
            <button type="button" onClick={confirmPrivatePin}>확인</button>
          </div>
        </div>
      )}
      {pinMessage && <div className="launcher-pin-message">{pinMessage}</div>}

      <aside className="launcher-action-panel">
        <div className={`launcher-updater-card updater-${updateStatus.state}`}>
          <div>
            <span>Current Version</span>
            <strong>{APP_VERSION_LABEL}</strong>
          </div>
          <div>
            <span>Update Status</span>
            <p>{updateStatus.message}</p>
            {typeof updateStatus.percent === "number" && (
              <div className="launcher-update-progress" aria-label={`다운로드 진행률 ${updateStatus.percent}%`}>
                <i style={{ width: `${updateStatus.percent}%` }} />
              </div>
            )}
            {updateStatus.version && <small>Target Version {updateStatus.version}</small>}
          </div>
          {updateStatus.state === "downloaded" && (
            <button className="launcher-restart-button" type="button" onClick={() => window.pdiUpdater?.restartToUpdate()}>
              RESTART TO UPDATE
            </button>
          )}
        </div>
        <button className="launcher-start-button" type="button" onClick={startConsole} disabled={isLoading || entryLoading}>
          {isLoading ? "LOADING..." : "START"} <span>→</span>
        </button>
        {isLoading && <small>콘솔 환경을 준비하는 중입니다.</small>}
      </aside>

      {entryLoading && (
        <div className="launcher-loading-overlay launcher-entry-loading" role="status" aria-live="polite">
          <div className="launcher-loading-card compact-loading-card">
            <div className="launcher-loading-core">
              <BrandIcon />
            </div>
            <span className="launcher-loading-kicker">LAUNCHER INITIALIZING</span>
            <h2>READYING LAUNCHER</h2>
            <p>런처 환경을 준비하는 중입니다.</p>
            <div className="launcher-progress" aria-hidden="true"><span /></div>
            <small>Version {APP_VERSION_LABEL.replace(/^v/, "")}</small>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="launcher-loading-overlay" role="status" aria-live="polite">
          <div className="launcher-loading-card">
            <div className="launcher-loading-core">
              <BrandIcon />
            </div>
            <span className="launcher-loading-kicker">SYSTEM INITIALIZING</span>
            <h2>LOADING CONSOLE</h2>
            <p>PDI 업무 콘솔을 불러오는 중입니다.</p>
            <div className="launcher-progress" aria-hidden="true">
              <span />
            </div>
            <div className="launcher-loading-step">
              <strong>{loadingSteps[stepIndex].label}</strong>
              <span>{loadingSteps[stepIndex].description}</span>
            </div>
            <small>Version {APP_VERSION_LABEL.replace(/^v/, "")}</small>
          </div>
        </div>
      )}
    </>
  );
}
