export type GuideImage = {
  src: string;
  alt: string;
  caption: string;
};

export type GuideItem = {
  text: string;
  children?: GuideItem[];
};

export type GuideSubsection = {
  id: string;
  title: string;
  items: GuideItem[];
  callout?: string;
  images: GuideImage[];
};

export type GuideSection = {
  id: string;
  number: string;
  title: string;
  description: string;
  items?: GuideItem[];
  callout?: string;
  images?: GuideImage[];
  subsections?: GuideSubsection[];
};

const imageRoot = "/guides/remanufacturing";

export const guideSections: GuideSection[] = [
  {
    id: "required",
    number: "01",
    title: "어드민 상품화 칸반 기록 필요 리스트",
    description: "금전 지출 또는 외부·인근 업체 작업이 발생하는 자체 상품화 건의 기록 기준입니다.",
    items: [
      { text: "자체 블랙박스 교체 건" },
      {
        text: "출장 업체",
        children: [
          { text: "덴트" },
          { text: "키 복사, 문 개폐" },
          {
            text: "출장 유리 업체",
            children: [
              {
                text: "슈퍼 글라스",
                children: [{ text: "지결서 작성 필요 업체 → 작성 방법" }],
              },
            ],
          },
        ],
      },
      {
        text: "인근 공업사 방문",
        children: [{ text: "신태양 공업소" }, { text: "타이어 월드 뱅크" }],
      },
      {
        text: "배터리",
        children: [{ text: "브라더배터리, 에코아임" }],
      },
      {
        text: "그 외 금전 지출 생기는 상품화 건",
        children: [
          { text: "스마트키 커버 구매" },
          { text: "하이패스 단말기 충전기 구매" },
          { text: "등 소모품 구매 후 설치 작업" },
        ],
      },
    ],
    callout: "외부 비용 또는 소모품 구매가 발생하면 어드민 상품화 칸반 기록이 필요합니다.",
  },
  {
    id: "not-required",
    number: "02",
    title: "어드민 상품화 칸반 기록 불필요",
    description: "기존 카플레이어 BO 신청 건과 동일하게 처리하는 블랙박스 관련 기준입니다.",
    items: [
      { text: "기존 카플레이어 BO 신청 건과 동일" },
      {
        text: "블랙박스",
        children: [
          {
            text: "카플레이",
            children: [
              { text: "차량 픽업 후 m2 이동 작업 시 PDI 자체 상품화 기입 X" },
              { text: '카플레이 출장업체의 경우 "카플레이 + 항동 PDI 자체 상품화" 같이 기입' },
              {
                text: "#noti-테크메이-추가상품화-신고 채널 해당 차량 스레드에서 관계 BO 태그",
                children: [{ text: "zion, poby + 담당 판매 매니저" }],
              },
            ],
          },
        ],
      },
    ],
    callout: "카플레이 처리 방식과 이동 작업 여부를 확인한 뒤 중복 칸반 기록을 방지합니다.",
    images: [
      {
        src: `${imageRoot}/guide-not-required-blackbox.png`,
        alt: "블랙박스 및 카플레이 칸반 기록 불필요 예시",
        caption: "블랙박스/카플레이 관련 처리 예시",
      },
    ],
  },
  {
    id: "follow-up",
    number: "03",
    title: "상품화 칸반 기록 후 필요 작업",
    description: "칸반 기록 완료 후 업로드, 취소선, 공정 상태까지 마무리하는 절차입니다.",
    subsections: [
      {
        id: "upload",
        title: "3-1. 상품화 칸반 자체 누락/불량 업로드",
        items: [
          { text: "업로드 시 [사유 / 항동 PDI 자체 상품화] 필수 기재 필요" },
          { text: "항동 PDI 자체 상품화 작성 시 PDI - 안내 봇 인식 후 X 이모지 기록" },
          { text: "OQC 이전 지점 담당자 확인" },
          { text: "OQC 이후 관계 담당자 채널 또는 메신저 공유" },
        ],
        callout: "업로드 전 사유와 항동 PDI 자체 상품화 문구가 모두 포함됐는지 확인하세요.",
        images: [
          {
            src: `${imageRoot}/guide-upload-example.png`,
            alt: "상품화 칸반 자체 누락 및 불량 업로드 예시",
            caption: "상품화 칸반 업로드 작성 예시",
          },
        ],
      },
      {
        id: "strikethrough",
        title: "3-2. 상품화 칸반 취소선 체크",
        items: [{ text: "취소선 체크 후 우측 상단 변경내용 저장 체크 필요" }],
        callout: "취소선만 적용하고 저장하지 않는 누락이 없도록 우측 상단 저장 상태를 확인하세요.",
        images: [
          {
            src: `${imageRoot}/guide-strikethrough-check.png`,
            alt: "상품화 칸반 취소선 체크 예시",
            caption: "취소선 체크 및 변경내용 저장 위치",
          },
        ],
      },
      {
        id: "process-status",
        title: "3-3. 공정 상태 변경",
        items: [
          { text: '공정 "상품화 → 보관" 변경 처리' },
          { text: "공정 상세 기록 및 OQC task 완료 처리" },
          {
            text: "상태 변경 절차",
            children: [
              { text: "1. 공정 상세 기록에서 상품화 체크" },
              { text: "2. OQC 체크" },
              { text: "3. 공정에서 보관 체크" },
              { text: "4. 공정 상세 기록에서 보관 체크" },
            ],
          },
        ],
        images: [
          {
            src: `${imageRoot}/guide-process-status.png`,
            alt: "상품화에서 보관으로 공정 상태 변경 예시",
            caption: "공정 상태 및 상세 기록 변경 절차",
          },
        ],
      },
    ],
  },
];
