const http = require('http');

// Test with NO filters (should return all doctors)
console.log('=== Test 1: All doctors ===');
http.get('http://localhost:3003/api/v1/staff/search?staffType=doctor&limit=3', (resp) => {
    let data = '';
    resp.on('data', (chunk) => { data += chunk; });
    resp.on('end', () => {
        const json = JSON.parse(data);
        console.log('Success:', json.success);
        console.log('Data is array:', Array.isArray(json.data));
        console.log('Doctor count:', json.data?.length || 0);
        if (json.data?.[0]) {
            console.log('Sample doctor:', json.data[0].personalInfo?.fullName, '- Dept:', json.data[0].professionalInfo?.department);
        }

        // Test with Cardiology filter
        console.log('\n=== Test 2: Cardiology search ===');
        http.get('http://localhost:3003/api/v1/staff/search?searchTerm=Cardiology&staffType=doctor&limit=3', (resp2) => {
            let data2 = '';
            resp2.on('data', (chunk) => { data2 += chunk; });
            resp2.on('end', () => {
                const json2 = JSON.parse(data2);
                console.log('Success:', json2.success);
                console.log('Data is array:', Array.isArray(json2.data));
                console.log('Doctor count:', json2.data?.length || 0);
            });
        });
    });
});
