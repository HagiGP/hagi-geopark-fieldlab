/* 海図風マップ 共通部品
   使い方：<div class="chartmap" data-center="131.399,34.4592" data-zoom="16"
             data-points="../../data/xxx.geojson"（任意）></div>
   MapLibre と地理院ベクトルタイルで描き、地物の形は地理院データのまま、
   装飾（羊皮紙色・方位線・コンパス・枠）だけを上に重ねる。 */
(function(){
  if(!window.maplibregl){ console.warn('maplibre 未読込'); return; }
  const GSI='https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf';
  const ATTR="<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank' rel='noopener'>地理院タイル（ベクトル）</a>を加工して作成";
  const C={ paper:'#f4ecd6', sea:'#c7dbdb', ink:'#4a3f28', contour:'#b08d57', depth:'#6f9ba4',
            bldg:'#e3d4ab', bldgLine:'#a4906180', road:'#fffaee', roadLine:'#b09d70' };
  const ft=(...c)=>["in",["get","ftCode"],["literal",c]];

  function style(){ return { version:8,
    sources:{ gsi:{ type:'vector', tiles:[GSI], minzoom:4, maxzoom:16, attribution:ATTR } },
    layers:[
      { id:'bg', type:'background', paint:{'background-color':C.paper} },
      { id:'water', type:'fill', source:'gsi','source-layer':'waterarea', filter:ft(55000,5000), paint:{'fill-color':C.sea} },
      { id:'depth', type:'line', source:'gsi','source-layer':'contour', filter:ft(7371,7373),
        paint:{'line-color':C.depth,'line-width':0.6,'line-opacity':0.85} },
      { id:'contour-aux', type:'line', source:'gsi','source-layer':'contour',
        filter:["all",ft(7351,7353),["==",["get","altiFlag"],2]],
        paint:{'line-color':C.contour,'line-width':0.5,'line-dasharray':[6,3],'line-opacity':0.6} },
      { id:'contour-main', type:'line', source:'gsi','source-layer':'contour',
        filter:["all",ft(7351,7353),["==",["get","altiFlag"],1]],
        paint:{'line-color':C.contour,'line-width':0.55,'line-opacity':0.75} },
      { id:'contour-index', type:'line', source:'gsi','source-layer':'contour',
        filter:["all",ft(7351,7353),["==",["get","altiFlag"],0]],
        paint:{'line-color':C.contour,'line-width':1.15,'line-opacity':0.95} },
      { id:'road-case', type:'line', source:'gsi','source-layer':'road',
        paint:{'line-color':C.roadLine,'line-width':['interpolate',['linear'],['zoom'],13,0.8,17,5.2]} },
      { id:'road-fill', type:'line', source:'gsi','source-layer':'road',
        paint:{'line-color':C.road,'line-width':['interpolate',['linear'],['zoom'],13,0.3,17,3.4]} },
      { id:'bldg', type:'fill', source:'gsi','source-layer':'building',
        filter:["==",["geometry-type"],"Polygon"], paint:{'fill-color':C.bldg,'fill-outline-color':C.bldgLine} },
      { id:'coast', type:'line', source:'gsi','source-layer':'coastline', filter:ft(55101,5101),
        paint:{'line-color':C.ink,'line-width':1.3} },
    ]};
  }

  // コンパスローズ＋方位線を SVG で重ねる
  function deco(el){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','chartmap__deco'); svg.setAttribute('viewBox','0 0 1000 640');
    svg.setAttribute('preserveAspectRatio','none');
    const cx=640,cy=300,R=780,N=16; let s='';
    for(let i=0;i<N;i++){const a=i*2*Math.PI/N;
      s+=`<line x1="${cx}" y1="${cy}" x2="${(cx+Math.cos(a)*R).toFixed(1)}" y2="${(cy+Math.sin(a)*R).toFixed(1)}" stroke="${C.contour}" stroke-width=".6" stroke-opacity=".45"/>`;}
    s+=`<circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="${C.contour}" stroke-width=".7" stroke-opacity=".45"/>`;
    const rx=118,ry=136,r=50;
    s+=`<circle cx="${rx}" cy="${ry}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="1" stroke-opacity=".55"/>`;
    s+=`<circle cx="${rx}" cy="${ry}" r="${r*0.62}" fill="none" stroke="${C.ink}" stroke-width=".6" stroke-opacity=".4"/>`;
    for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,L=(i%2?r*0.55:r);
      const x1=rx+Math.cos(a-0.12)*r*0.16,y1=ry+Math.sin(a-0.12)*r*0.16;
      const x2=rx+Math.cos(a)*L,y2=ry+Math.sin(a)*L;
      const x3=rx+Math.cos(a+0.12)*r*0.16,y3=ry+Math.sin(a+0.12)*r*0.16;
      s+=`<path d="M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} L${x3.toFixed(1)},${y3.toFixed(1)} Z" fill="${i%2?C.contour:C.ink}" fill-opacity="${i%2?.35:.6}"/>`;}
    s+=`<text x="${rx}" y="${ry-r-7}" text-anchor="middle" font-family="Zen Kaku Gothic New, sans-serif" font-size="15" fill="${C.ink}" fill-opacity=".7">N</text>`;
    svg.innerHTML=s; el.appendChild(svg);
  }

  const PIN={ temp:'#f4cf6b', hiyashi:'#4aa6ff', logger:'#c30d23', star:'#ff8a3d' };

  function init(el){
    const [lng,lat]=(el.dataset.center||'131.4,34.45').split(',').map(Number);
    const zoom=+(el.dataset.zoom||15.5);
    const mapDiv=document.createElement('div'); mapDiv.className='chartmap__canvas'; el.appendChild(mapDiv);
    deco(el);
    const frame=document.createElement('div'); frame.className='chartmap__frame'; el.appendChild(frame);
    const paper=document.createElement('div'); paper.className='chartmap__paper'; el.appendChild(paper);

    const map=new maplibregl.Map({ container:mapDiv, style:style(),
      center:[lng,lat], zoom, minZoom:12, maxZoom:18, attributionControl:{compact:true} });
    map.addControl(new maplibregl.ScaleControl({maxWidth:120,unit:'metric'}),'bottom-left');
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');

    function addPoints(){
      const url=el.dataset.points; if(!url || map.getSource('pts')) return;
      fetch(url).then(r=>r.json()).then(gj=>{
        if(map.getSource('pts'))return;
        map.addSource('pts',{type:'geojson',data:gj});
        map.addLayer({id:'pt',type:'circle',source:'pts',paint:{
          'circle-radius':['match',['get','type'],'star',8,6],
          'circle-color':['match',['get','type'],'temp',PIN.temp,'hiyashi',PIN.hiyashi,'logger',PIN.logger,'star',PIN.star,'#f00'],
          'circle-stroke-color':'#0c1613','circle-stroke-width':1.6,'circle-opacity':0.95}});
      }).catch(e=>console.warn('points 読込失敗',e));
    }
    map.on('load',addPoints);
    const iv=setInterval(()=>{ if(map.isStyleLoaded()){ addPoints(); clearInterval(iv); } },300);
    // aspect-ratio でコンテナ高さが確定した後にサイズを合わせる
    requestAnimationFrame(()=>map.resize());
    if(window.ResizeObserver){ new ResizeObserver(()=>map.resize()).observe(mapDiv); }
    el._map=map;
  }

  function boot(){ document.querySelectorAll('.chartmap').forEach(init); }
  if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
