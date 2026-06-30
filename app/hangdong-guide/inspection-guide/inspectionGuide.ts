export type InspectionVehicle = {
  id: string;
  plateNumber: string;
  vehicleName: string;
  location: string;
  memo: string;
};

export type InspectionGuideForm = {
  defaultLocation: string;
};

const PLATE_PATTERN = /(?:\d{2,3}\s*[가-힣]\s*\d{4})/g;

export const initialInspectionForm: InspectionGuideForm = {
  defaultLocation: "",
};

export function parseInspectionVehicles(rawText: string): InspectionVehicle[] {
  const lines = rawText.replace(/\r/g, "").split("\n");
  const vehicles: InspectionVehicle[] = [];

  lines.forEach((rawLine, lineIndex) => {
    const line = normalizeOcrText(rawLine);
    const plateMatches = Array.from(line.matchAll(PLATE_PATTERN)).map((match) => normalizePlateNumber(match[0]));
    plateMatches.forEach((plateNumber, plateIndex) => {
      if (!plateNumber) return;
      vehicles.push({
        id: `${Date.now()}-${lineIndex}-${plateIndex}-${plateNumber}`,
        plateNumber,
        vehicleName: "",
        location: "",
        memo: "",
      });
    });
  });

  return dedupeVehicles(vehicles);
}

export function buildInsuranceSheetRows(vehicles: InspectionVehicle[], form: InspectionGuideForm) {
  return vehicles
    .filter((vehicle) => vehicle.plateNumber.trim())
    .map((vehicle) => [
      vehicle.plateNumber,
      vehicle.vehicleName,
      vehicle.location || form.defaultLocation,
    ].join("\t"))
    .join("\n");
}

function normalizeOcrText(value: string) {
  return value
    .replace(/[|｜]/g, "1")
    .replace(/[oO]/g, "0")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePlateNumber(value: string) {
  return value.replace(/\s+/g, "").trim();
}

function dedupeVehicles(vehicles: InspectionVehicle[]) {
  const seen = new Set<string>();
  return vehicles.filter((vehicle) => {
    if (seen.has(vehicle.plateNumber)) return false;
    seen.add(vehicle.plateNumber);
    return true;
  });
}
