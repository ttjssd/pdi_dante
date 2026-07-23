export const DAILY_WORK_LOG_STORAGE_KEY = "pdi-daily-work-log-v1";
export const WEEKLY_REPORT_STORAGE_KEY = "pdi-weekly-report-v1";

export type DailyWorkLog = {
  id: string;
  date: string;
  weekday: string;
  dailyInboundCount: number;
  dailyReadyCount: number;
  specialReadyCount: number;
  dailyTransportHandOverCount: number;
  customerInboundCount: number;
  exporterVisitCount: number;
  plateReplacementIssueCount: number;
  glassReplacementIssueCount: number;
  floorMatReplacementIssueCount: number;
  tireReplacementIssueCount: number;
  dentIssueCount: number;
  maintenanceIssueCount: number;
  polishingIssueCount: number;
  bodyPaintIssueCount: number;
  lightRestorationIssueCount: number;
  glassRestorationIssueCount: number;
  interiorRestorationIssueCount: number;
  wheelRestorationIssueCount: number;
  tintingIssueCount: number;
  decalRemovalIssueCount: number;
  navigationBlackboxRearCameraIssueCount: number;
  interiorCleaningIssueCount: number;
  smartKeyIssueCount: number;
  batteryIssueCount: number;
  otherIssueCount: number;
  managementTasks: string[];
  shiftWorkers: string[];
  oldoSupport: string[];
  leaveList: string[];
  publicLeaveList: string[];
  otherNotes: string[];
  rawText: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyWorkLogDraft = Omit<DailyWorkLog, "id" | "createdAt" | "updatedAt">;

export type WeeklyRecordStatus = {
  date: string;
  weekday: string;
  records: DailyWorkLog[];
  state: "complete" | "missing" | "future" | "duplicate" | "warning" | "manual";
  warnings: string[];
  note?: string;
};

export type WeeklyReportTotals = {
  inbound: number;
  ready: number;
  special: number;
  handover: number;
  customerInbound: number;
  exporterVisit: number;
  plateReplacementIssue: number;
  glassReplacementIssue: number;
  floorMatReplacementIssue: number;
  tireReplacementIssue: number;
  dentIssue: number;
  maintenanceIssue: number;
  polishingIssue: number;
  bodyPaintIssue: number;
  lightRestorationIssue: number;
  glassRestorationIssue: number;
  interiorRestorationIssue: number;
  wheelRestorationIssue: number;
  tintingIssue: number;
  decalRemovalIssue: number;
  navigationBlackboxRearCameraIssue: number;
  interiorCleaningIssue: number;
  smartKeyIssue: number;
  batteryIssue: number;
  otherIssue: number;
};

export type WeeklyManualAdjustment = Partial<WeeklyReportTotals>;

export type WeeklyReportSnapshot = {
  id: string;
  startDate: string;
  endDate: string;
  totals: WeeklyReportTotals;
  report: string;
  createdAt: string;
  updatedAt: string;
};

type DailyIssueCountKey =
  | "plateReplacementIssueCount"
  | "glassReplacementIssueCount"
  | "floorMatReplacementIssueCount"
  | "tireReplacementIssueCount"
  | "dentIssueCount"
  | "maintenanceIssueCount"
  | "polishingIssueCount"
  | "bodyPaintIssueCount"
  | "lightRestorationIssueCount"
  | "glassRestorationIssueCount"
  | "interiorRestorationIssueCount"
  | "wheelRestorationIssueCount"
  | "tintingIssueCount"
  | "decalRemovalIssueCount"
  | "navigationBlackboxRearCameraIssueCount"
  | "interiorCleaningIssueCount"
  | "smartKeyIssueCount"
  | "batteryIssueCount"
  | "otherIssueCount";

type WeeklyIssueTotalKey =
  | "plateReplacementIssue"
  | "glassReplacementIssue"
  | "floorMatReplacementIssue"
  | "tireReplacementIssue"
  | "dentIssue"
  | "maintenanceIssue"
  | "polishingIssue"
  | "bodyPaintIssue"
  | "lightRestorationIssue"
  | "glassRestorationIssue"
  | "interiorRestorationIssue"
  | "wheelRestorationIssue"
  | "tintingIssue"
  | "decalRemovalIssue"
  | "navigationBlackboxRearCameraIssue"
  | "interiorCleaningIssue"
  | "smartKeyIssue"
  | "batteryIssue"
  | "otherIssue";

export type SpecialIssueMetric = {
  label: string;
  countKey: DailyIssueCountKey;
  totalKey: WeeklyIssueTotalKey;
  patterns: RegExp[];
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const INBOUND_COUNT_PATTERNS = [
  /(?:원창(?:\s*PDI)?).*?(?:항동(?:\s*PDI)?).*?입고(?:\s*(?:대응|진행|처리|완료|차량))?\s*[-:：]?\s*(\d+)\s*대/i,
  /(?:금일|오늘|금주)?\s*(?:차량\s*)?입고(?:\s*차량)?(?:\s*완료)?\s*[-:：]?\s*(\d+)\s*대/i,
  /(?:금일|오늘|금주)?\s*입고\s*차량(?:\s*완료)?\s*[-:：]?\s*(\d+)\s*대/i,
];
const CUSTOMER_INBOUND_COUNT_PATTERNS = [
  /고객\s*인입(?:\s*(?:건|문의|차량|대응))?\s*[-:：]?\s*(\d+)\s*(?:건|명|대)?/i,
  /인입\s*고객(?:\s*(?:건|문의|차량|대응))?\s*[-:：]?\s*(\d+)\s*(?:건|명|대)?/i,
];
const EXPORTER_VISIT_COUNT_PATTERNS = [
  /수출\s*업자\s*방문(?:\s*(?:건|대응))?\s*[-:：]?\s*(\d+)\s*(?:건|명|팀)?/i,
  /수출업자\s*방문(?:\s*(?:건|대응))?\s*[-:：]?\s*(\d+)\s*(?:건|명|팀)?/i,
];
const COUNT_SUFFIX = String.raw`(?:\s*(?:발생|건|차량|내역|처리|확인|요청|불량|교체|복원|제거|클리닝))?\s*[-:：]?\s*(\d+)\s*(?:건|대)?`;
export const SPECIAL_ISSUE_METRICS: SpecialIssueMetric[] = [
  { label: "번호판 교체", countKey: "plateReplacementIssueCount", totalKey: "plateReplacementIssue", patterns: [new RegExp(String.raw`번호판\s*교체${COUNT_SUFFIX}`, "i")] },
  { label: "유리 교체", countKey: "glassReplacementIssueCount", totalKey: "glassReplacementIssue", patterns: [new RegExp(String.raw`유리\s*교체${COUNT_SUFFIX}`, "i")] },
  { label: "발매트 교체", countKey: "floorMatReplacementIssueCount", totalKey: "floorMatReplacementIssue", patterns: [new RegExp(String.raw`발\s*매트\s*교체${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`발매트\s*교체${COUNT_SUFFIX}`, "i")] },
  { label: "타이어 교체", countKey: "tireReplacementIssueCount", totalKey: "tireReplacementIssue", patterns: [new RegExp(String.raw`타이어\s*교체${COUNT_SUFFIX}`, "i")] },
  { label: "기능 정비", countKey: "maintenanceIssueCount", totalKey: "maintenanceIssue", patterns: [new RegExp(String.raw`(?:기능\s*)?정비${COUNT_SUFFIX}`, "i")] },
  { label: "덴트/요철", countKey: "dentIssueCount", totalKey: "dentIssue", patterns: [new RegExp(String.raw`덴트${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`요철${COUNT_SUFFIX}`, "i")] },
  { label: "광택", countKey: "polishingIssueCount", totalKey: "polishingIssue", patterns: [new RegExp(String.raw`광택${COUNT_SUFFIX}`, "i")] },
  { label: "판금/도색", countKey: "bodyPaintIssueCount", totalKey: "bodyPaintIssue", patterns: [new RegExp(String.raw`판금\s*\/\s*도색${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`판금\s*도색${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`판금${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`도색${COUNT_SUFFIX}`, "i")] },
  { label: "라이트 복원", countKey: "lightRestorationIssueCount", totalKey: "lightRestorationIssue", patterns: [new RegExp(String.raw`라이트\s*복원${COUNT_SUFFIX}`, "i")] },
  { label: "유리 복원", countKey: "glassRestorationIssueCount", totalKey: "glassRestorationIssue", patterns: [new RegExp(String.raw`유리\s*복원${COUNT_SUFFIX}`, "i")] },
  { label: "실내 복원", countKey: "interiorRestorationIssueCount", totalKey: "interiorRestorationIssue", patterns: [new RegExp(String.raw`실내\s*복원${COUNT_SUFFIX}`, "i")] },
  { label: "휠 복원", countKey: "wheelRestorationIssueCount", totalKey: "wheelRestorationIssue", patterns: [new RegExp(String.raw`휠\s*복원${COUNT_SUFFIX}`, "i")] },
  { label: "틴팅", countKey: "tintingIssueCount", totalKey: "tintingIssue", patterns: [new RegExp(String.raw`틴팅${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`썬팅${COUNT_SUFFIX}`, "i")] },
  { label: "데칼 제거", countKey: "decalRemovalIssueCount", totalKey: "decalRemovalIssue", patterns: [new RegExp(String.raw`데칼\s*제거${COUNT_SUFFIX}`, "i")] },
  { label: "내비/블박/후카", countKey: "navigationBlackboxRearCameraIssueCount", totalKey: "navigationBlackboxRearCameraIssue", patterns: [new RegExp(String.raw`내비\s*\/\s*블박\s*\/\s*후카${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`네비\s*\/\s*블박\s*\/\s*후카${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`내비${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`네비${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`블박${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`후카${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`후방\s*카메라${COUNT_SUFFIX}`, "i")] },
  { label: "실내클리닝", countKey: "interiorCleaningIssueCount", totalKey: "interiorCleaningIssue", patterns: [new RegExp(String.raw`실내\s*클리닝${COUNT_SUFFIX}`, "i")] },
  { label: "스마트키 불량/교체", countKey: "smartKeyIssueCount", totalKey: "smartKeyIssue", patterns: [new RegExp(String.raw`스마트\s*키${COUNT_SUFFIX}`, "i"), new RegExp(String.raw`스마트키${COUNT_SUFFIX}`, "i")] },
  { label: "배터리 교체", countKey: "batteryIssueCount", totalKey: "batteryIssue", patterns: [new RegExp(String.raw`배터리${COUNT_SUFFIX}`, "i")] },
  { label: "기타", countKey: "otherIssueCount", totalKey: "otherIssue", patterns: [new RegExp(String.raw`기타${COUNT_SUFFIX}`, "i")] },
];

export function createEmptyDraft(date = formatDateInput(new Date())): DailyWorkLogDraft {
  const parsedDate = parseDateInput(date);
  return {
    date,
    weekday: WEEKDAYS[parsedDate.getDay()],
    dailyInboundCount: 0,
    dailyReadyCount: 0,
    specialReadyCount: 0,
    dailyTransportHandOverCount: 0,
    customerInboundCount: 0,
    exporterVisitCount: 0,
    plateReplacementIssueCount: 0,
    glassReplacementIssueCount: 0,
    floorMatReplacementIssueCount: 0,
    tireReplacementIssueCount: 0,
    dentIssueCount: 0,
    maintenanceIssueCount: 0,
    polishingIssueCount: 0,
    bodyPaintIssueCount: 0,
    lightRestorationIssueCount: 0,
    glassRestorationIssueCount: 0,
    interiorRestorationIssueCount: 0,
    wheelRestorationIssueCount: 0,
    tintingIssueCount: 0,
    decalRemovalIssueCount: 0,
    navigationBlackboxRearCameraIssueCount: 0,
    interiorCleaningIssueCount: 0,
    smartKeyIssueCount: 0,
    batteryIssueCount: 0,
    otherIssueCount: 0,
    managementTasks: [],
    shiftWorkers: [],
    oldoSupport: [],
    leaveList: [],
    publicLeaveList: [],
    otherNotes: [],
    rawText: "",
  };
}

export function parseDailyWorkLog(rawText: string, today = new Date()): DailyWorkLogDraft {
  const draft = createEmptyDraft(formatDateInput(today));
  const normalized = rawText.replace(/\r/g, "");
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const header = normalized.match(/\[(?:(\d{4})[-/.])?(\d{1,2})\/(\d{1,2})\s*\(([^)]+)\)[^\]]*일일\s*업무일지\]/i);

  if (header) {
    const year = Number(header[1] || today.getFullYear());
    const month = Number(header[2]);
    const day = Number(header[3]);
    draft.date = formatDateInput(new Date(year, month - 1, day));
    draft.weekday = header[4].trim();
  }

  draft.dailyInboundCount = extractCountFromPatterns(normalized, INBOUND_COUNT_PATTERNS);
  draft.dailyReadyCount = extractCount(normalized, /차량\s*출고\s*준비\s*[-:：]?\s*(\d+)\s*대/i);
  draft.specialReadyCount = extractCount(normalized, /특이사항\s*차량\s*(?:총)?\s*(\d+)\s*대/i);
  draft.dailyTransportHandOverCount = extractCount(normalized, /금일\s*탁송\s*인계\s*[-:：]?\s*(\d+)\s*대/i);
  draft.customerInboundCount = extractCountFromPatterns(normalized, CUSTOMER_INBOUND_COUNT_PATTERNS);
  draft.exporterVisitCount = extractCountFromPatterns(normalized, EXPORTER_VISIT_COUNT_PATTERNS);
  SPECIAL_ISSUE_METRICS.forEach((metric) => {
    draft[metric.countKey] = extractLineTotalFromPatterns(normalized, metric.patterns);
  });

  let section: "management" | "people" | "other" | "" = "";
  let peopleSection: "shift" | "oldo" | "leave" | "publicLeave" | "" = "";

  for (const originalLine of lines) {
    const line = cleanLine(originalLine);
    if (!line || line.includes("일일 업무일지")) continue;
    if (
      matchesAny(line, INBOUND_COUNT_PATTERNS) ||
      matchesAny(line, CUSTOMER_INBOUND_COUNT_PATTERNS) ||
      matchesAny(line, EXPORTER_VISIT_COUNT_PATTERNS) ||
      SPECIAL_ISSUE_METRICS.some((metric) => matchesAny(line, metric.patterns)) ||
      /차량\s*출고\s*준비|준비\s*중.*특이사항|금일\s*탁송\s*인계/.test(line)
    ) continue;
    if (/금일\s*탁송\s*이력/.test(line)) continue;

    if (/항동\s*관리\s*업무/.test(line)) {
      section = "management";
      peopleSection = "";
      continue;
    }
    if (/항동\s*PDI\s*인사/.test(line)) {
      section = "people";
      peopleSection = "";
      continue;
    }
    if (/^8\s*TO\s*16$/i.test(line.replace(/\s+/g, " "))) {
      section = "people";
      peopleSection = "shift";
      continue;
    }
    if (/올도\s*PDI\s*지원/.test(line)) {
      section = "people";
      peopleSection = "oldo";
      continue;
    }
    if (/^(연차|연차자)$/.test(line)) {
      section = "people";
      peopleSection = "leave";
      continue;
    }
    if (/^(공가|휴가|공가\s*\/\s*휴가|공가\/휴가)$/.test(line)) {
      section = "people";
      peopleSection = "publicLeave";
      continue;
    }
    if (/^(기타|기타\s*메모)$/.test(line)) {
      section = "other";
      peopleSection = "";
      continue;
    }

    if (section === "management") {
      draft.managementTasks.push(line);
    } else if (section === "people") {
      const values = splitPeople(line);
      if (peopleSection === "shift") draft.shiftWorkers.push(...values);
      if (peopleSection === "oldo") draft.oldoSupport.push(...values);
      if (peopleSection === "leave") draft.leaveList.push(...values);
      if (peopleSection === "publicLeave") draft.publicLeaveList.push(...values);
    } else if (section === "other") {
      draft.otherNotes.push(line);
    }
  }

  draft.managementTasks = unique(draft.managementTasks);
  draft.shiftWorkers = unique(draft.shiftWorkers);
  draft.oldoSupport = unique(draft.oldoSupport);
  draft.leaveList = unique(draft.leaveList);
  draft.publicLeaveList = unique(draft.publicLeaveList);
  draft.otherNotes = unique(draft.otherNotes);
  draft.rawText = rawText;
  return draft;
}

export function getMeetingPeriod(baseDate = new Date()) {
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const daysUntilThursday = (4 - end.getDay() + 7) % 7;
  end.setDate(end.getDate() + daysUntilThursday);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  return { start: formatDateInput(start), end: formatDateInput(end) };
}

export function generateWeeklyReport(
  records: DailyWorkLog[],
  previousTotals: WeeklyReportTotals | null,
  startDate: string,
  endDate: string,
  manualAdjustment: WeeklyManualAdjustment = {},
) {
  const current = addTotals(summarizeRecords(records), manualAdjustment);
  const previous = previousTotals || emptyTotals();
  const hasPrevious = Boolean(previousTotals);
  const issueLines = SPECIAL_ISSUE_METRICS
    .filter(({ totalKey }) => current[totalKey] > 0)
    .map(({ label, totalKey }) => `${label} - ${current[totalKey]}건`)
    .join("\n");
  const specialIssueBlock = current.special > 0
    ? [
        `출고 중 특이사항 발생 건 - ${current.special}건${comparisonText(current.special, previous.special, hasPrevious, "건")}`,
        issueLines,
      ].filter(Boolean).join("\n\n")
    : "";
  const otherLines = [
    current.customerInbound > 0
      ? `고객 인입 - ${current.customerInbound}건${comparisonText(current.customerInbound, previous.customerInbound, hasPrevious, "건")}`
      : "",
    current.exporterVisit > 0
      ? `수출업자 방문 - ${current.exporterVisit}건${comparisonText(current.exporterVisit, previous.exporterVisit, hasPrevious, "건")}`
      : "",
    "(수기 입력)",
  ].filter(Boolean).join("\n");

  return `[${formatReportPeriod(startDate, endDate)} 항동PDI센터]

금주 입고 완료 - ${current.inbound}대${comparisonText(current.inbound, previous.inbound, hasPrevious, "대")}

금주 탁송인계 완료
출고완료 - ${current.handover}대${comparisonText(current.handover, previous.handover, hasPrevious, "대")}
출고 대기 차량 - (수기 입력)

금주 출고준비 완료
출고준비완료 - ${current.ready}대${comparisonText(current.ready, previous.ready, hasPrevious, "대")}

${specialIssueBlock ? `${specialIssueBlock}\n` : ""}

루틴 업무
(수기 입력)

그 외
${otherLines}

개선사항 및 논의내용
(수기 입력)

팀원 특이사항
(수기 입력)

[다음 주 예정]
(수기 입력)`;
}

export function summarizeWeeklyRecords(records: DailyWorkLog[], manualAdjustment: WeeklyManualAdjustment = {}) {
  return addTotals(summarizeRecords(records), manualAdjustment);
}

export function filterRecordsByPeriod(records: DailyWorkLog[], startDate: string, endDate: string) {
  return records
    .filter((record) => record.date >= startDate && record.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function shiftDate(date: string, days: number) {
  const parsed = parseDateInput(date);
  parsed.setDate(parsed.getDate() + days);
  return formatDateInput(parsed);
}

export function buildWeeklyRecordStatuses(
  records: DailyWorkLog[],
  startDate: string,
  endDate: string,
  today = new Date(),
): WeeklyRecordStatus[] {
  const todayValue = formatDateInput(today);
  const statuses: WeeklyRecordStatus[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    const dateRecords = records.filter((record) => record.date === cursor);
    const weekday = WEEKDAYS[parseDateInput(cursor).getDay()];
    const isThursday = weekday === "목";
    const warnings = isThursday ? [] : unique(dateRecords.flatMap(getExtractionWarnings));
    let state: WeeklyRecordStatus["state"] = "complete";
    let note: string | undefined;

    if (isThursday) {
      state = "manual";
      note = "목요일 오후 회의 전 직접 확인 후 수요일까지 합계에 수기 더하기";
    } else if (dateRecords.length === 0) state = cursor > todayValue ? "future" : "missing";
    else if (dateRecords.length > 1) state = "duplicate";
    else if (warnings.length > 0) state = "warning";

    statuses.push({
      date: cursor,
      weekday,
      records: dateRecords,
      state,
      warnings,
      note,
    });
    cursor = shiftDate(cursor, 1);
  }

  return statuses;
}

export function getExtractionWarnings(record: DailyWorkLog) {
  const text = record.rawText || "";
  const isWeekend = record.weekday === "토" || record.weekday === "일";
  const checks = [
    ...(!isWeekend ? [{ label: "입고 완료", patterns: INBOUND_COUNT_PATTERNS }] : []),
    { label: "출고준비", pattern: /차량\s*출고\s*준비\s*[-:：]?\s*\d+\s*대/i },
    { label: "탁송 인계", pattern: /금일\s*탁송\s*인계\s*[-:：]?\s*\d+\s*대/i },
    { label: "특이사항", pattern: /특이사항\s*차량\s*(?:총)?\s*\d+\s*대/i },
    { label: "고객 인입", patterns: CUSTOMER_INBOUND_COUNT_PATTERNS, optional: true },
    { label: "수출업자 방문", patterns: EXPORTER_VISIT_COUNT_PATTERNS, optional: true },
    ...SPECIAL_ISSUE_METRICS.map((metric) => ({ label: metric.label, patterns: metric.patterns, optional: true })),
  ];
  return checks
    .filter((check) => !check.optional)
    .filter((check) => check.patterns ? !matchesAny(text, check.patterns) : !check.pattern?.test(text))
    .map((check) => check.label);
}

export function splitLines(value: string) {
  return unique(value.split("\n").map((item) => cleanLine(item)).filter(Boolean));
}

export function joinLines(value: string[]) {
  return value.join("\n");
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function summarizeRecords(records: DailyWorkLog[]): WeeklyReportTotals {
  return records.reduce((summary, record) => {
    summary.inbound += Number(record.dailyInboundCount) || 0;
    summary.ready += Number(record.dailyReadyCount) || 0;
    summary.special += Number(record.specialReadyCount) || 0;
    summary.handover += Number(record.dailyTransportHandOverCount) || 0;
    summary.customerInbound += Number(record.customerInboundCount) || 0;
    summary.exporterVisit += Number(record.exporterVisitCount) || 0;
    SPECIAL_ISSUE_METRICS.forEach((metric) => {
      summary[metric.totalKey] += Number(record[metric.countKey]) || 0;
    });
    return summary;
  }, emptyTotals());
}

function comparisonText(current: number, previous: number, enabled: boolean, unit: string) {
  if (!enabled) return "";
  const difference = current - previous;
  if (difference === 0) return ` 전 주 대비 0${unit} 증가/감소 없음`;
  return ` 전 주 대비 ${Math.abs(difference)}${unit} ${difference > 0 ? "증가" : "감소"}`;
}

function addTotals(base: WeeklyReportTotals, adjustment: WeeklyManualAdjustment): WeeklyReportTotals {
  const totals: WeeklyReportTotals = {
    inbound: base.inbound + (Number(adjustment.inbound) || 0),
    ready: base.ready + (Number(adjustment.ready) || 0),
    special: base.special + (Number(adjustment.special) || 0),
    handover: base.handover + (Number(adjustment.handover) || 0),
    customerInbound: base.customerInbound + (Number(adjustment.customerInbound) || 0),
    exporterVisit: base.exporterVisit + (Number(adjustment.exporterVisit) || 0),
    plateReplacementIssue: 0,
    glassReplacementIssue: 0,
    floorMatReplacementIssue: 0,
    tireReplacementIssue: 0,
    dentIssue: 0,
    maintenanceIssue: 0,
    polishingIssue: 0,
    bodyPaintIssue: 0,
    lightRestorationIssue: 0,
    glassRestorationIssue: 0,
    interiorRestorationIssue: 0,
    wheelRestorationIssue: 0,
    tintingIssue: 0,
    decalRemovalIssue: 0,
    navigationBlackboxRearCameraIssue: 0,
    interiorCleaningIssue: 0,
    smartKeyIssue: 0,
    batteryIssue: 0,
    otherIssue: 0,
  };
  SPECIAL_ISSUE_METRICS.forEach((metric) => {
    totals[metric.totalKey] = (Number(base[metric.totalKey]) || 0) + (Number(adjustment[metric.totalKey]) || 0);
  });
  return totals;
}

function emptyTotals(): WeeklyReportTotals {
  return {
    inbound: 0,
    ready: 0,
    special: 0,
    handover: 0,
    customerInbound: 0,
    exporterVisit: 0,
    plateReplacementIssue: 0,
    glassReplacementIssue: 0,
    floorMatReplacementIssue: 0,
    tireReplacementIssue: 0,
    dentIssue: 0,
    maintenanceIssue: 0,
    polishingIssue: 0,
    bodyPaintIssue: 0,
    lightRestorationIssue: 0,
    glassRestorationIssue: 0,
    interiorRestorationIssue: 0,
    wheelRestorationIssue: 0,
    tintingIssue: 0,
    decalRemovalIssue: 0,
    navigationBlackboxRearCameraIssue: 0,
    interiorCleaningIssue: 0,
    smartKeyIssue: 0,
    batteryIssue: 0,
    otherIssue: 0,
  };
}

function extractCount(text: string, pattern: RegExp) {
  return Number(text.match(pattern)?.[1] || 0);
}

function extractCountFromPatterns(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const value = extractCount(text, pattern);
    if (value > 0) return value;
  }
  return 0;
}

function extractLineTotalFromPatterns(text: string, patterns: RegExp[]) {
  return text
    .split("\n")
    .map((line) => {
      for (const pattern of patterns) {
        const value = extractCount(line, pattern);
        if (value > 0) return value;
      }
      return 0;
    })
    .reduce((total, value) => total + value, 0);
}

function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function cleanLine(value: string) {
  return value.replace(/^[•○■●▪▫◆◇▶▷\-–—]+\s*/, "").trim();
}

function splitPeople(value: string) {
  return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-").map(Number);
  return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
}

function formatReportPeriod(startDate: string, endDate: string) {
  const [year, startMonth, startDay] = startDate.split("-").map(Number);
  const [, endMonth, endDay] = endDate.split("-").map(Number);
  return `${year}-${startMonth}/${String(startDay).padStart(2, "0")} ~ ${endMonth}/${String(endDay).padStart(2, "0")}`;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
