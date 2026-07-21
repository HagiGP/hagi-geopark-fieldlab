/* 外気温の分布：調査日タブで「観測情報＋北/南の棒グラフ」を切り替える。
   地図（chartmap）は据え置き。データは data/fuketsu-heat.json。 */
(function(){
  const box = document.getElementById('heat-dates');
  if(!box) return;
  const elTabs = box;
  const elObs  = document.getElementById('heat-obs');
  const elN    = document.getElementById('heat-bars-north');
  const elS    = document.getElementById('heat-bars-south');

  // 温度→色（chartmap.js の HEAT ランプと同じ。青=冷 → 橙=暖）
  const STOPS = [[15,[47,111,176]],[21,[58,160,196]],[25,[102,198,160]],[29,[226,184,74]],[33,[213,101,26]]];
  function heatColor(t){
    if(t<=STOPS[0][0]) return rgb(STOPS[0][1]);
    if(t>=STOPS[STOPS.length-1][0]) return rgb(STOPS[STOPS.length-1][1]);
    for(let i=0;i<STOPS.length-1;i++){
      const [t0,c0]=STOPS[i],[t1,c1]=STOPS[i+1];
      if(t>=t0 && t<=t1){ const k=(t-t0)/(t1-t0);
        return rgb([0,1,2].map(j=>Math.round(c0[j]+(c1[j]-c0[j])*k))); }
    }
    return rgb(STOPS[STOPS.length-1][1]);
  }
  const rgb = a => 'rgb('+a[0]+','+a[1]+','+a[2]+')';

  // 棒グラフ（viewBox 470x300）。温度10→y258, 35→y52 の線形。
  const yFor = t => 258 - (t-10)*8.24;
  function barsSVG(title, rows){
    const n = rows.length, W = 409, step = W/n, bw = step*0.56;
    let s = `<svg viewBox="0 0 470 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}の温度測定結果">`;
    s += `<rect x="0" y="0" width="470" height="300" rx="14" fill="#16261f"/>`;
    s += `<text x="235" y="30" text-anchor="middle" class="tbar-title">${title}</text>`;
    [10,15,20,25,30,35].forEach(t=>{ const y=yFor(t).toFixed(1);
      s += `<line class="tbar-grid" x1="46" y1="${y}" x2="455" y2="${y}"/>`;
      s += `<text class="tbar-lab" x="40" y="${(yFor(t)+4).toFixed(1)}" text-anchor="end">${t}</text>`; });
    s += `<line class="tbar-axis" x1="46" y1="52" x2="46" y2="258"/>`;
    s += `<line class="tbar-axis" x1="46" y1="258" x2="455" y2="258"/>`;
    rows.forEach((r,i)=>{ const x=46 + i*step + (step-bw)/2, cx=x+bw/2,
      y=yFor(r.temp), h=258-y;
      s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${heatColor(r.temp)}"/>`;
      s += `<text class="tbar-val" x="${cx.toFixed(1)}" y="${(y-6).toFixed(1)}" text-anchor="middle">${r.temp.toFixed(1)}</text>`;
      s += `<text class="tbar-lab" x="${cx.toFixed(1)}" y="274" text-anchor="middle" font-size="10">${r.id}${r.fuketsu?'*':''}</text>`; });
    s += `</svg>`;
    return s;
  }

  function obsHTML(o){
    return `<div class="ob-wind">
      <svg viewBox="0 0 46 46" class="wb-svg" aria-hidden="true">
        <circle cx="23" cy="23" r="20" class="wb-ring"></circle>
        <text x="23" y="9" class="wb-n">北</text>
        <g transform="rotate(${o.windDeg} 23 24)">
          <line x1="23" y1="37" x2="23" y2="13" class="wb-arr"></line>
          <path d="M23,10 L18,19 L28,19 Z" class="wb-head"></path>
        </g>
      </svg>
      <div class="wb-txt"><span>調査時の風｜越ヶ浜（推定）</span><b>${o.windDir} ${o.windSpeed}</b><span>${o.windFlow}</span></div>
    </div>
    <dl class="ob-dl">
      <div><dt>調査日時</dt><dd>${o.datetime}</dd></div>
      <div><dt>天気</dt><dd>${o.weather}</dd></div>
      <div><dt>気温</dt><dd>${o.temp}</dd></div>
      <div><dt>${o.amedasLabel}</dt><dd>${o.amedas}</dd></div>
    </dl>`;
  }

  function render(days, i){
    const d = days[i];
    if(elObs) elObs.innerHTML = obsHTML(d.obs);
    if(elN) elN.innerHTML = barsSVG('明神池の北側地区', d.north);
    if(elS) elS.innerHTML = barsSVG('明神池の南側地区', d.south);
    elTabs.querySelectorAll('.date-tab').forEach(b=>b.classList.toggle('is-active', +b.dataset.i===i));
  }

  fetch('../../data/fuketsu-heat.json').then(r=>r.json()).then(data=>{
    const days = data.days || [];
    if(!days.length) return;
    let html = `<span class="date-tabs__lab">調査日</span>`;
    days.forEach((d,i)=>{ html += `<button type="button" class="date-tab" data-i="${i}">${d.label}</button>`; });
    elTabs.innerHTML = html;
    elTabs.addEventListener('click', e=>{ const b=e.target.closest('.date-tab'); if(!b) return; render(days, +b.dataset.i); });
    render(days, days.length-1); // 既定は最新日
  }).catch(err=>console.warn('fuketsu-heat 読込失敗', err));
})();
