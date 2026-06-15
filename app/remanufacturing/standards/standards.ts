export const GRADES = ["가", "나", "다", "라", "마"] as const;

export type VehicleGrade = (typeof GRADES)[number];
export type StandardCategory =
  | "외판 눌림"
  | "흠집"
  | "철 까짐"
  | "버튼 까짐"
  | "틴팅"
  | "타이어"
  | "휠";

export type StandardDecision = "상품화 대상" | "고지 대상" | "조치 불필요" | "판정 보류";

export interface StandardItem {
  id: string;
  category: StandardCategory;
  part: string;
  condition: string;
  count: number;
  opinion: string;
  photoUrl?: string;
  photoName?: string;
}

export interface StandardResult {
  decision: StandardDecision;
  action: string;
  basis: string;
  extra: string;
}

export const CATEGORY_OPTIONS: Record<
  StandardCategory,
  Array<{ value: string; label: string }>
> = {
  "외판 눌림": [
    { value: "large", label: "큰 눌림 (너비 약 3~5cm)" },
    { value: "small-hand", label: "작은 눌림 · 손바닥 범위" },
    { value: "small-panel", label: "작은 눌림 · 1판 기준" },
    { value: "ambiguous", label: "크기/범위 판단이 애매함" },
  ],
  흠집: [
    { value: "not-exposed-card", label: "차체 미노출 · 명함 가로 길이 이내" },
    { value: "not-exposed-over", label: "차체 미노출 · 명함 가로 길이 초과" },
    { value: "not-exposed-a4", label: "차체 미노출 · A4 가로 길이 이상" },
    { value: "exposed-card", label: "차체 노출 · 명함 가로 길이 이내" },
    { value: "exposed-over", label: "차체 노출 · 명함 가로 길이 초과" },
    { value: "ambiguous", label: "차체 노출/크기 판단이 애매함" },
  ],
  "철 까짐": [
    { value: "hand", label: "1cm × 1cm 이하 · 손바닥 범위" },
    { value: "panel", label: "1cm × 1cm 이하 · 1판 기준" },
    { value: "ambiguous", label: "철 노출/범위 판단이 애매함" },
  ],
  "버튼 까짐": [
    { value: "hard", label: "버튼 기능을 알기 어려운 까짐" },
    { value: "clear", label: "버튼 기능을 알 수 있는 까짐" },
    { value: "ambiguous", label: "기능 식별 여부가 애매함" },
  ],
  틴팅: [
    { value: "driver-scratch", label: "운전석 · 5cm 이상 긁힘" },
    { value: "driver-circle", label: "운전석 · 지름 5mm 이상 원형 손상 2개 이상" },
    { value: "driver-wide", label: "운전석 · 넓은 영역 손상" },
    { value: "passenger-scratch", label: "조수석 · 5cm 이상 긁힘" },
    { value: "passenger-wide", label: "조수석 · 5×5cm 이상 또는 10cm 이상 긁힘" },
    { value: "ambiguous", label: "손상 크기/위치가 애매함" },
  ],
  타이어: [
    { value: "tread", label: "트레드 2.3mm 미만" },
    { value: "difference", label: "좌·우 트레드 잔량 1.5mm 이상 차이" },
    { value: "brand", label: "좌·우 타이어 브랜드 다름" },
    { value: "chunking", label: "타이어 청킹 현상 · 경미함" },
    { value: "chunking-severe", label: "타이어 청킹 현상 · 뜯김 심함" },
    { value: "age-under", label: "생산연도 3년 이하 · 트레드 양호" },
    { value: "age-over", label: "생산연도 4년 이상" },
    { value: "rivolt-all-winter", label: "리볼트 · 사계절+윈터 혼용 또는 윈터 장착" },
    { value: "rivolt-summer", label: "리볼트 · 썸머 타이어" },
    { value: "certified-all-winter", label: "인증 중고차 · 사계절+윈터 혼용 또는 윈터 장착" },
    { value: "certified-summer", label: "인증 중고차 · 썸머 타이어" },
    { value: "ambiguous", label: "손상/교체 기준 판단이 애매함" },
  ],
  휠: [
    { value: "area", label: "길이 5cm × 너비 2cm 이상 면적 손상" },
    { value: "bend", label: "휠 굴절 발생" },
    { value: "thin", label: "길이 5cm 이상 얇은 긁힘 (립 긁힘)" },
    { value: "ambiguous", label: "굴절/손상 크기 판단이 애매함" },
  ],
};

export function createStandardItem(index = 0): StandardItem {
  const category: StandardCategory = index === 0 ? "외판 눌림" : "휠";
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    category,
    part: "",
    condition: CATEGORY_OPTIONS[category][0].value,
    count: 1,
    opinion: "",
  };
}

