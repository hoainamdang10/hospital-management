const crypto = require('crypto');
const querystring = require('querystring');

// Test data from logs - RAW query parameters from VNPAY
const vnpParams = {
  "vnp_Amount": "22000000",
  "vnp_BankCode": "NCB",
  "vnp_BankTranNo": "VNP15271298",
  "vnp_CardType": "ATM",
  "vnp_OrderInfo": "Thanh toán hóa đơn INV-202511-4045",
  "vnp_PayDate": "20251119230851",
  "vnp_ResponseCode": "00",
  "vnp_TmnCode": "JV4I3QQ0",
  "vnp_TransactionNo": "15271298",
  "vnp_TransactionStatus": "00",
  "vnp_TxnRef": "1763568509"
};

const hashSecret = 'PS1017YBR2B1ALS3BRVY2JZ6XOVSL5YV';
const expectedSignature = 'a67b4f29a362ecd7a6a41b195c5aa29435ecb680889b212720cdbc9f22d9b8e9e46faf5536d8b308feb6ee96030b3a1b51473d8673c2a2726df38e0f28729884';

console.log('=== VNPAY Hash Test ===\n');

// Test 1: Manual concatenation (NO encoding) - Current approach
const sortedKeys1 = Object.keys(vnpParams).sort();
const signData1 = sortedKeys1.map(key => `${key}=${vnpParams[key]}`).join('&');
const hash1 = crypto.createHmac('sha512', hashSecret).update(Buffer.from(signData1, 'utf-8')).digest('hex');

console.log('--- Test 1: Manual concatenation (NO encoding) ---');
console.log('Query String:', signData1);
console.log('Generated:', hash1);
console.log('Match:', hash1 === expectedSignature);

// Test 2: Using querystring.stringify with encode: false (VNPAY NodeJS example)
const signData2 = querystring.stringify(vnpParams, { encode: false });
const hash2 = crypto.createHmac('sha512', hashSecret).update(Buffer.from(signData2, 'utf-8')).digest('hex');

console.log('\n--- Test 2: querystring.stringify({ encode: false }) ---');
console.log('Query String:', signData2);
console.log('Generated:', hash2);
console.log('Match:', hash2 === expectedSignature);

// Test 3: Sort keys manually like VNPAY example
const sortedKeys3 = Object.keys(vnpParams).sort();
let signData3 = '';
sortedKeys3.forEach((key, index) => {
  if (index > 0) signData3 += '&';
  signData3 += key + '=' + vnpParams[key];
});
const hash3 = crypto.createHmac('sha512', hashSecret).update(Buffer.from(signData3, 'utf-8')).digest('hex');

console.log('\n--- Test 3: Manual loop (VNPAY style) ---');
console.log('Query String:', signData3);
console.log('Generated:', hash3);
console.log('Match:', hash3 === expectedSignature);

console.log('\n=== Comparison ===');
console.log('Expected:', expectedSignature);
console.log('Test 1:  ', hash1);
console.log('Test 2:  ', hash2);
console.log('Test 3:  ', hash3);

// Test 4: URL-encoded (like PHP example)
const sortedKeys4 = Object.keys(vnpParams).sort();
const signData4 = sortedKeys4.map(key => {
  const encodedKey = encodeURIComponent(key);
  const encodedValue = encodeURIComponent(vnpParams[key]);
  return `${encodedKey}=${encodedValue}`;
}).join('&');
const hash4 = crypto.createHmac('sha512', hashSecret).update(Buffer.from(signData4, 'utf-8')).digest('hex');

console.log('\n--- Test 4: URL-encoded (PHP style) ---');
console.log('Query String:', signData4);
console.log('Generated:', hash4);
console.log('Match:', hash4 === expectedSignature);

// Test 5: URL-encoded with + for space (PHP urlencode style)
const sortedKeys5 = Object.keys(vnpParams).sort();
const signData5 = sortedKeys5.map(key => {
  const encodedKey = encodeURIComponent(key);
  const encodedValue = encodeURIComponent(vnpParams[key]).replace(/%20/g, '+');
  return `${encodedKey}=${encodedValue}`;
}).join('&');
const hash5 = crypto.createHmac('sha512', hashSecret).update(Buffer.from(signData5, 'utf-8')).digest('hex');

console.log('\n--- Test 5: URL-encoded with + for space ---');
console.log('Query String:', signData5);
console.log('Generated:', hash5);
console.log('Match:', hash5 === expectedSignature);

console.log('\n=== Final Comparison ===');
console.log('Expected:', expectedSignature);
console.log('Test 4:  ', hash4);
console.log('Test 5:  ', hash5);

