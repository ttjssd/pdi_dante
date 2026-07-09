import { BackButton, Breadcrumb, ModuleCard, PlatformHeader } from "../components/platform";

const modules = [
  {
    title: "탁송 이슈 응답 보조",
    description: "기사님 문의 원문을 바탕으로 확인사항과 답변/내부 공유 문구를 추천합니다.",
    status: "LIVE" as const,
    href: "/transport-tools/issue-helper",
    tone: "purple" as const,
  },
  {
    title: "탁송 중 견인",
    description: "M2 견인 요청 시 매니저에게 보내는 양식을 바로 복사합니다.",
    status: "LIVE" as const,
    href: "/transport-tools/towing-request",
    tone: "purple" as const,
  },
  {
    title: "제주도 탁송 요청 문구 생성",
    description: "제주도 탁송 신청에 사용할 담당자 공유 문구를 생성합니다.",
    status: "LIVE" as const,
    href: "/transport-tools/jeju-request",
    tone: "cyan" as const,
  },
];

export default function TransportToolsPage() {
  return (
    <main className="platform-app">
      <PlatformHeader />
      <div className="platform-shell">
        <Breadcrumb items={[{ label: "홈", href: "/console" }, { label: "탁송 보조 툴" }]} />
        <section className="category-hero tone-purple">
          <div>
            <span className="platform-kicker">CATEGORY / TRANSPORT TOOLS</span>
            <h1>탁송 보조 툴</h1>
            <p>탁송 중 발생하는 이슈 응답과 제주도 탁송 신청 문구 생성을 보조합니다.</p>
          </div>
          <BackButton href="/console" />
        </section>
        <section className="platform-section">
          <div className="platform-section-heading">
            <div><span className="section-index">01</span><h2>세부 기능</h2></div>
            <p>탁송 업무에 필요한 도구를 선택하세요.</p>
          </div>
          <div className="module-card-grid">
            {modules.map((module, index) => <ModuleCard key={module.title} {...module} index={index} />)}
          </div>
        </section>
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Transport operations tools</span>
      </footer>
    </main>
  );
}
