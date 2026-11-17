# 2026-11-17 보안 수정 — 잔액 조작 / 배치 상한 / 취약점 0건

## 1. 변경 날짜
2026-11-17

## 2. 문제점

### (1) 잔액 조작 — 심각
`POST /api/sync` 가 요청 본문의 `cookies` 를 검증 없이 DB 에 덮어썼다.
클릭 3번 상태에서 아래 요청만 보내면 20억 쿠키가 저장됐다.

```
POST /api/sync {"cookies": 2000000000}
→ 200 {"cookies": 2000000000}
```

재현 결과: 3 → 2,000,000,000. 이후 업그레이드 연속 구매 성공(초당 261개).

### (2) 배치 구매 무한 반복 — 서버 마비
`POST /api/upgrade-batch/[type]` 가 `body.count` 를 그대로 반복문 횟수로 사용했다.
`{"count": 1000000000}` 한 번으로 서버가 오래 점유된다.

### (3) 게임 전체 500 (조사 중 발견)
컨테이너가 `host.docker.internal` 을 해석하지 못해 DB 접속 실패.
`/api/game` 이 500 을 반환하고 있었다. 컨테이너를 `root_default` 네트워크에
연결하고 DB 주소를 `172.18.0.1` 로 바꿔 해결.

### (4) 의존성 취약점 25건
`npm audit` 기준 치명 1 / 높음 20 포함 25건. 대부분 puppeteer 전이 의존성.

### (5) 빌드 실패
`npm audit fix` 로 Next 가 16.4.6 이 되면서 root layout 부재가 오류가 됐다.
(`page.tsx doesn't have a root layout`)

## 3. 해결 방법

| 항목 | 수정 |
|---|---|
| 잔액 조작 | `playerService.syncCookies()` 추가. 서버가 `초당 생산량 × 경과시간 + 30` 만큼만 증가 허용, 클라이언트 값은 상한으로 clamp. 감소는 서버 상태 유지 |
| 배치 상한 | `count = Math.max(1, Math.min(Number(body.count) \|\| 10, 100))` |
| DB 연결 | 컨테이너 `--network root_default`, `DATABASE_URL` 호스트 `172.18.0.1` |
| 취약점 | puppeteer 를 devDependencies 에서 제거(테스트 스크립트 전용) → 25 → 0건 |
| 빌드 | `src/app/layout.tsx` 추가, Node 24-alpine 로 재빌드 |

## 4. 수정 파일 목록
- `src/lib/playerService.ts` — `syncCookies()` 추가, `PlayerData.updatedAt` 필드
- `src/app/api/sync/route.ts` — 검증 함수 사용
- `src/app/api/upgrade-batch/[type]/route.ts` — count 범위 제한
- `src/app/layout.tsx` — 신규 (root layout)
- `package.json`, `package-lock.json` — puppeteer 제거
- `.gitignore` — `tsconfig.tsbuildinfo` 추가

## 5. 검증 결과

| 검증 | 결과 |
|---|---|
| 조작 요청 (2,000,000,000) | `{"cookies":33}` — 차단 (클릭 3 + 여유 30) |
| 정상 구매 | 33 → 18 (`click_boost` 15) 정상 |
| count=10억 | 400 / 0.09초 (이전: 장시간 점유) |
| npm audit | 25 → **0건** |
| 라이브 (cookieclicker.olivilo.shop) | index 200 / game API 200 / 조작 요청 30으로 차단 |
| 컨테이너 Node | v24.22.3 |

## 6. 남은 것
- security headers 미설정 (`next.config`)
- `GET /api/player` 등 조회 라우트는 세션 쿠키만 확인 (소유권 검사 별도 확인 필요)
