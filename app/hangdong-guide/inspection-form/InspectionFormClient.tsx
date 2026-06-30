"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildInsuranceSheetRows,
  initialInspectionForm,
  parseInspectionVehicles,
  type InspectionGuideForm,
  type InspectionVehicle,
} from "../inspection-guide/inspectionGuide";

const STORAGE_KEY = "pdi-inspection-form-v1";

const EXAMPLE_TEXT = `295다8979 - 싼타페
261무2181 - 아반떼
184어5656 - 시리즈
182더6510 - BMW X5
28우6162 - 그랜저`;

type SavedState = {
  rawText: string;
  form: InspectionGuideForm;
  vehicles: InspectionVehicle[];
};

export default function InspectionFormClient() {
  const [rawText, setRawText] = useState("");
  const [vehicles, setVehicles] = useState<InspectionVehicle[]>([]);
  const [form, setForm] = useState<InspectionGuideForm>(initialInspectionForm);
  const [copied, setCopied] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SavedState>;
        setRawText(typeof parsed.rawText === "string" ? parsed.rawText : "");
        setForm({ ...initialInspectionForm, ...(parsed.form || {}) });
        setVehicles(Array.isArray(parsed.vehicles) ? normalizeVehicles(parsed.vehicles) : []);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rawText, form, vehicles }));
  }, [form, loaded, rawText, vehicles]);

  const sheetRows = useMemo(() => buildInsuranceSheetRows(vehicles, form), [vehicles, form]);

  function updateVehicle(id: string, key: keyof InspectionVehicle, value: string) {
    setVehicles((current) => current.map((vehicle) => vehicle.id === id ? { ...vehicle, [key]: value } : vehicle));
  }

  function extractVehicles() {
    setVehicles(parseInspectionVehicles(rawText));
  }

  function addVehicle() {
    setVehicles((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, plateNumber: "", vehicleName: "", location: "", memo: "" },
    ]);
  }

  function deleteVehicle(id: string) {
    setVehicles((current) => current.filter((vehicle) => vehicle.id !== id));
  }

  async function copyRows() {
    if (!sheetRows) return;
    await navigator.clipboard.writeText(sheetRows);
    setCopied("rows");
    window.setTimeout(() => setCopied(""), 1400);
  }

  function clearAll() {
    if (!window.confirm("정기검사 반자동 양식 내용을 모두 비울까요?")) return;
    setRawText("");
    setVehicles([]);
    setForm(initialInspectionForm);
  }

  return (
    <div className="inspection-workspace inspection-form-workspace">
      <section className="inspection-card inspection-guide-card">
        <div className="transport-panel-heading">
          <div><span>GPT</span><h2>추출 방식</h2></div>
          <small>내장 OCR 없음</small>
        </div>
        <div className="inspection-gpt-note">
          <strong>이미지 OCR 엔진은 별도로 넣지 않습니다.</strong>
          <p>정기검사 대상 화면 캡처를 GPT에 올려 “차량번호만 줄바꿈으로 추출해줘”라고 요청한 뒤, 결과 텍스트를 아래에 붙여넣어 주세요. 이 도구는 붙여넣은 텍스트에서 차량번호만 다시 정리합니다.</p>
          <code>차량번호만 추출해줘. 차량명은 추측하지 말고, 번호만 줄바꿈으로 정리해줘.</code>
        </div>
      </section>

      <section className="inspection-card">
        <div className="transport-panel-heading">
          <div><span>01</span><h2>차량번호 텍스트 붙여넣기</h2></div>
          <button className="transport-copy" type="button" onClick={() => setRawText(EXAMPLE_TEXT)}>예시</button>
        </div>
        <label className="transport-field">
          <span>GPT 추출 결과 또는 복사 텍스트</span>
          <textarea
            className="inspection-ocr-input"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder={"295다8979\n261무2181\n184어5656\n\n텍스트 안에 다른 말이 섞여 있어도 차량번호만 추출합니다."}
          />
        </label>
        <div className="daily-log-actions">
          <button className="platform-button button-primary" type="button" onClick={extractVehicles}>차량번호만 추출</button>
          <button className="platform-button button-outline" type="button" onClick={addVehicle}>수기 행 추가</button>
          <button className="platform-button button-ghost danger-text" type="button" onClick={clearAll}>전체 비우기</button>
        </div>
      </section>

      <section className="inspection-card">
        <div className="transport-panel-heading">
          <div><span>02</span><h2>차량명 / 위치 보완</h2></div>
          <small>{vehicles.length}대</small>
        </div>
        <label className="transport-field inspection-default-location">
          <span>공통 위치</span>
          <input value={form.defaultLocation} onChange={(event) => setForm({ defaultLocation: event.target.value })} placeholder="항동 / 검단 / 상세 위치" />
        </label>
        <div className="inspection-vehicle-list">
          {vehicles.map((vehicle, index) => (
            <article key={vehicle.id}>
              <em>{String(index + 1).padStart(2, "0")}</em>
              <label>
                <span>차량번호</span>
                <input value={vehicle.plateNumber} onChange={(event) => updateVehicle(vehicle.id, "plateNumber", event.target.value)} placeholder="12가3456" />
              </label>
              <label>
                <span>차량명</span>
                <input value={vehicle.vehicleName} onChange={(event) => updateVehicle(vehicle.id, "vehicleName", event.target.value)} placeholder="아반떼" />
              </label>
              <label>
                <span>위치</span>
                <input value={vehicle.location} onChange={(event) => updateVehicle(vehicle.id, "location", event.target.value)} placeholder={form.defaultLocation || "공통 위치 사용"} />
              </label>
              <button className="record-delete-button" type="button" onClick={() => deleteVehicle(vehicle.id)}>삭제</button>
            </article>
          ))}
          {vehicles.length === 0 && <div className="private-empty-state">아직 추출된 차량이 없습니다.</div>}
        </div>
      </section>

      <section className="inspection-card inspection-guide-card">
        <div className="transport-panel-heading">
          <div><span>03</span><h2>양식 출력</h2></div>
          <button className="transport-copy" type="button" onClick={copyRows} disabled={!sheetRows}>{copied === "rows" ? "복사됨" : "행 복사"}</button>
        </div>
        <p className="inspection-output-caption">복사 후 엑셀/구글시트에 붙여넣으면 `차량번호 / 차량명 / 위치` 3개 칸으로 들어갑니다.</p>
        <pre className="inspection-output">{sheetRows || "차량번호\t차량명\t위치"}</pre>
      </section>
    </div>
  );
}

function normalizeVehicles(value: unknown[]): InspectionVehicle[] {
  return value
    .filter((item): item is Partial<InspectionVehicle> => Boolean(item && typeof item === "object"))
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `${Date.now()}-${index}`,
      plateNumber: typeof item.plateNumber === "string" ? item.plateNumber : "",
      vehicleName: typeof item.vehicleName === "string" ? item.vehicleName : "",
      location: typeof item.location === "string" ? item.location : "",
      memo: typeof item.memo === "string" ? item.memo : "",
    }));
}
