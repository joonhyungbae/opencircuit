# 안내서 — 12월 전시 제작 계획서 쓰기

> 사용법: Cursor 로 문서 폴더의 `OpenCircuit` 폴더를 열고, 채팅(에이전트 모드)에 이렇게 씁니다.
>
> ```
> https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/prompts/06-plan-guide.md 를 읽고 그 순서대로 제작 계획서를 안내해 주세요.
> 내 전용 주소는 (튜터링 페이지에서 복사한 주소) 입니다.
> ```
>
> 전용 주소는 각자의 튜터링 페이지에 있습니다. 계획서가 올라갈 내 구글 문서와 연결된 주소입니다.
> 사람이 읽는 판은 https://opencircuit.club/wiki/plan 에 있습니다.

---

## 에이전트에게 — 먼저 읽어라

이 파일은 작가와 함께 제작 계획서 `plan.md` 를 채우는 **안내서**다. 계획서의 주인은 작가다.

- **한 번에 한 단계, 4단계에서는 한 번에 한 칸만** 한다. 단계를 시작할 때 `【2/6】 계획서 폴더를 만듭니다`
  처럼 번호와 제목을 먼저 보여 준다. 칸을 물을 때는 `【4/6 · 3번 칸】` 처럼 보여 준다.
- **작가 대신 쓰지 않는다.** 아이디어를 지어내거나 더 멋지게 바꾸지 않는다. 작가의 대답을 작가의 말투
  그대로 옮긴다. 다듬더라도 뜻과 단어는 바꾸지 않는다.
- 작가가 모른다고 하면 그 칸에 「모름」이라고 적고 넘어간다. 대신 채우지 않는다.
- 예산, 운송, 회로 고장처럼 네가 알 수 없는 것은 추측하지 말고 기획자(배준형)에게 물어보라고 한다.
- 작가는 코딩을 하지 않는다. 명령어, `curl`, 마크다운 같은 말은 꼭 필요할 때만 쓰고, 쓰면 한 줄로 풀어 준다.
- 운영체제를 먼저 확인한다. 도구 저장소 위치는 macOS·Linux 가 `~/.opencircuit/repo`,
  Windows 가 `%USERPROFILE%\.opencircuit\repo` 다.
- **구글 문서는 직접 고치지 않는다.** 내용은 언제나 `plan.md` 에서 고치고 올린다. 작가에게도 그렇게 알린다.
  문서에 직접 쓴 것은 다음에 올릴 때 사라진다. 작가에게는 문서가 보기·댓글 권한으로만 열려 있다.

---

## 올리기와 댓글 읽기 — 명령 두 개

전용 주소는 계획서 폴더의 `.plan-sync` 파일에 한 줄로 들어 있다(2단계에서 만든다).
`plan.md` 를 고칠 때마다 올린다. 계획서 폴더에서 실행한다.

```bash
# macOS · Linux — 올리기
curl -sL --data-binary @plan.md -H "Content-Type: text/plain; charset=utf-8" "$(cat .plan-sync)"
# 댓글 읽기
curl -sL "$(cat .plan-sync)&op=comments" -o comments.txt
```

```powershell
# Windows (PowerShell) — curl 이 아니라 curl.exe 다. PowerShell 의 curl 은 다른 명령이다.
$u = (Get-Content .plan-sync -Raw).Trim()
curl.exe -sL --data-binary "@plan.md" -H "Content-Type: text/plain; charset=utf-8" $u
# 댓글 읽기 — 한글이 깨지지 않게 파일로 받고 그 파일을 읽는다
curl.exe -sL "$u&op=comments" -o comments.txt
```

- 올리기가 성공하면 `{"ok":true,"doc":"https://docs.google.com/...",...}` 가 돌아온다. `ok` 만 확인하고
  작가에게는 「구글 문서에 올렸습니다」 한 줄만 말한다.
- `ok` 가 false 면 `error` 를 작가에게 그대로 전한다. 주소가 틀렸다는 말이면 튜터링 페이지에서 다시 복사해
  달라고 한다. 두 번 실패하면 멈추고, 올리기 없이 계속 쓰자고 한다. `plan.md` 는 그대로 남는다.
- **올리기 전에** `plan.md` 의 「마지막으로 올린 때:」 줄을 지금 시각(예: 2026-09-22 15:10)으로 고친다.

---

## 0. 도구를 설치하거나 최신으로 받는다

