"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge, type Status, type Tone } from "./platform";

type ToolSearchItem = {
  title: string;
  category: string;
  description: string;
  href: string;
  status: Status;
  tone: Tone;
  keywords: string[];
};

const quickKeywords = ["누락", "탁송", "제주", "타이어", "항동", "칸반", "시동", "경고등"];

function normalize(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function scoreItem(item: ToolSearchItem, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;

  const title = normalize(item.title);
  const category = normalize(item.category);
  const description = normalize(item.description);
  const keywords = item.keywords.map(normalize);

  let score = 0;
  if (title.includes(normalizedQuery)) score += 80;
  if (category.includes(normalizedQuery)) score += 45;
  if (keywords.some((keyword) => keyword === normalizedQuery)) score += 60;
  if (keywords.some((keyword) => keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword))) score += 36;
  if (description.includes(normalizedQuery)) score += 18;

  return score;
}

export default function ToolSearch({ items }: { items: ToolSearchItem[] }) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();

  const results = useMemo(() => {
    if (!trimmedQuery) return [];

    return items
      .map((item) => ({ item, score: scoreItem(item, trimmedQuery) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry) => entry.item);
  }, [items, trimmedQuery]);

  return (
    <section className="tool-search-panel" aria-label="도구 검색">
      <div className="tool-search-copy">
        <span className="section-index">00</span>
        <div>
          <h2>도구 빠른 검색</h2>
          <p>키워드를 입력하면 바로 사용할 수 있는 업무 도구를 추천합니다.</p>
        </div>
      </div>

      <div className="tool-search-box">
        <span aria-hidden="true">⌕</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="예: 제주, 탁송, 타이어, 누락, 항동, 시동..."
          aria-label="도구 검색어"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")}>
            지우기
          </button>
        )}
      </div>

      {!trimmedQuery && (
        <div className="tool-search-chips" aria-label="추천 검색어">
          {quickKeywords.map((keyword) => (
            <button key={keyword} type="button" onClick={() => setQuery(keyword)}>
              {keyword}
            </button>
          ))}
        </div>
      )}

      {trimmedQuery && (
        <div className="tool-search-results">
          {results.length > 0 ? (
            results.map((item) => (
              <Link key={item.href} className={`tool-search-result tone-${item.tone}`} href={item.href}>
                <div>
                  <StatusBadge status={item.status} />
                  <span>{item.category}</span>
                </div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </Link>
            ))
          ) : (
            <div className="tool-search-empty">
              <strong>추천 도구가 없습니다.</strong>
              <span>다른 키워드로 검색해보세요.</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
