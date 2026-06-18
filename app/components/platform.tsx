"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { APP_VERSION_LABEL } from "../config";
import { categories, toolSearchItems } from "../platformData";
import BrandIcon from "./BrandIcon";
import WindowModeControl from "./WindowModeControl";

export type Status = "LIVE" | "BETA" | "SOON";
export type Tone = "blue" | "cyan" | "teal" | "purple" | "slate" | "indigo";

export function StatusBadge({ status }: { status: Status }) {
  const label = status === "LIVE" ? "ON" : "개발중";
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <i aria-hidden="true" />
      {label}
    </span>
  );
}

export function PlatformHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleTools = toolSearchItems.slice(0, 8);

  useEffect(() => {
    document.documentElement.classList.toggle("hud-modal-open", menuOpen);
    document.body.classList.toggle("hud-modal-open", menuOpen);
    return () => {
      document.documentElement.classList.remove("hud-modal-open");
      document.body.classList.remove("hud-modal-open");
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="platform-header hud-header">
        <Link className="platform-brand hud-brand" href="/console">
          <BrandIcon />
          <span>
            <strong>PDI 백오피스 플랫폼</strong>
            <small>PERSONAL OPS CONSOLE</small>
          </span>
        </Link>
        <div className="header-actions hud-actions">
          <div className="header-status hud-status"><span /> LOCAL WORKSPACE</div>
          <Link className="hud-icon-button" href="/operations" aria-label="업무일지 열기">
            <span>LG</span>
            <i aria-hidden="true" />
          </Link>
          <button className="hud-icon-button hud-menu-button" type="button" onClick={() => setMenuOpen(true)} aria-label="전체 카테고리 메뉴 열기">
            <span />
            <span />
            <span />
          </button>
          <WindowModeControl />
        </div>
      </header>

      {menuOpen && (
        <div className="hud-menu-overlay" role="dialog" aria-modal="true" aria-label="전체 카테고리 선택">
          <button className="hud-overlay-backdrop" type="button" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)} />
          <section className="hud-menu-panel">
            <aside className="hud-menu-status-card">
              <span className="platform-kicker">LOCAL OPS HUD</span>
              <h2>PDI CONTROL CENTER</h2>
              <p>개인 로컬 업무 데이터를 게임 HUD처럼 빠르게 탐색합니다.</p>
              <dl>
                <div><dt>앱 버전</dt><dd>{APP_VERSION_LABEL}</dd></div>
              </dl>
            </aside>

            <div className="hud-category-select">
              <div className="hud-overlay-heading">
                <div>
                  <span>CATEGORY SELECT</span>
                  <h2>업무 메뉴 선택</h2>
                </div>
                <button type="button" onClick={() => setMenuOpen(false)}>닫기</button>
              </div>

              <div className="hud-category-grid">
                {categories.map((category, index) => (
                  <Link
                    className={`hud-category-card tone-${category.tone}`}
                    href={category.href}
                    key={category.href}
                    onClick={() => setMenuOpen(false)}
                    style={{ "--hud-delay": `${index * 70}ms` } as CSSProperties}
                  >
                    <span className="hud-card-icon">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{category.title}</strong>
                      <p>{category.description}</p>
                    </div>
                    <em>{category.count} TOOLS</em>
                  </Link>
                ))}
              </div>

              <div className="hud-tool-strip">
                {visibleTools.map((tool, index) => (
                  <Link
                    href={tool.href}
                    key={tool.href}
                    onClick={() => setMenuOpen(false)}
                    style={{ "--hud-delay": `${260 + index * 35}ms` } as CSSProperties}
                  >
                    <span>{tool.category}</span>
                    <strong>{tool.title}</strong>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

    </>
  );
}

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="breadcrumb" aria-label="현재 위치">
      {items.map((item, index) => (
        <span key={item.label}>
          {index > 0 && <i>/</i>}
          {item.href ? <Link href={item.href}>{item.label}</Link> : <strong>{item.label}</strong>}
        </span>
      ))}
    </nav>
  );
}

export function BackButton({ href, children = "뒤로가기" }: { href: string; children?: ReactNode }) {
  return <Link className="platform-button button-ghost" href={href}>← {children}</Link>;
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "cyan" | "green" | "purple" | "slate";
}) {
  return (
    <article className={`stat-card stat-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function DashboardCard({
  href,
  status,
  tone,
  title,
  description,
  count,
  index,
}: {
  href: string;
  status: Status;
  tone: Tone;
  title: string;
  description: string;
  count: number;
  index: number;
}) {
  return (
    <article className={`dashboard-card tone-${tone}`} style={{ animationDelay: `${index * 55}ms` }}>
      <div className="card-corner" />
      <div className="dashboard-card-top">
        <StatusBadge status={status} />
        <span className="tool-count">{count} TOOLS</span>
      </div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <Link className={`platform-button ${status === "LIVE" ? "button-primary" : "button-outline"}`} href={href}>
        들어가기 <span className="button-arrow">→</span>
      </Link>
    </article>
  );
}

export function ModuleCard({
  title,
  description,
  status,
  href,
  tone = "blue",
  index = 0,
}: {
  title: string;
  description: string;
  status: Status;
  href?: string;
  tone?: Tone;
  index?: number;
}) {
  const available = status === "LIVE" && href;
  return (
    <article className={`module-card tone-${tone}`} style={{ animationDelay: `${index * 60}ms` }}>
      <div className="module-icon">{String(index + 1).padStart(2, "0")}</div>
      <StatusBadge status={status} />
      <h3>{title}</h3>
      <p>{description}</p>
      {available ? (
        <Link className="platform-button button-primary" href={href}>도구 열기 <span className="button-arrow">→</span></Link>
      ) : (
        <button className="platform-button button-outline" type="button" disabled>준비중</button>
      )}
    </article>
  );
}
