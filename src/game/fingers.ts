export type Finger =
  | "左小指"
  | "左薬指"
  | "左中指"
  | "左人差指"
  | "右人差指"
  | "右中指"
  | "右薬指"
  | "右小指"
  | "親指";

export const FINGERS: readonly Finger[] = [
  "左小指",
  "左薬指",
  "左中指",
  "左人差指",
  "右人差指",
  "右中指",
  "右薬指",
  "右小指",
  "親指",
];

const FINGER_BY_CODE: Record<string, Finger> = {
  Digit1: "左小指",
  Digit2: "左薬指",
  Digit3: "左中指",
  Digit4: "左人差指",
  Digit5: "左人差指",
  Digit6: "右人差指",
  Digit7: "右人差指",
  Digit8: "右中指",
  Digit9: "右薬指",
  Digit0: "右小指",
  Minus: "右小指",
  Equal: "右小指",
  IntlYen: "右小指",
  Backquote: "左小指",
  KeyQ: "左小指",
  KeyW: "左薬指",
  KeyE: "左中指",
  KeyR: "左人差指",
  KeyT: "左人差指",
  KeyY: "右人差指",
  KeyU: "右人差指",
  KeyI: "右中指",
  KeyO: "右薬指",
  KeyP: "右小指",
  BracketLeft: "右小指",
  BracketRight: "右小指",
  Backslash: "右小指",
  KeyA: "左小指",
  KeyS: "左薬指",
  KeyD: "左中指",
  KeyF: "左人差指",
  KeyG: "左人差指",
  KeyH: "右人差指",
  KeyJ: "右人差指",
  KeyK: "右中指",
  KeyL: "右薬指",
  Semicolon: "右小指",
  Quote: "右小指",
  KeyZ: "左小指",
  KeyX: "左薬指",
  KeyC: "左中指",
  KeyV: "左人差指",
  KeyB: "左人差指",
  KeyN: "右人差指",
  KeyM: "右人差指",
  Comma: "右中指",
  Period: "右薬指",
  Slash: "右小指",
  IntlRo: "右小指",
  Space: "親指",
  ShiftLeft: "左小指",
  ShiftRight: "右小指",
  Enter: "右小指",
  Backspace: "右小指",
  Tab: "左小指",
  CapsLock: "左小指",
};

export function fingerForCode(code: string): Finger | null {
  return FINGER_BY_CODE[code] ?? null;
}
