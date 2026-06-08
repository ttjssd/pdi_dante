export const PRIVATE_MODE_KEY = "pdi-launcher-private-mode";
export const PRIVATE_SETTINGS_KEY = "pdi-launcher-private-settings";

export const PRIVATE_VIDEO_OPTIONS = [
  {
    id: "video-1",
    label: "프라이빗 영상 1",
    src: "/launcher-backgrounds/private-console-bg.mp4",
  },
  {
    id: "video-2",
    label: "프라이빗 영상 2",
    src: "/launcher-backgrounds/private-console-bg-2.mp4",
  },
  {
    id: "video-3",
    label: "프라이빗 영상 3",
    src: "/launcher-backgrounds/private-console-bg-3.mp4",
  },
] as const;

export type PrivateVideoId = (typeof PRIVATE_VIDEO_OPTIONS)[number]["id"];

export type PrivateModeSettings = {
  pin: string;
  brightness: number;
  enabledVideos: PrivateVideoId[];
  playbackOrder: PrivateVideoId[];
  defaultWorkMode: boolean;
};

export const DEFAULT_PRIVATE_SETTINGS: PrivateModeSettings = {
  pin: "3333",
  brightness: 1.08,
  enabledVideos: PRIVATE_VIDEO_OPTIONS.map((video) => video.id),
  playbackOrder: PRIVATE_VIDEO_OPTIONS.map((video) => video.id),
  defaultWorkMode: true,
};

export function normalizePrivateSettings(value?: Partial<PrivateModeSettings> | null): PrivateModeSettings {
  const validIds = new Set<PrivateVideoId>(PRIVATE_VIDEO_OPTIONS.map((video) => video.id));
  const enabledVideos = (value?.enabledVideos ?? DEFAULT_PRIVATE_SETTINGS.enabledVideos)
    .filter((id): id is PrivateVideoId => validIds.has(id as PrivateVideoId));
  const playbackOrder = (value?.playbackOrder ?? DEFAULT_PRIVATE_SETTINGS.playbackOrder)
    .filter((id): id is PrivateVideoId => validIds.has(id as PrivateVideoId));

  return {
    pin: value?.pin && value.pin.length >= 4 ? value.pin : DEFAULT_PRIVATE_SETTINGS.pin,
    brightness: Math.min(1.3, Math.max(0.7, Number(value?.brightness ?? DEFAULT_PRIVATE_SETTINGS.brightness))),
    enabledVideos: enabledVideos.length > 0 ? enabledVideos : [DEFAULT_PRIVATE_SETTINGS.enabledVideos[0]],
    playbackOrder: playbackOrder.length > 0 ? playbackOrder : [...DEFAULT_PRIVATE_SETTINGS.playbackOrder],
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
