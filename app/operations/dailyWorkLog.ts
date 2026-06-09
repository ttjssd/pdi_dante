export const DAILY_WORK_LOG_STORAGE_KEY = "pdi-daily-work-log-v1";

export type DailyWorkLog = {
  id: string;
  date: string;
  weekday: string;
  dailyInboundCount: number;
  dailyReadyCount: number;
  specialReadyCount: number;
  dailyTransportHandOverCount: number;
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
  state: "complete" | "missing" | "future" | "duplicate" | "warning";
  warnings: string[];
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function createEmptyDraft(date = formatDateInput(new Date())): DailyWorkLogDraft {
  const parsedDate = parseDateInput(date);
  return {
    date,
    weekday: WEEKDAYS[parsedDate.getDay()],
    dailyInboundCount: 0,
    dailyReadyCount: 0,
    specialReadyCount: 0,
    dailyTransportHandOverCount: 0,
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

  draft.dailyInboundCount = extractCount(
    normalized,
    /(?:금일\s*)?(?:차량\s*)?입고(?:\s*완료)?\s*[-:：]?\s*(\d+)\s*대/i,
  );
  draft.dailyReadyCount = extractCount(normalized, /차량\s*출고\s*준비\s*[-:：]?\s*(\d+)\s*대/i);
  draft.specialReadyCount = extractCount(normalized, /특이사항\s*차량\s*(?:총)?\s*(\d+)\s*대/i);
  draft.dailyTransportHandOverCount = extractCount(normalized, /금일\s*탁송\s*인계\s*[-:：]?\s*(\d+)\s*대/i);

  let section: "management" | "people" | "other" | "" = "";
  let peopleSection: "shift" | "oldo" | "leave" | "publicLeave" | "" = "";

  for (const originalLine of lines) {
    const line = cleanLine(originalLine);
    if (!line || line.includes("일일 업무일지")) continue;
    if (/입고(?:\s*완료)?.*\d+\s*대|차량\s*출고\s*준비|준비\s*중.*특이사항|금일\s*탁송\s*인계/.test(line)) continue;
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
  previousRecords: DailyWorkLog[],
  startDate: string,
  endDate: string,
) {
  const current = summarizeRecords(records);
  const previous = summarizeRecords(previousRecords);
  const hasPrevious = previousRecords.length > 0;

  return `[${formatReportPeriod(startDate, endDate)} 항동PDI센터]

금주 입고 완료 - ${current.inbound}대${comparisonText(current.inbound, previous.inbound, hasPrevious, "대")}

금주 탁송인계 완료
출고완료 - ${current.handover}대${comparisonText(current.handover, previous.handover, hasPrevious, "대")}
출고 대기 차량 - (수기 입력)

금주 출고준비 완료
출고준비완료 - ${current.ready}대${comparisonText(current.ready, previous.ready, hasPrevious, "대")}

출고 중 특이사항 발생 건 - ${current.special}대${comparisonText(current.special, previous.special, hasPrevious, "건")}

요철 - (수기 입력)
정비 - (수기 입력)
스마트키 불량 - (수기 입력)
배터리 교체 - (수기 입력)
기타 - (수기 입력)

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
    const warnings = unique(dateRecords.flatMap(getExtractionWarnings));
    let state: WeeklyRecordStatus["state"] = "complete";

    if (dateRecords.length === 0) state = cursor > todayValue ? "future" : "missing";
    else if (dateRecords.length > 1) state = "duplicate";
    else if (warnings.length > 0) state = "warning";

    statuses.push({
      date: cursor,
      weekday: WEEKDAYS[parseDateInput(cursor).getDay()],
      records: dateRecords,
      state,
      warnings,
    });
    cursor = shiftDate(cursor, 1);
  }

  return statuses;
}

export function getExtractionWarnings(record: DailyWorkLog) {
  const text = record.rawText || "";
  const checks = [
    { label: "입고 완료", pattern: /(?:금일\s*)?(?:차량\s*)?입고(?:\s*완료)?\s*[-:：]?\s*\d+\s*대/i },
    { label: "출고준비", pattern: /차량\s*출고\s*준비\s*[-:：]?\s*\d+\s*대/i },
    { label: "탁송 인계", pattern: /금일\s*탁송\s*인계\s*[-:：]?\s*\d+\s*대/i },
    { label: "특이사항", pattern: /특이사항\s*차량\s*(?:총)?\s*\d+\s*대/i },
  ];
  return checks.filter((check) => !check.pattern.test(text)).map((check) => check.label);
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

function summarizeRecords(records: DailyWorkLog[]) {
  return records.reduce(
    (summary, record) => ({
      inbound: summary.inbound + (Number(record.dailyInboundCount) || 0),
      ready: summary.ready + record.dailyReadyCount,
      special: summary.special + record.specialReadyCount,
      handover: summary.handover + record.dailyTransportHandOverCount,
    }),
    { inbound: 0, ready: 0, special: 0, handover: 0 },
  );
}

function comparisonText(current: number, previous: number, enabled: boolean, unit: string) {
  if (!enabled) return "";
  const difference = current - previous;
  if (difference === 0) return " 전 주와 동일";
  return ` 전 주 대비 ${Math.abs(difference)}${unit} ${difference > 0 ? "상승" : "감소"}`;
}

function extractCount(text: string, pattern: RegExp) {
  return Number(text.match(pattern)?.[1] || 0);
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
