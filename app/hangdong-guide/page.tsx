import { BackButton, Breadcrumb, ModuleCard, PlatformHeader } from "../components/platform";

const modules = [
  {
    title: "입고 차량 중 상품화 누락 후 복귀차량",
    description: "입고목록에 없는 복귀 차량 발생 시 처리 프로세스를 확인합니다.",
    status: "LIVE" as const,
    href: "/hangdong-guide/return-after-remanufacturing",
    tone: "cyan" as const,
  },
];

export default function HangdongGuidePage() {
  return (
    <main className="platform-app hangdong-app">
      <PlatformHeader />
      <div className="platform-shell">
        <div className="extractor-navigation">
          <Breadcrumb items={[{ label: "홈", href: "/console" }, { label: "항동센터 가이드" }]} />
          <BackButton href="/console">콘솔</BackButton>
        </div>

        <section className="category-hero tone-cyan page-enter hangdong-hero">
          <div>
            <span className="platform-kicker">HANGDONG CENTER GUIDE</span>
            <h1>항동센터 가이드</h1>
            <p>항동센터 예외 처리와 운영 프로세스를 정리합니다.</p>
          </div>
        </section>

        <section className="platform-section page-enter page-delay-1">
          <div className="platform-section-heading">
            <div><span className="section-index">01</span><h2>가이드 슬롯</h2></div>
            <p>현재 사용할 수 있는 항동센터 업무 가이드입니다.</p>
          </div>
          <div className="module-card-grid hangdong-module-grid">
            {modules.map((module, index) => <ModuleCard key={module.title} {...module} index={index} />)}
          </div>
        </section>
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Hangdong center guide</span>
      </footer>
    </main>
  );
}
