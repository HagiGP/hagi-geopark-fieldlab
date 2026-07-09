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
})();
