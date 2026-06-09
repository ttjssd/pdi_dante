"use client";

import { ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyDraft,
  DAILY_WORK_LOG_STORAGE_KEY,
  EMPTY_WEEKLY_MANUAL_FIELDS,
  filterRecordsByPeriod,
  formatDateTime,
  generateDailySlackText,
  generateWeeklyReport,
  getMeetingPeriod,
  joinLines,
  parseDailyWorkLog,
  shiftDate,
  splitLines,
  type DailyWorkLog,
  type DailyWorkLogDraft,
  type WeeklyManualFields,
} from "./dailyWorkLog";

const EXAMPLE_TEXT = `[06/09 (화) 항동 - PDI 일일 업무일지]

• 차량출고준비 - 14대
  (준비 중, 특이사항 차량 총 3대)

• 금일 탁송 인계 - 11대
  ○ 금일 탁송 이력 항동 PDI 퀵 탁송 이력 확인 가능

• 항동 관리 업무
  ○ 택배 상자 진행
  ○ 출고장 사무실 정리
    ■ 대시보드 용 TV 설치 / 프린터, 코팅기용 책상 설치
  ○ 재고 실사 진행
  ○ 4F,5F,6F 2중 주차 제거 작업

[항동 PDI 인사]
• 8TO16
  ○ poty, soom

• 올도 PDI 지원
  ○ wood

• 연차
  ○ musk (6/9)`;

