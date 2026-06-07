const endpoint = process.argv[2] || "http://127.0.0.1:9333/json";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const pages = await (await fetch(endpoint)).json();
  const page = pages.find((item) => item.type === "page");
  if (!page) throw new Error("Electron page not found");

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
    return response.result.result.value;
  };

  await send("Runtime.enable");

  const startText = await evaluate('document.body.innerText.includes("START CONSOLE")');
  await evaluate('document.querySelector(".launcher-start-button")?.click()');
  await delay(250);
  const loadingVisible = await evaluate(
    'document.body.innerText.includes("LOADING CONSOLE") && document.body.innerText.includes("SYSTEM INITIALIZING") && document.body.innerText.includes("Workspace Check")',
  );
  await delay(1900);
  const pathname = await evaluate("location.pathname");
  const collapsed = await evaluate(
    'Array.from(document.querySelectorAll(".update-group-trigger")).every((el) => el.getAttribute("aria-expanded") === "false")',
  );

  console.log(JSON.stringify({ startText, loadingVisible, pathname, collapsed }, null, 2));
  ws.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
