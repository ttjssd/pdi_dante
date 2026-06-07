import { BackButton, Breadcrumb, PlatformHeader } from "../../components/platform";
import TransportIssueHelper from "../../transport-issue-helper/TransportIssueHelper";

export default function TransportIssueHelperPage() {
  return (
    <main className="platform-app transport-app">
      <PlatformHeader />
      <div className="platform-shell">
        <div className="extractor-navigation">
          <Breadcrumb items={[
            { label: "홈", href: "/console" },
            { label: "탁송 보조 툴", href: "/transport-tools" },
            { label: "탁송 이슈 응답 보조" },
          ]} />
          <BackButton href="/transport-tools">탁송 보조 툴</BackButton>
        </div>
        <section className="category-hero tone-purple transport-hero">
          <div>
            <span className="platform-kicker">TRANSPORT ISSUE RESPONSE</span>
            <h1>탁송 이슈 응답 보조</h1>
            <p>기사님 문의 원문을 바탕으로 우선 확인사항과 답변·내부 공유 문구를 추천합니다.</p>
          </div>
        </section>
        <TransportIssueHelper />
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Transport response assistant</span>
      </footer>
    </main>
  );
}
