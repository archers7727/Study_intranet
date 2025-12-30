-- ============================================
-- Row Level Security (RLS) 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "parents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teachers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attendances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "materials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 사용자 테이블 RLS 정책
-- ============================================

-- 관리자는 모든 사용자 조회 가능
CREATE POLICY "Admins can view all users"
  ON "users" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" = 'ADMIN'
    )
  );

-- 사용자는 본인 데이터 조회 가능
CREATE POLICY "Users can view own data"
  ON "users" FOR SELECT
  USING (id = auth.uid()::text);

-- 관리자만 사용자 생성/수정/삭제 가능
CREATE POLICY "Admins can insert users"
  ON "users" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update users"
  ON "users" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" = 'ADMIN'
    )
  );

CREATE POLICY "Admins can delete users"
  ON "users" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" = 'ADMIN'
    )
  );

-- ============================================
-- 학생 테이블 RLS 정책
-- ============================================

-- 교사(LV0-2)는 모든 학생 조회 가능
CREATE POLICY "Teachers can view all students"
  ON "students" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER', 'TEACHER')
    )
  );

-- 학생은 본인 데이터만 조회 가능
CREATE POLICY "Students can view own data"
  ON "students" FOR SELECT
  USING ("userId" = auth.uid()::text);

-- 학부모는 자녀 데이터 조회 가능
CREATE POLICY "Parents can view their children"
  ON "students" FOR SELECT
  USING (
    "parentId" IN (
      SELECT id FROM "parents"
      WHERE "userId" = auth.uid()::text
    )
  );

-- 관리자와 수석교사만 학생 생성/삭제 가능
CREATE POLICY "Admins and senior teachers can insert students"
  ON "students" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER')
    )
  );

CREATE POLICY "Admins and senior teachers can update students"
  ON "students" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER')
    )
  );

CREATE POLICY "Admins can delete students"
  ON "students" FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" = 'ADMIN'
    )
  );

-- ============================================
-- 교사 테이블 RLS 정책
-- ============================================

-- 모든 사용자가 교사 목록 조회 가능
CREATE POLICY "All users can view teachers"
  ON "teachers" FOR SELECT
  USING (true);

-- 관리자만 교사 생성/수정/삭제 가능
CREATE POLICY "Admins can manage teachers"
  ON "teachers" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" = 'ADMIN'
    )
  );

-- ============================================
-- 보호자 테이블 RLS 정책
-- ============================================

-- 교사는 모든 보호자 조회 가능
CREATE POLICY "Teachers can view parents"
  ON "parents" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER', 'TEACHER')
    )
  );

-- 보호자는 본인 데이터만 조회 가능
CREATE POLICY "Parents can view own data"
  ON "parents" FOR SELECT
  USING ("userId" = auth.uid()::text);

-- ============================================
-- 클래스 테이블 RLS 정책
-- ============================================

-- 교사와 보조교사는 모든 클래스 조회 가능
CREATE POLICY "Teachers can view all classes"
  ON "classes" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT')
    )
  );

-- 학생은 수강 중인 클래스만 조회 가능
CREATE POLICY "Students can view enrolled classes"
  ON "classes" FOR SELECT
  USING (
    id IN (
      SELECT "classId" FROM "class_students" cs
      JOIN "students" s ON s.id = cs."studentId"
      WHERE s."userId" = auth.uid()::text
    )
  );

-- 관리자와 수석교사만 클래스 생성/수정/삭제 가능
CREATE POLICY "Admins and senior teachers can manage classes"
  ON "classes" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER')
    )
  );

-- ============================================
-- 세션 테이블 RLS 정책
-- ============================================

-- 교사는 모든 세션 조회 가능
CREATE POLICY "Teachers can view all sessions"
  ON "sessions" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT')
    )
  );

-- 학생은 수강 중인 클래스의 세션만 조회 가능
CREATE POLICY "Students can view enrolled sessions"
  ON "sessions" FOR SELECT
  USING (
    "classId" IN (
      SELECT "classId" FROM "class_students" cs
      JOIN "students" s ON s.id = cs."studentId"
      WHERE s."userId" = auth.uid()::text
    )
  );

-- 교사(LV0-2)는 세션 생성/수정 가능
CREATE POLICY "Teachers can manage sessions"
  ON "sessions" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER', 'TEACHER')
    )
  );

-- ============================================
-- 출석 테이블 RLS 정책
-- ============================================

