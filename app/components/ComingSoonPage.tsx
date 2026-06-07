import { BackButton, Breadcrumb, PlatformHeader, StatusBadge, type Tone } from "./platform";

export default function ComingSoonPage({
  title,
  description,
  tone,
  status = "SOON",
}: {
  title: string;
  description: string;
  tone: Tone;
  status?: "BETA" | "SOON";
}) {
  return (
    <main className="platform-app">
      <PlatformHeader />
      <div className="platform-shell">
        <Breadcrumb items={[{ label: "홈", href: "/console" }, { label: title }]} />
        <section className={`category-hero tone-${tone}`}>
          <div>
            <span className="platform-kicker">CATEGORY / PREPARING</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <BackButton href="/console" />
        </section>
        <section className="coming-soon-panel">
          <StatusBadge status={status} />
          <div className="coming-orbit"><span /></div>
          <h2>기능을 준비하고 있습니다.</h2>
          <p>플랫폼 구조에 맞춰 다음 업무 도구를 안전하게 확장할 예정입니다.</p>
        </section>
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Module preparing</span>
      </footer>
    </main>
  );
}
