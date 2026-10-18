const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function setup(){
  let handlers={},reads=0;
  const item={id:'one',title:'Read',area:'Books',quantityTarget:20,quantityUnit:'pages',quantities:{'2026-10-15':10,'2026-10-16':0},doneDates:[]};
  const other={id:'two',title:'Walk',area:'Body',get checks(){reads++;return {}}};
  const context={Date,Map,Set,Number,Object,Math,analyticsPeriod:'week',analyticsRevision:0,currentUser:'test',state:{tasks:[item],habits:[other],settings:{}},dateKey:(d=new Date('2026-10-16T12:00:00'))=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'),todayKey:()=> '2026-10-16',esc:s=>String(s),header:()=>'',empty:()=> 'EMPTY',bind:()=>{},save:()=>{},render:()=>{},document:{querySelector:selector=>({addEventListener:(event,handler)=>{handlers[selector+event]=handler}}),querySelectorAll:()=>[]}};
  vm.createContext(context);vm.runInContext(fs.readFileSync('src/analytics.js','utf8'),context);
  context.bind();return {context,handlers,get reads(){return reads}};
}
test('no item selected means no historical activity read',()=>{const s=setup();assert.match(s.context.analyticsView(),/EMPTY/);assert.equal(s.reads,0)});
test('only selected item is computed; logged zero and missing days differ',()=>{const s=setup();s.handlers['#analyticsItemchange']({target:{value:'task:one'}});let html=s.context.analyticsView();assert.match(html,/2<\/strong> logged days/);assert.match(html,/5.0<\/strong> per logged day/);assert.match(html,/2026-10-16: 0/);assert.match(html,/not logged/);assert.equal(s.reads,0)});
test('pins restore panels and yearly heatmap without selecting unrelated items',()=>{const s=setup();s.context.state.settings.analyticsPins=['task:one'];s.context.analyticsPeriod='year';let html=s.context.analyticsView();assert.match(html,/1 item calculated/);assert.match(html,/Unpin/);assert.equal((html.match(/class="calendar-cell /g)||[]).length,365);assert.equal(s.reads,0)});
test('new saved quantities invalidate cached panel',()=>{const s=setup();s.context.state.settings.analyticsPins=['task:one'];let html=s.context.analyticsView();assert.match(html,/10<\/strong> pages/);s.context.state.tasks[0].quantities['2026-10-15']=30;s.context.analyticsRevision++;html=s.context.analyticsView();assert.match(html,/30<\/strong> pages/)});
