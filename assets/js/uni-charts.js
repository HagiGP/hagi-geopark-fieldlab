/* 奈古・ウニラボ：計測データ（data/uni-surveys.json）から散布図・分布図を作図する。
   調査日タブで回を切り替える（風穴ラボの fuketsu-heat.js と同じ作法）。 */
(function(){
  const box = document.querySelector('.js-uni-charts');
  if(!box) return;

  const SEX = {
    'M':{ label:'オス',     color:'#56c9ad' },
    'F':{ label:'メス',     color:'#f4cf6b' },
    'U':{ label:'雌雄不明', color:'#93a39a' }
  };
  const ORDER = ['M','F','U'];
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
  const xPos = (v, a) => L + (v - a.lo) / (a.hi - a.lo) * (R - L);
  const yPos = (v, a) => B - (v - a.lo) / (a.hi - a.lo) * (B - T);

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

  function tip(r){
    const parts = [`No.${r.no}`, `殻径 ${r.shell}mm`];
    if(r.total != null) parts.push(`全径 ${r.total}mm`, `トゲ ${r.spine}mm`);
    parts.push(`体重 ${r.weight}g`, `生殖巣 ${r.gonad}g`, `GSI ${r.gsi}`, SEX[r.sex].label);
    return parts.join('／');
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

  // GSI（実入り）の分布を、雌雄で色を分けた積み上げ棒グラフで見せる。
  // メスが「ほとんど空の個体」と「多く入った個体」に分かれることが、山の形で見える。
  function histogram(rows, title, xlab){
    const LH = 52, BIN = 1;
    const hiV = Math.max.apply(null, rows.map(r=>r.gsi));
    const nb = Math.max(1, Math.ceil((hiV + 1e-9) / BIN));
    const present = ORDER.filter(sx => rows.some(r=>r.sex===sx));
    // 積み上げの順番：メスを一番下に置き、山の形をそのまま読めるようにする
    const stack = ['F','M','U'].filter(sx => present.includes(sx));
    const bins = Array.from({length: nb}, (_, i) => {
      const lo = i * BIN, hi = lo + BIN;
      const inBin = r => (i === nb - 1) ? (r.gsi >= lo && r.gsi <= hi) : (r.gsi >= lo && r.gsi < hi);
      const by = {}; stack.forEach(sx => { by[sx] = rows.filter(r => r.sex === sx && inBin(r)).length; });
      return { lo, hi, by, total: Object.values(by).reduce((a,b)=>a+b, 0) };
    });
    const maxN = Math.max.apply(null, bins.map(b=>b.total));
    const yStep = niceStep(Math.max(2, maxN), 5);
    const yHi = Math.max(yStep, Math.ceil(maxN / yStep) * yStep);
    const yFor = v => B - v / yHi * (B - T);
    const step = (R - LH) / nb, bw = step * 0.78;

    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(title)}">`;
    s += `<rect x="0" y="0" width="${W}" height="${H}" rx="14" fill="#16261f"/>`;
    s += `<text x="${W/2}" y="30" text-anchor="middle" class="tbar-title">${esc(title)}</text>`;
    for(let v = 0; v <= yHi + 1e-9; v += yStep){
      const y = yFor(v);
      s += `<line class="tbar-grid" x1="${LH}" y1="${y.toFixed(1)}" x2="${R}" y2="${y.toFixed(1)}"/>`;
      s += `<text class="tbar-lab" x="${LH-8}" y="${(y+4).toFixed(1)}" text-anchor="end">${v}</text>`;
    }
    s += `<line class="tbar-axis" x1="${LH}" y1="${T}" x2="${LH}" y2="${B}"/>`;
    s += `<line class="tbar-axis" x1="${LH}" y1="${B}" x2="${R}" y2="${B}"/>`;
    bins.forEach((b, i) => {
      const x = LH + i * step + (step - bw) / 2;
      let acc = 0;
      stack.forEach(sx => {
        const n = b.by[sx]; if(!n) return;
        const y0 = yFor(acc + n), h = yFor(acc) - y0;
        s += `<rect x="${x.toFixed(1)}" y="${y0.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}"`
          +  ` fill="${SEX[sx].color}" fill-opacity=".88" stroke="#16261f" stroke-width=".8">`
          +  `<title>GSI ${b.lo}〜${b.hi}／${SEX[sx].label} ${n}個体</title></rect>`;
        acc += n;
      });
      if(b.total) s += `<text class="tbar-val" x="${(x+bw/2).toFixed(1)}" y="${(yFor(b.total)-5).toFixed(1)}" text-anchor="middle">${b.total}</text>`;
      // 目盛りは区間の境目に打つ（2つおき）
      if(i % 2 === 0) s += `<text class="tbar-lab" x="${(LH + i*step).toFixed(1)}" y="${B+18}" text-anchor="middle">${b.lo}</text>`;
    });
    s += `<text class="tbar-lab" x="${R}" y="${B+18}" text-anchor="middle">${bins[nb-1].hi}</text>`;
    s += `<text class="tbar-unit" x="${(LH+R)/2}" y="${H-12}" text-anchor="middle">${esc(xlab)}</text>`;
    s += `<text class="tbar-unit" x="14" y="${(T+B)/2}" text-anchor="middle" transform="rotate(-90 14 ${(T+B)/2})">個体数</text>`;
    return s + `</svg>`;
  }

  const elDates  = document.getElementById('uni-dates');
  const elStats  = document.getElementById('uni-stats');
  const elNote   = document.getElementById('uni-note');
  const elKey    = document.getElementById('uni-key');
  const elCharts = document.getElementById('uni-charts');

  function render(surveys, i){
    const sv = surveys[i], rows = sv.rows || [], cap = sv.captions || {};
    if(elNote) elNote.textContent = sv.note || '';
    if(elStats) elStats.innerHTML = (sv.stats || []).map(s =>
      `<div class="finding"><b>${esc(s.v)}</b><span class="fl">${esc(s.l)}</span><p>${esc(s.t)}</p></div>`).join('');
    if(elKey) elKey.innerHTML = ORDER.filter(sx => rows.some(r=>r.sex===sx)).map(sx =>
      `<span><i style="background:${SEX[sx].color}"></i>${SEX[sx].label} ${rows.filter(r=>r.sex===sx).length}個体</span>`).join('');
    if(elCharts){
      const figs = [[scatter(rows, '殻径と体重', 'shell', 'weight', '殻径（mm）', '体重（g）'), cap.size]];
      if(sv.hasSpine) figs.push([scatter(rows, '殻径とトゲの長さ', 'shell', 'spine', '殻径（mm）', 'トゲの長さ（mm）'), cap.spine]);
      figs.push([histogram(rows, 'GSI（実入り）の分布', 'GSI'), cap.gsi]);
      figs.push([scatter(rows, '殻径と実入り（GSI）', 'shell', 'gsi', '殻径（mm）', 'GSI'), cap.cross]);
      elCharts.innerHTML = figs.map(([svg, c]) =>
        `<figure>${svg}<figcaption>${esc(c || '')}</figcaption></figure>`).join('');
    }
    if(elDates) elDates.querySelectorAll('.date-tab').forEach(b => b.classList.toggle('is-active', +b.dataset.i === i));
  }

  fetch('../../data/uni-surveys.json').then(r=>r.json()).then(d=>{
    const surveys = d.surveys || [];
    if(!surveys.length) return;
    if(elDates){
      elDates.innerHTML = `<span class="date-tabs__lab">調査日</span>` + surveys.map((s,i)=>
        `<button type="button" class="date-tab" data-i="${i}">${esc(s.label)}</button>`).join('');
      elDates.addEventListener('click', e=>{
        const b = e.target.closest('.date-tab'); if(!b) return;
        render(surveys, +b.dataset.i);
      });
    }
    render(surveys, 0);
  }).catch(err=>console.warn('uni-charts 読込失敗', err));
})();
