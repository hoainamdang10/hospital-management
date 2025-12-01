const axios = require('axios');

async function createAppointment() {
  try {
    console.log('Creating appointment...');
    const response = await axios.post('http://localhost:3004/api/v1/appointments', {
      patientId: 'PAT-202511-425',
      doctorId: 'DOC-INTE-202511-940',
      appointmentDate: '2025-11-30',
      appointmentTime: '16:00',
      durationMinutes: 30,
      type: 'CONSULTATION',
      priority: 'NORMAL',
      reason: 'Test Appointment via Script',
      symptoms: [],
      requiredEquipment: []
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'PAT-202511-425',
        'x-user-role': 'PATIENT'
      }
    });
    console.log('✅ Appointment created successfully:', response.data);
  } catch (error) {
    console.error('❌ Error creating appointment:', error.response ? error.response.data : error.message);
  }
}

createAppointment();
