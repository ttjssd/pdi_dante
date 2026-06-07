"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pdi-merchandising-recommendation-history-v1";

export default function RecentRecordsStat() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCount(JSON.parse(saved).length);
    } catch {
      setCount(0);
    }
  }, []);

  return (
    <article className="stat-card stat-purple">
      <span>최근 기록 수</span>
      <strong>{count}</strong>
    </article>
  );
}
