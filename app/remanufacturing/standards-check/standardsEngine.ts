export const GRADES = ["가", "나", "다", "라", "마"] as const;
export const CATEGORIES = ["외판 눌림", "흠집", "철 까짐", "버튼 까짐", "틴팅", "타이어", "휠"] as const;

export type Grade = (typeof GRADES)[number];
export type StandardCategory = (typeof CATEGORIES)[number];

export type StandardItem = {
  id: string;
  category: StandardCategory;
  part: string;
  workerOpinion: string;
  condition: string;
  count: number;
  size: number;
  secondarySize: number;
  location: string;
  exposed: string;
};

export type StandardDecision = {
  verdict: "상품화 대상" | "고지 대상" | "조치 불필요" | "판정 보류";
  action: string;
  basis: string;
  additionalCheck: string;
};

export function createStandardItem(category: StandardCategory = "외판 눌림"): StandardItem {
  return {
    id: crypto.randomUUID(),
    category,
    part: "",
    workerOpinion: "",
    condition: defaultCondition(category),
    count: 1,
    size: 0,
    secondarySize: 0,
    location: "",
    exposed: "아니오",
  };
}

export function evaluateStandard(item: StandardItem, grade: Grade): StandardDecision {
  switch (item.category) {
    case "외판 눌림":
      return evaluateDent(item, grade);
    case "흠집":
      return evaluateScratch(item, grade);
    case "철 까짐":
      return evaluatePaintChip(item, grade);
    case "버튼 까짐":
      return item.condition === "기능 식별 어려움"
        ? gradeRank(grade) <= 3
          ? decision("상품화 대상", "버튼 복원 또는 교체 권장", "기능을 알기 어려운 버튼 까짐은 가·나·다 등급에서 상품화합니다.", "기능 표기 복원 가능 여부 확인")
          : decision("고지 대상", "고지 판매", "기능을 알기 어려운 버튼 까짐은 라·마 등급에서 고지합니다.", "")
        : decision("고지 대상", "고지 판매", "기능을 식별할 수 있는 버튼 까짐은 전 등급 고지 기준입니다.", "");
    case "틴팅":
      return evaluateTinting(item, grade);
    case "타이어":
      return evaluateTire(item, grade);
    case "휠":
      return evaluateWheel(item, grade);
  }
}

export function categoryConditions(category: StandardCategory) {
  const values: Record<StandardCategory, string[]> = {
    "외판 눌림": ["큰 눌림", "작은 눌림 · 손바닥 범위", "작은 눌림 · 1판당"],
    "흠집": ["명함 가로 길이 이내", "명함 가로 길이 초과", "A4 가로 길이 이상"],
    "철 까짐": ["손바닥 내 1cm×1cm 이하", "1판당 1cm×1cm 이하"],
    "버튼 까짐": ["기능 식별 어려움", "기능 식별 가능"],
    "틴팅": ["5cm 이상 긁힘", "지름 5mm 이상 원형 2개 이상", "넓은 영역 손상", "5cm×5cm 이상 손상", "10cm 이상 긁힘"],
    "타이어": ["트레드 2.3mm 미만", "좌우 트레드 차이 1.5mm 이상", "계절 타이어 구성", "좌우 브랜드 다름", "청킹 현상", "생산연도 4년 이상", "생산연도 3년 이하"],
    "휠": ["5cm×2cm 이상 면적 손상", "휠 굴절", "5cm 이상 얇게 긁힘"],
  };
  return values[category];
}

function evaluateDent(item: StandardItem, grade: Grade) {
  const count = Math.max(0, item.count);
  if (item.condition === "큰 눌림") {
    if (count >= 5 || (count >= 2 && gradeRank(grade) <= 3) || (count === 1 && gradeRank(grade) <= 2)) {
      return decision("상품화 대상", "덴트 또는 외판 복원 권장", `큰 눌림 ${count}개 및 ${grade} 등급 기준상 상품화 대상입니다.`, "판이 2개 이상 연결된 경우 판별로 기준 적용")
    }
    return decision("고지 대상", "고지 판매", `큰 눌림 ${count}개 및 ${grade} 등급은 고지 기준입니다.`, "애매한 경우 판매팀과 소통")
  }

  const limit = item.condition.includes("손바닥") ? 5 : 7;
  return count >= limit
    ? decision("상품화 대상", "덴트 또는 외판 복원 권장", `${item.condition} 작은 눌림 ${count}개는 ${limit}개 이상 상품화 기준입니다.`, "손바닥 범위 판정 후 1판 순서로 확인")
    : decision("고지 대상", "고지 판매", `${item.condition} 작은 눌림 ${count}개는 고지 기준입니다.`, "");
}

