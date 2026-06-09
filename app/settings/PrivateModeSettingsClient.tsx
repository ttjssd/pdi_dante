"use client";

import { useEffect, useState } from "react";
import type { LocalBackground } from "../electronBridge";
import {
  DEFAULT_PRIVATE_SETTINGS,
  loadPrivateSettings,
  normalizePrivateSettings,
  PRIVATE_MODE_KEY,
  PRIVATE_SETTINGS_KEY,
  type PrivateModeSettings,
} from "../privateModeSettings";

export default function PrivateModeSettingsClient() {
  const [settings, setSettings] = useState<PrivateModeSettings>(DEFAULT_PRIVATE_SETTINGS);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [message, setMessage] = useState("");
  const [backgrounds, setBackgrounds] = useState<LocalBackground[]>([]);
  const [electronAvailable, setElectronAvailable] = useState(false);

  useEffect(() => {
    const storedSettings = loadPrivateSettings(window.localStorage);
    setSettings(storedSettings);
    if (!window.pdiBackgrounds) return;
    setElectronAvailable(true);
    window.pdiBackgrounds.list().then((items) => {
      setBackgrounds(items);
      setSettings((current) => ({
        ...current,
        enabledMedia: current.enabledMedia.length > 0 ? current.enabledMedia : items.map((item) => item.id),
        playbackOrder: mergeMediaOrder(current.playbackOrder, items),
      }));
    }).catch(() => setMessage("로컬 배경 목록을 불러오지 못했습니다."));
  }, []);

  const toggleMedia = (id: string) => {
    setSettings((current) => {
      const enabled = current.enabledMedia.includes(id);
      if (enabled && current.enabledMedia.length === 1) {
        setMessage("배경은 최소 1개 이상 활성화해야 합니다.");
        return current;
      }

      setMessage("");
      return {
        ...current,
        enabledMedia: enabled
          ? current.enabledMedia.filter((mediaId) => mediaId !== id)
          : [...current.enabledMedia, id],
      };
    });
  };

  const moveMedia = (id: string, direction: -1 | 1) => {
    setSettings((current) => {
      const order = [...current.playbackOrder];
      const index = order.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return current;
      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
      return { ...current, playbackOrder: order };
    });
  };

  const addBackgrounds = async () => {
    if (!window.pdiBackgrounds) return;
    const items = await window.pdiBackgrounds.add();
    setBackgrounds(items);
    setSettings((current) => ({
      ...current,
      enabledMedia: Array.from(new Set([...current.enabledMedia, ...items.map((item) => item.id)])),
      playbackOrder: mergeMediaOrder(current.playbackOrder, items),
    }));
    setMessage(items.length > 0 ? "로컬 배경을 추가했습니다. 설정 저장을 눌러주세요." : "");
  };

  const removeBackground = async (item: LocalBackground) => {
    if (!window.pdiBackgrounds || !window.confirm(`"${item.name}" 배경을 로컬 폴더에서 삭제할까요?`)) return;
    const items = await window.pdiBackgrounds.remove(item.id);
    setBackgrounds(items);
    setSettings((current) => ({
      ...current,
      enabledMedia: current.enabledMedia.filter((id) => id !== item.id),
      playbackOrder: mergeMediaOrder(current.playbackOrder.filter((id) => id !== item.id), items),
    }));
    setMessage("로컬 배경을 삭제했습니다.");
  };

  const saveSettings = () => {
    if (currentPin !== settings.pin) {
      setMessage("현재 PIN이 맞지 않습니다.");
      return;
    }

    if (newPin && newPin.trim().length < 4) {
      setMessage("새 PIN은 4자리 이상으로 입력해주세요.");
      return;
    }

    const nextSettings = normalizePrivateSettings({
      ...settings,
      pin: newPin.trim() || settings.pin,
    });
    window.localStorage.setItem(PRIVATE_SETTINGS_KEY, JSON.stringify(nextSettings));
    if (nextSettings.defaultWorkMode) window.localStorage.setItem(PRIVATE_MODE_KEY, "off");
    setSettings(nextSettings);
    setCurrentPin("");
    setNewPin("");
    setMessage("설정을 저장했습니다. 런처로 돌아가면 적용됩니다.");
  };

  const resetSettings = () => {
    if (currentPin !== settings.pin) {
      setMessage("초기화하려면 현재 PIN을 입력해주세요.");
      return;
    }

    window.localStorage.setItem(PRIVATE_SETTINGS_KEY, JSON.stringify(DEFAULT_PRIVATE_SETTINGS));
    window.localStorage.setItem(PRIVATE_MODE_KEY, "off");
    setSettings({ ...DEFAULT_PRIVATE_SETTINGS });
    setCurrentPin("");
    setNewPin("");
    setMessage("기본 설정으로 초기화했습니다.");
  };

  return (
    <div className="private-settings-grid">
      <section className="private-settings-card">
        <div className="private-settings-heading">
          <span>01</span>
          <div>
            <h2>로컬 배경 라이브러리</h2>
            <p>개인 영상과 이미지는 이 PC에만 저장되며 EXE와 GitHub에 포함되지 않습니다.</p>
          </div>
        </div>

        <div className="private-local-actions">
          <button className="platform-button button-primary" type="button" onClick={addBackgrounds} disabled={!electronAvailable}>
            로컬 배경 추가
          </button>
          <button
            className="platform-button button-outline"
            type="button"
            onClick={() => window.pdiBackgrounds?.openFolder()}
            disabled={!electronAvailable}
          >
            저장 폴더 열기
          </button>
        </div>
        {!electronAvailable && <p className="private-settings-notice">로컬 배경 관리는 Electron EXE에서만 사용할 수 있습니다.</p>}

        <div className="private-video-list">
          {settings.playbackOrder.map((id, index) => {
            const item = backgrounds.find((background) => background.id === id);
            if (!item) return null;

            return (
              <article key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={settings.enabledMedia.includes(item.id)}
                    onChange={() => toggleMedia(item.id)}
                  />
                  <span>
                    {item.name}
                    <small>{item.type === "video" ? "VIDEO" : "IMAGE"} · {formatBytes(item.size)}</small>
                  </span>
                </label>
                <div>
                  <button type="button" onClick={() => moveMedia(item.id, -1)} disabled={index === 0}>↑</button>
                  <button
                    type="button"
                    onClick={() => moveMedia(item.id, 1)}
                    disabled={index === settings.playbackOrder.length - 1}
                  >
                    ↓
                  </button>
                  <button className="is-danger" type="button" onClick={() => removeBackground(item)}>삭제</button>
                </div>
              </article>
            );
          })}
          {backgrounds.length === 0 && (
            <div className="private-empty-state">
              로컬 배경이 없습니다. 영상 또는 이미지를 추가해주세요.
            </div>
          )}
        </div>
      </section>

      <section className="private-settings-card">
        <div className="private-settings-heading">
          <span>02</span>
          <div>
            <h2>화면 및 시작 옵션</h2>
            <p>프라이빗 영상 밝기와 기본 시작 모드를 관리합니다.</p>
          </div>
        </div>

        <label className="private-range-field">
          <span>영상 밝기 <strong>{Math.round(settings.brightness * 100)}%</strong></span>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.02"
            value={settings.brightness}
            onChange={(event) => setSettings((current) => ({ ...current, brightness: Number(event.target.value) }))}
          />
        </label>

        <label className="private-toggle-field">
          <input
            type="checkbox"
            checked={settings.defaultWorkMode}
            onChange={(event) => setSettings((current) => ({ ...current, defaultWorkMode: event.target.checked }))}
          />
          <span>
            <strong>앱 시작 시 업무 모드</strong>
            <small>활성화하면 앱을 다시 켤 때 항상 안전한 업무 배경으로 시작합니다.</small>
          </span>
        </label>
      </section>

      <section className="private-settings-card">
        <div className="private-settings-heading">
          <span>03</span>
          <div>
            <h2>PIN 및 저장</h2>
            <p>현재 PIN 확인 후 설정을 저장하거나 PIN을 변경합니다.</p>
          </div>
        </div>

        <div className="private-pin-fields">
          <label>
            현재 PIN
            <input type="password" value={currentPin} onChange={(event) => setCurrentPin(event.target.value)} />
          </label>
          <label>
            새 PIN (선택)
            <input
              type="password"
              value={newPin}
              onChange={(event) => setNewPin(event.target.value)}
              placeholder="변경하지 않으면 비워두세요"
            />
          </label>
        </div>

        <p className="private-settings-notice">
          PIN과 설정은 이 PC의 브라우저 저장소에만 보관됩니다. 서버 인증이나 강한 보안 기능은 아닙니다.
        </p>

        {message && <div className="private-settings-message">{message}</div>}

        <div className="private-settings-actions">
          <button className="platform-button button-primary" type="button" onClick={saveSettings}>설정 저장</button>
          <button className="platform-button button-outline" type="button" onClick={resetSettings}>기본값 초기화</button>
        </div>
      </section>
    </div>
  );
}

function mergeMediaOrder(currentOrder: string[], items: LocalBackground[]) {
  const availableIds = new Set(items.map((item) => item.id));
  const preserved = currentOrder.filter((id) => availableIds.has(id));
  const preservedIds = new Set(preserved);
  return [...preserved, ...items.map((item) => item.id).filter((id) => !preservedIds.has(id))];
}

function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
