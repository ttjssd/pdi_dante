export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type PdiScheduleTask = {
  id: string;
  weekday: Weekday;
  title: string;
  description: string;
  owner: string;
  enabled: boolean;
};

export type PdiScheduleCompletion = {
  taskId: string;
  date: string;
  completedAt: string;
};

export const PDI_SCHEDULE_STORAGE_KEY = "pdi-weekly-schedule-v1";

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export const DEFAULT_PDI_SCHEDULE_TASKS: PdiScheduleTask[] = [
  {
    id: "wed-heat-index-pdf-upload",
    weekday: 3,
    title: "체감온도측정기 PDF 파일 업로드",
    description: "매주 수요일 체감온도측정기 PDF 파일 업로드 여부를 확인합니다.",
    owner: "PDI",
    enabled: true,
  },
];

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function shiftDate(date: string, days: number) {
  const parsed = parseDateInput(date);
  parsed.setDate(parsed.getDate() + days);
  return formatDateInput(parsed);
}

export function getWeekRange(baseDate = new Date()) {
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const start = new Date(today);
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(today.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: formatDateInput(start), end: formatDateInput(end) };
}

export function getTaskDateForWeek(task: PdiScheduleTask, weekStart: string) {
  const start = parseDateInput(weekStart);
  const startDay = start.getDay();
  const offset = (task.weekday - startDay + 7) % 7;
  const target = new Date(start);
  target.setDate(start.getDate() + offset);
  return formatDateInput(target);
}

export function isCompleted(completions: PdiScheduleCompletion[], taskId: string, date: string) {
  return completions.some((item) => item.taskId === taskId && item.date === date);
}

export function buildScheduleShareText(tasks: PdiScheduleTask[], completions: PdiScheduleCompletion[], weekStart: string, today = formatDateInput(new Date())) {
  const enabledTasks = tasks.filter((task) => task.enabled);
  const lines = enabledTasks
    .sort((a, b) => a.weekday - b.weekday)
    .map((task) => {
      const date = getTaskDateForWeek(task, weekStart);
      const status = isCompleted(completions, task.id, date) ? "완료" : date < today ? "미완료" : "예정";
      return `${WEEKDAY_LABELS[task.weekday]} ${date} - ${task.title} (${status})`;
    });

  return `[PDI 주간 일정표]\n${lines.join("\n") || "등록된 일정 없음"}`;
}
