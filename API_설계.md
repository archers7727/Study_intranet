# API 엔드포인트 설계

## 인증 방식

**헤더:**
```
Authorization: Bearer {access_token}
```

**권한 레벨:**
- LV0: 관리자
- LV1: 수석교사
- LV2: 일반교사
- LV3: 보조교사
- LV4: 학생
- LV5: 학부모

---

## 1. 인증 (Authentication)

### 1.1 회원가입
```
POST /api/auth/signup
Body: { email, password, name, roleLevel }
Response: { user, session }
권한: Public (초기 회원가입은 관리자가 직접 생성 권장)
```

### 1.2 로그인
```
POST /api/auth/login
Body: { email, password }
Response: { user, session, accessToken }
권한: Public
```

### 1.3 로그아웃
```
POST /api/auth/logout
Response: { success: true }
권한: All
```

### 1.4 현재 사용자 정보
```
GET /api/auth/me
Response: { user, profile }
권한: All
```

---

## 2. 학생 관리 (Students)

### 2.1 학생 목록 조회
```
GET /api/students
Query: ?search=홍길동&status=ENROLLED&page=1&limit=20&tags=수학,영어
Response: {
  students: [...],
  pagination: { total, page, limit, hasNext }
}
권한: LV0-2 (전체), LV3-5 (본인/자녀만)
```

### 2.2 학생 상세 조회
```
GET /api/students/:id
Response: { student, attendanceRate, assignments, statusLogs }
권한: LV0-2 (전체), LV4-5 (본인/자녀만)
```

### 2.3 학생 등록
```
POST /api/students
Body: {
  name, birthDate, gender, school, phone,
  parentId?, tags?
}
Response: { student, generatedStudentId, generatedPassword }
권한: LV0-1
```

### 2.4 학생 정보 수정
```
PATCH /api/students/:id
Body: { name?, school?, enrollmentStatus?, managementStatus?, ... }
Response: { student }
권한: LV0-1
```

### 2.5 학생 삭제
```
DELETE /api/students/:id
Response: { success: true }
권한: LV0
```

### 2.6 학생 상태 변경 (주의/정상)
```
POST /api/students/:id/status
Body: { newStatus, reason }
Response: { student, statusLog }
권한: LV0-1
```

---

## 3. 보호자 관리 (Parents)

### 3.1 보호자 목록
```
GET /api/parents
Query: ?search=김&page=1
Response: { parents: [...] }
권한: LV0-1
```

### 3.2 보호자 등록
```
POST /api/parents
Body: { name, phone, email, relation }
Response: { parent }
권한: LV0-1
```

### 3.3 자녀 연결
```
POST /api/parents/:id/students
Body: { studentId }
Response: { parent }
권한: LV0-1
```

---

## 4. 교사 관리 (Teachers)

### 4.1 교사 목록
```
GET /api/teachers
Response: { teachers: [...] }
권한: LV0-1
```

### 4.2 교사 등록
```
POST /api/teachers
Body: { name, email, phone, roleLevel, specialties }
Response: { teacher }
권한: LV0
```

### 4.3 교사 권한 변경
```
PATCH /api/teachers/:id/role
Body: { roleLevel }
Response: { teacher }
권한: LV0
```

---

## 5. 클래스 관리 (Classes)

### 5.1 클래스 목록
```
GET /api/classes
Query: ?isActive=true&tags=수학
Response: { classes: [...] }
권한: LV0-2 (전체), LV3 (담당 클래스만)
```

### 5.2 클래스 상세
```
GET /api/classes/:id
Response: {
  class,
  mainTeacher,
  assistantTeachers,
  students,
  sessions,
  tags
}
권한: LV0-2 (전체), LV3 (담당만), LV4-5 (수강 중인 것만)
```

### 5.3 클래스 생성
```
POST /api/classes
Body: {
  name, description, cost,
  mainTeacherId, assistantTeacherIds,
  recurringSchedules, tags
}
Response: { class }
권한: LV0-1
```

### 5.4 클래스 복사
```
POST /api/classes/:id/duplicate
Body: { newName, newMainTeacherId? }
Response: { class }
권한: LV0-1
```

### 5.5 학생 추가/제거
```
POST /api/classes/:id/students
Body: { studentId }
Response: { class }

DELETE /api/classes/:id/students/:studentId
Response: { success: true }
권한: LV0-1
```

