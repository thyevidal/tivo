async function listModels() {
  const key = 'AIzaSyDlyglyKvj8kA3WHjJY6Ey7nsa4pdQX5mQ';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
  const data = await res.json();
  if (data.models) {
    data.models.forEach(m => console.log(m.name));
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
listModels();
