/* 生き物カードをタップ → 詳細モーダル
   カード面は タグ＋和名＋学名 のみ。サイズ・環境・分類・ゾーン・初出は詳細で。 */
(function(){
  var modal=document.getElementById('spDetail');
  if(!modal) return;
  var img=modal.querySelector('.sp-detail__ph img');
  var tags=modal.querySelector('.sp-detail__tags');
  var jp=modal.querySelector('.sp-detail__jp');
  var sci=modal.querySelector('.sp-detail__sci');
  var tax=modal.querySelector('.sp-detail__tax');
  var dl=modal.querySelector('.sp-detail__dl');

  var ZC={ 'ゴツゴツゾーン':'z-gotsu','チャプチャプゾーン':'z-chap','ブクブクゾーン':'z-buku',
           'サラサラゾーン':'z-sara','カタカタゾーン':'z-kata','シャバシャバゾーン':'z-shaba','ボコボコゾーン':'z-boko' };

  function open(card){
    var d=card.dataset;
    var phBox=modal.querySelector('.sp-detail__ph');
    if(d.img){ img.src=d.img; img.alt=d.jp; phBox.style.display=''; }
    else{ img.removeAttribute('src'); phBox.style.display='none'; }
    tags.innerHTML=(d.zones||'').split('・').filter(Boolean).map(function(z){
      return '<span class="sp__zone '+(ZC[z]||'')+'">'+z+'</span>';
    }).join('');
    jp.innerHTML=d.jp+'<span class="sp__kanji">'+(d.kanji||'')+'</span>';
    sci.textContent=d.sci||'';
    tax.textContent=d.tax||'';
    dl.innerHTML=
      '<dt>サイズ</dt><dd>'+(d.size||'')+'</dd>'+
      '<dt>環境</dt><dd>'+(d.env||'')+'</dd>'+
      '<dt>見つかった場所</dt><dd>'+(d.zones||'').split('・').join('／')+'</dd>'+
      '<dt>初出</dt><dd>'+(d.first||'')+'</dd>';
    modal.hidden=false;
    document.body.style.overflow='hidden';
  }
  function close(){ modal.hidden=true; document.body.style.overflow=''; }

  document.querySelectorAll('.sp').forEach(function(card){
    card.addEventListener('click',function(){ open(card); });
    card.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(card); }
    });
  });
  modal.addEventListener('click',function(e){
    if(e.target===modal||e.target.classList.contains('sp-detail__x')) close();
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!modal.hidden) close(); });
})();
