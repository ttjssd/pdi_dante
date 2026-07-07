export type RiskLevel = "낮음" | "확인 필요" | "주의" | "높음";

export type TransportIssueTemplate = {
  id: string;
  title: string;
  risk: RiskLevel;
  keywords: string[];
  checks: string[];
  requests: string[];
  driverReply: string;
  internalMessage: string;
  movementGuide: string;
};

export const riskScore: Record<RiskLevel, number> = {
  "낮음": 0,
  "확인 필요": 1,
  "주의": 2,
  "높음": 3,
};

export const issueTemplates: TransportIssueTemplate[] = [
  {
    id: "pickup-access",
    title: "출발지 픽업 문제 / 차량 접근 불가",
    risk: "확인 필요",
    keywords: ["출발지", "픽업", "차문", "문이 잠김", "문이 닫혀있음", "출발지 전화", "출발지 연락", "차량 접근", "차량 확인 불가", "키 없음", "현장 도착했는데", "차를 못 찾음"],
    checks: ["출발지 주소가 맞는지 확인", "출발지 담당자 또는 고객 연락 가능 여부 확인", "차량 위치 확인", "차문 잠김 여부 확인", "키 위치 확인", "기사님 대기 가능 시간 확인"],
    requests: ["출발지 주소와 현재 위치", "차량 위치 및 차문 상태 사진", "출발지 연락 시도 횟수", "키 위치 확인 여부", "대기 가능 시간"],
    driverReply: "기사님, 우선 출발지 주소와 차량 위치가 맞는지 확인 부탁드립니다.\n출발지 연락이 계속 안 되거나 차량 접근이 어려운 경우 잠시 대기 부탁드리고, 키 위치나 차량 접근 가능 여부 확인 후 안내드리겠습니다.\n가능하시면 현장 차량 위치와 차문 상태 사진도 함께 공유 부탁드립니다.",
    internalMessage: "[차량번호] 출발지 픽업 단계에서 연락 불가 또는 차량 접근 문제로 기사님 확인 요청 있었습니다.\n출발지 정보, 키 위치, 차량 접근 가능 여부 확인이 필요합니다.",
    movementGuide: "픽업 전 단계이므로 차량 이동 전 출발지 정보와 키 위치를 먼저 확인합니다.",
  },
  {
    id: "vehicle-info",
    title: "차량번호 / 차량 정보 확인",
    risk: "낮음",
    keywords: ["차번호", "차량번호", "번호가 맞", "맞을까요", "해당 차량", "이 차량 맞나요", "배차", "차량 확인", "번호 확인"],
    checks: ["입력된 차량번호 확인", "배차 정보 확인", "출발지/도착지 정보 일치 여부 확인", "동일 번호 또는 유사 번호 차량 여부 확인"],
    requests: ["확인 요청 차량번호", "배차 화면 또는 전달받은 정보", "출발지와 도착지", "현장에서 확인한 차량 정보"],
    driverReply: "기사님, 확인 후 안내드리겠습니다.\n전달주신 차량번호와 배차 정보를 다시 확인해보겠습니다.",
    internalMessage: "[차량번호] 기사님 차량번호 확인 요청 있었습니다.\n배차 정보와 대상 차량 일치 여부 확인 필요합니다.",
    movementGuide: "차량번호 확인 전에는 임의로 인계 또는 이동하지 않도록 안내합니다.",
  },
  {
    id: "post-delivery-driving",
    title: "차량 전달 후 운행 중 이상 / 시동 꺼짐",
    risk: "높음",
    keywords: ["차량 전달 완료", "고객님께 전달", "고객님이 운전", "운전하고 계시는데", "운행 중", "시동이 꺼짐", "시동 꺼진다", "시동이 자꾸", "주행 중 꺼짐", "운행해도 되나요", "이 상태로 운행", "차가 꺼짐", "시동 문제"],
    checks: ["현재 고객님 안전 여부 확인", "차량이 안전한 위치에 정차 가능한지 확인", "계기판 경고등 사진 확인", "시동 재시동 가능 여부 확인", "증상 발생 시점과 반복 여부 확인", "현재 위치 확인", "추가 운행 가능 여부는 담당자 확인 필요"],
    requests: ["현재 위치와 고객님 안전 여부", "계기판 경고등 사진", "시동 재시동 가능 여부", "증상 발생 시점과 반복 횟수", "주행 중 동반 증상"],
    driverReply: "기사님, 고객님께 우선 안전한 위치에 정차 후 추가 운행은 잠시 보류해달라고 안내 부탁드립니다.\n계기판 경고등 사진, 현재 위치, 시동 재시동 가능 여부, 증상이 반복되는지 확인 부탁드립니다.\n확인 후 담당자 통해 진행 방향 안내드리겠습니다.",
    internalMessage: "[차량번호] 차량 전달 후 고객 운행 중 시동 꺼짐/주행 이상 문의가 발생했습니다.\n추가 운행은 보류 안내가 필요하며, 계기판 사진과 현재 위치 확인 후 조치 방향 판단이 필요합니다.",
    movementGuide: "시동 꺼짐이나 주행 중 이상은 안전 이슈가 있으므로 확인 전 추가 운행 보류를 기본값으로 안내합니다.",
  },
  {
    id: "brake",
    title: "브레이크 / 제동 이상",
    risk: "높음",
    keywords: ["브레이크", "제동", "밀림", "안 멈춤", "브레이크등", "브레이크 경고등", "제동 불량", "브레이크 문제", "패드", "디스크", "브레이크 오일", "사이드브레이크", "epb", "파킹브레이크"],
    checks: ["기사님 및 차량 안전 확보 여부", "제동이 실제로 정상 작동하는지 확인", "계기판 경고등 여부 확인", "브레이크 관련 소음/진동 여부 확인", "현재 위치 확인", "추가 주행 필요 여부 확인", "견인 또는 긴급 조치 필요 여부 확인"],
    requests: ["현재 위치", "계기판 경고등 사진", "브레이크 증상 설명", "브레이크 작동 영상 가능 여부", "운행 가능 여부", "안전한 정차 가능 여부"],
    driverReply: "기사님, 브레이크 관련 증상은 안전과 직결될 수 있어 우선 안전한 위치에 정차 후 추가 주행은 잠시 보류 부탁드립니다.\n계기판 경고등 사진, 현재 위치, 브레이크 증상 내용을 공유 부탁드립니다.\n확인 후 담당자 통해 진행 방향 안내드리겠습니다.",
    internalMessage: "[차량번호] 탁송 중 브레이크/제동 이상 문의가 발생했습니다.\n안전 이슈 가능성이 있어 추가 주행 보류 안내가 필요하며, 현재 위치와 증상 확인 후 조치 방향 판단이 필요합니다.",
    movementGuide: "브레이크/제동 이상은 안전 이슈이므로 확인 전 추가 주행 보류를 기본값으로 안내합니다.",
  },
  {
    id: "climate",
    title: "에어컨 / 공조 문제",
    risk: "확인 필요",
    keywords: ["에어컨", "냉기", "바람 안 나옴", "찬바람", "더운바람", "송풍", "히터", "공조", "a/c", "ac", "바람이 약함", "시원하지 않음", "냉방", "난방", "에어컨 냉기가 없음", "에어컨이 안 나옴"],
    checks: ["에어컨 작동 여부 확인", "냉기 또는 송풍 상태 확인", "A/C 버튼 작동 여부 확인", "설정 온도와 풍량 확인", "고객 인계 전/후 상황 확인", "차량 이동 가능 여부 확인"],
    requests: ["현재 위치", "공조 패널 사진 또는 영상", "A/C 작동 여부", "냉기/송풍 상태 설명", "고객 인계 전인지 후인지", "차량 이동 가능 여부"],
    driverReply: "기사님, 우선 에어컨 A/C 작동 여부와 송풍 상태 확인 부탁드립니다.\n가능하시면 공조 패널 사진 또는 짧은 영상 공유 부탁드립니다.\n차량 이동 자체에 문제가 없는 상황이면 현장 확인 후 담당자에게 공유하여 조치 방향 안내드리겠습니다.",
    internalMessage: "[차량번호] 탁송 중 에어컨/공조 이상 문의가 있었습니다.\nA/C 작동 여부와 송풍 상태 확인 후 조치 방향 확인이 필요합니다.",
    movementGuide: "에어컨/공조 문제는 차량 이동 자체가 불가능한 이슈는 아닐 수 있으나, 고객 인계 전후 상황에 따라 담당자 확인 후 안내합니다.",
  },
  {
    id: "handover",
    title: "도착지 고객 연락 불가 / 인계 문제",
    risk: "확인 필요",
    keywords: ["도착지 도착", "고객 전화 안 받음", "고객 연락 불가", "인계 불가", "고객 인계", "키 보관", "경비실", "관리실", "차량 주차 위치"],
    checks: [
      "도착지 주소가 맞는지 확인",
      "고객 연락을 몇 회 시도했는지 확인",
      "현재 차량 주차 가능 위치 확인",
      "경비실/관리실 키 보관 가능 여부 확인",
      "고객에게 문자 발송 가능 여부 확인",
    ],
    requests: ["현재 위치와 도착지 주소", "고객 연락 시도 횟수와 시간", "안전한 주차 가능 위치", "키 보관 가능 위치"],
    driverReply: "기사님, 우선 도착지 주소가 맞는지 확인 부탁드립니다.\n고객님께 5분 간격으로 2회 정도 추가 연락 부탁드리고, 계속 연결이 안 될 경우 안전한 위치에 차량 주차 후 공유 부탁드립니다.\n경비실 또는 관리실에 키 보관이 가능하면 차량 위치와 키 보관 위치를 고객님께 문자로 남겨주세요.",
    internalMessage: "[차량번호] 도착지 도착 후 고객 연락 불가로 기사님 확인 요청 있었습니다.\n추가 연락 후 미연결 시 안전한 위치 주차 및 키 보관 위치 안내 예정입니다.",
    movementGuide: "주정차 위반이나 통행 방해가 없는 안전한 위치를 우선 확인하고, 임의 인계 전 차량 및 키 보관 위치를 공유합니다.",
  },
  {
    id: "fuel",
    title: "요소수 / 연료 / 충전 부족",
    risk: "확인 필요",
    keywords: ["요소수", "연료", "기름", "주유", "충전", "배터리 잔량", "주행가능거리", "주행 가능 거리", "부족", "보충"],
    checks: ["요소수/연료/충전 경고등 여부 확인", "남은 주행가능거리 확인", "가까운 주유소/충전소 이동 가능 여부 확인", "보충 금액 또는 수량 확인", "영수증 공유 가능 여부 확인"],
    requests: ["계기판 경고 표시 사진", "현재 주행가능거리", "현재 위치와 인근 주유·충전 가능 위치", "보충 후 영수증 사진과 금액"],
    driverReply: "기사님, 계기판에 요소수/연료 부족 경고가 표시되는지 확인 부탁드립니다.\n주행 가능거리가 부족한 경우 가까운 주유소에서 최소 운행 가능할 정도로 보충 부탁드립니다.\n보충 후 영수증 사진과 금액 공유 부탁드립니다.",
    internalMessage: "[차량번호] 탁송 중 요소수/연료 부족 문의가 있었습니다.\n현장 보충 필요 여부 확인 후 영수증 기준으로 정산 확인 예정입니다.",
    movementGuide: "계기판 주행가능거리를 확인한 뒤 가까운 보충 장소까지 이동 가능한 경우에만 최소 거리로 이동합니다.",
  },
  {
    id: "tire-cord-m2",
    title: "타이어 코드절상 / 재고 없음 / M2 입고 안내",
    risk: "높음",
    keywords: ["코드절상", "타이어 코드", "타이어 손상", "뒤 타이어", "앞 타이어", "타이어 재고", "재고 없음", "교체 힘듦", "교체 어려움", "황동 인근 타이어점", "항동 인근 타이어점", "인근 타이어점", "m2 입고", "m2 진행", "입고 진행", "타이어 규격"],
    checks: ["손상 위치 확인", "타이어 규격 확인", "코드절상 여부 확인", "인근 타이어점 재고 여부 확인", "현장 교체 가능 여부 확인", "M2 입고 필요 여부 확인"],
    requests: ["손상 타이어 위치와 사진", "타이어 규격", "인근 타이어점 재고 확인 결과", "현장 교체 가능 여부", "M2 입고 진행 가능 여부"],
    driverReply: "안녕하세요.\n해당 차량 타이어 코드절상 확인되었습니다.\n\n인근 타이어점에는 동일 규격 재고가 없어 현장 교체는 어려울 것 같습니다.\nM2 입고 진행하겠습니다.\n\n안녕하세요 케이든,\n위 차량 황동 인근 타이어점은 재고가 없어 교체가 힘들 것 같습니다.\nM2 입고 진행하겠습니다.",
    internalMessage: "[차량번호] 타이어 코드절상 확인되었습니다.\n인근 타이어점 동일 규격 재고 부재로 현장 교체 어려워 M2 입고 진행 예정입니다.",
    movementGuide: "타이어 코드절상은 안전 이슈가 있으므로 추가 주행은 보류하고, 필요 시 M2 입고 또는 견인/탁송 방향으로 진행합니다.",
  },
  {
    id: "m2-towing",
    title: "M2 견인 요청 / C구역 주차 안내",
    risk: "높음",
    keywords: ["견인", "m2 견인", "m2 입고", "m2", "입고", "주차안내", "주차 안내", "c구역", "c47", "c48", "c49"],
    checks: ["차량번호 확인", "견인 필요 사유 확인", "현재 차량 위치 확인", "M2 입고 대상 여부 확인", "C구역 C47~C49 주차 안내 필요 여부 확인"],
    requests: ["차량번호", "견인 요청 사유", "현재 위치", "차량 상태 사진 또는 참고 내용", "M2 입고 시 C구역 C47~C49 주차 가능 여부"],
    driverReply: "기사님, 해당 차량은 추가 이동을 보류하고 현재 위치 기준으로 대기 부탁드립니다.\n견인 진행 여부 확인 후 안내드리겠습니다.",
    internalMessage: "@김요한 @손인환 @김승현 cc. @knox @hardy\n매니저님,\n\n위 차량 M2 견인 부탁드려도 될까요?\n\n[사유]\n\n+ M2 입고 시 C구역 C47~C49 구역에 주차안내",
    movementGuide: "견인 요청 시 차량번호와 사유를 함께 공유하고, M2 입고 차량은 C구역 C47~C49 구역으로 주차 안내합니다.",
  },
  {
    id: "tire",
    title: "공기압 경고 / 타이어 이상",
    risk: "주의",
    keywords: ["공기압", "타이어", "펑크", "tpms", "타이어 바람", "바람 빠짐", "주저앉음", "찢김", "사이드월", "휠", "타이어점"],
    checks: ["경고등 점등 여부 확인", "타이어 외관 사진 확인", "타이어가 주저앉았는지 확인", "사이드월 손상 여부 확인", "가까운 타이어점 방문 가능 여부 확인"],
    requests: ["문제 타이어 전체와 근접 사진", "계기판 TPMS 표시 사진", "차량이 한쪽으로 기울었는지 여부", "현재 위치와 가까운 타이어점"],
    driverReply: "기사님, 우선 안전한 위치에서 타이어 외관 사진 공유 부탁드립니다.\n타이어가 주저앉았거나 사이드월 손상이 보이면 추가 주행은 보류 부탁드립니다.\n외관상 큰 손상이 없고 공기압 경고만 있는 경우, 가까운 타이어점에서 공기압 확인 후 진행 부탁드립니다.",
    internalMessage: "[차량번호] 탁송 중 공기압/타이어 이상 문의가 있었습니다.\n타이어 외관 확인 후 필요 시 인근 타이어점에서 공기압 점검 예정입니다.",
    movementGuide: "타이어가 주저앉았거나 찢김·사이드월 손상이 보이면 추가 주행을 보류합니다. 단순 공기압 경고만 있고 외관 손상이 없을 때만 가까운 점검 장소 이동을 검토합니다.",
  },
  {
    id: "accident",
    title: "사고 / 파손 / 견인 필요",
    risk: "높음",
    keywords: ["사고", "접촉", "파손", "충돌", "긁힘", "철제", "낙하물", "견인", "보험", "경찰", "수리비", "피해"],
    checks: ["기사님 안전 확보 여부", "추가 주행 가능 여부", "파손 부위 사진", "사고 경위", "상대 차량 또는 원인 제공자 여부", "경찰/보험 접수 필요 여부", "견인 필요 여부"],
    requests: ["현재 위치", "차량 전체와 파손 부위 사진·영상", "사고 발생 시간과 경위", "상대방 정보 및 현장 사진", "경찰·보험 접수 여부"],
    driverReply: "기사님, 우선 안전 확보 후 추가 주행은 잠시 보류 부탁드립니다.\n파손 부위 사진, 사고 경위, 현재 위치, 상대 차량 또는 원인 제공자 여부를 공유 부탁드립니다.\n견인이 필요한 상황이면 현재 위치 기준으로 대기 부탁드리고, 확인 후 진행 방향 안내드리겠습니다.",
    internalMessage: "[차량번호] 탁송 중 사고/파손 이슈가 발생했습니다.\n파손 부위 사진 및 사고 경위 확인 필요하며, 추가 주행 보류 후 견인/보험 처리 여부 판단이 필요합니다.",
    movementGuide: "추가 주행을 보류하고 안전한 위치에서 대기합니다. 2차 사고 위험이 있으면 기사님 안전 확보와 현장 신고를 우선합니다.",
  },
  {
    id: "warning-light",
    title: "경고등 점등",
    risk: "주의",
    keywords: ["경고등", "엔진 경고", "체크등", "체크 엔진", "브레이크 경고", "오일 경고", "수온", "계기판"],
    checks: ["경고등 색상과 문구 확인", "계기판 사진 확인", "출력 저하·진동·소음 여부", "수온 상승 또는 오일 경고 여부", "안전한 정차 가능 위치"],
    requests: ["계기판 전체 사진", "경고등 색상과 표시 문구", "주행 중 증상", "현재 위치와 시동 상태"],
    driverReply: "기사님, 안전한 위치에 정차 후 계기판 전체 사진과 표시 문구 공유 부탁드립니다.\n출력 저하, 심한 진동·소음, 적색 경고등이 함께 확인되면 추가 주행은 보류 부탁드립니다.\n현재 시동 상태와 주행 중 느껴지는 증상도 함께 확인 부탁드립니다.",
    internalMessage: "[차량번호] 탁송 중 경고등 점등 문의가 있었습니다.\n계기판 표시와 주행 증상 확인 후 이동 지속 여부 판단이 필요합니다.",
    movementGuide: "적색 경고등, 수온 상승, 오일압 경고 또는 뚜렷한 주행 이상이 있으면 추가 주행을 보류합니다.",
  },
  {
    id: "no-start",
    title: "시동 불가 / 방전",
    risk: "높음",
    keywords: ["시동 불가", "시동 안", "방전", "점프", "배터리 없음", "전원 안", "계기판 안 켜짐", "스마트키 인식"],
    checks: ["계기판 및 전원 작동 여부", "기어 P단과 브레이크 조작 여부", "스마트키 인식 여부", "점프 시동 가능 여부", "견인 또는 배터리 지원 필요 여부"],
    requests: ["계기판·시동 시도 영상", "현재 위치", "스마트키 보유 및 인식 상태", "점프 장비 지원 가능 여부"],
    driverReply: "기사님, 안전한 위치에서 기어 P단과 브레이크 조작 상태를 확인한 뒤 시동 재시도 부탁드립니다.\n계기판 전원이 들어오지 않거나 방전이 의심되면 추가 이동은 보류 부탁드립니다.\n계기판 사진과 시동 시도 영상, 현재 위치를 공유해 주시면 점프 또는 견인 필요 여부 확인하겠습니다.",
    internalMessage: "[차량번호] 탁송 중 시동 불가/방전 문의가 있었습니다.\n추가 이동 보류 후 전원 상태와 점프 가능 여부를 확인하고 있습니다.",
    movementGuide: "추가 주행을 보류합니다. 임의 반복 시동은 최소화하고 점프 지원 또는 견인 방향을 확인합니다.",
  },
  {
    id: "key-docs",
    title: "키 / 서류 / 번호판 문제",
    risk: "확인 필요",
    keywords: ["키", "스마트키", "보조키", "서류", "등록증", "번호판", "봉인", "분실", "없음"],
    checks: ["키·서류·번호판 중 누락 항목 확인", "인수 당시 보유 여부 확인", "차량 내부 및 전달 봉투 재확인", "출발지 담당자 확인", "운행에 법적·물리적 문제가 있는지 확인"],
    requests: ["누락 항목 사진", "인수 시점 확인 내용", "출발지·도착지 담당자 정보", "현재 차량 잠금 및 이동 가능 상태"],
    driverReply: "기사님, 누락된 항목이 키·서류·번호판 중 무엇인지 먼저 확인 부탁드립니다.\n차량 내부와 전달받은 봉투를 한 번 더 확인해 주시고, 인수 당시 보유 여부와 현재 차량 이동 가능 상태를 공유 부탁드립니다.",
    internalMessage: "[차량번호] 탁송 중 키/서류/번호판 관련 확인 요청이 있었습니다.\n인수 당시 상태와 출발지 보관 여부를 확인할 예정입니다.",
    movementGuide: "키 또는 번호판 문제로 정상 운행이 불가능한 경우 이동하지 않고 출발지·담당자 확인을 우선합니다.",
  },
  {
    id: "delay",
    title: "도착 지연 / 이동 불가",
    risk: "확인 필요",
    keywords: ["도착 지연", "지연", "정체", "이동 불가", "통제", "진입 불가", "도로 폐쇄", "시간 늦음", "도착 예정"],
    checks: ["현재 위치와 지연 원인", "예상 도착 시간", "우회 경로 가능 여부", "차량 자체 문제 여부", "고객 또는 도착지 안내 필요 여부"],
    requests: ["현재 위치", "지연 원인", "예상 도착 시간", "이동 재개 가능 시간"],
    driverReply: "기사님, 현재 위치와 지연 원인, 예상 도착 시간을 공유 부탁드립니다.\n안전한 우회 경로가 있는지 확인해 주시고, 차량 문제로 이동이 어려운 상황이면 증상과 사진도 함께 부탁드립니다.",
    internalMessage: "[차량번호] 탁송 도착 지연/이동 불가 문의가 있었습니다.\n현재 위치와 예상 도착 시간 확인 후 관련 담당자에게 공유 예정입니다.",
    movementGuide: "무리한 우회나 시간 단축 운행은 하지 않고, 안전한 경로와 예상 도착 시간을 기준으로 안내합니다.",
  },
  {
    id: "exterior",
    title: "외관 손상 발견",
    risk: "주의",
    keywords: ["외관", "스크래치", "찍힘", "눌림", "찌그러짐", "도장", "범퍼", "도어", "휀더", "유리 손상"],
    checks: ["손상 부위와 범위 확인", "인수 전 사진과 비교 가능 여부", "주행 안전에 영향 여부", "추가 파손 가능성", "발견 시점과 장소"],
    requests: ["차량 전체 사진", "손상 부위 근접·원거리 사진", "발견 시점과 장소", "인수 당시 사진 유무"],
    driverReply: "기사님, 안전한 위치에서 차량 전체 사진과 손상 부위 근접·원거리 사진을 공유 부탁드립니다.\n발견 시점과 장소, 인수 당시 동일 손상을 확인했는지도 함께 부탁드립니다.\n주행 안전에 영향을 줄 정도의 파손이면 추가 주행은 보류해 주세요.",
    internalMessage: "[차량번호] 탁송 중 외관 손상이 확인되었습니다.\n손상 부위 사진과 발견 시점 확인 후 기존 손상 여부 및 후속 처리 판단이 필요합니다.",
    movementGuide: "단순 외관 손상은 사진 기록 후 이동 여부를 확인합니다. 부품 이탈·유리 파손 등 안전 우려가 있으면 추가 주행을 보류합니다.",
  },
  {
    id: "other",
    title: "기타 확인 필요",
    risk: "확인 필요",
    keywords: [],
    checks: ["현재 위치와 차량번호 확인", "문제가 발생한 시점 확인", "계기판 및 차량 상태 확인", "사진 또는 영상 확보", "현재 이동 가능 여부 확인"],
    requests: ["현재 위치", "문제 상황 설명", "관련 사진·영상", "계기판 표시", "기사님이 판단한 이동 가능 여부"],
    driverReply: "기사님, 정확한 확인을 위해 현재 위치와 차량 상태, 문제가 발생한 시점 공유 부탁드립니다.\n관련 사진이나 영상, 계기판 표시가 있다면 함께 전달 부탁드리며 확인 후 진행 방향 안내드리겠습니다.",
    internalMessage: "[차량번호] 탁송 중 기타 이슈 확인 요청이 있었습니다.\n현장 상황과 사진 확인 후 이동 및 후속 처리 방향을 판단할 예정입니다.",
    movementGuide: "안전 여부가 확인되지 않은 상태에서는 무리하게 이동하지 않고 현장 정보 확인을 우선합니다.",
  },
];
const highRiskTireKeywords = ["펑크", "주저앉음", "찢김", "사이드월"];