function evaluateScratch(item: StandardItem, grade: Grade) {
  const count = Math.max(0, item.count);
  const exposed = item.exposed === "예";
  const rank = gradeRank(grade);

  if (item.condition === "A4 가로 길이 이상") {
    return decision("상품화 대상", "한판 또는 부분 도색 권장", "A4 가로 길이 이상 흠집은 전 등급 도색 기준입니다.", "지워지고 영역이 좁아져 붓터치가 가능하면 고지 가능");
  }
  if (item.condition === "명함 가로 길이 초과" && count >= 5) {
    return decision("상품화 대상", "한판 또는 부분 도색 권장", "명함 가로 길이 초과 흠집 5개 이상은 전 등급 도색 기준입니다.", "지워지고 영역이 좁아지면 고지 가능");
  }
  if (!exposed) {
    return decision("고지 대상", "광택·붓터치 후 고지", "차체가 드러나지 않은 흠집은 제거 가능성을 우선 확인하고 경미한 흠집은 고지합니다.", "명함 가로 길이 내 제거 가능 영역인지 확인");
  }
  if (item.condition === "명함 가로 길이 이내") {
    if (count >= 8 || (count >= 5 && rank <= 2)) {
      return decision("상품화 대상", "한판 또는 부분 도색 권장", `차체 노출 흠집 ${count}개 및 ${grade} 등급 기준상 도색 대상입니다.`, "");
    }
    return decision("고지 대상", "광택·붓터치 후 고지", `차체 노출 흠집 ${count}개는 ${grade} 등급에서 경미한 고지 기준입니다.`, "");
  }
  if (rank <= 2) return decision("상품화 대상", "한판 또는 부분 도색 권장", "차체 노출 및 명함 길이 초과 흠집은 가·나 등급에서 도색 기준입니다.", "");
  return decision("판정 보류", "판매팀과 소통 필요", "다·라·마 등급의 큰 차체 노출 흠집은 크기와 현장 상태에 따라 판단합니다.", "판매팀과 현장 판단 필요");
}

function evaluatePaintChip(item: StandardItem, grade: Grade) {
  const count = Math.max(0, item.count);
  const rank = gradeRank(grade);
  if (item.condition.includes("손바닥")) {
    if (count >= 6) return decision("상품화 대상", "한판 또는 부분 도색 권장", "손바닥 내 1cm×1cm 이하 철 까짐 6개 이상은 전 등급 도색 기준입니다.", "");
    return decision("고지 대상", "붓터치 후 고지", "손바닥 내 1cm×1cm 이하 철 까짐 5개 이하는 붓터치·고지 기준입니다.", "");
  }
  if (count >= 11 || (count >= 7 && rank <= 2)) {
    return decision("상품화 대상", "한판 또는 부분 도색 권장", `1판당 철 까짐 ${count}개 및 ${grade} 등급 기준상 도색 대상입니다.`, "");
  }
  return decision("고지 대상", "붓터치 후 고지", `1판당 철 까짐 ${count}개는 ${grade} 등급에서 붓터치·고지 기준입니다.`, "");
}

