/**
 * 수강생에게 보이는 문구. 스택·API 키는 여기 넣지 않는다.
 * 경로는 OS마다 다르므로 paths.ts 가 만든 절대경로를 넣는다.
 */
import { mcpJsonPath, opencircuitHome, workDirHint } from "./paths.js";

export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

const KEY_PATTERN = /afk_[A-Za-z0-9]+/g;

export function redact(text: string): string {
  return text.replace(KEY_PATTERN, "afk_***");
}

export function msgNoKey(): string {
  return (
    `APIFrame API 키가 없습니다. Cursor MCP 설정(${mcpJsonPath()})의 ` +
    `opencircuit-apiframe 서버 env 블록에 APIFRAME_KEY=... 를 넣어 주세요. ` +
    `부트스트랩을 다시 실행하거나 해당 파일을 직접 수정한 뒤 Cursor를 재시작하세요.`
  );
}

export function msgForbiddenOc(): string {
  return (
    `이 경로는 도구 전용 폴더(${opencircuitHome()})입니다. ` +
    `작품을 여기에 두면 도구를 업데이트할 때 지워지거나 충돌합니다. ` +
    `${workDirHint()} 을 쓰거나, 그 밖 경로를 지정하세요.`
  );
}

export function msgBadWorkName(): string {
  return "작업 이름이 비었거나 경로 문자( / \\ .. )가 들어 있습니다. 한글·영문·숫자로 된 짧은 이름을 넣어 주세요. 예: 첫작업";
}

export function msgHttpStatus(status: number, apiMessage: string): string {
  const safe = redact(apiMessage).slice(0, 200);
  switch (status) {
    case 400:
      return `요청이 잘못됐습니다 (${safe || "입력 확인"}). 프롬프트를 짧게 바꿔 다시 시도하세요.`;
    case 401:
      return `APIFrame 키가 없거나 잘못됐습니다. ${mcpJsonPath()} 의 opencircuit-apiframe env 에 APIFRAME_KEY 를 넣고 Cursor를 재시작하세요.`;
    case 402:
      return "APIFrame 크레딧이 부족합니다. https://console.apiframe.ai 에서 잔액을 확인한 뒤 수업 운영자에게 알리세요. 더 싼 설정(이미지 1장, 영상 draft 5초)으로 다시 시도하세요.";
    case 403:
      return "이 API 키로는 요청할 수 없습니다. 콘솔에서 키가 활성인지 확인한 뒤 Cursor를 재시작하세요.";
    case 404:
      return "작업을 찾지 못했습니다. 작업 ID를 다시 확인하거나 generate_* 를 다시 호출하세요.";
    case 429:
      return "요청이 너무 많습니다. 1분 뒤에 check_job 또는 생성을 다시 시도하세요.";
    case 503:
      return "APIFrame 이 잠시 바쁩니다. 1분 뒤에 다시 시도하세요.";
    default:
      return `APIFrame 요청이 실패했습니다 (HTTP ${status}${safe ? `: ${safe}` : ""}). 네트워크를 확인한 뒤 다시 시도하세요.`;
  }
}

export function toUserMessage(err: unknown): string {
  if (err instanceof UserFacingError) return err.message;
  const raw = err instanceof Error ? err.message : "알 수 없는 오류";
  return `요청에 실패했습니다: ${redact(raw)}. 네트워크와 API 키를 확인한 뒤 다시 시도하세요.`;
}

export const NEXT_AFTER_GENERATE =
  "기다리는 동안 다른 것을 만들어도 됩니다. 다음: `check_job` 으로 확인하거나, 작업 폴더의 전시장 `index.html` 을 여세요.";

export const NEXT_AFTER_SUBMIT =
  "기다리는 동안 다른 것을 만들어 보세요. 다음: `check_job` 에 이 작업 ID를 넣어 확인하세요.";
