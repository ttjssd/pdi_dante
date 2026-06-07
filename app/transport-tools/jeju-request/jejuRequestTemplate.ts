export type JejuRequestForm = {
  vehicleNumber: string;
  vehicleName: string;
  desiredArrival: string;
  departureAt: string;
  requestDetails: string;
  memo: string;
};

export function buildJejuRequestText(form: JejuRequestForm) {
  return [
    "@김경민",
    "안녕하세요 차장님,",
    "제주도 탁송 필요 차량 공유드립니다.",
    "",
    `차량 정보 : ${form.vehicleNumber || "[차량번호]"} - ${form.vehicleName || "[차량명]"}`,
    `희망 도착일 : ${form.desiredArrival || "예시) 6/10 (수)"}`,
    "",
    form.requestDetails.trim() || "[요청사항 직접 입력]",
    "",
    `탁송 신청은 ${form.departureAt || "[내일 00시]"} 로 오더 올리겠습니다.`,
    ...(form.memo.trim() ? ["", `추가 확인 사항 : ${form.memo.trim()}`] : []),
  ].join("\n");
}
