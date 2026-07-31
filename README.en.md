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
irm https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/bootstrap/install.ps1 -OutFile "$env:TEMP\oc-install.ps1"
& "$env:TEMP\oc-install.ps1"
```

**macOS** — in Terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/bootstrap/install.sh -o /tmp/oc-install.sh
bash /tmp/oc-install.sh
```

When it finishes, **quit Cursor completely and reopen it**, then check that
`opencircuit-hello` shows a green light in the MCP list. Then try asking Cursor:

> ping

---

## Commands

| Command | What it does |
|---|---|
| `install.ps1` / `install.sh` | Install (safe to run repeatedly) |
| `--doctor` | Diagnose what's broken. **Try this first when something fails** |
| `--update` | Update the tools to the latest version |

---

## The servers

Each session's needs become one server.

| Server | Role | Session |
|---|---|---|
| `hello` | Install & connection check | — |
| `station` | Create and publish a personal site | 1 · ongoing |
| `genmedia` | Image and video generation pipeline | 1 · 5 |
| `osc` | Motion capture, sensor, and sound bridge | 3 · 6 · 8 |
| `unity` | Game engine integration | 4 |
| `webaudio` | Web sound art | 8 |

> Only `hello` is implemented so far. The rest arrive alongside the class schedule.

---

## Layout

```text
opencircuit/
├── servers/            # MCP servers, one per role
│   └── hello/
├── bootstrap/          # Install scripts
│   ├── install.ps1     # Windows
│   ├── install.sh      # macOS
│   └── README.md       # Detailed guide for participants
└── docs/
    └── architecture.md # Design principles and decisions
```

Once installed, the tools live in `~/.opencircuit/repo`.

> [!IMPORTANT]
> `~/.opencircuit` is **for tools only**.
> Don't keep artwork or working files in there — updates will conflict.

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

Nine teaching sessions, two field research trips, critique and installation — closing with a
public showcase on December 19.
Full curriculum → [opencircuit.club/curriculum](https://opencircuit.club/curriculum)

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
