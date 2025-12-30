# Study Intranet 초기 설정

## 초기 계정 생성

애플리케이션을 시작한 후, 다음 API 요청으로 초기 계정을 생성할 수 있습니다.

### 1. 관리자 계정 생성

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@study.com",
    "password": "admin123456",
    "name": "관리자",
    "roleLevel": "ADMIN"
  }'
```

**로그인 정보:**
- 이메일: `admin@study.com`
- 비밀번호: `admin123456`

### 2. 수석교사 계정

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "senior@study.com",
    "password": "senior123456",
    "name": "수석교사",
    "roleLevel": "SENIOR_TEACHER"
  }'
```

**로그인 정보:** senior@study.com / senior123456

### 3. 일반교사 계정

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@study.com",
    "password": "teacher123456",
    "name": "일반교사",
    "roleLevel": "TEACHER"
  }'
```

**로그인 정보:** teacher@study.com / teacher123456

## 빠른 설정

모든 계정을 한번에 생성하려면 애플리케이션 실행 후 이 명령어를 사용하세요:

```bash
npm run seed
```

또는 수동으로:

```bash
curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d '{"email":"admin@study.com","password":"admin123456","name":"관리자","roleLevel":"ADMIN"}'

curl -X POST http://localhost:3000/api/auth/signup -H "Content-Type: application/json" -d '{"email":"teacher@study.com","password":"teacher123456","name":"일반교사","roleLevel":"TEACHER"}'
```

## 로그인 계정 목록

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@study.com | admin123456 |
| 수석교사 | senior@study.com | senior123456 |
| 일반교사 | teacher@study.com | teacher123456 |
| 보조교사 | assistant@study.com | assistant123456 |
