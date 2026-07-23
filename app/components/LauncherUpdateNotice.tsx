"use client";

import { useEffect, useState } from "react";
import type { LauncherUpdateNotice as LauncherUpdateNoticePayload } from "../electronBridge";

const DISMISSED_STORAGE_KEY = "pdi-dismissed-launcher-update-notice";
const FIRED_STORAGE_KEY = "pdi-fired-launcher-update-notice";

function getDismissedIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_STORAGE_KEY) || "[]") as string[]);
  } catch {
    return new Set<string>();
  }
}

function saveDismissedIds(ids: Set<string>) {
  localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-20)));
}

export default function LauncherUpdateNotice() {
  const [notice, setNotice] = useState<LauncherUpdateNoticePayload | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    setDismissedIds(getDismissedIds());
  }, []);

  useEffect(() => {
    if (!window.pdiLauncherUpdateNotice) return;
    let canceled = false;

    async function loadNotice() {
      const nextNotice = await window.pdiLauncherUpdateNotice?.get();
      if (!canceled) {
        setNotice(nextNotice || null);
        if (nextNotice) fireDesktopNotification(nextNotice);
      }
    }

    loadNotice();
    const timer = window.setInterval(loadNotice, 30_000);
    return () => {
      canceled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (!notice || dismissedIds?.has(notice.id)) return null;

  function dismiss() {
    if (!notice) return;
    const next = new Set(dismissedIds || []);
    next.add(notice.id);
    saveDismissedIds(next);
    setDismissedIds(next);
  }

  return (
    <section className="launcher-update-notice" role="status" aria-live="polite">
      <div>
        <span>UPDATE READY</span>
        <h2>{notice.title}</h2>
        <p>{notice.message}</p>
        <strong>{notice.actionText || "업무 내용을 저장한 뒤 프로그램을 종료하고 런처에서 업데이트를 적용해 주세요."}</strong>
        {notice.notes && notice.notes.length > 0 && (
          <ul>
            {notice.notes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}
      </div>
      <aside>
        <small>현재 {notice.currentVersion || "확인 중"}</small>
        <b>v{notice.version}</b>
        {notice.restartRequired && <em>재시작 필요</em>}
        <button type="button" onClick={dismiss}>확인</button>
      </aside>
    </section>
  );
}

function fireDesktopNotification(notice: LauncherUpdateNoticePayload) {
  if (!("Notification" in window)) return;
  const firedKey = `${FIRED_STORAGE_KEY}:${notice.id}`;
  if (localStorage.getItem(firedKey)) return;

  const show = () => {
    localStorage.setItem(firedKey, new Date().toISOString());
    new Notification(notice.title, {
      body: `${notice.message} 업무 내용을 저장한 뒤 재시작해 주세요.`,
      tag: notice.id,
      requireInteraction: true,
    });
  };

  if (Notification.permission === "granted") {
    show();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") show();
    });
  }
}
