/* ゾーンタグで生き物カードを絞り込む
   使い方：
   <div class="zonefilter" data-target="#specieslist">
     <button data-zone="all" aria-pressed="true">すべて</button>
     <button data-zone="gotsu">ゴツゴツ</button> ...
   </div>
   <div id="specieslist"><article class="sp" data-zone="gotsu"> ... </article></div>
   カードに複数ゾーンを持たせるときは data-zone="gotsu chap" のように空白区切り。 */
(function(){
  function setup(bar){
    const target=document.querySelector(bar.dataset.target);
    if(!target) return;
    const cards=[...target.querySelectorAll('[data-zone]')];
    const labels=[...target.querySelectorAll('.zone-label')];
    const btns=[...bar.querySelectorAll('button[data-zone]')];

    function apply(zone){
      btns.forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.zone===zone)));
      cards.forEach(c=>{
        const zs=(c.dataset.zone||'').split(/\s+/);
        c.style.display=(zone==='all'||zs.includes(zone))?'':'none';
      });
      // ゾーン見出しは「すべて」のときだけ出す
      labels.forEach(l=>l.style.display=(zone==='all')?'':'none');
    }
    btns.forEach(b=>b.addEventListener('click',()=>apply(b.dataset.zone)));
    apply('all');
  }
  function boot(){ document.querySelectorAll('.zonefilter').forEach(setup); }
  if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
