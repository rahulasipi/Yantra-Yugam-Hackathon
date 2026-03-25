/**
 * Deterministic pseudo-validation for demo + diagram payloads.
 */

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function hashString(s) {
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * entropy: per-app salt (id, prompt, timestamp) so identical dummy scaffolds still get varied scores.
 */
function dimensionsFromScaffold(html, css, js, fields, entropy = '') {
  const bundle = `${html || ''}${css || ''}${js || ''}`;
  const salt = String(entropy || '');

  const nFields = fields && fields.length ? fields.length : 0;
  const clarity = clamp(
    36 + (hashString(`${bundle}|clarity|${salt}`) % 48) + Math.min(8, nFields * 2),
    34,
    91
  );
  const logic = clamp(35 + (hashString(`${bundle}|logic|${salt}`) % 50) + (nFields >= 2 ? 5 : 0), 33, 90);
  const uiConsistency = clamp(
    34 + (hashString(`${bundle}|ui|${salt}`) % 51) - (bundle.length < 320 ? 6 : 0),
    32,
    91
  );
  const reliability = clamp(
    36 + (hashString(`${bundle}|rel|${salt}`) % 47) + (bundle.length > 900 ? 4 : 0),
    33,
    92
  );

  const trustScore = Math.round((clarity + logic + uiConsistency + reliability) / 4);

  const notes = [];
  if (bundle.length < 400) notes.push('Scaffold is compact; consider more structure for production.');
  if (!fields || fields.length === 0) notes.push('Adding form fields often improves clarity for end users.');
  if (trustScore >= 82) notes.push('Strong overall structure for a prototype.');
  else if (trustScore < 55) notes.push('Several areas look brittle for a production rollout; iterate on structure.');
  return { clarity, logic, uiConsistency, reliability, trustScore, notes };
}

function benchmarkBarsForUserApps(apps) {
  const list = (apps || []).slice(0, 6);
  if (!list.length) {
    return [
      { label: 'Sample A', value: 63 },
      { label: 'Sample B', value: 74 },
      { label: 'Sample C', value: 58 },
    ];
  }
  return list.map((a) => ({
    label: (a.name || 'App').slice(0, 14),
    value: a.trustScore != null ? a.trustScore : 70,
  }));
}

function compareTrust(appA, appB) {
  const sa = appA.trustScore != null ? appA.trustScore : 70;
  const sb = appB.trustScore != null ? appB.trustScore : 70;
  const delta = Math.round((sb - sa) * 10) / 10;
  let favor = 'tie';
  if (delta > 0.5) favor = 'b';
  else if (delta < -0.5) favor = 'a';
  const forecast = favor === 'b' ? 'Version B shows a higher stability forecast.' : favor === 'a' ? 'Version A shows a higher stability forecast.' : 'Both versions are closely matched.';
  return { deltaPercent: delta, favor, forecast };
}

function radarAggregate(dimA, dimB) {
  const axes = ['clarity', 'logic', 'uiConsistency', 'reliability'];
  const labels = ['Clarity', 'Logic', 'UI consistency', 'Reliability'];
  return axes.map((k, i) => ({
    key: k,
    label: labels[i],
    a: dimA[k] != null ? dimA[k] : 70,
    b: dimB[k] != null ? dimB[k] : 72,
  }));
}

function barCompareMetrics(appA, appB) {
  const sa = appA.trustScore != null ? appA.trustScore : 62;
  const sb = appB.trustScore != null ? appB.trustScore : 66;
  return [
    { key: 'Scalability', a: clamp(sa - 8 + (hashString(appA._id) % 14), 32, 90), b: clamp(sb - 6 + (hashString(appB._id) % 14), 32, 90) },
    { key: 'Usability', a: clamp(sa - 4 + (hashString(`${appA._id}u`) % 12), 35, 92), b: clamp(sb - 3 + (hashString(`${appB._id}u`) % 12), 35, 92) },
    { key: 'Maintainability', a: clamp(sa - 6 + (hashString(`${appA._id}m`) % 14), 33, 91), b: clamp(sb + 2 + (hashString(`${appB._id}m`) % 14), 33, 91) },
    { key: 'Trust index', a: sa, b: sb },
  ];
}

module.exports = {
  dimensionsFromScaffold,
  benchmarkBarsForUserApps,
  compareTrust,
  radarAggregate,
  barCompareMetrics,
};
