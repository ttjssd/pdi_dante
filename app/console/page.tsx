import { DashboardCard, PlatformHeader, StatCard } from "../components/platform";
import LauncherUpdateNotice from "../components/LauncherUpdateNotice";
import PdiScheduleSummary from "../components/PdiScheduleSummary";
import RecentRecordsStat from "../components/RecentRecordsStat";
import ToolSearch from "../components/ToolSearch";
import UpdateLog from "../components/UpdateLog";
import { APP_VERSION_LABEL } from "../config";
import { categories, toolSearchItems, updates } from "../platformData";

export default function PlatformConsole() {
  return (
    <main className="platform-app">
      <PlatformHeader />
      <div className="platform-shell">
        <section className="platform-hero">
          <div>
            <span className="platform-kicker">PERSONAL OPS CONSOLE</span>
            <h1>PDI 백오피스 플랫폼</h1>
            <p>슬랙 특이사항, 상품화 키워드, 보고 문구를 빠르게 정리하는 개인 업무 콘솔</p>
          </div>
          <div className="hero-telemetry">
            <span>LOCAL WORKSPACE</span>
            <strong><i /> SYSTEM READY</strong>
          </div>
        </section>

        <LauncherUpdateNotice />

        <section className="stats-grid" aria-label="플랫폼 통계">
          <StatCard label="사용 가능 도구 수" value="7" accent="cyan" />
          <StatCard label="ON 기능 수" value="7" accent="green" />
          <RecentRecordsStat />
          <StatCard label="개발중 기능 수" value="0" accent="slate" />
        </section>

        <ToolSearch items={toolSearchItems} />

        <PdiScheduleSummary />

        <section className="platform-section">
          <div className="platform-section-heading">
            <div>
              <span className="section-index">01</span>
              <h2>업무 카테고리</h2>
            </div>
            <p>카테고리를 선택해 세부 도구로 이동하세요.</p>
          </div>
          <div className="dashboard-card-grid">
            {categories.map((category, index) => (
              <DashboardCard key={category.title} {...category} index={index} />
            ))}
          </div>
        </section>

        <section className="platform-section update-section">
          <div className="platform-section-heading">
            <div>
              <span className="section-index">02</span>
              <h2>업데이트 내역</h2>
            </div>
            <p>최근 변경된 기능과 개선 사항입니다.</p>
          </div>
          <UpdateLog updates={updates} />
        </section>
      </div>
      <footer className="platform-footer">
        <div className="footer-brand">
          <strong>PDI BACKOFFICE PLATFORM</strong>
          <small>{APP_VERSION_LABEL}</small>
        </div>
        <span>dante 제작</span>
      </footer>
    </main>
  );
}
