// src/lib/testFlags.ts
// ==== TEST-ONLY: ここから =================================
export const IS_TEST_CLIENT =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_TEST_MODE === "true";

export const FORCE_TOKYO =
  typeof process !== "undefined" &&
  (process.env.NEXT_PUBLIC_TEST_FORCE_GPS || "").toLowerCase() === "tokyo";

export const TEST_BADGE_TEXT = "TEST MODE";
export const TOKYO_ST = { lat: 35.681236, lng: 139.767125 };
// ==== TEST-ONLY: ここまで =================================
