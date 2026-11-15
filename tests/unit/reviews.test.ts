import { describe, expect, it } from "vitest";
import { shortName } from "@/components/reviews/ReviewCard";
import { reviewCreateSchema, reviewEditSchema, reviewModerationSchema, reviewReplySchema } from "@/lib/validations";

describe("reviewCreateSchema", () => {
  const base = { viewingRequestId: "v1", landlordRating: 4, accuracyRating: 5 };

  it("accepts whole-star ratings from 1 to 5 and treats a blank comment as none", () => {
    expect(reviewCreateSchema.parse({ ...base, comment: "   " })).toEqual({ ...base, comment: null });
    expect(reviewCreateSchema.parse(base).comment).toBeNull();
    expect(reviewCreateSchema.parse({ ...base, comment: "  Great  " }).comment).toBe("Great");
  });

  it.each([0, 6, 3.5, "4", null])("rejects a rating of %s", (bad) => {
    expect(reviewCreateSchema.safeParse({ ...base, landlordRating: bad }).success).toBe(false);
    expect(reviewCreateSchema.safeParse({ ...base, accuracyRating: bad }).success).toBe(false);
  });

  it("limits comments to 1000 characters", () => {
    expect(reviewCreateSchema.safeParse({ ...base, comment: "x".repeat(1000) }).success).toBe(true);
    expect(reviewCreateSchema.safeParse({ ...base, comment: "x".repeat(1001) }).success).toBe(false);
  });
});

describe("reviewEditSchema", () => {
  it("leaves out fields that weren't sent, so they stay unchanged", () => {
    expect(reviewEditSchema.parse({ landlordRating: 2 })).toEqual({ landlordRating: 2 });
  });

  it("keeps an empty comment so it can be removed", () => {
    expect(reviewEditSchema.parse({ comment: "" })).toEqual({ comment: "" });
  });

  it("needs at least one change", () => {
    expect(reviewEditSchema.safeParse({}).success).toBe(false);
  });
});

describe("reply and moderation", () => {
  it("needs a non-blank reply", () => {
    expect(reviewReplySchema.safeParse({ landlordReply: "   " }).success).toBe(false);
    expect(reviewReplySchema.parse({ landlordReply: " Thanks " }).landlordReply).toBe("Thanks");
  });

  it("needs a real boolean to hide", () => {
    expect(reviewModerationSchema.safeParse({ isHidden: "yes" }).success).toBe(false);
    expect(reviewModerationSchema.parse({ isHidden: true }).isHidden).toBe(true);
  });
});

describe("shortName", () => {
  it.each([
    ["Ama Serwaa", "Ama S."],
    ["Kwame Nkrumah Mensah", "Kwame M."],
    ["  abena   darko ", "abena D."],
    ["Kojo", "Kojo"],
  ])("%s → %s", (name, expected) => {
    expect(shortName(name)).toBe(expected);
  });
});
