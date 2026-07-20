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
    count: 3,
  },
  {
    href: "/transport-tools",
    status: "LIVE" as const,
    tone: "purple" as Tone,
    title: "탁송 보조 툴",
    description: "탁송 중 발생하는 이슈 응답과 제주도 탁송 신청 문구 생성을 보조합니다.",
    count: 3,
  },
  {
    href: "/hangdong-guide",
    status: "LIVE" as const,
    tone: "cyan" as Tone,
    title: "항동센터 가이드",
    description: "항동센터에서 자주 발생하는 예외 처리와 운영 프로세스를 정리합니다.",
    count: 5,
  },
  {
    href: "/operations",
    status: "LIVE" as const,
    tone: "indigo" as Tone,
    title: "업무일지 / 주간 리포트",
    description: "일일 업무일지를 저장하고 금~목 기준 주간 회의 자료로 자동 취합합니다.",
    count: 1,
  },
];

export const toolSearchItems = [
  {
    title: "상품화 키워드 추출",
    category: "누락(재상품화) 가이드",
    description: "슬랙 원문을 분석해 누락 신청용 카테고리와 복붙 키워드를 추천합니다.",
    href: "/remanufacturing/keyword-extractor",
    status: "LIVE" as const,
    tone: "teal" as Tone,
    keywords: ["누락", "재상품화", "상품화", "키워드", "슬랙", "칸반", "복붙", "타이어", "외판", "센서", "에어컨"],
  },
  {
    title: "상품화 가이드",
    category: "누락(재상품화) 가이드",
    description: "자체 상품화, 칸반 기록 필요/불필요 기준, 후속 작업 절차를 확인합니다.",
    href: "/remanufacturing/guide",
    status: "LIVE" as const,
    tone: "cyan" as Tone,
    keywords: ["상품화", "가이드", "칸반", "기록", "블랙박스", "공정", "취소선", "업로드"],
  },
  {
    title: "상품화 기준 대조",
    category: "누락(재상품화) 가이드",
    description: "차량 등급과 외판·타이어·휠 등 현장 상태를 기준표와 대조합니다.",
    href: "/remanufacturing/standards",
    status: "LIVE" as const,
    tone: "cyan" as Tone,
    keywords: ["상품화", "기준", "대조", "판정", "등급", "가", "나", "다", "라", "마", "눌림", "흠집", "철까짐", "버튼", "틴팅", "타이어", "휠"],
  },
  {
    title: "탁송 이슈 응답 보조",
    category: "탁송 보조 툴",
    description: "기사님 문의 원문을 바탕으로 확인사항과 답변 문구를 추천합니다.",
    href: "/transport-tools/issue-helper",
    status: "LIVE" as const,
    tone: "purple" as Tone,
    keywords: ["탁송", "기사", "이슈", "타이어", "사고", "견인", "시동", "방전", "경고등", "고객", "출발지", "도착지", "차번호"],
  },
  {
    title: "탁송 중 견인",
    category: "탁송 보조 툴",
    description: "M2 견인 요청 시 매니저에게 보내는 양식을 바로 복사합니다.",
    href: "/transport-tools/towing-request",
    status: "LIVE" as const,
    tone: "purple" as Tone,
    keywords: ["탁송", "견인", "M2", "C구역", "C47", "C48", "C49", "김요한", "손인환", "김승현", "knox", "hardy"],
  },
  {
    title: "제주도 탁송 요청 문구 생성",
    category: "탁송 보조 툴",
    description: "제주도 탁송 신청용 슬랙 요청 문구를 생성합니다.",
    href: "/transport-tools/jeju-request",
    status: "LIVE" as const,
    tone: "purple" as Tone,
    keywords: ["제주", "제주도", "탁송", "고채현", "김경민", "선적", "오더", "도착일", "요청"],
  },
  {
    title: "입고 차량 중 상품화 누락 후 복귀차량",
    category: "항동센터 가이드",
    description: "입고목록에 없는 복귀 차량 처리 기준과 참고 내용을 확인합니다.",
    href: "/hangdong-guide/return-after-remanufacturing",
    status: "LIVE" as const,
    tone: "cyan" as Tone,
    keywords: ["항동", "항동센터", "복귀", "복귀차량", "입고", "입고목록", "판매보류", "광고중"],
  },
  {
    title: "연락처 모음",
    category: "항동센터 가이드",
    description: "협력업체와 판매 매니저 연락처를 현재 PC에 등록하고 관리합니다.",
    href: "/hangdong-guide/contacts",
    status: "LIVE" as const,
    tone: "indigo" as Tone,
    keywords: ["항동", "연락처", "전화번호", "협력업체", "판매매니저", "매니저", "업체", "로컬"],
  },
  {
    title: "일일 업무일지 / 주간 리포트",
    category: "운영 업무",
    description: "슬랙 일일 업무일지를 기록하고 주간 합계와 회의용 리포트를 생성합니다.",
    href: "/operations",
    status: "LIVE" as const,
    tone: "indigo" as Tone,
    keywords: ["일일", "업무일지", "주간", "리포트", "회의", "출고준비", "탁송인계", "인사", "연차", "항동"],
  },
  {
    title: "정기검사 가이드본",
    category: "항동센터 가이드",
    description: "책임보험 가입, 검사대행 요청, 검사비 처리, 완료 공유 절차를 사진 기준으로 확인합니다.",
    href: "/hangdong-guide/inspection-guide",
    status: "LIVE" as const,
    tone: "cyan" as Tone,
    keywords: ["정기검사", "검사", "책임보험", "보험", "카카오톡", "카톡", "시트", "검사대행", "법인카드", "가이드", "절차"],
  },
  {
    title: "정기검사 반자동 양식",
    category: "항동센터 가이드",
    description: "GPT 추출 텍스트에서 차량번호만 자동 정리하고 차량명·위치를 보완해 3열 시트 행을 생성합니다.",
    href: "/hangdong-guide/inspection-form",
    status: "LIVE" as const,
    tone: "cyan" as Tone,
    keywords: ["정기검사", "검사", "차량번호", "GPT", "OCR", "차량명", "위치", "시트", "양식", "추출"],
  },
  {
    title: "PDI 일정표",
    category: "항동센터 가이드",
    description: "요일별 반복 업무를 등록하고 오늘 할 일, 놓친 일정, 완료 여부를 체크합니다.",
    href: "/hangdong-guide/pdi-schedule",
    status: "LIVE" as const,
    tone: "cyan" as Tone,
    keywords: ["PDI", "일정", "일정표", "반복", "수요일", "체감온도", "PDF", "업로드", "체크", "알림"],
  },
];

