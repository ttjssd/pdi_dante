"use client";

import { ChangeEvent, useMemo, useState } from "react";
import {
  CATEGORIES,
  categoryConditions,
  createStandardItem,
  evaluateStandard,
  GRADES,
  type Grade,
  type StandardCategory,
  type StandardItem,
} from "./standardsEngine";

type PreviewMap = Record<string, string>;

export default function StandardsCheckClient() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [grade, setGrade] = useState<Grade>("가");
  const [items, setItems] = useState<StandardItem[]>([createStandardItem()]);
  const [previews, setPreviews] = useState<PreviewMap>({});
  const [message, setMessage] = useState("");

  const results = useMemo(
    () => items.map((item) => ({ item, decision: evaluateStandard(item, grade) })),
    [grade, items],
  );

  const copyText = useMemo(() => {
    const lines = [`[${vehicleNumber || "차량번호"}] 상품화 기준 대조 결과`];
    results.forEach(({ item, decision }, index) => {
      if (results.length > 1) lines.push("", `${index + 1}. ${item.category}`);
      lines.push(
        `- 차량 등급: ${grade}`,
        `- 확인 부위: ${item.part || item.category}`,
        `- 현장 상태: ${item.workerOpinion || item.condition}`,
        `- 기준 판정: ${decision.verdict}`,
        `- 적용 기준: ${decision.basis}`,
        `- 권장 작업: ${decision.action}`,
        `- 추가 확인: ${decision.additionalCheck || "없음"}`,
      );
    });
    return lines.join("\n");
  }, [grade, results, vehicleNumber]);

  function updateItem(id: string, patch: Partial<StandardItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function changeCategory(id: string, category: StandardCategory) {
    updateItem(id, {
      category,
      condition: categoryConditions(category)[0],
      count: 1,
      size: 0,
      secondarySize: 0,
      location: "",
      exposed: "아니오",
    });
  }

  function addItem() {
    setItems((current) => [...current, createStandardItem()]);
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    setPreviews((current) => {
      if (current[id]) URL.revokeObjectURL(current[id]);
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function selectPhoto(id: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviews((current) => {
      if (current[id]) URL.revokeObjectURL(current[id]);
      return { ...current, [id]: URL.createObjectURL(file) };
    });
  }

  async function copyResult() {
    await navigator.clipboard.writeText(copyText);
    setMessage("상품화 기준 대조 결과를 복사했습니다.");
    window.setTimeout(() => setMessage(""), 1600);
  }

  return (
    <div className="standards-workspace">
      <section className="standards-base-card">
        <div className="standards-heading">
          <span>01</span>
          <div><h2>차량 정보</h2><p>차량 등급은 작업자가 직접 선택합니다.</p></div>
        </div>
        <div className="standards-base-grid">
          <label><span>차량번호</span><input value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value)} placeholder="12가3456" /></label>
          <label><span>차량 등급</span><select value={grade} onChange={(event) => setGrade(event.target.value as Grade)}>{GRADES.map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
      </section>

      <section className="standards-items-section">
        <div className="standards-heading">
          <span>02</span>
          <div><h2>확인 항목</h2><p>한 차량에 여러 항목을 추가해 동시에 대조할 수 있습니다.</p></div>
          <button className="platform-button button-outline" type="button" onClick={addItem}>항목 추가</button>
        </div>
        <div className="standards-item-list">
          {items.map((item, index) => (
            <article className="standards-item-card" key={item.id}>
              <div className="standards-item-top">
                <strong>{String(index + 1).padStart(2, "0")} · {item.category}</strong>
                {items.length > 1 && <button type="button" onClick={() => removeItem(item.id)}>삭제</button>}
              </div>
              <div className="standards-form-grid">
                <label><span>카테고리</span><select value={item.category} onChange={(event) => changeCategory(item.id, event.target.value as StandardCategory)}>{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label>
                <label><span>확인 부위</span><input value={item.part} onChange={(event) => updateItem(item.id, { part: event.target.value })} placeholder="예: 운전석 앞 도어, 좌측 앞 휠" /></label>
                <label className="field-wide"><span>기준 조건</span><select value={item.condition} onChange={(event) => updateItem(item.id, { condition: event.target.value })}>{categoryConditions(item.category).map((value) => <option key={value}>{value}</option>)}</select></label>
                <CategoryFields item={item} update={(patch) => updateItem(item.id, patch)} />
                <label className="field-wide"><span>작업자 의견 / 현장 상태</span><textarea value={item.workerOpinion} onChange={(event) => updateItem(item.id, { workerOpinion: event.target.value })} placeholder="예: 휠 굴절 확인, 운행에는 문제없어 보임" /></label>
                <label className="standards-photo-field">
                  <span>현장 사진 · 저장되지 않음</span>
                  <input type="file" accept="image/*" onChange={(event) => selectPhoto(item.id, event)} />
                  {previews[item.id] && <img src={previews[item.id]} alt={`${item.category} 현장 미리보기`} />}
                </label>
              </div>
              <DecisionPreview item={item} grade={grade} />
            </article>
          ))}
        </div>
      </section>

      <section className="standards-result-card">
        <div className="standards-heading">
          <span>03</span>
          <div><h2>상품화 기준 대조 결과</h2><p>기준표에 따른 판단 보조 결과이며 최종 결정은 작업자가 확인합니다.</p></div>
          <button className="platform-button button-primary" type="button" onClick={copyResult}>전체 복사</button>
        </div>
        <pre>{copyText}</pre>
      </section>
      {message && <div className="standards-toast" role="status">{message}</div>}
    </div>
  );
}

function CategoryFields({ item, update }: { item: StandardItem; update: (patch: Partial<StandardItem>) => void }) {
  if (["외판 눌림", "흠집", "철 까짐"].includes(item.category)) {
    return (
      <>
        <label><span>개수</span><input type="number" min="0" value={item.count} onChange={(event) => update({ count: Number(event.target.value) })} /></label>
        {item.category === "흠집" && <label><span>차체 노출</span><select value={item.exposed} onChange={(event) => update({ exposed: event.target.value })}><option>아니오</option><option>예</option></select></label>}
      </>
    );
  }
  if (item.category === "틴팅") {
    return <label><span>좌석 위치</span><select value={item.location} onChange={(event) => update({ location: event.target.value })}><option value="">선택</option><option>운전석</option><option>조수석</option></select></label>;
  }
  if (item.category === "타이어" && item.condition === "계절 타이어 구성") {
    return <label><span>판매 유형</span><select value={item.location} onChange={(event) => update({ location: event.target.value })}><option value="">선택</option><option>리볼트</option><option>인증 중고차</option></select></label>;
  }
  return null;
}

function DecisionPreview({ item, grade }: { item: StandardItem; grade: Grade }) {
  const result = evaluateStandard(item, grade);
  return (
    <div className={`standards-decision verdict-${result.verdict.replace(/\s/g, "-")}`}>
      <div><span>기준 판정</span><strong>{result.verdict}</strong></div>
      <div><span>권장 작업</span><strong>{result.action}</strong></div>
      <p>{result.basis}</p>
      {result.additionalCheck && <small>추가 확인: {result.additionalCheck}</small>}
    </div>
  );
}
