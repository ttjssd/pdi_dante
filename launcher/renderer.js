const elements = Object.fromEntries(
  [
    "progressLabel",
    "progressValue", "progressBar", "checkButton", "startButton", "startLabel",
    "settingsLogButton", "appVersionFooter", "privateBackground", "privateVideo", "settingsButton", "minimizeButton", "closeButton", "closeSettingsButton", "settingsPanel",
    "settingsBackdrop", "pinInput", "privateModeButton", "privateModeLabel", "pinMessage",
    "backgroundName", "defaultBackgroundButton", "selectBackgroundButton", "resetBackgroundButton", "dimRange",
    "blurRange", "dimValue", "blurValue", "noticeList",
  ].map((id) => [id, document.querySelector(`#${id}`)]),
);

const labels = {
  starting: "LAUNCHER READY",
  checking: "CHECKING UPDATE",
  ready: "LATEST VERSION",
  available: "UPDATE AVAILABLE",
  downloading: "DOWNLOADING",
  verifying: "VERIFYING PACKAGE",
  extracting: "EXTRACTING",
  applying: "APPLYING UPDATE",
  complete: "UPDATE COMPLETE",
  error: "UPDATE FAILED",
};

let currentState = null;

function renderNotices(state) {
  const notes = state.releaseNotes?.length
    ? state.releaseNotes
    : [
        state.latestVersion ? `PDI Backoffice ${state.latestVersion}` : "업데이트 정보 확인 중",
        "커스텀 런처 업데이트 채널",
      ];
  elements.noticeList.innerHTML = notes
    .slice(0, 3)
    .map(
      (note, index) => `
        <article>
          <small>${index === 0 ? state.latestVersion || "LATEST" : `NOTICE 0${index + 1}`}</small>
          <strong>${String(note).replace(/[<>&]/g, "")}</strong>
        </article>
      `,
    )
    .join("");
}

function renderSettings(settings = {}) {
  const active = Boolean(settings.privateModeActive);
  const enabled = Boolean(settings.privateModeEnabled && settings.privateModeUnlocked);
  elements.privateModeLabel.textContent = enabled ? "ON" : "OFF";
  elements.privateModeButton.textContent = enabled ? "PRIVATE MODE OFF" : "PRIVATE MODE ON";
  elements.backgroundName.textContent = settings.backgroundAvailable
    ? settings.backgroundName
    : "DEFAULT";
  elements.dimRange.value = Math.round((settings.backgroundDim ?? 0.45) * 100);
  elements.blurRange.value = Math.round(settings.backgroundBlur ?? 0);
  elements.dimValue.textContent = `${elements.dimRange.value}%`;
  elements.blurValue.textContent = `${elements.blurRange.value}px`;

  if (active && settings.backgroundUrl && settings.backgroundType === "video") {
    elements.privateBackground.style.backgroundImage = "";
    elements.privateBackground.classList.remove("is-active");
    if (elements.privateVideo.src !== settings.backgroundUrl) {
      elements.privateVideo.src = settings.backgroundUrl;
      elements.privateVideo.load();
    }
    elements.privateVideo.classList.add("is-active");
    elements.privateVideo.play().catch(() => {});
  } else if (active && settings.backgroundUrl) {
    elements.privateVideo.pause();
    elements.privateVideo.removeAttribute("src");
    elements.privateVideo.load();
    elements.privateVideo.classList.remove("is-active");
    elements.privateBackground.style.backgroundImage = `url("${settings.backgroundUrl}")`;
    elements.privateBackground.classList.add("is-active");
  } else {
    elements.privateVideo.pause();
    elements.privateVideo.removeAttribute("src");
    elements.privateVideo.load();
    elements.privateVideo.classList.remove("is-active");
    elements.privateBackground.style.backgroundImage = "";
    elements.privateBackground.classList.remove("is-active");
  }
  document.documentElement.style.setProperty("--background-dim", settings.backgroundDim ?? 0.45);
  document.documentElement.style.setProperty("--background-blur", `${settings.backgroundBlur ?? 0}px`);
  document.body.classList.toggle("private-mode-active", active);
}

