function pickName(prompt) {
  const line = String(prompt || '').split('\n')[0].trim();
  if (!line) return 'My App';
  return line.length > 48 ? `${line.slice(0, 45)}…` : line;
}

function buildDummyScaffold(appName) {
  const safeTitle = appName || 'Demo App';
  const html = `<!DOCTYPE html><html><head><title>Demo App</title></head><body><h1>Hello Judges!</h1><p>This is a demo scaffold.</p></body></html>`;
  const css = `body { font-family: Arial; background: linear-gradient(to right, #00f, #0ff); color: white; text-align: center; }`;
  const js = `console.log('Demo app running');`;
  const scaffoldHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>${css}</style>
</head>
<body>
  <h1>Hello Judges!</h1>
  <p>This is a demo scaffold.</p>
  <script>${js}</script>
</body>
</html>`;

  return { html, css, js, scaffoldHtml, scaffoldCss: css, scaffoldJs: js };
}

async function generateWithTrae(prompt) {
  const name = pickName(prompt);
  const dummy = buildDummyScaffold(name);
  return { ...dummy, source: 'dummy' };
}

module.exports = { generateWithTrae, pickName };
