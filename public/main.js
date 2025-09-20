const output = document.getElementById('output');

document.getElementById('aiUpdateBtn').addEventListener('click', async () => {
  const instruction = document.getElementById('instruction').value;
  output.textContent = '⏳ 生成中...';
  try {
    const res = await fetch('/api/ai-update', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ instruction })
    });
    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    output.textContent = '❌ ' + e.message;
  }
});

document.getElementById('sendBtn').addEventListener('click', async () => {
  const files = JSON.parse(output.textContent)?.files;
  if (!files) return alert('請先生成檔案');
  output.textContent = '⏳ 送出部署站...';
  try {
    const res = await fetch('/api/send-to-deployer', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ files })
    });
    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    output.textContent = '❌ ' + e.message;
  }
});