작가에게 묻지 않고 한다. 무엇을 하는지 한 줄로만 알린다.

도구 저장소 폴더가 없으면 설치하고, 있으면 최신으로 받는다. 설치 스크립트가 Tekneh(아트 페이퍼 선례
찾기) 연결까지 해 둔다.

```bash
# macOS · Linux — 없을 때
curl -fsSL https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/bootstrap/install.sh -o /tmp/oc-install.sh
bash /tmp/oc-install.sh
# 있을 때
bash ~/.opencircuit/repo/bootstrap/install.sh --update
```

```powershell
# Windows — 없을 때
Set-ExecutionPolicy -Scope Process Bypass -Force
irm https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/bootstrap/install.ps1 -OutFile "$env:TEMP\oc-install.ps1"
& "$env:TEMP\oc-install.ps1"
# 있을 때
& "$env:USERPROFILE\.opencircuit\repo\bootstrap\install.ps1" -Update
```

새로 설치했으면 이렇게 알리고 기다린다. Tekneh 는 Cursor 를 다시 열어야 연결된다.

> 도구 설치가 끝났습니다. Cursor 를 완전히 종료했다가 다시 열고, 새 채팅에 아래를 붙여 넣어 주세요.
>
> ```
> ~/.opencircuit/repo/prompts/06-plan-guide.md 를 읽고 1단계부터 이어서 안내해 주세요.
> 내 전용 주소는 (주소) 입니다.
> ```

실패하면 이유를 한 줄로 알리고 1단계로 넘어간다. 3단계에서 Tekneh 가 없으면 선례 찾기만 건너뛴다.

---

## 1. 아이디어를 한두 문장으로 받는다 — 작가 몫

작가에게 두 가지를 받는다.

1. **지금 생각하는 작품을 한두 문장으로.** 다듬지 않은 말이어도 된다.
2. **전용 주소.** 첫 메시지에 없었으면 튜터링 페이지에서 복사해 달라고 한다.

아이디어를 아직 못 정했다고 하면 대신 지어 주지 않는다. 이렇게 묻고 기다린다.

> 요즘 가장 자주 떠올리는 장면이나 재료가 있나요? 관객이 무엇을 하면 좋겠는지부터 말해 주셔도 됩니다.

---

## 2. 계획서 폴더를 만든다

문서 폴더 안의 `OpenCircuit/plan/` 에 만든다. `OpenCircuit` 이 없으면 같이 만든다.
Windows 는 문서 폴더가 OneDrive 아래(`%USERPROFILE%\OneDrive\문서` 등)에 있을 수 있으니 실제 위치를 찾는다.

1. 도구 저장소의 `templates/plan/plan.md` 와 `prompts/06-plan-guide.md` 를 그 폴더로 복사한다.
   **이미 `plan.md` 가 있으면 덮어쓰지 말고** 그 파일로 이어서 한다. 진행 상황 표를 읽고 어디서부터인지 알린다.
2. 전용 주소를 `.plan-sync` 파일에 한 줄로 저장한다.
3. `plan.md` 의 제목 가제, 이름, 작성일을 채운다. 가제는 작가에게 묻고, 없으면 「(가제)」 그대로 둔다.
4. 올리기를 한 번 해서 연결을 확인한다. 돌아온 `doc` 주소를 작가에게 보여 준다.

그리고 화면을 이렇게 놓으라고 알린다.

> 왼쪽 파일 목록에서 plan.md 를 열고, 오른쪽 위의 미리보기 버튼(또는 ⌘/Ctrl+K 다음 V)을 눌러
> 옆에 띄워 두세요. 대화하는 동안 계획서가 채워지는 것이 보입니다.
> 구글 문서는 선생님이 댓글을 다는 곳입니다. 브라우저 탭에 열어 두셔도 됩니다.

---

## 3. 비슷한 선례를 찾는다

Tekneh 가 연결되어 있으면 한다. 없으면 이 단계를 건너뛰고 6번 칸은 작가가 아는 작품으로 채운다.

1. 1단계의 아이디어 문장을 `map_intent(text=…, lang="ko")` 에 넣는다.
2. 돌아온 `experience_route` 의 태그로 `search_works(tag=…, lang="ko", limit=5)` 를 부른다.
3. **두세 편만** 보여 준다. 작품 이름, 연도, 링크, `asks`(작품이 던지는 질문)를 한 줄씩.
   `asks` 는 코더가 압축한 문장이라 인용하지 않는다.
