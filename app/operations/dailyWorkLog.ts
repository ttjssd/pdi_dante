export const DAILY_WORK_LOG_STORAGE_KEY = "pdi-daily-work-log-v1";

export type DailyWorkLog = {
  id: string;
  date: string;
  weekday: string;
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

export type WeeklyManualFields = {
  inboundCount: string;
  waitingCount: string;
  potholeCount: string;
  maintenanceCount: string;
  smartKeyCount: string;
  batteryCount: string;
  otherIssueCount: string;
  otherWork: string;
  discussion: string;
  nextWeek: string;
};

export const EMPTY_WEEKLY_MANUAL_FIELDS: WeeklyManualFields = {
  inboundCount: "",
  waitingCount: "",
  potholeCount: "",
  maintenanceCount: "",
  smartKeyCount: "",
  batteryCount: "",
  otherIssueCount: "",
  otherWork: "",
  discussion: "",
  nextWeek: "",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function createEmptyDraft(date = formatDateInput(new Date())): DailyWorkLogDraft {
  const parsedDate = parseDateInput(date);
  return {
    date,
    weekday: WEEKDAYS[parsedDate.getDay()],
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

  draft.dailyReadyCount = extractCount(normalized, /차량\s*출고\s*준비\s*[-:：]?\s*(\d+)\s*대/i);
  draft.specialReadyCount = extractCount(normalized, /특이사항\s*차량\s*(?:총)?\s*(\d+)\s*대/i);
  draft.dailyTransportHandOverCount = extractCount(normalized, /금일\s*탁송\s*인계\s*[-:：]?\s*(\d+)\s*대/i);

  let section: "management" | "people" | "other" | "" = "";
  let peopleSection: "shift" | "oldo" | "leave" | "publicLeave" | "" = "";

  for (const originalLine of lines) {
    const line = cleanLine(originalLine);
    if (!line || line.includes("일일 업무일지")) continue;
    if (/차량\s*출고\s*준비|준비\s*중.*특이사항|금일\s*탁송\s*인계/.test(line)) continue;
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

export function generateDailySlackText(draft: DailyWorkLogDraft) {
  const management = draft.managementTasks.length
    ? draft.managementTasks.map((item) => `  ○ ${item}`).join("\n")
    : "  ○ 없음";
  const peopleSections = [
    formatPeopleSection("8TO16", draft.shiftWorkers),
    formatPeopleSection("올도 PDI 지원", draft.oldoSupport),
    formatPeopleSection("연차", draft.leaveList),
    formatPeopleSection("공가/휴가", draft.publicLeaveList),
  ].filter(Boolean).join("\n\n");
  const other = draft.otherNotes.length
    ? `\n\n• 기타 메모\n${draft.otherNotes.map((item) => `  ○ ${item}`).join("\n")}`
    : "";

  return `[${formatShortDate(draft.date)} (${draft.weekday}) 항동 - PDI 일일 업무일지]

• 차량출고준비 - ${draft.dailyReadyCount}대
  (준비 중, 특이사항 차량 총 ${draft.specialReadyCount}대)

• 금일 탁송 인계 - ${draft.dailyTransportHandOverCount}대
  ○ 금일 탁송 이력 항동 PDI 퀵 탁송 이력 확인 가능

• 항동 관리 업무
${management}

[항동 PDI 인사]
${peopleSections || "• 인사 기록\n  ○ 없음"}${other}`;
}

export function generateWeeklyReport(
  records: DailyWorkLog[],
  previousRecords: DailyWorkLog[],
  startDate: string,
  endDate: string,
  manual: WeeklyManualFields,
) {
  const current = summarizeRecords(records);
  const previous = summarizeRecords(previousRecords);
  const hasPrevious = previousRecords.length > 0;
  const routineTasks = unique(records.flatMap((record) => record.managementTasks));
  const leaveItems = records.flatMap((record) => [
    ...record.leaveList.map((item) => `${formatShortDate(record.date)} 연차 - ${item}`),
    ...record.publicLeaveList.map((item) => `${formatShortDate(record.date)} 공가/휴가 - ${item}`),
  ]);
  const shiftLines = records
    .filter((record) => record.shiftWorkers.length)
    .map((record) => `${formatShortDate(record.date)} (${record.weekday}) - ${record.shiftWorkers.join(", ")}`);
  const oldoLines = records
    .filter((record) => record.oldoSupport.length)
    .map((record) => `${formatShortDate(record.date)} (${record.weekday}) - ${record.oldoSupport.join(", ")}`);
  const notes = records.flatMap((record) =>
    record.otherNotes.map((note) => `${formatShortDate(record.date)} - ${note}`),
  );

  return `[${formatReportPeriod(startDate, endDate)} 항동PDI센터]

금주 입고 차량 - ${manual.inboundCount || "(수기 입력)"}

금주 탁송인계 완료
출고완료 - ${current.handover}대${comparisonText(current.handover, previous.handover, hasPrevious, "대")}
출고 대기 차량 - ${manual.waitingCount || "(수기 입력)"}

금주 출고준비 완료
출고준비완료 - ${current.ready}대${comparisonText(current.ready, previous.ready, hasPrevious, "대")}

출고 중 특이사항 발생 건 - ${current.special}대${comparisonText(current.special, previous.special, hasPrevious, "건")}
요철 - ${manual.potholeCount || "(수기 입력)"}
정비 - ${manual.maintenanceCount || "(수기 입력)"}
스마트키 불량 - ${manual.smartKeyCount || "(수기 입력)"}
배터리 교체 - ${manual.batteryCount || "(수기 입력)"}
기타 - ${manual.otherIssueCount || "(수기 입력)"}

루틴 업무
${routineTasks.length ? routineTasks.map((item) => `- ${item}`).join("\n") : "없음"}

그 외
${[notes.join("\n"), manual.otherWork].filter(Boolean).join("\n") || "(수기 입력)"}

개선사항 및 논의내용
${manual.discussion || "(수기 입력)"}

팀원 특이사항
${leaveItems.join("\n") || "없음"}

항동 - PDI 인사
8 TO 16 출근자
${shiftLines.join("\n") || "없음"}

올도 PDI 지원
${oldoLines.join("\n") || "없음"}

공가/휴가
${leaveItems.join("\n") || "없음"}

[다음 주 예정]
${manual.nextWeek || "(수기 입력)"}`;
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
      ready: summary.ready + record.dailyReadyCount,
      special: summary.special + record.specialReadyCount,
      handover: summary.handover + record.dailyTransportHandOverCount,
    }),
    { ready: 0, special: 0, handover: 0 },
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

function formatPeopleSection(title: string, values: string[]) {
  return `• ${title}\n  ○ ${values.length ? values.join(", ") : "없음"}`;
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
