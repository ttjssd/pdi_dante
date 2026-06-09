"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pdi-merchandising-recommendation-history-v1";
const DAILY_LOG_STORAGE_KEY = "pdi-daily-work-log-v1";

export default function RecentRecordsStat() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const merchandising = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const dailyLogs = JSON.parse(localStorage.getItem(DAILY_LOG_STORAGE_KEY) || "[]");
        setCount((Array.isArray(merchandising) ? merchandising.length : 0) + (Array.isArray(dailyLogs) ? dailyLogs.length : 0));
      } catch {
        setCount(0);
      }
    };
    updateCount();
    window.addEventListener("pdi-records-updated", updateCount);
    return () => window.removeEventListener("pdi-records-updated", updateCount);
  }, []);

  return (
    <article className="stat-card stat-purple">
      <span>최근 기록 수</span>
      <strong>{count}</strong>
    </article>
  );
}