### 5.6 보조교사 추가/제거
```
POST /api/classes/:id/assistants
Body: { teacherId }
Response: { class }

DELETE /api/classes/:id/assistants/:teacherId
Response: { success: true }
권한: LV0-1
```

---

## 6. 세션 관리 (Sessions)

### 6.1 세션 목록 (캘린더용)
```
GET /api/sessions
Query: ?from=2024-01-01&to=2024-01-31&classId=xxx&view=month
Response: { sessions: [...] }
권한: LV0-3 (전체), LV4-5 (본인 수강만)
```

### 6.2 세션 상세
```
GET /api/sessions/:id
Response: {
  session,
  class,
  attendances,
  assignments,
  materials
}
권한: LV0-3 (전체), LV4-5 (본인 수강만)
```

### 6.3 세션 일괄 생성
```
POST /api/sessions/bulk-create
Body: {
  classId,
  startDate,
  endDate,
  excludeDates?: [...],
  location?
}
Response: { sessions: [...], count }
권한: LV0-1
```

### 6.4 세션 수정
```
PATCH /api/sessions/:id
Body: { location?, status?, notes? }
Response: { session }
권한: LV0-2
```

### 6.5 세션 취소
```
DELETE /api/sessions/:id
Response: { success: true }
권한: LV0-1
```

---

## 7. 출석 관리 (Attendance)

### 7.1 출석 체크
```
POST /api/sessions/:id/attendance
Body: { studentId, status }
Response: { attendance }
권한: LV0-3
```

### 7.2 일괄 출석 처리
```
POST /api/sessions/:id/attendance/bulk
Body: { attendances: [{ studentId, status }, ...] }
Response: { attendances: [...] }
권한: LV0-3
```

### 7.3 출석 수정
```
PATCH /api/attendance/:id
Body: { status, notes }
Response: { attendance }
권한: LV0-2
```

### 7.4 학생별 출석률 조회
```
GET /api/students/:id/attendance-rate
Query: ?from=2024-01-01&to=2024-12-31&classId=xxx
Response: {
  totalSessions,
  presentCount,
  absentCount,
  rate,
  details: [...]
}
권한: LV0-2 (전체), LV4-5 (본인/자녀만)
```

---

## 8. 과제 관리 (Assignments)

### 8.1 과제 부여
```
POST /api/sessions/:id/assignments
Body: {
  title, description, dueDate,
  maxScore?, tags?
}
Response: { assignment, submissions }
권한: LV0-2
```

### 8.2 과제 목록 (세션별)
```
GET /api/sessions/:id/assignments
Response: { assignments: [...] }
권한: LV0-3 (전체), LV4 (본인만)
```

### 8.3 과제 상세 (제출 현황)
```
GET /api/assignments/:id
Response: {
  assignment,
  submissions: [{ student, status, score, ... }]
}
권한: LV0-2 (전체), LV4 (본인만)
```

### 8.4 과제 수정
```
PATCH /api/assignments/:id
Body: { title?, description?, dueDate? }
Response: { assignment }
권한: LV0-2
```

### 8.5 과제 삭제
```
DELETE /api/assignments/:id
Response: { success: true }
권한: LV0-2
```

---

## 9. 과제 제출 (Submissions)

### 9.1 과제 제출
```
POST /api/assignments/:id/submit
Body: { fileUrl? }
Response: { submission }
권한: LV4 (본인만)
```

### 9.2 과제 채점
```
PATCH /api/submissions/:id/grade
Body: { score, feedback }
Response: { submission }
권한: LV0-2
```

### 9.3 학생별 과제 목록
```
GET /api/students/:id/assignments
Query: ?status=NOT_SUBMITTED&page=1
Response: { assignments: [...] }
권한: LV0-2 (전체), LV4-5 (본인/자녀만)
```

---

## 10. 수업 자료 (Materials)

### 10.1 자료 업로드
```
POST /api/materials
Body: FormData { file, title, description, tags }
Response: { material }
권한: LV0-3
```

### 10.2 자료 목록
```
GET /api/materials
Query: ?search=수학&tags=중등&page=1
Response: { materials: [...] }
권한: All
```

### 10.3 자료 상세
```
GET /api/materials/:id
Response: { material, relatedSessions }
권한: All
```

### 10.4 세션에 자료 연결
```
POST /api/sessions/:id/materials
Body: { materialId }
Response: { sessionMaterial }
권한: LV0-3
```

