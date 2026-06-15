const endpoint = process.argv[2] || "http://127.0.0.1:9333/json";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForPage() {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    try {
      const pages = await (await fetch(endpoint)).json();
      const page = pages.find(
        (item) => item.type === "page" && item.url && item.url.includes("127.0.0.1:3187"),
      );
      if (page) return page;
    } catch {}
    await delay(250);
  }
  throw new Error("Electron page not found");
}

async function main() {
  const page = await waitForPage();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  };

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const message = { id: ++id, method, params };
      pending.set(message.id, resolve);
      ws.send(JSON.stringify(message));
    });

  const evaluate = async (expression) => {
    const response = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (response.error) {
      throw new Error(response.error.message || "Runtime evaluation failed");
    }
    if (response.result?.exceptionDetails) {
      throw new Error(response.result.exceptionDetails.text || "Runtime evaluation failed");
    }
    if (!response.result?.result) {
      throw new Error(`Runtime evaluation returned no result: ${JSON.stringify(response)}`);
    }
    return response.result.result.value;
  };

  await send("Runtime.enable");
  await send("Page.enable");

  await evaluate(`new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      if (document.querySelector(".launcher-start-button") || Date.now() - started > 10000) resolve(true);
      else setTimeout(check, 100);
    };
    check();
  })`);

  const initialPath = await evaluate("location.pathname");
  const launcherText = await evaluate(
    'document.querySelector(".launcher-start-button")?.textContent.includes("START") && document.body.innerText.includes("v1.9.7")',
  );
  const localBackgroundBridge = await evaluate(
    'Boolean(window.pdiBackgrounds && window.pdiBackgrounds.list && window.pdiBackgrounds.add && window.pdiBackgrounds.remove)',
  );
  const updaterBridgeReady = await evaluate(
    'Boolean(window.pdiUpdater && window.pdiUpdater.onStatus && window.pdiUpdater.restartToUpdate)',
  );
  const localBackgroundsReadable = await evaluate(
    'window.pdiBackgrounds.list().then((items) => Array.isArray(items) && items.every((item) => item.url.startsWith("pdi-media://backgrounds/")))',
  );
  const localBackgroundMediaLoads = await evaluate(
    'window.pdiBackgrounds.list().then(async (items) => items.length > 0 && (await fetch(items[0].url)).ok)',
  );
  const launcherEntryStructure = await evaluate(
    'Boolean(document.querySelector(".launcher-entry-loading")) || document.body.innerText.includes("LAUNCHER INITIALIZING") || document.body.innerText.includes("READYING LAUNCHER")',
  );
  await delay(1100);
  const entryGone = await evaluate('!document.querySelector(".launcher-entry-loading")');
  await evaluate('document.querySelector(".launcher-start-button")?.click()');
  await delay(250);
  const loadingVisible = await evaluate(
    'document.body.innerText.includes("LOADING CONSOLE") && document.body.innerText.includes("SYSTEM INITIALIZING") && document.body.innerText.includes("Workspace Check")',
  );
  await evaluate(`new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      if (location.pathname === "/console" || Date.now() - started > 5000) resolve(true);
      else setTimeout(check, 100);
    };
    check();
  })`);
  const consolePath = await evaluate("location.pathname");
  const collapsed = await evaluate(
    'Array.from(document.querySelectorAll(".update-group-trigger")).every((el) => el.getAttribute("aria-expanded") === "false")',
  );
  const noLauncherBackLink = await evaluate('!document.body.innerText.includes("런처로 돌아가기")');
  const hasHangdongCard = await evaluate('document.body.innerText.includes("항동센터 가이드")');
  const hasOperationsCard = await evaluate('document.body.innerText.includes("업무일지 / 주간 리포트")');

  await send("Page.navigate", { url: "http://127.0.0.1:3187/hangdong-guide" });
  await delay(900);
  const hangdongPath = await evaluate("location.pathname");
  const hangdongReady = await evaluate(
    'document.body.innerText.includes("항동센터 가이드") && document.body.innerText.includes("입고 차량 중 상품화 누락 후 복귀차량") && document.body.innerText.includes("연락처 모음")',
  );
  await send("Page.navigate", { url: "http://127.0.0.1:3187/hangdong-guide/contacts" });
  await delay(700);
  const contactsPath = await evaluate("location.pathname");
  const contactsReady = await evaluate(
    'document.body.innerText.includes("연락처 모음") && document.body.innerText.includes("협력 업체 연락처") && document.body.innerText.includes("판매 매니저 연락처") && document.body.innerText.includes("연락처 등록 / 관리") && !document.querySelector(".hangdong-contact-management").open',
  );
  await evaluate('document.querySelector(".hangdong-contact-management").open = true');
  await delay(100);
  const contactManagementReady = await evaluate(
    'document.body.innerText.includes("연락처 한 번에 붙여넣기") && document.body.innerText.includes("GitHub와 설치파일에는 실제 연락처가 포함되지 않습니다.")',
  );
  const originalContacts = await evaluate('localStorage.getItem("pdi-hangdong-contacts-v1")');
  await evaluate('localStorage.removeItem("pdi-hangdong-contacts-v1")');
  await evaluate(`(() => {
    const inputs = document.querySelectorAll(".hangdong-contact-editor input");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(inputs[0], "테스트 업체");
    inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
    setter.call(inputs[1], "000-0000-0000");
    inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("연락처 등록"))?.click();
  })()`);
  await delay(200);
  const localContactsReady = await evaluate(
    'document.body.innerText.includes("테스트 업체") && JSON.parse(localStorage.getItem("pdi-hangdong-contacts-v1") || "[]").some((contact) => contact.name === "테스트 업체" && contact.phone === "000-0000-0000")',
  );
  await evaluate(`(() => {
    const textarea = document.querySelector(".hangdong-contact-bulk textarea");
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
    setter.call(textarea, "1. 루이스 (lewis) : 010-1111-2222\\n2. 테스트 유리 : 010-3333-4444\\n   - 유리 복원");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("분석 후 일괄 등록"))?.click();
  })()`);
  await delay(200);
  const bulkContactsReady = await evaluate(
    'JSON.parse(localStorage.getItem("pdi-hangdong-contacts-v1") || "[]").some((contact) => contact.name === "루이스" && contact.label === "@lewis") && JSON.parse(localStorage.getItem("pdi-hangdong-contacts-v1") || "[]").some((contact) => contact.name === "테스트 유리" && contact.note.includes("유리 복원"))',
  );
  await evaluate(
    originalContacts === null
      ? 'localStorage.removeItem("pdi-hangdong-contacts-v1")'
      : `localStorage.setItem("pdi-hangdong-contacts-v1", ${JSON.stringify(originalContacts)})`,
  );

  await send("Page.navigate", { url: "http://127.0.0.1:3187/operations" });
  await delay(900);
  const operationsPath = await evaluate("location.pathname");
  const operationsReady = await evaluate(
    'document.body.innerText.includes("일일 업무일지 · 주간 리포트") && document.body.innerText.includes("일일 업무일지 등록") && document.body.innerText.includes("주간 핵심 수치 취합") && document.body.innerText.includes("주간 기록 상태") && document.body.innerText.includes("JSON 내보내기")',
  );
  const originalDailyRecords = await evaluate('localStorage.getItem("pdi-daily-work-log-v1")');
  await evaluate('localStorage.removeItem("pdi-daily-work-log-v1")');
  await evaluate(`(() => {
    const textarea = document.querySelector(".daily-log-raw");
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
    setter.call(textarea, \`[06/09 (화) 항동 - PDI 일일 업무일지]
• 금일 입고 완료 - 12대
• 차량출고준비 - 14대
  (준비 중, 특이사항 차량 총 3대)
• 금일 탁송 인계 - 11대
• 항동 관리 업무
  ○ 재고 실사 진행
[항동 PDI 인사]
• 8TO16
  ○ poty, soom
• 올도 PDI 지원
  ○ wood
• 연차
  ○ musk (6/9)\`);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await evaluate(
    'Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("일일 업무일지 등록"))?.click()',
  );
  await delay(350);
  const operationsParsed = await evaluate(
    'document.body.innerText.includes("입고 12 · 출고 11 · 출고준비 14 · 특이사항 3") && JSON.parse(localStorage.getItem("pdi-daily-work-log-v1") || "[]").some((record) => record.dailyInboundCount === 12 && record.dailyReadyCount === 14 && record.dailyTransportHandOverCount === 11 && record.specialReadyCount === 3)',
  );
  const weeklyCoverageReady = await evaluate(
    'document.querySelectorAll(".weekly-coverage-grid > article").length === 7 && document.body.innerText.includes("주간 기록 상태") && document.body.innerText.includes("미등록") && document.body.innerText.includes("예정")',
  );
  await evaluate(
    originalDailyRecords === null
      ? 'localStorage.removeItem("pdi-daily-work-log-v1")'
      : `localStorage.setItem("pdi-daily-work-log-v1", ${JSON.stringify(originalDailyRecords)})`,
  );

  await send("Page.navigate", { url: "http://127.0.0.1:3187/transport-tools/issue-helper" });
  await delay(900);
  await evaluate(`(() => {
    const textarea = document.querySelector("textarea");
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
    setter.call(textarea, "[261무7835] 제네시스 더 올 뉴 G80 조 뒤 타이어 코드절상 275/35/20 황동 인근 타이어점 재고 없음 M2 입고 진행");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await delay(100);
  await evaluate(
    'Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes("이슈 분석하기"))?.click()',
  );
  await delay(300);
  const codeCutRecommended = await evaluate(
    'document.body.innerText.includes("타이어 코드절상 / 재고 없음 / M2 입고 안내") && document.body.innerText.includes("M2 입고 진행하겠습니다")',
  );

  const result = {
    initialPath,
    launcherText,
    updaterBridgeReady,
    localBackgroundBridge,
    localBackgroundsReadable,
    localBackgroundMediaLoads,
    launcherEntryStructure,
    entryGone,
    loadingVisible,
    consolePath,
    collapsed,
    noLauncherBackLink,
    hasHangdongCard,
    hasOperationsCard,
    hangdongPath,
    hangdongReady,
    contactsPath,
    contactsReady,
    contactManagementReady,
    localContactsReady,
    bulkContactsReady,
    operationsPath,
    operationsReady,
    operationsParsed,
    weeklyCoverageReady,
    codeCutRecommended,
  };
  console.log(JSON.stringify(result, null, 2));

  const failed = Object.entries(result).filter(([key, value]) => {
    if (["initialPath", "consolePath", "hangdongPath", "contactsPath", "operationsPath"].includes(key)) return false;
    if (key === "launcherEntryStructure") return false;
    return value !== true;
  });
  if (
    result.initialPath !== "/" ||
    result.consolePath !== "/console" ||
    result.hangdongPath !== "/hangdong-guide" ||
    result.contactsPath !== "/hangdong-guide/contacts" ||
    result.operationsPath !== "/operations" ||
    failed.length
  ) {
    throw new Error(
      `Electron verification failed: ${JSON.stringify({
        failed,
        paths: {
          initialPath: result.initialPath,
          consolePath: result.consolePath,
          hangdongPath: result.hangdongPath,
          contactsPath: result.contactsPath,
          operationsPath: result.operationsPath,
        },
      })}`,
    );
  }
  ws.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
