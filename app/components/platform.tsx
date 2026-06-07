import Link from "next/link";
import type { ReactNode } from "react";
import BrandIcon from "./BrandIcon";

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
  return (
    <header className="platform-header">
      <Link className="platform-brand" href="/console">
        <BrandIcon />
        <span>
          <strong>PDI 백오피스 플랫폼</strong>
          <small>PERSONAL OPS CONSOLE</small>
        </span>
      </Link>
      <div className="header-status"><span /> LOCAL WORKSPACE</div>
    </header>
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
