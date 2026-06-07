"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BrandIcon from "./components/BrandIcon";
import { APP_VERSION_LABEL } from "./config";

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

declare global {
  interface Window {
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
  const [isLoading, setIsLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<UpdaterStatus>({
    state: "idle",
    message: "업데이트 상태 대기 중",
  });

  useEffect(() => {
    if (!isLoading) return;

    const stepTimer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, loadingSteps.length - 1));
    }, 380);

    const routeTimer = window.setTimeout(() => {
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
    if (isLoading) return;
    setStepIndex(0);
    setIsLoading(true);
  };

  return (
    <>
      <aside className="launcher-action-panel">
        <span className="launcher-action-label">CONSOLE ENTRY</span>
        <h1>PDI 백오피스 플랫폼</h1>
        <p>업데이트 내역을 확인하고 개인 업무 콘솔로 진입합니다.</p>
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
        <button className="launcher-start-button" type="button" onClick={startConsole} disabled={isLoading}>
          {isLoading ? "CONSOLE LOADING..." : "START CONSOLE"} <span>→</span>
        </button>
        <small>{isLoading ? "콘솔 환경을 준비하는 중입니다." : "업무 콘솔 진입"}</small>
      </aside>

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
