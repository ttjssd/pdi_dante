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
  dentIssueCount: number;
  maintenanceIssueCount: number;
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
  dentIssue: number;
  maintenanceIssue: number;
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
const DENT_ISSUE_COUNT_PATTERNS = [
  /요철(?:\s*(?:발생|건|차량|내역|처리|확인))?\s*[-:：]?\s*(\d+)\s*(?:건|대)?/i,
];
const MAINTENANCE_ISSUE_COUNT_PATTERNS = [
  /정비(?:\s*(?:발생|건|차량|입고|내역|처리|확인|요청))?\s*[-:：]?\s*(\d+)\s*(?:건|대)?/i,
];
const SMART_KEY_ISSUE_COUNT_PATTERNS = [
  /스마트\s*키(?:\s*(?:불량|교체|수리|재등록|재발급|이슈|발생|건|차량|내역|처리|확인))?\s*[-:：]?\s*(\d+)\s*(?:건|대)?/i,
  /스마트키(?:\s*(?:불량|교체|수리|재등록|재발급|이슈|발생|건|차량|내역|처리|확인))?\s*[-:：]?\s*(\d+)\s*(?:건|대)?/i,
];
const BATTERY_ISSUE_COUNT_PATTERNS = [
  /배터리(?:\s*(?:교체|방전|불량|발생|건|차량|내역|처리|확인))?\s*[-:：]?\s*(\d+)\s*(?:건|대)?/i,
];
const OTHER_ISSUE_COUNT_PATTERNS = [
  /기타(?:\s*(?:발생|건|차량|내역|특이사항|처리|확인))?\s*[-:：]?\s*(\d+)\s*(?:건|대)?/i,
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
    dentIssueCount: 0,
    maintenanceIssueCount: 0,
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
  draft.dentIssueCount = extractLineTotalFromPatterns(normalized, DENT_ISSUE_COUNT_PATTERNS);
  draft.maintenanceIssueCount = extractLineTotalFromPatterns(normalized, MAINTENANCE_ISSUE_COUNT_PATTERNS);
  draft.smartKeyIssueCount = extractLineTotalFromPatterns(normalized, SMART_KEY_ISSUE_COUNT_PATTERNS);
  draft.batteryIssueCount = extractLineTotalFromPatterns(normalized, BATTERY_ISSUE_COUNT_PATTERNS);
  draft.otherIssueCount = extractLineTotalFromPatterns(normalized, OTHER_ISSUE_COUNT_PATTERNS);

  let section: "management" | "people" | "other" | "" = "";
  let peopleSection: "shift" | "oldo" | "leave" | "publicLeave" | "" = "";

  for (const originalLine of lines) {
    const line = cleanLine(originalLine);
    if (!line || line.includes("일일 업무일지")) continue;
    if (
      matchesAny(line, INBOUND_COUNT_PATTERNS) ||
      matchesAny(line, CUSTOMER_INBOUND_COUNT_PATTERNS) ||
      matchesAny(line, EXPORTER_VISIT_COUNT_PATTERNS) ||
      matchesAny(line, DENT_ISSUE_COUNT_PATTERNS) ||
      matchesAny(line, MAINTENANCE_ISSUE_COUNT_PATTERNS) ||
      matchesAny(line, SMART_KEY_ISSUE_COUNT_PATTERNS) ||
      matchesAny(line, BATTERY_ISSUE_COUNT_PATTERNS) ||
      matchesAny(line, OTHER_ISSUE_COUNT_PATTERNS) ||
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

  return `[${formatReportPeriod(startDate, endDate)} 항동PDI센터]

금주 입고 완료 - ${current.inbound}대${comparisonText(current.inbound, previous.inbound, hasPrevious, "대")}

고객 인입 - ${current.customerInbound}건${comparisonText(current.customerInbound, previous.customerInbound, hasPrevious, "건")}
수출업자 방문 - ${current.exporterVisit}건${comparisonText(current.exporterVisit, previous.exporterVisit, hasPrevious, "건")}

금주 탁송인계 완료
출고완료 - ${current.handover}대${comparisonText(current.handover, previous.handover, hasPrevious, "대")}
출고 대기 차량 - (수기 입력)

금주 출고준비 완료
출고준비완료 - ${current.ready}대${comparisonText(current.ready, previous.ready, hasPrevious, "대")}

출고 중 특이사항 발생 건 - ${current.special}건${comparisonText(current.special, previous.special, hasPrevious, "건")}

요철 - ${current.dentIssue}건${comparisonText(current.dentIssue, previous.dentIssue, hasPrevious, "건")}
정비 - ${current.maintenanceIssue}건${comparisonText(current.maintenanceIssue, previous.maintenanceIssue, hasPrevious, "건")}
스마트키 불량/교체 - ${current.smartKeyIssue}건${comparisonText(current.smartKeyIssue, previous.smartKeyIssue, hasPrevious, "건")}
배터리 교체 - ${current.batteryIssue}건${comparisonText(current.batteryIssue, previous.batteryIssue, hasPrevious, "건")}
기타 - ${current.otherIssue}건${comparisonText(current.otherIssue, previous.otherIssue, hasPrevious, "건")}

루틴 업무
(수기 입력)

그 외
(수기 입력)

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
    { label: "요철", patterns: DENT_ISSUE_COUNT_PATTERNS, optional: true },
    { label: "정비", patterns: MAINTENANCE_ISSUE_COUNT_PATTERNS, optional: true },
    { label: "스마트키 불량/교체", patterns: SMART_KEY_ISSUE_COUNT_PATTERNS, optional: true },
    { label: "배터리 교체", patterns: BATTERY_ISSUE_COUNT_PATTERNS, optional: true },
    { label: "기타 특이사항", patterns: OTHER_ISSUE_COUNT_PATTERNS, optional: true },
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
  return records.reduce(
    (summary, record) => ({
      inbound: summary.inbound + (Number(record.dailyInboundCount) || 0),
      ready: summary.ready + (Number(record.dailyReadyCount) || 0),
      special: summary.special + (Number(record.specialReadyCount) || 0),
      handover: summary.handover + (Number(record.dailyTransportHandOverCount) || 0),
      customerInbound: summary.customerInbound + (Number(record.customerInboundCount) || 0),
      exporterVisit: summary.exporterVisit + (Number(record.exporterVisitCount) || 0),
      dentIssue: summary.dentIssue + (Number(record.dentIssueCount) || 0),
      maintenanceIssue: summary.maintenanceIssue + (Number(record.maintenanceIssueCount) || 0),
      smartKeyIssue: summary.smartKeyIssue + (Number(record.smartKeyIssueCount) || 0),
      batteryIssue: summary.batteryIssue + (Number(record.batteryIssueCount) || 0),
      otherIssue: summary.otherIssue + (Number(record.otherIssueCount) || 0),
    }),
    emptyTotals(),
  );
}

function comparisonText(current: number, previous: number, enabled: boolean, unit: string) {
  if (!enabled) return "";
  const difference = current - previous;
  if (difference === 0) return ` 전 주 대비 0${unit} 증가/감소 없음`;
  return ` 전 주 대비 ${Math.abs(difference)}${unit} ${difference > 0 ? "증가" : "감소"}`;
}

function addTotals(base: WeeklyReportTotals, adjustment: WeeklyManualAdjustment): WeeklyReportTotals {
  return {
    inbound: base.inbound + (Number(adjustment.inbound) || 0),
    ready: base.ready + (Number(adjustment.ready) || 0),
    special: base.special + (Number(adjustment.special) || 0),
    handover: base.handover + (Number(adjustment.handover) || 0),
    customerInbound: base.customerInbound + (Number(adjustment.customerInbound) || 0),
    exporterVisit: base.exporterVisit + (Number(adjustment.exporterVisit) || 0),
    dentIssue: base.dentIssue + (Number(adjustment.dentIssue) || 0),
    maintenanceIssue: base.maintenanceIssue + (Number(adjustment.maintenanceIssue) || 0),
    smartKeyIssue: base.smartKeyIssue + (Number(adjustment.smartKeyIssue) || 0),
    batteryIssue: base.batteryIssue + (Number(adjustment.batteryIssue) || 0),
    otherIssue: base.otherIssue + (Number(adjustment.otherIssue) || 0),
  };
}

function emptyTotals(): WeeklyReportTotals {
  return {
    inbound: 0,
    ready: 0,
    special: 0,
    handover: 0,
    customerInbound: 0,
    exporterVisit: 0,
    dentIssue: 0,
    maintenanceIssue: 0,
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
