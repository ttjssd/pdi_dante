import { writeFile } from "node:fs/promises";

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const endpoint = process.argv[2] || "http://127.0.0.1:9444/json";
const pages = await (await fetch(endpoint)).json();
const page = pages.find((candidate) => candidate.type === "page");

if (!page) {
  throw new Error("Launcher page was not found.");
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
let requestId = 0;
const pending = new Map();

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
};

await new Promise((resolve) => {
  socket.onopen = resolve;
});

const send = (method, params = {}) =>
  new Promise((resolve) => {
    requestId += 1;
    pending.set(requestId, resolve);
    socket.send(JSON.stringify({ id: requestId, method, params }));
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

const before = {
  phase: await evaluate("document.body.dataset.phase"),
  current: await evaluate("document.querySelector('#appVersionFooter').textContent"),
  latest: await evaluate("window.pdiLauncher.getState().then((state) => state.latestVersion)"),
  updateAvailable: await evaluate("window.pdiLauncher.getState().then((state) => state.updateAvailable)"),
  actionLabel: await evaluate("document.querySelector('#startLabel').textContent"),
};

if (process.argv.includes("--apply")) {
  await evaluate("document.querySelector('#startButton').click()");
}

let phase = before.phase;
if (process.argv.includes("--apply") || process.argv.includes("--wait-terminal")) {
  for (let attempt = 0; attempt < 180; attempt += 1) {
    await delay(1000);
    phase = await evaluate("document.body.dataset.phase");
    if (["complete", "ready", "available", "error"].includes(phase)) break;
  }
}

if (process.argv.includes("--unlock-private")) {
  await evaluate("window.pdiLauncher.setPrivateMode('3333')");
  await delay(500);
}

if (process.argv.includes("--open-settings")) {
  await evaluate("document.querySelector('#settingsButton').click()");
  await delay(300);
}

if (process.argv.includes("--select-background")) {
  await evaluate("window.pdiLauncher.selectBackground()");
  await delay(500);
}

if (process.argv.includes("--reset-background")) {
  await evaluate("window.pdiLauncher.resetBackground()");
  await delay(500);
}

if (process.argv.includes("--simulate-update-needed")) {
  await evaluate("render({ ...currentState, phase: 'available', busy: false, canStart: true, updateAvailable: true })");
  await delay(200);
}

const after = {
  phase,
  current: await evaluate("document.querySelector('#appVersionFooter').textContent"),
  latest: await evaluate("window.pdiLauncher.getState().then((state) => state.latestVersion)"),
  message: await evaluate("document.querySelector('#progressLabel').textContent"),
  startEnabled: await evaluate("!document.querySelector('#startButton').disabled"),
  actionLabel: await evaluate("document.querySelector('#startLabel').textContent"),
  privateModeActive: await evaluate("document.body.classList.contains('private-mode-active')"),
  privateStatus: await evaluate("document.querySelector('#privateModeLabel').textContent"),
  backgroundVisible: await evaluate("document.querySelector('#privateBackground').classList.contains('is-active')"),
  backgroundVideoVisible: await evaluate("document.querySelector('#privateVideo').classList.contains('is-active')"),
  backgroundVideoSource: await evaluate("document.querySelector('#privateVideo').getAttribute('src') || ''"),
};

if (process.argv.includes("--start") && after.startEnabled) {
  await evaluate("document.querySelector('#startButton').click()");
  await delay(6000);
  after.startMessage = await evaluate("document.querySelector('#progressLabel').textContent");
  after.startEnabledAfterClick = await evaluate("!document.querySelector('#startButton').disabled");
  after.documentHiddenAfterStart = await evaluate("document.hidden");
}

const screenshotArgument = process.argv.find((argument) => argument.startsWith("--screenshot="));
if (screenshotArgument) {
  await send("Page.enable");
  const capture = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  await writeFile(screenshotArgument.slice("--screenshot=".length), Buffer.from(capture.result.data, "base64"));
}

console.log(JSON.stringify({ before, after }, null, 2));
socket.close();

if ((process.argv.includes("--apply") || process.argv.includes("--wait-terminal")) && after.phase === "error") {
  process.exitCode = 2;
}