function findTemplate(id: string) {
  return issueTemplates.find((template) => template.id === id)!;
}

function findMatches(text: string, keywords: string[]) {
  return Array.from(new Set(keywords.filter((keyword) => text.includes(keyword.toLowerCase()))));
}

export function recommendIssue(rawText: string) {
  const text = rawText.toLowerCase().replace(/\s+/g, " ");
  const choose = (id: string, reasons: string[], risk?: RiskLevel) => {
    const template = findTemplate(id);
    return { template, risk: risk ?? template.risk, reasons: reasons.slice(0, 5) };
  };

  // 안전 관련 유형은 차량번호 확인 등 일반 문의보다 항상 우선합니다.
  const m2Towing = findTemplate("m2-towing");
  const m2TowingMatches = findMatches(text, m2Towing.keywords);
  const hasM2TowContext = text.includes("견인") && (
    text.includes("m2") ||
    text.includes("입고") ||
    text.includes("c구역") ||
    text.includes("c47") ||
    text.includes("c48") ||
    text.includes("c49")
  );
  if (hasM2TowContext) return choose("m2-towing", m2TowingMatches.length ? m2TowingMatches : ["견인", "M2"]);

  const accident = findTemplate("accident");
  const accidentMatches = findMatches(text, accident.keywords);
  if (accidentMatches.length) return choose("accident", accidentMatches);

  const brake = findTemplate("brake");
  const brakeMatches = findMatches(text, brake.keywords);
  if (brakeMatches.length) return choose("brake", brakeMatches);

  const tireCord = findTemplate("tire-cord-m2");
  const tireCordMatches = findMatches(text, tireCord.keywords);
  if (tireCordMatches.length) return choose("tire-cord-m2", tireCordMatches);

  const deliveryContext = findMatches(text, [
    "차량 전달 완료", "차량 전달 후", "고객님께 전달", "고객에게 전달",
    "고객님이 운전", "운전하고 계시는데",
  ]);
  const drivingProblem = findMatches(text, [
    "운행 중", "주행 중", "시동이 꺼", "시동 꺼", "시동이 자꾸",
    "주행 중 꺼짐", "차가 꺼", "시동 문제", "운행해도 되나요",
    "이 상태로 운행", "주행 이상", "차량 불안정",
  ]);
  if ((deliveryContext.length && drivingProblem.length) || (deliveryContext.length >= 2 && text.includes("시동"))) {
    return choose("post-delivery-driving", [...deliveryContext, ...drivingProblem]);
  }

  const tire = findTemplate("tire");
  const tireMatches = findMatches(text, tire.keywords);
  if (tireMatches.length) {
    const elevated = highRiskTireKeywords.some((keyword) => text.includes(keyword));
    return choose("tire", tireMatches, elevated ? "높음" : tire.risk);
  }

  const warning = findTemplate("warning-light");
  const warningMatches = findMatches(text, warning.keywords);
  if (warningMatches.length) return choose("warning-light", warningMatches);

  const climate = findTemplate("climate");
  const climateMatches = findMatches(text, climate.keywords);
  if (climateMatches.length) return choose("climate", climateMatches);

  const noStart = findTemplate("no-start");
  const noStartMatches = findMatches(text, noStart.keywords);
  if (noStartMatches.length) return choose("no-start", noStartMatches);

  // 차량번호 확인은 위험 유형이 없을 때 다른 일반 문의보다 우선합니다.
  const vehicleInfo = findTemplate("vehicle-info");
  const vehicleInfoMatches = findMatches(text, vehicleInfo.keywords);
  if (vehicleInfoMatches.length) return choose("vehicle-info", vehicleInfoMatches);

  const pickupContext = findMatches(text, ["출발지", "픽업", "출발지 전화", "출발지 연락", "현장 도착했는데"]);
  const pickupProblem = findMatches(text, ["연락 안 됨", "연락 불가", "전화 안 받", "차문", "문이 잠", "문이 닫혀", "키 없음", "차량 접근", "차량 확인 불가", "차를 못 찾"]);
  const deliveredContext = findMatches(text, ["도착지", "고객 인계", "차량 전달 완료", "고객님께 전달"]);
  if (pickupContext.length && pickupProblem.length && !deliveredContext.length) {
    return choose("pickup-access", [...pickupContext, ...pickupProblem]);
  }

  const destinationContext = findMatches(text, ["도착지", "도착지 도착", "고객 인계", "인계"]);
  const handoverProblem = findMatches(text, ["고객 전화 안 받", "고객 연락 불가", "고객 연락 안", "인계 불가", "키 보관", "경비실", "관리실", "차량 주차 위치", "주차 위치 안내"]);
  if (destinationContext.length && handoverProblem.length) {
    return choose("handover", [...destinationContext, ...handoverProblem]);
  }

  const remainingIds = ["fuel", "key-docs", "delay", "exterior"];
  const remainingCandidates = remainingIds
    .map((id, index) => {
      const template = findTemplate(id);
      return { template, index, matches: findMatches(text, template.keywords) };
    })
    .filter((candidate) => candidate.matches.length)
    .sort((a, b) => {
      const riskDifference = riskScore[b.template.risk] - riskScore[a.template.risk];
      return riskDifference || b.matches.length - a.matches.length || a.index - b.index;
    });

  if (remainingCandidates[0]) {
    return choose(remainingCandidates[0].template.id, remainingCandidates[0].matches);
  }

  return choose("other", ["분류 키워드 없음"]);
}

export function extractVehicleNumber(rawText: string) {
  const bracketed = rawText.match(/\[([^\]]+)\]/)?.[1]?.trim();
  if (bracketed) return bracketed.replace(/\s+/g, "");
  return rawText.match(/\d{2,3}[가-힣]\d{4}/)?.[0] ?? "";
}
