'use strict';
// GitHub Pages keeps personal data in this browser; only calculations use the API.
const MatchupWeb = (() => {
  const hosted = location.hostname.endsWith('.github.io') || new URLSearchParams(location.search).has('pages-test');
  const apiBase = hosted ? (localStorage.getItem('matchup-lab-api-url') || 'https://pokemon-lab-api.onrender.com') : '';
  const key = 'matchup-lab-pages-v1';
  const read = () => {
    try { return JSON.parse(localStorage.getItem(key)) || {scenarios:[],sets:[],activeId:null,deleted:{}}; }
    catch { return {scenarios:[],sets:[],activeId:null,deleted:{}}; }
  };
  const write = value => { localStorage.setItem(key, JSON.stringify(value)); return value; };
  const snapshot = value => ({scenarios:value.scenarios,sets:value.sets,activeId:value.activeId,storage:'Browser'});
  const record = (name,state) => ({id:crypto.randomUUID(),name,state,revision:1,updated_at:new Date().toISOString()});
  function localPost(url,data) {
    const db=read(); let entry,index;
    switch(url) {
      case '/api/workspace/migrate':
        if(!db.scenarios.length&&data.state){entry=record('Imported workspace',data.state);db.scenarios=[entry];db.activeId=entry.id;}
        for(const set of data.sets||[])db.sets.push({...set,savedId:crypto.randomUUID()});
        write(db); return snapshot(db);
      case '/api/scenarios/create':
        entry=record(data.name,data.state);db.scenarios.unshift(entry);db.activeId=entry.id;write(db);return entry;
      case '/api/scenarios/save':
        index=db.scenarios.findIndex(s=>s.id===data.id);
        if(index<0)throw Error('Scenario no longer exists.');
        entry=db.scenarios[index];
        if(data.revision!==entry.revision)throw Error('This scenario changed in another tab. Reload it before saving.');
        db.scenarios[index]={...entry,name:data.name||entry.name,state:data.state,revision:entry.revision+1,updated_at:new Date().toISOString()};
        write(db);return db.scenarios[index];
      case '/api/scenarios/activate':
        if(!db.scenarios.some(s=>s.id===data.id))throw Error('Unknown scenario.');
        db.activeId=data.id;write(db);return {ok:true};
      case '/api/scenarios/remove':
        index=db.scenarios.findIndex(s=>s.id===data.id);if(index<0)throw Error('Unknown scenario.');
        entry=db.scenarios.splice(index,1)[0];db.deleted[entry.id]=entry;
        if(db.activeId===entry.id)db.activeId=db.scenarios[0]?.id||null;
        write(db);return snapshot(db);
      case '/api/scenarios/restore':
        entry=db.deleted[data.id];if(!entry)throw Error('Scenario cannot be restored.');
        db.scenarios.unshift(entry);delete db.deleted[data.id];write(db);return snapshot(db);
      case '/api/sets/save':
        entry={...data.set,savedId:data.set.savedId||crypto.randomUUID(),label:data.name,source:null};
        index=db.sets.findIndex(s=>s.savedId===entry.savedId);
        if(index>=0)db.sets[index]=entry;else db.sets.unshift(entry);
        write(db);return db.sets;
      default: throw Error('Unknown browser storage action.');
    }
  }
  async function get(url) {
    if(hosted&&url==='/api/workspace')return snapshot(read());
    const response=await fetch(apiBase+url);
    if(!response.ok)throw Error('Service unavailable ('+response.status+').');
    return response.json();
  }
  async function post(url,data) {
    if(hosted&&(/^\/api\/scenarios\//.test(url)||url==='/api/workspace/migrate'||url==='/api/sets/save'))return localPost(url,data);
    if(hosted&&url==='/api/update')throw Error('Data updates are published through the project repository.');
    const response=await fetch(apiBase+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const body=await response.json();if(!response.ok)throw Error(body.error||'Calculation service unavailable.');return body;
  }
  return {hosted,apiBase,get,post,sprite:id=>apiBase+'/api/sprite/'+encodeURIComponent(id)};
})();
