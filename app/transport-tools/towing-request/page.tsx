import { BackButton, Breadcrumb, PlatformHeader } from "../../components/platform";
import TowingRequestClient from "./TowingRequestClient";

export default function TowingRequestPage() {
  return (
    <main className="platform-app transport-app">
      <PlatformHeader />
      <div className="platform-shell">
        <div className="extractor-navigation">
          <Breadcrumb items={[
            { label: "홈", href: "/console" },
            { label: "탁송 보조 툴", href: "/transport-tools" },
            { label: "탁송 중 견인" },
          ]} />
          <BackButton href="/transport-tools">탁송 보조 툴</BackButton>
        </div>
        <section className="category-hero tone-purple transport-hero">
          <div>
            <span className="platform-kicker">TOWING REQUEST</span>
            <h1>탁송 중 견인</h1>
            <p>M2 견인 요청 시 보내는 양식을 바로 복사합니다.</p>
          </div>
        </section>
        <TowingRequestClient />
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Towing request template</span>
      </footer>
    </main>
  );
}
