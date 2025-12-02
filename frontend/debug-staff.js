const http = require('http');

http.get('http://localhost:3003/api/v1/staff/search?staffType=doctor&limit=2', (resp) => {
    let data = '';

    // A chunk of data has been received.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.error("Error parsing JSON:", e.message);
            console.log("Raw data:", data);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
