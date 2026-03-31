# 프로젝트 폴더 구조

```
Cookie Clicker Game/
├── database/
│   ├── game.db              # SQLite DB (sql.js)
│   └── init.js              # DB 초기화, 스키마
│
├── docs/
│   ├── updates/             # 변경 사항 문서
│   │   └── 2026-03-30-prestige-system-changes.md
│   └── superpowers/
│       ├── specs/           # 밸런스 설계 문서
│       │   └── 2026-03-30-prestige-skill-balance.md
│       └── plans/           # 구현 계획 문서
│           └── 2026-03-30-prestige-skill-tree.md
│
├── public/                  # 프론트엔드
│   ├── index.html
│   ├── game.js              # 메인 게임 로직
│   ├── skillTree.js         # 스킬 트리 UI
│   ├── sounds.js            # 사운드 매니저
│   └── style.css
│
├── src/
│   ├── config/
│   │   ├── upgrades.js      # 업그레이드 설정
│   │   └── skills.js        # 스킬 설정 (64개)
│   │
│   ├── repositories/
│   │   ├── playerRepository.js
│   │   ├── upgradeRepository.js
│   │   └── skillRepository.js
│   │
│   ├── services/
│   │   ├── playerService.js
│   │   ├── upgradeService.js
│   │   ├── skillService.js
│   │   ├── statsCalculator.js
│   │   └── prestigeCalculator.js
│   │
│   ├── routes/
│   │   └── gameRoutes.js
│   │
│   └── container.js         # DI 컨테이너
│
├── .superpowers/
│   └── brainstorm/          # 브레인스토밍 결과
│
├── server.js                # Express 서버
├── package.json
└── AGENTS.md                # AI 에이전트 규칙
```

---

## API 엔드포인트

| API | Method | 설명 |
|-----|--------|------|
| `/api/game` | GET | 전체 게임 상태 |
| `/api/click` | POST | 쿠키 클릭 |
| `/api/upgrade/:type` | POST | +1 레벨 업 |
| `/api/upgrade-batch/:type` | POST | +10 레벨 업 |
| `/api/enhance/:type` | POST | 강화 |
| `/api/special-enhance/:type` | POST | 만렙 특별 강화 |
| `/api/game/reset` | POST | 게임 리셋 |
| `/api/sync` | POST | 쿠키 동기화 |
| `/api/prestige` | POST | 프레스티지 실행 |
| `/api/prestige/preview` | GET | 예상 ⭐ 조회 |
| `/api/skills` | GET | 스킬 상태 조회 |
| `/api/skill/unlock/:skillId` | POST | 스킬 해금 |

---

## DB 테이블

### players
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK |
| session_id | TEXT | 세션 ID |
| cookies | REAL | 보유 쿠키 |
| cookies_per_click | REAL | 클릭당 쿠키 |
| cookies_per_second | REAL | CPS |
| prestige_count | INTEGER | 프레스티지 횟수 |
| prestige_stars | INTEGER | 특수 재화(⭐) |

### upgrades
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK |
| player_id | INTEGER | FK |
| upgrade_type | TEXT | 업그레이드 타입 |
| level | INTEGER | 레벨 |
| enhancement_count | INTEGER | 강화 횟수 |
| special_enhancement | INTEGER | 특별 강화 여부 |

### unlocked_skills
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | PK |
| player_id | INTEGER | FK |
| skill_id | TEXT | 스킬 ID |
| unlocked_at | DATETIME | 해금 시간 |