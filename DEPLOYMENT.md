# Cookie Clicker Vercel 배포 가이드

## 1. Neon Database 생성

1. https://console.neon.tech 에서 회원가입
2. **Create a new project** 클릭
3. 프로젝트 이름: `cookie-clicker`
4. Database URL 복사 (`.env` 파일에 저장)

## 2. 로컬 DB 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
DATABASE_URL="postgresql://..." # Neon 에서 복사한 URL
```

## 3. 로컬에서 Prisma 마이그레이션 실행

```bash
# Prisma 스키마를 Neon DB 에 적용
npx prisma db push
```

## 4. GitHub 에 푸시

```bash
git add .
git commit -m "feat: migrate to Next.js + Prisma + Neon"
git push origin main
```

## 5. Vercel 배포

1. https://vercel.com 에서 로그인
2. **Add New Project** 클릭
3. GitHub 저장소 선택 (`kongnamul-muchim/CookieClicker`)
4. **Import** 클릭

### 환경 변수 설정

Vercel 프로젝트 설정 → Environment Variables:
- `DATABASE_URL`: Neon Database URL

### 배포 설정

- **Framework Preset**: Next.js (자동 감지)
- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next` (기본값)

5. **Deploy** 클릭

## 6. Vercel Storage 연결 (선택)

Vercel 대시보드 → Storage → Connect Database → Neon 선택

## 7. 테스트

배포된 URL 에서:
- 게임 로딩 확인
- 쿠키 클릭 작동 확인
- 업그레이드 구매 확인
- 세션 유지 확인 (새로고침 후 데이터 유지)
- 프레스티지 작동 확인

## 8. 포트폴리오 링크 업데이트

프로젝트가 작동하면 포트폴리오의 Cookie Clicker 항목을 업데이트:

```markdown
# portfolio/src/content/projects/cookie-clicker.md 수정
demo: https://cookie-clicker-xxxx.vercel.app
type: web  # server → web 으로 변경
```

---

## 문제 해결

### Prisma Client 에러
```bash
npx prisma generate
```

### 로컬 테스트
```bash
npm run dev
# http://localhost:3000 접속
```

### DB 초기화
```bash
npx prisma db push --force-reset
```
