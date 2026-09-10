import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SlideView, type Deck } from "./SlideKit";

const CANVAS_W = 1600;
const CANVAS_H = 900;

function hashIndex(total: number) {
  const n = Number(window.location.hash.slice(1));
  return Number.isInteger(n) && n >= 1 && n <= total ? n - 1 : 0;
}

export function SlideDeck({ deck }: { deck: Deck }) {
  const flat = useMemo(
    () => deck.sections.flatMap((sec) => sec.slides.map((slide) => ({ sec, slide }))),
    [deck],
  );
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(hashIndex(flat.length));
  }, [flat.length]);

  const go = useCallback(
    (next: number) => {
      const n = Math.max(0, Math.min(flat.length - 1, next));
      setI(n);
      history.replaceState(null, "", `#${n + 1}`);
    },
    [flat.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        go(i + 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        go(i - 1);
      } else if (e.key === "Home") go(0);
      else if (e.key === "End") go(flat.length - 1);
      else if (e.key.toLowerCase() === "f") void document.documentElement.requestFullscreen?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, i, flat.length]);

  const { sec, slide } = flat[i];
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / CANVAS_W, el.clientHeight / CANVAS_H));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="slide-shell">
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-foreground/10 px-3 py-2">
        <span className="mono mr-2 hidden text-[11px] uppercase tracking-[0.2em] opacity-50 sm:inline">
          {deck.title}
        </span>
        {deck.sections.map((s) => {
          const first = flat.findIndex((f) => f.sec.id === s.id);
          const active = s.id === sec.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go(first)}
              className="rounded-full px-3 py-1 text-[13px] font-semibold transition-colors"
              style={
                active
                  ? { backgroundColor: `hsl(${s.color})`, color: "#fff" }
                  : { backgroundColor: `hsl(${s.color} / 0.1)`, color: `hsl(${s.color})` }
              }
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div ref={stageRef} className="slide-stage">
        <div
          key={i}
          className="slide"
          style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})` }}
        >
          <SlideView slide={slide} section={sec} />
        </div>
      </div>

      <div className="slide-bar">
        <span className="mono text-[12px] tracking-[0.06em] opacity-60">
          {sec.label} · {slide.label}
        </span>
        <div className="flex items-center gap-3">
          <button type="button" className="slide-btn" onClick={() => go(i - 1)} aria-label="이전 장">
            ←
          </button>
          <span className="mono text-[13px] tracking-[0.06em]">
            {i + 1} / {flat.length}
          </span>
          <button type="button" className="slide-btn" onClick={() => go(i + 1)} aria-label="다음 장">
            →
          </button>
          <button
            type="button"
            className="slide-btn"
            onClick={() => void document.documentElement.requestFullscreen?.()}
            aria-label="전체 화면"
            title="전체 화면 (F)"
          >
            ⛶
          </button>
        </div>
      </div>
      <div className="slide-progress" style={{ width: `${((i + 1) / flat.length) * 100}%` }} />
    </div>
  );
}
