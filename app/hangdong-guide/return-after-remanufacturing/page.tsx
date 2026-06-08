import { BackButton, Breadcrumb, PlatformHeader } from "../../components/platform";

const references = [
  { label: "입고차량 중 상품화 누락 후 복귀차량 스레드 1", href: "#" },
  { label: "입고차량 중 상품화 누락 후 복귀차량 스레드 2", href: "#" },
  { label: "판매보류 스레드", href: "#" },
];

export default function ReturnAfterRemanufacturingGuidePage() {
  return (
    <main className="platform-app hangdong-app">
      <PlatformHeader />
      <div className="platform-shell">
        <div className="extractor-navigation">
          <Breadcrumb items={[
            { label: "홈", href: "/console" },
            { label: "항동센터 가이드", href: "/hangdong-guide" },
            { label: "입고 차량 중 상품화 누락 후 복귀차량" },
          ]} />
          <BackButton href="/hangdong-guide">항동센터 가이드</BackButton>
        </div>

        <section className="category-hero tone-cyan page-enter hangdong-hero">
          <div>
            <span className="platform-kicker">HANGDONG GUIDE / 01</span>
            <h1>입고 차량 중 상품화 누락 후 복귀차량</h1>
            <p>입고목록에 없는 복귀 차량으로 판단되는 케이스를 별도 확인하는 절차입니다.</p>
          </div>
        </section>

        <section id="return-after-remanufacturing" className="hangdong-guide-card page-enter page-delay-1">
          <div className="hangdong-guide-header">
            <span>GUIDE 01</span>
            <div>
              <h2>입고 차량 중 상품화 누락 후 복귀차량 처리 가이드</h2>
              <p>일반 입고차량과 다르게 담당자 확인과 판매과정 task 정리가 필요한 예외 케이스입니다.</p>
            </div>
          </div>

          <div className="hangdong-step-grid">
            <article>
              <b>판단 기준</b>
              <ul>
                <li>입고 차량 중 상품화 누락 후 복귀차량 건은 입고목록에 없는 입고 차량으로 판단한다.</li>
                <li>해당 건은 일반 입고차량과 다르게 별도 프로세스 확인이 필요하다.</li>
              </ul>
            </article>
            <article>
              <b>판덴팀 참고 내용</b>
              <ul>
                <li>공정 상세기록은 반영 가능</li>
                <li>판매과정 task 변경은 "판매보류 → 광고 중" 변경 같은 형태로 처리 필요</li>
              </ul>
            </article>
          </div>

          <div className="hangdong-reference-card">
            <strong>관련 참고 링크</strong>
            <p>추후 Notion 또는 내부 문서 링크를 연결할 수 있도록 슬롯만 준비했습니다.</p>
            <div>
              {references.map((reference) => (
                <a key={reference.label} href={reference.href} aria-disabled="true">
                  {reference.label}
                  <small>링크 준비중</small>
                </a>
              ))}
            </div>
          </div>

          <div className="hangdong-callout">
            <b>주의</b>
            <p>정확한 처리 전에는 관련 스레드와 담당자 확인 후 진행합니다.</p>
          </div>
        </section>
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Hangdong return vehicle guide</span>
      </footer>
    </main>
  );
}
