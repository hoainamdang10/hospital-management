const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkPatientIdFormat() {
  console.log('🔍 CHECKING PATIENT_ID FORMAT ISSUE');
  console.log('===================================\n');

  try {
    // 1. Check all patient records and their ID formats
    console.log('1️⃣ Checking all patient records...');
    const { data: patients, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select('patient_id, profile_id, status, created_at')
      .order('created_at', { ascending: false });

    if (patientsError) {
      console.error('❌ Error fetching patients:', patientsError);
      return;
    }

    console.log(`✅ Found ${patients.length} patient records:\n`);

    patients.forEach((patient, index) => {
      console.log(`${index + 1}. Patient ID: "${patient.patient_id}"`);
      console.log(`   Profile ID: ${patient.profile_id}`);
      console.log(`   Status: ${patient.status}`);
      console.log(`   Created: ${patient.created_at}`);
      
      // Check for format issues
      const issues = [];
      if (patient.patient_id.includes('.')) {
        issues.push('Contains period (.)');
      }
      if (!patient.patient_id.startsWith('PAT')) {
        issues.push('Does not start with PAT');
      }
      if (patient.patient_id.length < 10) {
        issues.push('Too short');
      }
      
      if (issues.length > 0) {
        console.log(`   ⚠️ ISSUES: ${issues.join(', ')}`);
      } else {
        console.log(`   ✅ Format looks good`);
      }
      console.log('');
    });

    // 2. Check specific patient@hospital.com
    console.log('2️⃣ Checking patient@hospital.com specifically...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', 'patient@hospital.com')
      .single();

    if (profileError) {
      console.error('❌ Profile not found:', profileError);
      return;
    }

    const { data: specificPatient, error: specificError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('profile_id', profile.id)
      .single();

    if (specificError) {
      console.error('❌ Patient record not found:', specificError);
      return;
    }

    console.log('✅ patient@hospital.com details:');
    console.log(`   Patient ID: "${specificPatient.patient_id}"`);
    console.log(`   Length: ${specificPatient.patient_id.length}`);
    console.log(`   Contains period: ${specificPatient.patient_id.includes('.') ? 'YES' : 'NO'}`);
    console.log(`   Raw bytes: ${JSON.stringify(specificPatient.patient_id)}`);

    // 3. Check what the expected format should be
    console.log('\n3️⃣ Expected vs Actual format:');
    console.log('Expected format: PAT + timestamp (e.g., PAT123456)');
    console.log(`Actual format: "${specificPatient.patient_id}"`);
    
    if (specificPatient.patient_id.includes('.')) {
      console.log('🔴 PROBLEM FOUND: Patient ID contains period (.)');
      console.log('   This might be causing issues in frontend or API parsing');
      
      // Suggest fix
      const fixedId = specificPatient.patient_id.replace(/\./g, '');
      console.log(`   Suggested fix: "${fixedId}"`);
      
      console.log('\n4️⃣ Would you like to fix this? (Manual step needed)');
      console.log(`   UPDATE patients SET patient_id = '${fixedId}' WHERE profile_id = '${profile.id}';`);
    } else {
      console.log('✅ Patient ID format looks correct');
    }

    // 4. Check if there are other patients with similar issues
    console.log('\n5️⃣ Checking for other patients with period in ID...');
    const patientsWithPeriod = patients.filter(p => p.patient_id.includes('.'));
    
    if (patientsWithPeriod.length > 0) {
      console.log(`🔴 Found ${patientsWithPeriod.length} patients with period in ID:`);
      patientsWithPeriod.forEach((patient, idx) => {
        console.log(`   ${idx + 1}. "${patient.patient_id}"`);
      });
    } else {
      console.log('✅ No other patients with period in ID found');
    }

  } catch (error) {
    console.error('❌ Error during check:', error);
  }
}

// Run the check
checkPatientIdFormat().then(() => {
  console.log('\n🏁 Check completed');
}).catch(error => {
  console.error('❌ Fatal error:', error);
});
