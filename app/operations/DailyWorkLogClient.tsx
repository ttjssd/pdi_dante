"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  buildWeeklyRecordStatuses,
  DAILY_WORK_LOG_STORAGE_KEY,
  filterRecordsByPeriod,
  formatDateTime,
  generateWeeklyReport,
  getMeetingPeriod,
  parseDailyWorkLog,
  shiftDate,
  summarizeWeeklyRecords,
  WEEKLY_REPORT_STORAGE_KEY,
  type DailyWorkLog,
  type WeeklyManualAdjustment,
  type WeeklyReportSnapshot,
  type WeeklyReportTotals,
} from "./dailyWorkLog";

const EXAMPLE_TEXT = `[06/09 (화) 항동 - PDI 일일 업무일지]

• 입고 차량 - 12대

• 차량출고준비 - 14대
  (준비 중, 특이사항 차량 총 3대)

• 금일 탁송 인계 - 11대

• 고객 인입 - 2건
• 수출업자 방문 - 1건

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
  const [weeklySnapshots, setWeeklySnapshots] = useState<WeeklyReportSnapshot[]>([]);
  const [manualAdjustment, setManualAdjustment] = useState<WeeklyManualAdjustment>({});
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DAILY_WORK_LOG_STORAGE_KEY);
      if (saved) setRecords(normalizeRecords(JSON.parse(saved)));
      const savedReports = localStorage.getItem(WEEKLY_REPORT_STORAGE_KEY);
      if (savedReports) setWeeklySnapshots(normalizeWeeklySnapshots(JSON.parse(savedReports)));
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

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(WEEKLY_REPORT_STORAGE_KEY, JSON.stringify(weeklySnapshots));
  }, [loaded, weeklySnapshots]);

  const currentRecords = useMemo(
    () => filterRecordsByPeriod(records, period.start, period.end),
    [records, period],
  );
  const autoCurrentRecords = useMemo(
    () => currentRecords.filter((record) => record.weekday !== "목"),
    [currentRecords],
  );
  const previousRecords = useMemo(
    () => filterRecordsByPeriod(records, shiftDate(period.start, -7), shiftDate(period.end, -7)),
    [records, period],
  );
  const previousSnapshot = useMemo(
    () => findPreviousSnapshot(weeklySnapshots, period.start),
    [weeklySnapshots, period.start],
  );
  const previousTotals = useMemo(
    () => previousSnapshot?.totals || summarizeWeeklyRecords(previousRecords.filter((record) => record.weekday !== "목")),
    [previousRecords, previousSnapshot],
  );
  const hasPreviousTotals = Boolean(previousSnapshot || previousRecords.length > 0);
  const totals = useMemo(() => summarizeWeeklyRecords(autoCurrentRecords, manualAdjustment), [autoCurrentRecords, manualAdjustment]);
  const weeklyStatuses = useMemo(
    () => buildWeeklyRecordStatuses(records, period.start, period.end),
    [records, period],
  );
  const statusSummary = useMemo(() => ({
    complete: weeklyStatuses.filter((item) => item.state === "complete").length,
    missing: weeklyStatuses.filter((item) => item.state === "missing").length,
    duplicate: weeklyStatuses.filter((item) => item.state === "duplicate").length,
    warning: weeklyStatuses.filter((item) => item.state === "warning").length,
    manual: weeklyStatuses.filter((item) => item.state === "manual").length,
  }), [weeklyStatuses]);

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
    setWeeklyReport(generateWeeklyReport(autoCurrentRecords, hasPreviousTotals ? previousTotals : null, period.start, period.end, manualAdjustment));
    setMessage(`${autoCurrentRecords.length}개 일일 기록과 목요일 수기 값을 합산했습니다.`);
  }

  async function copyWeeklyReport() {
    if (!weeklyReport) return;
    await navigator.clipboard.writeText(weeklyReport);
    setMessage("주간 리포트를 복사했습니다.");
  }

  function updateManualAdjustment(key: keyof WeeklyReportTotals, value: string) {
    const numberValue = Number(value);
    setManualAdjustment((current) => ({ ...current, [key]: Number.isFinite(numberValue) ? Math.max(0, numberValue) : 0 }));
  }

  function saveWeeklyReportSnapshot() {
    const report = weeklyReport || generateWeeklyReport(autoCurrentRecords, hasPreviousTotals ? previousTotals : null, period.start, period.end, manualAdjustment);
    const now = new Date().toISOString();
    const snapshot: WeeklyReportSnapshot = {
      id: `${period.start}_${period.end}`,
      startDate: period.start,
      endDate: period.end,
      totals,
      report,
      createdAt: now,
      updatedAt: now,
    };
    setWeeklySnapshots((current) => [
      snapshot,
      ...current.filter((item) => item.id !== snapshot.id),
    ].sort((a, b) => b.endDate.localeCompare(a.endDate)).slice(0, 30));
    setWeeklyReport(report);
    setMessage(`${period.start}~${period.end} 회의록을 저장했습니다.`);
  }

  function loadWeeklyReportSnapshot(snapshot: WeeklyReportSnapshot) {
    setPeriod({ start: snapshot.startDate, end: snapshot.endDate });
    setWeeklyReport(snapshot.report);
    setMessage(`${snapshot.startDate}~${snapshot.endDate} 저장 회의록을 불러왔습니다.`);
  }

  function deleteWeeklyReportSnapshot(id: string) {
    if (!window.confirm("저장된 회의록을 삭제할까요?")) return;
    setWeeklySnapshots((current) => current.filter((item) => item.id !== id));
    setMessage("저장된 회의록을 삭제했습니다.");
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
    setMessage("저장된 업무일지를 모두 삭제했습니다. 이전 회의록 저장 기록은 유지했습니다.");
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
                  출고준비 {record.dailyReadyCount} · 특이사항 {record.specialReadyCount} ·
                  고객 {record.customerInboundCount || 0} · 수출 {record.exporterVisitCount || 0}
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
          <div className="daily-log-heading-status">
            <strong>{formatCoverageDate(period.start)} - {formatCoverageDate(period.end)}</strong>
            <span>{currentRecords.length}개 기록 반영</span>
          </div>
        </div>
        <div className="weekly-control-panel">
          <div className="weekly-period-row">
            <label className="daily-log-field"><span>시작일</span><input type="date" value={period.start} onChange={(event) => setPeriod((current) => ({ ...current, start: event.target.value }))} /></label>
            <label className="daily-log-field"><span>종료일</span><input type="date" value={period.end} onChange={(event) => setPeriod((current) => ({ ...current, end: event.target.value }))} /></label>
            <button className="platform-button button-outline" type="button" onClick={() => setPeriod(getMeetingPeriod())}>이번 주 자동 선택</button>
          </div>

          <div className={`weekly-integrity-summary ${statusSummary.missing || statusSummary.duplicate || statusSummary.warning ? "has-issues" : ""}`}>
            <div>
              <strong>기록 점검</strong>
              <span>
                정상 {statusSummary.complete}일 · 미등록 {statusSummary.missing}일 ·
                중복 {statusSummary.duplicate}일 · 추출 확인 {statusSummary.warning}일 ·
                수기 {statusSummary.manual}일
              </span>
            </div>
            <small>토·일 입고 0건과 목요일 수기 확인 칸은 추출 확인에서 제외됩니다.</small>
          </div>
        </div>

        <div className="weekly-coverage-grid">
          {weeklyStatuses.map((item) => (
            <article className={`coverage-${item.state}`} key={item.date}>
              <div>
                <span>{formatCoverageDate(item.date)}</span>
                <strong>{item.weekday}</strong>
              </div>
              <StatusLabel state={item.state} count={item.records.length} />
              {item.records.length > 0 && (
                <p>
                  입고 {item.records.reduce((sum, record) => sum + (record.dailyInboundCount || 0), 0)} ·
                  출고 {item.records.reduce((sum, record) => sum + record.dailyTransportHandOverCount, 0)} ·
                  준비 {item.records.reduce((sum, record) => sum + record.dailyReadyCount, 0)} ·
                  고객 {item.records.reduce((sum, record) => sum + (record.customerInboundCount || 0), 0)} ·
                  수출 {item.records.reduce((sum, record) => sum + (record.exporterVisitCount || 0), 0)}
                </p>
              )}
              {item.note && <small>{item.note}</small>}
              {item.warnings.length > 0 && <small>확인: {item.warnings.join(", ")}</small>}
              {item.records.length > 0 && (
                <button type="button" onClick={() => loadRecord(item.records[0])}>
                  {item.records.length > 1 ? "첫 기록 확인" : "원문 확인"}
                </button>
              )}
            </article>
          ))}
        </div>

        <div className="weekly-metric-grid">
          <Metric label="금주 입고 완료" value={totals.inbound} />
          <Metric label="출고 완료" value={totals.handover} />
          <Metric label="출고준비 완료" value={totals.ready} />
          <Metric label="특이사항 차량" value={totals.special} />
          <Metric label="고객 인입" value={totals.customerInbound} unit="건" />
          <Metric label="수출업자 방문" value={totals.exporterVisit} unit="건" />
        </div>

        <div className="weekly-thursday-panel">
          <div>
            <strong>목요일 수기 확인 값</strong>
            <p>목요일 오후 회의 전에 직접 확인한 숫자를 입력하면 금~수 자동 합계에 더해집니다.</p>
          </div>
          <div className="weekly-thursday-grid">
            <ManualMetric label="입고" value={manualAdjustment.inbound || 0} onChange={(value) => updateManualAdjustment("inbound", value)} />
            <ManualMetric label="출고" value={manualAdjustment.handover || 0} onChange={(value) => updateManualAdjustment("handover", value)} />
            <ManualMetric label="출고준비" value={manualAdjustment.ready || 0} onChange={(value) => updateManualAdjustment("ready", value)} />
            <ManualMetric label="특이사항" value={manualAdjustment.special || 0} onChange={(value) => updateManualAdjustment("special", value)} />
            <ManualMetric label="고객 인입" value={manualAdjustment.customerInbound || 0} onChange={(value) => updateManualAdjustment("customerInbound", value)} />
            <ManualMetric label="수출업자 방문" value={manualAdjustment.exporterVisit || 0} onChange={(value) => updateManualAdjustment("exporterVisit", value)} />
          </div>
        </div>

        <div className="weekly-report-heading">
          <div>
            <strong>회의용 리포트</strong>
            <span>자동 합산 결과를 만든 뒤 필요한 내용만 직접 보완하세요.</span>
          </div>
          <div className="daily-log-actions">
            <button className="platform-button button-primary" type="button" onClick={createWeeklyReport}>리포트 작성</button>
            <button className="platform-button button-outline" type="button" onClick={copyWeeklyReport} disabled={!weeklyReport}>전체 복사</button>
            <button className="platform-button button-outline" type="button" onClick={saveWeeklyReportSnapshot}>회의록 저장</button>
          </div>
        </div>
        <textarea
          className="weekly-report-output"
          value={weeklyReport}
          onChange={(event) => setWeeklyReport(event.target.value)}
          placeholder="기간 내 등록된 업무일지를 기준으로 입고·출고·출고준비·특이사항 수치를 작성합니다."
        />

        <div className="weekly-snapshot-panel">
          <div className="weekly-report-heading">
            <div>
              <strong>이전 회의록 저장 기록</strong>
              <span>저번 주 대비 0대 증가/감소까지 확인할 수 있도록 회의록 합계와 본문을 보관합니다.</span>
            </div>
          </div>
          <div className="weekly-snapshot-list">
            {weeklySnapshots.map((snapshot) => (
              <article key={snapshot.id}>
                <button type="button" onClick={() => loadWeeklyReportSnapshot(snapshot)}>
                  <strong>{formatCoverageDate(snapshot.startDate)} - {formatCoverageDate(snapshot.endDate)}</strong>
                  <span>
                    입고 {snapshot.totals.inbound} · 출고 {snapshot.totals.handover} · 준비 {snapshot.totals.ready} ·
                    고객 {snapshot.totals.customerInbound} · 수출 {snapshot.totals.exporterVisit}
                  </span>
                  <small>저장 {formatDateTime(snapshot.updatedAt)}</small>
                </button>
                <button className="record-delete-button" type="button" onClick={() => deleteWeeklyReportSnapshot(snapshot.id)}>삭제</button>
              </article>
            ))}
            {weeklySnapshots.length === 0 && <div className="private-empty-state">저장된 이전 회의록이 없습니다.</div>}
          </div>
        </div>
      </section>

      {message && <div className="daily-log-toast" role="status">{message}</div>}
    </div>
  );
}

function Metric({ label, value, unit = "대" }: { label: string; value: number; unit?: string }) {
  return <article><span>{label}</span><strong>{value}<small>{unit}</small></strong></article>;
}

function ManualMetric({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return (
    <label>
      <span>{label}</span>
      <input type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function StatusLabel({ state, count }: { state: "complete" | "missing" | "future" | "duplicate" | "warning" | "manual"; count: number }) {
  const labels = {
    complete: "등록 완료",
    missing: "미등록",
    future: "예정",
    duplicate: `중복 ${count}건`,
    warning: "추출 확인",
    manual: "수기 확인",
  };
  return <em>{labels[state]}</em>;
}

function formatCoverageDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function summarize(records: DailyWorkLog[]) {
  return summarizeWeeklyRecords(records);
}

function normalizeRecords(value: unknown): DailyWorkLog[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((record): record is DailyWorkLog => Boolean(record && typeof record === "object" && "id" in record && "date" in record))
    .map((record) => ({
      ...record,
      dailyInboundCount: Number(record.dailyInboundCount) || 0,
      customerInboundCount: Number(record.customerInboundCount) || 0,
      exporterVisitCount: Number(record.exporterVisitCount) || 0,
    }));
}

function normalizeWeeklySnapshots(value: unknown): WeeklyReportSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((snapshot): snapshot is WeeklyReportSnapshot => Boolean(snapshot && typeof snapshot === "object" && "id" in snapshot && "totals" in snapshot))
    .map((snapshot) => ({
      ...snapshot,
      totals: {
        inbound: Number(snapshot.totals?.inbound) || 0,
        ready: Number(snapshot.totals?.ready) || 0,
        special: Number(snapshot.totals?.special) || 0,
        handover: Number(snapshot.totals?.handover) || 0,
        customerInbound: Number(snapshot.totals?.customerInbound) || 0,
        exporterVisit: Number(snapshot.totals?.exporterVisit) || 0,
      },
    }))
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
}

function findPreviousSnapshot(snapshots: WeeklyReportSnapshot[], startDate: string) {
  return snapshots
    .filter((snapshot) => snapshot.endDate < startDate)
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0] || null;
}
