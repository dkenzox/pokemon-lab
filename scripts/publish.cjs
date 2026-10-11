'use strict';
const {spawnSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..'),message=process.argv.slice(2).join(' ').trim();
if(!message){console.error('Usage: npm run publish -- "Describe the change"');process.exit(2);}
function run(command,args,options={}){
  const result=spawnSync(command,args,{cwd:root,stdio:options.capture?'pipe':'inherit',encoding:'utf8'});
  if(result.status!==0){if(options.capture)process.stderr.write(result.stderr||'');process.exit(result.status||1);}
  return options.capture?result.stdout.trim():undefined;
}
if(run('git',['branch','--show-current'],{capture:true})!=='main'){
  console.error('Publish from the main branch only.');process.exit(2);
}
run('npm',['run','verify']);
run('git',['add','-A']);
const staged=run('git',['diff','--cached','--name-only'],{capture:true}).split('\n').filter(Boolean);
if(!staged.length){
  const ahead=Number(run('git',['rev-list','--count','@{upstream}..HEAD'],{capture:true}));
  if(ahead){run('git',['push','origin','main']);console.log('Pushed the pending commit.');}
  else console.log('No changes to publish.');
  process.exit(0);
}
const sensitive=staged.filter(file=>/(^|\/)(\.env(?:\.|$)|\.npmrc$|[^/]+\.(?:sqlite|db|pem|key)$)/i.test(file));
if(sensitive.length){run('git',['restore','--staged','--',...sensitive]);console.error('Sensitive files were excluded; review them before publishing:',sensitive.join(', '));process.exit(2);}
run('git',['diff','--cached','--check']);
run('git',['-c','commit.gpgsign=false','commit','-m',message]);
run('git',['push','origin','main']);
console.log('Published. GitHub Pages and the calculation service will update from main.');
