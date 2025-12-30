import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const prisma = new PrismaClient()

// Supabase Admin 클라이언트
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function main() {
  console.log('🌱 Starting seed...')

  // 초기 사용자 데이터
  const users = [
    {
      email: 'admin@study.com',
      password: 'admin123456',
      name: '관리자',
      roleLevel: 'ADMIN' as const,
    },
    {
      email: 'senior@study.com',
      password: 'senior123456',
      name: '수석교사',
      roleLevel: 'SENIOR_TEACHER' as const,
    },
    {
      email: 'teacher@study.com',
      password: 'teacher123456',
      name: '일반교사',
      roleLevel: 'TEACHER' as const,
    },
    {
      email: 'assistant@study.com',
      password: 'assistant123456',
      name: '보조교사',
      roleLevel: 'ASSISTANT' as const,
    },
  ]

  for (const userData of users) {
    try {
      console.log(`Creating user: ${userData.email}`)

      // 1. Supabase Auth에 사용자 생성
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          roleLevel: userData.roleLevel,
        },
      })

      if (authError) {
        console.error(`Failed to create auth user ${userData.email}:`, authError.message)
        continue
      }

      if (!authData.user) {
        console.error(`No user data returned for ${userData.email}`)
        continue
      }

      // 2. Prisma users 테이블에 사용자 생성
      const user = await prisma.user.upsert({
        where: { id: authData.user.id },
        update: {},
        create: {
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          roleLevel: userData.roleLevel,
        },
      })

      console.log(`✅ Created user: ${user.email} (${user.roleLevel})`)

      // 3. 교사인 경우 Teacher 프로필 생성
      if (['ADMIN', 'SENIOR_TEACHER', 'TEACHER', 'ASSISTANT'].includes(userData.roleLevel)) {
        const teacher = await prisma.teacher.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            name: userData.name,
            specialties: ['수학', '과학'], // 예시 전문분야
          },
        })

        console.log(`✅ Created teacher profile for: ${teacher.name}`)
      }
    } catch (error: any) {
      console.error(`Error creating user ${userData.email}:`, error.message)
    }
  }

  // 샘플 태그 생성
  console.log('\n🏷️  Creating sample tags...')
  const tags = [
    { name: '초급', color: '#22c55e', category: '수준' },
    { name: '중급', color: '#eab308', category: '수준' },
    { name: '고급', color: '#ef4444', category: '수준' },
    { name: '수학', color: '#3b82f6', category: '과목' },
    { name: '영어', color: '#8b5cf6', category: '과목' },
    { name: '과학', color: '#10b981', category: '과목' },
  ]

  for (const tagData of tags) {
    await prisma.tag.upsert({
      where: { name: tagData.name },
      update: {},
      create: tagData,
    })
    console.log(`✅ Created tag: ${tagData.name}`)
  }

  console.log('\n✨ Seed completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
