"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
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
} from "../hangdong-guide/pdi-schedule/pdiSchedule";

type StoredSchedule = {
  tasks?: PdiScheduleTask[];
  completions?: PdiScheduleCompletion[];
};

export default function PdiScheduleSummary() {
  const today = formatDateInput(new Date());
  const [tasks, setTasks] = useState<PdiScheduleTask[]>(DEFAULT_PDI_SCHEDULE_TASKS);
  const [completions, setCompletions] = useState<PdiScheduleCompletion[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PDI_SCHEDULE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredSchedule;
        if (Array.isArray(parsed.tasks) && parsed.tasks.length > 0) setTasks(parsed.tasks);
        if (Array.isArray(parsed.completions)) setCompletions(parsed.completions);
      }
    } catch {
      localStorage.removeItem(PDI_SCHEDULE_STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(PDI_SCHEDULE_STORAGE_KEY, JSON.stringify({ tasks, completions }));
  }, [completions, loaded, tasks]);

  const weekStart = getWeekRange().start;
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => shiftDate(weekStart, index)), [weekStart]);
  const activeTasks = useMemo(() => tasks.filter((task) => task.enabled), [tasks]);
  const todayTasks = useMemo(
    () => activeTasks.filter((task) => getTaskDateForWeek(task, weekStart) === today),
    [activeTasks, today, weekStart],
  );
  const missedTasks = useMemo(
    () => activeTasks.filter((task) => {
      const dueDate = getTaskDateForWeek(task, weekStart);
      return dueDate < today && !isCompleted(completions, task.id, dueDate);
    }),
    [activeTasks, completions, today, weekStart],
  );

  function toggleComplete(task: PdiScheduleTask) {
    const dueDate = getTaskDateForWeek(task, weekStart);
    if (isCompleted(completions, task.id, dueDate)) {
      setCompletions((current) => current.filter((item) => !(item.taskId === task.id && item.date === dueDate)));
      return;
    }
    setCompletions((current) => [...current, { taskId: task.id, date: dueDate, completedAt: new Date().toISOString() }]);
  }

  return (
    <section className="platform-section console-schedule-section page-enter page-delay-1">
      <div className="platform-section-heading">
        <div>
          <span className="section-index">00</span>
          <h2>PDI 일정표</h2>
        </div>
        <p>놓치면 아픈 반복 업무를 메인에서 바로 확인합니다.</p>
      </div>

      <div className="console-schedule-panel">
        <article className="console-schedule-today">
          <div>
            <span>TODAY</span>
            <strong>{formatShortDate(today)} 오늘 일정</strong>
            <p>{todayTasks.length > 0 ? `${todayTasks.length}개 일정이 있습니다.` : "오늘 등록된 일정은 없습니다."}</p>
          </div>
          <Link className="platform-button button-outline" href="/hangdong-guide/pdi-schedule">일정 관리</Link>
        </article>

        {missedTasks.length > 0 && (
          <article className="console-schedule-alert">
            <strong>놓친 일정 {missedTasks.length}건</strong>
            <div>
              {missedTasks.slice(0, 3).map((task) => (
                <button type="button" key={task.id} onClick={() => toggleComplete(task)}>
                  {WEEKDAY_LABELS[task.weekday]} - {task.title} 완료
                </button>
              ))}
            </div>
          </article>
        )}

        <div className="console-schedule-week">
          {weekDates.map((date) => {
            const weekday = new Date(date).getDay() as Weekday;
            const dayTasks = activeTasks.filter((task) => task.weekday === weekday);
            return (
              <article className={date === today ? "is-today" : ""} key={date}>
                <div>
                  <span>{WEEKDAY_LABELS[weekday]}</span>
                  <strong>{formatShortDate(date)}</strong>
                </div>
                {dayTasks.length > 0 ? dayTasks.slice(0, 2).map((task) => {
                  const done = isCompleted(completions, task.id, date);
                  return (
                    <button className={done ? "is-done" : ""} type="button" key={task.id} onClick={() => toggleComplete(task)}>
                      <b>{done ? "완료" : "체크"}</b>
                      <span>{task.title}</span>
                    </button>
                  );
                }) : <p>일정 없음</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}
