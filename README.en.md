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

## Commands

| Command | What it does |
|---|---|
| `install.ps1` / `install.sh` | Install tools (safe to run repeatedly) |
| `--doctor` | Diagnose what's broken. **Try this first when something fails** |
| `--update` | Update the tools to the latest version |
| `start.ps1` / `start.sh` | Start the studio web |

---

## The servers

One server per piece of software. This repository does not accumulate class sessions.

| Server | Role |
|---|---|
| `hello` | Install & connection check |
| `apiframe` | Image, video, and music generation |
| `github` | Create a repo and publish to Pages (planned) |
| `p5js` | Web graphics baseline (planned) |

> Available now: `hello`, `apiframe`, the gallery (`tools/threejs/baseline`), and webcam captions (`tools/transformersjs/baseline`).

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
├── bootstrap/          # Install scripts
│   ├── install.ps1     # Windows
│   ├── install.sh      # macOS / Linux
│   └── README.md       # Detailed guide for participants
└── docs/
    └── architecture.md # Design principles and decisions
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
