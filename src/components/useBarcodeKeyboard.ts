"use client";

import { useEffect, useRef } from "react";

type Options = {
  onScan: (code: string) => void;
  enabled?: boolean;
  endKeys?: string[];
  minLength?: number;
  // バーコードリーダーは高速連続入力なのでこの間隔より遅い入力はリセット
  resetMs?: number;
};

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

export function useBarcodeKeyboard({
  onScan,
  enabled = true,
  endKeys = ["Enter"],
  minLength = 4,
  resetMs = 500,
}: Options) {
  const bufferRef = useRef("");
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    function handleKeyDown(ev: KeyboardEvent) {
      if (isEditableTarget(ev.target)) return;
      const now = performance.now();
      if (now - lastTimeRef.current > resetMs) {
        bufferRef.current = "";
      }
      lastTimeRef.current = now;

      if (endKeys.includes(ev.key)) {
        const code = bufferRef.current;
        bufferRef.current = "";
        if (code.length >= minLength) {
          ev.preventDefault();
          onScan(code);
        }
        return;
      }
      if (ev.key.length === 1) {
        bufferRef.current += ev.key;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, onScan, resetMs, minLength]);
}
