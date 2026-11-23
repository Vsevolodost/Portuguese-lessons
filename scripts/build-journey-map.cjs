const fs=require('node:fs');
const feature=JSON.parse(fs.readFileSync('assets-source/brazil-natural-earth.geojson','utf8'));
// A small, fixed equirectangular projection; no map tiles, tokens or location requests.
const project=([lon,lat])=>[+(40+(lon+74)/46*520).toFixed(2),+(40+(6-lat)/40*520).toFixed(2)];
const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
const path=polygons.flatMap(p=>p.map(r=>r.map((c,i)=>(i?'L':'M')+project(c).join(' ')).join(' ')+'Z')).join(' ');
const places={oi:[-43.17,-22.91],nome:[-38.50,-12.97],origem:[-46.63,-23.55],estar:[-47.88,-15.79],artigos:[-43.50,-20.39],nao:[-44.71,-23.22],ter:[-34.88,-8.05],familia:[-34.85,-8.01],rotina:[-49.27,-25.43],gostar:[-48.55,-27.60],numeros:[-54.59,-25.55],horas:[-38.54,-3.73],cafe:[-48.49,-1.45],compras:[-60.02,-3.12],onde:[-62,-4],poder:[-56.5,-18.5],saude:[-43.1,-2.5],telefone:[-40.51,-2.79],amanha:[-41.37,-12.56],ontem:[-56.48,-21.13],passado:[-32.42,-3.85],imperfeito:[-39,-14.28],comparar:[-50.87,-29.38],condicional:[-43.17,-22.51],conectores:[-38,-12.57],opiniao:[-44.17,-21.11],subjuntivo:[-44.17,-23.14],email:[-35,-8.51],resumo:[-49.55,-28.4],conversa:[-43.10,-22.88]};
for(const [id,alias]of Object.entries({bem:'cafe',voce:'familia',saudacoes:'horas',chama:'telefone',repetir:'poder','primeiro-dialogo':'conversa'}))places[id]=places[alias];
const data={version:1,source:'Natural Earth — public domain',sourceUrl:'https://www.naturalearthdata.com/about/terms-of-use/',path,places:Object.fromEntries(Object.entries(places).map(([id,coords])=>[id,{coordinates:coords,point:project(coords)}]))};
fs.writeFileSync('dist/journey-map-data.js','// Brazil outline: Natural Earth (public domain). Places are approximate study-location anchors.\nwindow.BoraMapData='+JSON.stringify(data)+';\n');
console.log('Built Brazil map for',Object.keys(places).length,'lesson locations');
