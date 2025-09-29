#!/usr/bin/env node

/**
 * Populate enum tables with sample data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function populateEnumTables() {
  console.log('🔄 Populating enum tables with sample data...\n');

  try {
    // 1. Check if diagnosis already has data
    console.log('📋 Checking diagnosis data...');
    const { data: existingDiagnosis } = await supabase.from('diagnosis').select('*').limit(1);

    if (existingDiagnosis && existingDiagnosis.length > 0) {
      console.log('✅ Diagnosis table already has data, skipping...');
    } else {
      const diagnosisData = [
        {
          diagnosis_code: 'I10',
          diagnosis_name: 'Cao huyết áp',
          category: 'Tim mạch',
          description: 'Tăng huyết áp nguyên phát',
          is_active: true
        },
        {
          diagnosis_code: 'E11',
          diagnosis_name: 'Tiểu đường type 2',
          category: 'Nội tiết',
          description: 'Đái tháo đường không phụ thuộc insulin',
          is_active: true
        },
        {
          diagnosis_code: 'J18',
          diagnosis_name: 'Viêm phổi',
          category: 'Hô hấp',
          description: 'Viêm phổi do vi khuẩn',
          is_active: true
        }
      ];

      const { error: diagnosisError } = await supabase
        .from('diagnosis')
        .insert(diagnosisData);

      if (diagnosisError) {
        console.log(`❌ Diagnosis error: ${diagnosisError.message}`);
      } else {
        console.log(`✅ Added ${diagnosisData.length} diagnosis records`);
      }
    }

    // 2. Medications data (simple structure)
    console.log('\n💊 Adding medications data...');
    const medicationsData = [
      {
        medication_name: 'Paracetamol 500mg',
        description: 'Thuốc giảm đau, hạ sốt',
        is_active: true
      },
      {
        medication_name: 'Amoxicillin 250mg',
        description: 'Kháng sinh nhóm penicillin',
        is_active: true
      },
      {
        medication_name: 'Metformin 500mg',
        description: 'Thuốc điều trị tiểu đường',
        is_active: true
      },
      {
        medication_name: 'Amlodipine 5mg',
        description: 'Thuốc hạ huyết áp',
        is_active: true
      },
      {
        medication_name: 'Omeprazole 20mg',
        description: 'Thuốc ức chế bơm proton',
        is_active: true
      }
    ];

    const { error: medicationsError } = await supabase
      .from('medications')
      .insert(medicationsData);

    if (medicationsError) {
      console.log(`❌ Medications error: ${medicationsError.message}`);
    } else {
      console.log(`✅ Added ${medicationsData.length} medication records`);
    }

    // 3. Status values data (need to find correct structure)
    console.log('\n📊 Adding status values data...');
    const statusData = [
      {
        status_type: 'general',
        status_value: 'Hoạt động',
        description: 'Trạng thái hoạt động bình thường',
        is_active: true
      },
      {
        status_type: 'general',
        status_value: 'Tạm ngưng',
        description: 'Tạm thời ngưng hoạt động',
        is_active: true
      },
      {
        status_type: 'appointment',
        status_value: 'Chờ xử lý',
        description: 'Đang chờ được xử lý',
        is_active: true
      },
      {
        status_type: 'appointment',
        status_value: 'Hoàn thành',
        description: 'Đã hoàn thành',
        is_active: true
      },
      {
        status_type: 'appointment',
        status_value: 'Đã hủy',
        description: 'Đã bị hủy bỏ',
        is_active: true
      }
    ];

    const { error: statusError } = await supabase
      .from('status_values')
      .insert(statusData);

    if (statusError) {
      console.log(`❌ Status values error: ${statusError.message}`);
    } else {
      console.log(`✅ Added ${statusData.length} status value records`);
    }

    console.log('\n🎉 All enum tables populated successfully!');

  } catch (error) {
    console.error('❌ Error populating enum tables:', error);
  }
}

populateEnumTables();
