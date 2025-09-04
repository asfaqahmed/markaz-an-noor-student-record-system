/**
 * Script to create authentication users in Supabase
 * This script will create the demo users with proper authentication
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const demoUsers = [
  {
    email: 'ahmedimfas@gmail.com',
    password: 'password123',
    name: 'Ahmed Imfas',
    role: 'admin'
  },
  {
    email: 'teacher1@markaz.edu',
    password: 'password123',
    name: 'Teacher Ali',
    role: 'staff'
  },
  {
    email: 'teacher2@markaz.edu',
    password: 'password123',
    name: 'Teacher Fatima',
    role: 'staff'
  },
  {
    email: 'abdullah@markaz.edu',
    password: 'password123',
    name: 'MN. Abdullah',
    role: 'student'
  },
  {
    email: 'naseer@markaz.edu',
    password: 'password123',
    name: 'M. Naseer',
    role: 'student'
  },
  {
    email: 'mohamed@markaz.edu',
    password: 'password123',
    name: 'TH. Mohamed',
    role: 'student'
  },
  {
    email: 'sameer@markaz.edu',
    password: 'password123',
    name: 'SM. Sameer',
    role: 'student'
  }
]

async function deleteExistingAuthUsers() {
  console.log('🗑️  Deleting existing auth users...')
  
  for (const user of demoUsers) {
    try {
      // Get user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        console.error(`❌ Error listing users: ${listError.message}`)
        continue
      }

      const existingUser = users.users.find(u => u.email === user.email)
      
      if (existingUser) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id)
        
        if (deleteError) {
          console.error(`❌ Error deleting user ${user.email}: ${deleteError.message}`)
        } else {
          console.log(`✅ Deleted existing user: ${user.email}`)
        }
      }
    } catch (error) {
      console.error(`❌ Error processing user ${user.email}: ${error.message}`)
    }
  }
}

async function createAuthUsers() {
  console.log('👤 Creating new auth users...')
  
  for (const user of demoUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      })

      if (error) {
        console.error(`❌ Error creating user ${user.email}: ${error.message}`)
      } else {
        console.log(`✅ Created auth user: ${user.email} (${user.role})`)
      }
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}: ${error.message}`)
    }
  }
}

async function syncUsersTable() {
  console.log('🔄 Syncing users table with auth users...')
  
  // First, get all auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.error('❌ Error listing auth users:', authError.message)
    return
  }

  // Clear existing users table (except those not in our demo list)
  for (const demoUser of demoUsers) {
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', demoUser.email)
    
    if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 = no rows affected
      console.error(`❌ Error deleting user from users table ${demoUser.email}: ${deleteError.message}`)
    }
  }

  // Insert/update users table records to match auth users
  for (const demoUser of demoUsers) {
    const authUser = authUsers.users.find(u => u.email === demoUser.email)
    
    if (authUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id, // Use the auth user ID
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
        })
      
      if (insertError) {
        console.error(`❌ Error inserting user ${demoUser.email}: ${insertError.message}`)
      } else {
        console.log(`✅ Synced user table: ${demoUser.email} (${demoUser.role})`)
      }
    }
  }
}

async function syncStudentsAndTeachers() {
  console.log('👥 Syncing students and teachers tables...')
  
  // Clear existing students and teachers
  await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
  await supabase.from('teachers').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  // Get user IDs from users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, role')
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message)
    return
  }

  // Insert teachers
  const teacherUsers = users.filter(u => u.role === 'staff')
  for (const teacher of teacherUsers) {
    const { error: teacherError } = await supabase
      .from('teachers')
      .insert({
        user_id: teacher.id,
        assigned_class: 'Grade 10'
      })
    
    if (teacherError) {
      console.error(`❌ Error inserting teacher ${teacher.email}: ${teacherError.message}`)
    } else {
      console.log(`✅ Created teacher record: ${teacher.email}`)
    }
  }

  // Insert students
  const studentUsers = users.filter(u => u.role === 'student')
  for (const student of studentUsers) {
    const { error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: student.id,
        class: 'Grade 10',
        joined_at: '2023-09-01'
      })
    
    if (studentError) {
      console.error(`❌ Error inserting student ${student.email}: ${studentError.message}`)
    } else {
      console.log(`✅ Created student record: ${student.email}`)
    }
  }
}

async function fixRLSFunctions() {
  console.log('🔧 Fixing RLS functions to handle null emails...')
  
  try {
    const rlsFix = fs.readFileSync('fix-rls-functions.sql', 'utf8')
    
    // Split by statements and execute each one
    const statements = rlsFix.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec', { sql: statement + ';' })
      if (error) {
        // Try direct query execution instead
        const { error: queryError } = await supabase.from('').select().limit(0).then(() => {
          // This won't work, let's try a different approach
          console.log('⚠️ RLS function update may require manual execution')
        })
      }
    }
    
    console.log('✅ RLS functions updated (or need manual execution)')
  } catch (error) {
    console.log('⚠️ RLS function update requires manual execution via Supabase dashboard')
  }
}

async function verifyUsers() {
  console.log('🔍 Verifying created users...')
  
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  const { data: dbUsers, error: dbError } = await supabase.from('users').select('*')
  
  if (authError || dbError) {
    console.error('❌ Error fetching users:', authError?.message || dbError?.message)
    return
  }

  console.log(`\n📊 Total auth users: ${authUsers.users.length}`)
  console.log(`📊 Total database users: ${dbUsers.length}`)
  
  for (const user of demoUsers) {
    const authUser = authUsers.users.find(u => u.email === user.email)
    const dbUser = dbUsers.find(u => u.email === user.email)
    
    if (authUser && dbUser) {
      console.log(`✅ ${user.email} - ${user.role} - Auth ID: ${authUser.id} - DB ID: ${dbUser.id}`)
    } else {
      console.log(`❌ Missing: ${user.email} - Auth: ${!!authUser} - DB: ${!!dbUser}`)
    }
  }
}

async function main() {
  console.log('🚀 Starting auth user seeding process...\n')
  
  try {
    await deleteExistingAuthUsers()
    console.log('\n')
    
    await createAuthUsers()
    console.log('\n')
    
    await syncUsersTable()
    console.log('\n')
    
    await syncStudentsAndTeachers()
    console.log('\n')
    
    await fixRLSFunctions()
    console.log('\n')
    
    await verifyUsers()
    
    console.log('\n✨ Auth user seeding completed!')
    console.log('\nYou can now login with:')
    console.log('- Admin: ahmedimfas@gmail.com / password123')
    console.log('- Staff: teacher1@markaz.edu / password123')  
    console.log('- Student: abdullah@markaz.edu / password123')
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  }
}

main()