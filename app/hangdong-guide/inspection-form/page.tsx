import { BackButton, Breadcrumb, PlatformHeader } from "../../components/platform";
import InspectionFormClient from "./InspectionFormClient";

export default function InspectionFormPage() {
  return (
    <main className="platform-app hangdong-app">
      <PlatformHeader />
      <div className="platform-shell">
        <div className="extractor-navigation">
          <Breadcrumb items={[
            { label: "홈", href: "/console" },
            { label: "항동센터 가이드", href: "/hangdong-guide" },
            { label: "정기검사 반자동 양식" },
          ]} />
          <BackButton href="/hangdong-guide">항동센터 가이드</BackButton>
        </div>
        <section className="category-hero tone-cyan operations-hero">
          <div>
            <span className="platform-kicker">INSPECTION FORM / PLATE ONLY</span>
            <h1>정기검사 반자동 양식</h1>
            <p>GPT로 추출한 텍스트에서 차량번호만 정리하고, 차량명과 위치를 보완해 시트용 3열 양식을 생성합니다.</p>
          </div>
        </section>
        <InspectionFormClient />
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Local inspection plate extractor</span>
      </footer>
    </main>
  );
}
