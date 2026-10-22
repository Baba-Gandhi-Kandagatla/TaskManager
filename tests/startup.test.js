const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');

function browser(){
  const events={},nodes=new Map(),storage=new Map([['orbit-session','baba'],['orbit-accounts',JSON.stringify({baba:{display:'Baba'}})]]);
  function element(selector){if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},elements:{type:{},cadence:{}},addEventListener(){},focus(){}});return nodes.get(selector)}
  const getItem=key=>storage.get(key)||null;
  const context={Date,crypto:webcrypto,structuredClone,console,setInterval(){},setTimeout(){},clearTimeout(){},scrollTo(){},sessionStorage:{getItem},localStorage:{getItem},navigator:{},document:{readyState:'loading',querySelector:element,querySelectorAll:()=>[],addEventListener:(event,fn)=>{events[event]=fn}},window:{addEventListener(){}}};
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
