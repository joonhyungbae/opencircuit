# NOTICE — tools/apiframe

이 폴더의 서버 코드는 저장소 [LICENSE](../../LICENSE)를 따릅니다.
제3자 코드를 벤더링하지 않았습니다.

## 원격 서비스

| 대상 | 출처 | 비고 |
|---|---|---|
| APIFrame REST API v2 | https://api.apiframe.ai/v2 · https://apiframe.ai/docs/ | 실행 시 네트워크 호출. 키는 mcp.json `env` 의 `APIFRAME_KEY` |

## npm 의존성 (커밋되지 않음)

| 패키지 | 용도 |
|---|---|
| `@modelcontextprotocol/sdk` | MCP 서버 |
| `zod` | tool 입력 검증 |
| `typescript` | 빌드 |
