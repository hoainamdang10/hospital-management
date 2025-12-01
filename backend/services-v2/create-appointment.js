const http = require('http');

const data = JSON.stringify({
    patientId: 'PAT-202511-425',
    doctorId: 'DOC-INTE-202511-940',
    appointmentDate: '2025-11-30',
    appointmentTime: '16:30',
    durationMinutes: 30,
    type: 'CONSULTATION',
    priority: 'NORMAL',
    reason: 'Test Full Sync Flow',
    symptoms: [],
    requiredEquipment: []
});

const options = {
    hostname: 'localhost',
    port: 3004,
    path: '/api/v1/appointments',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'x-user-id': 'PAT-202511-425',
        'x-user-role': 'PATIENT'
    }
};

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', responseData);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
