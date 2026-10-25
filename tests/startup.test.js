const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');

function browser(){
  const events={},nodes=new Map(),storage=new Map([['orbit-session','baba'],['orbit-accounts',JSON.stringify({baba:{display:'Baba'}})]]);
  function element(selector){if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},elements:{type:{},cadence:{}},addEventListener(){},focus(){}});return nodes.get(selector)}
  const getItem=key=>storage.get(key)||null;
  const context={Date,crypto:webcrypto,structuredClone,console,setInterval(){},setTimeout(){},clearTimeout(){},scrollTo(){},confirm:()=>true,sessionStorage:{getItem,removeItem:key=>storage.delete(key)},localStorage:{getItem,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},navigator:{},document:{readyState:'loading',querySelector:element,querySelectorAll:()=>[],addEventListener:(event,fn)=>{events[event]=fn}},window:{addEventListener(){}}};
  vm.createContext(context);return {context,events,nodes};
}
test('restored session waits until analytics and bindings load; all screens render',()=>{
  const b=browser();
  vm.runInContext(fs.readFileSync('app.js','utf8'),b.context);
  assert.equal(b.nodes.has('main'),false,'no premature render');
  vm.runInContext(fs.readFileSync('src/analytics.js','utf8'),b.context);
  assert.doesNotThrow(()=>b.events.DOMContentLoaded());
  assert.match(b.nodes.get('main').innerHTML,/Good /);
  for(const screen of ['tasks','habits','goals','analytics','reflect','settings','today']){
    assert.doesNotThrow(()=>vm.runInContext(`go('${screen}')`,b.context));
    assert.ok(b.nodes.get('main').innerHTML.length>0);
  }
  vm.runInContext("go('analytics')",b.context);
  assert.match(b.nodes.get('main').innerHTML,/Choose an item/);
});
test('missing analytics script does not blank the app or block navigation',()=>{
  const b=browser();vm.runInContext(fs.readFileSync('app.js','utf8'),b.context);
  assert.doesNotThrow(()=>b.events.DOMContentLoaded());
  vm.runInContext("go('analytics')",b.context);
  assert.match(b.nodes.get('main').innerHTML,/Analytics unavailable/);
  vm.runInContext("go('today')",b.context);
  assert.match(b.nodes.get('main').innerHTML,/Good /);
});
test('reset empties activity, keeps preferences, and remains empty after reload',()=>{
  const b=browser();vm.runInContext(fs.readFileSync('app.js','utf8'),b.context);b.events.DOMContentLoaded();
  vm.runInContext('state.settings.name="Baba";state.settings.analyticsPins=["task:old"];resetProfileData()',b.context);
  const data=JSON.parse(b.context.localStorage.getItem('orbit-user-baba'));
  for(const field of ['tasks','habits','goals','journal'])assert.deepEqual(data[field],[]);
  assert.equal(data.settings.name,'Baba');assert.deepEqual(data.settings.analyticsPins,[]);
  assert.ok(data.settings.areas.length);assert.ok(b.context.localStorage.getItem('orbit-accounts'));
  assert.equal(vm.runInContext('totalPoints()+combinedStreak()',b.context),0);
  assert.equal(vm.runInContext('load().tasks.length+load().habits.length+load().goals.length+load().journal.length',b.context),0);
});
test('canceling reset preserves saved activity',()=>{
  const b=browser();vm.runInContext(fs.readFileSync('app.js','utf8'),b.context);b.events.DOMContentLoaded();
  b.context.confirm=()=>false;
  const before=vm.runInContext('JSON.stringify(state)',b.context);
  vm.runInContext('resetProfileData()',b.context);
  assert.equal(vm.runInContext('JSON.stringify(state)',b.context),before);
});
test('installed app reopens using persistent login without tab session storage',async()=>{
  const b=browser();b.context.sessionStorage={getItem:()=>null};
  vm.runInContext(fs.readFileSync('app.js','utf8'),b.context);
  await b.events.DOMContentLoaded();
  assert.match(b.nodes.get('main').innerHTML,/Good /);
});
test('cloud user restores after app closure without a local username marker',async()=>{
  const b=browser();b.context.localStorage.removeItem('orbit-session');
  b.context.sessionStorage={getItem:()=>null};
  b.context.window.OrbitCloud={configured:()=>true,restore:async()=>({email:'baba@movaacbofxvqrvahlkdl.supabase.co'})};
  vm.runInContext(fs.readFileSync('app.js','utf8'),b.context);
  await b.events.DOMContentLoaded();
  assert.match(b.nodes.get('main').innerHTML,/Good /);
  assert.equal(b.context.localStorage.getItem('orbit-session'),'baba');
});
test('expired cloud session returns to login instead of trusting username marker',async()=>{
  const b=browser();b.context.window.OrbitCloud={configured:()=>true,restore:async()=>null};
  vm.runInContext(fs.readFileSync('app.js','utf8'),b.context);
  await b.events.DOMContentLoaded();
  assert.equal(b.nodes.has('main'),false);
  assert.equal(b.context.localStorage.getItem('orbit-session'),null);
});
