import { BackButton, Breadcrumb, PlatformHeader } from "../../components/platform";
import JejuRequestGenerator from "./JejuRequestGenerator";

export default function JejuRequestPage() {
  return (
    <main className="platform-app transport-app">
      <PlatformHeader />
      <div className="platform-shell">
        <div className="extractor-navigation">
          <Breadcrumb items={[
            { label: "홈", href: "/console" },
            { label: "탁송 보조 툴", href: "/transport-tools" },
            { label: "제주도 탁송 요청 문구 생성" },
          ]} />
          <BackButton href="/transport-tools">탁송 보조 툴</BackButton>
        </div>
        <section className="category-hero tone-cyan transport-hero">
          <div>
            <span className="platform-kicker">JEJU TRANSPORT REQUEST</span>
            <h1>제주도 탁송 요청 문구 생성</h1>
            <p>제주도 탁송 신청을 보조하는 툴입니다.</p>
          </div>
        </section>
        <JejuRequestGenerator />
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Jeju transport request</span>
      </footer>
    </main>
  );
}
