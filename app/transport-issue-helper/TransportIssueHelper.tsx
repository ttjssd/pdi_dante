"use client";

import { useEffect, useMemo, useState } from "react";
import { issueTemplates, recommendIssue, extractVehicleNumber, buildIssueShareText, type RiskLevel } from "./issueTemplates";

const HISTORY_KEY = "pdi-transport-issue-history-v1";
const REMINDER_TAG_TEXT = [
  "렌톡 태그 대상자 리마인드 cc @ethan @moby @juniper @dante @wood",
  "1. 사고건 이슈 : @김요한 @손인환 @김승현",
  "2. 탁송중 이슈 : @박은희 @이미혜 cc. @김경민 @김윤선",
  "3. 제주 탁송 문의 건 : @고채현 @김경민",
].join("\n");
const REMINDER_TAGS = [
  { label: "사고건 이슈", tags: "@김요한 @손인환 @김승현" },
  { label: "탁송중 이슈", tags: "@박은희 @이미혜 cc. @김경민 @김윤선" },
  { label: "제주 탁송 문의 건", tags: "@고채현 @김경민" },
];

type IssueHistoryItem = {
  id: string;
  createdAt: string;
  rawText: string;
  vehicleNumber: string;
  selectedId: string;
  risk: RiskLevel;
  reasons: string[];
};

function CopyButton({ id, text, copiedId, onCopy }: { id: string; text: string; copiedId: string; onCopy: (id: string, text: string) => void }) {
  return <button className="transport-copy" type="button" onClick={() => onCopy(id, text)}>{copiedId === id ? "복사됨" : "복사"}</button>;
}

function riskClass(risk: RiskLevel) {
  return risk === "높음" ? "high" : risk === "주의" ? "caution" : risk === "낮음" ? "low" : "check";
}

