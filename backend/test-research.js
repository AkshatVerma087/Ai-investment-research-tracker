const testResearch = async () => {
  console.log('--- Logging In ---');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'strongpassword123' })
  });
  
  const loginData = await loginRes.json();
  console.log('Login Response:', loginData.success);

  if (!loginData.success) {
    console.error('Login failed, run postman collection to register test@example.com first!');
    return;
  }

  const cookie = loginRes.headers.get('set-cookie');

  console.log('--- Requesting AI Research for Microsoft ---');
  const researchRes = await fetch('http://localhost:5000/api/research', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify({ companyName: 'Microsoft' })
  });

  const researchData = await researchRes.json();
  console.log('Research Response:', JSON.stringify(researchData, null, 2));
};

testResearch();
