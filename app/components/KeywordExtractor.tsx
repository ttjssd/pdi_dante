"use client";

import { useEffect, useMemo, useState } from "react";
import { BackButton, Breadcrumb, PlatformHeader } from "./platform";

const KANBAN_CATEGORIES = [
  "번호판 교체",
  "유리 교체",
  "벨트 교체",
  "타이어 교체",
  "기능 정비",
  "덴트",
  "광택",
  "판금/색",
  "라이트 복원",
  "유리 복원",
  "실내 복원",
  "휠 복원",
  "틴팅",
  "판갈 제거",
  "배터리/썬/후처",
  "실내크리닝",
] as const;

type ExtractedForm = {
  slackRaw: string;
  managerName: string;
  vehicleNumber: string;
  vehicleName: string;
  problemText: string;
  handlingPlan: string;
};

type SymptomOption = {
  label: string;
  tasks: string[];
  keyword: string;
};

type Recommendation = {
  id: string;
  category: string;
  tasks: string[];
  keyword: string;
  selected: boolean;
  symptomOptions: SymptomOption[];
  selectedSymptom: string;
  customSymptom: boolean;
};

type HistoryItem = {
  id: string;
  createdAt: string;
  form: ExtractedForm;
  recommendations: Recommendation[];
};

const STORAGE_KEY = "pdi-merchandising-recommendation-history-v1";

const INITIAL_FORM: ExtractedForm = {
  slackRaw: "",
  managerName: "",
  vehicleNumber: "",
  vehicleName: "",
  problemText: "",
  handlingPlan: "",
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanSentence(value: string) {
  return value
    .replace(/:[A-Za-z0-9_\-\s]{1,18}:/g, " ")
    .replace(/[^가-힣ㄱ-ㅎㅏ-ㅣA-Za-z0-9\s()\/.,+\-\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*(입니다|합니다|하겠습니다|입니다만)[.!]*$/g, "")
    .replace(/[.!]+$/g, "")
    .trim();
}

function normalizeFieldTerms(value: string) {
  return cleanSentence(value)
    .replace(/운\s*앞/g, "운전석 앞")
    .replace(/운\s*뒤/g, "운전석 뒤")
    .replace(/조\s*앞/g, "조수석 앞")
    .replace(/조\s*뒤/g, "조수석 뒤")
    .replace(/앞도어/g, "앞 도어")
    .replace(/뒷도어/g, "뒤 도어")
    .replace(/본넷/g, "보닛")
    .replace(/트렁크리드/g, "트렁크 리드")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSlackRaw(raw: string): Partial<ExtractedForm> {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const vehicleLineIndex = lines.findIndex((line) => /\[[^\]]+\]/.test(line));
  const vehicleLine = vehicleLineIndex >= 0 ? lines[vehicleLineIndex] : "";
  const mention = raw.match(/@([A-Za-z0-9._-]+)/)?.[1] ?? "";
  const greetingManager =
    lines
      .slice(0, vehicleLineIndex >= 0 ? vehicleLineIndex : lines.length)
      .map((line) => line.match(/^([가-힣A-Za-z]{2,20})\s*[,，]?\s*안녕하세요/)?.[1])
      .find(Boolean) ?? "";
  const handlingLines = lines
    .filter((line) => /^[■▪]/.test(line))
    .map((line) => normalizeFieldTerms(line.replace(/^[■▪]\s*/, "")))
    .filter(Boolean);
  const problemCandidates = vehicleLineIndex >= 0
    ? lines.slice(vehicleLineIndex + 1)
    : lines;
  const ignoredLine = /^(?:@[A-Za-z0-9._-]+|안녕하세요|안녕하세|특이사항\s*(?:공유|보고)|공유\s*드립니다|보고\s*드립니다)/;
  const problems = problemCandidates
    .filter((line) => !/^[■▪]/.test(line))
    .map((line) => line.replace(/^[○◦•●\-]\s*/, ""))
    .filter((line) => !ignoredLine.test(line))
    .map(normalizeFieldTerms)
    .filter(Boolean);

  return {
    managerName: mention || greetingManager,
    vehicleNumber:
      vehicleLine.match(/\[([^\]]+)\]/)?.[1]?.trim() ??
      raw.match(/\b\d{2,3}[가-힣]\d{4}\b/)?.[0] ??
      "",
    vehicleName: vehicleLine
      .replace(/^[•●\-]\s*/, "")
      .replace(/\[[^\]]+\]\s*/, "")
      .trim(),
    problemText: problems.join("\n"),
    handlingPlan: handlingLines.join("\n"),
  };
}

function symptomOption(label: string, tasks: string[], keyword = label): SymptomOption {
  return { label, tasks: tasks.slice(0, 3), keyword };
}

