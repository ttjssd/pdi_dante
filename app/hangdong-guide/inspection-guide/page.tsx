import { BackButton, Breadcrumb, PlatformHeader } from "../../components/platform";
import Link from "next/link";

const guideSections = [
  {
    step: "01",
    title: "책임보험 가입",
    image: "/inspection-guide/insurance-sheet.png",
    bullets: [
      "책임보험 시트에 요청날짜, 요청자, 차량번호, 모델명, 요청기간, 결제카드를 기입합니다.",
      "요청기간은 보험 시작날짜를 의미하며, 당일 시작도 가능합니다.",
      "결제카드는 1번(마켓/내연기관), 2번(리볼트/전기차)을 꼭 확인합니다.",
    ],
  },
  {
    step: "02",
    title: "보험가입 카톡 요청",
    image: "/inspection-guide/insurance-kakao.png",
    bullets: [
      "작성 후 책임보험 카톡방에 보험가입 요청을 공유합니다.",
      "시트 링크와 함께 차량번호/차량명 목록을 간결하게 전달합니다.",
    ],
  },
  {
    step: "03",
    title: "검사대행 요청",
    image: "/inspection-guide/agency-request.png",
    bullets: [
      "정기검사대행 KMS 카톡방에 정기검사 견적/날짜를 문의합니다.",
      "차량번호 및 차종, 위치, 희망 날짜, 결제카드 정보를 확인합니다.",
      "항동은 3600 카드, 검단은 7600 카드 결제를 기준으로 확인합니다.",
    ],
  },
  {
    step: "04",
    title: "검사비 처리 / 어드민 입력",
    image: "/inspection-guide/expense-process.png",
    bullets: [
      "검사 영수증과 결제카드 사진을 촬영 및 저장합니다.",
      "법인카드 사용내역 방에 구분, 카드번호, 사용 금액, 내용, 총 금액을 공유합니다.",
    ],
  },
  {
    step: "05",
    title: "완료 공유",
    image: "/inspection-guide/complete-share.png",
    bullets: [
      "work-tb-이슈 관리에 정기검사 완료 차량을 공유합니다.",
      "finn, romy, pru cc와 window 태그를 함께 확인합니다.",
    ],
  },
  {
    step: "REF",
    title: "책임보험 시트 예시",
    image: "/inspection-guide/sheet-example.png",
    bullets: [
      "헤이딜러 기록과 사무장님 기록을 구분해 입력합니다.",
      "차량명은 차량 정보 확인이 필요하므로 자동 추측하지 않고 수기로 보완합니다.",
    ],
  },
];

export default function InspectionGuidePage() {
  return (
    <main className="platform-app hangdong-app">
      <PlatformHeader />
      <div className="platform-shell">
        <div className="extractor-navigation">
          <Breadcrumb items={[
            { label: "홈", href: "/console" },
            { label: "항동센터 가이드", href: "/hangdong-guide" },
            { label: "정기검사 가이드" },
          ]} />
          <BackButton href="/hangdong-guide">항동센터 가이드</BackButton>
        </div>
        <section className="category-hero tone-cyan operations-hero">
          <div>
            <span className="platform-kicker">INSPECTION GUIDE / REFERENCE</span>
            <h1>정기검사 가이드본</h1>
            <p>책임보험 가입, 검사대행 요청, 검사비 처리, 완료 공유까지 사진 기준으로 정리한 업무 가이드입니다.</p>
          </div>
        </section>
        <section className="inspection-guide-menu-card">
          <div>
            <strong>반자동 입력은 별도 메뉴에서 진행</strong>
            <p>가이드는 절차 확인용으로 분리하고, 차량번호 추출 및 시트용 행 생성은 반자동 양식 메뉴에서 처리합니다.</p>
          </div>
          <Link className="platform-button button-primary" href="/hangdong-guide/inspection-form">반자동 양식 열기</Link>
        </section>
        <section className="inspection-manual-grid">
          {guideSections.map((section) => (
            <article className="inspection-manual-card" key={section.step}>
              <div className="transport-panel-heading">
                <div><span>{section.step}</span><h2>{section.title}</h2></div>
              </div>
              <ul>
                {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
              <img src={section.image} alt={`${section.title} 참고 이미지`} />
            </article>
          ))}
        </section>
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Local inspection guide and copy helper</span>
      </footer>
    </main>
  );
}
