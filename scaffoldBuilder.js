/**
 * Local fallback when TRAE_API_URL is not configured.
 * Produces a self-contained mini-app for iframe preview.
 */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildFieldMarkup(fields) {
  if (!fields || !fields.length) {
    return `<label>Notes<input type="text" name="notes" placeholder="Your idea in one line" /></label>`;
  }
  return fields
    .map((f) => {
      const label = escapeHtml(f.label || 'Field');
      const name = label.toLowerCase().replace(/\s+/g, '_');
      if (f.fieldType === 'email') {
        return `<label>${label}<input type="email" name="${name}" /></label>`;
      }
      if (f.fieldType === 'number') {
        return `<label>${label}<input type="number" name="${name}" /></label>`;
      }
      if (f.fieldType === 'dropdown') {
        const opts = (f.options && f.options.length ? f.options : ['Option A', 'Option B']).map(
          (o) => `<option>${escapeHtml(o)}</option>`
        );
        return `<label>${label}<select name="${name}">${opts.join('')}</select></label>`;
      }
      return `<label>${label}<input type="text" name="${name}" /></label>`;
    })
    .join('');
}

function buildScaffoldFromPrompt(prompt, fields, appName) {
  const title = escapeHtml((appName || 'Generated App').slice(0, 80));
  const safePrompt = escapeHtml((prompt || '').slice(0, 280));
  const fieldsHtml = buildFieldMarkup(fields);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="data:text/css;base64,REPLACE_CSS" />
</head>
<body>
  <div class="shell">
    <header class="hero">
      <h1>${title}</h1>
      <p class="sub">Preview scaffold from your prompt.</p>
    </header>
    <section class="card">
      <h2>Your idea</h2>
      <blockquote>${safePrompt}</blockquote>
      <form id="demo-form" class="grid">
        ${fieldsHtml}
        <button type="submit" class="cta">Submit demo</button>
      </form>
      <p id="msg" class="msg" hidden></p>
    </section>
    <footer class="ft">IteraGen preview — interactive demo</footer>
  </div>
  <script src="data:text/javascript;base64,REPLACE_JS"></script>
</body>
</html>`;

  const css = `
:root { --bg:#0c1220; --card:#151b2e; --cyan:#22d3ee; --vio:#a78bfa; --text:#e2e8f0; }
* { box-sizing: border-box; }
body { margin:0; font-family: system-ui, Segoe UI, Roboto, sans-serif; background: radial-gradient(1200px 600px at 20% -10%, rgba(34,211,238,.12), transparent), radial-gradient(900px 500px at 100% 0%, rgba(167,139,250,.12), transparent), var(--bg); color: var(--text); min-height: 100vh; }
.shell { max-width: 520px; margin: 0 auto; padding: 1.25rem; }
.hero h1 { font-size: 1.35rem; margin: 0 0 .35rem; background: linear-gradient(90deg, var(--cyan), var(--vio)); -webkit-background-clip: text; color: transparent; }
.sub { opacity: .85; margin: 0; font-size: .9rem; }
.card { margin-top: 1rem; padding: 1rem; border-radius: 12px; background: rgba(21,27,46,.85); border: 1px solid rgba(34,211,238,.25); box-shadow: 0 0 24px rgba(34,211,238,.08); }
.card h2 { margin: 0 0 .5rem; font-size: 1rem; }
blockquote { margin: 0 0 1rem; padding: .65rem .75rem; border-left: 3px solid var(--vio); background: rgba(0,0,0,.2); border-radius: 6px; font-size: .88rem; }
.grid { display: grid; gap: .65rem; }
label { display: grid; gap: .35rem; font-size: .82rem; }
input, select { padding: .55rem .6rem; border-radius: 8px; border: 1px solid rgba(148,163,184,.35); background: #0b1020; color: var(--text); }
.cta { margin-top: .25rem; padding: .65rem 1rem; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; color: #042f2e; background: linear-gradient(90deg, var(--cyan), #67e8f9); box-shadow: 0 0 18px rgba(34,211,238,.45); }
.cta:hover { filter: brightness(1.05); }
.msg { color: var(--cyan); font-size: .88rem; }
.ft { margin-top: 1rem; text-align: center; font-size: .75rem; opacity: .55; }
`;

  const js = `
document.getElementById('demo-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var m = document.getElementById('msg');
  m.hidden = false;
  m.textContent = 'Thanks — this is a live preview. Your full app can be refined in IteraGen.';
});
`;

  const cssB64 = Buffer.from(css.trim(), 'utf8').toString('base64');
  const jsB64 = Buffer.from(js.trim(), 'utf8').toString('base64');

  const fullHtml = html.replace('REPLACE_CSS', cssB64).replace('REPLACE_JS', jsB64);

  return {
    html: fullHtml,
    scaffoldHtml: fullHtml,
    scaffoldCss: css.trim(),
    scaffoldJs: js.trim(),
  };
}

module.exports = { buildScaffoldFromPrompt, escapeHtml };