function getSymptomOptions(category: string, context: string): SymptomOption[] {
  const area = areaFromProblem(context);
  const tireArea = area.includes("타이어") ? area : "타이어";

  if (category === "기능 정비" && /에어컨|히터|공조|송풍|블로우/.test(context)) {
    return [
      symptomOption("에어컨 작동 불량", ["에어컨 작동 상태 확인", "공조장치 점검 필요"]),
      symptomOption("에어컨 냉기 부족", ["에어컨 냉기 상태 확인", "냉방 성능 점검"], "에어컨 냉기 부족 점검"),
      symptomOption("송풍 바람 약함", ["송풍량 확인", "블로우모터 및 필터 점검"], "에어컨 송풍량 점검"),
      symptomOption("블로우모터 소음", ["블로우모터 소음 확인", "블로우모터 작동 점검"], "블로우모터 소음 점검"),
      symptomOption("공조 패널 작동 불량", ["공조 패널 작동 확인", "공조 스위치 점검"]),
      symptomOption("히터 불량", ["히터 작동 상태 확인", "난방 성능 점검"], "히터 작동 불량"),
    ];
  }

  if (category === "기능 정비" && /주차센서|센서|경고등|후방카메라|카메라/.test(context)) {
    return [
      symptomOption("주차센서 작동 불량", ["주차센서 작동 확인", "센서 오류 점검"]),
      symptomOption("전방 센서 불량", ["전방 센서 작동 확인", "센서 연결 상태 점검"]),
      symptomOption("후방 센서 불량", ["후방 센서 작동 확인", "센서 연결 상태 점검"]),
      symptomOption("후방카메라 불량", ["후방카메라 화면 확인", "카메라 작동 점검"]),
      symptomOption("경고등 점등", ["경고등 점등 상태 확인", "고장 코드 점검"]),
      symptomOption("센서 점검 필요", ["센서 작동 상태 확인", "센서 오류 점검"]),
    ];
  }

  if (category === "타이어 교체") {
    return [
      symptomOption("타이어 사이드월 손상", ["타이어 사이드월 손상 확인", "타이어 교체 필요"], `${tireArea.includes("사이드월") ? tireArea : `${tireArea} 사이드월`} 손상`),
      symptomOption("타이어 찢김", ["타이어 찢김 상태 확인", "타이어 교체 필요"], `${tireArea} 찢김`),
      symptomOption("타이어 펑크", ["타이어 펑크 위치 확인", "수리 또는 교체 여부 점검"], `${tireArea} 펑크`),
      symptomOption("타이어 편마모", ["타이어 편마모 상태 확인", "타이어 교체 및 얼라인먼트 점검"], `${tireArea} 편마모`),
      symptomOption("타이어 마모 한계", ["타이어 잔존 트레드 확인", "타이어 교체 필요"], `${tireArea} 마모 한계`),
      symptomOption("타이어 공기압 이상", ["타이어 공기압 확인", "누기 여부 점검"], `${tireArea} 공기압 이상`),
    ];
  }

  if (category === "휠 복원") {
    const wheelArea = area.includes("휠") ? area : "휠";
    return [
      symptomOption("휠 스크래치", ["휠 스크래치 범위 확인", "휠 복원 작업 검토"], `${wheelArea} 스크래치`),
      symptomOption("휠 림 손상", ["휠 림 손상 확인", "휠 복원 가능 여부 점검"], `${wheelArea} 림 손상`),
      symptomOption("휠 찍힘", ["휠 찍힘 상태 확인", "휠 복원 작업 검토"], `${wheelArea} 찍힘`),
      symptomOption("휠 부식", ["휠 부식 범위 확인", "휠 복원 작업 검토"], `${wheelArea} 부식`),
    ];
  }

  if (category === "덴트") {
    return [
      symptomOption("도어 눌림", ["도어 눌림 범위 확인", "덴트 복원 가능 여부 점검"], `${area.includes("도어") ? area : "도어"} 눌림`),
      symptomOption("트렁크 리드 눌림", ["트렁크 리드 눌림 확인", "덴트 복원 가능 여부 점검"]),
      symptomOption("보닛 눌림", ["보닛 눌림 확인", "덴트 복원 가능 여부 점검"]),
      symptomOption("휀더 눌림", ["휀더 눌림 확인", "덴트 복원 가능 여부 점검"]),
      symptomOption("외판 찍힘", ["외판 찍힘 범위 확인", "덴트 복원 가능 여부 점검"]),
    ];
  }

  if (category === "판금/색") {
    return [
      symptomOption("범퍼 손상", ["범퍼 손상 범위 확인", "판금 및 도장 작업 검토"]),
      symptomOption("도어 손상", ["도어 손상 범위 확인", "판금 및 도장 작업 검토"], `${area.includes("도어") ? area : "도어"} 손상`),
      symptomOption("휀더 손상", ["휀더 손상 범위 확인", "판금 및 도장 작업 검토"]),
      symptomOption("트렁크 리드 손상", ["트렁크 리드 손상 확인", "판금 및 도장 작업 검토"]),
      symptomOption("도장 까짐", ["도장 까짐 범위 확인", "도장 보수 작업 검토"], `${area || "외판"} 도장 까짐`),
      symptomOption("외판 스크래치", ["스크래치 깊이 확인", "판금 또는 도장 작업 검토"], `${area || "외판"} 스크래치`),
    ];
  }

  if (category === "실내크리닝") {
    return [
      symptomOption("실내 오염", ["실내 오염 범위 확인", "실내크리닝 필요"]),
      symptomOption("매트 오염", ["매트 오염 상태 확인", "매트 클리닝 또는 교체 검토"]),
      symptomOption("곰팡이성 오염", ["곰팡이성 오염 범위 확인", "살균 및 실내크리닝 필요"]),
      symptomOption("악취", ["실내 악취 확인", "탈취 및 실내크리닝 필요"]),
      symptomOption("시트 오염", ["시트 오염 범위 확인", "시트 클리닝 필요"]),
      symptomOption("트렁크 오염", ["트렁크 오염 범위 확인", "트렁크 클리닝 필요"]),
    ];
  }

  if (category === "실내 복원") {
    return [
      symptomOption("시트 손상", ["시트 손상 범위 확인", "시트 복원 작업 검토"]),
      symptomOption("내장재 손상", ["내장재 손상 확인", "실내 복원 작업 검토"]),
      symptomOption("천장 손상", ["천장 손상 범위 확인", "천장 복원 작업 검토"]),
      symptomOption("트림 손상", ["트림 손상 확인", "트림 복원 또는 교체 검토"]),
    ];
  }

  if (category === "유리 교체" || category === "유리 복원") {
    return [
      symptomOption("전면유리 크랙", ["전면유리 크랙 범위 확인", `${category} 필요 여부 점검`]),
      symptomOption("유리 돌빵", ["유리 돌빵 크기 확인", `${category} 가능 여부 점검`]),
      symptomOption("유리 스크래치", ["유리 스크래치 범위 확인", `${category} 가능 여부 점검`]),
      symptomOption("유리 파손", ["유리 파손 범위 확인", "유리 교체 필요"]),
    ];
  }

  if (category === "라이트 복원") {
    return [
      symptomOption("헤드램프 백화", ["헤드램프 백화 상태 확인", "라이트 복원 작업 검토"]),
      symptomOption("헤드램프 습기", ["헤드램프 습기 유입 확인", "밀폐 상태 점검"]),
      symptomOption("테일램프 파손", ["테일램프 파손 범위 확인", "복원 또는 교체 필요 여부 점검"]),
      symptomOption("라이트 작동 불량", ["라이트 작동 상태 확인", "전구 및 전장 상태 점검"]),
    ];
  }

  return [];
}

