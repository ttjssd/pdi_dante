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
    'document.querySelector(".launcher-start-button")?.textContent.includes("START") && document.body.innerText.includes("v1.8.1")',
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

  await send("Page.navigate", { url: "http://127.0.0.1:3187/hangdong-guide" });
  await delay(900);
  const hangdongPath = await evaluate("location.pathname");
  const hangdongReady = await evaluate(
    'document.body.innerText.includes("항동센터 가이드") && document.body.innerText.includes("입고 차량 중 상품화 누락 후 복귀차량")',
  );

  await send("Page.navigate", { url: "http://127.0.0.1:3187/settings" });
  await delay(900);
  const settingsPath = await evaluate("location.pathname");
  const settingsReady = await evaluate(
    'document.body.innerText.includes("프라이빗 모드 설정") && document.body.innerText.includes("영상 재생 목록") && document.body.innerText.includes("영상 밝기") && document.body.innerText.includes("앱 시작 시 업무 모드")',
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
    launcherEntryStructure,
    entryGone,
    loadingVisible,
    consolePath,
    collapsed,
    noLauncherBackLink,
    hasHangdongCard,
    hangdongPath,
    hangdongReady,
    settingsPath,
    settingsReady,
    codeCutRecommended,
  };
  console.log(JSON.stringify(result, null, 2));

  const failed = Object.entries(result).filter(([key, value]) => {
    if (["initialPath", "consolePath", "hangdongPath", "settingsPath"].includes(key)) return false;
    if (key === "launcherEntryStructure") return false;
    return value !== true;
  });
  if (
    result.initialPath !== "/" ||
    result.consolePath !== "/console" ||
    result.hangdongPath !== "/hangdong-guide" ||
    result.settingsPath !== "/settings" ||
    failed.length
  ) {
    throw new Error(
      `Electron verification failed: ${JSON.stringify({
        failed,
        paths: {
          initialPath: result.initialPath,
          consolePath: result.consolePath,
          hangdongPath: result.hangdongPath,
          settingsPath: result.settingsPath,
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
