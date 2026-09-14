# 포크한 저장소를 원본과 맞추기

이 저장소를 **포크(fork)** 했다면, 원본에 새 커밋이 쌓일 때마다 내 포크로 가져와야 합니다.
그 방법을 적습니다.

---

## 먼저 — 포크가 필요한가요

대부분은 **필요 없습니다.**

| 하려는 일 | 방법 |
|---|---|
| 도구를 최신으로 | `install.sh --update` (Windows `install.ps1 -Update`) |
| 내 발표 슬라이드 만들기 | `baseline` 을 문서 폴더에 **복사** — [README](../README.md#발표-준비--처음부터-끝까지) |
| 저장소를 고쳐서 쓰거나 PR 을 보내기 | **포크** — 아래를 따릅니다 |

발표 자료는 포크가 아니라 복사로 만듭니다. 그래야 원본이 갱신돼도 충돌하지 않습니다.

---

## `~/.opencircuit/repo` 에서 작업하지 마세요

부트스트랩이 만든 `~/.opencircuit/repo` 는 **도구 전용**입니다.
포크의 작업 폴더로 쓰면 안 됩니다. 이유가 둘 있습니다.

1. 갱신이 `git pull --ff-only` 입니다. 거기에 내 커밋을 만들면 **다음 업데이트가 실패**합니다.
2. `--depth 1` 얕은 클론입니다. 이력이 한 커밋뿐이라 원본과 병합이 제대로 되지 않습니다.

포크는 **다른 곳에 새로 클론**합니다.

---

## 1. 포크하고 클론하기

GitHub 의 [joonhyungbae/opencircuit](https://github.com/joonhyungbae/opencircuit) 에서
오른쪽 위 **Fork** 를 누릅니다. 그러면 `https://github.com/<내계정>/opencircuit` 이 생깁니다.

내 작업 폴더에서:

```bash
git clone https://github.com/<내계정>/opencircuit.git
cd opencircuit
git remote add upstream https://github.com/joonhyungbae/opencircuit.git
```

이제 원격이 둘입니다. 확인:

```bash
git remote -v
# origin    https://github.com/<내계정>/opencircuit.git   ← 내 포크
# upstream  https://github.com/joonhyungbae/opencircuit.git  ← 원본
```

`origin` 은 내 것, `upstream` 은 원본입니다. **`upstream` 에는 푸시하지 않습니다.**

---

## 2. 원본의 새 커밋 가져오기

### 방법 A — GitHub 웹에서 (쉬움)

내 포크 페이지에 **Sync fork** 버튼이 있습니다. 누르면 GitHub 가 원본을 따라잡습니다.
그다음 내 컴퓨터에서:

```bash
git pull
```

### 방법 B — 터미널에서

```bash
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main
```

`--ff-only` 는 **내 main 에 내 커밋이 없을 때만** 성공합니다.
그게 좋은 것입니다 — 조용히 병합 커밋이 생기는 것을 막아 줍니다.

---

## 3. `--ff-only` 가 실패하면

```
fatal: Not possible to fast-forward, aborting.
```

내 `main` 과 원본이 **갈라졌다**는 뜻입니다. 내가 `main` 에 직접 커밋했을 때 생깁니다.

내 커밋을 브랜치에 옮겨 두고 `main` 을 원본과 똑같이 맞춥니다.

```bash
git branch my-change              # 지금 커밋들을 my-change 에 보관
git reset --hard upstream/main    # main 을 원본과 같게
git push --force-with-lease origin main
```

> [!WARNING]
> `reset --hard` 는 커밋하지 않은 변경을 지웁니다.
> 위 순서대로 `git branch` 를 **먼저** 해서 커밋을 보관한 뒤에 실행하세요.
> `git status` 로 지워질 것이 없는지 확인하면 더 안전합니다.

그다음 내 작업은 그 브랜치에서 이어 갑니다.

```bash
git switch my-change
```

---

## 4. 애초에 갈라지지 않게

**`main` 에 직접 커밋하지 않으면** 위의 3번을 겪을 일이 없습니다.

```bash
git switch main
git fetch upstream && git merge --ff-only upstream/main   # 항상 성공
git switch -c 내작업이름                                    # 여기서 작업
```

`main` 은 원본을 비추는 거울로만 두고, 내 변경은 늘 브랜치에 둡니다.

---

## 5. 충돌이 잘 나는 파일

| 파일 | 왜 | 어떻게 |
|---|---|---|
| `tools/react/baseline/src/deck.json` | 내 발표를 여기서 만들면 원본 템플릿 수정과 부딪힙니다 | 이 폴더를 **복사해서** 문서 폴더에서 작업하세요 |
| `package-lock.json` | 양쪽에서 의존성이 바뀌면 거의 항상 부딪힙니다 | 원본 것을 받고 `npm install` 을 다시 돌립니다 |

병합하다 막히면 되돌릴 수 있습니다.

```bash
git merge --abort
```

---

## 6. PR 을 보낼 때

```bash
git switch -c 내작업이름
# ... 고치고 커밋 ...
git push -u origin 내작업이름
```

GitHub 가 **Compare & pull request** 를 띄웁니다. 대상은 `joonhyungbae/opencircuit` 의 `main` 입니다.

PR 을 보내기 전에 원본을 한 번 따라잡아 두면 리뷰가 수월합니다.

```bash
git fetch upstream
git rebase upstream/main
```

---

## 요약

```bash
# 한 번만
git clone https://github.com/<내계정>/opencircuit.git
cd opencircuit
git remote add upstream https://github.com/joonhyungbae/opencircuit.git

# 원본 따라잡기 (필요할 때마다)
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main

# 내 작업
git switch -c 내작업이름
```
