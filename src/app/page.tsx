export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Study Intranet</h1>
        <p className="text-xl mb-8">태그 기반 교육 관리 시스템</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">학생 관리</h2>
            <p className="text-gray-600">등록, 출결, 과제 현황, 성적 추적</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">클래스 관리</h2>
            <p className="text-gray-600">수업 생성, 교사 배정, 반복 일정 설정</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">세션 관리</h2>
            <p className="text-gray-600">캘린더 뷰, 출석 체크, 과제 부여</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">태그 시스템</h2>
            <p className="text-gray-600">다중 태그 검색 (AND/OR 로직)</p>
          </div>
        </div>
      </div>
    </main>
  );
}
