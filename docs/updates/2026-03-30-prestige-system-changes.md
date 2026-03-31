# 프레스티지 시스템 변경 사항

**날짜:** 2026-03-30

---

## 1. 특별 강화 비용 밸런스 수정

### 문제
- 기존: 100레벨 특별 강화 비용이 **175억 쿠키** (커서 기준)
- 너무 비싸서 초반 업그레이드는 사실상 불가능

### 해결
티어별 고정 배율 적용:

| 업그레이드 | baseCost | 배율 | 특별 강화 비용 |
|-----------|----------|------|---------------|
| 커서 | 15 | ×10,000 | 150,000 |
| 할머니 | 100 | ×5,000 | 500,000 |
| 농장 | 1,100 | ×3,000 | 3,300,000 |
| 광산 | 12,000 | ×2,000 | 24,000,000 |
| 공장 | 130,000 | ×1,500 | 195,000,000 |
| 은행 | 1,400,000 | ×1,000 | 14억 |
| 사원 | 20,000,000 | ×800 | 160억 |
| 마법사 탑 | 330,000,000 | ×500 | 1,650억 |
| 포털 | 1,000,000,000 | ×300 | 3,000억 |

### 수정 파일
- `src/config/upgrades.js` - specialEnhanceMultiplier 추가
- `src/services/statsCalculator.js` - calculateSpecialEnhanceCost() 추가
- `src/services/upgradeService.js` - buildUpgradeState(), specialEnhance() 수정
- `src/routes/gameRoutes.js` - /api/special-enhance/:type 수정
- `public/game.js` - specialEnhanceCost 사용

---

## 2. 만렙 강화 통합

### 문제
- 100레벨에서 일반 강화 버튼과 만렙 특별 강화 버튼이 동시에 표시됨
- UI 혼란

### 해결
- 100레벨(만렙) 도달 시 일반 강화 버튼 숨김
- 만렙 특별 강화 버튼만 표시
- 만렙 효과는 100레벨 도달 시 즉시 발동

### 수정 파일
- `src/services/upgradeService.js:36-37` - canEnhance에 !isMaxLevel 조건 추가
- `public/game.js` - 버튼 로직 수정, updateUpgrades()에서 renderUpgrades() 자동 호출

---

## 3. 프레스티지 Sync 버그 수정

### 문제
- 프레스티지 후 쿠키가 초기화되지 않음
- 원인: syncGame()이 5초마다 실행되어 이전 쿠키값을 DB에 다시 저장

### 해결
- syncEnabled 변수 추가
- 프레스티지 실행 중 sync 일시 중단

### 수정 파일
- `public/game.js` - syncEnabled 변수, prestige() 함수 수정

---

## 4. UI 수정 사항

### 4.1 만렙 효과 시각화
- 만렙 도달 시 스페셜 효과 설명 옆에 ✅ 표시
- 활성화된 효과는 초록색 굵은 글씨로 표시

### 4.2 깜빡임/활성화 버그 수정
- canSpecialEnhance가 true여도 specialEnhanceCost가 0이면 활성화 표시 안 함
- 클래스 로직 수정

### 4.3 버튼 텍스트 변경
- "특별 강화" → "만렙 특별 강화"

### 수정 파일
- `public/game.js` - renderUpgrades(), updateUpgrades()
- `public/style.css` - .special-effect.active 추가

---

## 5. 스킬 트리 UI 버그 수정

### 문제
- skill.requires가 undefined일 때 에러 발생

### 해결
- null 체크 추가: `skill.requires && skill.requires.length > 0`

### 수정 파일
- `public/skillTree.js` - canUnlockSkill(), createSkillTooltip()

---

## 6. DB 스키마 확장

### 추가 컬럼
- `players.prestige_count` - 프레스티지 횟수
- `players.prestige_stars` - 특수 재화(⭐)

### 추가 테이블
- `unlocked_skills` - 해금된 스킬 저장

### 수정 파일
- `database/init.js` - createTables() 수정

---

## 7. 신규 파일

| 파일 | 설명 |
|------|------|
| `src/config/skills.js` | 64개 스킬 정의 |
| `src/repositories/skillRepository.js` | 스킬 DB 접근 |
| `src/services/skillService.js` | 스킬 비즈니스 로직 |
| `src/services/prestigeCalculator.js` | ⭐ 지급량 계산 |
| `public/skillTree.js` | 스킬 트리 UI |

---

## 8. 신규 API

| API | Method | 설명 |
|-----|--------|------|
| `/api/prestige` | POST | 프레스티지 실행 |
| `/api/prestige/preview` | GET | 예상 ⭐ 조회 |
| `/api/skills` | GET | 스킬 상태 조회 |
| `/api/skill/unlock/:skillId` | POST | 스킬 해금 |