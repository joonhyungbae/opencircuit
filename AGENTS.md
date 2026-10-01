# AGENTS.md — 이 저장소에서 일하는 AI 에이전트에게

Cursor, Claude Code, Codex 등 어떤 도구로 들어왔든 이 파일을 먼저 읽습니다.
사람에게 설명하는 글은 [README.md](README.md) 에 있습니다.

## 이 저장소의 자리

《2026 오픈서킷 부산: 아트앤테크 프랙티스》 수강생이 Cursor 에서 바로 작업을 시작하도록
만든 **허브**입니다. 설치 스크립트, MCP 서버, 수업용 안내서가 여기 있고, 작품의 출발점이
되는 예제는 **저장소 하나에 하나씩** 따로 있습니다. 여기는 그것들을 모아 안내합니다.

## 새 예제 저장소를 만들 때

**[docs/example-repo.md](docs/example-repo.md) 를 먼저 읽습니다.** 이름 규칙, 갖출 파일,
README 차례, 지킬 것, 내보내기 전 확인이 거기 있습니다.

1. 규칙: [`docs/example-repo.md`](docs/example-repo.md)
2. 틀: [`templates/example-repo/`](templates/example-repo/) — 자리표시자를 채워 쓴다
3. 참고 구현: [dicy2-stepchorus](https://github.com/joonhyungbae/dicy2-stepchorus) — 규칙을
   실제로 지킨 저장소다. 막히면 같은 자리를 어떻게 풀었는지 본다

만들고 나면 README 의 「따로 있는 저장소」 표에 한 줄 더합니다.

## 이 저장소에서 지킬 것

- **폴더 이름은 소프트웨어의 통용 이름.** 역할이나 수업 일정으로 부르지 않습니다. 규약은
  [tools/README.md](tools/README.md).
- **수강생이 받는 것입니다.** 설치 스크립트(`bootstrap/`)와 안내서(`prompts/`)가 깨지면
  수업이 멈춥니다. 고치면 맥과 윈도우 양쪽 경로를 모두 확인합니다.
- **안내서는 에이전트가 읽고 한 단계씩 진행하는 글입니다.** 한 번에 한 단계, 작가 대신
  쓰지 않기, 모르면 묻기라는 틀을 유지합니다.
- **주석과 문서는 한국어.** 긴 대시 대신 쉼표와 마침표로 끊습니다.
- **라이선스는 소스 공개**(OpenCircuit License v1.0)입니다. 오픈소스라고 부르지 않습니다.
