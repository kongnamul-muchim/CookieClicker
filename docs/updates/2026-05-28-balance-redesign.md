# 밸런스 전면 재설계 — 프레스티지 중심 구조

## 1. 변경 날짜
2026-05-28

## 2. 문제점
- **UI 버그**: `canEnhance`가 모든 건물에서 `true`라서 레벨 0부터 강화 버튼만 나타나고 일반 구매 불가
- **비용 벽**: 강화 비용이 `baseCost × 100` 고정값이라 초반에 갑자기 수천~수만 쿠키 필요
- **maxLevel 제한**: 모든 건물이 maxLevel=100에서 막혀 강제로 강화/초월 해야 함
- **프레스티지 별**: 강화 횟수 기반이라 직관적이지 않고 의미 부족

## 3. 해결 방법

### 3.1 건물 시스템 — maxLevel 제거, 무한 구매
- 모든 건물 `maxLevel: null`로 변경 (계속 구매 가능)
- `canEnhance`, `canSpecialEnhance` 필드 완전 제거
- CPS/clickBonus 값을 Cookie Clicker 비율에 맞게 조정

### 3.2 강화/초월 → 건물 마일스톤으로 대체
- 50레벨마다 해당 건물 생산량 ×2 (자동 해금, 비용 없음)
- 기존 enhance(), specialEnhance() 함수 제거
- 관련 API 라우트 (`/api/enhance`, `/api/special-enhance`) 삭제

### 3.3 프레스티지 계산 변경
**이전**: 강화 횟수 / 10
**변경**: `⭐ = √(총 획득 쿠키 / 100만)`

- 100만 쿠키 → 1⭐
- 1억 쿠키 → 10⭐
- 100억 쿠키 → 100⭐

### 3.4 프론트엔드 UI 개선
- 일반 구매 버튼 (+1, +10) 정상 표시
- 건물별 마일스톤 진행률 표시 (🏆 배지)
- 프레스티지 다이얼로그에 쿠키/별 정보 표시

## 4. 수정 파일 목록

| 파일 | 변경 내용 |
|---|---|
| `src/config/upgrades.ts` | maxLevel=null, CPS 조정, canEnhance/Special 제거, 마일스톤 함수 추가 |
| `src/lib/statsCalculator.ts` | enhancement 제거, 마일스톤 승수 계산 추가 |
| `src/lib/upgradeService.ts` | enhance/specialEnhance 제거, buyUpgradeBatch 추가 |
| `src/app/api/click/route.ts` | 단순화 |
| `src/app/api/upgrade/[type]/route.ts` | 단순화 |
| `src/app/api/upgrade-batch/[type]/route.ts` | buyUpgradeBatch 사용으로 변경 |
| `src/app/api/game/route.ts` | 불필요한 필드 제거 |
| `src/app/api/enhance/[type]/route.ts` | **삭제** |
| `src/app/api/special-enhance/[type]/route.ts` | **삭제** |
| `src/app/api/prestige/route.ts` | ⭐ 계산식 변경 (쿠키 기반) |
| `src/app/api/prestige/preview/route.ts` | ⭐ 프리뷰 변경 |
| `public/game-v3.js` | UI 전면 재작성 (강화→마일스톤) |
| `public/skillTree-v3.js` | 프레스티지 다이얼로그 업데이트 |
| `public/style.css` | 마일스톤 배지 스타일 추가 |