function findDefaultSymptom(options: SymptomOption[], context: string) {
  const matchers: { keywords: string[]; label: string }[] = [
    { keywords: ["냉기", "시원하지", "냉방"], label: "에어컨 냉기 부족" },
    { keywords: ["바람 약", "송풍량", "송풍 약"], label: "송풍 바람 약함" },
    { keywords: ["블로우", "모터 소음"], label: "블로우모터 소음" },
    { keywords: ["공조 패널", "공조패널"], label: "공조 패널 작동 불량" },
    { keywords: ["히터"], label: "히터 불량" },
    { keywords: ["주차센서"], label: "주차센서 작동 불량" },
    { keywords: ["전방 센서"], label: "전방 센서 불량" },
    { keywords: ["후방 센서"], label: "후방 센서 불량" },
    { keywords: ["후방카메라", "카메라"], label: "후방카메라 불량" },
    { keywords: ["경고등"], label: "경고등 점등" },
    { keywords: ["사이드월", "뜯김"], label: "타이어 사이드월 손상" },
    { keywords: ["찢김"], label: "타이어 찢김" },
    { keywords: ["펑크"], label: "타이어 펑크" },
    { keywords: ["편마모"], label: "타이어 편마모" },
    { keywords: ["공기압"], label: "타이어 공기압 이상" },
    { keywords: ["림"], label: "휠 림 손상" },
    { keywords: ["휠", "찍힘"], label: "휠 찍힘" },
    { keywords: ["휠", "부식"], label: "휠 부식" },
    { keywords: ["휠", "스크래치"], label: "휠 스크래치" },
    { keywords: ["트렁크 리드", "눌림"], label: "트렁크 리드 눌림" },
    { keywords: ["보닛", "눌림"], label: "보닛 눌림" },
    { keywords: ["휀더", "눌림"], label: "휀더 눌림" },
    { keywords: ["도어", "눌림"], label: "도어 눌림" },
    { keywords: ["범퍼"], label: "범퍼 손상" },
    { keywords: ["트렁크 리드"], label: "트렁크 리드 손상" },
    { keywords: ["휀더"], label: "휀더 손상" },
    { keywords: ["도어"], label: "도어 손상" },
    { keywords: ["도장", "까짐"], label: "도장 까짐" },
    { keywords: ["스크래치"], label: "외판 스크래치" },
    { keywords: ["곰팡이"], label: "곰팡이성 오염" },
    { keywords: ["악취", "냄새"], label: "악취" },
    { keywords: ["매트"], label: "매트 오염" },
    { keywords: ["시트", "오염"], label: "시트 오염" },
    { keywords: ["트렁크", "오염"], label: "트렁크 오염" },
    { keywords: ["시트", "손상"], label: "시트 손상" },
    { keywords: ["내장재"], label: "내장재 손상" },
    { keywords: ["천장"], label: "천장 손상" },
    { keywords: ["트림"], label: "트림 손상" },
    { keywords: ["전면유리", "크랙"], label: "전면유리 크랙" },
    { keywords: ["돌빵"], label: "유리 돌빵" },
    { keywords: ["유리", "스크래치"], label: "유리 스크래치" },
    { keywords: ["유리", "파손"], label: "유리 파손" },
    { keywords: ["백화"], label: "헤드램프 백화" },
    { keywords: ["습기"], label: "헤드램프 습기" },
    { keywords: ["테일램프", "파손"], label: "테일램프 파손" },
    { keywords: ["라이트", "불량"], label: "라이트 작동 불량" },
  ];
  const matchedLabel = matchers.find(
    ({ keywords, label }) =>
      keywords.every((keyword) => context.includes(keyword)) &&
      options.some((option) => option.label === label),
  )?.label;
  return options.find((option) => option.label === matchedLabel) ?? options[0];
}

