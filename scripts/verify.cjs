'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'..'),db=JSON.parse(fs.readFileSync(process.env.MATCHUP_CATALOGUE||path.join(root,'data/catalogue.json')));const {createEngine,createTypeChart}=require('../engine.cjs'),M=require('../model.js'),{Battle}=require(path.join(process.env.MATCHUP_ENGINE||path.join(root,'vendor/showdown'),'dist/sim')),calc=require('@smogon/calc');const e=createEngine(db,process.env.MATCHUP_ENGINE),checks=[];
function test(name,fn){fn();checks.push(name);}
function set(id,over={}){const p=db.pokemon.find(p=>p.id===id);if(!p)throw Error('Unknown test ID '+id);const s={...structuredClone(p.sets[0]),pokemon:id,mods:{},...over};if(!s.moves.includes(s.move))s.moves=[s.move,...s.moves].slice(0,4);return s;}
const a=set('kingambit',{item:'Life Orb',move:'Kowtow Cleave'}),d=set('mega-metagross');
test('262 official roster entries, no unmapped eligibility',()=>{assert.equal(db.metadata.officialCount,262);assert.equal(db.metadata.coverage.missingEligibility.length,0);});
test('All form suggestions pass SP, ability, item and move validation',()=>{for(const p of db.pokemon)for(const f of ['Doubles','Singles'])for(const s of p.setsByFormat[f])e.validate({...s,pokemon:p.id});});
test('All 352 forms × 25 natures match simulator stat formula',()=>{const b=new Battle({formatid:'gen9championscustomgame'});try{for(const p of db.pokemon)for(const nature of Object.keys(M.natures)){const sp={hp:2,atk:32,def:0,spa:0,spd:0,spe:32};const got=b.spreadModify(p.base,{nature,evs:sp,level:50});assert.deepEqual(M.stats(p,{nature,sp}),got,`${p.name} ${nature}`);}}finally{b.destroy();}});
test('Standard mechanics: all 16 Life Orb/STAB/type rolls equal independent @smogon/calc',()=>{const gen=calc.Generations.get(9);const toCalc=s=>{const p=db.pokemon.find(p=>p.id===s.pokemon);return new calc.Pokemon(gen,p.dexName,{level:50,nature:s.nature,item:s.item==='None'?'':s.item,ability:s.ability,evs:Object.fromEntries(M.keys.map(k=>[k,s.sp[k]?8*s.sp[k]-4:0])),overrides:{baseStats:p.base,types:p.types}});};const r=calc.calculate(gen,toCalc(a),toCalc(d),new calc.Move(gen,a.move),new calc.Field({gameType:'Singles'}));assert.deepEqual(e.damage(a,d,{format:'Singles'}).rolls,r.damage);});
test('Exact KO probability counts duplicated outcomes separately',()=>{const r=e.damage(a,d,{format:'Singles'});assert.equal(r.koRolls,13);assert.equal(r.koChancePct,81.25);assert.equal(r.rolls.length,16);assert.equal(r.remaining.filter(h=>h<=0).length,13);});
test('SP 32/stat and 66 total validation',()=>{assert.throws(()=>e.validate({...a,sp:{hp:32,atk:32,def:32,spa:0,spd:0,spe:0}}),/66/);assert.throws(()=>e.validate({...a,sp:{...a.sp,atk:33}}),/SP/);});
test('Focus Sash prevents a one-hit KO at full HP; low HP disables it',()=>{const t=set('alakazam',{item:'Focus Sash',ability:'Magic Guard',sp:{hp:0,atk:0,def:0,spa:32,spd:2,spe:32}});assert.equal(e.damage(a,t,{format:'Singles'}).koChancePct,0);assert.equal(e.damage(a,t,{format:'Singles',hp:90}).koChancePct,100);});
test('Sitrus Berry cannot rescue a lethal single hit',()=>{const t=set('alakazam',{item:'Sitrus Berry',ability:'Magic Guard',sp:{hp:0,atk:0,def:0,spa:32,spd:2,spe:32}});assert.equal(e.damage(a,t,{format:'Singles'}).koChancePct,100);});
test('Mega Garchomp Z: Dragon, Levitate, 151 base Speed and ground immunity',()=>{const p=db.pokemon.find(p=>p.id==='mega-garchomp-z');assert.deepEqual(p.types,['Dragon']);assert.deepEqual(p.abilities,['Levitate']);assert.equal(p.base.spe,151);const t=set(p.id);const source=set('garchomp',{move:'Earthquake'});assert.equal(e.damage(source,t,{format:'Singles'}).max,0);});
test('Row-specific Incineroar Intimidate lowers Mega Garchomp Attack and incoming damage',()=>{
 const selected=set('mega-garchomp-z'),threat=set('mega-garchomp',{id:'threat',nature:'Adamant',move:'Dragon Claw'}),ownSet=set('incineroar',{move:'Flare Blitz'});
 const scenario={selected,threats:[{...threat,ownSet}],speeds:[],format:'Doubles',conditions:{hp:100},columns:false,trick:false};
 const intimidated=e.calculate(scenario).threats.threat;
 const disabled=e.calculate({...scenario,threats:[{...threat,ownSet,triggerAbility:false}]}).threats.threat;
 const blaze=e.calculate({...scenario,threats:[{...threat,ownSet:{...ownSet,ability:'Blaze'}}]}).threats.threat;
 assert.equal(intimidated.state.attackerBoosts.atk,-1);
 assert.equal(disabled.state.attackerBoosts.atk,0);
 assert.equal(blaze.state.attackerBoosts.atk,0);
 assert.deepEqual(disabled.rolls,blaze.rolls);
 assert(intimidated.max<blaze.min);
 const other={...structuredClone(threat),id:'other',ownSet:set('mega-salamence')};
 const twoOn=e.calculate({...scenario,threats:[scenario.threats[0],other]}),twoOff=e.calculate({...scenario,threats:[{...threat,ownSet,triggerAbility:false},other]});
 assert.deepEqual(twoOn.threats.other.rolls,twoOff.threats.other.rolls);
});
test('Threat editor preview keeps manual Attack separate from Intimidate',()=>{
 const threat=set('mega-garchomp',{nature:'Adamant'}),own=set('incineroar');
 assert.equal(e.preview(threat,{format:'Doubles'},own).boosts.atk,-1);
 assert.equal(e.preview(threat,{format:'Doubles',suppressIntimidateSide:'target'},own).boosts.atk,0);
 assert.equal(e.preview(threat,{format:'Doubles'},{...own,ability:'Blaze'}).boosts.atk,0);
 assert.equal(e.preview({...threat,mods:{stages:{atk:1}}},{format:'Doubles'},own).boosts.atk,0);
});
test('Doubles spread penalty uses actual multiple targets',()=>{const source=set('garchomp',{move:'Earthquake'});const singles=e.damage(source,d,{format:'Singles'});const spread=e.damage(source,d,{format:'Doubles',targets:2});const one=e.damage(source,d,{format:'Doubles',targets:1});assert.ok(spread.max<singles.max);assert.deepEqual(one.rolls,singles.rolls);});
test('Priority wins before Trick Room speed inversion',()=>{const slow=set('incineroar',{move:'Fake Out'}),fast=set('mega-metagross',{move:'Psychic Fangs'});for(const trick of [false,true])assert.equal(e.speedPair(fast,slow,{trick}).order,'before');});
test('Trick Room inversion and ties remain explicit',()=>{const t=set('torkoal');assert.equal(e.speedPair(d,t,{trick:false}).order,'after');assert.equal(e.speedPair(d,t,{trick:true}).order,'before');assert.equal(e.speedPair(d,d,{trick:true}).order,'tie');});
test('Scarf, Tailwind and paralysis use engine rounding',()=>{const g=set('garchomp',{nature:'Jolly',item:'Choice Scarf',sp:{hp:2,atk:32,def:0,spa:0,spd:0,spe:32}});assert.equal(e.speedPair(g,d,{format:'Singles'}).you.speed,253);g.mods.tailwind=true;assert.equal(e.speedPair(g,d,{format:'Singles'}).you.speed,507);g.mods.status='par';assert.equal(e.speedPair(g,d,{format:'Singles'}).you.speed,253);});
test('Mega Stone restrictions enforce no Scarf',()=>assert.throws(()=>e.validate({...d,item:'Choice Scarf'}),/requires/));
test('New Mega Staraptor Contrary boosts instead of lowering defenses',()=>{const source=set('mega-staraptor',{move:'Close Combat'});assert.equal(source.ability,'Contrary');const r=e.damage(source,d,{format:'Singles'});assert.equal(r.state.attackerBoosts.def,1);assert.equal(r.state.attackerBoosts.spd,1);});
test('Multi-hit and unmodeled turn-history gaps suppress numeric KO',()=>{const g=set('kingambit',{move:'Assurance'});assert.equal(e.damage(g,d,{}).supported,false);const m=set('maushold-four',{move:'Population Bomb'});assert.equal(e.damage(m,d,{}).supported,false);});
test('Doubles single-target Shadow Ball hits the compared Metagross, not a neutral partner',()=>{
 const source=set('gholdengo',{move:'Shadow Ball',item:'Life Orb'});
 const single=e.damage(source,d,{format:'Singles'}),double=e.damage(source,d,{format:'Doubles'});
 assert(double.min>0);assert.deepEqual(double.rolls,single.rolls);assert.equal(double.koChancePct,100);
});
test('Sucker Punch calculates successful-hit damage and labels the required target action',()=>{
 const source=set('kingambit',{move:'Sucker Punch',item:'Black Glasses'}),r=e.damage(source,d,{format:'Doubles'});
 assert.equal(r.supported,true);assert(r.min>0);assert.equal(r.rolls.length,16);assert.match(r.notes[0],/target has not acted/);
});
test('Psychic Terrain names the priority block in the current Metagross matchup',()=>{
 const source=set('kingambit',{move:'Sucker Punch',item:'Black Glasses',nature:'Hardy',sp:{hp:32,atk:32,def:0,spa:0,spd:0,spe:2}});
 const target=set('metagross',{nature:'Hardy',item:'None',ability:'Clear Body',sp:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0},move:'Psychic Fangs',moves:['Psychic Fangs','Protect','Steel Roller','Iron Head']});
 const blocked=e.damage(source,target,{format:'Doubles',terrain:'Psychic'}),clear=e.damage(source,target,{format:'Doubles',terrain:'None'});
 assert.equal(blocked.supported,true);assert.deepEqual(blocked.rolls,Array(16).fill(0));assert.match(blocked.blockReason,/Psychic Terrain blocks priority/);
 assert.equal(clear.blockReason,'');assert.equal(clear.min,120);assert.equal(clear.max,144);
});
test('Independent Attack and Sp. Atk stages affect only the matching damage category',()=>{
 const source=set('gholdengo',{move:'Shadow Ball',item:'Life Orb'}),normal=e.damage(source,d,{format:'Singles'});
 const atk=e.damage({...source,mods:{stages:{atk:2}}},d,{format:'Singles'}),spa=e.damage({...source,mods:{stages:{spa:2}}},d,{format:'Singles'});
 assert.deepEqual(atk.rolls,normal.rolls);assert(spa.min>normal.max);
});
test('Independent Defense and Sp. Def stages protect against the matching category',()=>{
 const source=set('gholdengo',{move:'Shadow Ball'}),normal=e.damage(source,d,{format:'Singles'});
 assert.deepEqual(e.damage(source,{...d,mods:{stages:{def:2}}},{format:'Singles'}).rolls,normal.rolls);
 assert(e.damage(source,{...d,mods:{stages:{spd:2}}},{format:'Singles'}).max<normal.min);
});
test('Aurora Veil reduces both categories and does not stack with the matching screen',()=>{
 for(const source of [a,set('gholdengo',{move:'Shadow Ball'})])for(const format of ['Singles','Doubles']){
 const plain=e.damage(source,d,{format}),veil=e.damage(source,d,{format,auroraVeil:true}),
 screen=e.damage(source,d,{format,[source===a?'reflect':'lightScreen']:true}),
 both=e.damage(source,d,{format,auroraVeil:true,[source===a?'reflect':'lightScreen']:true});
 assert(veil.max<plain.max);assert.deepEqual(veil.rolls,screen.rolls);assert.deepEqual(both.rolls,screen.rolls);
 }
});
test('Screens reduce damage more in Singles than Doubles; critical hits bypass screens',()=>{
 const source=set('gholdengo',{move:'Shadow Ball'});
 assert(e.damage(source,d,{format:'Singles',lightScreen:true}).max<e.damage(source,d,{format:'Doubles',lightScreen:true}).max);
 assert.deepEqual(e.damage(source,d,{format:'Singles',lightScreen:true,critical:'on'}).rolls,e.damage(source,d,{format:'Singles',critical:'on'}).rolls);
});
test('Helping Hand applies only with a Doubles ally',()=>{
 assert.deepEqual(e.damage(a,d,{format:'Singles',helpingHand:true}).rolls,e.damage(a,d,{format:'Singles'}).rolls);
 assert(e.damage(a,d,{format:'Doubles',helpingHand:true}).min>e.damage(a,d,{format:'Doubles'}).max);
});
test('Outgoing damage uses threat HP and side screens rather than the player screens',()=>{
 const selected={...a,id:'you'},target={...d,id:'threat',mods:{hp:50}};
 const state={selected,threats:[target],speeds:[],format:'Singles',conditions:{hp:100,reflect:true},columns:false,trick:false},r=e.calculate(state);
 assert.deepEqual(r.outgoing.threat.rolls,e.damage(selected,target,{format:'Singles',hp:50}).rolls);
 assert.equal(r.outgoing.threat.current,Math.floor(r.outgoing.threat.totalHP/2));
});
test('Shadow Ball and successful Sucker Punch agree with independent 16-roll calculations',()=>{
 const gen=calc.Generations.get(9),toCalc=s=>{const p=db.pokemon.find(p=>p.id===s.pokemon);return new calc.Pokemon(gen,p.dexName,{level:50,nature:s.nature,item:s.item==='None'?'':s.item,ability:s.ability,evs:Object.fromEntries(M.keys.map(k=>[k,s.sp[k]?8*s.sp[k]-4:0])),overrides:{baseStats:p.base,types:p.types}});};
 for(const source of [set('kingambit',{move:'Sucker Punch',item:'Black Glasses'}),set('gholdengo',{move:'Shadow Ball',item:'Life Orb'})]){
 const expected=calc.calculate(gen,toCalc(source),toCalc(d),new calc.Move(gen,source.move),new calc.Field({gameType:'Doubles'})).damage;
 assert.deepEqual(e.damage(source,d,{format:'Doubles'}).rolls,expected);
 }
});
test('Outgoing low-HP ability thresholds use the player current HP',()=>{
 const source={...set('incineroar',{move:'Flare Blitz',ability:'Blaze'}),id:'you'},target={...d,id:'threat'};
 const state={selected:source,threats:[target],speeds:[],format:'Singles',conditions:{hp:25},columns:false,trick:false},r=e.calculate(state);
 assert.deepEqual(r.outgoing.threat.rolls,e.damage(source,target,{format:'Singles',hp:100,attackerHP:25}).rolls);
 assert(r.outgoing.threat.min>e.damage(source,target,{format:'Singles',attackerHP:100}).max);
});
test('Stomping Tantrum uses normal first-use power and matches independent damage rolls',()=>{
 const source=set('mega-metagross',{move:'Stomping Tantrum'}),target=set('gholdengo'),gen=calc.Generations.get(9);
 const toCalc=s=>{const p=db.pokemon.find(p=>p.id===s.pokemon);return new calc.Pokemon(gen,p.dexName,{level:50,nature:s.nature,item:s.item==='None'?'':s.item,ability:s.ability,evs:Object.fromEntries(M.keys.map(k=>[k,s.sp[k]?8*s.sp[k]-4:0])),overrides:{baseStats:p.base,types:p.types}});};
 const r=e.damage(source,target,{format:'Doubles'}),expected=calc.calculate(gen,toCalc(source),toCalc(target),new calc.Move(gen,'Stomping Tantrum'),new calc.Field({gameType:'Doubles'}));
 assert.equal(r.supported,true);assert(r.min>0);assert.deepEqual(r.rolls,expected.damage);assert.match(r.notes[0],/normal 75 base power/);assert.match(r.notes[0],/previous move failed/);
});
test('Row-specific outgoing moves and opponent screens affect only their own damage checks',()=>{
 const selected=set('mega-metagross',{move:'Psychic Fangs',moves:['Psychic Fangs','Iron Head','Protect']}),target=set('garchomp',{id:'first'}),second={...structuredClone(target),id:'second',outgoingMove:'Iron Head'};
 const base={format:'Doubles',selected,threats:[target,second],speeds:[],conditions:{hp:100,opponentReflect:false}};
 const plain=e.calculate(base),screened=e.calculate({...base,conditions:{hp:100,opponentReflect:true}});
 assert.deepEqual(plain.outgoing.first.rolls,screened.outgoing.first.rolls);
 assert(screened.outgoing.second.max<plain.outgoing.second.min);
 assert.deepEqual(plain.outgoing.second.rolls,e.damage({...selected,move:'Iron Head'},second,{format:'Doubles',hp:100,attackerHP:100}).rolls);
});
test('A row-specific Pokémon changes only that damage comparison',()=>{
 const selected=set('mega-garchomp-z',{nature:'Modest',move:'Dragon Pulse',sp:{hp:0,atk:0,def:0,spa:32,spd:32,spe:2}});
 const threat=set('mega-garchomp-z',{id:'first',move:'Dragon Pulse'}),second={...structuredClone(threat),id:'second'};
 const base={format:'Doubles',selected,threats:[threat,second],speeds:[],conditions:{hp:100}};
 const original=e.calculate(base);
 second.ownSet=set('mega-salamence',{move:'Dragon Claw'});
 const changed=e.calculate(base);
 assert.deepEqual(changed.threats.first.rolls,original.threats.first.rolls);
 assert.deepEqual(changed.outgoing.first.rolls,original.outgoing.first.rolls);
 assert.notDeepEqual(changed.threats.second.rolls,original.threats.second.rolls);
 assert.notDeepEqual(changed.outgoing.second.rolls,original.outgoing.second.rolls);
 assert.deepEqual(base.selected,selected);
});
test('Mega Garchomp Z Dragon Pulse differs by target Sp. Def spread',()=>{
 const selected=set('mega-garchomp-z',{nature:'Modest',move:'Dragon Pulse',sp:{hp:0,atk:0,def:0,spa:32,spd:0,spe:32}});
 const calm=set('mega-garchomp-z',{nature:'Calm',sp:{hp:0,atk:0,def:0,spa:32,spd:32,spe:0}});
 const modest=set('mega-garchomp-z',{nature:'Modest',sp:{hp:0,atk:0,def:0,spa:32,spd:0,spe:32}});
 const protectedTarget=e.damage(selected,calm,{format:'Doubles'}),fastTarget=e.damage(selected,modest,{format:'Doubles'});
 assert.deepEqual([protectedTarget.min,protectedTarget.max,protectedTarget.koChancePct],[134,162,0]);
 assert.deepEqual([fastTarget.min,fastTarget.max,fastTarget.koChancePct],[194,230,100]);
});
test('Popular threat filter uses legal top-five moves and selected form typing',()=>{
 const chart=createTypeChart(db,e.dex),choices=M.popularOpponents(db,'metagross','Doubles',true,chart,100);
 assert.equal(choices.find(({p})=>p.id==='salamence').advantage.name,'Flamethrower');
 assert.equal(choices.find(({p})=>p.id==='salamence').advantage.multiplier,2);
 assert.equal(choices.find(({p})=>p.id==='dragonite').advantage.name,'Heat Wave');
 assert(!choices.some(({p})=>p.id==='sylveon'));
 assert.equal(M.popularOpponents(db,'metagross','Doubles',true,chart).length,20);
 assert.equal(M.typeMultiplier('Fire',['Grass','Ice'],chart),4);
 assert.equal(M.typeMultiplier('Ground',['Flying'],chart),0);
});
const result={at:new Date().toISOString(),engine:db.metadata.engine.commit,forms:db.pokemon.length,passed:checks.length,checks};if(!process.env.MATCHUP_ENGINE)fs.writeFileSync(path.join(root,'verification-real.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
