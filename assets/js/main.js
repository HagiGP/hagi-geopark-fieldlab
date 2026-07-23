/* 萩ジオパーク・フィールドラボ  site interactions (vanilla) */
(function () {
  // mobile nav
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // scroll reveal
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // lightbox for images marked data-zoom (galleries, specimen photos)
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.innerHTML = '<button class="lb__x" aria-label="閉じる">&times;</button><img alt="">';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img');
  function openLb(src, alt) { lbImg.src = src; lbImg.alt = alt || ''; lb.classList.add('open'); }
  function closeLb() { lb.classList.remove('open'); lbImg.src = ''; }
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb__x')) closeLb();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.tagName === 'IMG' && t.hasAttribute('data-zoom')) {
      openLb(t.getAttribute('data-full') || t.src, t.alt);
    }
  });

  // bar heights from data-v (temperature) relative to a fixed scale 10-35C
  document.querySelectorAll('.bars[data-min][data-max]').forEach(function (bars) {
    var min = parseFloat(bars.dataset.min), max = parseFloat(bars.dataset.max);
    bars.querySelectorAll('.bar').forEach(function (b) {
      var v = parseFloat(b.dataset.v);
      var pct = Math.max(2, Math.min(100, ((v - min) / (max - min)) * 100));
      var col = b.querySelector('.col');
      // animate in after paint
      requestAnimationFrame(function () { col.style.height = pct + '%'; });
    });
  });

  // telemetry line-chart hover tooltip (monitoring page)
  (function () {
    var host = document.querySelector('.telemetry');
    if (!host) return;
    var dataEl = host.querySelector('.tele-data');
    var svg = host.querySelector('svg');
    var tip = host.querySelector('.tele-tip');
    var cur = host.querySelector('.tele-cursor');
    if (!dataEl || !svg || !tip || !cur) return;
    var D;
    try { D = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var cross = cur.querySelector('.tele-cross');
    var dots = cur.querySelectorAll('circle');
    var VB = 740;
    function show(clientX) {
      var r = svg.getBoundingClientRect();
      var ux = (clientX - r.left) / r.width * VB;
      if (ux < 48) ux = 48;
      if (ux > 712) ux = 712;
      cur.style.display = '';
      cross.setAttribute('x1', ux);
      cross.setAttribute('x2', ux);
      var rows = '', best = null, bestd = 1e18;
      D.series.forEach(function (s, i) {
        var pts = s.pts, k = 0, kd = 1e18;
        for (var j = 0; j < pts.length; j++) {
          var dd = Math.abs(pts[j][0] - ux);
          if (dd < kd) { kd = dd; k = j; }
        }
        var p = pts[k], c = dots[i];
        if (c) {
          c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]);
          c.setAttribute('fill', s.color); c.style.display = '';
        }
        rows += '<div class="r"><i style="background:' + s.color + '"></i><span>' + s.name + '</span><b>' + p[3].toFixed(1) + '℃</b></div>';
        if (kd < bestd) { bestd = kd; best = p; }
      });
      tip.innerHTML = '<div class="h">' + best[2] + '</div>' + rows;
      tip.hidden = false;
      var ex = (ux / VB) * r.width;
      var left = ex + 14;
      if (left + tip.offsetWidth > r.width) left = ex - tip.offsetWidth - 14;
      if (left < 4) left = 4;
      tip.style.left = left + 'px';
    }
    function hide() { cur.style.display = 'none'; tip.hidden = true; }
    svg.addEventListener('pointermove', function (e) { show(e.clientX); });
    svg.addEventListener('pointerleave', hide);
  })();
})();

/* 特別調査員カード → これまでの調査員リスト（トップページのみ） */
(function () {
  var trigger = document.getElementById('roleStar');
  var modal = document.getElementById('rosterModal');
  if (!trigger || !modal) return;
  function open() { modal.hidden = false; document.body.style.overflow = 'hidden'; }
  function close() { modal.hidden = true; document.body.style.overflow = ''; }
  trigger.addEventListener('click', open);
  trigger.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal || e.target.classList.contains('roster-modal__x')) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
})();

/* ラボカードの横スライダー（トップページのみ） */
(function () {
  var slider = document.querySelector('.why-slider');
  if (!slider) return;
  var track = slider.querySelector('.why-grid');
  var prev = slider.querySelector('.why-slider__btn--prev');
  var next = slider.querySelector('.why-slider__btn--next');
  function step() {
    var card = track.querySelector('.why-card');
    return card ? card.getBoundingClientRect().width + 22 : 340;
  }
  function update() {
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
  }
  prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
  next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