export default function TransportIssueHelper() {
  const [rawText, setRawText] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [selectedId, setSelectedId] = useState("handover");
  const [risk, setRisk] = useState<RiskLevel>("확인 필요");
  const [recommendationReasons, setRecommendationReasons] = useState<string[]>([]);
  const [notice, setNotice] = useState("원문을 입력하면 위험도가 높은 이슈 유형을 우선 추천합니다.");
  const [copiedId, setCopiedId] = useState("");
  const [history, setHistory] = useState<IssueHistoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      localStorage.removeItem(HISTORY_KEY);
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (historyLoaded) localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history, historyLoaded]);

  const selected = useMemo(
    () => issueTemplates.find((template) => template.id === selectedId) ?? issueTemplates[0],
    [selectedId],
  );
  const internalMessage = buildIssueShareText(selected, vehicleNumber);
  const fullText = [
    `[${risk}] ${selected.title}`,
    "",
    "[우선 확인사항]",
    ...selected.checks.map((item) => `- ${item}`),
    "",
    "[기사님에게 요청할 정보]",
    ...selected.requests.map((item) => `- ${item}`),
    "",
    "[기사님 답변 추천]",
    selected.driverReply,
    "",
    "[보내는 양식]",
    internalMessage,
    "",
    "[주행/이동 가이드]",
    selected.movementGuide,
  ].join("\n");

  function analyze() {
    const recommendation = recommendIssue(rawText);
    setSelectedId(recommendation.template.id);
    setRisk(recommendation.risk);
    setRecommendationReasons(recommendation.reasons);
    const extractedVehicle = extractVehicleNumber(rawText);
    const nextVehicleNumber = extractedVehicle || vehicleNumber;
    if (extractedVehicle) setVehicleNumber(extractedVehicle);
    setNotice(`${recommendation.template.title} 유형을 추천했습니다. 현장 상황을 확인한 뒤 문구를 사용해 주세요.`);
    setHistory((current) => [{
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      rawText,
      vehicleNumber: nextVehicleNumber,
      selectedId: recommendation.template.id,
      risk: recommendation.risk,
      reasons: recommendation.reasons,
    }, ...current].slice(0, 10));
  }

  function selectTemplate(id: string) {
    const template = issueTemplates.find((item) => item.id === id);
    if (!template) return;
    setSelectedId(id);
    setRisk(template.risk);
    setRecommendationReasons(["수동 선택"]);
    setNotice("선택한 이슈 유형의 템플릿을 불러왔습니다.");
  }

  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(""), 1400);
  }

  function restoreHistory(item: IssueHistoryItem) {
    setRawText(item.rawText);
    setVehicleNumber(item.vehicleNumber);
    setSelectedId(item.selectedId);
    setRisk(item.risk);
    setRecommendationReasons(item.reasons);
    setNotice("최근 분석 기록을 다시 불러왔습니다.");
  }

  return (
    <>
      <section className="transport-reminder-card">
        <div className="transport-panel-heading">
          <div><span>!</span><h2>렌톡 태그 대상자 리마인드</h2></div>
          <button className="transport-copy" type="button" onClick={() => copyText("reminder-tags", REMINDER_TAG_TEXT)}>
            {copiedId === "reminder-tags" ? "복사됨" : "공지 복사"}
          </button>
        </div>
        <p>cc @ethan @moby @juniper @dante @wood</p>
        <div className="transport-reminder-list">
          {REMINDER_TAGS.map((item, index) => (
            <div key={item.label}>
              <strong>{index + 1}. {item.label}</strong>
              <span>{item.tags}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="transport-workspace">
      <section className="transport-input-panel">
        <div className="transport-panel-heading">
          <div><span>01</span><h2>탁송 이슈 입력</h2></div>
          <small>위험도 우선 자동 추천</small>
        </div>
        <label className="transport-field">
          <span>기사님 문의 / 현장 원문</span>
          <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} placeholder="예: [12가3456] 탁송 중 타이어 펑크로 견인이 필요합니다." />
        </label>
        <label className="transport-field transport-vehicle-field">
          <span>차량번호</span>
          <input value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value)} placeholder="12가3456" />
        </label>
        <button className="platform-button button-primary transport-analyze" type="button" onClick={analyze}>이슈 분석하기</button>
        <p className="transport-notice">{notice}</p>

        <div className="transport-template-picker">
          <div className="transport-picker-heading">
            <span>TYPE SELECT</span>
            <strong>이슈 유형 바로 선택</strong>
          </div>
          <div className="transport-template-grid">
            {issueTemplates.map((template) => (
              <button
                className={template.id === selectedId ? "is-selected" : ""}
                type="button"
                key={template.id}
                onClick={() => selectTemplate(template.id)}
              >
                <span className={`transport-risk risk-${riskClass(template.risk)}`}>{template.risk}</span>
                <strong>{template.title}</strong>
                <small>{template.checks.slice(0, 2).join(" · ")}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="transport-result-panel">
        <div className="transport-panel-heading">
          <div><span>02</span><h2>보내는 양식 / 참고 결과</h2></div>
          <button className="transport-copy transport-copy-all" type="button" onClick={() => copyText("all", fullText)}>{copiedId === "all" ? "전체 복사됨" : "전체 복사"}</button>
        </div>

        <div className="transport-result-head">
          <div className="transport-result-title">
            <div>
              <span className={`transport-risk risk-${riskClass(risk)}`}>{risk}</span>
              <h2>{selected.title}</h2>
            </div>
            {recommendationReasons.length > 0 && (
              <p className="transport-reasons">
                <b>추천 근거</b>
                {recommendationReasons.map((reason) => <span key={reason}>{reason}</span>)}
              </p>
            )}
          </div>
          {risk === "높음" && <strong>추가 주행 보류 후 확인</strong>}
        </div>

        <div className="transport-result-grid">
          <article className="transport-message-card transport-send-card">
            <div><h3>보내는 양식</h3><CopyButton id="send" text={internalMessage} copiedId={copiedId} onCopy={copyText} /></div>
            <p>{internalMessage}</p>
          </article>
          <article className="transport-info-card">
            <div className="transport-card-heading">
              <h3>우선 확인사항</h3>
              <CopyButton id="checks" text={selected.checks.map((item) => `- ${item}`).join("\n")} copiedId={copiedId} onCopy={copyText} />
            </div>
            <ul>{selected.checks.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="transport-info-card">
            <div className="transport-card-heading">
              <h3>기사님에게 요청할 정보</h3>
              <CopyButton id="requests" text={selected.requests.map((item) => `- ${item}`).join("\n")} copiedId={copiedId} onCopy={copyText} />
            </div>
            <ul>{selected.requests.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="transport-message-card">
            <div><h3>기사님 답변 추천 문구</h3><CopyButton id="driver" text={selected.driverReply} copiedId={copiedId} onCopy={copyText} /></div>
            <p>{selected.driverReply}</p>
          </article>
          <article className="transport-message-card">
            <div><h3>내부 공유 참고 문구</h3><CopyButton id="internal" text={internalMessage} copiedId={copiedId} onCopy={copyText} /></div>
            <p>{internalMessage}</p>
          </article>
          <article className="transport-guide-card">
            <div><h3>주행/이동 가이드</h3><CopyButton id="guide" text={selected.movementGuide} copiedId={copiedId} onCopy={copyText} /></div>
            <p>{selected.movementGuide}</p>
          </article>
        </div>
      </section>
      </div>

      <section className="jeju-history transport-history">
        <div className="transport-panel-heading">
          <div><span>03</span><h2>최근 분석 기록</h2></div>
          {history.length > 0 && <button className="transport-copy danger-copy" type="button" onClick={() => setHistory([])}>전체 삭제</button>}
        </div>
        {history.length === 0 ? (
          <p className="jeju-history-empty">최근 분석 기록이 없습니다.</p>
        ) : (
          <div className="jeju-history-list">
            {history.map((item) => {
              const template = issueTemplates.find((candidate) => candidate.id === item.selectedId);
              return (
                <button type="button" key={item.id} onClick={() => restoreHistory(item)}>
                  <time>{new Date(item.createdAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</time>
                  <strong>{item.vehicleNumber || "차량번호 미입력"}</strong>
                  <span>{template?.title ?? "기타 확인 필요"}</span>
                  <em>{item.risk}</em>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
