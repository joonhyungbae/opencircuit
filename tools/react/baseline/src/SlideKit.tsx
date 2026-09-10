import { Fragment, type ReactNode } from "react";

export type Block =
  | { kind: "lead"; text: string }
  | { kind: "big"; text: string; sub?: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "cards"; cols?: 1 | 2 | 3; items: { title: string; lines?: string[]; text?: string }[] }
  | {
      kind: "steps";
      stack?: boolean;
      items: { no?: string; label: string; desc?: string; color?: string }[];
    }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "qa"; items: { q: string; a: string }[] }
  | { kind: "note"; tone?: "warn" | "info"; text: string }
  | { kind: "figure"; src: string; caption?: string; size?: "lg" }
  | { kind: "youtube"; src: string; caption?: string }
  | { kind: "row"; left: Block[]; right: Block[] };

export type Slide = {
  label: string;
  title?: string;
  subtitle?: string;
  cover?: { kicker: string; title: string; lines: string[] };
  image?: string;
  blocks?: Block[];
};

export type Section = { id: string; label: string; color: string; slides: Slide[] };
export type Deck = { deck: number; updatedAt: string; title: string; sections: Section[] };

const c = (color: string, a?: number) => (a ? `hsl(${color} / ${a})` : `hsl(${color})`);

const URL_RE =
  /(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)*\.(com|club|org|net|io|kr|dev|ai|co|be)(\/[^\s)]*[^\s).,·…])?/gi;

function youtubeId(src: string): string | null {
  const m = src.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m?.[1] ?? null;
}

