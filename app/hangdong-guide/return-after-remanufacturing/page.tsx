import { BackButton, Breadcrumb, PlatformHeader } from "../../components/platform";

const slackTemplate = `@andy
앤디, 안녕하세요.
위 차량 항동 입고 되었습니다.


광고중 변경 부탁드립니다.`;

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
              <b>처리 기준</b>
              <ul>
                <li>공정 상세기록은 반영 가능</li>
                <li>판매과정 task 변경은 "판매보류 → 광고 중" 변경 같은 형태로 처리 필요</li>
                <li>항동 입고 확인 후 아래 양식으로 앤디에게 광고중 변경을 요청한다.</li>
              </ul>
            </article>
          </div>

          <div className="hangdong-reference-card">
            <strong>슬랙 공유 양식</strong>
            <p>슬랙 프로필 링크는 넣지 않고 멘션 텍스트만 사용합니다. 차량이 항동에 입고된 것을 확인한 뒤 아래 문구로 광고중 변경을 요청합니다.</p>
            <pre>{slackTemplate}</pre>
          </div>

          <div className="hangdong-callout">
            <b>주의</b>
            <p>입고 여부가 불확실한 상태에서는 광고중 변경 요청을 먼저 보내지 않고, 항동 입고 확인 후 진행합니다.</p>
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
