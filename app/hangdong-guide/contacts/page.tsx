import { BackButton, Breadcrumb, PlatformHeader } from "../../components/platform";
import ContactDirectory from "../ContactDirectory";

export default function HangdongContactsPage() {
  return (
    <main className="platform-app hangdong-app">
      <PlatformHeader />
      <div className="platform-shell">
        <div className="extractor-navigation">
          <Breadcrumb items={[
            { label: "홈", href: "/console" },
            { label: "항동센터 가이드", href: "/hangdong-guide" },
            { label: "연락처 모음" },
          ]} />
          <BackButton href="/hangdong-guide">항동센터 가이드</BackButton>
        </div>

        <section className="category-hero tone-indigo page-enter hangdong-hero">
          <div>
            <span className="platform-kicker">HANGDONG GUIDE / 02</span>
            <h1>연락처 모음</h1>
            <p>협력업체와 판매 매니저 연락처를 현재 PC에만 등록하고 관리합니다.</p>
          </div>
        </section>

        <ContactDirectory />
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Local contact directory</span>
      </footer>
    </main>
  );
}