const isGrade = (grade: VehicleGrade, allowed: VehicleGrade[]) => allowed.includes(grade);

const result = (
  decision: StandardDecision,
  action: string,
  basis: string,
  extra = "없음",
): StandardResult => ({ decision, action, basis, extra });

const hold = (basis: string) =>
  result("판정 보류", "판매팀과 소통 필요", basis, "현장 사진과 손상 범위를 판매팀과 함께 확인");

export function assessStandard(grade: VehicleGrade, item: StandardItem): StandardResult {
  const count = Math.max(1, Number(item.count) || 1);
  const { category, condition } = item;

  if (condition === "ambiguous") {
    return hold(`${category}의 크기 또는 상태가 기준 구간에 명확히 포함되지 않음`);
  }

  if (category === "외판 눌림") {
    if (condition === "large") {
      if (count >= 5) return result("상품화 대상", "덴트 복원 권장", "큰 눌림 5개 이상");
      if (count >= 2) {
        return isGrade(grade, ["가", "나", "다"])
          ? result("상품화 대상", "덴트 복원 권장", "큰 눌림 2~4개 · 가/나/다 등급")
          : result("고지 대상", "판매 고지 권장", "큰 눌림 2~4개 · 라/마 등급");
      }
      return isGrade(grade, ["가", "나"])
        ? result("상품화 대상", "덴트 복원 권장", "큰 눌림 1개 · 가/나 등급")
        : result("고지 대상", "판매 고지 권장", "큰 눌림 1개 · 다/라/마 등급");
    }
    if (condition === "small-hand") {
      return count >= 5
        ? result("상품화 대상", "덴트 복원 권장", "손바닥 범위 내 작은 눌림 5개 이상")
        : result("고지 대상", "판매 고지 권장", "손바닥 범위 내 작은 눌림 4개 이하");
    }
    return count >= 7
      ? result("상품화 대상", "덴트 복원 권장", "1판당 작은 눌림 7개 이상")
      : result("고지 대상", "판매 고지 권장", "1판당 작은 눌림 6개 이하");
  }

  if (category === "흠집") {
    if (condition === "not-exposed-card") {
      return result("고지 대상", "광택 또는 붓터치 후 고지", "차체 미노출 · 명함 가로 길이 이내");
    }
    if (condition === "not-exposed-over") {
      return count >= 5
        ? result("상품화 대상", "한판 또는 부분 도색 권장", "차체 미노출 · 명함 가로 길이 초과 흠집 5개 이상")
        : result("고지 대상", "광택 또는 붓터치 후 고지", "차체 미노출 · 명함 가로 길이 초과 흠집 4개 이하");
    }
    if (condition === "not-exposed-a4") {
      return result("상품화 대상", "한판 또는 부분 도색 권장", "차체 미노출 · A4 가로 길이 이상");
    }
    if (condition === "exposed-card") {
      if (count >= 8) return result("상품화 대상", "한판 또는 부분 도색 권장", "차체 노출 · 명함 가로 길이 이내 흠집 8개 이상");
      if (count >= 5) {
        return isGrade(grade, ["가", "나"])
          ? result("상품화 대상", "한판 또는 부분 도색 권장", "차체 노출 · 명함 가로 길이 이내 흠집 5~7개 · 가/나 등급")
          : result("고지 대상", "광택 또는 붓터치 후 고지", "차체 노출 · 명함 가로 길이 이내 흠집 5~7개 · 다/라/마 등급");
      }
      return result("고지 대상", "광택 또는 붓터치 후 고지", "차체 노출 · 명함 가로 길이 이내 흠집 4개 이하");
    }
    if (count >= 5) {
      return result("상품화 대상", "한판 또는 부분 도색 권장", "차체 노출 · 명함 가로 길이 초과 흠집 5개 이상");
    }
    return isGrade(grade, ["가", "나"])
      ? result("상품화 대상", "한판 또는 부분 도색 권장", "차체 노출 · 명함 가로 길이 초과 흠집 4개 이하 · 가/나 등급")
      : result("고지 대상", "광택 또는 붓터치 후 고지", "차체 노출 · 명함 가로 길이 초과 흠집 4개 이하 · 다/라/마 등급", "손상이 큰 경우 현장 판단으로 도색 전환");
  }

  if (category === "철 까짐") {
    if (condition === "hand") {
      return count >= 6
        ? result("상품화 대상", "한판 또는 부분 도색 권장", "손바닥 범위 내 1cm × 1cm 이하 철 까짐 6개 이상")
        : result("고지 대상", "붓터치 후 고지", "손바닥 범위 내 1cm × 1cm 이하 철 까짐 5개 이하");
    }
    if (count >= 11) return result("상품화 대상", "한판 또는 부분 도색 권장", "1판당 철 까짐 11개 이상");
    if (count >= 7) {
      return isGrade(grade, ["가", "나"])
        ? result("상품화 대상", "한판 또는 부분 도색 권장", "1판당 철 까짐 7~10개 · 가/나 등급")
        : result("고지 대상", "붓터치 후 고지", "1판당 철 까짐 7~10개 · 다/라/마 등급");
    }
    return result("고지 대상", "붓터치 후 고지", "1판당 철 까짐 6개 이하");
  }

  if (category === "버튼 까짐") {
    if (condition === "clear") return result("고지 대상", "판매 고지 권장", "버튼 기능을 식별할 수 있는 까짐");
    return isGrade(grade, ["가", "나", "다"])
      ? result("상품화 대상", "버튼 복원 또는 교체 검토", "버튼 기능을 알기 어려운 까짐 · 가/나/다 등급")
      : result("고지 대상", "판매 고지 권장", "버튼 기능을 알기 어려운 까짐 · 라/마 등급");
  }

  if (category === "틴팅") {
    const gradeRequiresWork = isGrade(grade, ["가", "나", "다"]);
    if (gradeRequiresWork) {
      return result("상품화 대상", "틴팅 신규 시공 권장", `${CATEGORY_OPTIONS.틴팅.find((option) => option.value === condition)?.label} · 가/나/다 등급`);
    }
    if (condition === "passenger-scratch") {
      return result("고지 대상", "판매 고지 권장", "조수석 5cm 이상 긁힘 · 라/마 등급");
    }
    return result("상품화 대상", "기존 필름 제거 권장", `${CATEGORY_OPTIONS.틴팅.find((option) => option.value === condition)?.label} · 라/마 등급`);
  }

  if (category === "타이어") {
    if (["tread", "difference", "age-over"].includes(condition)) {
      const basis =
        condition === "tread"
          ? "트레드 2.3mm 미만"
          : condition === "difference"
            ? "좌·우 트레드 잔량 1.5mm 이상 차이"
            : "생산연도 4년 이상";
      return result("상품화 대상", "타이어 교체 권장", basis);
    }
    if (condition === "brand") {
      return isGrade(grade, ["가", "나"])
        ? result("상품화 대상", "타이어 브랜드 일치 교체 권장", "좌·우 타이어 브랜드 다름 · 가/나 등급")
        : result("고지 대상", "판매 고지 권장", "좌·우 타이어 브랜드 다름 · 다/라/마 등급");
    }
    if (condition === "chunking-severe") {
      return hold("타이어 청킹 뜯김이 심해 진단팀/OQC 판단 필요");
    }
    if (condition === "chunking") return result("조치 불필요", "교체 없이 진행", "경미한 타이어 청킹 현상", "뜯김이 심해지면 진단팀/OQC 재확인");
    if (condition === "age-under") return result("조치 불필요", "교체 없이 진행", "생산연도 3년 이하이며 트레드 양호");
    if (condition === "rivolt-all-winter") return result("상품화 대상", "사계절 타이어로 교체 권장", "리볼트 차량의 사계절+윈터 혼용 또는 윈터 장착");
    if (condition === "certified-all-winter") return result("고지 대상", "교체 없이 고지 판매", "인증 중고차의 사계절+윈터 혼용 또는 윈터 장착");
    return result("조치 불필요", "교체 없이 진행", condition === "rivolt-summer" ? "리볼트 차량의 썸머 타이어" : "인증 중고차의 썸머 타이어");
  }

  if (condition === "bend") return result("상품화 대상", "휠 복원 권장", "휠 굴절 발생");
  if (condition === "area") {
    return isGrade(grade, ["가", "나", "다"])
      ? result("상품화 대상", "휠 복원 권장", "길이 5cm × 너비 2cm 이상 면적 손상 · 가/나/다 등급")
      : result("고지 대상", "판매 고지 권장", "길이 5cm × 너비 2cm 이상 면적 손상 · 라/마 등급");
  }
  return isGrade(grade, ["가", "나"])
    ? result("상품화 대상", "휠 복원 권장", "길이 5cm 이상 얇은 긁힘 · 가/나 등급")
    : result("고지 대상", "판매 고지 권장", "길이 5cm 이상 얇은 긁힘 · 다/라/마 등급");
}

export function describeCondition(item: StandardItem) {
  const option = CATEGORY_OPTIONS[item.category].find((entry) => entry.value === item.condition);
  const countCategories: StandardCategory[] = ["외판 눌림", "흠집", "철 까짐"];
  return `${option?.label ?? item.condition}${countCategories.includes(item.category) ? ` · ${Math.max(1, item.count)}개` : ""}`;
}
