'use strict';
const fs=require('node:fs'),path=require('node:path');
// Only transformed current move marginals are retained, with one bounded cache entry per species/format.
function createUsageStore(file,fetcher=fetch){
 let cache={};try{cache=JSON.parse(fs.readFileSync(file));}catch{}
 const pending=new Map();
 async function get(p,format,snapshot){
  if(!['Singles','Doubles'].includes(format))throw Error('Choose Singles or Doubles.');
  const scope=p.usage?.[format]?.scope;if(!scope)return {scope:p.name,format,moves:{},unavailable:true};
  const key=format+':'+scope,old=cache[key];
  if(old&&old.snapshot===snapshot&&Date.now()-new Date(old.fetchedAt).getTime()<86400000)return old;
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{try{
   const response=await fetcher('https://championsbattledata.com/api/battle/'+format+'/'+encodeURIComponent(scope.toLowerCase().replace(/[^a-z0-9]/g,'')),{headers:{'User-Agent':'MatchupLab-local/1.0 (personal comparison tool)'},signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('Move usage source unavailable.');const data=await response.json();
   if(!Array.isArray(data.rows)||data.format!==format)throw Error('Move usage schema changed.');
   const rows=data.rows.filter(r=>r.category==='move');if(!rows.length)throw Error('No move usage supplied.');
   const moves={};for(const r of rows){const value=r.percentage_value??Number(String(r.percentage||'').replace('%',''));if(!r.name||!r.percentage||!Number.isFinite(value)||value<0||value>100)continue;moves[r.name]=value.toFixed(1)+'%';}
   if(!Object.keys(moves).length)throw Error('Move usage percentages missing.');
   const result={scope:data.pokemon||scope,format,source:'https://championsbattledata.com/api_guide',fetchedAt:new Date().toISOString(),snapshot,moves};
   const candidate={...cache,[key]:result};fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(candidate));fs.renameSync(file+'.tmp',file);cache=candidate;return result;
  }catch(error){if(old)return {...old,stale:true};return {scope,format,moves:{},unavailable:true};}finally{pending.delete(key);}})();
  pending.set(key,task);return task;
 }
 return {get};
}
module.exports={createUsageStore};