function recommendation(category: string, tasks: string[], keyword: string, sourceContext = ""): Recommendation {
  const context = `${sourceContext} ${keyword} ${tasks.join(" ")}`;
  const symptomOptions = getSymptomOptions(category, context);
  const defaultSymptom = findDefaultSymptom(symptomOptions, context);
  return {
    id: createId(),
    category,
    tasks: defaultSymptom?.tasks ?? tasks.slice(0, 3),
    keyword: defaultSymptom?.keyword ?? keyword,
    selected: true,
    symptomOptions,
    selectedSymptom: defaultSymptom?.label ?? "",
    customSymptom: false,
  };
}

function hydrateRecommendation(item: Recommendation): Recommendation {
  const symptomOptions = item.symptomOptions?.length
    ? item.symptomOptions
    : getSymptomOptions(item.category, `${item.keyword} ${item.tasks.join(" ")}`);
  const selectedSymptom =
    item.selectedSymptom ||
    symptomOptions.find((option) => option.keyword === item.keyword)?.label ||
    findDefaultSymptom(symptomOptions, `${item.keyword} ${item.tasks.join(" ")}`)?.label ||
    "";
  return {
    ...item,
    tasks: item.tasks.slice(0, 3),
    symptomOptions,
    selectedSymptom,
    customSymptom: item.customSymptom ?? false,
  };
}

function areaFromProblem(problem: string) {
  const patterns = [
    /((?:운전석|조수석)\s*(?:앞|뒤)?\s*(?:타이어|휠|도어|매트|안전벨트)(?:\s*사이드월)?)/,
    /(트렁크\s*리드|보닛|본넷|범퍼|휀더|앞\s*도어|뒤\s*도어)/,
    /(드레인\s*볼트|언더커버|하부)/,
    /(주차센서|후방카메라|에어컨|히터|공조장치)/,
    /(전면유리|유리|헤드램프|테일램프|안개등)/,
    /(시트|내장재|천장|트림|매트|안전벨트|번호판|배터리)/,
  ];
  return patterns.map((pattern) => problem.match(pattern)?.[1]).find(Boolean)?.replace(/\s+/g, " ").trim() ?? "";
}

