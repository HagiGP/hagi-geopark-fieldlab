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

  const PIN={ temp:'#f4cf6b', hiyashi:'#4aa6ff', logger:'#c30d23', star:'#ff8a3d' };
  // 温度色分けランプ（青=冷 → 黄 → 橙=暖）。data-mode="heat" のとき使用
  const HEAT=['interpolate',['linear'],['get','temp'],
    15,'#2f6fb0', 21,'#3aa0c4', 25,'#66c6a0', 29,'#e2b84a', 33,'#d5651a'];

  function style(el){ const s={ version:8,
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
    // 調査地点（geojson）をスタイルに直接含める。load イベント待ちにしない（描画の取りこぼし防止）
    const url=el&&el.dataset.points;
    if(url){
      s.glyphs='https://glyphs.geolonia.com/{fontstack}/{range}.pbf';
      s.sources.pts={ type:'geojson', data:url };
      // 地点名ラベル（温度計・ロガー）。重なったら自動で間引く
      const labelLayer={ id:'pt-label', type:'symbol', source:'pts',
        filter:['any',['==',['get','type'],'temp'],['==',['get','type'],'logger']],
        layout:{ 'text-field':['coalesce',['get','label'],['get','id']],
          'text-font':['Noto Sans Regular'], 'text-size':10.5,
          'text-offset':[0,-1.0], 'text-anchor':'bottom', 'text-allow-overlap':false, 'text-optional':true },
        paint:{ 'text-color':'#2a2418', 'text-halo-color':'#f4ecd6', 'text-halo-width':1.6 } };
      const tempDot={ id:'pt-temp', type:'circle', source:'pts', filter:['==',['get','type'],'temp'], paint:{
        'circle-radius':2.7, 'circle-color':PIN.temp,
        'circle-stroke-color':'#0c1613','circle-stroke-width':1.2 } };
      // data-filter="N"|"S" のとき、id の頭文字がその地区の地点だけに絞る
      const area=el.dataset.filter;
      if(area){
        const areaExpr=['==',['slice',['get','id'],0,1],area];
        tempDot.filter=['all',tempDot.filter,areaExpr];
        labelLayer.filter=['all',labelLayer.filter,areaExpr];
      }
      if(el.dataset.only==='logger'){
        // ロガー位置マップ：ベース地図＋赤いロガー点＋地点名だけを表示
        s.layers.push({ id:'pt-logger', type:'circle', source:'pts', filter:['==',['get','type'],'logger'], paint:{
          'circle-radius':6, 'circle-color':PIN.logger,
          'circle-stroke-color':'#f4ecd6','circle-stroke-width':2 } });
        labelLayer.filter=['==',['get','type'],'logger'];
        labelLayer.layout['text-size']=12;
        s.layers.push(labelLayer);
      } else if(el.dataset.only==='frameOfHeat'){
        // 調査地マップ：外気温マップの初期表示範囲を四角枠で示す（範囲は init で外気温マップの実寸から設定）
        s.sources.vframe={ type:'geojson', data:{ type:'FeatureCollection', features:[] } };
        s.layers.push({ id:'pt-vframe', type:'line', source:'vframe',
          paint:{ 'line-color':'#b5641e', 'line-width':2.2, 'line-dasharray':[3,2], 'line-opacity':0.95 } });
      } else if(el.dataset.mode==='heat'){
        // 温度を持つ地点を、小さめ・輪郭を軽くぼかし・透明度高めで描く。隣り合う色がにじんでつながる
        s.layers.push({ id:'pt-heat', type:'circle', source:'pts', filter:area?['all',['has','temp'],['==',['slice',['get','id'],0,1],area]]:['has','temp'], paint:{
          'circle-radius':['interpolate',['linear'],['zoom'],14,11,17,24],
          'circle-color':HEAT,
          'circle-blur':0.6,
          'circle-opacity':0.5 } });
        // 温度計の点（小さめ）と地点名も表示
        s.layers.push(tempDot);
        s.layers.push(labelLayer);
      } else {
        // ヒヤシ：冷気がぼんやり広がる感じ（輪郭を少しぼかした青い光）。厳島神社奥も他と同じ扱い。最下層
        s.layers.push({ id:'pt-hiyashi', type:'circle', source:'pts', filter:['==',['get','type'],'hiyashi'], paint:{
          'circle-radius':['interpolate',['linear'],['zoom'],14,11,17,22],
          'circle-color':PIN.hiyashi,
          'circle-blur':0.55,
          'circle-opacity':0.6 } });
        // 温度計：くっきりした小さな点。ヒヤシより上に重ねる
        s.layers.push(tempDot);
        // ロガー：赤い点（受け皿。type=logger の地点を geojson に足すと表示）。最上
        s.layers.push({ id:'pt-logger', type:'circle', source:'pts', filter:['==',['get','type'],'logger'], paint:{
          'circle-radius':4.5, 'circle-color':PIN.logger,
          'circle-stroke-color':'#f4ecd6','circle-stroke-width':1.6 } });
        s.layers.push(labelLayer);
      }
    }
    return s;
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

  function init(el){
    const [lng,lat]=(el.dataset.center||'131.4,34.45').split(',').map(Number);
    const zoom=+(el.dataset.zoom||15.5);
    const mapDiv=document.createElement('div'); mapDiv.className='chartmap__canvas'; el.appendChild(mapDiv);
    deco(el);
    const frame=document.createElement('div'); frame.className='chartmap__frame'; el.appendChild(frame);
    const paper=document.createElement('div'); paper.className='chartmap__paper'; el.appendChild(paper);

    const map=new maplibregl.Map({ container:mapDiv, style:style(el),
      center:[lng,lat], zoom, minZoom:12, maxZoom:18, attributionControl:{compact:true} });
    map.addControl(new maplibregl.ScaleControl({maxWidth:120,unit:'metric'}),'bottom-left');
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');

    // aspect-ratio でコンテナ高さが確定した後にサイズを合わせる
    requestAnimationFrame(()=>map.resize());
    if(window.ResizeObserver){ new ResizeObserver(()=>map.resize()).observe(mapDiv); }
    el._map=map;
  }

  // 「調査地」マップの四角枠に、外気温マップの初期表示範囲（矩形）を流し込む
  function linkHeatFrame(){
    const heatEl=document.querySelector('.chartmap[data-mode="heat"]');
    const fieldEl=document.querySelector('.chartmap[data-only="frameOfHeat"]');
    if(!heatEl||!fieldEl||!heatEl._map||!fieldEl._map) return;
    const apply=()=>{
      const src=fieldEl._map.getSource('vframe'); if(!src) return;
      const b=heatEl._map.getBounds();
      const W=b.getWest(),E=b.getEast(),S=b.getSouth(),N=b.getNorth();
      src.setData({ type:'Feature', properties:{}, geometry:{ type:'Polygon',
        coordinates:[[[W,N],[E,N],[E,S],[W,S],[W,N]]] } });
    };
    requestAnimationFrame(()=>{ heatEl._map.resize(); fieldEl._map.resize(); apply(); });
    heatEl._map.once('idle', apply);
  }

  function boot(){ document.querySelectorAll('.chartmap').forEach(init); linkHeatFrame(); }
  if(document.readyState!=='loading') boot(); else document.addEventListener('DOMContentLoaded',boot);
})();
