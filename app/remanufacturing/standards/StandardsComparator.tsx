"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { BackButton, Breadcrumb, PlatformHeader } from "../../components/platform";
import {
  CATEGORY_OPTIONS,
  GRADES,
  StandardCategory,
  StandardItem,
  VehicleGrade,
  assessStandard,
  createStandardItem,
  describeCondition,
} from "./standards";

const CATEGORIES = Object.keys(CATEGORY_OPTIONS) as StandardCategory[];

export default function StandardsComparator() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [grade, setGrade] = useState<VehicleGrade>("가");
  const [items, setItems] = useState<StandardItem[]>([createStandardItem()]);
  const [hasCompared, setHasCompared] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonRun, setComparisonRun] = useState(0);
  const [copyLabel, setCopyLabel] = useState("전체 복사");
  const compareTimer = useRef<number | undefined>(undefined);

  const assessedItems = useMemo(
    () => items.map((item) => ({ item, result: assessStandard(grade, item) })),
    [grade, items],
  );

  const decisionSummary = useMemo(
    () =>
      assessedItems.reduce<Record<string, number>>((summary, { result }) => {
        summary[result.decision] = (summary[result.decision] ?? 0) + 1;
        return summary;
      }, {}),
    [assessedItems],
  );

  useEffect(() => () => window.clearTimeout(compareTimer.current), []);

  const invalidateComparison = () => {
    window.clearTimeout(compareTimer.current);
    setIsComparing(false);
    setHasCompared(false);
  };

  const outputText = useMemo(() => {
    const title = `[${vehicleNumber.trim() || "차량번호"}] 상품화 기준 대조 결과`;
    const blocks = assessedItems.map(({ item, result }, index) => {
      const extra = result.extra || "없음";
      const opinion = item.opinion.trim() ? `\n- 작업자 의견: ${item.opinion.trim()}` : "";
      return `${items.length > 1 ? `${index + 1}. ${item.category}\n` : ""}- 차량 등급: ${grade}
- 확인 부위: ${item.part.trim() || item.category}
- 현장 상태: ${describeCondition(item)}
- 기준 판정: ${result.decision}
- 적용 기준: ${result.basis}
- 권장 작업: ${result.action}
- 추가 확인: ${extra}${opinion}`;
    });
    return `${title}\n\n${blocks.join("\n\n")}`;
  }, [assessedItems, grade, items.length, vehicleNumber]);

  const updateItem = <K extends keyof StandardItem>(id: string, key: K, value: StandardItem[K]) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
    invalidateComparison();
  };

  const changeCategory = (id: string, category: StandardCategory) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, category, condition: CATEGORY_OPTIONS[category][0].value, count: 1 }
          : item,
      ),
    );
    invalidateComparison();
  };

  const handlePhoto = (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        if (item.photoUrl) URL.revokeObjectURL(item.photoUrl);
        return file
          ? { ...item, photoUrl: URL.createObjectURL(file), photoName: file.name }
          : { ...item, photoUrl: undefined, photoName: undefined };
      }),
    );
  };

  const addItem = () => {
    setItems((current) => [...current, createStandardItem(current.length)]);
    invalidateComparison();
  };

  const removeItem = (id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.photoUrl) URL.revokeObjectURL(target.photoUrl);
      return current.filter((item) => item.id !== id);
    });
    invalidateComparison();
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(outputText);
    setCopyLabel("복사 완료");
    window.setTimeout(() => setCopyLabel("전체 복사"), 1400);
  };

  const compareStandards = () => {
    window.clearTimeout(compareTimer.current);
    setIsComparing(true);
    setHasCompared(false);
    compareTimer.current = window.setTimeout(() => {
      setComparisonRun((current) => current + 1);
      setHasCompared(true);
      setIsComparing(false);
    }, 420);
  };

  return (
    <main className="platform-app standards-page">
      <PlatformHeader />
      <div className="platform-shell">
        <Breadcrumb
          items={[
            { label: "홈", href: "/console" },
            { label: "누락(재상품화) 가이드", href: "/remanufacturing" },
            { label: "상품화 기준 대조" },
          ]}
        />

        <section className="category-hero tone-cyan standards-hero">
          <div>
            <span className="platform-kicker">STANDARD / COMPARATOR</span>
            <h1>상품화 기준 대조</h1>
            <p>차량 등급과 현장 상태를 선택해 상품화 기준에 따른 권장 작업을 확인합니다.</p>
          </div>
          <BackButton href="/remanufacturing" />
        </section>

        <nav className="standards-progress" aria-label="상품화 기준 대조 진행 단계">
          <div className={vehicleNumber.trim() ? "is-complete" : "is-active"}>
            <span>01</span>
            <strong>차량 정보</strong>
            <small>{vehicleNumber.trim() || "차량번호 입력"}</small>
          </div>
          <div className={!hasCompared ? "is-active" : "is-complete"}>
            <span>02</span>
            <strong>상태 확인</strong>
            <small>{items.length}개 항목 준비</small>
          </div>
          <div className={hasCompared ? "is-active" : ""}>
            <span>03</span>
            <strong>기준 결과</strong>
            <small>{hasCompared ? "대조 완료" : "대조 대기"}</small>
          </div>
        </nav>

        <section className="standards-layout">
          <div className="standards-input-column">
            <article className="platform-card standards-base-card">
              <div className="standards-card-heading">
                <div><span className="section-index">01</span><h2>차량 정보</h2></div>
                <span>등급은 직접 선택</span>
              </div>
              <div className="standards-base-fields">
                <label>
                  차량번호
                  <input
                    value={vehicleNumber}
                    onChange={(event) => {
                      setVehicleNumber(event.target.value);
                      invalidateComparison();
                    }}
                    placeholder="예: 12가3456"
                  />
                </label>
                <label>
                  차량 등급
                  <select
                    value={grade}
                    onChange={(event) => {
                      setGrade(event.target.value as VehicleGrade);
                      invalidateComparison();
                    }}
                  >
                    {GRADES.map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
              </div>
            </article>

            <div className="standards-items-heading">
              <div><span className="section-index">02</span><h2>확인 항목</h2></div>
              <button type="button" className="platform-button button-outline" onClick={addItem}>+ 항목 추가</button>
            </div>

            <div className="standards-item-list">
              {items.map((item, index) => (
                <article
                  className="platform-card standards-item-card"
                  key={item.id}
                  style={{ "--item-index": index } as React.CSSProperties}
                >
                  <div className="standards-item-top">
                    <strong>항목 {String(index + 1).padStart(2, "0")}</strong>
                    {items.length > 1 && (
                      <button type="button" className="standards-delete-button" onClick={() => removeItem(item.id)}>
                        삭제
                      </button>
                    )}
                  </div>
                  <div className="standards-form-grid">
                    <label>
                      카테고리
                      <select value={item.category} onChange={(event) => changeCategory(item.id, event.target.value as StandardCategory)}>
                        {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                      </select>
                    </label>
                    <label>
                      확인 부위
                      <input
                        value={item.part}
                        onChange={(event) => updateItem(item.id, "part", event.target.value)}
                        placeholder="예: 운전석 앞 도어, 우측 앞 휠"
                      />
                    </label>
                    <label className="standards-wide-field">
                      현장 상태
                      <select value={item.condition} onChange={(event) => updateItem(item.id, "condition", event.target.value)}>
                        {CATEGORY_OPTIONS[item.category].map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    {["외판 눌림", "흠집", "철 까짐"].includes(item.category) && (
                      <label>
                        개수
                        <input
                          type="number"
                          min={1}
                          value={item.count}
                          onChange={(event) => updateItem(item.id, "count", Math.max(1, Number(event.target.value)))}
                        />
                      </label>
                    )}
                    <label className="standards-wide-field">
                      작업자 의견
                      <textarea
                        value={item.opinion}
                        onChange={(event) => updateItem(item.id, "opinion", event.target.value)}
                        placeholder="예: 약간의 손상이나 운행상 문제는 없다고 판단"
                      />
                    </label>
                    <label className="standards-photo-field">
                      현장 사진 (저장되지 않음)
                      <input type="file" accept="image/*" onChange={(event) => handlePhoto(item.id, event)} />
                    </label>
                  </div>
                  {item.photoUrl && (
                    <figure className="standards-photo-preview">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.photoUrl} alt={`${item.category} 현장 사진 미리보기`} />
                      <figcaption>{item.photoName}</figcaption>
                    </figure>
                  )}
                </article>
              ))}
            </div>

            <button
              type="button"
              className={`platform-button button-primary standards-compare-button${isComparing ? " is-comparing" : ""}`}
              onClick={compareStandards}
              disabled={isComparing}
            >
              <span>{isComparing ? "기준 분석 중" : "상품화 기준 대조하기"}</span>
              <i aria-hidden="true" />
            </button>
          </div>

          <aside className="standards-result-column">
            <article className="platform-card standards-result-panel">
              <div className="standards-card-heading">
                <div><span className="section-index">03</span><h2>대조 결과</h2></div>
                <button type="button" className="platform-button button-outline" onClick={copyOutput} disabled={!hasCompared}>
                  {copyLabel}
                </button>
              </div>

              {isComparing ? (
                <div className="standards-analyzing" role="status">
                  <span className="standards-analyzing-orbit" aria-hidden="true"><i /></span>
                  <strong>선택한 상태를 기준표와 대조하고 있습니다.</strong>
                  <p>{items.length}개 항목의 등급별 경계값을 확인합니다.</p>
                </div>
              ) : !hasCompared ? (
                <div className="standards-empty-result">
                  <strong>기준 대조 전입니다.</strong>
                  <p>차량 등급과 현장 상태를 입력한 뒤 대조 버튼을 눌러주세요.</p>
                </div>
              ) : (
                <div className="standards-result-reveal" key={comparisonRun}>
                  <div className="standards-decision-summary">
                    {Object.entries(decisionSummary).map(([decision, count]) => (
                      <div className={`decision-${decision.replace(/\s/g, "-")}`} key={decision}>
                        <span>{decision}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="standards-result-list">
                    {assessedItems.map(({ item, result }, index) => (
                      <section
                        className={`standards-result-card decision-${result.decision.replace(/\s/g, "-")}`}
                        key={item.id}
                        style={{ "--result-index": index } as React.CSSProperties}
                      >
                        <header>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <div><strong>{item.category}</strong><small>{item.part || item.category}</small></div>
                          <em>{result.decision}</em>
                        </header>
                        <dl>
                          <div><dt>현장 상태</dt><dd>{describeCondition(item)}</dd></div>
                          <div><dt>적용 기준</dt><dd>{result.basis}</dd></div>
                          <div><dt>권장 작업</dt><dd>{result.action}</dd></div>
                          <div><dt>추가 확인</dt><dd>{result.extra}</dd></div>
                        </dl>
                      </section>
                    ))}
                  </div>
                  <pre className="standards-copy-preview">{outputText}</pre>
                </div>
              )}

              <div className="standards-caution">
                <strong>CHECK</strong>
                <span>이 결과는 제공된 상품화 기준을 빠르게 대조하는 보조 자료입니다. 애매한 상태는 판매팀과 최종 확인하세요.</span>
              </div>
            </article>
          </aside>
        </section>
      </div>
      <footer className="platform-footer">
        <strong>PDI BACKOFFICE PLATFORM</strong>
        <span>Standard comparison tool</span>
      </footer>
    </main>
  );
}
