import { BackButton, Breadcrumb, PlatformHeader } from "../../components/platform";
import GuideContent from "./GuideContent";

export default function RemanufacturingGuidePage() {
  return (
    <main className="platform-app guide-app">
      <PlatformHeader />
      <div className="platform-shell">
        <div className="guide-navigation">
          <Breadcrumb
            items={[
              { label: "홈", href: "/console" },
              { label: "누락(재상품화) 가이드", href: "/remanufacturing" },
              { label: "상품화 가이드" },
            ]}
          />
          <BackButton href="/remanufacturing">누락 가이드</BackButton>
        </div>
        <section className="category-hero guide-hero tone-purple">
          <div>
            <span className="platform-kicker">ON GUIDE / WORKFLOW REFERENCE</span>
            <h1>상품화 가이드</h1>
            <p>자체 상품화, 칸반 기록 필요/불필요 기준, 후속 작업 절차를 정리한 업무 가이드입니다.</p>
          </div>
        </section>
        <GuideContent />
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Remanufacturing workflow guide</span>
      </footer>
    </main>
  );
}
