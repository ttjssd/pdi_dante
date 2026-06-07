export type LegacyCopyInput = {
  vehicleNumber: string;
  managerName: string;
  issueArea: string;
  originalText: string;
  handlingPlan: string;
};

export type LegacyGeneratedCopy = {
  title: string;
  reason: string;
  detail: string;
  slack: string;
  completion: string;
};

function cleanLegacyText(value: string) {
  return value.replace(/\s+/g, " ").replace(/[.!]+$/g, "").trim();
}

// 이전 신청 문장 생성 기능입니다. 현재 UI에서는 사용하지 않지만 추후 재사용할 수 있습니다.
export function generateLegacyApplicationCopy(input: LegacyCopyInput): LegacyGeneratedCopy {
  const area = input.issueArea.trim();
  const problem = cleanLegacyText(input.originalText);
  const manager = input.managerName.trim().replace(/^@/, "").replace(/님$/, "");
  const observation = [area, problem].filter(Boolean).join(" ");
  const plan = cleanLegacyText(input.handlingPlan);

  return {
    title: `${input.vehicleNumber.trim()} 재상품화 누락 신청 요청`,
    reason: `${observation} 확인`,
    detail: `${input.vehicleNumber.trim()} 차량 확인 중 ${area}에 ${problem} 확인되었습니다. 출고 전 조치가 필요해 보여 재상품화 누락 신청 요청드립니다.${plan ? ` 추가 확인사항: ${plan}.` : ""}`,
    slack: `${manager}님, ${input.vehicleNumber.trim()} 차량 ${observation} 확인되어 재상품화 누락 신청 진행하겠습니다.`,
    completion: `${manager}님, ${input.vehicleNumber.trim()} 차량 재상품화 누락 신청 완료했습니다.`,
  };
}
