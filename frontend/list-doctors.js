const http = require('http');

http.get('http://localhost:3003/api/v1/staff/search?staffType=doctor&limit=10', (resp) => {
    let data = '';
    resp.on('data', (chunk) => { data += chunk; });
    resp.on('end', () => {
        const json = JSON.parse(data);
        console.log('Total doctors:', json.pagination?.total || 'N/A');
        console.log('Data type:', Array.isArray(json.data) ? 'Array' : typeof json.data);

        if (json.data && json.data.length > 0) {
            console.log('\nFirst 5 doctors:');
            json.data.slice(0, 5).forEach(doc => {
                console.log('-', doc.personalInfo?.fullName || 'No name', '|', doc.professionalInfo?.department || 'No dept');
            });
        } else {
            console.log('No doctors found!');
        }
    });
}).on("error", (err) => { console.log("Error:", err.message); });
