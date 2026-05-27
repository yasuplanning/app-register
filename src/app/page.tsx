"use client";

import { useCallback, useRef, useState } from "react";
import { useBarcodeKeyboard } from "@/components/useBarcodeKeyboard";

type Mode = "shopping" | "book";

const DEDUP_WINDOW_MS = 1500;

function buildSearchUrl(mode: Mode, digits: string): string {
  if (mode === "book") {
    return `https://books.rakuten.co.jp/search?sitem=${encodeURIComponent(digits)}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`JAN:${digits}`)}`;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("shopping");
  const [manualInput, setManualInput] = useState("");
  const [lastSearched, setLastSearched] = useState<string | null>(null);

  const modeRef = useRef<Mode>(mode);
  modeRef.current = mode;

  const lastCodeRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);

  const runSearch = useCallback((raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;

    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (
      digits === lastCodeRef.current &&
      now - lastTimeRef.current < DEDUP_WINDOW_MS
    ) {
      return;
    }
    lastCodeRef.current = digits;
    lastTimeRef.current = now;

    const url = buildSearchUrl(modeRef.current, digits);
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setLastSearched(digits);
  }, []);

  useBarcodeKeyboard({ onScan: runSearch, enabled: true });

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = manualInput.trim();
    if (!v) return;
    setManualInput("");
    runSearch(v);
  }

  const isBook = mode === "book";
  const modeLabel = isBook ? "本検索:楽天ブックス" : "商品検索:Google";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-200 via-amber-50 to-rose-50 pb-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 select-none">
        <div className="flex justify-around pt-4 text-5xl opacity-70">
          <span>☁️</span>
          <span>☀️</span>
          <span>☁️</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-6 max-w-3xl px-4">
        <div className="relative mx-auto h-8 max-w-[600px] rounded-t-3xl bg-gradient-to-r from-rose-400 via-rose-300 to-rose-400 shadow-md sm:h-10" />
        <div className="mx-auto -mt-1 flex max-w-[600px] justify-between rounded-b-2xl bg-white px-4 py-3 shadow-md">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="text-2xl" aria-hidden>
              {i % 2 === 0 ? "🍭" : "🎁"}
            </span>
          ))}
        </div>
        <h1 className="mt-4 text-center text-5xl font-black tracking-wider text-rose-600 drop-shadow-sm sm:text-6xl">
          🏪 ぴっぴ ストア
        </h1>
        <p className="mt-2 text-center text-lg text-gray-700">
          バーコードを ピッ するよ
        </p>
      </div>

      <section className="relative z-10 mx-auto mt-8 max-w-3xl px-4">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-[2.5rem] border-4 border-dashed border-amber-300 bg-white/80 p-10 text-center shadow-xl backdrop-blur">
          <div className="text-8xl animate-bounce">📷</div>
          <p className="text-3xl font-extrabold text-amber-700">
            バーコードを ピッ！
          </p>

          <button
            type="button"
            onClick={() => setMode(isBook ? "shopping" : "book")}
            aria-pressed={isBook}
            className={`flex items-center gap-3 rounded-2xl px-6 py-4 text-xl font-bold shadow-md ring-2 transition active:scale-95 ${
              isBook
                ? "bg-emerald-500 text-white ring-emerald-300 hover:bg-emerald-600"
                : "bg-white text-amber-700 ring-amber-300 hover:bg-amber-50"
            }`}
          >
            <span className="text-2xl" aria-hidden>
              📚
            </span>
            ほんをけんさく
            <span
              className={`ml-1 rounded-full px-3 py-1 text-sm font-bold ${
                isBook ? "bg-white text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {isBook ? "ON" : "OFF"}
            </span>
          </button>

          <p
            className={`rounded-xl px-4 py-2 text-base font-bold ${
              isBook
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {modeLabel}
          </p>

          {lastSearched && (
            <p className="rounded-xl bg-sky-100 px-4 py-2 text-base font-bold text-sky-800">
              検索しました:{lastSearched}
            </p>
          )}
        </div>

        <details className="mx-auto mt-8 max-w-md rounded-2xl bg-white/70 p-3 text-sm text-gray-600 shadow-sm">
          <summary className="cursor-pointer font-semibold">
            （おとなのひと）手入力で試す
          </summary>
          <form
            onSubmit={handleManualSubmit}
            className="mt-3 flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="text"
              inputMode="numeric"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="JAN / ISBN"
              className="flex-1 rounded-xl border-2 border-amber-200 px-4 py-2 text-base focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-4 py-2 text-base font-bold text-white shadow hover:bg-amber-600"
            >
              けんさく
            </button>
          </form>
        </details>
      </section>
    </main>
  );
}
