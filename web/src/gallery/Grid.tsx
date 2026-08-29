import { useEffect, useState } from "react";

export interface ManifestItem {
  file: string;
  type: string;
  prompt?: string;
  model?: string;
  createdAt?: string;
}

function 주소(work: string, file: string): string {
  return `/work-media/${encodeURIComponent(work)}/${encodeURIComponent(file)}`;
}

function 종류말(type: string): string {
  if (type === "video") return "영상";
  if (type === "music") return "음악";
  return "이미지";
}

export function ResultGallery({
  work,
  tick,
}: {
  work: string;
  tick: number;
}) {
  const [items, setItems] = useState<ManifestItem[]>([]);
  const [error, setError] = useState("");
  const [연, set연] = useState<ManifestItem | null>(null);
  const [지울, set지울] = useState("");
  const [지우는중, set지우는중] = useState("");
  const name = work.trim() || "실습";

  useEffect(() => {
    if (!연) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") set연(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [연]);

  useEffect(() => {
    let alive = true;
    fetch("/api/works")
      .then((r) => {
        if (!r.ok) throw new Error("bad");
        return r.json() as Promise<{
          works: Array<{ name: string; items: ManifestItem[] }>;
        }>;
      })
      .then((data) => {
        if (!alive) return;
        const found = data.works.find((w) => w.name === name);
        setItems([...(found?.items ?? [])].reverse());
        setError("");
      })
      .catch(() => {
        if (!alive) return;
        setError("결과를 읽지 못했습니다. 이 웹이 켜져 있는지 확인하세요.");
      });
    return () => {
      alive = false;
    };
  }, [name, tick]);

  useEffect(() => {
    if (!지울) return;
    const id = window.setTimeout(() => set지울(""), 4000);
    return () => window.clearTimeout(id);
  }, [지울]);

  async function 지우기(it: ManifestItem) {
    if (지울 !== it.file) {
      set지울(it.file);
      return;
    }
    set지우는중(it.file);
    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work: name, file: it.file }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!data.ok) {
        setError(data.message ?? "지우지 못했습니다.");
        return;
      }
      setItems((prev) => prev.filter((x) => x.file !== it.file));
      if (연?.file === it.file) set연(null);
      set지울("");
      setError("");
    } catch {
      setError("서버에 연결하지 못했습니다. start.sh 가 켜져 있는지 확인하세요.");
    } finally {
      set지우는중("");
    }
  }

  function 삭제단추(it: ManifestItem, className: string) {
    const 두번 = 지울 === it.file;
    return (
      <button
        type="button"
        className={className + (두번 ? " warn" : "")}
        disabled={지우는중 === it.file}
        onClick={(e) => {
          e.stopPropagation();
          void 지우기(it);
        }}
      >
        {지우는중 === it.file ? "지우는 중…" : 두번 ? "정말 삭제" : "삭제"}
      </button>
    );
  }

  return (
    <div className="gallery-card">
      {error ? <div className="status err">{error}</div> : null}
      {items.length === 0 ? (
        <p className="quiet-note">아직 없음</p>
      ) : (
        <div className="media-grid">
          {items.map((it) => {
            const src = 주소(name, it.file);
            return (
              <article key={`${it.file}-${it.createdAt ?? ""}`} className="media-card">
                <button
                  type="button"
                  className="media-thumb"
                  onClick={() => set연(it)}
                >
                  {it.type === "image" ? (
                    <img src={src} alt={it.prompt ?? it.file} />
                  ) : it.type === "video" ? (
                    <video src={src} muted playsInline preload="metadata" />
                  ) : (
                    <div className="media-audio">음악</div>
                  )}
                </button>
                {삭제단추(it, "media-del")}
                <div className="media-meta">
                  <strong>{종류말(it.type)}</strong>
                  {it.model ? <span>{it.model}</span> : null}
                  {it.prompt ? <p>{it.prompt}</p> : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {연 ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => set연(null)}
        >
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            {연.type === "image" ? (
              <img src={주소(name, 연.file)} alt={연.prompt ?? 연.file} />
            ) : 연.type === "video" ? (
              <video src={주소(name, 연.file)} controls autoPlay playsInline />
            ) : (
              <audio src={주소(name, 연.file)} controls autoPlay />
            )}
            {연.prompt ? <p>{연.prompt}</p> : null}
            <div className="row">
              {삭제단추(연, "btn ghost")}
              <button type="button" className="btn ghost" onClick={() => set연(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
