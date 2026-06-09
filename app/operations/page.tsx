import { BackButton, Breadcrumb, PlatformHeader } from "../components/platform";
import DailyWorkLogClient from "./DailyWorkLogClient";

export default function OperationsPage() {
  return (
    <main className="platform-app operations-app">
      <PlatformHeader />
      <div className="platform-shell">
        <div className="extractor-navigation">
          <Breadcrumb items={[{ label: "홈", href: "/console" }, { label: "일일 업무일지 / 주간 리포트" }]} />
          <BackButton href="/console">콘솔</BackButton>
        </div>
        <section className="category-hero tone-indigo operations-hero">
          <div>
            <span className="platform-kicker">DAILY LOG / WEEKLY REPORT</span>
            <h1>일일 업무일지 · 주간 리포트</h1>
            <p>슬랙 일일 업무일지를 그대로 등록하고 금요일~목요일 핵심 수치를 주간 회의 자료로 취합합니다.</p>
          </div>
        </section>
        <DailyWorkLogClient />
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Local daily operations archive</span>
      </footer>
    </main>
  );
}
