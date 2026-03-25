(function (global) {
  function polar(cx, cy, r, angleDeg) {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function svgEl(name, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', name);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  }

  /** Circular trust gauge */
  function renderGauge(container, percent) {
    if (!container) return;
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const r = 52;
    const c = 2 * Math.PI * r;
    const offset = c - (p / 100) * c;
    container.innerHTML = '';
    const svg = svgEl('svg', { width: 140, height: 140, viewBox: '0 0 140 140' });
    const defs = svgEl('defs');
    const grad = svgEl('linearGradient', { id: 'gaugeGrad', x1: '0%', y1: '0%', x2: '100%', y2: '100%' });
    grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#00d1ff' }));
    grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#af52ff' }));
    defs.appendChild(grad);
    svg.appendChild(defs);
    const bg = svgEl('circle', {
      cx: 70,
      cy: 70,
      r,
      fill: 'none',
      stroke: 'rgba(255,255,255,0.08)',
      'stroke-width': 10,
    });
    const fg = svgEl('circle', {
      cx: 70,
      cy: 70,
      r,
      fill: 'none',
      stroke: 'url(#gaugeGrad)',
      'stroke-width': 10,
      'stroke-linecap': 'round',
      'stroke-dasharray': String(c),
      'stroke-dashoffset': String(offset),
      transform: 'rotate(-90 70 70)',
    });
    const text = svgEl('text', {
      x: 70,
      y: 76,
      'text-anchor': 'middle',
      fill: '#e8eef7',
      'font-family': 'Orbitron, sans-serif',
      'font-size': '20',
    });
    text.textContent = `${Math.round(p)}%`;
    const sub = svgEl('text', {
      x: 70,
      y: 96,
      'text-anchor': 'middle',
      fill: '#9aa8bc',
      'font-family': 'Poppins, sans-serif',
      'font-size': '9',
    });
    sub.textContent = 'Trust score';
    svg.appendChild(bg);
    svg.appendChild(fg);
    svg.appendChild(text);
    svg.appendChild(sub);
    container.appendChild(svg);
  }

  /** Single-series radar (values 0–100) */
  function renderRadarSingle(svg, axes) {
    if (!svg || !axes || !axes.length) return;
    const cx = 100;
    const cy = 100;
    const maxR = 72;
    const n = axes.length;
    svg.innerHTML = '';
    let pathD = '';
    axes.forEach((a, i) => {
      const angle = (360 / n) * i;
      const rr = (Number(a.value) / 100) * maxR;
      const pt = polar(cx, cy, rr, angle);
      pathD += i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`;
    });
    pathD += ' Z';
    for (let ring = 1; ring <= 4; ring += 1) {
      let d = '';
      for (let i = 0; i < n; i += 1) {
        const angle = (360 / n) * i;
        const pt = polar(cx, cy, (maxR * ring) / 4, angle);
        d += i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`;
      }
      d += ' Z';
      const poly = svgEl('path', {
        d,
        fill: 'none',
        stroke: 'rgba(255,255,255,0.06)',
        'stroke-width': 1,
      });
      svg.appendChild(poly);
    }
    axes.forEach((a, i) => {
      const angle = (360 / n) * i;
      const outer = polar(cx, cy, maxR, angle);
      const line = svgEl('line', {
        x1: cx,
        y1: cy,
        x2: outer.x,
        y2: outer.y,
        stroke: 'rgba(255,255,255,0.06)',
        'stroke-width': 1,
      });
      svg.appendChild(line);
      const labPt = polar(cx, cy, maxR + 14, angle);
      const t = svgEl('text', {
        x: labPt.x,
        y: labPt.y,
        'text-anchor': 'middle',
        fill: '#9aa8bc',
        'font-size': '8',
        'font-family': 'Poppins, sans-serif',
      });
      t.textContent = a.label.length > 14 ? `${a.label.slice(0, 12)}…` : a.label;
      svg.appendChild(t);
    });
    const fill = svgEl('path', {
      d: pathD,
      fill: 'rgba(0, 209, 255, 0.18)',
      stroke: '#00d1ff',
      'stroke-width': 2,
    });
    svg.appendChild(fill);
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '220');
  }

  /** Compare radar: items { label, a, b } values 0–100 */
  function renderRadarDual(svg, items) {
    if (!svg || !items || !items.length) return;
    const cx = 110;
    const cy = 110;
    const maxR = 78;
    const n = items.length;
    function polyPath(getter) {
      let d = '';
      items.forEach((it, i) => {
        const angle = (360 / n) * i;
        const rr = (Number(getter(it)) / 100) * maxR;
        const pt = polar(cx, cy, rr, angle);
        d += i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`;
      });
      return `${d} Z`;
    }
    svg.innerHTML = '';
    for (let ring = 1; ring <= 4; ring += 1) {
      let d = '';
      for (let i = 0; i < n; i += 1) {
        const angle = (360 / n) * i;
        const pt = polar(cx, cy, (maxR * ring) / 4, angle);
        d += i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`;
      }
      d += ' Z';
      svg.appendChild(
        svgEl('path', { d, fill: 'none', stroke: 'rgba(255,255,255,0.06)', 'stroke-width': 1 })
      );
    }
    items.forEach((_, i) => {
      const angle = (360 / n) * i;
      const outer = polar(cx, cy, maxR, angle);
      svg.appendChild(
        svgEl('line', {
          x1: cx,
          y1: cy,
          x2: outer.x,
          y2: outer.y,
          stroke: 'rgba(255,255,255,0.06)',
          'stroke-width': 1,
        })
      );
      const labPt = polar(cx, cy, maxR + 16, angle);
      const t = svgEl('text', {
        x: labPt.x,
        y: labPt.y,
        'text-anchor': 'middle',
        fill: '#9aa8bc',
        'font-size': '8',
        'font-family': 'Poppins, sans-serif',
      });
      t.textContent = items[i].label.length > 12 ? `${items[i].label.slice(0, 10)}…` : items[i].label;
      svg.appendChild(t);
    });
    svg.appendChild(
      svgEl('path', {
        d: polyPath((it) => it.a),
        fill: 'rgba(0, 209, 255, 0.12)',
        stroke: '#00d1ff',
        'stroke-width': 2,
      })
    );
    svg.appendChild(
      svgEl('path', {
        d: polyPath((it) => it.b),
        fill: 'rgba(175, 82, 255, 0.12)',
        stroke: '#af52ff',
        'stroke-width': 2,
      })
    );
    svg.setAttribute('viewBox', '0 0 220 220');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '260');
  }

  function renderHorizontalBars(container, rows) {
    if (!container || !rows) return;
    container.innerHTML = '';
    const maxV = Math.max(...rows.map((r) => Number(r.value) || 0), 1);
    rows.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'bar-row';
      const v = Math.round(Number(r.value) || 0);
      const label = document.createElement('span');
      label.textContent = r.label;
      const track = document.createElement('div');
      track.className = 'bar-track';
      const fill = document.createElement('div');
      fill.className = 'bar-fill';
      fill.style.width = `${(v / maxV) * 100}%`;
      track.appendChild(fill);
      const num = document.createElement('span');
      num.textContent = `${v}`;
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(num);
      container.appendChild(row);
    });
  }

  function renderGroupedBars(container, metrics) {
    if (!container || !metrics) return;
    container.innerHTML = '';
    metrics.forEach((m) => {
      const wrap = document.createElement('div');
      wrap.style.marginBottom = '0.5rem';
      const cap = document.createElement('div');
      cap.className = 'bar-row';
      cap.style.gridTemplateColumns = '1fr';
      cap.textContent = m.key;
      cap.style.fontSize = '0.72rem';
      wrap.appendChild(cap);
      ['a', 'b'].forEach((side, idx) => {
        const row = document.createElement('div');
        row.className = 'bar-row';
        const lab = document.createElement('span');
        lab.textContent = idx === 0 ? 'A' : 'B';
        lab.style.color = idx === 0 ? '#00d1ff' : '#af52ff';
        const track = document.createElement('div');
        track.className = 'bar-track';
        const fill = document.createElement('div');
        fill.className = 'bar-fill';
        fill.style.background = idx === 0 ? 'linear-gradient(90deg,#00d1ff,#5ae8ff)' : 'linear-gradient(90deg,#af52ff,#c994ff)';
        const val = Number(m[side]) || 0;
        fill.style.width = `${val}%`;
        track.appendChild(fill);
        const num = document.createElement('span');
        num.textContent = String(Math.round(val));
        row.appendChild(lab);
        row.appendChild(track);
        row.appendChild(num);
        wrap.appendChild(row);
      });
      container.appendChild(wrap);
    });
  }

  function renderLineProgress(container, values) {
    if (!container) return;
    container.innerHTML = '';
    const max = Math.max(...values.map((v) => v.y), 1);
    const w = 280;
    const h = 120;
    const pad = 12;
    const svg = svgEl('svg', { width: '100%', height: h, viewBox: `0 0 ${w} ${h}` });
    const pts = values.map((p, i) => {
      const x = pad + (i * (w - pad * 2)) / Math.max(values.length - 1, 1);
      const y = h - pad - (p.y / max) * (h - pad * 2);
      return { x, y, label: p.label };
    });
    let d = '';
    pts.forEach((pt, i) => {
      d += i === 0 ? `M ${pt.x} ${pt.y}` : ` L ${pt.x} ${pt.y}`;
    });
    svg.appendChild(
      svgEl('path', {
        d,
        fill: 'none',
        stroke: '#00d1ff',
        'stroke-width': 2,
      })
    );
    pts.forEach((pt) => {
      svg.appendChild(
        svgEl('circle', { cx: pt.x, cy: pt.y, r: 3, fill: '#00ffc2', stroke: '#0a0f18', 'stroke-width': 1 })
      );
    });
    container.appendChild(svg);
  }

  global.IteraGenCharts = {
    renderGauge,
    renderRadarSingle,
    renderRadarDual,
    renderHorizontalBars,
    renderGroupedBars,
    renderLineProgress,
  };
})(typeof window !== 'undefined' ? window : globalThis);