function evaluateTinting(item: StandardItem, grade: Grade) {
  const driver = item.location === "운전석";
  const rank = gradeRank(grade);
  if (driver) {
    if (rank <= 3) return decision("상품화 대상", "틴팅 새로 시공 권장", "운전석 틴팅 손상은 가·나·다 등급에서 새로 시공합니다.", "");
    return decision("상품화 대상", "기존 필름 제거 권장", "운전석 틴팅 손상은 라·마 등급에서 필름만 제거합니다.", "");
  }
  if (item.condition === "5cm 이상 긁힘") {
    return rank <= 3
      ? decision("상품화 대상", "틴팅 새로 시공 권장", "조수석 5cm 이상 긁힘은 가·나·다 등급에서 새로 시공합니다.", "")
      : decision("고지 대상", "고지 판매", "조수석 5cm 이상 긁힘은 라·마 등급에서 고지합니다.", "");
  }
  return rank <= 3
    ? decision("상품화 대상", "틴팅 새로 시공 권장", "조수석의 넓은 손상은 가·나·다 등급에서 새로 시공합니다.", "")
    : decision("상품화 대상", "기존 필름 제거 권장", "조수석의 넓은 손상은 라·마 등급에서 필름을 제거합니다.", "");
}

function evaluateTire(item: StandardItem, grade: Grade) {
  const rank = gradeRank(grade);
  if (["트레드 2.3mm 미만", "좌우 트레드 차이 1.5mm 이상", "생산연도 4년 이상"].includes(item.condition)) {
    return decision("상품화 대상", "타이어 교체 권장", `${item.condition}은 전 등급 타이어 교체 기준입니다.`, "");
  }
  if (item.condition === "생산연도 3년 이하") {
    return decision("조치 불필요", "교체 및 고지 불필요", "트레드가 양호하고 생산연도 3년 이하이면 교체·고지하지 않습니다.", "트레드 잔량이 양호한지 확인");
  }
  if (item.condition === "좌우 브랜드 다름") {
    return rank <= 2
      ? decision("상품화 대상", "타이어 교체 권장", "좌우 브랜드가 다른 경우 가·나 등급은 교체합니다.", "앞·뒤 브랜드는 달라도 허용")
      : decision("고지 대상", "고지 판매", "좌우 브랜드가 다른 경우 다·라·마 등급은 교체하지 않고 고지합니다.", "");
  }
  if (item.condition === "청킹 현상") {
    return decision("판정 보류", "판매팀 또는 OQC와 소통 필요", "청킹은 기본 교체 대상이 아니지만 뜯김이 심하면 진단팀/OQC 판단으로 교체합니다.", "뜯김 깊이와 주행 안전성 확인");
  }
  if (item.condition === "계절 타이어 구성") {
    return item.location === "인증 중고차"
      ? decision("고지 대상", "고지 판매", "인증 중고차는 윈터 타이어가 장착되어도 계절 타이어 교체 없이 고지합니다.", "차량 등급별 브랜드 기준은 별도 적용")
      : decision("상품화 대상", "사계절 타이어 교체 권장", "리볼트 차량의 윈터 타이어는 사계절 타이어로 교체합니다.", "");
  }
  return decision("판정 보류", "판매팀과 소통 필요", "선택한 타이어 상태의 세부 조건 확인이 필요합니다.", "현장 사진과 측정값 확인");
}

function evaluateWheel(item: StandardItem, grade: Grade) {
  if (item.condition === "휠 굴절") {
    return decision("상품화 대상", "휠 복원 권장", "휠 굴절은 전 등급 휠 복원 기준입니다.", "주행 안전성 및 타이어 손상 동반 여부 확인");
  }
  if (item.condition === "5cm×2cm 이상 면적 손상") {
    return gradeRank(grade) <= 3
      ? decision("상품화 대상", "휠 복원 권장", "5cm×2cm 이상 면적 손상은 가·나·다 등급에서 휠 복원합니다.", "")
      : decision("고지 대상", "고지 판매", "5cm×2cm 이상 면적 손상은 라·마 등급에서 고지합니다.", "");
  }
  return gradeRank(grade) <= 2
    ? decision("상품화 대상", "휠 복원 권장", "5cm 이상 얇은 긁힘은 가·나 등급에서 휠 복원합니다.", "")
    : decision("고지 대상", "고지 판매", "5cm 이상 얇은 긁힘은 다·라·마 등급에서 고지합니다.", "");
}

function decision(verdict: StandardDecision["verdict"], action: string, basis: string, additionalCheck: string): StandardDecision {
  return { verdict, action, basis, additionalCheck };
}

function gradeRank(grade: Grade) {
  return GRADES.indexOf(grade) + 1;
}

function defaultCondition(category: StandardCategory) {
  return categoryConditions(category)[0];
}
