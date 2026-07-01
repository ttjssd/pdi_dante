"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildScheduleShareText,
  DEFAULT_PDI_SCHEDULE_TASKS,
  formatDateInput,
  getTaskDateForWeek,
  getWeekRange,
  isCompleted,
  PDI_SCHEDULE_STORAGE_KEY,
  shiftDate,
  WEEKDAY_LABELS,
  type PdiScheduleCompletion,
  type PdiScheduleTask,
  type Weekday,
} from "./pdiSchedule";

type StoredSchedule = {
  tasks: PdiScheduleTask[];
  completions: PdiScheduleCompletion[];
};

const emptyTask = (): PdiScheduleTask => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  weekday: 3,
  title: "",
  description: "",
  owner: "PDI",
  enabled: true,
});

export default function PdiScheduleClient() {
  const today = formatDateInput(new Date());
  const [loaded, setLoaded] = useState(false);
  const [weekStart, setWeekStart] = useState(() => getWeekRange().start);
  const [tasks, setTasks] = useState<PdiScheduleTask[]>(DEFAULT_PDI_SCHEDULE_TASKS);
  const [completions, setCompletions] = useState<PdiScheduleCompletion[]>([]);
  const [draft, setDraft] = useState<PdiScheduleTask>(() => emptyTask());
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PDI_SCHEDULE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<StoredSchedule>;
        if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) setTasks(normalizeTasks(parsed.tasks));
        if (Array.isArray(parsed.completions)) setCompletions(normalizeCompletions(parsed.completions));
      }
    } catch {
      localStorage.removeItem(PDI_SCHEDULE_STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(PDI_SCHEDULE_STORAGE_KEY, JSON.stringify({ tasks, completions }));
  }, [completions, loaded, tasks]);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => shiftDate(weekStart, index)), [weekStart]);
  const activeTasks = useMemo(() => tasks.filter((task) => task.enabled), [tasks]);
  const todayItems = useMemo(
    () => activeTasks.filter((task) => getTaskDateForWeek(task, weekStart) === today),
    [activeTasks, today, weekStart],
  );
  const missedItems = useMemo(
    () => activeTasks.filter((task) => {
      const dueDate = getTaskDateForWeek(task, weekStart);
      return dueDate < today && !isCompleted(completions, task.id, dueDate);
    }),
    [activeTasks, completions, today, weekStart],
  );
  const shareText = useMemo(() => buildScheduleShareText(tasks, completions, weekStart, today), [completions, tasks, today, weekStart]);

  function toggleComplete(task: PdiScheduleTask) {
    const dueDate = getTaskDateForWeek(task, weekStart);
    if (isCompleted(completions, task.id, dueDate)) {
      setCompletions((current) => current.filter((item) => !(item.taskId === task.id && item.date === dueDate)));
      setMessage(`${task.title} 완료 체크를 해제했습니다.`);
      return;
    }
    setCompletions((current) => [...current, { taskId: task.id, date: dueDate, completedAt: new Date().toISOString() }]);
    setMessage(`${task.title} 완료 처리했습니다.`);
  }

  function saveDraft() {
    const title = draft.title.trim();
    if (!title) {
      setMessage("일정명을 입력해 주세요.");
      return;
    }
    setTasks((current) => {
      const exists = current.some((task) => task.id === draft.id);
      const next = { ...draft, title, description: draft.description.trim(), owner: draft.owner.trim() || "PDI" };
      return exists ? current.map((task) => task.id === draft.id ? next : task) : [...current, next];
    });
    setDraft(emptyTask());
    setMessage("일정을 저장했습니다.");
  }

  function editTask(task: PdiScheduleTask) {
    setDraft(task);
    setMessage(`${task.title} 일정을 수정합니다.`);
  }

  function deleteTask(id: string) {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    setTasks((current) => current.filter((task) => task.id !== id));
    setCompletions((current) => current.filter((item) => item.taskId !== id));
    if (draft.id === id) setDraft(emptyTask());
    setMessage("일정을 삭제했습니다.");
  }

  async function copyShareText() {
    await navigator.clipboard.writeText(shareText);
    setMessage("주간 일정표를 복사했습니다.");
  }

  return (
    <div className="pdi-schedule-workspace">
      <section className="inspection-card pdi-schedule-hero-card">
        <div>
          <span className="platform-kicker">TODAY CHECK</span>
          <h2>{formatShortDate(today)} 오늘 일정</h2>
          <p>{todayItems.length > 0 ? `${todayItems.length}개 일정이 있습니다.` : "오늘 등록된 일정은 없습니다."}</p>
        </div>
        <button className="platform-button button-outline" type="button" onClick={copyShareText}>주간 일정 복사</button>
      </section>

      {missedItems.length > 0 && (
        <section className="inspection-card pdi-schedule-alert">
          <strong>놓친 일정 {missedItems.length}건</strong>
          <div>
            {missedItems.map((task) => (
              <button type="button" key={task.id} onClick={() => toggleComplete(task)}>
                {WEEKDAY_LABELS[task.weekday]} - {task.title} 완료 처리
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="inspection-card pdi-schedule-board">
        <div className="transport-panel-heading">
          <div><span>01</span><h2>이번 주 일정표</h2></div>
          <div className="pdi-week-controls">
            <button type="button" onClick={() => setWeekStart(shiftDate(weekStart, -7))}>이전 주</button>
            <button type="button" onClick={() => setWeekStart(getWeekRange().start)}>이번 주</button>
            <button type="button" onClick={() => setWeekStart(shiftDate(weekStart, 7))}>다음 주</button>
          </div>
        </div>
        <div className="pdi-week-grid">
          {weekDates.map((date) => {
            const weekday = new Date(date).getDay() as Weekday;
            const dayTasks = activeTasks.filter((task) => task.weekday === weekday);
            return (
              <article className={date === today ? "is-today" : ""} key={date}>
                <div>
                  <span>{WEEKDAY_LABELS[weekday]}</span>
                  <strong>{formatShortDate(date)}</strong>
                </div>
                {dayTasks.map((task) => {
                  const done = isCompleted(completions, task.id, date);
                  const overdue = date < today && !done;
                  return (
                    <section className={done ? "is-done" : overdue ? "is-overdue" : ""} key={task.id}>
                      <button type="button" onClick={() => toggleComplete(task)}>{done ? "완료" : "체크"}</button>
                      <div>
                        <strong>{task.title}</strong>
                        {task.description && <p>{task.description}</p>}
                        <small>{task.owner}</small>
                      </div>
                    </section>
                  );
                })}
                {dayTasks.length === 0 && <p className="pdi-schedule-empty">등록된 일정 없음</p>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="inspection-card pdi-schedule-editor">
        <div className="transport-panel-heading">
          <div><span>02</span><h2>일정 추가 / 수정</h2></div>
          <button className="transport-copy" type="button" onClick={() => setDraft(emptyTask())}>새 일정</button>
        </div>
        <div className="pdi-schedule-form">
          <label><span>요일</span><select value={draft.weekday} onChange={(event) => setDraft((current) => ({ ...current, weekday: Number(event.target.value) as Weekday }))}>{WEEKDAY_LABELS.map((label, index) => <option value={index} key={label}>{label}요일</option>)}</select></label>
          <label><span>일정명</span><input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="체감온도측정기 PDF 파일 업로드" /></label>
          <label><span>담당 / 위치</span><input value={draft.owner} onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))} placeholder="PDI" /></label>
          <label className="pdi-schedule-wide"><span>메모</span><input value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="매주 수요일 업로드 확인" /></label>
        </div>
        <div className="daily-log-actions">
          <button className="platform-button button-primary" type="button" onClick={saveDraft}>일정 저장</button>
        </div>
      </section>

      <section className="inspection-card pdi-schedule-list">
        <div className="transport-panel-heading">
          <div><span>03</span><h2>등록된 반복 일정</h2></div>
        </div>
        <div>
          {tasks.map((task) => (
            <article key={task.id}>
              <span>{WEEKDAY_LABELS[task.weekday]}</span>
              <div>
                <strong>{task.title}</strong>
                <small>{task.description || "메모 없음"}</small>
              </div>
              <button type="button" onClick={() => editTask(task)}>수정</button>
              <button type="button" onClick={() => deleteTask(task.id)}>삭제</button>
            </article>
          ))}
        </div>
      </section>

      {message && <div className="daily-log-toast" role="status">{message}</div>}
    </div>
  );
}

function normalizeTasks(value: unknown[]): PdiScheduleTask[] {
  return value
    .filter((item): item is Partial<PdiScheduleTask> => Boolean(item && typeof item === "object"))
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `${Date.now()}-${index}`,
      weekday: normalizeWeekday(item.weekday),
      title: typeof item.title === "string" ? item.title : "",
      description: typeof item.description === "string" ? item.description : "",
      owner: typeof item.owner === "string" ? item.owner : "PDI",
      enabled: typeof item.enabled === "boolean" ? item.enabled : true,
    }))
    .filter((task) => task.title.trim());
}

function normalizeCompletions(value: unknown[]): PdiScheduleCompletion[] {
  return value
    .filter((item): item is Partial<PdiScheduleCompletion> => Boolean(item && typeof item === "object"))
    .filter((item) => typeof item.taskId === "string" && typeof item.date === "string")
    .map((item) => ({
      taskId: item.taskId || "",
      date: item.date || "",
      completedAt: typeof item.completedAt === "string" ? item.completedAt : new Date().toISOString(),
    }));
}

function normalizeWeekday(value: unknown): Weekday {
  const numberValue = Number(value);
  return numberValue >= 0 && numberValue <= 6 ? numberValue as Weekday : 3;
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}
