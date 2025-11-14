// ==========================================
// STAFF ID FIX VERIFICATION TEST
// ==========================================
// Purpose: Test that new staff registration generates correct IDs

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { StaffId } = require('./src/domain/value-objects/StaffId');

// eslint-disable-next-line no-console
console.log('🧪 Testing Staff ID Generation Fix...\n');

// Test 1: Default department should be INTE
// eslint-disable-next-line no-console
console.log('📋 Test 1: Default Department Mapping');
const doctorId = StaffId.generate('doctor');
const nurseId = StaffId.generate('nurse');
const adminId = StaffId.generate('admin');

// eslint-disable-next-line no-console
console.log(`Doctor ID: ${doctorId.value}`);
// eslint-disable-next-line no-console
console.log(`Nurse ID: ${nurseId.value}`);
// eslint-disable-next-line no-console
console.log(`Admin ID: ${adminId.value}`);

// Verify patterns
// eslint-disable-next-line no-console
console.log('\n✅ Verification:');
// eslint-disable-next-line no-console
console.log(`Doctor uses INTE: ${doctorId.value.includes('INTE')}`);
// eslint-disable-next-line no-console
console.log(`Nurse uses INTE: ${nurseId.value.includes('INTE')}`);
// eslint-disable-next-line no-console
console.log(`Admin uses ADMI: ${adminId.value.includes('ADMI')}`);

// Test 2: Explicit department parameter
// eslint-disable-next-line no-console
console.log('\n📋 Test 2: Explicit Department Parameter');
const cardId = StaffId.generate('doctor', 'CARD');
const pediId = StaffId.generate('doctor', 'PEDI');

// eslint-disable-next-line no-console
console.log(`Cardiologist ID: ${cardId.value}`);
// eslint-disable-next-line no-console
console.log(`Pediatrician ID: ${pediId.value}`);

// eslint-disable-next-line no-console
console.log('\n✅ Verification:');
// eslint-disable-next-line no-console
console.log(`Cardiologist uses CARD: ${cardId.value.includes('CARD')}`);
// eslint-disable-next-line no-console
console.log(`Pediatrician uses PEDI: ${pediId.value.includes('PEDI')}`);

// Test 3: Department name mapping
// eslint-disable-next-line no-console
console.log('\n📋 Test 3: Department Name Mapping');
// eslint-disable-next-line no-console
console.log(`INTE Department Name: ${doctorId.getDepartmentName()}`);
// eslint-disable-next-line no-console
console.log(`CARD Department Name: ${cardId.getDepartmentName()}`);
// eslint-disable-next-line no-console
console.log(`ADMI Department Name: ${adminId.getDepartmentName()}`);

// eslint-disable-next-line no-console
console.log('\n🎉 All tests completed!');
