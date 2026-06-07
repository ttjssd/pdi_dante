import { APP_VERSION } from "./config";
import type { Tone } from "./components/platform";
import type { UpdateGroup } from "./components/UpdateLog";

export const categories = [
  {
    href: "/remanufacturing",
    status: "LIVE" as const,
    tone: "teal" as Tone,
    title: "누락(재상품화) 가이드",
    description: "슬랙 특이사항을 누락 신청용 카테고리와 복붙 키워드로 정리합니다.",
    count: 2,
  },
  {
    href: "/transport-tools",
    status: "LIVE" as const,
    tone: "purple" as Tone,
    title: "탁송 보조 툴",
    description: "탁송 중 발생하는 이슈 응답과 제주도 탁송 신청 문구 생성을 보조합니다.",
    count: 2,
  },
];

export const updates: UpdateGroup[] = [
  {
    date: "06/07",
    items: [
      {
        version: APP_VERSION,
        title: "탁송 보조 툴 확장",
        description: "탁송 보조 툴에 제주도 탁송 신청 문구 생성 기능을 추가했습니다.",
      },
      {
        version: "1.6.0",
        title: "탁송 이슈 응답 보조 추가",
        description: "출발지 픽업 문제, 차량번호 확인, 차량 전달 후 운행 이상 상황을 구분하고 답변 문구를 추천하도록 개선했습니다.",
      },
      {
        version: "1.5.0",
        title: "브랜드 심볼 업데이트",
        description: "보라색 에너지 코어 기반의 신규 플랫폼 심볼과 favicon을 적용했습니다.",
      },
      {
        version: "1.4.0",
        title: "홈 화면 가독성 개선",
        description: "작은 라벨과 업데이트 내역 레이아웃의 가독성을 개선했습니다.",
      },
      {
        version: "1.3.0",
        title: "최적화 업데이트",
        description: "홈 화면 애니메이션과 렌더링 성능을 개선했습니다.",
      },
      {
        version: "1.2.0",
        title: "누락(재상품화) 가이드 추가",
        description: "칸반 기준과 후속 작업 절차를 확인할 수 있는 가이드를 추가했습니다.",
      },
      {
        version: "1.1.0",
        title: "상품화 키워드 추출 기능 개선",
        description: "슬랙 원문 분석과 상품화 추천 키워드 생성 흐름을 다듬었습니다.",
      },
    ],
  },
];

export const launcherUpdates = updates.flatMap((group) => group.items).slice(0, 3);
