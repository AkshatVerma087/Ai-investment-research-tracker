const testHistory = async () => {
  console.log('--- Logging In ---');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'strongpassword123' })
  });
  
  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('Login failed');
    return;
  }
  const cookie = loginRes.headers.get('set-cookie');

  console.log('\n--- Fetching History (Page 1) [Expect DB hit] ---');
  let startTime = Date.now();
  const historyRes1 = await fetch('http://localhost:5000/api/research/history?page=1&limit=2', {
    headers: { 'Cookie': cookie }
  });
  const historyData1 = await historyRes1.json();
  console.log(`Received in ${Date.now() - startTime}ms`);
  console.log(JSON.stringify(historyData1, null, 2));
  if(historyData1.pagination) {
    console.log(`Total Records: ${historyData1.pagination.total}`);
  }

  console.log('\n--- Fetching History (Page 1) again [Expect Cache hit (much faster)] ---');
  startTime = Date.now();
  const historyRes2 = await fetch('http://localhost:5000/api/research/history?page=1&limit=2', {
    headers: { 'Cookie': cookie }
  });
  await historyRes2.json();
  console.log(`Received in ${Date.now() - startTime}ms`);

  if (historyData1.data.length > 0) {
    const firstId = historyData1.data[0].id;
    console.log(`\n--- Fetching specific research detail (ID: ${firstId}) ---`);
    const detailRes = await fetch(`http://localhost:5000/api/research/history/${firstId}`, {
      headers: { 'Cookie': cookie }
    });
    const detailData = await detailRes.json();
    console.log(`Detail Verdict: ${detailData.data.verdict}`);
  } else {
    console.log('No history found to test details endpoint.');
  }
};

testHistory();
