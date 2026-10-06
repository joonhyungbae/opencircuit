#!/usr/bin/env bash
#
# 켜기 (맥 · 리눅스)
#
#   ./start.sh            카메라가 있으면 카메라로, 없으면 가짜 관객으로 켠다
#   ./start.sh --sim      언제나 가짜 관객으로
#   ./start.sh --offline 30   스피커 없이 30초를 out.wav 로 적는다
#
# conda 환경(<환경이름>)으로 켠다. conda 는 터미널 설정 없이도 찾는다(scripts/conda.sh).
set -euo pipefail
cd "$(dirname "$0")"

# shellcheck source=scripts/conda.sh
source scripts/conda.sh   # ENV_NAME, find_conda, env_exists
CONDA="$(find_conda)" || { echo "conda 가 없습니다. 먼저 설치해 주세요:  bash install.sh" >&2; exit 1; }
env_exists "$CONDA" || { echo "conda 환경($ENV_NAME)이 없습니다. 먼저 설치해 주세요:  bash install.sh" >&2; exit 1; }
run() { "$CONDA" run --no-capture-output -n "$ENV_NAME" python "$@"; }

# Dicy2 엔진이 깔려 있으면 서버를 대신 띄워 준다. 사람이 창을 두 개 띄울 일이 없다.
ENGINE="engine/<엔진>/dicy2_server.py"
port_busy() { (exec 3<>/dev/tcp/127.0.0.1/"$1") 2>/dev/null; }
USE_DICY2=0
RECV_PORT=1233
if [ -f "$ENGINE" ]; then
  USE_DICY2=1
  # 이미 켜 둔 엔진이 있으면 그것을 쓴다. 없으면 비어 있는 포트 짝을 찾아 새로 켠다.
  if port_busy 4566; then
    echo "▸ 이미 켜져 있는 Dicy2 엔진을 씁니다"
  else
    SEND_PORT=4566
    while port_busy "$RECV_PORT" && [ "$RECV_PORT" -lt 1260 ]; do
      RECV_PORT=$((RECV_PORT + 1))
    done
    echo "▸ Dicy2 엔진을 켭니다 (받기 ${SEND_PORT}, 보내기 ${RECV_PORT})"
    "$CONDA" run --no-capture-output -n "$ENV_NAME" python "$ENGINE" \
      --recvport "$SEND_PORT" --sendport "$RECV_PORT" > engine/dicy2.log 2>&1 &
    ENGINE_PID=$!
    trap 'kill $ENGINE_PID 2>/dev/null || true' EXIT
    sleep 4
  fi
fi

# 인자를 안 주면 모델 파일이 있는지 보고 정한다. 처음 쓰는 사람이 무엇을 쳐야 할지 몰라도 켜진다.
ARGS=("$@")
if [ ${#ARGS[@]} -eq 0 ] && [ ! -f "<모델파일>" ]; then
  echo "▸ 웹캠용 모델이 없어 가짜 관객(--sim)으로 켭니다."
  ARGS=(--sim)
fi
# --engine 을 따로 적지 않았고 엔진이 깔려 있으면 Dicy2 로 켠다.
case " ${ARGS[*]:-} " in
  *" --engine "*) ;;
  *) [ "$USE_DICY2" = "1" ] && ARGS+=(--engine dicy2 --dicy2-recv "$RECV_PORT") ;;
esac
# <자료이름> 묶음이 있는데 --corpus 를 안 적었으면 그것으로 켠다. 기본 사인파보다 들을 만하다.
case " ${ARGS[*]:-} " in
  *" --corpus "*) ;;
  *) [ -d "corpus/<자료이름>" ] && ARGS+=(--corpus corpus/<자료이름>) ;;
esac

# 브라우저를 3초 뒤에 연다. 서버가 뜰 틈을 준다.
URL="http://127.0.0.1:7000"
# 리눅스에도 open 이라는 다른 명령이 있어서 운영체제를 먼저 본다.
( sleep 3
  if [ "$(uname -s)" = "Darwin" ]; then open "$URL" >/dev/null 2>&1
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1
  fi ) &

# 빈 배열을 그냥 펼치면 맥 기본 bash(3.2)가 set -u 에서 unbound variable 로 멈춘다.
# 그래서 ${ARGS[@]+"${ARGS[@]}"}, ${ARGS[*]:-} 꼴로 쓴다
run run.py ${ARGS[@]+"${ARGS[@]}"}
