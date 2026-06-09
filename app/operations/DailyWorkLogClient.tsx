"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  DAILY_WORK_LOG_STORAGE_KEY,
  filterRecordsByPeriod,
  formatDateTime,
  generateWeeklyReport,
  getMeetingPeriod,
  parseDailyWorkLog,
  shiftDate,
  type DailyWorkLog,
} from "./dailyWorkLog";

const EXAMPLE_TEXT = `[06/09 (화) 항동 - PDI 일일 업무일지]

• 금일 입고 완료 - 12대

• 차량출고준비 - 14대
  (준비 중, 특이사항 차량 총 3대)

• 금일 탁송 인계 - 11대

• 항동 관리 업무
  ○ 재고 실사 진행

[항동 PDI 인사]
• 8TO16
  ○ poty, soom`;

export default function DailyWorkLogClient() {
  const [records, setRecords] = useState<DailyWorkLog[]>([]);
  const [rawText, setRawText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [period, setPeriod] = useState(() => getMeetingPeriod());
  const [weeklyReport, setWeeklyReport] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DAILY_WORK_LOG_STORAGE_KEY);
      if (saved) setRecords(normalizeRecords(JSON.parse(saved)));
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
  const totals = useMemo(() => summarize(currentRecords), [currentRecords]);

  function registerRecord() {
    if (!rawText.trim()) {
      setMessage("등록할 일일 업무일지를 붙여넣어주세요.");
      return;
    }
    const parsed = parseDailyWorkLog(rawText);
    const now = new Date().toISOString();

    if (editingId) {
      setRecords((current) => current.map((record) =>
        record.id === editingId ? { ...record, ...parsed, updatedAt: now } : record,
      ));
      setMessage(`${parsed.date} 업무일지를 수정했습니다.`);
    } else {
      const sameDate = records.find((record) => record.date === parsed.date);
      if (sameDate && !window.confirm(`${parsed.date} 기록이 이미 있습니다. 별도 기록으로 추가할까요?`)) return;
      setRecords((current) => [
        { ...parsed, id: crypto.randomUUID(), createdAt: now, updatedAt: now },
        ...current,
      ]);
      setMessage(`${parsed.date} 업무일지를 등록했습니다.`);
    }

    setRawText("");
    setEditingId(null);
  }

  function loadRecord(record: DailyWorkLog) {
    setRawText(record.rawText);
    setEditingId(record.id);
    setMessage(`${record.date} 원문을 불러왔습니다. 수정 후 다시 등록하세요.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteRecord(id: string) {
    if (!window.confirm("이 일일 업무일지 기록을 삭제할까요?")) return;
    setRecords((current) => current.filter((record) => record.id !== id));
    if (editingId === id) cancelEdit();
    setMessage("기록을 삭제했습니다.");
  }

  function cancelEdit() {
    setEditingId(null);
    setRawText("");
  }

  function createWeeklyReport() {
    setWeeklyReport(generateWeeklyReport(currentRecords, previousRecords, period.start, period.end));
    setMessage(`${currentRecords.length}개 일일 기록의 핵심 수치를 합산했습니다.`);
  }

  async function copyWeeklyReport() {
    if (!weeklyReport) return;
    await navigator.clipboard.writeText(weeklyReport);
    setMessage("주간 리포트를 복사했습니다.");
  }

  function exportRecords() {
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), records }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `pdi-daily-work-log-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("업무일지 데이터를 내보냈습니다.");
  }

  async function importRecords(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const imported = normalizeRecords(Array.isArray(parsed) ? parsed : parsed.records);
      const merged = new Map(records.map((record) => [record.id, record]));
      imported.forEach((record) => merged.set(record.id, record));
      setRecords(Array.from(merged.values()).sort((a, b) => b.date.localeCompare(a.date)));
      setMessage(`${imported.length}개 기록을 가져왔습니다.`);
    } catch {
      setMessage("올바른 업무일지 JSON 파일이 아닙니다.");
    }
  }

  function clearRecords() {
    if (!window.confirm("저장된 일일 업무일지를 모두 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;
    setRecords([]);
    setWeeklyReport("");
    cancelEdit();
    setMessage("저장된 업무일지를 모두 삭제했습니다.");
  }

  return (
    <div className="daily-log-workspace is-registration-flow">
      <section className="daily-log-card daily-log-register-card">
        <div className="daily-log-section-heading">
          <span>01</span>
          <div>
            <h2>일일 업무일지 등록</h2>
            <p>슬랙에 작성한 일일 업무일지를 그대로 붙여넣어 보관합니다.</p>
          </div>
        </div>
        <label className="daily-log-field">
          <span>업무일지 원문</span>
          <textarea
            className="daily-log-raw"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder={EXAMPLE_TEXT}
          />
        </label>
        <div className="daily-log-actions">
          <button className="platform-button button-primary" type="button" onClick={registerRecord}>
            {editingId ? "수정 내용 등록" : "일일 업무일지 등록"}
          </button>
          <button className="platform-button button-outline" type="button" onClick={() => setRawText(EXAMPLE_TEXT)}>예시 불러오기</button>
          {editingId && <button className="platform-button button-ghost" type="button" onClick={cancelEdit}>수정 취소</button>}
        </div>
      </section>

      <section className="daily-log-card daily-log-history-card">
        <div className="daily-log-section-heading">
          <span>02</span>
          <div>
            <h2>보관된 일일 업무일지</h2>
            <p>등록한 원문과 자동 추출된 핵심 수치를 날짜별로 보관합니다.</p>
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
                <span>
                  입고 {record.dailyInboundCount || 0} · 출고 {record.dailyTransportHandOverCount} ·
                  출고준비 {record.dailyReadyCount} · 특이사항 {record.specialReadyCount}
                </span>
                <small>수정 {formatDateTime(record.updatedAt)}</small>
              </button>
              <button className="record-delete-button" type="button" onClick={() => deleteRecord(record.id)}>삭제</button>
            </article>
          ))}
          {records.length === 0 && <div className="private-empty-state">보관된 일일 업무일지가 없습니다.</div>}
        </div>
      </section>

      <section className="daily-log-card daily-log-weekly-card">
        <div className="daily-log-section-heading">
          <span>03</span>
          <div>
            <h2>주간 핵심 수치 취합</h2>
            <p>금요일부터 목요일까지 등록된 기록에서 필요한 숫자만 합산합니다.</p>
          </div>
        </div>
        <div className="weekly-period-row">
          <label className="daily-log-field"><span>시작일</span><input type="date" value={period.start} onChange={(event) => setPeriod((current) => ({ ...current, start: event.target.value }))} /></label>
          <label className="daily-log-field"><span>종료일</span><input type="date" value={period.end} onChange={(event) => setPeriod((current) => ({ ...current, end: event.target.value }))} /></label>
          <button className="platform-button button-outline" type="button" onClick={() => setPeriod(getMeetingPeriod())}>이번 주 회의 기간</button>
          <div className="weekly-record-count"><strong>{currentRecords.length}</strong><span>개 일일 기록</span></div>
        </div>

        <div className="weekly-metric-grid">
          <Metric label="금주 입고 완료" value={totals.inbound} />
          <Metric label="출고 완료" value={totals.handover} />
          <Metric label="출고준비 완료" value={totals.ready} />
          <Metric label="특이사항 차량" value={totals.special} />
        </div>

        <div className="daily-log-actions">
          <button className="platform-button button-primary" type="button" onClick={createWeeklyReport}>주간 리포트 작성</button>
          <button className="platform-button button-outline" type="button" onClick={copyWeeklyReport} disabled={!weeklyReport}>리포트 복사</button>
        </div>
        <textarea
          className="weekly-report-output"
          value={weeklyReport}
          onChange={(event) => setWeeklyReport(event.target.value)}
          placeholder="기간 내 등록된 업무일지를 기준으로 입고·출고·출고준비·특이사항 수치를 작성합니다."
        />
      </section>

      {message && <div className="daily-log-toast" role="status">{message}</div>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article><span>{label}</span><strong>{value}<small>대</small></strong></article>;
}

function summarize(records: DailyWorkLog[]) {
  return records.reduce(
    (summary, record) => ({
      inbound: summary.inbound + (Number(record.dailyInboundCount) || 0),
      handover: summary.handover + (Number(record.dailyTransportHandOverCount) || 0),
      ready: summary.ready + (Number(record.dailyReadyCount) || 0),
      special: summary.special + (Number(record.specialReadyCount) || 0),
    }),
    { inbound: 0, handover: 0, ready: 0, special: 0 },
  );
}

function normalizeRecords(value: unknown): DailyWorkLog[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((record): record is DailyWorkLog => Boolean(record && typeof record === "object" && "id" in record && "date" in record))
    .map((record) => ({ ...record, dailyInboundCount: Number(record.dailyInboundCount) || 0 }));
}