function buildRecommendations(problemText: string) {
  const sourceLines = problemText
    .split(/\r?\n/)
    .map(normalizeFieldTerms)
    .filter(Boolean);
  const results: Recommendation[] = [];

  for (const problem of sourceLines) {
    const area = areaFromProblem(problem);
    const has = (...keywords: string[]) => keywords.some((keyword) => problem.includes(keyword));

    if (has("에어컨", "히터", "공조")) {
      const equipment = has("에어컨") ? "에어컨" : has("히터") ? "히터" : "공조장치";
      results.push(recommendation("기능 정비", [`${equipment} 작동 상태 확인`, "공조장치 점검 필요"], `${equipment} 작동 불량`, problem));
    }

    if (has("주차센서", "센서", "경고등", "후방카메라", "카메라")) {
      const equipment = has("주차센서") ? "주차센서" : has("후방카메라", "카메라") ? "후방카메라" : has("경고등") ? "경고등" : "센서";
      results.push(recommendation("기능 정비", [`${equipment} 작동 불량 확인`, `${equipment} 점검 필요`], `${equipment} 불량`, problem));
    }

    if (has("타이어", "사이드월", "펑크", "편마모", "뜯김", "찢김")) {
      const location = area || (has("사이드월") ? "타이어 사이드월" : "타이어");
      results.push(recommendation("타이어 교체", [`${location} 손상 확인`, "타이어 교체 필요 여부 점검"], `${location} 손상`, problem));
    }

    if (has("휠", "림", "휠스크래치", "휠 긁힘")) {
      const location = area || "휠";
      results.push(recommendation("휠 복원", [`${location} 손상 확인`, "휠 복원 필요"], `${location} 스크래치`, problem));
    }

    if (has("스크래치", "긁힘", "도장까짐", "칠까짐")) {
      const location = area || "외판";
      results.push(recommendation("판금/색", [`${location} 도장 손상 확인`, "도장 보수 범위 확인"], `${location} 스크래치`, problem));
      results.push(recommendation("광택", [`${location} 스크래치 제거 가능 여부 확인`, "광택 작업 검토"], `${location} 스크래치 광택 검토`, problem));
    }

    if (has("눌림", "찌그러짐", "찍힘", "덴트")) {
      const location = area || "외판";
      results.push(recommendation("덴트", [`${location} 눌림 확인`, "덴트 복원 가능 여부 확인"], `${location} 덴트`, problem));
    }

    if (has("범퍼", "도어", "트렁크 리드", "보닛", "본넷", "휀더") && has("손상", "파손", "눌림", "찌그러짐", "찍힘", "스크래치", "긁힘")) {
      const location = area || "외판";
      results.push(recommendation("판금/색", [`${location} 손상 범위 확인`, "판금 및 도장 작업 검토"], `${location} 손상`, problem));
    }

    if (has("유리", "전면유리", "돌빵", "크랙")) {
      const location = area || "유리";
      results.push(recommendation("유리 교체", [`${location} 손상 확인`, "유리 교체 필요 여부 확인"], `${location} 손상`, problem));
      results.push(recommendation("유리 복원", [`${location} 복원 가능 여부 확인`, "크랙 확대 여부 점검"], `${location} 복원 검토`, problem));
    }

    if (has("라이트", "헤드램프", "테일램프", "안개등")) {
      const location = area || "라이트";
      results.push(recommendation("라이트 복원", [`${location} 상태 확인`, "라이트 복원 작업 검토"], `${location} 복원 필요`, problem));
    }

    if (has("시트", "내장재", "천장", "트림") && has("손상", "찢김", "오염", "파손")) {
      const location = area || "실내";
      results.push(recommendation("실내 복원", [`${location} 손상 확인`, "실내 복원 작업 검토"], `${location} 손상`, problem));
    }

    if (has("매트", "곰팡이", "오염", "악취", "냄새")) {
      const location = area || (has("매트") ? "매트" : "실내");
      const condition = has("곰팡이") ? "곰팡이성 오염" : has("악취", "냄새") ? "악취" : "오염";
      results.push(recommendation("실내크리닝", [`${location} ${condition} 확인`, "실내크리닝 필요"], `${location} ${condition}`, problem));
    }

    if (has("안전벨트", "벨트 오염", "벨트 불량")) {
      const location = area || "안전벨트";
      results.push(recommendation("벨트 교체", [`${location} 상태 확인`, "벨트 교체 필요 여부 점검"], `${location} 불량`, problem));
      if (has("오염")) {
        results.push(recommendation("실내크리닝", [`${location} 오염 확인`, "벨트 클리닝 가능 여부 확인"], `${location} 오염`, problem));
      }
    }

    if (has("번호판")) {
      results.push(recommendation("번호판 교체", ["번호판 훼손 상태 확인", "번호판 교체 필요"], "번호판 훼손", problem));
    }

    if (has("썬팅", "틴팅", "필름")) {
      const location = area || "유리";
      results.push(recommendation("틴팅", [`${location} 필름 상태 확인`, "틴팅 재시공 검토"], `${location} 틴팅 불량`, problem));
    }

    if (has("배터리", "방전")) {
      results.push(recommendation("배터리/썬/후처", ["배터리 상태 확인", "충전 및 교체 필요 여부 점검"], "배터리 방전 점검", problem));
    }

    if (has("누유", "오일", "유 발생", "드레인", "하부", "언더커버", "볼트", "토크")) {
      if (has("드레인", "볼트", "토크")) {
        results.push(recommendation("기능 정비", ["드레인 볼트 체결 상태 확인", "규정 토크 재점검"], "드레인 볼트 점검", problem));
      }
      if (has("누유", "유 발생", "하부", "언더커버")) {
        results.push(recommendation("기능 정비", ["차량 하부 누유 흔적 확인", "하부 부품 상태 점검"], "하부 누유 확인", problem));
      }
      if (has("오일", "누유", "유 발생")) {
        results.push(recommendation("기능 정비", ["엔진오일 누유 여부 확인", "엔진오일 양 및 상태 점검"], "엔진오일 누유 점검", problem));
      }
    }

    if (has("불량", "작동불량") && !results.some((item) => item.keyword.includes(area || problem))) {
      const target = area || problem.replace(/\s*(작동)?불량.*/, "").trim() || "기능";
      results.push(recommendation("기능 정비", [`${target} 작동 상태 확인`, `${target} 점검 필요`], `${target} 불량`, problem));
    }
  }

  const unique = results.filter(
    (item, index, items) =>
      items.findIndex((candidate) => candidate.category === item.category && candidate.keyword === item.keyword) === index,
  );

  return unique.length
    ? unique
    : [recommendation("기능 정비", ["원문 특이사항 확인", "필요 작업 범위 점검"], normalizeFieldTerms(problemText) || "특이사항 점검 필요", problemText)];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
    </svg>
  );
}

