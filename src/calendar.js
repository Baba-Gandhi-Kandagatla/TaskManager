// Calendar UI and reminders; entries live in the user's existing cloud-backed profile.
(() => {
  const model=window.OrbitCalendarModel;
  let month=dateKey().slice(0,7),selected=dateKey(),owner=null;
  const entries=()=>state?.events||[];
  const dateLabel=date=>shortDate(date,{weekday:'short',month:'short',day:'numeric',year:'numeric'});
  const repeatLabels={none:'Does not repeat',weekly:'Every week',monthly:'Every month',yearly:'Every year'};
  function eventRow(event){
    return `<article class="calendar-event"><div><span class="eyebrow">${esc(event.kind||'event')}</span><h3>${esc(event.title)}</h3><p class="subtle">${dateLabel(event.occurrence)} · ${event.time||'All day'}${event.repeat&&event.repeat!=='none'?` · ${repeatLabels[event.repeat]}`:''}</p>${event.notes?`<p class="event-notes">${esc(event.notes)}</p>`:''}</div><div class="event-actions"><button class="text-btn" data-event-edit="${event.id}">Edit</button><button class="text-btn" data-event-delete="${event.id}">Delete</button></div></article>`;
  }
  function view(){
    if(owner!==currentUser){month=todayKey().slice(0,7);selected=todayKey();owner=currentUser;}
    const first=`${month}-01`,base=model.parse(first),last=model.key(new Date(base.getFullYear(),base.getMonth()+1,0));
    const monthEvents=model.between(entries(),first,last),byDate=new Map();
    monthEvents.forEach(e=>{if(!byDate.has(e.occurrence))byDate.set(e.occurrence,[]);byDate.get(e.occurrence).push(e)});
    const padding=(base.getDay()+6)%7,days=Number(last.slice(-2));
    const chosen=byDate.get(selected)||[],goalDates=state.goals.filter(g=>g.deadline===selected);
    return `${header('Make room for life','Calendar','Appointments, birthdays, plans, and reminders—all in one place.')}<div class="calendar-layout"><section class="card"><div class="card-head"><h2>${base.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2><button class="primary" data-event-add>＋ Event</button></div><div class="week-nav"><button class="ghost" data-calendar-move="-1" aria-label="Previous month">←</button><button class="ghost" data-calendar-today>Today</button><button class="ghost" data-calendar-move="1" aria-label="Next month">→</button></div><div class="month-grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<span class="month-weekday">${d}</span>`).join('')}${Array.from({length:padding},()=>'<span></span>').join('')}${Array.from({length:days},(_,i)=>{
      const date=`${month}-${String(i+1).padStart(2,'0')}`,events=byDate.get(date)||[],goals=state.goals.filter(g=>g.deadline===date);
      return `<button class="month-day ${date===selected?'selected':''} ${date===todayKey()?'is-today':''}" data-calendar-date="${date}" aria-label="${dateLabel(date)}, ${events.length} events, ${goals.length} goal deadlines" aria-pressed="${date===selected}"><b>${i+1}</b><span class="day-markers">${events.slice(0,3).map(()=>'<i></i>').join('')}${goals.length?'<i class="goal-marker"></i>':''}</span></button>`;
    }).join('')}</div><p class="subtle">Green dots: events · Gold dots: goal deadlines</p></section><section class="card"><div class="card-head"><h2>${dateLabel(selected)}</h2><button class="text-btn" data-event-add>＋ Add</button></div>${chosen.length?chosen.map(eventRow).join(''):empty('A little breathing room','Add a reminder, an important date, or something to look forward to.')}${goalDates.map(g=>`<article class="calendar-event"><div><span class="eyebrow">Goal deadline</span><h3>${esc(g.title)}</h3></div><button class="text-btn" data-view="goals">View goal</button></article>`).join('')}</section></div>`;
  }
  function upcoming(){
    const end=new Date();end.setDate(end.getDate()+7);
    const next=model.between(entries(),todayKey(),model.key(end)).slice(0,5);
    if(!next.length)return '';
    return `<section class="card upcoming-card"><div class="card-head"><div><span class="eyebrow">Next 7 days</span><h2>Coming up</h2></div><button class="text-btn" data-view="calendar">Open calendar →</button></div>${next.map(eventRow).join('')}</section>`;
  }
  function openForm(id){
    const existing=entries().find(e=>e.id===id),event=existing||{date:selected||todayKey(),repeat:'none',reminder:'none',kind:'reminder'};
    const dialog=document.createElement('dialog');
    dialog.innerHTML=`<form><div class="dialog-head"><h2>${existing?'Edit entry':'New calendar entry'}</h2><button type="button" class="icon-btn" aria-label="Close">×</button></div><label>Title<input name="title" required maxlength="100" value="${esc(event.title||'')}" placeholder="Birthday, appointment, pay a bill…"></label><div class="form-grid"><label>Type<select name="kind"><option value="reminder">Reminder</option><option value="event">Event</option><option value="important">Important date</option><option value="birthday">Birthday / anniversary</option></select></label><label>Date<input name="date" type="date" required value="${event.date}"></label></div><div class="form-grid"><label>Time (optional)<input name="time" type="time" value="${event.time||''}"></label><label>Repeat<select name="repeat">${Object.entries(repeatLabels).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label></div><label>Notify me<select name="reminder"><option value="none">No notification</option><option value="0">At the time</option><option value="15">15 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option><option value="10080">1 week before</option></select></label><p class="subtle">Notifications work while Orbit is open and permitted by your browser. All-day reminders use 9:00 AM on this device.</p><label>Notes (optional)<textarea name="notes" maxlength="800" rows="3">${esc(event.notes||'')}</textarea></label><button class="primary wide">Save entry</button></form>`;
    document.body.append(dialog);const form=dialog.querySelector('form');
    for(const key of ['kind','repeat','reminder'])form.elements[key].value=event[key]||'none';
    form.elements.kind.onchange=()=>{if(form.elements.kind.value==='birthday'&&form.elements.repeat.value==='none')form.elements.repeat.value='yearly'};
    dialog.querySelector('.icon-btn').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
    form.onsubmit=async e=>{
      e.preventDefault();if(form.dataset.saving)return;
      const values=Object.fromEntries(new FormData(form));if(!values.title.trim())return;
      form.dataset.saving='yes';
      if(values.reminder!=='none'){
        if(typeof Notification==='undefined'){toast('Saved without browser notifications on this device');}
        else if(Notification.permission==='default')await Notification.requestPermission();
      }
      // Do not save into a different profile if the account changed while the dialog was open.
      if(!state||currentUser!==profile){dialog.close();return;}
      const item={...values,title:values.title.trim(),notes:values.notes.trim(),id:existing?.id||uid()};
      state.events=entries();if(existing){const index=state.events.findIndex(x=>x.id===id);if(index>=0)state.events[index]=item;}else state.events.push(item);
      selected=item.date;month=item.date.slice(0,7);save();dialog.close();render();toast('Calendar entry saved');
    };
    const profile=currentUser;dialog.showModal();
  }
  function bind(){
    document.querySelectorAll('[data-calendar-date]').forEach(b=>b.onclick=()=>{selected=b.dataset.calendarDate;render()});
    document.querySelectorAll('[data-calendar-move]').forEach(b=>b.onclick=()=>{const d=model.parse(`${month}-01`);d.setMonth(d.getMonth()+Number(b.dataset.calendarMove));month=model.key(d).slice(0,7);selected=`${month}-01`;render()});
    document.querySelector('[data-calendar-today]')?.addEventListener('click',()=>{selected=todayKey();month=selected.slice(0,7);render()});
    document.querySelectorAll('[data-event-add]').forEach(b=>b.onclick=()=>openForm());
    document.querySelectorAll('[data-event-edit]').forEach(b=>b.onclick=()=>openForm(b.dataset.eventEdit));
    document.querySelectorAll('[data-event-delete]').forEach(b=>b.onclick=()=>{const event=entries().find(e=>e.id===b.dataset.eventDelete);if(!event)return;if(!confirm(`Delete "${event.title}"${event.repeat!=='none'?' and all its repeats':''}?`))return;state.events=entries().filter(e=>e.id!==event.id);save();render();toast('Calendar entry deleted')});
  }
  let sending=false;
  async function checkReminders(){
    if(sending||!state||!currentUser||typeof Notification==='undefined'||Notification.permission!=='granted')return;
    sending=true;const profile=currentUser;
    try{
      const now=new Date(),end=new Date(now);end.setDate(end.getDate()+8);
      const items=model.between(entries(),todayKey(),model.key(end));
      for(const event of items){
        const due=model.reminderAt(event);if(!due||now<due||now-due>86400000)continue;
        const key=`orbit-event-notified-${profile}-${event.id}-${event.occurrence}-${due.getTime()}`;
        if(localStorage.getItem(key))continue;
        if(currentUser!==profile)break;
        await showOrbitNotification(event.title,`${dateLabel(event.occurrence)} · ${event.time||'All day'}`,`orbit-event-${event.id}-${event.occurrence}`);
        localStorage.setItem(key,'1');
      }
    }catch(error){console.warn('Calendar reminder unavailable:',error.message)}finally{sending=false}
  }
  window.OrbitCalendar={view,bind,upcoming,checkReminders};
  setInterval(checkReminders,30000);
})();
