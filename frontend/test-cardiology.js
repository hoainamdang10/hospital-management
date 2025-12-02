const http = require('http');

http.get('http://localhost:3003/api/v1/staff/search?searchTerm=Cardiology&staffType=doctor&status=active&limit=3', (resp) => {
    let data = '';
    resp.on('data', (chunk) => { data += chunk; });
    resp.on('end', () => {
        const json = JSON.parse(data);
        const doctors = json.data?.items || [];
        console.log('Found', doctors.length, 'Cardiology doctors');
        doctors.forEach(doc => {
            console.log('-', doc.personalInfo?.fullName, '| Dept:', doc.professionalInfo?.department);
        });
    });
});