export default function KeywordExtractor() {
  const [form, setForm] = useState<ExtractedForm>(INITIAL_FORM);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState("");
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as HistoryItem[];
        setHistory(
          parsed.map((item) => ({
            ...item,
            recommendations: item.recommendations.map(hydrateRecommendation),
          })),
        );
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history, isLoaded]);

  useEffect(() => {
    if (!activeHistoryId) return;
    setHistory((current) =>
      current.map((item) =>
        item.id === activeHistoryId
          ? { ...item, form: { ...form }, recommendations: recommendations.map((entry) => ({ ...entry, tasks: [...entry.tasks] })) }
          : item,
      ),
    );
  }, [activeHistoryId, form, recommendations]);

  const selectedItems = useMemo(
    () => recommendations.filter((item) => item.selected && item.keyword.trim()),
    [recommendations],
  );

  const summaryText = useMemo(
    () =>
      `[${form.vehicleNumber.trim()}] 상품화 필요 항목\n${selectedItems
        .map((item) => `- ${item.category}: ${item.keyword.trim()}`)
        .join("\n")}`,
    [form.vehicleNumber, selectedItems],
  );

  function updateForm<K extends keyof ExtractedForm>(key: K, value: ExtractedForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function saveRecommendationSnapshot(nextForm: ExtractedForm, nextRecommendations: Recommendation[]) {
    const id = createId();
    const item: HistoryItem = {
      id,
      createdAt: new Date().toISOString(),
      form: { ...nextForm },
      recommendations: nextRecommendations.map((entry) => ({ ...entry, tasks: [...entry.tasks] })),
    };
    setActiveHistoryId(id);
    setHistory((current) => [item, ...current].slice(0, 30));
  }

  function analyzeSlackRaw() {
    if (!form.slackRaw.trim()) return;
    const parsed = parseSlackRaw(form.slackRaw);
    const nextForm = { ...form, ...parsed };
    const nextRecommendations = buildRecommendations(nextForm.problemText);
    setForm(nextForm);
    setRecommendations(nextRecommendations);
    saveRecommendationSnapshot(nextForm, nextRecommendations);
    setMessage("슬랙 원문을 분석해 상품화 필요 항목을 추천했습니다.");
    if (window.matchMedia("(max-width: 860px)").matches) {
      requestAnimationFrame(() =>
        document.getElementById("recommendation-section")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }

  function rebuildRecommendations() {
    if (!form.problemText.trim()) return;
    const nextRecommendations = buildRecommendations(form.problemText);
    setRecommendations(nextRecommendations);
    saveRecommendationSnapshot(form, nextRecommendations);
    setMessage("수정된 문제 내용을 기준으로 추천 결과를 다시 만들었습니다.");
    if (window.matchMedia("(max-width: 860px)").matches) {
      requestAnimationFrame(() =>
        document.getElementById("recommendation-section")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }

  function updateRecommendation(id: string, patch: Partial<Recommendation>) {
    setRecommendations((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function changeCategory(id: string, category: string) {
    setRecommendations((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const symptomOptions = getSymptomOptions(category, `${item.keyword} ${item.tasks.join(" ")}`);
        const defaultSymptom = findDefaultSymptom(symptomOptions, `${item.keyword} ${item.tasks.join(" ")}`);
        return {
          ...item,
          category,
          symptomOptions,
          selectedSymptom: defaultSymptom?.label ?? "",
          customSymptom: false,
          tasks: defaultSymptom?.tasks ?? item.tasks.slice(0, 3),
          keyword: defaultSymptom?.keyword ?? item.keyword,
        };
      }),
    );
  }

  function changeSymptom(id: string, value: string) {
    setRecommendations((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        if (value === "__custom__") {
          return {
            ...item,
            selectedSymptom: "직접 입력",
            customSymptom: true,
            tasks: ["직접 입력 증상 확인"],
            keyword: "",
          };
        }
        const selectedOption = item.symptomOptions.find((option) => option.label === value);
        if (!selectedOption) return item;
        return {
          ...item,
          selectedSymptom: selectedOption.label,
          customSymptom: false,
          tasks: selectedOption.tasks.slice(0, 3),
          keyword: selectedOption.keyword,
        };
      }),
    );
  }

  function updateTask(id: string, index: number, value: string) {
    setRecommendations((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, tasks: item.tasks.map((task, taskIndex) => (taskIndex === index ? value : task)) }
          : item,
      ),
    );
  }

  function addRecommendation() {
    setRecommendations((current) => [
      ...current,
      recommendation("기능 정비", ["점검 필요"], "직접 입력"),
    ]);
  }

  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1400);
  }

  function restoreHistory(item: HistoryItem) {
    setForm({ ...INITIAL_FORM, ...item.form });
    setRecommendations(
      item.recommendations.map((entry) =>
        hydrateRecommendation({ ...entry, tasks: [...entry.tasks] }),
      ),
    );
    setActiveHistoryId(item.id);
    setMessage("저장된 추출값과 추천 결과를 불러왔습니다.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="platform-app extractor-app">
      <datalist id="kanban-categories">
        {KANBAN_CATEGORIES.map((category) => <option key={category} value={category} />)}
      </datalist>

      <PlatformHeader />

      <div className="page-shell">
        <div className="extractor-navigation">
          <Breadcrumb
            items={[
              { label: "홈", href: "/console" },
              { label: "누락(재상품화) 가이드", href: "/remanufacturing" },
              { label: "상품화 키워드 추출" },
            ]}
          />
          <BackButton href="/remanufacturing">누락 가이드</BackButton>
        </div>
        <section className="intro extractor-title">
          <div>
            <span className="eyebrow">ON TOOL / SLACK TO KANBAN</span>
            <h2>상품화 키워드 추출</h2>
          </div>
          <p>슬랙 원문을 붙여넣으면 칸반 카테고리와 작업 키워드를 바로 추천합니다.</p>
        </section>

        <div className="dashboard-grid">
          <div className="dashboard-column left-column">
            <section className="panel slack-panel">
              <div className="panel-heading">
                <div><span className="step">01</span><h3>슬랙 원문 붙여넣기</h3></div>
              </div>
              <div className="slack-body">
                <textarea
                  className="slack-textarea"
                  aria-label="현장 슬랙 원문"
                  value={form.slackRaw}
                  onChange={(event) => updateForm("slackRaw", event.target.value)}
                  placeholder={"@lewis\n• [22사8825] 현대 싼타페 TM\n  ○ 운 뒤 타이어 사이드월 뜯김"}
                  rows={7}
                />
                <button className="analyze-button" type="button" onClick={analyzeSlackRaw} disabled={!form.slackRaw.trim()}>
                  원문 분석하기 <span aria-hidden="true">→</span>
                </button>
                {message && <p className="analysis-message">{message}</p>}
              </div>
            </section>

            <section className="panel extract-panel" id="extract-section">
              <div className="panel-heading">
                <div><span className="step">02</span><h3>추출 결과 확인·수정</h3></div>
                <span className="optional-guide">수정 가능</span>
              </div>
              <div className="extract-form">
                <div className="field-grid">
                  <label>
                    <span>차량번호</span>
                    <input value={form.vehicleNumber} onChange={(e) => updateForm("vehicleNumber", e.target.value)} placeholder="22사8825" />
                  </label>
                  <label>
                    <span>판매매니저</span>
                    <input value={form.managerName} onChange={(e) => updateForm("managerName", e.target.value)} placeholder="lewis" />
                  </label>
                </div>
                <label>
                  <span>차량명 / 차종</span>
                  <input value={form.vehicleName} onChange={(e) => updateForm("vehicleName", e.target.value)} placeholder="현대 싼타페 TM" />
                </label>
                <div className="extract-textareas">
                  <label>
                    <span>원문 문제 내용</span>
                    <textarea className="problem-textarea" value={form.problemText} onChange={(e) => updateForm("problemText", e.target.value)} placeholder="문제 내용" rows={3} />
                  </label>
                  <label>
                    <span>이동 / 처리 예정</span>
                    <textarea className="plan-textarea" value={form.handlingPlan} onChange={(e) => updateForm("handlingPlan", e.target.value)} placeholder="처리 예정 문구" rows={2} />
                  </label>
                </div>
                <div className="extract-actions">
                  <span>문제 내용 수정 시</span>
                  <button className="secondary-button" type="button" onClick={rebuildRecommendations} disabled={!form.problemText.trim()}>
                    수정 내용 반영
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="dashboard-column right-column">
            <section className="recommendation-section" id="recommendation-section">
              <div className="section-heading">
                <div><span className="step">03</span><h3>상품화 필요 추천 결과</h3></div>
                <button className="add-button" type="button" onClick={addRecommendation}>+ 항목 추가</button>
              </div>

              <div className="recommendation-scroll">
                {recommendations.length === 0 ? (
                  <div className="panel empty-state compact-empty">
                    <div className="empty-icon">K</div>
                    <strong>추천 결과가 없습니다.</strong>
                    <p>왼쪽에서 슬랙 원문을 분석해 주세요.</p>
                  </div>
                ) : (
                  <div className={`recommendation-grid ${recommendations.length === 1 ? "single-card" : ""}`}>
                    {recommendations.map((item) => (
                      <article className={`recommendation-card ${item.selected ? "is-selected" : ""}`} key={item.id}>
                        <div className="recommendation-head">
                          <label className="select-check">
                            <input type="checkbox" checked={item.selected} onChange={(e) => updateRecommendation(item.id, { selected: e.target.checked })} />
                            <span>선택</span>
                          </label>
                          <button className="icon-button" type="button" onClick={() => setRecommendations((current) => current.filter(({ id }) => id !== item.id))} aria-label="추천 항목 삭제">
                            <TrashIcon />
                          </button>
                        </div>

                        <div className="card-field-grid">
                          <label>
                            <span>카테고리</span>
                            <input list="kanban-categories" value={item.category} onChange={(e) => changeCategory(item.id, e.target.value)} />
                          </label>
                          <label className="symptom-field">
                            <span>세부 증상</span>
                            <select value={item.customSymptom ? "__custom__" : item.selectedSymptom} onChange={(e) => changeSymptom(item.id, e.target.value)}>
                              {item.symptomOptions.length === 0 && <option value="">추천 증상 없음</option>}
                              {item.symptomOptions.map((option) => <option key={option.label} value={option.label}>{option.label}</option>)}
                              <option value="__custom__">직접 입력</option>
                            </select>
                          </label>
                        </div>

                        <div className="task-section">
                          <span>추천 작업</span>
                          {item.tasks.map((task, index) => (
                            <div className="task-row" key={`${item.id}-${index}`}>
                              <span>•</span>
                              <input value={task} onChange={(e) => updateTask(item.id, index, e.target.value)} />
                              <button type="button" onClick={() => updateRecommendation(item.id, { tasks: item.tasks.filter((_, taskIndex) => taskIndex !== index) })} aria-label="추천 작업 삭제">×</button>
                            </div>
                          ))}
                          <button className="text-button" type="button" onClick={() => updateRecommendation(item.id, { tasks: [...item.tasks, "새 작업"] })}>+ 작업 추가</button>
                        </div>

                        <label>
                          <span>복붙용 키워드</span>
                          <div className="keyword-row">
                            <input value={item.keyword} onChange={(e) => updateRecommendation(item.id, { keyword: e.target.value })} />
                            <button className="copy-button" type="button" onClick={() => copyText(item.id, item.keyword)}>
                              <CopyIcon /> {copiedId === item.id ? "복사됨" : "복사"}
                            </button>
                          </div>
                        </label>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="summary-section">
              <div className="section-heading">
                <div><span className="step">04</span><h3>선택 항목 요약</h3></div>
                <span>{selectedItems.length}개 선택</span>
              </div>
              <div className="panel summary-card">
                {selectedItems.length === 0 ? (
                  <p className="summary-empty">신청할 추천 항목을 선택해 주세요.</p>
                ) : (
                  <>
                    <pre>{summaryText}</pre>
                    <button className="primary-button summary-copy" type="button" onClick={() => copyText("summary", summaryText)}>
                      {copiedId === "summary" ? "전체 복사됨" : "전체 복사"} <CopyIcon />
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
        </div>

        <details className="history-section">
          <summary className="history-summary">
            <div><span className="step">05</span><strong>최근 상품화 추천 기록</strong></div>
            <span>{history.length}건 · 펼치기</span>
          </summary>
          <div className="history-card">
            {history.length === 0 ? (
              <div className="history-empty">아직 저장된 상품화 추천 기록이 없습니다.</div>
            ) : (
              <div className="history-list">
                {history.map((item) => {
                  const selected = item.recommendations.filter((entry) => entry.selected);
                  const categories = Array.from(new Set(item.recommendations.map((entry) => entry.category))).join(", ");
                  return (
                    <article className="history-item" key={item.id}>
                      <button className="history-main" type="button" onClick={() => restoreHistory(item)}>
                        <span className="history-time">{formatDate(item.createdAt)}</span>
                        <strong>{item.form.vehicleNumber || "차량번호 없음"}</strong>
                        <span className="history-manager">{item.form.managerName || "매니저 없음"}</span>
                        <span className="history-vehicle">{item.form.vehicleName || "차량명 없음"}</span>
                        <span className="issue-badge">{categories || "추천 없음"}</span>
                        <p>{item.form.problemText || "문제 내용 없음"}</p>
                        <span className="history-selected">{selected.map((entry) => entry.keyword).join(", ") || "선택 항목 없음"}</span>
                      </button>
                      <button className="delete-button" type="button" onClick={() => {
                        setHistory((current) => current.filter(({ id }) => id !== item.id));
                        if (activeHistoryId === item.id) setActiveHistoryId("");
                      }} aria-label={`${item.form.vehicleNumber} 기록 삭제`}>
                        <TrashIcon />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </details>
      </div>

      <footer className="platform-footer">
        <strong>PDI BACKOFFICE SUPPORTER</strong>
        <span>슬랙 특이사항 기반 상품화 필요 칸반 추천</span>
      </footer>
    </main>
  );
}
