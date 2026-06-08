import { BackButton, Breadcrumb, PlatformHeader } from "../components/platform";
import PrivateModeSettingsClient from "./PrivateModeSettingsClient";

export default function SettingsPage() {
  return (
    <main className="platform-app">
      <PlatformHeader />
      <div className="platform-shell settings-shell">
        <div className="extractor-navigation">
          <Breadcrumb items={[{ label: "홈", href: "/console" }, { label: "개인 설정" }]} />
          <BackButton href="/console">콘솔로 돌아가기</BackButton>
        </div>
        <section className="category-hero settings-hero">
          <div>
            <span className="platform-kicker">PRIVATE CONSOLE SETTINGS</span>
            <h1>프라이빗 모드 설정</h1>
            <p>런처 영상, 밝기, 재생 순서와 로컬 PIN을 관리합니다.</p>
          </div>
        </section>
        <PrivateModeSettingsClient />
      </div>
    </main>
  );
}
