/* 統合生き物ずかん：場所×ゾーン×季節の3軸フィルタ
   - 場所を選ぶと、その場所のゾーンボタン（磯3／砂浜4）だけを出す（場所連動）
   - カードは data-place / data-zone(空白区切り) / data-season を持つ
   - 3軸すべてに一致（AND）したカードだけ表示 */
(function(){
  var bar=document.querySelector('.zukanfilter');
  if(!bar) return;
  var target=document.querySelector(bar.dataset.target);
  if(!target) return;
  var cards=[].slice.call(target.querySelectorAll('.sp'));
  var zoneRow=bar.querySelector('.zf-zones');
  var zoneBtns=[].slice.call(zoneRow.querySelectorAll('button[data-facet="zone"]'));
  var countEl=bar.querySelector('.zf-count');
  var hintEl=bar.querySelector('.zf-hint');
  var state={place:'all',zone:'all',season:'all'};

  function press(facet,val){
    bar.querySelectorAll('button[data-facet="'+facet+'"]').forEach(function(b){
      b.setAttribute('aria-pressed', String(b.dataset.val===val));
    });
  }
  function syncZoneRow(){
    if(state.place==='all'){ zoneRow.hidden=true; if(hintEl) hintEl.style.display=''; return; }
    zoneRow.hidden=false; if(hintEl) hintEl.style.display='none';
    zoneBtns.forEach(function(b){
      b.hidden=!(b.dataset.val==='all' || b.dataset.place===state.place);
    });
  }
  function apply(){
    var n=0;
    cards.forEach(function(c){
      var zs=(c.dataset.zone||'').split(/\s+/);
      var ok=(state.place==='all'||c.dataset.place===state.place)
           &&(state.zone==='all'||zs.indexOf(state.zone)>=0)
           &&(state.season==='all'||c.dataset.season===state.season);
      c.style.display=ok?'':'none'; if(ok)n++;
    });
    if(countEl) countEl.textContent='表示中 '+n+'件';
  }
  bar.querySelectorAll('button[data-facet]').forEach(function(b){
    b.addEventListener('click',function(){
      var f=b.dataset.facet, v=b.dataset.val;
      state[f]=v; press(f,v);
      if(f==='place'){ state.zone='all'; press('zone','all'); syncZoneRow(); }
      apply();
    });
  });
  syncZoneRow(); apply();
})();