export default function DailyWorkLogClient() {
  const [records, setRecords] = useState<DailyWorkLog[]>([]);
  const [draft, setDraft] = useState<DailyWorkLogDraft>(() => createEmptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [period, setPeriod] = useState(() => getMeetingPeriod());
  const [manual, setManual] = useState<WeeklyManualFields>(EMPTY_WEEKLY_MANUAL_FIELDS);
  const [weeklyReport, setWeeklyReport] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DAILY_WORK_LOG_STORAGE_KEY);
      if (saved) setRecords(JSON.parse(saved));
    } catch {
      setMessage("저장된 기록을 불러오지 못했습니다.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(DAILY_WORK_LOG_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event("pdi-records-updated"));
  }, [loaded, records]);

  const currentRecords = useMemo(
    () => filterRecordsByPeriod(records, period.start, period.end),
    [records, period],
  );
  const previousRecords = useMemo(
    () => filterRecordsByPeriod(records, shiftDate(period.start, -7), shiftDate(period.end, -7)),
    [records, period],
  );
  const dailyText = useMemo(() => generateDailySlackText(draft), [draft]);

  function analyzeRawText() {
    if (!draft.rawText.trim()) {
      setMessage("분석할 원문을 붙여넣어주세요.");
      return;
    }
    setDraft(parseDailyWorkLog(draft.rawText));
    setEditingId(null);
    setMessage("원문을 분석했습니다. 추출값을 확인하고 저장해주세요.");
  }

  function saveRecord() {
    if (!draft.date) {
      setMessage("날짜를 입력해주세요.");
      return;
    }
    const now = new Date().toISOString();
    if (editingId) {
      setRecords((current) => current.map((record) =>
        record.id === editingId ? { ...record, ...draft, updatedAt: now } : record,
      ));
      setMessage("일일 기록을 수정했습니다.");
    } else {
      setRecords((current) => [
        { ...draft, id: crypto.randomUUID(), createdAt: now, updatedAt: now },
        ...current,
      ]);
      setMessage("일일 기록을 저장했습니다.");
    }
    setEditingId(null);
    setDraft(createEmptyDraft());
  }

  function loadRecord(record: DailyWorkLog) {
    const { id, createdAt, updatedAt, ...recordDraft } = record;
    setDraft(recordDraft);
    setEditingId(id);
    setMessage(`${record.date} 기록을 불러왔습니다.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteRecord(id: string) {
    if (!window.confirm("이 일일 기록을 삭제할까요?")) return;
    setRecords((current) => current.filter((record) => record.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setDraft(createEmptyDraft());
    }
    setMessage("기록을 삭제했습니다.");
  }

  function createWeeklyReport() {
    setWeeklyReport(generateWeeklyReport(currentRecords, previousRecords, period.start, period.end, manual));
    setMessage(`선택 기간의 ${currentRecords.length}개 기록으로 주간 리포트를 생성했습니다.`);
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setMessage(`${label}을 복사했습니다.`);
  }

  function exportRecords() {
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), records }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `pdi-daily-work-log-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("일일 업무일지 데이터를 내보냈습니다.");
  }

  async function importRecords(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const imported = Array.isArray(parsed) ? parsed : parsed.records;
      if (!Array.isArray(imported)) throw new Error("invalid");
      const merged = new Map(records.map((record) => [record.id, record]));
      imported.forEach((record: DailyWorkLog) => {
        if (record?.id && record?.date) merged.set(record.id, record);
      });
      setRecords(Array.from(merged.values()).sort((a, b) => b.date.localeCompare(a.date)));
      setMessage(`${imported.length}개 기록을 가져왔습니다.`);
    } catch {
      setMessage("올바른 업무일지 JSON 파일이 아닙니다.");
    }
  }

  function clearRecords() {
    if (!window.confirm("저장된 일일 업무일지 전체를 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;
    setRecords([]);
    setWeeklyReport("");
    setMessage("저장된 업무일지를 모두 삭제했습니다.");
  }

  return (
    <div className="daily-log-workspace">
      <section className="daily-log-card daily-log-input-card">
        <div className="daily-log-section-heading">
          <span>01</span>
          <div>
            <h2>일일 업무일지 입력</h2>
            <p>슬랙 원문을 분석하거나 필드를 직접 입력합니다.</p>
          </div>
        </div>

        <label className="daily-log-field">
          <span>슬랙 원문 붙여넣기</span>
          <textarea
            className="daily-log-raw"
            value={draft.rawText}
            onChange={(event) => setDraft((current) => ({ ...current, rawText: event.target.value }))}
            placeholder={EXAMPLE_TEXT}
          />
        </label>
        <div className="daily-log-actions">
          <button className="platform-button button-primary" type="button" onClick={analyzeRawText}>원문 분석</button>
          <button className="platform-button button-outline" type="button" onClick={() => setDraft({ ...parseDailyWorkLog(EXAMPLE_TEXT), rawText: EXAMPLE_TEXT })}>예시 불러오기</button>
        </div>

        <div className="daily-log-count-grid">
          <Field label="날짜"><input type="date" value={draft.date} onChange={(event) => setDraftValue("date", event.target.value)} /></Field>
          <Field label="요일"><input value={draft.weekday} onChange={(event) => setDraftValue("weekday", event.target.value)} /></Field>
          <Field label="차량출고준비"><input type="number" min="0" value={draft.dailyReadyCount} onChange={(event) => setDraftNumber("dailyReadyCount", event.target.value)} /></Field>
          <Field label="특이사항 차량"><input type="number" min="0" value={draft.specialReadyCount} onChange={(event) => setDraftNumber("specialReadyCount", event.target.value)} /></Field>
          <Field label="탁송 인계"><input type="number" min="0" value={draft.dailyTransportHandOverCount} onChange={(event) => setDraftNumber("dailyTransportHandOverCount", event.target.value)} /></Field>
        </div>

        <div className="daily-log-text-grid">
          <ListField label="항동 관리 업무" value={draft.managementTasks} onChange={(value) => setDraftValue("managementTasks", splitLines(value))} />
          <ListField label="8TO16 출근자" value={draft.shiftWorkers} onChange={(value) => setDraftValue("shiftWorkers", splitLines(value.replace(/,/g, "\n")))} />
          <ListField label="올도 PDI 지원" value={draft.oldoSupport} onChange={(value) => setDraftValue("oldoSupport", splitLines(value.replace(/,/g, "\n")))} />
          <ListField label="연차" value={draft.leaveList} onChange={(value) => setDraftValue("leaveList", splitLines(value))} />
          <ListField label="공가/휴가" value={draft.publicLeaveList} onChange={(value) => setDraftValue("publicLeaveList", splitLines(value))} />
          <ListField label="기타 메모" value={draft.otherNotes} onChange={(value) => setDraftValue("otherNotes", splitLines(value))} />
        </div>

        <div className="daily-log-actions">
          <button className="platform-button button-primary" type="button" onClick={saveRecord}>{editingId ? "수정 저장" : "일일 기록 저장"}</button>
          <button className="platform-button button-outline" type="button" onClick={() => copyText(dailyText, "일일 업무일지")}>일일 업무일지 복사</button>
          {editingId && <button className="platform-button button-ghost" type="button" onClick={() => { setEditingId(null); setDraft(createEmptyDraft()); }}>수정 취소</button>}
        </div>
      </section>

      <section className="daily-log-card daily-log-preview-card">
        <div className="daily-log-section-heading">
          <span>02</span>
          <div>
            <h2>일일 문구 미리보기</h2>
            <p>현재 입력값을 슬랙 양식으로 바로 확인합니다.</p>
          </div>
        </div>
        <textarea className="daily-log-preview" value={dailyText} readOnly />
      </section>

      <section className="daily-log-card daily-log-weekly-card">
        <div className="daily-log-section-heading">
          <span>03</span>
          <div>
            <h2>주간 리포트 생성</h2>
            <p>금요일부터 목요일까지 저장된 일일 기록을 합산합니다.</p>
          </div>
        </div>

        <div className="weekly-period-row">
          <Field label="시작일"><input type="date" value={period.start} onChange={(event) => setPeriod((current) => ({ ...current, start: event.target.value }))} /></Field>
          <Field label="종료일"><input type="date" value={period.end} onChange={(event) => setPeriod((current) => ({ ...current, end: event.target.value }))} /></Field>
          <button className="platform-button button-outline" type="button" onClick={() => setPeriod(getMeetingPeriod())}>이번 주 회의 기간</button>
          <div className="weekly-record-count"><strong>{currentRecords.length}</strong><span>개 일일 기록</span></div>
        </div>

        <div className="weekly-manual-grid">
          {([
            ["inboundCount", "금주 입고 차량"],
            ["waitingCount", "출고 대기 차량"],
            ["potholeCount", "요철"],
            ["maintenanceCount", "정비"],
            ["smartKeyCount", "스마트키 불량"],
            ["batteryCount", "배터리 교체"],
            ["otherIssueCount", "기타 특이사항"],
          ] as [keyof WeeklyManualFields, string][]).map(([key, label]) => (
            <Field key={key} label={label}>
              <input value={manual[key]} onChange={(event) => setManual((current) => ({ ...current, [key]: event.target.value }))} placeholder="(수기 입력)" />
            </Field>
          ))}
        </div>
        <div className="weekly-long-fields">
          {([
            ["otherWork", "그 외"],
            ["discussion", "개선사항 및 논의내용"],
            ["nextWeek", "다음 주 예정"],
          ] as [keyof WeeklyManualFields, string][]).map(([key, label]) => (
            <label className="daily-log-field" key={key}>
              <span>{label}</span>
              <textarea value={manual[key]} onChange={(event) => setManual((current) => ({ ...current, [key]: event.target.value }))} placeholder="(수기 입력)" />
            </label>
          ))}
        </div>
        <div className="daily-log-actions">
          <button className="platform-button button-primary" type="button" onClick={createWeeklyReport}>주간 리포트 생성</button>
          <button className="platform-button button-outline" type="button" onClick={() => copyText(weeklyReport, "주간 리포트")} disabled={!weeklyReport}>주간 리포트 복사</button>
        </div>
        <textarea
          className="weekly-report-output"
          value={weeklyReport}
          onChange={(event) => setWeeklyReport(event.target.value)}
          placeholder="기간과 수기 입력값을 확인한 뒤 주간 리포트 생성을 눌러주세요."
        />
      </section>

      <section className="daily-log-card daily-log-history-card">
        <div className="daily-log-section-heading">
          <span>04</span>
          <div>
            <h2>저장된 일일 기록</h2>
            <p>기록을 다시 불러오거나 JSON으로 백업합니다.</p>
          </div>
        </div>
        <div className="daily-log-actions">
          <button className="platform-button button-outline" type="button" onClick={exportRecords}>JSON 내보내기</button>
          <button className="platform-button button-outline" type="button" onClick={() => importInputRef.current?.click()}>JSON 가져오기</button>
          <button className="platform-button button-ghost danger-text" type="button" onClick={clearRecords}>전체 초기화</button>
          <input ref={importInputRef} type="file" accept="application/json,.json" hidden onChange={importRecords} />
        </div>
        <div className="daily-log-history-list">
          {records.map((record) => (
            <article key={record.id}>
              <button type="button" onClick={() => loadRecord(record)}>
                <strong>{record.date} ({record.weekday})</strong>
                <span>출고준비 {record.dailyReadyCount} · 탁송 {record.dailyTransportHandOverCount} · 특이사항 {record.specialReadyCount}</span>
                <small>수정 {formatDateTime(record.updatedAt)}</small>
              </button>
              <button className="record-delete-button" type="button" onClick={() => deleteRecord(record.id)}>삭제</button>
            </article>
          ))}
          {records.length === 0 && <div className="private-empty-state">저장된 일일 업무일지가 없습니다.</div>}
        </div>
      </section>

      {message && <div className="daily-log-toast" role="status">{message}</div>}
    </div>
  );

  function setDraftValue<K extends keyof DailyWorkLogDraft>(key: K, value: DailyWorkLogDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setDraftNumber(key: "dailyReadyCount" | "specialReadyCount" | "dailyTransportHandOverCount", value: string) {
    setDraft((current) => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="daily-log-field"><span>{label}</span>{children}</label>;
}

function ListField({ label, value, onChange }: { label: string; value: string[]; onChange: (value: string) => void }) {
  return (
    <label className="daily-log-field">
      <span>{label}</span>
      <textarea value={joinLines(value)} onChange={(event) => onChange(event.target.value)} placeholder="한 줄에 한 항목씩 입력" />
    </label>
  );
}
