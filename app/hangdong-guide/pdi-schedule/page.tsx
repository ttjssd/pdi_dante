import { BackButton, Breadcrumb, PlatformHeader } from "../../components/platform";
import PdiScheduleClient from "./PdiScheduleClient";

export default function PdiSchedulePage() {
  return (
    <main className="platform-app hangdong-app">
      <PlatformHeader />
      <div className="platform-shell">
        <div className="extractor-navigation">
          <Breadcrumb items={[
            { label: "홈", href: "/console" },
            { label: "항동센터 가이드", href: "/hangdong-guide" },
            { label: "PDI 일정표" },
          ]} />
          <BackButton href="/hangdong-guide">항동센터 가이드</BackButton>
        </div>
        <section className="category-hero tone-cyan operations-hero">
          <div>
            <span className="platform-kicker">PDI WEEKLY SCHEDULE</span>
            <h1>PDI 일정표</h1>
            <p>요일별 반복 업무를 등록하고 오늘 할 일, 놓친 일정, 완료 여부를 체크합니다.</p>
          </div>
        </section>
        <PdiScheduleClient />
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Local PDI weekly schedule</span>
      </footer>
    </main>
  );
}
