-- ============================================
-- 태그 기반 교육 관리 시스템 - 초기 스키마
-- ============================================

-- ENUM 타입 생성
CREATE TYPE "RoleLevel" AS ENUM ('ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT', 'STUDENT', 'PARENT');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'WAITING', 'LEFT');
CREATE TYPE "ManagementStatus" AS ENUM ('NORMAL', 'CAUTION');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
CREATE TYPE "AssignmentStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'GRADED');
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- ============================================
-- 사용자 테이블 (Supabase Auth 연동)
-- ============================================
CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "roleLevel" "RoleLevel" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 학생 관리
-- ============================================
CREATE TABLE "students" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT UNIQUE NOT NULL,
    "studentId" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "grade" TEXT NOT NULL,
    "school" TEXT,
    "enrollmentStatus" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "managementStatus" "ManagementStatus" NOT NULL DEFAULT 'NORMAL',
    "phone" TEXT,
    "profileImageUrl" TEXT,
    "notes" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE SET NULL
);

CREATE INDEX "students_enrollmentStatus_idx" ON "students"("enrollmentStatus");
CREATE INDEX "students_managementStatus_idx" ON "students"("managementStatus");

-- ============================================
-- 보호자 관리
-- ============================================
CREATE TABLE "parents" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT,
    "notificationSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- ============================================
-- 교사 관리
-- ============================================
CREATE TABLE "teachers" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "specialties" TEXT[] NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- ============================================
-- 클래스 관리
-- ============================================
CREATE TABLE "classes" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(10,2),
    "mainTeacherId" TEXT NOT NULL,
    "recurringSchedules" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("mainTeacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT
);

-- ============================================
-- 클래스-교사 연결 (보조교사)
-- ============================================
CREATE TABLE "class_assistants" (
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("classId", "teacherId"),
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE,
    FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE
);

-- ============================================
-- 클래스-학생 연결
-- ============================================
CREATE TABLE "class_students" (
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("classId", "studentId"),
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE,
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE
);

-- ============================================
-- 세션 관리 (개별 수업)
-- ============================================
CREATE TABLE "sessions" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "classId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE,
    FOREIGN KEY ("createdById") REFERENCES "teachers"("id") ON DELETE RESTRICT
);

CREATE INDEX "sessions_sessionDate_idx" ON "sessions"("sessionDate");
CREATE INDEX "sessions_classId_sessionDate_idx" ON "sessions"("classId", "sessionDate");

-- ============================================
-- 출석 관리
-- ============================================
CREATE TABLE "attendances" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedById" TEXT,
    "notes" TEXT,
    FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE,
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
    FOREIGN KEY ("checkedById") REFERENCES "teachers"("id") ON DELETE SET NULL,
    UNIQUE ("sessionId", "studentId")
);

CREATE INDEX "attendances_sessionId_idx" ON "attendances"("sessionId");
CREATE INDEX "attendances_studentId_idx" ON "attendances"("studentId");

-- ============================================
-- 과제 관리
-- ============================================
CREATE TABLE "assignments" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "maxScore" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE,
    FOREIGN KEY ("createdById") REFERENCES "teachers"("id") ON DELETE RESTRICT
);

CREATE INDEX "assignments_dueDate_idx" ON "assignments"("dueDate");
CREATE INDEX "assignments_sessionId_idx" ON "assignments"("sessionId");

-- ============================================
-- 과제 제출
-- ============================================
CREATE TABLE "submissions" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "submittedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "score" INTEGER,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "gradedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE,
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
    FOREIGN KEY ("gradedById") REFERENCES "teachers"("id") ON DELETE SET NULL,
    UNIQUE ("assignmentId", "studentId")
);

CREATE INDEX "submissions_assignmentId_idx" ON "submissions"("assignmentId");
CREATE INDEX "submissions_studentId_idx" ON "submissions"("studentId");

-- ============================================
-- 수업 자료
-- ============================================
CREATE TABLE "materials" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("createdById") REFERENCES "teachers"("id") ON DELETE RESTRICT
);

-- ============================================
-- 세션-자료 연결
-- ============================================
CREATE TABLE "session_materials" (
    "sessionId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("sessionId", "materialId"),
    FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE,
    FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE
);

-- ============================================
-- 태그 시스템
-- ============================================
CREATE TABLE "tags" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT UNIQUE NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#808080',
    "category" TEXT,
    "description" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 태그 연결 테이블들
-- ============================================
CREATE TABLE "student_tags" (
    "studentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("studentId", "tagId"),
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
    FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE
);

CREATE TABLE "class_tags" (
    "classId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("classId", "tagId"),
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE,
    FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE
);

CREATE TABLE "session_tags" (
    "sessionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("sessionId", "tagId"),
    FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE,
    FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE
);

CREATE TABLE "assignment_tags" (
    "assignmentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("assignmentId", "tagId"),
    FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE,
    FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE
);

CREATE TABLE "material_tags" (
    "materialId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("materialId", "tagId"),
    FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE,
    FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE
);

-- ============================================
-- 상태 변경 이력
-- ============================================
CREATE TABLE "status_logs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL,
    "previousStatus" "ManagementStatus" NOT NULL,
    "newStatus" "ManagementStatus" NOT NULL,
    "reason" TEXT,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE,
    FOREIGN KEY ("changedById") REFERENCES "teachers"("id") ON DELETE RESTRICT
);

CREATE INDEX "status_logs_studentId_idx" ON "status_logs"("studentId");

-- ============================================
-- updatedAt 자동 업데이트 함수
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updatedAt 트리거 생성
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON "students" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON "parents" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON "teachers" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON "classes" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON "sessions" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON "assignments" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON "submissions" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON "materials" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON "tags" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 초기 데이터 시드 (선택사항)
-- ============================================
-- 기본 태그 생성
INSERT INTO "tags" ("name", "color", "category") VALUES
('수학', '#3B82F6', '과목'),
('영어', '#10B981', '과목'),
('과학', '#8B5CF6', '과목'),
('국어', '#F59E0B', '과목'),
('초급', '#6B7280', '수준'),
('중급', '#059669', '수준'),
('고급', '#DC2626', '수준'),
('주의필요', '#EF4444', '관리'),
('우수', '#10B981', '관리');

COMMENT ON TABLE "users" IS '사용자 기본 정보 (Supabase Auth 연동)';
COMMENT ON TABLE "students" IS '학생 정보 및 상태 관리';
COMMENT ON TABLE "parents" IS '보호자 정보';
COMMENT ON TABLE "teachers" IS '교사 정보';
COMMENT ON TABLE "classes" IS '클래스 정보';
COMMENT ON TABLE "sessions" IS '개별 수업 세션';
COMMENT ON TABLE "attendances" IS '출석 기록';
COMMENT ON TABLE "assignments" IS '과제';
COMMENT ON TABLE "submissions" IS '과제 제출';
COMMENT ON TABLE "materials" IS '수업 자료';
COMMENT ON TABLE "tags" IS '태그 (다중 연결)';
