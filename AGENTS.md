# Cookie Clicker Game - 절대 규칙

## 1. 실행 전 확인

- **모든 실행 명령어는 사용자에게 물어보고 진행한다**
- 서버 시작, 종료, 재시작 전에 확인
- DB 삭제, 초기화 전에 확인

## 2. 변경 사항 설명

- 코드 수정 전에 무엇을 변경할지 설명
- 사용자 동의 후 진행

## 3. 서버 관리

- 서버 종료 시 다음 명령어들 사용 금지 (OpenCode도 종료됨):
  - `taskkill /F /IM node.exe`
  - `wmic process where "name='node.exe'" delete`
- 포트 3000만 종료하는 방식 사용:
  ```batch
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
      taskkill /F /PID %%a 2>nul
  )
  ```

## 4. 데이터 보존

- DB 파일(`database/game.db`)은 사용자 동의 없이 삭제하지 않는다
- 서버 재시작 시 세션 유지를 위해 player_id 쿠키 사용

## 5. 밸런스 수정

- 업그레이드 비용, 효과 등 밸런스 관련 수정은 사용자에게 제안하고 동의 받기

## 6. 코드 스타일

- 주석은 사용자가 요청할 때만 추가
- 불필요한 console.log 제거