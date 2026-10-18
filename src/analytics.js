// Demand-driven item analytics. No activity aggregation runs until a panel is viewed.
(function () {
  let selected = "", anchor = dateKey(), sourceState, cache = new Map();
  const items = () => [...state.tasks.map(item => ({item, type:"task"})), ...state.habits.map(item => ({item, type:"habit"}))];
  const keyOf = entry => `${entry.type}:${entry.item.id}`;
  const get = key => items().find(entry => keyOf(entry) === key);
  function range(period) {
    let base = new Date(`${anchor}T12:00:00`), first, last;
    if(period === "year") { first=new Date(base.getFullYear(),0,1); last=new Date(base.getFullYear(),11,31); }
    else if(period === "month") { first=new Date(base.getFullYear(),base.getMonth(),1); last=new Date(base.getFullYear(),base.getMonth()+1,0); }
    else { first=new Date(base); first.setDate(base.getDate()-(base.getDay()+6)%7); last=new Date(first); last.setDate(first.getDate()+6); }
    let days=[];
    for(let d=new Date(first);d<=last;d.setDate(d.getDate()+1)) days.push(dateKey(d));
    return {first:dateKey(first),last:dateKey(last),days};
  }
  function compute(entry, period, bounds) {
    // Save invalidates all panels; each selected/pinned panel is computed once per range.
    const snapshot=analyticsRevision;
    if(sourceState!==snapshot) { cache.clear(); sourceState=snapshot; }
    const cacheKey=`${currentUser}:${keyOf(entry)}:${period}:${bounds.first}:${todayKey()}`;
    if(cache.has(cacheKey)) return cache.get(cacheKey);
    const item=entry.item, done=new Set(item.doneDates||[]), numeric=Number(item.quantityTarget)>0;
    const rows=bounds.days.map(date=>({date,future:date>todayKey(),logged:Object.hasOwn(item.quantities||{},date),value:Number(item.quantities?.[date]||0),done:entry.type==="task"?done.has(date):Boolean(item.checks?.[date])}));
    const past=rows.filter(r=>!r.future), logged=past.filter(r=>numeric?r.logged:r.done), total=logged.reduce((sum,r)=>sum+(numeric?r.value:1),0);
    const result={rows,total,active:logged.length,average:logged.length?total/logged.length:0,numeric};
    cache.set(cacheKey,result);return result;
  }
  function calendar(data) {
    const first=new Date(`${data.rows[0].date}T12:00:00`), pad=(first.getDay()+6)%7;
    const max=data.numeric?Math.max(1,...data.rows.map(r=>r.value)):1;
    return `<div class="calendar-scroll"><div class="contribution-calendar">${Array.from({length:pad},()=>'<i class="calendar-blank"></i>').join("")}${data.rows.map(r=>{
      const amount=data.numeric?r.value:Number(r.done), level=amount>0?Math.max(1,Math.ceil(amount/max*4)):0;
      return `<button class="calendar-cell level-${level} ${r.future?"future":""}" title="${r.date}: ${data.numeric?(r.logged?r.value:"not logged"):(r.done?"completed":"no completion")}" aria-label="${r.date}: ${amount}" ${r.future?"disabled":""}>${analyticsPeriod!=="year"?new Date(`${r.date}T12:00:00`).getDate():""}</button>`;
    }).join("")}</div></div><p class="subtle">Less <span class="calendar-legend">□ ░ ▒ ▓ ▉</span> More · Hover or focus a square for its date.</p>`;
  }
  function graph(data,item) {
    if(!data.numeric)return '<p class="subtle">Set a daily quantity target when editing this item to see its trend graph.</p>';
    let rows=data.rows.filter(r=>!r.future), max=Math.max(item.quantityTarget,...rows.map(r=>r.value),1),width=720,height=180;
    const x=i=>30+i*(width-60)/Math.max(1,rows.length-1), y=value=>height-25-value/max*(height-45);
    let dots=rows.map((r,i)=>r.logged?`<circle cx="${x(i)}" cy="${y(r.value)}" r="3" fill="#315c4b"><title>${r.date}: ${r.value} ${esc(item.quantityUnit||"units")}</title></circle>`:"").join("");
    // Only connect adjacent recorded days. Missing data is never presented as zero.
    let lines=rows.map((r,i)=>i&&r.logged&&rows[i-1].logged?`<line x1="${x(i-1)}" y1="${y(rows[i-1].value)}" x2="${x(i)}" y2="${y(r.value)}" stroke="#315c4b" stroke-width="2"/>`:"").join("");
    return `<div class="trend-graph"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Daily quantity compared with target"><line x1="20" x2="700" y1="${y(item.quantityTarget)}" y2="${y(item.quantityTarget)}" stroke="#ba7e36" stroke-dasharray="6 5"/>${lines}${dots}</svg></div><p class="subtle">Target: ${item.quantityTarget} ${esc(item.quantityUnit||"units")}/day · Green dots: logged values · Dashed line: target. Missing days have gaps.</p>`;
  }
  function panel(entry,bounds) {
    const data=compute(entry,analyticsPeriod,bounds),item=entry.item,pinned=(state.settings.analyticsPins||[]).includes(keyOf(entry));
    return `<section class="card analytics-panel"><div class="card-head"><div><span class="eyebrow">${entry.type} · ${esc(item.area)}</span><h2>${esc(item.title)}</h2></div><button class="ghost" data-pin-item="${keyOf(entry)}">${pinned?"Unpin":"Pin"}</button></div><div class="analytics-summary"><span><strong>${data.total.toLocaleString()}</strong> ${data.numeric?esc(item.quantityUnit||"units"):"completions"}</span><span><strong>${data.active}</strong> ${data.numeric?"logged":"active"} days</span><span><strong>${data.average.toFixed(1)}</strong> per ${data.numeric?"logged":"active"} day</span></div>${calendar(data)}${graph(data,item)}${item.quantityTarget?`<button class="primary" data-log-quantity="${keyOf(entry)}">Log quantity</button>`:""}</section>`;
  }
  analyticsView=function () {
    const available=items(),bounds=range(analyticsPeriod),pins=(state.settings.analyticsPins||[]).filter(key=>get(key));
    const keys=[...new Set([...pins,...(selected&&get(selected)?[selected]:[])])];
    return `${header("Your patterns","Analytics","Choose an item to explore its calendar and daily trend. Pin the ones you want to see each visit.")}<div class="analytics-controls card"><label>Task or habit<select id="analyticsItem"><option value="">Choose an item…</option>${available.map(e=>`<option value="${keyOf(e)}" ${selected===keyOf(e)?"selected":""}>${esc(e.item.title)} (${e.type})</option>`).join("")}</select></label><div class="filters">${[["week","Weekly"],["month","Monthly"],["year","Yearly"]].map(([p,l])=>`<button class="filter ${analyticsPeriod===p?"active":""}" data-analytics-period="${p}">${l}</button>`).join("")}</div><div class="week-nav"><button class="ghost" data-analytics-move="-1">← Previous</button><button class="ghost" data-analytics-now>Current period</button><button class="ghost" data-analytics-move="1">Next →</button></div><span class="subtle">${bounds.first} – ${bounds.last} · ${keys.length} item${keys.length===1?"":"s"} calculated</span></div>${keys.length?keys.map(key=>panel(get(key),bounds)).join(""):empty("Choose what matters","Select a task or habit above. No item analytics have been calculated yet.")}`;
  };
  const originalBind=bind;
  bind=function () {
    originalBind();
    document.querySelector("#analyticsItem")?.addEventListener("change",e=>{selected=e.target.value;render()});
    document.querySelectorAll("[data-pin-item]").forEach(b=>b.onclick=()=>{const key=b.dataset.pinItem,pins=state.settings.analyticsPins||[];state.settings.analyticsPins=pins.includes(key)?pins.filter(p=>p!==key):[...pins,key];save();render()});
    document.querySelectorAll("[data-analytics-move]").forEach(b=>b.onclick=()=>{let d=new Date(`${anchor}T12:00:00`),n=Number(b.dataset.analyticsMove);if(analyticsPeriod==="week")d.setDate(d.getDate()+7*n);else if(analyticsPeriod==="month"){d.setDate(1);d.setMonth(d.getMonth()+n)}else d.setFullYear(d.getFullYear()+n);anchor=dateKey(d);render()});
    document.querySelector("[data-analytics-now]")?.addEventListener("click",()=>{anchor=todayKey();render()});
    document.querySelectorAll("[data-log-quantity]").forEach(b=>b.onclick=()=>openQuantity(b.dataset.logQuantity));
  };
  function openQuantity(key) {
    const entry=get(key);if(!entry)return;
    const dialog=document.createElement("dialog");
    dialog.innerHTML=`<form><div class="dialog-head"><h2>Log ${esc(entry.item.title)}</h2><button type="button" class="icon-btn" aria-label="Close">×</button></div><label>Date<input name="date" type="date" required max="${todayKey()}" value="${todayKey()}"></label><label>Amount (${esc(entry.item.quantityUnit||"units")})<input name="value" type="number" step="any" min="0" required value="${entry.item.quantities?.[todayKey()]??""}"></label><p class="subtle">This replaces the day's amount. Completion is tracked separately.</p><button class="primary wide">Save amount</button></form>`;
    document.body.append(dialog);dialog.querySelector(".icon-btn").onclick=()=>dialog.close();
    dialog.addEventListener("close",()=>dialog.remove());
    const form=dialog.querySelector("form");
    form.elements.date.onchange=()=>{form.elements.value.value=entry.item.quantities?.[form.elements.date.value]??""};
    form.onsubmit=e=>{e.preventDefault();let date=form.elements.date.value,value=Number(form.elements.value.value);if(!date||date>todayKey()||!Number.isFinite(value)||value<0)return;entry.item.quantities=entry.item.quantities||{};entry.item.quantities[date]=value;save();dialog.close();render();toast("Quantity saved")};
    dialog.showModal();
  }
})();
