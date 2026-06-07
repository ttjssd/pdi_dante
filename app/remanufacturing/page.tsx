import { BackButton, Breadcrumb, ModuleCard, PlatformHeader } from "../components/platform";

const modules = [
  {
    title: "상품화 키워드 추출",
    description: "슬랙 원문을 분석해 누락 신청용 카테고리와 복붙 키워드를 추천합니다.",
    status: "LIVE" as const,
    href: "/remanufacturing/keyword-extractor",
    tone: "cyan" as const,
  },
  {
    title: "상품화 가이드",
    description: "자체 상품화, 칸반 기록 필요/불필요 기준, 후속 작업 절차를 정리한 가이드입니다.",
    status: "LIVE" as const,
    href: "/remanufacturing/guide",
    tone: "purple" as const,
  },
];

export default function RemanufacturingPage() {
  return (
    <main className="platform-app">
      <PlatformHeader />
      <div className="platform-shell">
        <Breadcrumb items={[{ label: "홈", href: "/console" }, { label: "누락(재상품화) 가이드" }]} />
        <section className="category-hero tone-cyan">
          <div>
            <span className="platform-kicker">CATEGORY / REMANUFACTURING</span>
            <h1>누락(재상품화) 가이드</h1>
            <p>슬랙 특이사항을 분석해 누락 신청에 필요한 카테고리와 키워드를 빠르게 정리합니다.</p>
          </div>
          <BackButton href="/console" />
        </section>
        <section className="platform-section">
          <div className="platform-section-heading">
            <div><span className="section-index">01</span><h2>세부 기능</h2></div>
            <p>현재 사용할 수 있는 대표 기능입니다.</p>
          </div>
          <div className="module-card-grid">
            {modules.map((module, index) => <ModuleCard key={module.title} {...module} index={index} />)}
          </div>
        </section>
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Remanufacturing tools</span>
      </footer>
    </main>
  );
}
