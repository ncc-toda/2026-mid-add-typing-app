import { describe, expect, it } from "vite-plus/test";
import { fingerForCode } from "./fingers.ts";

describe("JIS QWERTY home-row finger map", () => {
  it("maps home row letters to the eight fingers", () => {
    expect(fingerForCode("KeyA")).toBe("左小指");
    expect(fingerForCode("KeyS")).toBe("左薬指");
    expect(fingerForCode("KeyD")).toBe("左中指");
    expect(fingerForCode("KeyF")).toBe("左人差指");
    expect(fingerForCode("KeyJ")).toBe("右人差指");
    expect(fingerForCode("KeyK")).toBe("右中指");
    expect(fingerForCode("KeyL")).toBe("右薬指");
    expect(fingerForCode("Semicolon")).toBe("右小指");
  });

  it("maps space to the thumb and index-finger columns", () => {
    expect(fingerForCode("Space")).toBe("親指");
    expect(fingerForCode("KeyG")).toBe("左人差指");
    expect(fingerForCode("KeyH")).toBe("右人差指");
    expect(fingerForCode("Digit1")).toBe("左小指");
    expect(fingerForCode("KeyY")).toBe("右人差指");
    expect(fingerForCode("IntlRo")).toBe("右小指");
  });

  it("returns null for unmapped codes", () => {
    expect(fingerForCode("Escape")).toBeNull();
    expect(fingerForCode("F1")).toBeNull();
  });
});
