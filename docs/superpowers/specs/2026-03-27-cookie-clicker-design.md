# 쿠키 클리커 게임 설계

## 개요
Node.js + Express + SQLite로 구현하는 쿠키 클리커 스타일 게임

## 아키텍처

```
[브라우저] <--HTTP--> [Express 서버] <--SQL--> [SQLite DB]
```

## 기술 스택
- **프론트엔드**: HTML, CSS, JavaScript (바닐라)
- **백엔드**: Express.js
- **데이터베이스**: SQLite (better-sqlite3)
- **세션**: express-session

## 디렉토리 구조

```
TestWebPage/
├── server.js           # Express 서버 진입점
├── package.json        # 의존성 관리
├── database/
│   └── init.js         # DB 초기화 스크립트
├── public/             # 정적 파일
│   ├── index.html      # 메인 페이지
│   ├── style.css       # 스타일시트
│   └── game.js         # 프론트엔드 로직
└── routes/
    └── game.js         # API 라우트
```

## 데이터베이스 스키마

### players 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | 고유 ID (세션 ID 매핑) |
| session_id | TEXT | 세션 ID |
| cookies | INTEGER | 현재 쿠키 수 |
| cookies_per_click | INTEGER | 클릭당 획득 쿠키 |
| cookies_per_second | INTEGER | 초당 자동 획득 쿠키 |
| created_at | DATETIME | 생성 시간 |

### upgrades 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | 고유 ID |
| player_id | INTEGER | 플레이어 ID (FK) |
| upgrade_type | TEXT | 업그레이드 타입 |
| level | INTEGER | 현재 레벨 |
| base_cost | INTEGER | 기본 비용 |

## 업그레이드 시스템

### 클릭 강화 (click_boost)
- 레벨당 클릭당 쿠키 +1
- 비용: 10 * 1.5^level

### 커서 (cursor)
- 레벨당 초당 쿠키 +0.1
- 비용: 15 * 1.15^level

### 할머니 (grandma)
- 레벨당 초당 쿠키 +1
- 비용: 100 * 1.15^level

### 농장 (farm)
- 레벨당 초당 쿠키 +8
- 비용: 1100 * 1.15^level

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/game | 게임 상태 조회 |
| POST | /api/click | 클릭 처리 |
| POST | /api/upgrade/:type | 업그레이드 구매 |
| POST | /api/game/reset | 게임 리셋 |

## UI 구성

```
+----------------------------------+
|         쿠키 클리커              |
+----------------------------------+
|                                  |
|         [🍪 쿠키]                |
|         쿠키: 0개                |
|         초당: 0개                |
|                                  |
+----------------------------------+
|         [업그레이드 상점]        |
+----------------------------------+
| 클릭 강화 Lv.0 [구매: 10개]      |
| 커서 Lv.0 [구매: 15개]           |
| 할머니 Lv.0 [구매: 100개]        |
| 농장 Lv.0 [구매: 1100개]         |
+----------------------------------+
```

## 자동 생산 로직

1. 프론트엔드에서 1초마다 `cookies_per_second`만큼 쿠키 증가
2. 서버에 주기적으로 동기화 (5초마다)
3. 페이지 이탈 시 현재 상태 저장

## 구현 순서

1. 프로젝트 초기화 (package.json, 의존성 설치)
2. 데이터베이스 초기화
3. Express 서버 설정
4. API 라우트 구현
5. 프론트엔드 UI 구현
6. 게임 로직 연동
7. 테스트 및 검증