# 2026-03-30 진행 상황 요약

## 완료된 작업

### 1. 프레스티지 시스템 구현
- ✅ DB 스키마 확장 (prestige_count, prestige_stars, unlocked_skills)
- ✅ 64개 스킬 데이터 구성
- ✅ SkillRepository, SkillService, PrestigeCalculator 구현
- ✅ 스킬 트리 UI
- ✅ 프레스티지 API (/api/prestige, /api/skills 등)

### 2. 밸런스 수정
- ✅ 특별 강화 비용: 티어별 고정 배율 적용
  - 커서: 15만, 할머니: 50만, 농장: 330만...
- ✅ 만렙 강화 통합: 100레벨에서 일반 강화 숨김

### 3. 버그 수정
- ✅ 프레스티지 sync 버그 (syncEnabled 변수)
- ✅ 스킬 트리 requires undefined 에러
- ✅ % 보너스 중첩 방식 (덧셈)

---

## 진행 중인 버그

### 만렙 특별 강화 버튼 문제
**증상:**
- `canSpecialEnhance: true`인데 "만렙" 버튼이 표시됨
- 버튼이 비활성화(disabled) 상태

**원인 분석:**
- 브라우저 캐시가 강력하게 걸려 있음
- 코드 수정 후에도 구버전 JS가 실행됨
- `renderUpgrades()`가 올바른 버튼을 생성하지만 UI에 반영 안 됨

**시도한 해결책:**
1. 캐시 버스팅 (?v=타임스탬프)
2. DOM 직접 조작 방식으로 변경
3. updateUpgrades() 로직 단순화

**아직 해결 안 됨**

---

## 다음 단계

1. 브라우저 캐시 완전 삭제 후 테스트
2. 또는 시크릿 모드로 접속
3. 버그 해결 후 문서 업데이트

---

## 파일 구조

```
docs/
├── updates/
│   └── 2026-03-30-prestige-system-changes.md
├── superpowers/
│   ├── specs/
│   │   └── 2026-03-30-prestige-skill-balance.md
│   └── plans/
│       └── 2026-03-30-prestige-skill-tree.md
└── project-structure.md
```

## 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `database/init.js` | prestige_count, prestige_stars 컬럼 추가 |
| `src/config/upgrades.js` | specialEnhanceMultiplier 추가 |
| `src/config/skills.js` | 64개 스킬 정의 (신규) |
| `src/services/upgradeService.js` | 특별 강화 비용 로직 수정 |
| `src/services/statsCalculator.js` | calculateSpecialEnhanceCost 추가 |
| `public/game.js` | renderUpgrades, updateUpgrades 수정 |
| `public/skillTree.js` | 스킬 트리 UI (신규) |
| `public/index.html` | 스킬 트리 모달, 버튼 추가 |
| `public/style.css` | 스킬 트리 스타일 추가 |