"use client";

import { useEffect, useMemo, useState } from "react";
import { buildJejuRequestText, type JejuRequestForm } from "./jejuRequestTemplate";

const STORAGE_KEY = "pdi-jeju-transport-request-history-v1";
const MANAGER_INFO = "@고채현 @김경민\n김경민 유선 연락처: 010-6207-8348";

type FormState = JejuRequestForm;

type HistoryItem = FormState & {
  id: string;
  createdAt: string;
};

const initialForm: FormState = {
  vehicleNumber: "",
  vehicleName: "",
  desiredArrival: "",
  departureAt: "",
  requestDetails: "",
  memo: "",
};

function normalizeHistoryItem(item: Record<string, unknown>): HistoryItem {
  const legacyRequests = Array.isArray(item.selectedRequests)
    ? item.selectedRequests.filter((value): value is string => typeof value === "string")
    : [];
  const customRequest = typeof item.customRequest === "string" ? item.customRequest : "";
  return {
    id: typeof item.id === "string" ? item.id : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    vehicleNumber: typeof item.vehicleNumber === "string" ? item.vehicleNumber : "",
    vehicleName: typeof item.vehicleName === "string" ? item.vehicleName : "",
    desiredArrival: typeof item.desiredArrival === "string" ? item.desiredArrival : "",
    departureAt: typeof item.departureAt === "string" ? item.departureAt : "",
    requestDetails: typeof item.requestDetails === "string"
      ? item.requestDetails
      : [...legacyRequests, customRequest].filter(Boolean).join("\n"),
    memo: typeof item.memo === "string" ? item.memo : "",
  };
}

export default function JejuRequestGenerator() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setHistory(parsed.map((item) => normalizeHistoryItem(item)));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history, loaded]);

  const preview = useMemo(() => result || buildJejuRequestText(form), [form, result]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setResult("");
  }

  function generate() {
    const text = buildJejuRequestText(form);
    setResult(text);
    const item: HistoryItem = {
      ...form,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setHistory((current) => [item, ...current].slice(0, 10));
  }

  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1400);
  }

  function restore(item: HistoryItem) {
    const { id: _id, createdAt: _createdAt, ...restored } = item;
    setForm(restored);
    setResult(buildJejuRequestText(restored));
  }

  return (
    <>
      <div className="jeju-workspace">
        <section className="jeju-form-card">
          <div className="transport-panel-heading">
            <div><span>01</span><h2>요청 정보 입력</h2></div>
            <small>담당자 @고채현 · @김경민</small>
          </div>

          <div className="jeju-form-grid">
            <label className="transport-field">
              <span>차량번호</span>
              <input value={form.vehicleNumber} onChange={(event) => updateForm("vehicleNumber", event.target.value)} placeholder="12가3456" />
            </label>
            <label className="transport-field">
              <span>차량명</span>
              <input value={form.vehicleName} onChange={(event) => updateForm("vehicleName", event.target.value)} placeholder="현대 더 뉴 투싼" />
            </label>
            <label className="transport-field">
              <span>희망 도착일</span>
              <input value={form.desiredArrival} onChange={(event) => updateForm("desiredArrival", event.target.value)} placeholder="6/8(월)" />
            </label>
            <label className="transport-field">
              <span>탁송 신청 출발 일시</span>
              <input value={form.departureAt} onChange={(event) => updateForm("departureAt", event.target.value)} placeholder="내일 10시" />
            </label>
          </div>

          <label className="transport-field">
            <span>요청사항 직접 입력</span>
            <textarea
              className="jeju-request-details"
              value={form.requestDetails}
              onChange={(event) => updateForm("requestDetails", event.target.value)}
              placeholder={"일요일 선적\n월요일 제주도 도착 후 고객님 탁송\n\n또는\n희망 도착일 : 6/8(월)"}
            />
          </label>
          <label className="transport-field">
            <span>추가 메모</span>
            <textarea className="jeju-memo" value={form.memo} onChange={(event) => updateForm("memo", event.target.value)} placeholder="필요한 경우 추가 확인 내용을 입력하세요." />
          </label>
          <button className="platform-button button-primary transport-analyze" type="button" onClick={generate}>요청 문구 생성하기</button>
        </section>

        <div className="jeju-result-column">
          <section className="jeju-result-card">
            <div className="transport-panel-heading">
              <div><span>02</span><h2>슬랙 요청 문구</h2></div>
              <button className="transport-copy" type="button" onClick={() => copyText("request", preview)}>{copied === "request" ? "복사됨" : "문구 복사"}</button>
            </div>
            <pre>{preview}</pre>
          </section>

          <aside className="jeju-manager-card">
            <div>
              <span>REFERENCE</span>
              <h2>제주도 탁송 담당자</h2>
            </div>
            <dl>
              <div><dt>담당자</dt><dd>@고채현 · @김경민</dd></div>
              <div><dt>김경민 유선 연락처</dt><dd>010-6207-8348</dd></div>
            </dl>
            <p>제주도 탁송 문의 건은 @고채현 @김경민 담당자를 함께 태그해 주세요.<br />김경민 담당자 유선 연락이 필요한 경우 010-6207-8348 번호를 참고할 수 있습니다.</p>
            <button className="transport-copy" type="button" onClick={() => copyText("manager", MANAGER_INFO)}>{copied === "manager" ? "복사됨" : "담당자 정보 복사"}</button>
          </aside>
        </div>
      </div>

      <section className="jeju-history">
        <div className="transport-panel-heading">
          <div><span>03</span><h2>최근 생성 기록</h2></div>
          {history.length > 0 && <button className="transport-copy danger-copy" type="button" onClick={() => setHistory([])}>전체 삭제</button>}
        </div>
        {history.length === 0 ? (
          <p className="jeju-history-empty">최근 생성 기록이 없습니다.</p>
        ) : (
          <div className="jeju-history-list">
            {history.map((item) => (
              <button type="button" key={item.id} onClick={() => restore(item)}>
                <time>{new Date(item.createdAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</time>
                <strong>{item.vehicleNumber || "차량번호 미입력"}</strong>
                <span>{item.vehicleName || "차량명 미입력"}</span>
                <em>{item.desiredArrival || "도착일 미입력"}</em>
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