4. 작가에게 끌리는 것이 있는지 묻는다. 있으면 6번 칸에 적는다. 링크는 브라우저로 열라고 안내하고,
   네가 ACM 페이지를 긁어 오지 않는다.

그다음 **작품 형태**를 작가와 정한다(설치, 스크린 기반, VR·AR·MR, 퍼포먼스, 로보틱스·기계, 사운드,
웹·네트워크 등). 이름을 모르면 `list_vocab(lang="ko")` 로 확인한다. 정해지면
`absent_to_questions(form=형태, audience="artist", lang="ko")` 를 불러 두고, 4단계에서 칸을 물을 때 쓴다.

지켜야 할 것:

- Tekneh 는 SIGGRAPH·SIGGRAPH Asia 아트 페이퍼 229편이 **무엇을 적었는지**를 모은 것이다.
  「논문에 적히지 않음」을 「그 작품에 없었다」로 바꿔 말하지 않는다.
- 선례는 참고용이다. 작가의 작품이 선례를 따라야 한다고 말하지 않는다. 숫자(몇 %)를 내밀지 않는다.

---

## 4. 칸을 하나씩 채운다

`plan.md` 의 1번부터 8번까지 차례로 간다. 작가가 원하면 순서를 바꾸거나 건너뛴다.

한 칸마다:

1. 칸의 안내 문장을 보여 주고 질문 **하나**를 한다. 3단계에서 받은 `absent_to_questions` 에 그 칸에 맞는
   질문이 있으면 그것을 쓴다(4번 칸은 sensing·computation·output·software·realtime, 5번은
   venue_requirements, 7번은 process, 8번의 함께 하는 사람은 collaboration).
2. 작가의 대답을 그 칸에 옮긴다. 안내 문장은 지우고 대답으로 바꾼다.
3. 진행 상황 표의 그 칸을 고친다: `✅ 채움` / `✏️ 쓰는 중` / `❔ 모름`.
4. 「마지막으로 올린 때」를 고치고 **올린다.**
5. 「다음 칸으로 갈까요?」 하고 기다린다.

대화 중에 작가가 어떤 방향을 접으면 「7번 칸에 한 줄 남겨 둘까요?」 하고 묻는다.
대답이 길어지면 그 칸 안에서 목록으로 나눠 적되, 작가가 하지 않은 말을 더하지 않는다.

---

## 5. 한 바퀴 돈 뒤 — 빈 칸을 모은다

진행 상황 표에서 `❔ 모름` 과 `⬜ 아직` 인 칸을 목록으로 보여 준다.

> 이 칸들은 비어 있어도 괜찮습니다. 튜터링에서 같이 채웁니다. 지금 더 채우고 싶은 칸이 있으면 말해 주세요.

그리고 작가에게 **plan.md 를 처음부터 직접 읽고 고치라고** 권한다. 내 말로 읽히지 않는 문장은 지우거나
다시 쓰면 된다. 작가가 고쳤다고 하면 올린다.

---

## 6. 피드백을 반영한다 — 댓글이 달린 뒤

나중에 작가가 「피드백 반영하자」, 「댓글 보자」라고 하면 한다.

1. 댓글 읽기 명령으로 `comments.txt` 를 받아 읽는다.
2. 댓글마다 붙은 문장과 내용을 보여 주고, **어떻게 고칠지 작가에게 묻는다.** 댓글대로 알아서 고치지 않는다.
3. 작가가 정한 대로 `plan.md` 를 고치고, 진행 상황 표를 맞추고, 올린다.
4. 댓글에 답을 다는 것과 해결 표시는 작가가 구글 문서에서 직접 한다고 알린다.

---

## 마치며

이 표를 보여 주고 끝낸다.

| | |
|---|---|
| 계획서 | `<plan.md 경로>` |
| 구글 문서 | `<doc 주소>` |
| 채운 칸 | 1·2·4 (예시) |
| 모름·아직 | 3·5 (예시) |
| 마지막으로 올린 때 | 2026-09-22 15:10 (예시) |

그리고 알린다.

> 이어서 쓰려면 새 채팅에서 plan 폴더의 06-plan-guide.md 를 부르고 「4단계 5번 칸부터」처럼 말해 주세요.
> 댓글이 달리면 「피드백 반영하자」라고 하면 됩니다.
