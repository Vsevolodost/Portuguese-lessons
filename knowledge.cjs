const fs=require('node:fs'),path=require('node:path');
const tokenize=s=>s.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').match(/[\p{L}\p{N}]+/gu)||[];
let corpus;
function searchKnowledge(query,language='pt-BR',limit=5){
 if(!corpus){const file=path.join(__dirname,'knowledge','chunks.jsonl');if(!fs.existsSync(file))return {available:false,results:[]};corpus=fs.readFileSync(file,'utf8').trim().split('\n').filter(Boolean).map(x=>JSON.parse(x)).filter(c=>c.policy!=='review-required').map(c=>({...c,tokens:tokenize(c.title+' '+c.text)}))}
 const docs=corpus.filter(c=>c.language===language),terms=[...new Set(tokenize(query))],avg=docs.reduce((n,c)=>n+c.tokens.length,0)/(docs.length||1);
 const df=Object.fromEntries(terms.map(t=>[t,docs.filter(c=>c.tokens.includes(t)).length]));
 const results=docs.map(c=>{let score=0;for(const t of terms){const tf=c.tokens.filter(w=>w===t).length;score+=Math.log(1+(docs.length-df[t]+.5)/(df[t]+.5))*tf*2.2/(tf+1.2*(.25+.75*c.tokens.length/(avg||1)))}const {tokens,...result}=c;return {...result,score}}).filter(c=>c.score>0).sort((a,b)=>b.score-a.score).slice(0,Math.min(10,Math.max(1,limit)));
 return {available:true,query,language,method:'BM25',results};
}
module.exports={searchKnowledge};