function render(state) {
  currentState = state;
  const phaseLabel = labels[state.phase] || String(state.phase || "LAUNCHER READY").toUpperCase();
  elements.progressLabel.textContent = state.message || "대기 중";
  elements.progressValue.textContent = `${state.progress || 0}%`;
  elements.progressBar.style.width = `${state.progress || 0}%`;
  elements.appVersionFooter.textContent = state.currentVersion || "0.0.0";

  elements.checkButton.disabled = state.busy;
  elements.startButton.disabled = state.busy || (!state.canStart && !state.updateAvailable);
  elements.startLabel.textContent = state.busy
    ? "업데이트 중"
    : state.updateAvailable
      ? "업데이트"
      : state.canStart
        ? "시작"
        : "설치 필요";
  document.body.dataset.phase = state.phase;

  renderSettings(state.settings);
  renderNotices(state);
}

function setSettingsOpen(open) {
  elements.settingsPanel.classList.toggle("is-open", open);
  elements.settingsPanel.setAttribute("aria-hidden", String(!open));
  elements.settingsBackdrop.hidden = !open;
}

elements.settingsButton.addEventListener("click", () => setSettingsOpen(true));
elements.minimizeButton.addEventListener("click", () => window.pdiLauncher.minimize());
elements.closeButton.addEventListener("click", () => window.pdiLauncher.close());
elements.closeSettingsButton.addEventListener("click", () => setSettingsOpen(false));
elements.settingsBackdrop.addEventListener("click", () => setSettingsOpen(false));
elements.checkButton.addEventListener("click", () => window.pdiLauncher.check());
elements.startButton.addEventListener("click", async () => {
  elements.startButton.disabled = true;
  if (currentState?.updateAvailable) {
    elements.startLabel.textContent = "업데이트 중";
    await window.pdiLauncher.update();
    return;
  }

  elements.startLabel.textContent = "실행 중";
  const result = await window.pdiLauncher.start();
  if (!result?.ok) {
    elements.startButton.disabled = false;
    elements.startLabel.textContent = "시작";
  }
});
elements.settingsLogButton.addEventListener("click", () => window.pdiLauncher.openLogs());

elements.privateModeButton.addEventListener("click", async () => {
  const result = await window.pdiLauncher.setPrivateMode(elements.pinInput.value);
  elements.pinMessage.textContent = result.ok ? "" : result.error || "프라이빗 모드를 변경하지 못했습니다.";
  if (result.ok) {
    elements.pinInput.value = "";
    renderSettings(result.settings);
  }
});

elements.selectBackgroundButton.addEventListener("click", async () => {
  const result = await window.pdiLauncher.selectBackground();
  if (result?.error) elements.pinMessage.textContent = result.error;
  if (result?.settings) renderSettings(result.settings);
});

elements.defaultBackgroundButton.addEventListener("click", async () => {
  const settings = await window.pdiLauncher.updateAppearance({ backgroundMode: "default" });
  renderSettings(settings);
});

elements.resetBackgroundButton.addEventListener("click", async () => {
  const settings = await window.pdiLauncher.resetBackground();
  renderSettings(settings);
  elements.pinMessage.textContent = "로컬 배경을 초기화했습니다.";
});

let appearanceTimer;
function queueAppearanceUpdate() {
  elements.dimValue.textContent = `${elements.dimRange.value}%`;
  elements.blurValue.textContent = `${elements.blurRange.value}px`;
  clearTimeout(appearanceTimer);
  appearanceTimer = setTimeout(async () => {
    const settings = await window.pdiLauncher.updateAppearance({
      backgroundDim: Number(elements.dimRange.value) / 100,
      backgroundBlur: Number(elements.blurRange.value),
    });
    renderSettings(settings);
  }, 100);
}
elements.dimRange.addEventListener("input", queueAppearanceUpdate);
elements.blurRange.addEventListener("input", queueAppearanceUpdate);

window.pdiLauncher.onState(render);
window.pdiLauncher.getState().then(render);