export const updates: UpdateGroup[] = [
  {
    date: "07/21",
    items: [
      {
        version: APP_VERSION,
        title: "업무일지 특이사항 및 탁송 공지 업데이트",
        description: "업무일지에서 정비·스마트키 불량/교체·배터리 등 특이사항 세부 수치를 합산하고, 탁송 이슈 태그 공지와 제주 탁송 담당자명을 최신화했습니다.",
      },
    ],
  },
  {
    date: "07/09",
    items: [
      {
        version: "2.1.3",
        title: "탁송·회의록 UI 및 런처 백업 정책 업데이트",
        description: "탁송 보조툴을 카드형으로 리빌딩하고 견인 요청 메뉴를 분리했으며, 주간 회의록 작성 화면 시인성과 런처 백업 최신 1개 유지 정책을 적용했습니다.",
      },
    ],
  },
  {
    date: "07/07",
    items: [
      {
        version: "2.1.2",
        title: "운영 프로세스 및 메인 일정표 업데이트",
        description: "메인 화면에 PDI 일정표를 노출하고 제주도 담당자, M2 견인 요청 양식, 상품화 누락 후 복귀차량 광고중 변경 양식을 최신화했습니다.",
      },
    ],
  },
  {
    date: "07/02",
    items: [
      {
        version: "2.1.1",
        title: "PDI 일정표 추가",
        description: "항동센터 가이드에 요일별 반복 업무 일정표를 추가하고 오늘 일정, 놓친 일정, 완료 체크, 주간 일정 복사 기능을 넣었습니다.",
      },
    ],
  },
  {
    date: "07/01",
    items: [
      {
        version: "2.1.0",
        title: "회의록 및 정기검사 업무 업데이트",
        description: "주간 회의록에 목요일 수기 합산, 고객 인입·수출업자 방문 카운트, 이전 회의록 저장을 추가하고 정기검사 가이드본과 차량번호 반자동 양식을 항동센터 가이드에 분리했습니다.",
      },
    ],
  },
  {
    date: "06/19",
    items: [
      {
        version: "2.0.0",
        title: "2.0 HUD UI 리뉴얼",
        description: "개인 관제센터 느낌의 게임 HUD 테마, 전체 카테고리 오버레이, post-it 전환 애니메이션과 입고 수치 인식을 개선했습니다.",
      },
    ],
  },
  {
    date: "06/10",
    items: [
      {
        version: "1.9.6",
        title: "연락처 화면 사용성 개선",
        description: "등록된 연락처를 상단에 우선 표시하고 등록·관리 기능을 접이식 영역으로 정리했습니다.",
      },
      {
        version: "1.9.5",
        title: "스마트 연락처 등록 및 업데이트 안정화",
        description: "연락처 목록 일괄 분석 등록과 런처 내부 다운로드·수동 재시작 업데이트 흐름을 강화했습니다.",
      },
    ],
  },
  {
    date: "06/09",
    items: [
      {
        version: "1.9.4",
        title: "항동센터 연락처 가이드 분리",
        description: "연락처 모음을 항동센터 가이드의 두 번째 독립 기능으로 분리했습니다.",
      },
      {
        version: "1.9.3",
        title: "항동센터 연락처 및 업데이트 개선",
        description: "협력업체·판매 매니저 연락처를 추가하고 업데이트가 예고 없이 설치되지 않도록 적용 흐름을 정리했습니다.",
      },
      {
        version: "1.9.2",
        title: "주간 기록 누락 감지",
        description: "금~목 일일 기록의 미등록, 중복, 핵심 수치 추출 누락을 날짜별로 확인할 수 있게 했습니다.",
      },
      {
        version: "1.9.1",
        title: "업무일지 등록 흐름 간소화",
        description: "일일 원문 등록·보관과 입고·출고·출고준비·특이사항 주간 합산 중심으로 화면을 정리했습니다.",
      },
      {
        version: "1.9.0",
        title: "일일 업무일지 및 주간 리포트",
        description: "슬랙 업무일지 분석, 일일 기록 저장, 전주 대비 주간 회의 리포트 생성을 추가했습니다.",
      },
      {
        version: "1.8.2",
        title: "개인 배경 로컬화",
        description: "개인 영상과 이미지를 EXE에 포함하지 않고 PC 로컬 폴더에서 관리하도록 변경했습니다.",
      },
    ],
  },
  {
    date: "06/08",
    items: [
      {
        version: "1.8.1",
        title: "콘솔 검색 및 런처 정리",
        description: "도구 빠른 검색을 추가하고 런처 업데이트 패널과 프라이빗 배경 표시를 정리했습니다.",
      },
      {
        version: "1.8.0",
        title: "런처 UX 및 업무 가이드 확장",
        description: "런처 진입 경험과 화면 전환 애니메이션을 개선하고, 항동센터 가이드와 타이어 코드절상 응답 유형을 추가했습니다.",
      },
    ],
  },
  {
    date: "06/07",
    items: [
      {
        version: "1.7.0",
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

export const launcherUpdates = updates.flatMap((group) => group.items).slice(0, 2);
