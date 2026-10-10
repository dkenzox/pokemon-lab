/* Champions level-50 stats only. Damage and action order are calculated by the pinned server engine. */
(function(root){
const keys=['hp','atk','def','spa','spd','spe'];
const natures={Hardy:[null,null],Lonely:['atk','def'],Brave:['atk','spe'],Adamant:['atk','spa'],Naughty:['atk','spd'],Bold:['def','atk'],Docile:[null,null],Relaxed:['def','spe'],Impish:['def','spa'],Lax:['def','spd'],Timid:['spe','atk'],Hasty:['spe','def'],Serious:[null,null],Jolly:['spe','spa'],Naive:['spe','spd'],Modest:['spa','atk'],Mild:['spa','def'],Quiet:['spa','spe'],Bashful:[null,null],Rash:['spa','spd'],Calm:['spd','atk'],Gentle:['spd','def'],Sassy:['spd','spe'],Careful:['spd','spa'],Quirky:[null,null]};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number(v)||0));
function stats(mon,set){const n=natures[set.nature]||natures.Hardy;return Object.fromEntries(keys.map(k=>{let v=mon.base[k]+set.sp[k]+(k==='hp'?75:20);if(k!=='hp')v=Math.floor(v*(n[0]===k?110:n[1]===k?90:100)/100);return [k,v];}));}
const total=s=>keys.reduce((n,k)=>n+Number(s.sp[k]||0),0);
function typeMultiplier(moveType,targetTypes,chart){return targetTypes.reduce((value,type)=>value*(chart[moveType]?.[type]??1),1);}
function popularOpponents(db,selectedId,format,advantageOnly,chart,limit=20){
 const selected=db.pokemon.find(p=>p.id===selectedId);
 if(!selected)return [];
 const families=new Map();
 for(const p of db.pokemon){
  const rank=Number(p.usage?.[format]?.rank);
  if(!Number.isFinite(rank)||rank<1)continue;
  const previous=families.get(p.family);
  const preferred=!!(p.id===p.family||(!p.megaStone&&!p.battleForm));
  if(!previous||preferred&&!previous.preferred)families.set(p.family,{p,rank,preferred});
 }
 return [...families.values()].map(({p,rank})=>{
  const advantage=(p.usage?.[format]?.values?.move||[]).slice(0,5).map((name,index)=>{
   const move=db.moves[name];
   if(!move||move.category==='Status'||Number(move.power)<=0||!p.learnset.includes(name))return null;
   return {name,type:move.type,multiplier:typeMultiplier(move.type,selected.types,chart),rank:index+1};
  }).filter(move=>move?.multiplier>=2).sort((a,b)=>b.multiplier-a.multiplier||a.rank-b.rank)[0]||null;
  return {p,rank,advantage};
 }).filter(entry=>!advantageOnly||entry.advantage).sort((a,b)=>a.rank-b.rank||a.p.name.localeCompare(b.p.name)).slice(0,limit);
}
const api={keys,natures,clamp,stats,total,typeMultiplier,popularOpponents};if(typeof module!=='undefined')module.exports=api;root.MatchupModel=api;
})(typeof window!=='undefined'?window:globalThis);
