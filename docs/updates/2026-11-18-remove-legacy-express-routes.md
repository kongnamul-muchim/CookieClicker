# 2026-11-18 옛 Express 라우터(gameRoutes.js) 제거

## 1. 변경 날짜
2026-11-18

## 2. 문제점

`src/routes/gameRoutes.js`(312줄)에 Express 시절 라우터 클래스가 남아 있었다.

- 16개 엔드포인트를 직접 등록한다: `/api/game`, `/api/click`, `/api/upgrade/:type`,
  `/api/upgrade-batch/:type`, `/api/enhance/:type`, `/api/special-enhance/:type`,
  `/api/game/reset`, `/api/prestige`, `/api/skill/unlock/:skillId`, `/api/skills`,
  `/api/prestige/preview`, `/api/sync`, `/api/player`, `/api/stats`,
  `/api/debug/reset-special/:type`, `/api/achievements`
- 현재 구현(`src/app/api/**/route.ts`)과 **이름이 같은 엔드포인트가 11개** 겹친다.
- `express` 는 `package.json` 의존성에 없고, `src/` 어디에서도 import 하지 않는다.
- 실제 실행 경로는 Dockerfile `CMD ["node", ".next/standalone/server.js"]` = Next.js 하나뿐이다.

즉 **죽은 코드**인데, 저장소를 읽는 사람에게는 "이 서버가 아직 살아있다"고 오해를 만든다.
코드 감사(3층 정적 스캔)에서도 같은 경로가 두 번 잡혀 판정을 흐린다.

## 3. 해결 방법

- `src/routes/gameRoutes.js` 삭제 (참조 0건 확인 후).
- 빈 `src/routes/` 디렉터리도 제거.

## 4. 수정 파일 목록

- 삭제: `src/routes/gameRoutes.js`

## 5. 검증

- `grep -rn "gameRoutes" src/` → 0건
- `grep -c express package.json` → 0
- Docker 이미지 재빌드 성공 → 샌드박스 컨테이너에서 `/api/game` 200 확인
