/* 奈古・ウニラボ：計測40個体（data/uni-2026.json）から散布図・分布図を作図する。
   風穴ラボの棒グラフ（fuketsu-heat.js）と同じ計器パネルの作法に揃えている。 */
(function(){
  const box = document.querySelector('.js-uni-charts');
  if(!box) return;

  const SEX = { 'M':{ label:'オス', color:'#56c9ad' }, 'F':{ label:'メス', color:'#f4cf6b' } };
  const W = 470, H = 320, L = 58, R = 452, T = 54, B = 266;

  // 目盛りの刻みを「1・2・5の系列」から選ぶ
  function niceStep(span, target){
    const raw = span / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * mag;
  }
  function axisRange(vals, padRatio){
    const lo0 = Math.min.apply(null, vals), hi0 = Math.max.apply(null, vals);
    const pad = (hi0 - lo0) * padRatio;
    const step = niceStep((hi0 - lo0) + pad * 2, 7);
    let lo = Math.floor((lo0 - pad) / step) * step;
    if(lo0 >= 0) lo = Math.max(0, lo);   // 負の値をとらない量で軸がマイナスに伸びるのを防ぐ
    return { lo, hi: Math.ceil((hi0 + pad) / step) * step, step };
  }
  const fmt = v => (Math.round(v * 10) / 10).toString();
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');

  function frame(title, ax, ay, xlab, ylab){
    let s = `<rect x="0" y="0" width="${W}" height="${H}" rx="14" fill="#16261f"/>`;
    s += `<text x="${W/2}" y="30" text-anchor="middle" class="tbar-title">${esc(title)}</text>`;
    for(let v = ay.lo; v <= ay.hi + 1e-9; v += ay.step){
      const y = yPos(v, ay);
      s += `<line class="tbar-grid" x1="${L}" y1="${y.toFixed(1)}" x2="${R}" y2="${y.toFixed(1)}"/>`;
      s += `<text class="tbar-lab" x="${L-8}" y="${(y+4).toFixed(1)}" text-anchor="end">${fmt(v)}</text>`;
    }
    for(let v = ax.lo; v <= ax.hi + 1e-9; v += ax.step){
      const x = xPos(v, ax);
      s += `<line class="tbar-grid" x1="${x.toFixed(1)}" y1="${T}" x2="${x.toFixed(1)}" y2="${B}"/>`;
      s += `<text class="tbar-lab" x="${x.toFixed(1)}" y="${B+18}" text-anchor="middle">${fmt(v)}</text>`;
    }
    s += `<line class="tbar-axis" x1="${L}" y1="${T}" x2="${L}" y2="${B}"/>`;
    s += `<line class="tbar-axis" x1="${L}" y1="${B}" x2="${R}" y2="${B}"/>`;
    s += `<text class="tbar-unit" x="${(L+R)/2}" y="${H-12}" text-anchor="middle">${esc(xlab)}</text>`;
    s += `<text class="tbar-unit" x="14" y="${(T+B)/2}" text-anchor="middle" transform="rotate(-90 14 ${(T+B)/2})">${esc(ylab)}</text>`;
    return s;
  }
  const xPos = (v, a) => L + (v - a.lo) / (a.hi - a.lo) * (R - L);
  const yPos = (v, a) => B - (v - a.lo) / (a.hi - a.lo) * (B - T);

  function tip(r){
    return `No.${r.no}／殻径 ${r.shell}mm・全径 ${r.total}mm・トゲ ${r.spine}mm・体重 ${r.weight}g・生殖巣 ${r.gonad}g・GSI ${r.gsi}・${SEX[r.sex].label}`;
  }

  function scatter(rows, title, kx, ky, xlab, ylab){
    const ax = axisRange(rows.map(r=>r[kx]), .12), ay = axisRange(rows.map(r=>r[ky]), .12);
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(title)}">`;
    s += frame(title, ax, ay, xlab, ylab);
    rows.forEach(r=>{
      s += `<circle cx="${xPos(r[kx],ax).toFixed(1)}" cy="${yPos(r[ky],ay).toFixed(1)}" r="4.6"`
        +  ` fill="${SEX[r.sex].color}" fill-opacity=".72" stroke="#16261f" stroke-width="1">`
        +  `<title>${esc(tip(r))}</title></circle>`;
    });
    return s + `</svg>`;
  }

  // GSI の散らばりを雌雄別のレーンで見せる（値が近い個体は上下にずらす）
  function strip(rows, title, xlab){
    const ax = axisRange(rows.map(r=>r.gsi), .08);
    const lanes = [['M', 108], ['F', 200]];
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(title)}">`;
    s += `<rect x="0" y="0" width="${W}" height="${H}" rx="14" fill="#16261f"/>`;
    s += `<text x="${W/2}" y="30" text-anchor="middle" class="tbar-title">${esc(title)}</text>`;
    for(let v = ax.lo; v <= ax.hi + 1e-9; v += ax.step){
      const x = xPos(v, ax);
      s += `<line class="tbar-grid" x1="${x.toFixed(1)}" y1="${T+10}" x2="${x.toFixed(1)}" y2="${B}"/>`;
      s += `<text class="tbar-lab" x="${x.toFixed(1)}" y="${B+18}" text-anchor="middle">${fmt(v)}</text>`;
    }
    s += `<line class="tbar-axis" x1="${L}" y1="${B}" x2="${R}" y2="${B}"/>`;
    lanes.forEach(([sex, cy])=>{
      const set = rows.filter(r=>r.sex===sex).slice().sort((a,b)=>a.gsi-b.gsi);
      s += `<text class="tbar-lane" x="${L-8}" y="${cy+4}" text-anchor="end">${SEX[sex].label} ${set.length}</text>`;
      s += `<line class="tbar-lane-rule" x1="${L}" y1="${cy}" x2="${R}" y2="${cy}"/>`;
      // 同じあたりの値は縦の列にまとめて積む（斜めに流れないよう列ごとに独立させる）
      const colW = 11, cols = {};
      set.forEach(r=>{ const x = xPos(r.gsi, ax); const c = Math.round(x / colW);
        (cols[c] = cols[c] || []).push({ r, x }); });
      Object.keys(cols).forEach(c=>{
        cols[c].forEach((it, i)=>{
          const dy = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 10.5;
          s += `<circle cx="${it.x.toFixed(1)}" cy="${(cy+dy).toFixed(1)}" r="4.8"`
            +  ` fill="${SEX[sex].color}" fill-opacity=".78" stroke="#16261f" stroke-width="1">`
            +  `<title>${esc(tip(it.r))}</title></circle>`;
        });
      });
    });
    s += `<text class="tbar-unit" x="${(L+R)/2}" y="${H-12}" text-anchor="middle">${esc(xlab)}</text>`;
    return s + `</svg>`;
  }

  fetch('../../data/uni-2026.json').then(r=>r.json()).then(d=>{
    const rows = d.rows || [];
    if(!rows.length) return;
    const put = (id, svg) => { const el = document.getElementById(id); if(el) el.innerHTML = svg; };
    put('uni-chart-size',  scatter(rows, '殻径と体重', 'shell', 'weight', '殻径（mm）', '体重（g）'));
    put('uni-chart-spine', scatter(rows, '殻径とトゲの長さ', 'shell', 'spine', '殻径（mm）', 'トゲの長さ（mm）'));
    put('uni-chart-gsi',   strip(rows, 'GSI（実入り）の散らばり', 'GSI'));
    put('uni-chart-cross', scatter(rows, '殻径と実入り（GSI）', 'shell', 'gsi', '殻径（mm）', 'GSI'));
  }).catch(err=>console.warn('uni-charts 読込失敗', err));
})();
