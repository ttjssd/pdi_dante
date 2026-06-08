export type LauncherBackground = {
  id: string;
  title: string;
  type: "image" | "gif" | "gradient";
  src?: string;
  description: string;
};

export const launcherBackgrounds: LauncherBackground[] = [
  {
    id: "violet-core-grid",
    title: "Violet Core Grid",
    type: "gradient",
    description: "보라색 에너지 코어와 시안 그리드 기반 기본 런처 배경",
  },
  {
    id: "cyan-route-map",
    title: "Cyan Route Map",
    type: "gradient",
    description: "탁송/운영 흐름을 연상시키는 시안 라인 배경",
  },
  {
    id: "purple-ops-wave",
    title: "Purple Ops Wave",
    type: "gradient",
    description: "업무 콘솔 진입감을 위한 퍼플 웨이브 배경",
  },
];
