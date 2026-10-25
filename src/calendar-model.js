// Date-only calculations use local noon to avoid UTC/daylight-saving shifts.
(function(root){
  const parse=key=>new Date(`${key}T12:00:00`);
  const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function occurs(event,date){
    if(!event.date||date<event.date)return false;
    if(!event.repeat||event.repeat==='none')return event.date===date;
    const original=parse(event.date),day=parse(date);
    if(event.repeat==='weekly')return original.getDay()===day.getDay();
    const last=new Date(day.getFullYear(),day.getMonth()+1,0).getDate();
    if(event.repeat==='monthly')return day.getDate()===Math.min(original.getDate(),last);
    if(event.repeat==='yearly')return day.getMonth()===original.getMonth()&&day.getDate()===Math.min(original.getDate(),last);
    return false;
  }
  function between(events,start,end){
    const result=[];
    for(let date=parse(start);key(date)<=end;date.setDate(date.getDate()+1)){
      const dateKey=key(date);
      for(const event of events)if(occurs(event,dateKey))result.push({...event,occurrence:dateKey});
    }
    return result.sort((a,b)=>a.occurrence.localeCompare(b.occurrence)||(a.time||'00:00').localeCompare(b.time||'00:00'));
  }
  function reminderAt(event){
    if(!event.reminder||event.reminder==='none')return null;
    const due=new Date(`${event.occurrence}T${event.time||'09:00'}:00`);
    due.setTime(due.getTime()-Number(event.reminder)*60000);
    return due;
  }
  const model={key,parse,occurs,between,reminderAt};
  if(typeof module!=='undefined'&&module.exports)module.exports=model;
  else root.OrbitCalendarModel=model;
})(globalThis);
