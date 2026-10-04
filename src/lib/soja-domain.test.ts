import { describe, expect, it } from "vitest";
import { calculateFairPrice, MODEL_CLASSES, outcomeForConfidence } from "./soja-domain";

describe("Soja Tru domain rules", () => {
  it("keeps the trained model class order", () => {
    expect(MODEL_CLASSES).toHaveLength(9);
    expect(MODEL_CLASSES[0]).toBe("Mossaic Virus");
    expect(MODEL_CLASSES[8]).toBe("septoria");
  });
  it("uses the 65% fail-safe threshold", () => {
    expect(outcomeForConfidence(0.649)).toBe("uncertain");
    expect(outcomeForConfidence(0.65)).toBe("confident");
  });
  it("calculates transparent quality discounts", () => {
    const result = calculateFairPrice({ moisture: 15, impurity: 2, bags: 100, buyerOffer: 150 }, { referencePrice: 159.94, moistureBase: 13, moisturePenalty: 1.5, impurityBase: 1, impurityPenalty: 0.7 });
    expect(result.fairPerBag).toBeCloseTo(156.24);
    expect(result.difference).toBeCloseTo(-624);
  });
});
