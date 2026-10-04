export const MODEL_ACCURACY = 96.4;
export const CONFIDENCE_THRESHOLD = 0.65;
export const IMAGE_SIZE = 224;
export const IMAGE_MEAN = [0.485, 0.456, 0.406] as const;
export const IMAGE_STD = [0.229, 0.224, 0.225] as const;

export const MODEL_CLASSES = [
  "Mossaic Virus",
  "Southern blight",
  "Sudden Death Syndrone",
  "Yellow Mosaic",
  "bacterial_blight",
  "brown_spot",
  "ferrugen",
  "powdery_mildew",
  "septoria",
] as const;

export type ModelClass = (typeof MODEL_CLASSES)[number];

export const DISEASES: Record<ModelClass, { label: string; audio: string; urgency: "medium" | "high" }> = {
  "Mossaic Virus": { label: "Mosaic virus", audio: "/audio/mossaic_virus.mp3", urgency: "medium" },
  "Southern blight": { label: "Southern blight", audio: "/audio/southern_blight.mp3", urgency: "high" },
  "Sudden Death Syndrone": { label: "Sudden death syndrome", audio: "/audio/sudden_death_syndrome.mp3", urgency: "high" },
  "Yellow Mosaic": { label: "Yellow mosaic", audio: "/audio/yellow_mosaic.mp3", urgency: "medium" },
  bacterial_blight: { label: "Bacterial blight", audio: "/audio/bacterial_blight.mp3", urgency: "medium" },
  brown_spot: { label: "Brown spot", audio: "/audio/brown_spot.mp3", urgency: "medium" },
  ferrugen: { label: "Soybean rust", audio: "/audio/ferrugen.mp3", urgency: "high" },
  powdery_mildew: { label: "Powdery mildew", audio: "/audio/powdery_mildew.mp3", urgency: "medium" },
  septoria: { label: "Septoria", audio: "/audio/septoria.mp3", urgency: "medium" },
};

export const AUDIO_UNKNOWN = "/audio/nao_sei.mp3";

export function outcomeForConfidence(confidence: number) {
  return confidence >= CONFIDENCE_THRESHOLD ? "confident" : "uncertain";
}

export type PriceInputs = { moisture: number; impurity: number; bags: number; buyerOffer: number };
export type PriceRules = {
  referencePrice: number;
  moistureBase: number;
  moisturePenalty: number;
  impurityBase: number;
  impurityPenalty: number;
};

export function calculateFairPrice(inputs: PriceInputs, rules: PriceRules) {
  const moistureDiscount = Math.max(0, inputs.moisture - rules.moistureBase) * rules.moisturePenalty;
  const impurityDiscount = Math.max(0, inputs.impurity - rules.impurityBase) * rules.impurityPenalty;
  const fairPerBag = Math.max(0, rules.referencePrice - moistureDiscount - impurityDiscount);
  const expectedTotal = fairPerBag * inputs.bags;
  const offeredTotal = inputs.buyerOffer * inputs.bags;
  return { moistureDiscount, impurityDiscount, fairPerBag, expectedTotal, offeredTotal, difference: offeredTotal - expectedTotal };
}
