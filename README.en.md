<div align="center">

# OpenCircuit

**MCP tooling for art & technology practice**

[![Program](https://img.shields.io/badge/opencircuit.club-000000?style=flat-square)](https://opencircuit.club)
[![Node](https://img.shields.io/badge/Node-20%2B-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-stdio-6E56CF?style=flat-square)](https://modelcontextprotocol.io)

[한국어](README.md) · English

</div>

---

## What is this

A set of MCP (Model Context Protocol) servers built so that participants in
**_OpenCircuit Busan: Art & Tech Practice_** can start making work in Cursor immediately.

Rather than wrestling with terminals and config files, artists talk to their AI editor —
to wire up motion capture, generate sound, or publish work to the web.

About the program → **[opencircuit.club](https://opencircuit.club)**

---

## Install

Cursor must already be installed. The bootstrap handles everything else (Node, git).

**Windows** — in PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
irm https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/bootstrap/install.ps1 -OutFile "$env:TEMP\oc-install.ps1"
& "$env:TEMP\oc-install.ps1"
```

> Why the first line: Windows blocks script execution by default. This allows it for
> this window only (`-Scope Process`) — your system settings are unchanged.

**macOS / Linux** — in Terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/bootstrap/install.sh -o /tmp/oc-install.sh
bash /tmp/oc-install.sh
```

> Linux uses the same script. It will not `sudo`/`apt` install Node; if missing, Node is unpacked in the home folder.
> On Windows, use the PowerShell steps above — do not run `install.sh` from Git Bash.

When it finishes, **quit Cursor completely and reopen it**, then check that
`opencircuit-hello` shows a green light in the MCP list. Then try asking Cursor:

> ping

---

## Studio web

The studio pages (caption, generate, gallery) are a React app with a light theme.
Launch them from the repository root:

**Windows** — PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
.\start.ps1
```

**macOS / Linux**:

```bash
./start.sh
```

The browser opens `http://127.0.0.1:1234`. Details → [web/README.md](web/README.md)

---

## Study slides

Where the Closed Circuit Busan study group **reads one art paper and builds a talk from it.**
Not a PPT file — you present from the browser. From the repository root:

**Windows** — PowerShell:

```powershell
.\web.ps1
```

**macOS / Linux**:

```bash
./web.sh
```

The browser opens `http://127.0.0.1:5173`. Pass a folder to open your own deck instead.
Details → [tools/react/README.md](tools/react/README.md)

### The eleven boxes

The talk asks, in eleven boxes, **what the paper actually wrote down.**

```
1 what the audience does → 2 what is sensed → 3 where computation runs
→ 4 real-time vs pre-rendered → 5 software → 6 what is output
→ 7 venue requirements → 8 was it released → 9 the question the work asks
10 abandoned attempts · 11 who did what   ← these sit under "how it was made"
```

**An empty box matters as much as a filled one.** If the paper did not say, leave it empty
and carry it as something to find out. Do not fill it with a guess.
It is not "there was none" — it is **"not stated in the paper (whether it existed is unknown)."**

Set `source` on a slide and a badge appears next to its title, so what the paper stated
and what the presenter supplied stay visually distinct.

### Preparing a talk, start to finish

How to have Cursor read the paper and build the slides. No coding involved.

**1. Pick a paper and note its DOI.** From the SIGGRAPH or SIGGRAPH Asia **Art Papers**.
The `10.1145/...` in the ACM Digital Library URL is the DOI.
**Download the PDF yourself in a browser** — the ACM DL blocks scripted access, so asking
an agent to fetch it will fail.

**2. Make your talk folder.** Under your documents folder, create
`OpenCircuit/<work-name>-study/` and copy two things into it:

| What | From |
|---|---|
| the contents of `baseline/` | `~/.opencircuit/repo/tools/react/baseline/` |
| `04-study-slides.md` | `~/.opencircuit/repo/prompts/` |

Put the downloaded PDF there too. The copied folder carries its own `README.md` with the
eleven block types and the `source` table, so you never need to reopen the repository.

**3. Open that folder in Cursor** — File → Open Folder. Your talk folder, not the repository.

**4. Ask the agent.** In Cursor chat (agent mode), swap in your DOI:

```
@04-study-slides.md
Paper DOI: 10.1145/3757369.3767596
The PDF is in this folder.
Please fill in src/deck.json from this paper.
```

It follows the [procedure](prompts/04-study-slides.md) and looks the paper up through
`tekneh`, whose eleven coded fields map one-to-one onto the
boxes above — so this is a lookup, not a guess. The corpus is **SIGGRAPH · SIGGRAPH Asia
art papers 2009–2026, 229 work papers.** Anything outside it (Ars Electronica, NIME, ISEA…)
gets read from the PDF instead, and every box is marked `source: reader`.

**5. Look at the badged slides.** Start with the yellow **"not stated in the paper"** ones.
Leave the box empty and carry it as something to find out (the default), or fill it from
outside the paper and change `source` to `reader`. **Never fill it with a guess** — those
gaps are what the discussion runs on.

**6. Add the figures.** Capture the paper's figures into `public/`, then set `src` to
`/filename.png` in each `figure` block. The agent notes which figure it wants in the caption.

**7. Write your three places.** The agent leaves these deliberately empty:
why you chose this paper, the one sentence for box 9, and the third discussion prompt.

**8. Run it.** From the repository root:

```bash
./web.sh ~/Documents/OpenCircuit/<work-name>-study
```

Edit `deck.json` and the browser reloads. `←` `→` to move, `F` for full screen,
append `#7` to the URL to jump to slide 7.

### When you are on SSH

Over SSH there is no screen inside the server, so no browser can open.
**If Tailscale is up, `web.sh` binds to the tailnet address on its own.** No flag needed.
If it is not, the script says so, serves on `127.0.0.1`, and prints the SSH port-forward command.

| Flag | What it does |
|---|---|
| `--tailscale` | Use the tailnet address even when a screen exists |
| `--local` | Turn the automatic switch off; bind `127.0.0.1` only |
| `--doctor` | Diagnose why the browser will not open |

It binds to the tailnet address only, so others on the same router cannot see it.

---

## Commands

| Command | What it does |
|---|---|
| `install.ps1` / `install.sh` | Install tools (safe to run repeatedly) |
| `--doctor` | Diagnose what's broken. **Try this first when something fails** |
| `--update` | Update the tools to the latest version |
| `start.ps1` / `start.sh` | Start the studio web |
| `web.ps1` / `web.sh` | Start the study presentation slides |

**Forking this repository** to modify it or send a PR → [keeping a fork in sync](docs/fork-and-sync.md) (Korean).
If you only want to build a talk, you do not need a fork — copy `baseline` instead.

The bootstrap also registers the art-paper corpus MCP (`tekneh`). It is a Python package
and needs `uv`, which the bootstrap installs for you. **It is optional — a failed install
does not stop the bootstrap**, and slides work without it. `--doctor` reports a `tekneh` row.

---

## The servers

One server per piece of software. This repository does not accumulate class sessions.

| Server | Role |
|---|---|
| `hello` | Install & connection check |
| `apiframe` | Image, video, and music generation |
| `github` | Create a repo and publish to Pages (planned) |
| `react` | Closed Circuit study slides |
| `p5js` | Web graphics baseline (planned) |

> Available now: `hello`, `apiframe`, the gallery (`tools/threejs/baseline`), webcam captions (`tools/transformersjs/baseline`), Processing sketches (`tools/processing/baseline`), and study slides (`tools/react/baseline`).

---

## Layout

```text
opencircuit/
├── tools/              # One folder per piece of software
│   └── <software>/
│       ├── server/     #   MCP server (optional)
│       ├── baseline/   #   Starting-point project (optional)
│       └── README.md
├── core/               # Not tied to any one piece of software
│   └── hello/          #   Install and connection check
├── web/                # Studio web (React, light theme)
├── start.ps1           # Launch the studio web (Windows)
├── start.sh            # Launch the studio web (macOS / Linux)
├── web.ps1             # Launch the study slides (Windows)
├── web.sh              # Launch the study slides (macOS / Linux)
├── prompts/            # Procedures you paste into an agent
│   └── 04-study-slides.md  # Art paper → presentation slides
├── bootstrap/          # Install scripts
│   ├── install.ps1     # Windows
│   ├── install.sh      # macOS / Linux
│   └── README.md       # Detailed guide for participants
└── docs/
    ├── architecture.md    # Design principles and decisions
    └── fork-and-sync.md   # Keeping a fork in sync
```

Folders are named after **the software**, not a role or a class schedule.
See [tools/README.md](tools/README.md) for the convention.

Once installed, the tools live under `.opencircuit/repo` in the home folder
(`%USERPROFILE%\.opencircuit\repo` on Windows, `~/.opencircuit/repo` on macOS and Linux).

> [!IMPORTANT]
> `.opencircuit` is **for tools only**.
> Don't keep artwork or working files in there — updates will conflict.
> Artwork goes under `OpenCircuit` in the Documents folder (`문서` or `Documents` on Windows; XDG Documents on Linux).

---

## Design principles

**Host neutral.** Cursor comes first, but the same servers run unchanged in Claude Code and
Codex. Server code never knows which editor is calling it.

**Knowledge lives in the tools.** Usage notes and caveats go into tool descriptions and return
values, not separate documentation. Whichever editor you open, the AI reads the same guidance.

**Failures speak human.** Instead of a stack trace, say what went wrong and what to do next.

**No network at launch.** Everything is fetched once at install; after that it starts offline.
We don't trust the classroom wifi.

More detail → [docs/architecture.md](docs/architecture.md)

---

## The program

| | |
|---|---|
| **Dates** | 2026.08.29 — 12.19 |
| **Cohort** | ~10 young artists based in Busan |
| **Venue** | Sasang Indi Station, and others |
| **Host** | Busan Cultural Foundation |

About the program → [opencircuit.club](https://opencircuit.club)

---

## License and usage policy

These are teaching materials built together with the participants, so **re-teaching and
commercialization are restricted, while personal study and making work stay open**.

| | |
|---|---|
| ✅ **Free to do** | Personal study and experimentation, use in your own work, quote, link, demo |
| ✅ **No restriction** | **Work you make** with these tools — exhibit, sell, distribute; no permission needed |
| ✋ **Ask first** | Using this as course or workshop material (paid or not) |
| ✋ **Ask first** | Selling it, bundling it into a paid product or service, or otherwise monetizing it |

What you make is entirely yours. The restrictions apply only to **the tools and materials
themselves**.

Want to teach with it? Email [jh.bae@kaist.ac.kr](mailto:jh.bae@kaist.ac.kr) — this is a
conversation, not a flat no.

Full terms in [LICENSE](LICENSE); third-party components in [NOTICE.md](NOTICE.md).

---

<div align="center">
<sub>

**[opencircuit.club](https://opencircuit.club)**

</sub>
</div>
