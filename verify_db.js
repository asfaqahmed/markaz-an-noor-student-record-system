const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let supabaseUrl, supabaseAnonKey;
envLines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1];
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=') && !supabaseAnonKey) {
    supabaseAnonKey = line.split('=')[1];
  }
});

console.log('🔗 Connecting to Supabase...');
console.log('📍 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyDatabase() {
  try {
    console.log('\n🔍 === Checking Database Tables and Data ===\n');
    
    // Test each table
    const tables = [
      { name: 'users', description: 'System users (admin, staff, students)' },
      { name: 'students', description: 'Student profiles' },
      { name: 'teachers', description: 'Staff/teacher profiles' },
      { name: 'activities', description: 'Daily activities (A01-A10)' },
      { name: 'participation_records', description: 'Student participation grades' },
      { name: 'leaves', description: 'Student absence records' },
      { name: 'alerts', description: 'Urgent student concerns' }
    ];
    
    const results = {};
    
    for (const table of tables) {
      console.log(`📋 Checking ${table.name} (${table.description})...`);
      
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        results[table.name] = { status: 'error', error: error.message };
      } else {
        console.log(`  ✅ Found ${count} records`);
        results[table.name] = { status: 'success', count };
      }
    }

    // If all tables exist, get some sample data
    const allTablesExist = Object.values(results).every(r => r.status === 'success');
    
    if (allTablesExist) {
      console.log('\n📊 === Sample Data ===\n');
      
      // Show users
      const { data: users } = await supabase
        .from('users')
        .select('name, email, role')
        .order('role');
      
      console.log('👥 Users:');
      users.forEach(user => {
        console.log(`  ${user.role === 'admin' ? '👑' : user.role === 'staff' ? '👨‍🏫' : '👨‍🎓'} ${user.name} (${user.email}) - ${user.role}`);
      });

      // Show activities
      const { data: activities } = await supabase
        .from('activities')
        .select('code, description')
        .order('code');
      
      console.log('\n🕰️ Daily Activities:');
      activities.forEach(activity => {
        console.log(`  ${activity.code}: ${activity.description}`);
      });

      // Show students with latest participation
      const { data: students } = await supabase
        .from('students')
        .select(`
          *,
          user:users(name, email),
          participation_records(
            date,
            grade,
            activity:activities(code)
          )
        `)
        .order('created_at');
      
      console.log('\n👨‍🎓 Students:');
      students.forEach(student => {
        const recentRecords = student.participation_records
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3);
        
        console.log(`  📚 ${student.user.name} (${student.class})`);
        if (recentRecords.length > 0) {
          recentRecords.forEach(record => {
            console.log(`    ${record.date}: ${record.activity.code} - Grade ${record.grade}`);
          });
        } else {
          console.log('    No recent participation records');
        }
      });

      // Show recent alerts
      const { data: alerts } = await supabase
        .from('alerts')
        .select(`
          *,
          student:students(user:users(name)),
          teacher:teachers(user:users(name))
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (alerts.length > 0) {
        console.log('\n🚨 Recent Alerts:');
        alerts.forEach(alert => {
          const priorityEmoji = {
            low: '🟢',
            medium: '🟡',
            high: '🟠',
            urgent: '🔴'
          };
          
          console.log(`  ${priorityEmoji[alert.priority]} ${alert.priority.toUpperCase()} - ${alert.student.user.name}`);
          console.log(`    Comment: ${alert.comment}`);
          console.log(`    Status: ${alert.status}`);
          console.log(`    Reported by: ${alert.teacher.user.name}`);
          console.log('');
        });
      }

      // Show statistics
      console.log('📈 === Quick Statistics ===');
      console.log(`Total Users: ${results.users.count}`);
      console.log(`Total Students: ${results.students.count}`);
      console.log(`Total Staff: ${results.teachers.count}`);
      console.log(`Participation Records: ${results.participation_records.count}`);
      console.log(`Active Alerts: ${results.alerts.count}`);
      
    } else {
      console.log('\n❗ Some tables are missing. You need to run the database migrations first.');
      console.log('\n📝 To migrate your database:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project: "peqoddxueitvwekllwio"');
      console.log('3. Go to SQL Editor');
      console.log('4. Run the migration files in order:');
      console.log('   - supabase/migrations/001_create_users_and_auth.sql');
      console.log('   - supabase/migrations/002_create_activities_and_records.sql');
      console.log('   - supabase/migrations/003_seed_initial_data.sql');
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env.local file has the correct Supabase URL and keys');
    console.log('2. Verify your Supabase project is active');
    console.log('3. Make sure you have run the database migrations');
  }
}

verifyDatabase();