### 10.5 자료 삭제
```
DELETE /api/materials/:id
Response: { success: true }
권한: LV0-2 (본인 생성만), LV0 (전체)
```

---

## 11. 태그 관리 (Tags)

### 11.1 태그 목록
```
GET /api/tags
Query: ?category=수준&sortBy=usageCount
Response: { tags: [...] }
권한: All
```

### 11.2 태그 생성
```
POST /api/tags
Body: { name, color, category, description }
Response: { tag }
권한: LV0-1
```

### 11.3 태그 수정
```
PATCH /api/tags/:id
Body: { name?, color?, category? }
Response: { tag }
권한: LV0-1
```

### 11.4 태그 삭제
```
DELETE /api/tags/:id
Response: { success: true }
권한: LV0-1
```

### 11.5 태그 사용량 통계
```
GET /api/tags/stats
Response: {
  totalTags,
  totalTaggedItems,
  untaggedCount,
  avgTagsPerItem,
  topTags: [...]
}
권한: LV0-1
```

### 11.6 태그 기반 검색
```
POST /api/search/by-tags
Body: {
  tagIds: [...],
  logic: "AND" | "OR",
  targetType: "students" | "classes" | "materials"
}
Response: { results: [...] }
권한: LV0-2
```

---

## 12. 연락처 관리 (Contacts)

### 12.1 통합 연락처 목록
```
GET /api/contacts
Query: ?type=student,parent&sortBy=name
Response: {
  contacts: [{
    id, name, phone, type,
    relation?, studentName?
  }]
}
권한: LV0-2
```

---

## 13. 대시보드 (Dashboard)

### 13.1 교사 대시보드
```
GET /api/dashboard/teacher
Response: {
  todaysSessions: [...],
  upcomingAssignments: [...],
  recentAttendance: {...},
  cautionStudents: [...]
}
권한: LV0-3
```

### 13.2 학생 대시보드
```
GET /api/dashboard/student
Response: {
  upcomingSessions: [...],
  pendingAssignments: [...],
  recentGrades: [...],
  attendanceRate: ...
}
권한: LV4
```

### 13.3 학부모 대시보드
```
GET /api/dashboard/parent
Response: {
  children: [{
    name,
    upcomingSessions,
    pendingAssignments,
    attendanceRate,
    recentGrades
  }]
}
권한: LV5
```

---

## 14. 통계 및 리포트 (Reports)

### 14.1 클래스별 출석률
```
GET /api/reports/attendance
Query: ?classId=xxx&from=2024-01-01&to=2024-12-31
Response: { report: {...} }
권한: LV0-2
```

### 14.2 학생별 성적 리포트
```
GET /api/reports/grades/:studentId
Query: ?from=2024-01-01&to=2024-12-31
Response: {
  student,
  assignments: [...],
  avgScore,
  chart: [...]
}
권한: LV0-2 (전체), LV4-5 (본인/자녀만)
```

---

## 15. 파일 업로드 (File Upload)

### 15.1 이미지 업로드 (프로필 등)
```
POST /api/upload/image
Body: FormData { file }
Response: { url }
권한: All
```

### 15.2 파일 업로드 (자료, 과제)
```
POST /api/upload/file
Body: FormData { file }
Response: { url, fileType, fileSize }
권한: All
```

**제한사항:**
- 최대 파일 크기: 10MB
- 허용 확장자: pdf, ppt, pptx, doc, docx, jpg, png, zip

---

## 에러 응답 형식

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "권한이 없습니다.",
    "details": {}
  }
}
```

**에러 코드:**
- `UNAUTHORIZED`: 인증 필요
- `FORBIDDEN`: 권한 부족
- `NOT_FOUND`: 리소스 없음
- `VALIDATION_ERROR`: 입력 데이터 오류
- `CONFLICT`: 중복 데이터
- `INTERNAL_ERROR`: 서버 에러

---

## Rate Limiting

**무료 티어 제한:**
- 일반 API: 100 req/min/IP
- 업로드 API: 10 req/min/IP
- 벌크 생성: 5 req/min/IP

**응답 헤더:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## WebSocket (선택적)

**실시간 출석 체크 (선택 사항):**
```
ws://api.example.com/ws/sessions/:id/attendance
Event: { type: "attendance_checked", data: {...} }
```

권한: LV0-3