-- 교사와 보조교사는 모든 출석 조회 가능
CREATE POLICY "Teachers can view all attendances"
  ON "attendances" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT')
    )
  );

-- 학생은 본인 출석만 조회 가능
CREATE POLICY "Students can view own attendances"
  ON "attendances" FOR SELECT
  USING (
    "studentId" IN (
      SELECT id FROM "students"
      WHERE "userId" = auth.uid()::text
    )
  );

-- 교사와 보조교사는 출석 체크 가능
CREATE POLICY "Teachers can manage attendances"
  ON "attendances" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT')
    )
  );

-- ============================================
-- 과제 테이블 RLS 정책
-- ============================================

-- 교사는 모든 과제 조회 가능
CREATE POLICY "Teachers can view all assignments"
  ON "assignments" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT')
    )
  );

-- 학생은 본인이 속한 세션의 과제만 조회 가능
CREATE POLICY "Students can view session assignments"
  ON "assignments" FOR SELECT
  USING (
    "sessionId" IN (
      SELECT s.id FROM "sessions" s
      JOIN "class_students" cs ON cs."classId" = s."classId"
      JOIN "students" st ON st.id = cs."studentId"
      WHERE st."userId" = auth.uid()::text
    )
  );

-- 교사만 과제 생성/수정/삭제 가능
CREATE POLICY "Teachers can manage assignments"
  ON "assignments" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER', 'TEACHER')
    )
  );

-- ============================================
-- 과제 제출 테이블 RLS 정책
-- ============================================

-- 교사는 모든 제출물 조회 가능
CREATE POLICY "Teachers can view all submissions"
  ON "submissions" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER', 'TEACHER')
    )
  );

-- 학생은 본인 제출물만 조회 가능
CREATE POLICY "Students can view own submissions"
  ON "submissions" FOR SELECT
  USING (
    "studentId" IN (
      SELECT id FROM "students"
      WHERE "userId" = auth.uid()::text
    )
  );

-- 학생은 본인 과제만 제출 가능
CREATE POLICY "Students can submit own assignments"
  ON "submissions" FOR INSERT
  WITH CHECK (
    "studentId" IN (
      SELECT id FROM "students"
      WHERE "userId" = auth.uid()::text
    )
  );

-- 학생은 본인 제출물 수정 가능 (제출 전까지)
CREATE POLICY "Students can update own submissions"
  ON "submissions" FOR UPDATE
  USING (
    "studentId" IN (
      SELECT id FROM "students"
      WHERE "userId" = auth.uid()::text
    )
  );

-- 교사는 채점 가능
CREATE POLICY "Teachers can grade submissions"
  ON "submissions" FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER', 'TEACHER')
    )
  );

-- ============================================
-- 자료 테이블 RLS 정책
-- ============================================

-- 모든 인증된 사용자가 자료 조회 가능
CREATE POLICY "All users can view materials"
  ON "materials" FOR SELECT
  USING (true);

-- 교사와 보조교사만 자료 생성 가능
CREATE POLICY "Teachers can create materials"
  ON "materials" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT')
    )
  );

-- 본인이 생성한 자료만 수정/삭제 가능 (관리자는 모두 가능)
CREATE POLICY "Teachers can update own materials"
  ON "materials" FOR UPDATE
  USING (
    "createdById" IN (
      SELECT id FROM "teachers"
      WHERE "userId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" = 'ADMIN'
    )
  );

CREATE POLICY "Teachers can delete own materials"
  ON "materials" FOR DELETE
  USING (
    "createdById" IN (
      SELECT id FROM "teachers"
      WHERE "userId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" = 'ADMIN'
    )
  );

-- ============================================
-- 태그 테이블 RLS 정책
-- ============================================

-- 모든 인증된 사용자가 태그 조회 가능
CREATE POLICY "All users can view tags"
  ON "tags" FOR SELECT
  USING (true);

-- 관리자와 수석교사만 태그 생성/수정/삭제 가능
CREATE POLICY "Admins and senior teachers can manage tags"
  ON "tags" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "users" u
      WHERE u.id = auth.uid()::text
      AND u."roleLevel" IN ('ADMIN', 'SENIOR_TEACHER')
    )
  );

-- ============================================
-- 참고: Supabase Auth와 users 테이블 연동
-- ============================================
-- Supabase Auth에서 사용자 생성 시 users 테이블에 자동으로 레코드 추가하는 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, "roleLevel")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'roleLevel')::public."RoleLevel", 'STUDENT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auth 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Supabase Auth 사용자 생성 시 users 테이블에 자동 추가';
