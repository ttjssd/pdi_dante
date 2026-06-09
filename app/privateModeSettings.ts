export const PRIVATE_MODE_KEY = "pdi-launcher-private-mode";
export const PRIVATE_SETTINGS_KEY = "pdi-launcher-private-settings";

export type PrivateModeSettings = {
  pin: string;
  brightness: number;
  enabledMedia: string[];
  playbackOrder: string[];
  defaultWorkMode: boolean;
};

export const DEFAULT_PRIVATE_SETTINGS: PrivateModeSettings = {
  pin: "3333",
  brightness: 1.08,
  enabledMedia: [],
  playbackOrder: [],
  defaultWorkMode: true,
};

export function normalizePrivateSettings(value?: Partial<PrivateModeSettings> | null): PrivateModeSettings {
  return {
    pin: value?.pin && value.pin.length >= 4 ? value.pin : DEFAULT_PRIVATE_SETTINGS.pin,
    brightness: Math.min(1.3, Math.max(0.7, Number(value?.brightness ?? DEFAULT_PRIVATE_SETTINGS.brightness))),
    enabledMedia: Array.isArray(value?.enabledMedia) ? Array.from(new Set(value.enabledMedia.filter(Boolean))) : [],
    playbackOrder: Array.isArray(value?.playbackOrder) ? Array.from(new Set(value.playbackOrder.filter(Boolean))) : [],
    defaultWorkMode: value?.defaultWorkMode ?? DEFAULT_PRIVATE_SETTINGS.defaultWorkMode,
  };
}

export function loadPrivateSettings(storage: Storage): PrivateModeSettings {
  try {
    const stored = storage.getItem(PRIVATE_SETTINGS_KEY);
    return normalizePrivateSettings(stored ? JSON.parse(stored) : null);
  } catch {
    return { ...DEFAULT_PRIVATE_SETTINGS };
  }
}
