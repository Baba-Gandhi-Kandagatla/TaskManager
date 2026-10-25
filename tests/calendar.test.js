const {test}=require('node:test');
const assert=require('node:assert/strict');
const model=require('../src/calendar-model');
test('one-time entries appear only on their date',()=>{
  const e={date:'2026-10-26',repeat:'none'};
  assert.equal(model.occurs(e,'2026-10-26'),true);
  assert.equal(model.occurs(e,'2026-10-27'),false);
});
test('weekly repeats do not appear before their start date',()=>{
  const e={date:'2026-10-26',repeat:'weekly'};
  assert.equal(model.occurs(e,'2026-11-02'),true);
  assert.equal(model.occurs(e,'2026-10-19'),false);
});
test('monthly day 31 uses last day of shorter months',()=>{
  const e={date:'2026-01-31',repeat:'monthly'};
  assert.equal(model.occurs(e,'2026-02-28'),true);
  assert.equal(model.occurs(e,'2026-04-30'),true);
  assert.equal(model.occurs(e,'2026-03-30'),false);
});
test('leap birthdays repeat on February 28 in non-leap years',()=>{
  const e={date:'2024-02-29',repeat:'yearly'};
  assert.equal(model.occurs(e,'2026-02-28'),true);
  assert.equal(model.occurs(e,'2028-02-28'),false);
  assert.equal(model.occurs(e,'2028-02-29'),true);
});
test('bounded agenda expands and orders repeats without mutating records',()=>{
  const e={id:'1',title:'Workout',date:'2026-10-26',repeat:'weekly'};
  const rows=model.between([e],'2026-10-26','2026-11-09');
  assert.deepEqual(rows.map(x=>x.occurrence),['2026-10-26','2026-11-02','2026-11-09']);
  assert.equal(e.occurrence,undefined);
});
test('reminders use local event time and optional offsets',()=>{
  const due=model.reminderAt({occurrence:'2026-10-26',time:'10:00',reminder:'60'});
  assert.equal(due.getHours(),9);assert.equal(model.key(due),'2026-10-26');
  assert.equal(model.reminderAt({occurrence:'2026-10-26',reminder:'none'}),null);
  assert.equal(model.reminderAt({occurrence:'2026-10-26',reminder:'0'}).getHours(),9);
});
