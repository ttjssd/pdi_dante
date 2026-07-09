"use client";

import { useState } from "react";
import { M2_TOWING_TAGS } from "../../transport-issue-helper/issueTemplates";

const TOWING_REQUEST_TEXT = `${M2_TOWING_TAGS}
매니저님,

위 차량 M2 견인 부탁드려도 될까요?

+ M2 입고 시 C구역 C47~C49 구역에 주차`;

export default function TowingRequestClient() {
  const [copied, setCopied] = useState("");

  async function copyText(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    window.setTimeout(() => setCopied(""), 1400);
  }

  return (
    <div className="jeju-workspace towing-request-workspace">
      <section className="jeju-result-card">
        <div className="transport-panel-heading">
          <div><span>01</span><h2>보내는 양식</h2></div>
          <button className="transport-copy" type="button" onClick={() => copyText("request", TOWING_REQUEST_TEXT)}>
            {copied === "request" ? "복사됨" : "양식 복사"}
          </button>
        </div>
        <pre>{TOWING_REQUEST_TEXT}</pre>
      </section>

      <aside className="jeju-manager-card">
        <div>
          <span>REFERENCE</span>
          <h2>탁송 중 견인 태그</h2>
        </div>
        <dl>
          <div><dt>담당자</dt><dd>@김요한 · @손인환 · @김승현</dd></div>
          <div><dt>CC</dt><dd>@knox · @hardy</dd></div>
          <div><dt>주차 안내</dt><dd>C구역 C47~C49</dd></div>
        </dl>
        <p>슬랙 링크 없이 멘션 텍스트만 사용합니다. M2 입고 시 C구역 C47~C49 구역에 주차하도록 안내합니다.</p>
      </aside>
    </div>
  );
}
