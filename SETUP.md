# Study Intranet 설치 가이드

## 🚀 빠른 시작

### 1단계: 의존성 설치

```bash
pnpm install
# 또는
npm install
```

### 2단계: 환경 변수 설정

`.env.example` 파일을 `.env.local`로 복사하고 Supabase 정보를 입력하세요.

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열고 다음 값들을 입력하세요:

```env
# Supabase 프로젝트 설정에서 확인
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Supabase 프로젝트 설정 > Database > Connection string에서 확인
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres

# 개발 환경
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3단계: 데이터베이스 마이그레이션

Supabase Dashboard의 SQL Editor에서 다음 파일들을 순서대로 실행하세요:

#### 1) 초기 스키마 생성

`prisma/migrations/001_initial_schema.sql` 파일의 내용을 복사하여 Supabase SQL Editor에 붙여넣고 실행하세요.

**실행 방법:**
1. Supabase Dashboard 접속
2. 좌측 메뉴에서 "SQL Editor" 클릭
3. "New query" 클릭
4. `001_initial_schema.sql` 파일 내용 붙여넣기
5. "Run" 버튼 클릭

#### 2) Row Level Security 정책 설정

`prisma/migrations/002_row_level_security.sql` 파일의 내용을 복사하여 동일한 방식으로 실행하세요.

### 4단계: Prisma Client 생성

```bash
npx prisma generate
```

### 5단계: 개발 서버 실행

```bash
pnpm dev
# 또는
npm run dev
```

브라우저에서 http://localhost:3000 을 열어 확인하세요.

---

## 📝 마이그레이션 파일 설명

### `001_initial_schema.sql`
- ENUM 타입 생성 (RoleLevel, Gender, EnrollmentStatus 등)
- 모든 테이블 생성 (users, students, teachers, classes, sessions 등)
- 외래 키 관계 설정
- 인덱스 생성
- updatedAt 자동 업데이트 트리거
- 초기 태그 데이터 시드

### `002_row_level_security.sql`
- 모든 테이블에 RLS 활성화
- 권한 레벨별 접근 제어 정책 설정
- Supabase Auth와 users 테이블 자동 연동 트리거

---

## 🔐 권한 레벨

시스템은 6단계 권한 레벨을 사용합니다:

| 레벨 | 역할 | 주요 권한 |
|-----|------|---------|
| LV0 | 관리자 (ADMIN) | 시스템 전체 제어 |
| LV1 | 수석교사 (SENIOR_TEACHER) | 클래스 생성, 태그 관리 |
| LV2 | 일반교사 (TEACHER) | 세션 관리, 출결 체크 |
| LV3 | 보조교사 (ASSISTANT) | 출결 체크, 자료 열람 |
| LV4 | 학생 (STUDENT) | 과제 제출, 자료 열람 |
| LV5 | 학부모 (PARENT) | 자녀 정보 모니터링 |

---

## 🗄️ 데이터베이스 구조

주요 테이블:
- `users` - 사용자 기본 정보
- `students` - 학생 정보
- `teachers` - 교사 정보
- `parents` - 보호자 정보
- `classes` - 클래스 정보
- `sessions` - 개별 수업 세션
- `attendances` - 출석 기록
- `assignments` - 과제
- `submissions` - 과제 제출
- `materials` - 수업 자료
- `tags` - 태그 (다중 연결)

자세한 스키마는 `prisma/schema.prisma` 파일을 참고하세요.

---

## 🛠️ 개발 도구

### Prisma Studio

데이터베이스를 시각적으로 관리하려면 Prisma Studio를 사용하세요:

```bash
npx prisma studio
```

### 스키마 변경 시

`prisma/schema.prisma` 파일을 수정한 후:

```bash
# 마이그레이션 생성
npx prisma migrate dev --name your_migration_name

# Prisma Client 재생성
npx prisma generate
```

---

## 🐛 트러블슈팅

### Prisma 연결 오류

```bash
# Prisma Client 재생성
npx prisma generate

# 캐시 삭제
rm -rf node_modules/.prisma
pnpm install
```

### Supabase 연결 오류

- API Keys 확인
- 프로젝트 일시 중지 상태 확인 (7일 미사용 시 일시 중지)
- RLS 정책 확인

### 환경 변수 오류

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 모든 필수 변수가 입력되었는지 확인
- 개발 서버 재시작

---

## 📚 다음 단계

설치가 완료되면 다음 문서들을 참고하세요:

1. **[기능명세서.md](./기능명세서.md)** - 전체 기능 상세 설명
2. **[API_설계.md](./API_설계.md)** - REST API 엔드포인트
3. **[배포계획서.md](./배포계획서.md)** - 배포 및 확장 전략

---

## 💡 유용한 명령어

```bash
# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린트 체크
pnpm lint

# Prisma Studio 실행
npx prisma studio

# Prisma Client 생성
npx prisma generate

# 타입 체크
pnpm tsc --noEmit
```

---

**문제가 발생하면 이슈를 남겨주세요!**