function linkify(text: string, k: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const at = m.index!;
    if (at > 0 && /[\w./@-]/.test(text[at - 1])) continue;
    if (at > last) out.push(text.slice(last, at));
    const href = m[1] ? m[0] : `https://${m[0]}`;
    out.push(
      <a
        key={`${k}-${at}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-current/40 underline-offset-4 hover:decoration-current"
      >
        {m[0]}
      </a>,
    );
    last = at + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

export function inline(text: string): ReactNode {
  return text
    .split("**")
    .map((part, i) =>
      i % 2 ? (
        <strong key={i}>{linkify(part, String(i))}</strong>
      ) : (
        <Fragment key={i}>{linkify(part, String(i))}</Fragment>
      ),
    );
}

function BlockView({ b, color }: { b: Block; color: string }) {
  switch (b.kind) {
    case "row":
      return (
        <div className="grid min-h-0 flex-1 grid-cols-2 items-stretch gap-10">
          <div className="flex h-full min-h-0 flex-col gap-4">
            {b.left.map((child, i) => (
              <BlockView key={`l${i}`} b={child} color={color} />
            ))}
          </div>
          <div className="flex h-full min-h-0 flex-col justify-center gap-4">
            {b.right.map((child, i) => (
              <BlockView key={`r${i}`} b={child} color={color} />
            ))}
          </div>
        </div>
      );
    case "lead":
      return (
        <div
          className="rounded-xl border-2 px-6 py-4"
          style={{ borderColor: c(color), backgroundColor: c(color, 0.07) }}
        >
          <p className="text-[2.04rem] leading-relaxed break-keep whitespace-pre-line font-medium">
            {inline(b.text)}
          </p>
        </div>
      );
    case "big":
      return (
        <div className="py-6">
          <p className="display-ko text-[4.8rem] leading-[1.15] break-keep">{inline(b.text)}</p>
          {b.sub && (
            <p className="mt-5 text-[1.92rem] leading-relaxed break-keep opacity-65">
              {inline(b.sub)}
            </p>
          )}
        </div>
      );
    case "bullets":
      return (
        <ul className="space-y-3">
          {b.items.map((it, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-[1.92rem] leading-relaxed break-keep"
            >
              <span
                className="mt-[0.62em] h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: c(color) }}
              />
              <span>{inline(it)}</span>
            </li>
          ))}
        </ul>
      );
    case "cards":
      return (
        <div
          className={`grid gap-4 ${b.cols === 3 ? "md:grid-cols-3" : b.cols === 1 ? "grid-cols-1" : "md:grid-cols-2"}`}
        >
          {b.items.map((card, i) => (
            <div key={i} className="rounded-2xl border border-foreground/12 bg-surface p-6">
              <p className="text-[1.62rem] font-bold break-keep" style={{ color: c(color) }}>
                {inline(card.title)}
              </p>
              {card.text && (
                <p className="mt-2 text-[1.44rem] leading-relaxed break-keep opacity-80">
                  {inline(card.text)}
                </p>
              )}
              {card.lines && (
                <ul className="mt-2 space-y-1.5">
                  {card.lines.map((l, j) => (
                    <li key={j} className="text-[1.44rem] leading-relaxed break-keep opacity-80">
                      {inline(l)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    case "steps":
      if (b.stack)
        return (
          <div className="space-y-5">
            {b.items.map((st, i) => (
              <div key={i} className="flex items-center gap-6">
                {st.no && (
                  <span
                    className="mono w-[9.6rem] shrink-0 text-right text-[2.52rem] font-bold tabular-nums"
                    style={{ color: c(st.color ?? color) }}
                  >
                    {st.no}
                  </span>
                )}
                <span
                  className="h-[5.04rem] w-[7px] shrink-0 rounded-full"
                  style={{ backgroundColor: c(st.color ?? color) }}
                />
                <div className="min-w-0">
                  <p className="text-[2.64rem] leading-tight font-bold break-keep">{st.label}</p>
                  {st.desc && (
                    <p className="mt-1.5 text-[1.74rem] leading-snug break-keep opacity-60">
                      {inline(st.desc)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      return (
        <div
          className={`grid gap-3 ${b.items.length >= 4 ? "md:grid-cols-4" : b.items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}
        >
          {b.items.map((st, i) => (
            <div key={i} className="space-y-1.5 text-center">
              <div
                className="rounded-xl px-3 py-4 text-[1.62rem] font-bold text-white shadow"
                style={{
                  backgroundColor: c(st.color ?? color),
                  boxShadow: `0 3px 10px -3px ${c(st.color ?? color, 0.4)}`,
                }}
              >
                {st.no && <span className="mono mr-1.5 text-[1.04rem] opacity-70">{st.no}</span>}
                {st.label}
              </div>
              {st.desc && (
                <p className="text-[1.32rem] leading-snug break-keep opacity-65">{inline(st.desc)}</p>
              )}
            </div>
          ))}
        </div>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-2xl border border-foreground/12">
          <table className="w-full text-[1.56rem]">
            <thead>
              <tr style={{ backgroundColor: c(color, 0.08) }}>
                {b.head.map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left font-bold" style={{ color: c(color) }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i} className="border-t border-foreground/10">
                  {r.map((cell, j) => (
                    <td key={j} className="px-5 py-3 break-keep">
                      {inline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "qa":
      return (
        <div className="space-y-4">
          {b.items.map((it, i) => (
            <div key={i} className="rounded-2xl border border-foreground/12 bg-surface p-5">
              <p className="text-[1.62rem] font-bold break-keep" style={{ color: c(color) }}>
                {inline(it.q)}
              </p>
              <p className="mt-2 text-[1.56rem] leading-relaxed break-keep">{inline(it.a)}</p>
            </div>
          ))}
        </div>
      );
    case "youtube": {
      const id = youtubeId(b.src);
      if (!id) return null;
      return (
        <figure className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-3 [container-type:size]">
          <div
            className="overflow-hidden rounded-xl bg-black"
            style={{ aspectRatio: "16 / 9", width: "min(100cqi, calc(100cqh * 16 / 9))" }}
          >
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}`}
              title={b.caption ?? "YouTube 영상"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="block h-full w-full"
            />
          </div>
          {b.caption && (
            <figcaption className="text-[1.44rem] leading-relaxed break-keep opacity-65">
              {inline(b.caption)}
            </figcaption>
          )}
        </figure>
      );
    }
    case "figure":
      return (
        <figure className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
          <img
            src={b.src}
            alt={b.caption ?? ""}
            className={
              b.size === "lg"
                ? "min-h-0 h-full w-full flex-1 object-contain"
                : "min-h-0 max-h-full max-w-full flex-1 object-contain"
            }
          />
          {b.caption && (
            <figcaption className="text-[1.44rem] leading-relaxed break-keep opacity-65">
              {inline(b.caption)}
            </figcaption>
          )}
        </figure>
      );
    case "note":
      return (
        <div
          className="rounded-xl px-6 py-4 text-[1.56rem] leading-relaxed break-keep"
          style={{
            backgroundColor: b.tone === "warn" ? "hsl(45 95% 60% / 0.25)" : c(color, 0.08),
          }}
        >
          {inline(b.text)}
        </div>
      );
  }
}

export function SlideView({ slide, section }: { slide: Slide; section: Section }) {
  if (slide.image) {
    return (
      <div className="flex h-full items-center justify-center">
        <img
          src={slide.image}
          alt={slide.label}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </div>
    );
  }
  if (slide.cover) {
    return (
      <div className="flex h-full flex-col justify-center">
        <p
          className="mono text-[1.32rem] uppercase tracking-[0.25em]"
          style={{ color: c(section.color) }}
        >
          {slide.cover.kicker}
        </p>
        <h1 className="display-ko mt-5 text-[6.6rem] leading-[1.05] break-keep">
          {slide.cover.title}
        </h1>
        <div className="mt-8 space-y-1.5">
          {slide.cover.lines.map((l, i) => (
            <p key={i} className="text-[1.92rem] leading-relaxed break-keep opacity-70">
              {inline(l)}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="shrink-0 border-b-[3px] pb-3" style={{ borderColor: c(section.color) }}>
        <h2
          className="text-[3.12rem] font-bold tracking-tight break-keep"
          style={{ color: c(section.color) }}
        >
          {slide.title ?? slide.label}
        </h2>
        {slide.subtitle && (
          <p className="mt-2 text-[1.62rem] leading-relaxed break-keep opacity-65">
            {inline(slide.subtitle)}
          </p>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-6 overflow-y-auto">
        {slide.blocks?.map((b, i) => (
          <BlockView key={i} b={b} color={section.color} />
        ))}
      </div>
    </div>
  );
}
