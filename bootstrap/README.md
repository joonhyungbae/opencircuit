# OpenCircuit 부트스트랩

수업용 도구를 컴퓨터에 한 번 설치합니다. 터미널을 처음 쓰는 분을 기준으로 안내합니다.

## 중요

- 도구는 `~/.opencircuit/repo` 에만 설치됩니다.
- **작품·스케치·작업 폴더는 `~/.opencircuit` 안에 두지 마세요.**
  여기에 두면 도구 업데이트(`git pull`)와 충돌할 수 있습니다.

## Windows

1. 관리자가 안내한 방법으로 `bootstrap` 폴더의 `install.ps1` 을 실행한다.
   (저장소를 이미 받은 경우 그 안의 `bootstrap\install.ps1` 을 실행해도 됩니다.)
2. PowerShell에서:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
.\install.ps1
```

3. **Cursor를 완전히 종료했다가 다시 연다.**
4. Cursor 설정 → MCP 에서 `opencircuit-hello` 가 초록불인지 확인한다.

문제가 있으면:

```powershell
.\install.ps1 -Doctor
```

도구를 최신으로 갱신하려면:

```powershell
.\install.ps1 -Update
```

## macOS

1. 터미널에서 `bootstrap` 폴더로 이동한다.
2. 아래를 실행한다.

```bash
chmod +x install.sh
./install.sh
```

3. **Cursor를 완전히 종료했다가 다시 연다.**
4. Cursor 설정 → MCP 에서 `opencircuit-hello` 가 초록불인지 확인한다.

문제가 있으면:

```bash
./install.sh --doctor
```

업데이트:

```bash
./install.sh --update
```

## 스크린샷 자리

<!-- TODO: Cursor MCP 초록불 스크린샷 -->

**(여기에 Cursor MCP 목록에서 opencircuit-hello 초록불이 보이는 화면을 넣습니다.)**

<!-- TODO: ping 성공 스크린샷 -->

**(여기에 ping 도구 호출 결과가 보이는 화면을 넣습니다.)**

## 알아둘 것

- 설정은 **전역** `~/.cursor/mcp.json` 에 저장됩니다. 작업 폴더를 바꿔도 도구가 따라옵니다.
- 첫 설치·업데이트 때만 인터넷이 필요합니다. 설치가 끝나면 비행기 모드에서도 ping 이 되어야 합니다.
- API 키 같은 비밀값은 Cursor MCP 설정의 `env` 칸에 넣습니다. (나중 회차)
