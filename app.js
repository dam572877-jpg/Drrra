
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const money=n=>n==null||n===''?'—':Number(n).toLocaleString('en-US')+' جنيه';
const WA_SVG='<svg viewBox="0 0 32 32" width="15" height="15"><path fill="#25D366" d="M16.001 3C9.383 3 4 8.383 4 15c0 2.386.703 4.605 1.918 6.464L4 29l7.75-1.868A11.94 11.94 0 0016 27c6.617 0 12-5.383 12-12S22.618 3 16.001 3zm.001 21.818c-1.94 0-3.76-.51-5.34-1.4l-.383-.219-4.598 1.107 1.127-4.482-.245-.397A9.77 9.77 0 015.818 15c0-5.615 4.567-10.182 10.183-10.182 5.615 0 10.182 4.567 10.182 10.182s-4.567 10.182-10.182 10.182zm5.579-7.62c-.306-.153-1.809-.892-2.089-.994-.28-.102-.484-.153-.688.153-.204.306-.789.994-.967 1.198-.178.204-.357.229-.663.076-.306-.153-1.293-.477-2.463-1.522-.911-.812-1.527-1.815-1.705-2.121-.178-.306-.019-.472.134-.624.138-.137.306-.357.459-.535.153-.178.204-.306.306-.51.102-.204.051-.382-.026-.535-.076-.153-.688-1.658-.943-2.27-.248-.596-.5-.516-.688-.526l-.586-.01c-.204 0-.535.076-.815.382-.28.306-1.068 1.044-1.068 2.546 0 1.502 1.093 2.955 1.245 3.159.153.204 2.15 3.283 5.209 4.603.728.314 1.296.502 1.739.642.731.232 1.396.199 1.922.121.586-.087 1.809-.74 2.064-1.454.255-.714.255-1.325.178-1.454-.076-.128-.28-.204-.586-.357z"/></svg>';
const IOS_ICONS={
  photo:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="3"/><circle cx="8.5" cy="9" r="1.5"/><path d="m5.5 17 4.1-4.2 2.8 2.6 2.1-2.1 3.9 3.7"/></svg>',
  download:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 20h16"/></svg>',
  share:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13"/></svg>',
  document:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/></svg>'
};

function waHref(phone){let d=String(phone||'').replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x))).replace(/\D/g,'');if(!d)return'';if(d.startsWith('0'))d='2'+d;else if(!d.startsWith('20'))d='20'+d;return'https://wa.me/'+d}
function waBtn(phone){return phone?` <a class="wa-btn" href="${waHref(phone)}" target="_blank" rel="noopener" title="مراسلة واتساب">${WA_SVG}</a>`:''}
const KEY='dream_house_static_v1', AUTH='dream_house_auth_v1';
let props=[],clients=[];
let selectedPropertyIds=new Set();
const EMPTY_DB=()=>({properties:[],clients:[],seq:1});
const IMG_DB='dream_house_images_v1';
function imageStore(){return new Promise((resolve,reject)=>{const r=indexedDB.open(IMG_DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('images');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function putStoredImage(id,data){const dbx=await imageStore();return new Promise((resolve,reject)=>{const tx=dbx.transaction('images','readwrite');tx.objectStore('images').put(data,String(id));tx.oncomplete=()=>{dbx.close();resolve(true)};tx.onerror=()=>{dbx.close();reject(tx.error)}})}
async function getStoredImage(id){try{const dbx=await imageStore();return await new Promise((resolve,reject)=>{const tx=dbx.transaction('images','readonly');const r=tx.objectStore('images').get(String(id));r.onsuccess=()=>{dbx.close();resolve(r.result||'')};r.onerror=()=>{dbx.close();reject(r.error)}})}catch{return ''}}
async function deleteStoredImage(id){try{const dbx=await imageStore();await new Promise((resolve,reject)=>{const tx=dbx.transaction('images','readwrite');tx.objectStore('images').delete(String(id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});dbx.close()}catch{}}
async function hydrateImages(list){return Promise.all(list.map(async p=>{if(!p.image_url&&p.image_key)p.image_url=await getStoredImage(p.id);return p}))}
function db(){
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw)return EMPTY_DB();
    const d=JSON.parse(raw);
    return {
      properties:Array.isArray(d.properties)?d.properties:[],
      clients:Array.isArray(d.clients)?d.clients:[],
      seq:Number(d.seq)||1
    };
  }catch{return EMPTY_DB();}
}
function saveDB(d){
  try{localStorage.setItem(KEY,JSON.stringify(d));return true}
  catch(err){toast('مساحة التخزين ممتلئة. احذف صورًا قديمة أو استخدم النسخة الاحتياطية.');return false}
}
function showLogin(){
  const login=document.getElementById('login'), app=document.getElementById('app');
  if(app) app.classList.add('hidden');
  if(login) login.classList.remove('hidden');
  const u=document.getElementById('username');
  if(u && !u.value) u.value='admin';
}
function showApp(){
  const login=document.getElementById('login'), app=document.getElementById('app');
  if(login) login.classList.add('hidden');
  if(app) app.classList.remove('hidden');
  const splash=document.getElementById('appSplash');
  if(splash){splash.classList.add('show');setTimeout(()=>splash.classList.add('hide'),520);setTimeout(()=>splash.remove(),1050)}
  try{loadAll()}catch(err){console.error('DREAM HOUSE startup:',err);toast('تم الدخول بنجاح. بعض البيانات ستظهر بعد لحظات.');}
}
function toast(t){const x=document.getElementById('toast');if(!x)return;x.textContent=t;x.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>x.classList.remove('show'),2400)}
function auth(){
  try{return sessionStorage.getItem(AUTH)==='1' || localStorage.getItem(AUTH)==='1'}catch{return false}
}
function setAuth(v){
  try{
    if(v){sessionStorage.setItem(AUTH,'1');localStorage.setItem(AUTH,'1')}
    else{sessionStorage.removeItem(AUTH);localStorage.removeItem(AUTH)}
  }catch{}
}
function boot(){if(auth())showApp();else showLogin()}
function bindLogin(){
  const form=document.getElementById('loginForm');
  const toggle=document.getElementById('togglePassword');
  if(toggle && !toggle.dataset.bound){
    toggle.dataset.bound='1';
    toggle.addEventListener('click',()=>{
      const p=document.getElementById('password'); if(!p)return;
      const show=p.type==='password'; p.type=show?'text':'password';
      toggle.classList.toggle('is-open',show);
    });
  }
  if(!form || form.dataset.bound==='1')return;
  form.dataset.bound='1';
  form.addEventListener('submit',(e)=>{
    e.preventDefault(); e.stopImmediatePropagation();
    const username=(document.getElementById('username')?.value||'').trim();
    const password=document.getElementById('password')?.value||'';
    const error=document.getElementById('loginError');
    const btn=form.querySelector('.login-submit');
    if(error)error.textContent='';
    if(username!=='admin' || password!=='112203'){
      if(error)error.textContent='اسم المستخدم أو كلمة المرور غير صحيحة';
      document.getElementById('password')?.focus();
      return;
    }
    setAuth(true);
    const who=document.getElementById('who'); if(who)who.textContent='Engineer Ahmed Galal';
    if(btn){btn.disabled=true;btn.classList.add('is-loading');}
    showApp();
    setTimeout(()=>{if(btn){btn.disabled=false;btn.classList.remove('is-loading')}},700);
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{bindLogin();boot()});else{bindLogin();boot()}
const logoutBtn=document.getElementById('logout');
if(logoutBtn)logoutBtn.addEventListener('click',()=>{setAuth(false);showLogin()});

const titles={dashboard:'لوحة المكتب',properties:'إدارة العقارات',clients:'إدارة العملاء',requests:'طلبات العملاء',reports:'البيانات و PDF'};
$$('.nav button').forEach(b=>b.onclick=()=>{$$('.section').forEach(x=>x.classList.remove('active'));$('#'+b.dataset.page).classList.add('active');$$('.nav button').forEach(x=>x.classList.toggle('active',x===b));$('#pageTitle').textContent=titles[b.dataset.page];if(b.dataset.page==='dashboard')renderDash();if(b.dataset.page==='properties')loadProps();if(b.dataset.page==='clients')loadClients();if(b.dataset.page==='requests')loadRequestDesk()});
function loadAll(){renderDash();loadProps();loadClients();loadRequestDesk()}
async function renderDash(){const d=db();props=await hydrateImages(d.properties.map(x=>({...x})));clients=d.clients;$('#sp').textContent=props.length;$('#sa').textContent=props.filter(x=>x.status==='متاح').length;$('#sc').textContent=clients.length;$('#sf').textContent=clients.filter(x=>x.status==='متابعة').length;const now=new Date(),h=now.getHours();const greet=h<12?'صباح الخير':h<18?'مساء الخير':'مساء الخير';if($('#greeting'))$('#greeting').textContent=greet;$('#dashProps').innerHTML=props.slice(-6).reverse().map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.area)}</td><td>${x.size||'—'} م²</td><td>${money(x.price)}</td><td><span class="badge ${x.status!=='متاح'?'red':''}">${esc(x.status)}</span></td></tr>`).join('')||'<tr><td colspan="5">لا توجد بيانات</td></tr>';$('#dashClients').innerHTML=clients.slice(-6).reverse().map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.phone)}</td><td>${esc(x.need||'—')}</td></tr>`).join('')||'<tr><td colspan="3">لا توجد بيانات</td></tr>';const fp=$('#featuredProps');if(fp){const featured=props.filter(x=>x.status==='متاح').slice(-8).reverse();fp.innerHTML=featured.map(x=>`<article class="featured-property" onclick="viewProperty(${x.id})" role="button" tabindex="0">${x.image_url?`<img src="${x.image_url}" alt="">`:'<div class="featured-placeholder">DH</div>'}<div class="featured-overlay"></div><div class="featured-info"><span>${esc(x.area||'الفيوم')} • ${esc(x.type||'عقار')}</span><b>${esc(x.name||'عقار مميز')}</b><small>${x.size||'—'} م² • ${money(x.price)}</small></div><i class="featured-arrow">↗</i></article>`).join('')||'<div class="featured-empty">أضف أول عقار ليظهر هنا كواجهة مميزة للمكتب.</div>'}}
let timer;function scheduleProps(){clearTimeout(timer);timer=setTimeout(loadProps,120)}['q','area','minPrice','maxPrice','minSize','maxSize','rooms','status'].forEach(id=>{const e=$('#'+id);if(e)e.addEventListener(e.tagName==='SELECT'?'change':'input',scheduleProps)});
function quickArea(v){document.querySelector('[data-page=properties]').click();$('#area').value=v;loadProps()}function quickType(v){document.querySelector('[data-page=properties]').click();const q=$('#q');q.value=v;loadProps()}function quickPrice(v){$('#maxPrice').value=v;loadProps()}function clearFilters(){['q','area','minPrice','maxPrice','minSize','maxSize','rooms','status'].forEach(id=>$('#'+id).value='');loadProps()}
function updateSelectedCount(){const el=$('#selectedCount');if(el){const total=db().properties.length;el.textContent=`${selectedPropertyIds.size} عقار محدد من ${total}`;}const badge=$('#selectedBadge');if(badge)badge.textContent=String(selectedPropertyIds.size);}
function togglePropertySelection(id){id=Number(id);if(selectedPropertyIds.has(id))selectedPropertyIds.delete(id);else selectedPropertyIds.add(id);loadProps();}
function clearPropertySelection(){selectedPropertyIds.clear();loadProps();toast('تم إلغاء اختيار العقارات');}
function selectVisibleProperties(){const visible=Array.isArray(props)?props:[];visible.forEach(x=>selectedPropertyIds.add(Number(x.id)));loadProps();toast(`تم اختيار ${visible.length} عقار ظاهر`);}
function selectAllProperties(){const all=db().properties||[];all.forEach(x=>selectedPropertyIds.add(Number(x.id)));loadProps();toast(`تم اختيار كل العقارات — ${all.length}`);}
function syncSelectedWithDatabase(){const ids=new Set((db().properties||[]).map(x=>Number(x.id)));selectedPropertyIds.forEach(id=>{if(!ids.has(Number(id)))selectedPropertyIds.delete(Number(id))});}
async function reportSelectedProperties(mode='long-pdf'){
  syncSelectedWithDatabase();
  if(!selectedPropertyIds.size){toast('اختار عقارًا واحدًا على الأقل أولاً');return}
  const ids=Array.from(selectedPropertyIds);
  if(mode==='long-pdf' && ids.length>20){toast('الـPDF الواحد حتى 20 عقارًا للحفاظ على وضوح الصفحات');return}
  if(mode==='long-image' && ids.length>40){toast('الصورة الواحدة حتى 40 عقارًا');return}
  const buttons=document.querySelectorAll('[data-report-action]');
  buttons.forEach(b=>b.disabled=true);
  toast(`جاري تجهيز ملف واحد لـ ${ids.length} عقار…`);
  try{
    await report('properties',mode,ids);
  }catch(err){
    console.error('DREAM HOUSE report error',err);
    toast(err?.message||'تعذر إنشاء التقرير. حاول مرة أخرى.');
  }finally{
    buttons.forEach(b=>b.disabled=false);
  }
}
async function loadProps(){syncSelectedWithDatabase();const d=db();let p=await hydrateImages(d.properties.map(x=>({...x})));const q=$('#q').value.trim().toLowerCase(),area=$('#area').value.trim().toLowerCase(),minP=Number($('#minPrice').value)||0,maxP=Number($('#maxPrice').value)||Infinity,minS=Number($('#minSize').value)||0,maxS=Number($('#maxSize').value)||Infinity,rooms=Number($('#rooms').value)||0,status=$('#status').value;p=p.filter(x=>(!q||[x.name,x.code,x.area,x.type,x.locationDetail,x.license,x.meters,x.landShare,x.delivery,x.payment,x.notes].join(' ').toLowerCase().includes(q))&&(!area||String(x.area).toLowerCase().includes(area))&&Number(x.price||0)>=minP&&Number(x.price||0)<=maxP&&Number(x.size||0)>=minS&&Number(x.size||0)<=maxS&&(!rooms||Number(x.rooms||0)===rooms)&&(!status||x.status===status));props=p;$('#propertyGrid').innerHTML=p.map(x=>`<article class="card property selectable ${selectedPropertyIds.has(Number(x.id))?'selected':''}" onclick="viewProperty(${x.id})" role="button" tabindex="0"><button type="button" class="property-select" onclick="event.stopPropagation();togglePropertySelection(${x.id})" title="اختيار للتقرير"><svg viewBox="0 0 24 24"><path d="M5 12.5 9.5 17 19 7.5"/></svg></button>${x.image_url?`<img src="${x.image_url}" alt="${esc(x.name)}">`:'<div class="ph">DREAM HOUSE</div>'}<div class="body"><div class="code">${esc(x.code||'PROPERTY')}</div><h4>${esc(x.name)}</h4><div class="muted">${esc(x.area)} • ${x.size||'—'} م² • الدور ${esc(x.floor||'—')}</div><div class="muted">${x.rooms||'—'} غرف • ${x.baths||'—'} حمام • ${x.totalFloors?`عدد الأدوار ${x.totalFloors} • `:''}${esc(x.finish||'—')}</div><div class="property-meta-line">${esc(x.locationDetail||'')} ${x.license&&x.license!=='غير محدد'?`• ${esc(x.license)}`:''} ${esc(x.meters||'')}</div><div class="price">${money(x.price)}</div><span class="badge ${x.status!=='متاح'?'red':''}">${esc(x.status)}</span><div class="actions"><button class="btn soft image-save-btn" onclick="event.stopPropagation();savePropertyImage(${x.id})" ${x.image_url?'':'disabled'}><span class="ios-mini-icon">${IOS_ICONS.photo}</span>حفظ الصورة</button><button class="btn dark" onclick="event.stopPropagation();editProperty(${x.id})">تعديل</button><button class="btn danger" onclick="event.stopPropagation();deleteProperty(${x.id})">حذف</button></div></div></article>`).join('')||'<div class="panel empty" style="grid-column:1/-1">لا توجد عقارات مطابقة للبحث</div>';updateSelectedCount();}
$('#cq').addEventListener('input',loadClients);function loadClients(){const q=$('#cq').value.trim().toLowerCase();clients=db().clients.filter(x=>[x.name,x.phone,x.area,x.need].join(' ').toLowerCase().includes(q));$('#clientBody').innerHTML=clients.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td><div class="phone-cell">${esc(x.phone)}${waBtn(x.phone)}</div></td><td>${esc(x.need||'—')}</td><td>${esc(x.area||'—')}</td><td>${money(x.budget)}</td><td><span class="badge gold">${esc(x.status)}</span></td><td><button class="btn soft" onclick="matchClient(${x.id})">مطابقة</button> <button class="btn dark" onclick="editClient(${x.id})">تعديل</button> <button class="btn danger" onclick="deleteClient(${x.id})">حذف</button></td></tr>`).join('')||'<tr><td colspan="7" style="text-align:center">لا توجد بيانات</td></tr>';const cm=$('#clientCards');if(cm)cm.innerHTML=clients.map(x=>`<article class="client-mobile-card"><div class="client-mobile-top"><div><div class="client-mobile-name">${esc(x.name)}</div><div class="client-mobile-phone">${esc(x.phone||'—')}</div></div><span class="badge gold">${esc(x.status||'جديد')}</span></div><div class="client-mobile-grid"><div><span>الطلب</span><b>${esc(x.need||'—')}</b></div><div><span>المنطقة</span><b>${esc(x.area||'—')}</b></div><div><span>الميزانية</span><b>${money(x.budget)}</b></div></div><div class="client-mobile-actions">${x.phone?`<a class="wa-mobile" href="${waHref(x.phone)}" target="_blank" rel="noopener">${WA_SVG} واتساب</a>`:''}<button class="btn dark" onclick="matchClient(${x.id})">مطابقة عقار</button><button class="btn soft" onclick="editClient(${x.id})">تعديل</button><button class="btn danger" onclick="deleteClient(${x.id})">حذف</button></div></article>`).join('')||'<div class="empty">لا توجد بيانات عملاء</div>'}

/* V10 Smart Client Requests — natural Arabic office queries */
function normalizeArabic(v=''){
  return String(v).toLowerCase().replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[إأآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[،,]/g,' ').replace(/\s+/g,' ').trim();
}
function parseMoneyFromRequest(raw){
  const s=normalizeArabic(raw);
  const digit=s.match(/(?:\d+(?:\.\d+)?)\s*(?:مليون|مليونه|مليونين)/i);
  if(digit){
    const n=parseFloat(digit[1]);
    return n*(/مليونين/.test(digit[0])?2000000:1000000);
  }
  const words={
    'نص مليون':500000,'نصف مليون':500000,'مليون':1000000,'مليونين':2000000,'اتنين مليون':2000000,'اثنين مليون':2000000,
    'تلاته مليون':3000000,'ثلاثه مليون':3000000,'ثلاثة مليون':3000000,'تلات مليون':3000000,
    'اربعه مليون':4000000,'اربعة مليون':4000000,'خمس مليون':5000000,'خمسه مليون':5000000,
    'ست مليون':6000000,'سته مليون':6000000,'سبع مليون':7000000,'سبعه مليون':7000000,
    'تمان مليون':8000000,'تمانيه مليون':8000000,'تسع مليون':9000000,'تسعه مليون':9000000,
    'عشره مليون':10000000,'عشرة مليون':10000000,'عشر مليون':10000000
  };
  for(const [k,val] of Object.entries(words)) if(s.includes(normalizeArabic(k))) return val;
  const plain=s.match(/\b\d{3,}(?:\.\d+)?\b/); if(plain) return Number(plain[0]);
  return 0;
}
function requestType(raw){
  const s=normalizeArabic(raw);
  if(/شقق|شقه/.test(s))return 'شقه';
  if(/عمارات|عماره/.test(s))return 'عماره';
  if(/بيوت|بيت/.test(s))return 'بيت';
  if(/فلل|فيلا/.test(s))return 'فيلا';
  if(/محلات|محل/.test(s))return 'محل';
  if(/اراضي|ارض/.test(s))return 'ارض';
  return '';
}
function clientMatchesRequest(c, raw){
  const q=normalizeArabic(raw), type=requestType(q), budget=parseMoneyFromRequest(q), need=normalizeArabic(c.need||'');
  const typeOK=!type||need.includes(type);
  if(!typeOK)return false;
  if(!budget)return true;
  const cb=Number(c.budget||0);
  if(!cb)return false;
  return cb>=budget*0.9 && cb<=budget*1.1;
}
function requestMatchLabel(raw){
  const type=requestType(raw), budget=parseMoneyFromRequest(raw);
  return [type?`نوع: ${type}`:'كل الأنواع',budget?`ميزانية: ${money(budget)}`:'كل الميزانيات'].join('  •  ');
}
function setClientRequest(v){$('#rq').value=v;runClientRequest()}
function runClientRequest(){
  const raw=$('#rq')?.value?.trim()||'';
  const all=db().clients||[];
  const result=raw?all.filter(c=>clientMatchesRequest(c,raw)):all;
  const box=$('#requestResults'),count=$('#rqCount');
  if(count)count.textContent=`${result.length} عميل`;
  if(box)box.innerHTML=result.map((c,i)=>`<div class="request-result"><span class="rq-mark">${String(i+1).padStart(2,'0')}</span><div><b>${esc(c.name||'بدون اسم')}</b><small>${esc(c.need||'—')} • ${esc(c.area||'كل المناطق')} • ${esc(c.phone||'بدون هاتف')}</small></div><span class="rq-budget">${money(c.budget)}</span></div>`).join('')||'<div class="request-empty">لا يوجد عميل مطابق لهذا الطلب. جرّب نوعًا أو ميزانية مختلفة.</div>';
  if(raw)toast(`تم العثور على ${result.length} عميل — ${requestMatchLabel(raw)}`);
}
function loadRequestDesk(){
  const all=db().clients||[],body=$('#requestAllClients');
  if(body)body.innerHTML=all.map(c=>`<tr><td><b>${esc(c.name||'—')}</b></td><td>${esc(c.phone||'—')}</td><td>${esc(c.need||'—')}</td><td>${esc(c.area||'—')}</td><td>${money(c.budget)}</td><td><span class="badge gold">${esc(c.status||'جديد')}</span></td></tr>`).join('')||'<tr><td colspan="6" style="text-align:center">لا توجد بيانات عملاء</td></tr>';
  if($('#rq')&&!$('#rq').value) {$('#rqCount').textContent='0 عميل';$('#requestResults').innerHTML='<div class="request-empty">اكتب طلبًا أو اختر مثالًا جاهزًا للبدء.</div>'}
}
function openProperty(x=null){$('#pmTitle').textContent=x?'تعديل العقار':'إضافة عقار';$('#pf').reset();$('#pf [name=id]').value=x?.id||'';if(x)Object.keys(x).forEach(k=>{const e=$(`#pf [name="${k}"]`);if(e&&k!=='image_url')e.value=x[k]??''});$('#propertyModal').classList.add('show')}
function openClient(x=null){$('#cmTitle').textContent=x?'تعديل العميل':'إضافة عميل';$('#cf').reset();$('#cf [name=id]').value=x?.id||'';if(x)Object.keys(x).forEach(k=>{const e=$(`#cf [name="${k}"]`);if(e)e.value=x[k]??''});$('#clientModal').classList.add('show')}
function closeModal(id){$('#'+id).classList.remove('show')}
function editProperty(id){const x=db().properties.find(p=>p.id===id);if(x)openProperty(x)}function editClient(id){const x=db().clients.find(p=>p.id===id);if(x)openClient(x)}

function closeSheet(){const s=$('#propertySheet');if(!s)return;s.classList.remove('show');s.setAttribute('aria-hidden','true');document.body.classList.remove('sheet-open')}
async function viewProperty(id){
  const p=db().properties.find(x=>Number(x.id)===Number(id)); if(!p)return;
  const sheet=$('#propertySheet'); if(!sheet)return;
  $('#sheetKicker').textContent=p.code||'PROPERTY';
  $('#sheetTitle').textContent=p.name||'عقار';
  $('#sheetLocation').textContent=[p.area,p.locationDetail].filter(Boolean).join(' • ')||'العنوان غير مسجل';
  $('#sheetPrice').textContent=money(p.price);
  $('#sheetStats').innerHTML=[['المساحة',p.size?`${p.size} م²`:'—'],['الغرف',p.rooms||'—'],['الحمامات',p.baths||'—'],['الدور',p.floor||'—']].map(([a,b])=>`<div><small>${a}</small><b>${esc(b)}</b></div>`).join('');
  $('#sheetMeta').innerHTML=[p.finish&&`التشطيب: ${p.finish}`,p.license&&p.license!=='غير محدد'&&`الترخيص: ${p.license}`,p.meters&&`العدادات: ${p.meters}`,p.delivery&&`التسليم: ${p.delivery}`,p.notes&&`ملاحظات: ${p.notes}`].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('');
  const wa=$('#sheetWa'),call=$('#sheetCall');
  if(p.phone){wa.href=waHref(p.phone);wa.style.display='flex';call.href=`tel:${String(p.phone).replace(/\D/g,'')}`;call.style.display='flex'}else{wa.style.display='none';call.style.display='none'}
  $('#sheetPdf').onclick=()=>{closeSheet();report('properties','pdf',[p.id]).catch(()=>toast('تعذر إنشاء PDF للعقار'))};
  $('#sheetEdit').onclick=()=>{closeSheet();editProperty(p.id)};
  const media=$('#sheetMedia'); const src=p.image_url||await getStoredImage(p.id);
  media.innerHTML=src?`<img src="${src}" alt="${esc(p.name||'العقار')}"><div class="sheet-media-shade"></div>`:'<div class="sheet-placeholder"><b>DH</b><span>DREAM HOUSE</span></div>';
  sheet.classList.add('show');sheet.setAttribute('aria-hidden','false');document.body.classList.add('sheet-open');
}
window.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});

function readImage(file){
  return new Promise((resolve,reject)=>{
    if(!file||!file.size)return resolve('');
    if(file.size>20*1024*1024)return reject(new Error('الصورة كبيرة جدًا — اختار صورة أقل من 20MB'));
    const r=new FileReader();
    r.onerror=()=>reject(new Error('تعذر قراءة الصورة'));
    r.onload=()=>{
      const img=new Image();
      img.onload=()=>{
        const max=1100, scale=Math.min(1,max/Math.max(img.width,img.height));
        const c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(img.width*scale));
        c.height=Math.max(1,Math.round(img.height*scale));
        const ctx=c.getContext('2d',{alpha:false});
        ctx.drawImage(img,0,0,c.width,c.height);
        const out=c.toDataURL('image/jpeg',0.62);
        resolve(out);
      };
      img.onerror=()=>reject(new Error('الصورة غير صالحة'));
      img.src=r.result;
    };
    r.readAsDataURL(file);
  });
}
$('#pf').onsubmit=async e=>{e.preventDefault();try{const f=e.target,fd=new FormData(f),d=db(),id=fd.get('id');const file=f.querySelector('[name=image]').files[0];let x=Object.fromEntries(fd.entries());delete x.id;delete x.image;x.size=Number(x.size)||0;x.price=Number(x.price)||0;x.rooms=Number(x.rooms)||0;x.baths=Number(x.baths)||0;x.floor=String(x.floor||'').trim();x.totalFloors=Number(x.totalFloors)||0;let item;if(id){const i=d.properties.findIndex(p=>p.id===Number(id));if(i<0)throw new Error('العقار غير موجود');item={...d.properties[i],...x};d.properties[i]=item}else{item={...x,id:Date.now(),code:x.code||'DH-'+String(d.seq++).padStart(4,'0'),createdAt:new Date().toISOString()};d.properties.push(item)}if(file){const image=await readImage(file);await putStoredImage(item.id,image);item.image_key=String(item.id);delete item.image_url}else if(id){item.image_key=item.image_key||''}if(!saveDB(d))return;closeModal('propertyModal');toast('تم حفظ العقار والصورة بنجاح');loadAll()}catch(err){toast(err.message)}};
$('#cf').onsubmit=e=>{e.preventDefault();const f=e.target,d=db(),id=f.id.value,x=Object.fromEntries(new FormData(f).entries());delete x.id;x.budget=Number(x.budget)||0;x.min_size=Number(x.min_size)||0;x.max_size=Number(x.max_size)||0;x.rooms=Number(x.rooms)||0;if(id){const i=d.clients.findIndex(p=>p.id===Number(id));d.clients[i]={...d.clients[i],...x}}else d.clients.push({...x,id:Date.now(),createdAt:new Date().toISOString()});if(!saveDB(d))return;closeModal('clientModal');toast('تم حفظ العميل بنجاح');loadAll()};
async function deleteProperty(id){if(!confirm('حذف هذا العقار نهائياً؟'))return;selectedPropertyIds.delete(Number(id));const d=db();const old=d.properties.find(x=>x.id===id);d.properties=d.properties.filter(x=>x.id!==id);if(!saveDB(d))return;await deleteStoredImage(id);toast('تم حذف العقار');loadAll()}
function deleteClient(id){if(!confirm('حذف هذا العميل نهائياً؟'))return;const d=db();d.clients=d.clients.filter(x=>x.id!==id);if(!saveDB(d))return;toast('تم حذف العميل');loadAll()}
function matchClient(id){const c=db().clients.find(x=>x.id===id);if(!c)return;$$('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page==='properties'));$$('.section').forEach(x=>x.classList.remove('active'));$('#properties').classList.add('active');$('#pageTitle').textContent='العقارات المطابقة';$('#area').value=c.area||'';$('#maxPrice').value=c.budget||'';$('#minSize').value=c.min_size||'';$('#maxSize').value=c.max_size||'';$('#rooms').value=c.rooms||'';loadProps();toast('تم تطبيق شروط العميل على البحث')}

async function shareOrDownloadFile(file, downloadName, title='DREAM HOUSE'){
  const text='Engineer Ahmed Galal • 01035032020';
  try{
    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
      await navigator.share({title,text:'Engineer Ahmed Galal • 01035032020',files:[file]});
      return 'shared';
    }
  }catch(err){ if(err?.name==='AbortError') return 'cancelled'; }
  const url=URL.createObjectURL(file);
  const a=document.createElement('a');a.href=url;a.download=downloadName;a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
  return 'downloaded';
}
async function savePropertyImage(id){
  const src=await getStoredImage(id); if(!src){toast('لا توجد صورة محفوظة لهذا العقار');return;}
  const p=db().properties.find(x=>Number(x.id)===Number(id));
  try{
    const blob=await (await fetch(src)).blob();
    const ext=blob.type==='image/png'?'png':'jpg';
    const file=new File([blob],`DREAM-HOUSE-${p?.code||id}.${ext}`,{type:blob.type||'image/jpeg'});
    const result=await shareOrDownloadFile(file,file.name,'DREAM HOUSE — Property Image');
    if(result==='shared') toast('تم فتح قائمة المشاركة — اختر «حفظ الصورة» لإضافتها للصور');
    else if(result==='downloaded') toast('تم إرسال الصورة للحفظ — على الآيفون اختر «حفظ في الصور» من المشاركة/الملفات');
  }catch(e){toast('تعذر تجهيز الصورة للحفظ');}
}
async function dhYield(){await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));}
async function canvasToJpegBytes(canvas,quality=.62){
  const blob=await new Promise((resolve,reject)=>{
    let settled=false;
    const done=v=>{if(settled)return;settled=true;v?resolve(v):reject(new Error('تعذر تحويل الصفحة إلى صورة'))};
    try{
      if(typeof canvas.toBlob==='function'){
        canvas.toBlob(done,'image/jpeg',quality);
      }else{
        const data=canvas.toDataURL('image/jpeg',quality);
        fetch(data).then(r=>r.blob()).then(done).catch(()=>done(null));
      }
    }catch(e){done(null)}
    setTimeout(()=>done(null),12000);
  });
  return new Uint8Array(await blob.arrayBuffer());
}
async function report(type, mode='pdf', selectedIds=null){
  const d=db();
  const allProperties=Array.isArray(d.properties)?d.properties:[];
  const clients=Array.isArray(d.clients)?d.clients:[];
  const selectedSet=Array.isArray(selectedIds)?new Set(selectedIds.map(Number)):null;
  const properties=selectedSet
    ? Array.from(selectedSet).map(id=>allProperties.find(p=>Number(p.id)===id)).filter(Boolean)
    : allProperties;
  if(type==='properties' && !properties.length){toast('اختار عقارًا واحدًا على الأقل أولاً');return}
  if(type==='clients' && !clients.length){toast('لا توجد بيانات عملاء للتقرير');return}
  if(type==='properties' && mode==='long-pdf' && properties.length>20){toast('الـPDF الواحد يدعم حتى 20 عقارًا للحفاظ على وضوح التقرير');return}
  if(type==='properties' && mode==='long-image' && properties.length>40){toast('الصورة الواحدة تدعم حتى 40 عقارًا');return}

  const reportNo='DH-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+String(Date.now()).slice(-5);
  const W=794,H=1123,MM=42;
  const C={navy:'#152536',navy2:'#22384c',gold:'#b08a4a',gold2:'#d8bd8a',ivory:'#f5f1e8',paper:'#fffdf9',ink:'#26323a',muted:'#78828c',line:'#ded7ca',green:'#456f59',red:'#98565e'};
  const enc=new TextEncoder();
  const round=(ctx,x,y,w,h,r,fill,stroke)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.stroke()}};
  const line=(ctx,x1,y1,x2,y2,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()};
  const fit=(ctx,str,max,font)=>{ctx.font=font;let s=String(str??'—');while(s.length>2&&ctx.measureText(s).width>max)s=s.slice(0,-2)+'…';return s};
  const moneyLong=v=>Number(v||0)?money(v):'حسب الاتفاق';
  const safeImage=async src=>{
    if(!src)return null;
    return await new Promise(resolve=>{
      const im=new Image(); let done=false;
      const finish=v=>{if(done)return;done=true;resolve(v)};
      im.onload=()=>finish(im);im.onerror=()=>finish(null);im.src=src;
      setTimeout(()=>finish(null),3000);
    });
  };
  const imageFor=async p=>{
    let src=p.image_url||'';
    if(!src&&p.image_key){try{src=await Promise.race([getStoredImage(p.id),new Promise(r=>setTimeout(()=>r(''),2200))])}catch{src=''}}
    return safeImage(src);
  };
  const pageBytes=[];
  const makeCanvas=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c};
  const addPage=async(canvas,index,total)=>{
    toast(`جاري تجهيز العقار ${index} من ${total}…`);
    await dhYield();
    const bytes=await canvasToJpegBytes(canvas,.64);
    if(!bytes||bytes.length<1000)throw new Error('تعذر تجهيز صفحة العقار');
    pageBytes.push(bytes);
    canvas.width=1;canvas.height=1;
    await dhYield();
  };
  const drawHeader=(ctx,section,sub,kind)=>{
    ctx.textBaseline='top';ctx.direction='rtl';ctx.fillStyle=C.ivory;ctx.fillRect(0,0,W,H);
    ctx.fillStyle=C.navy;ctx.fillRect(0,0,W,10);ctx.fillStyle=C.gold;ctx.fillRect(MM,10,105,3);
    ctx.textAlign='left';ctx.fillStyle=C.navy;ctx.font='800 14px Georgia';ctx.fillText('DREAM HOUSE',MM,32);ctx.fillStyle=C.muted;ctx.font='500 8px Arial';ctx.fillText('REAL ESTATE MANAGEMENT',MM,52);
    ctx.textAlign='right';ctx.fillStyle=C.navy;ctx.font='700 10px Arial';ctx.fillText('Engineer Ahmed Galal',W-MM,32);ctx.fillStyle=C.muted;ctx.font='500 8px Arial';ctx.fillText('01035032020',W-MM,52);
    line(ctx,MM,70,W-MM,70,C.line);ctx.textAlign='right';ctx.fillStyle=C.navy;ctx.font='900 19px Arial';ctx.fillText(section,W-MM,95);ctx.fillStyle=C.muted;ctx.font='500 9px Arial';ctx.fillText(sub,W-MM,121);ctx.textAlign='left';ctx.fillStyle=C.gold;ctx.font='700 8px Arial';ctx.fillText(kind,MM,98);
  };
  const drawFooter=(ctx,page,total)=>{line(ctx,MM,H-52,W-MM,H-52,C.line);ctx.textAlign='left';ctx.fillStyle=C.muted;ctx.font='500 7px Arial';ctx.fillText(`DREAM HOUSE • ${reportNo}`,MM,H-36);ctx.textAlign='center';ctx.fillStyle=C.gold;ctx.font='700 7px Arial';ctx.fillText(`${page} / ${total}`,W/2,H-36);ctx.textAlign='right';ctx.fillStyle=C.muted;ctx.font='500 7px Arial';ctx.fillText('Engineer Ahmed Galal • 01035032020',W-MM,H-36)};

  if(type==='properties' && (mode==='long-pdf' || mode==='long-image')){
    // V9 Elite PDF: one property per A4 page, up to 10 photos as a polished contact sheet.
    const MAX_PHOTOS=10;
    const clampText=(ctx,s,max,w,font)=>{
      ctx.font=font; let out=String(s??'');
      if(ctx.measureText(out).width<=w)return out;
      while(out.length>2 && ctx.measureText(out+'…').width>w)out=out.slice(0,-1);
      return out+'…';
    };
    const getPhotos=async(p)=>{
      const raw=[];
      // Photos may live directly on the record OR in the app's IndexedDB image store.
      if(Array.isArray(p.images)) raw.push(...p.images);
      if(Array.isArray(p.photos)) raw.push(...p.photos);
      if(p.image) raw.push(p.image);
      if(p.photo) raw.push(p.photo);
      if(p.image_url) raw.push(p.image_url);
      if(!raw.length && p.image_key){
        try{
          const stored=await getStoredImage(p.id);
          if(stored) raw.push(stored);
        }catch(_){}
      }
      const unique=[...new Set(raw.filter(Boolean))].slice(0,MAX_PHOTOS);
      const imgs=[];
      for(const src of unique){
        try{
          const im=await dhSafeImage(src);
          if(im)imgs.push(im);
        }catch(_){}
      }
      return imgs;
    };
    const drawPhotoCell=(ctx,img,x,y,w,h)=>{
      ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.clip();
      if(img){
        const r=Math.max(w/img.width,h/img.height),iw=img.width*r,ih=img.height*r;
        ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih);
      }else{
        ctx.fillStyle='#eceaf2';ctx.fillRect(x,y,w,h);
        ctx.fillStyle='#8b8799';ctx.font='700 8px Arial';ctx.textAlign='center';
        ctx.fillText('NO PHOTO',x+w/2,y+h/2);
      }
      ctx.restore();
    };
    const drawEliteHeader=(ctx,W,reportNo,pageNo,total)=>{
      ctx.fillStyle='#17152b';ctx.fillRect(0,0,W,18);
      ctx.fillStyle='#8d6a34';ctx.fillRect(58,18,185,5);
      ctx.textAlign='left';ctx.fillStyle='#17152b';ctx.font='900 30px Georgia';
      ctx.fillText('DREAM HOUSE',58,44);
      ctx.fillStyle='#77738b';ctx.font='600 9px Arial';
      ctx.fillText('ELITE PROPERTY DOSSIER • FAYOUM',58,83);
      ctx.textAlign='right';ctx.fillStyle='#17152b';ctx.font='900 15px Arial';
      ctx.fillText('ملف عقاري احترافي',W-58,48);
      ctx.fillStyle='#77738b';ctx.font='600 8px Arial';
      ctx.fillText(`REPORT ${reportNo} • ${pageNo}/${total}`,W-58,73);
    };
    const drawInfoPill=(ctx,label,value,x,y,w)=>{
      ctx.fillStyle='#f7f4ee';ctx.beginPath();ctx.roundRect(x,y,w,42,13);ctx.fill();
      ctx.textAlign='right';ctx.fillStyle='#8d6a34';ctx.font='800 7px Arial';ctx.fillText(label,x+w-11,y+8);
      ctx.fillStyle='#17152b';ctx.font='800 9px Arial';ctx.fillText(clampText(ctx,value,32,w-22,'800 9px Arial'),x+w-11,y+22);
    };

    const drawElitePage=async(p,index,total,reportNo)=>{
      const W=1080,H=1528,canvas=document.createElement('canvas');
      canvas.width=W;canvas.height=H;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fbfaf7';ctx.fillRect(0,0,W,H);ctx.direction='rtl';ctx.textBaseline='top';
      drawEliteHeader(ctx,W,reportNo,index+1,total);

      // Identity band
      ctx.textAlign='right';ctx.fillStyle='#8d6a34';ctx.font='800 9px Arial';
      ctx.fillText(p.code||`PROPERTY ${index+1}`,W-58,105);
      ctx.fillStyle='#17152b';ctx.font='900 27px Arial';
      ctx.fillText(clampText(ctx,p.name||'عقار مميز',W-116,W-116,'900 27px Arial'),W-58,127);
      ctx.fillStyle='#77738b';ctx.font='600 10px Arial';
      ctx.fillText(clampText(ctx,p.locationDetail||p.address||'العنوان غير مسجل',W-116,W-116,'600 10px Arial'),W-58,165);

      // Photo mosaic: exactly up to 10 images
      const imgs=await getPhotos(p);
      const mx=48,my=190,mw=W-96;
      const bigW=435,bigH=305,gap=9,cellW=(mw-bigW-gap)/4,cellH=(305-gap)/2;
      drawPhotoCell(ctx,imgs[0],mx,my,bigW,bigH);
      for(let k=1;k<10;k++){
        const j=k-1,col=j%4,row=Math.floor(j/4);
        drawPhotoCell(ctx,imgs[k],mx+bigW+gap+col*(cellW+gap),my+row*(cellH+gap),cellW,cellH);
      }
      ctx.textAlign='left';ctx.fillStyle='rgba(255,255,255,.92)';ctx.font='800 8px Arial';
      ctx.fillText(`${Math.min(imgs.length,10)}/10 PHOTOS`,mx+14,my+bigH-23);

      // Price + facts
      const top=520;
      ctx.textAlign='right';ctx.fillStyle='#8d6a34';ctx.font='800 8px Arial';ctx.fillText('ASKING PRICE',W-58,top);
      ctx.fillStyle='#17152b';ctx.font='900 25px Arial';ctx.fillText(moneyLong(p.price),W-58,top+20);
      ctx.fillStyle='#77738b';ctx.font='600 8px Arial';ctx.fillText(p.status||'متاح',W-58,top+56);

      const facts=[
        ['المساحة',p.size?`${p.size} م²`:'—'],['النوع',p.type||'—'],['الغرف',p.rooms||'—'],
        ['الحمامات',p.baths||'—'],['الدور',p.floor||'—'],['أدوار العمارة',p.totalFloors||'—'],
        ['التشطيب',p.finish||'—'],['الترخيص',p.license||'—'],['العدادات',p.meters||'—'],
        ['نسبة الأرض',p.landShare||'—'],['التسليم',p.delivery||'—'],['السداد',p.payment||'—']
      ];
      const fw=(W-96-22)/3,fy=590;
      facts.forEach((f,i)=>{
        const c=i%3,r=Math.floor(i/3);
        const x=W-58-c*(fw+11)-fw,y=fy+r*55;
        drawInfoPill(ctx,f[0],String(f[1]),x,y,fw);
      });

      // Description
      const dy=800;
      ctx.textAlign='right';ctx.fillStyle='#8d6a34';ctx.font='800 8px Arial';ctx.fillText('PROPERTY NOTES',W-58,dy);
      ctx.fillStyle='#17152b';ctx.font='800 13px Arial';ctx.fillText('ملاحظات العقار',W-58,dy+22);
      const desc=String(p.notes||p.description||'تفاصيل العقار محفوظة داخل النظام. يمكن مراجعة البيانات والتواصل مع المالك مباشرة من خلال التطبيق.');
      ctx.fillStyle='#5f5b6d';ctx.font='600 10px Arial';
      const words=desc.split(/\s+/);let line='',yy=dy+55,lines=0;
      for(const word of words){
        const test=line?line+' '+word:word;
        if(ctx.measureText(test).width>W-116 && line){ctx.fillText(line,W-58,yy);yy+=18;line=word;if(++lines>=5)break;}
        else line=test;
      }
      if(line&&lines<5)ctx.fillText(line,W-58,yy);

      // Owner / contact
      const by=955;
      ctx.fillStyle='#f3efe6';ctx.fillRect(58,by,W-116,128);
      ctx.textAlign='right';ctx.fillStyle='#8d6a34';ctx.font='800 8px Arial';ctx.fillText('CONTACT & OWNERSHIP',W-82,by+18);
      ctx.fillStyle='#17152b';ctx.font='900 12px Arial';ctx.fillText(`المالك: ${p.owner||'—'}`,W-82,by+42);
      ctx.fillStyle='#5f5b6d';ctx.font='700 9px Arial';ctx.fillText(`الهاتف: ${p.phone||'—'}`,W-82,by+67);
      ctx.fillText(`المسوق: Engineer Ahmed Galal • 01035032020`,W-82,by+91);

      // Premium closing panel
      const cy=1125;
      ctx.fillStyle='#17152b';ctx.beginPath();ctx.roundRect(58,cy,W-116,360,24);ctx.fill();
      ctx.textAlign='right';ctx.fillStyle='#d6b57a';ctx.font='900 10px Arial';ctx.fillText('DREAM HOUSE SIGNATURE',W-88,cy+30);
      ctx.fillStyle='#fff';ctx.font='900 20px Arial';ctx.fillText('كل عقار يستحق عرضًا يليق به.',W-88,cy+68);
      ctx.fillStyle='#c8c3d2';ctx.font='600 9px Arial';ctx.fillText('هذا الملف تم إنشاؤه من منصة DREAM HOUSE لإدارة وتسويق العقارات.',W-88,cy+103);
      ctx.fillStyle='#fff';ctx.font='800 12px Arial';ctx.fillText('01035032020',W-88,cy+151);
      ctx.fillStyle='#d6b57a';ctx.font='800 8px Arial';ctx.fillText('PROPERTY MANAGEMENT • SALES • MARKETING',W-88,cy+181);

      line(ctx,58,H-48,W-58,H-48,'#ded9d0');
      ctx.textAlign='left';ctx.fillStyle='#77738b';ctx.font='600 8px Arial';ctx.fillText(`DREAM HOUSE • ${reportNo}`,58,H-34);
      ctx.textAlign='right';ctx.fillText('بيانات تسويقية • يرجى مراجعة التفاصيل قبل النشر',W-58,H-34);
      return canvas;
    };

    const pages=[];
    for(let i=0;i<properties.length;i++){
      const c=await drawElitePage(properties[i],i,properties.length,reportNo);
      pages.push(await canvasToJpegBytes(c,.76));
      toast(`جاري تجهيز PDF احترافي: ${i+1} من ${properties.length}…`);
      await dhYield();
    }
    if(mode==='long-image'){
      // Long image remains available: stack A4 pages vertically into one image.
      const W=1080, gap=22, H=pages.length*1528+(pages.length-1)*gap;
      const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#fbfaf7';ctx.fillRect(0,0,W,H);
      for(let i=0;i<pages.length;i++){
        const blob=new Blob([pages[i],],{type:'image/jpeg'});
        const url=URL.createObjectURL(blob);const img=await dhSafeImage(url);URL.revokeObjectURL(url);
        ctx.drawImage(img,0,i*(1528+gap));
      }
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('تعذر إنشاء الصورة')),'image/jpeg',.9));
      const url=URL.createObjectURL(blob);await saveSingleImage(blob,`DREAM-HOUSE-${reportNo}-ELITE.jpg`,url);return;
    }
    const pdfBlob=buildImagePdfPages(pages,1080,1528,enc);
    const url=URL.createObjectURL(pdfBlob);
    await saveSinglePdf(pdfBlob,`DREAM-HOUSE-${reportNo}-ELITE.pdf`,url);return;
  }

  if(type==='properties'){
    const totalPages=properties.length;
    for(let i=0;i<properties.length;i++){
      const p=properties[i];const c=makeCanvas(),x=c.getContext('2d');
      drawHeader(x,'ملف العقار',`العقار ${i+1} من ${totalPages}`,'PROPERTY REPORT');
      const y=154;round(x,MM,y,W-MM*2,770,16,C.paper,C.line);
      const img=await imageFor(p);
      const imgX=MM+14,imgY=y+14,imgW=300,imgH=742;
      if(img){x.save();x.beginPath();x.roundRect(imgX,imgY,imgW,imgH,12);x.clip();const ratio=Math.max(imgW/img.width,imgH/img.height),iw=img.width*ratio,ih=img.height*ratio;x.drawImage(img,imgX+(imgW-iw)/2,imgY+(imgH-ih)/2,iw,ih);x.restore()}
      else{round(x,imgX,imgY,imgW,imgH,12,C.navy2);x.textAlign='center';x.fillStyle=C.gold2;x.font='800 28px Georgia';x.fillText('DREAM HOUSE',imgX+imgW/2,imgY+imgH/2-10);x.fillStyle='#c8d0d6';x.font='600 9px Arial';x.fillText('PROPERTY IMAGE',imgX+imgW/2,imgY+imgH/2+28)}
      const rx=MM+334,rw=W-MM-rx-14;x.textAlign='right';x.fillStyle=C.gold;x.font='700 8px Arial';x.fillText(p.code||'PROPERTY',rx+rw,y+26);
      x.fillStyle=C.navy;x.font='900 23px Arial';x.fillText(fit(x,p.name||'عقار',rw,'900 23px Arial'),rx+rw,y+58);
      x.fillStyle=C.muted;x.font='600 9px Arial';x.fillText(fit(x,`${p.area||'—'} • ${p.type||'عقار'} • ${p.locationDetail||'—'}`,rw,'600 9px Arial'),rx+rw,y+89);
      x.fillStyle=C.gold;x.font='900 17px Arial';x.fillText(moneyLong(p.price),rx+rw,y+119);
      const rows=[
        ['المساحة',p.size?`${p.size} م²`:'—'],['الغرف',p.rooms||'—'],['الحمامات',p.baths||'—'],['الدور',p.floor||'—'],['أدوار العمارة',p.totalFloors||'—'],['التشطيب',p.finish||'—'],['الترخيص',p.license||'—'],['العدادات',p.meters||'—'],['نسبة الأرض',p.landShare||'—'],['التسليم',p.delivery||'—'],['طريقة السداد',p.payment||'—'],['الحالة',p.status||'—']
      ];
      const top=185, rowH=42;
      rows.forEach((r,j)=>{const yy=top+j*rowH;line(x,rx,yy+30,rx+rw,yy+30,C.line);x.fillStyle=C.muted;x.font='600 8px Arial';x.fillText(r[0],rx+rw,yy);x.fillStyle=C.ink;x.font='800 10px Arial';x.fillText(fit(x,r[1],rw-92,'800 10px Arial'),rx+rw-92,yy)});
      const noteY=top+rows.length*rowH+10;round(x,rx,noteY,rw,100,10,C.ivory,C.line);x.fillStyle=C.gold;x.font='800 8px Arial';x.fillText('ملاحظات',rx+rw-14,noteY+13);x.fillStyle=C.ink;x.font='600 8px Arial';
      const note=String(p.notes||'لا توجد ملاحظات إضافية');let n1=fit(x,note,rw-28,'600 8px Arial');x.fillText(n1,rx+rw-14,noteY+38);
      x.fillStyle=C.muted;x.font='600 7px Arial';x.fillText(fit(x,`العنوان: ${p.locationDetail||p.area||'—'}`,rw-28,'600 7px Arial'),rx+rw-14,noteY+61);
      x.fillText(fit(x,`المالك: ${p.owner||'—'} • ${p.phone||'—'}`,rw-28,'600 7px Arial'),rx+rw-14,noteY+78);
      drawFooter(x,i+1,totalPages);await addPage(c,i+1,totalPages);
    }
  } else if(type==='clients'){
    const totalPages=Math.max(1,clients.length);
    for(let i=0;i<clients.length;i++){
      const c=makeCanvas(),x=c.getContext('2d'),cl=clients[i];drawHeader(x,'ملف العميل',`العميل ${i+1} من ${clients.length}`,'CLIENT REPORT');
      const y=154;round(x,MM,y,W-MM*2,770,16,C.paper,C.line);x.textAlign='right';x.fillStyle=C.gold;x.font='700 8px Arial';x.fillText('CLIENT PROFILE',W-MM-20,y+26);x.fillStyle=C.navy;x.font='900 24px Arial';x.fillText(fit(x,cl.name||'عميل',500,'900 24px Arial'),W-MM-20,y+65);x.fillStyle=C.gold;x.font='800 13px Arial';x.fillText(cl.phone||'—',W-MM-20,y+105);
      const rows=[['الطلب',cl.need||'—'],['المنطقة',cl.area||'—'],['الميزانية',moneyLong(cl.budget)],['المساحة',`${cl.min_size||'—'} - ${cl.max_size||'—'} م²`],['الغرف',cl.rooms||'—'],['الحالة',cl.status||'جديد'],['ملاحظات',cl.notes||'—']];rows.forEach((r,j)=>{const yy=y+160+j*58;line(x,MM+20,yy+36,W-MM-20,yy+36,C.line);x.fillStyle=C.muted;x.font='600 8px Arial';x.fillText(r[0],W-MM-20,yy);x.fillStyle=C.ink;x.font='800 11px Arial';x.fillText(fit(x,r[1],420,'800 11px Arial'),W-MM-115,yy)});drawFooter(x,i+1,totalPages);await addPage(c,i+1,totalPages);
    }
  } else {
    toast('اختار نوع التقرير أولاً');return;
  }

  const objects=['<< /Type /Catalog /Pages 2 0 R >>',''];const binaries=[];let objNum=3;const refs=[];
  for(let i=0;i<pageBytes.length;i++){
    const page=objNum,content=objNum+1,image=objNum+2;objNum+=3;refs.push({page,content,image});
    const stream='q 595 0 0 842 0 0 cm /Im1 Do Q';
    objects[page-1]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im1 ${image} 0 R >> >> /Contents ${content} 0 R >>`;
    objects[content-1]=`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}\nendstream`;
    binaries[image-1]={header:`<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pageBytes[i].length} >>`,bytes:pageBytes[i]};
  }
  objects[1]=`<< /Type /Pages /Kids [${refs.map(r=>r.page+' 0 R').join(' ')}] /Count ${refs.length} >>`;
  const header=enc.encode('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');let total=header.length;const parts=[header],offsets=[0],maxObj=objNum-1;
  for(let n=1;n<=maxObj;n++){offsets[n]=total;const h=enc.encode(`${n} 0 obj\n`);parts.push(h);total+=h.length;const bi=binaries[n-1];if(bi){const bh=enc.encode(bi.header+'\nstream\n');parts.push(bh);total+=bh.length;parts.push(bi.bytes);total+=bi.bytes.length;const bt=enc.encode('\nendstream\nendobj\n');parts.push(bt);total+=bt.length}else{const ob=enc.encode((objects[n-1]||'')+'\nendobj\n');parts.push(ob);total+=ob.length}}
  const xref=total;let xr=`xref\n0 ${maxObj+1}\n0000000000 65535 f \n`;for(let n=1;n<=maxObj;n++)xr+=String(offsets[n]).padStart(10,'0')+' 00000 n \n';xr+=`trailer\n<< /Size ${maxObj+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;parts.push(enc.encode(xr));
  const blob=new Blob(parts,{type:'application/pdf'});if(!blob.size)throw new Error('تعذر إنشاء ملف PDF');
  const filename=`DREAM-HOUSE-${reportNo}.pdf`;const url=URL.createObjectURL(blob);
  window.__dhPdfUrl=url;window.__dhPdfFilename=filename;window.__dhPdfBlob=blob;
  await saveSinglePdf(blob,filename,url);
}

async function saveSingleImage(blob,filename,url){
  try{const file=new File([blob],filename,{type:'image/jpeg'});if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){await navigator.share({title:'DREAM HOUSE — Property Collection',text:'Engineer Ahmed Galal • 01035032020',files:[file]});toast('تم تجهيز صورة واحدة للعقارات المحددة');return;}}catch(err){if(err?.name==='AbortError'){toast('تم إلغاء الحفظ');return;}}
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();toast('تم تنزيل صورة واحدة للعقارات المحددة');
}
function buildSingleImagePdf(jpegBytes,pageW,pageH,enc){
  const header=enc.encode('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');const parts=[header];let total=header.length;const offsets=[0];
  offsets[1]=total;let b=enc.encode('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');parts.push(b);total+=b.length;
  offsets[2]=total;b=enc.encode('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');parts.push(b);total+=b.length;
  offsets[3]=total;b=enc.encode(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`);parts.push(b);total+=b.length;
  const stream=`q ${pageW} 0 0 ${pageH} 0 0 cm /Im1 Do Q`;offsets[4]=total;b=enc.encode(`4 0 obj\n<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}\nendstream\nendobj\n`);parts.push(b);total+=b.length;
  offsets[5]=total;b=enc.encode(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width 1200 /Height ${Math.max(1,Math.round(pageH*1200/pageW))} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);parts.push(b);total+=b.length;parts.push(jpegBytes);total+=jpegBytes.length;b=enc.encode('\nendstream\nendobj\n');parts.push(b);total+=b.length;
  const xref=total;let xr='xref\n0 6\n0000000000 65535 f \n';for(let n=1;n<=5;n++)xr+=String(offsets[n]).padStart(10,'0')+' 00000 n \n';xr+=`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;parts.push(enc.encode(xr));return new Blob(parts,{type:'application/pdf'});
}

function buildImagePdfPages(pageBytes,imgW,imgH,enc){
  const pageW=595,pageH=842;const header=enc.encode('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');const parts=[header];let total=header.length;const offsets=[0];
  const objects=['<< /Type /Catalog /Pages 2 0 R >>',''];const binaries=[];let objNum=3;const refs=[];
  for(let i=0;i<pageBytes.length;i++){
    const page=objNum,content=objNum+1,image=objNum+2;objNum+=3;refs.push(page);
    const stream=`q ${pageW} 0 0 ${pageH} 0 0 cm /Im1 Do Q`;
    objects[page-1]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im1 ${image} 0 R >> >> /Contents ${content} 0 R >>`;
    objects[content-1]=`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}\nendstream`;
    binaries[image-1]={header:`<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pageBytes[i].length} >>`,bytes:pageBytes[i]};
  }
  objects[1]=`<< /Type /Pages /Kids [${refs.map(r=>r+' 0 R').join(' ')}] /Count ${refs.length} >>`;
  const maxObj=objNum-1;
  for(let n=1;n<=maxObj;n++){
    offsets[n]=total;const h=enc.encode(`${n} 0 obj\n`);parts.push(h);total+=h.length;const bi=binaries[n-1];
    if(bi){const bh=enc.encode(bi.header+'\nstream\n');parts.push(bh);total+=bh.length;parts.push(bi.bytes);total+=bi.bytes.length;const bt=enc.encode('\nendstream\nendobj\n');parts.push(bt);total+=bt.length;}
    else{const ob=enc.encode((objects[n-1]||'')+'\nendobj\n');parts.push(ob);total+=ob.length;}
  }
  const xref=total;let xr=`xref\n0 ${maxObj+1}\n0000000000 65535 f \n`;for(let n=1;n<=maxObj;n++)xr+=String(offsets[n]).padStart(10,'0')+' 00000 n \n';xr+=`trailer\n<< /Size ${maxObj+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;parts.push(enc.encode(xr));return new Blob(parts,{type:'application/pdf'});
}

async function saveSinglePdf(blob,filename,url){
  if(!blob||!blob.size)throw new Error('تعذر إنشاء ملف PDF');
  const isAppleMobile=/iPhone|iPad|iPod/i.test(navigator.userAgent||'');
  // First choice on iPhone/iPad: native share sheet with the actual PDF file.
  if(isAppleMobile && navigator.share){
    try{
      const file=new File([blob],filename,{type:'application/pdf'});
      const can=typeof navigator.canShare!=='function' || navigator.canShare({files:[file]});
      if(can){
        await navigator.share({title:'DREAM HOUSE — Property Report',text:'بيان عقاري من DREAM HOUSE • Engineer Ahmed Galal • 01035032020',files:[file]});
        toast('تم تجهيز PDF — اختر حفظ في الملفات');
        return true;
      }
    }catch(err){
      if(err?.name==='AbortError'){toast('تم إلغاء الحفظ');return false;}
    }
  }
  // Reliable browser fallback: create a real anchor and open the Blob URL in a new tab.
  try{
    const a=document.createElement('a');
    a.href=url;a.target='_blank';a.rel='noopener';a.download=filename;
    a.style.position='fixed';a.style.left='-9999px';document.body.appendChild(a);a.click();a.remove();
    toast(isAppleMobile?'تم فتح معاينة PDF — اضغط مشاركة ثم حفظ في الملفات':'تم تجهيز ملف PDF واحد');
    return true;
  }catch(err){}
  try{window.location.href=url;return true}catch(err){}
  throw new Error('تعذر فتح ملف PDF على هذا الجهاز');
}


// V12 safety net: never leave report actions in a silent failed state.
window.addEventListener('error',e=>{
  const msg=String(e?.error?.message||e?.message||'');
  if(msg && /PDF|canvas|Blob|quota|memory/i.test(msg)) toast('حصل خطأ بسيط أثناء تجهيز الملف — جرّب مرة أخرى');
});
window.addEventListener('unhandledrejection',e=>{
  const msg=String(e?.reason?.message||e?.reason||'');
  if(/PDF|canvas|Blob|quota|memory/i.test(msg)) toast('تعذر تجهيز الملف. تأكد من وجود مساحة ثم حاول مرة أخرى');
});

// SIGNATURE V6 — installable-app polish and command palette behavior.
(function(){
  const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  document.documentElement.classList.toggle('is-standalone',isStandalone);
  let deferredInstall=null;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;showInstallHint()});
  function showInstallHint(){
    if(isStandalone||document.querySelector('.install-card'))return;
    const card=document.createElement('div');card.className='install-card';card.innerHTML='<div class="install-mark">DH</div><div><b>ثبّت DREAM HOUSE كتطبيق</b><small>وصول أسرع • شاشة كاملة • تجربة أقرب للتطبيق</small></div><button type="button" class="install-now">تثبيت</button><button type="button" class="install-close">×</button>';
    document.body.appendChild(card);
    card.querySelector('.install-close').onclick=()=>card.remove();
    card.querySelector('.install-now').onclick=async()=>{if(deferredInstall){deferredInstall.prompt();try{await deferredInstall.userChoice}catch{}deferredInstall=null;card.remove()}else{toast('على iPhone: Safari ← مشاركة ← إضافة إلى الشاشة الرئيسية');}};
  }
  window.addEventListener('appinstalled',()=>{document.querySelector('.install-card')?.remove();toast('تم تثبيت DREAM HOUSE كتطبيق');});
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.querySelector('[data-page=properties]')?.click();setTimeout(()=>document.querySelector('#q')?.focus(),80)}});
})();

// Quality-of-life safeguards

document.addEventListener('keydown',e=>{
  if(e.key==='Escape') document.querySelectorAll('.modal.show').forEach(m=>m.classList.remove('show'));
});
document.querySelectorAll('.modal').forEach(m=>{
  m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('show')});
});
window.addEventListener('storage',e=>{
  if(e.key===KEY){try{loadAll()}catch{}}
});

function backupData(){
  const blob=new Blob([JSON.stringify(db(),null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='DREAM_HOUSE_Backup_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast('تم تنزيل النسخة الاحتياطية');
}
function restoreData(input){
  const file=input.files?.[0]; if(!file)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(!Array.isArray(d.properties)||!Array.isArray(d.clients))throw new Error();
      d.seq=Number(d.seq)||1;
      if(confirm('سيتم استبدال البيانات الحالية بهذه النسخة. هل تريد المتابعة؟')){
        if(!saveDB(d))return;
        loadAll();toast('تم استرجاع البيانات بنجاح');
      }
    }catch{toast('ملف النسخة الاحتياطية غير صالح')}
    input.value='';
  };
  r.onerror=()=>{toast('تعذر قراءة ملف النسخة الاحتياطية');input.value=''};
  r.readAsText(file);
}


// SIGNATURE ULTIMATE — iOS-inspired SVG navigation icons.
(function(){
 const icons={
  dashboard:'<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10.5V19h11v-8.5"/><path d="M10 19v-5h4v5"/>',
  properties:'<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 19v-6h8v6M8 9h.01M12 9h.01M16 9h.01"/>',
  clients:'<circle cx="12" cy="8" r="3"/><path d="M5 19c.8-3.2 3.1-5 7-5s6.2 1.8 7 5"/>',
  reports:'<path d="M6 19V9M12 19V5M18 19v-7"/><path d="M4 19h16"/>',
  logout:'<path d="M9 5H5v14h4"/><path d="M13 8l4 4-4 4M9 12h8"/>'
 };
 document.querySelectorAll('.nav button').forEach(btn=>{
   const key=btn.dataset.page;
   if(!icons[key]||btn.querySelector('.nav-icon'))return;
   const label=btn.textContent.trim();
   btn.innerHTML='<span class="nav-icon"><svg viewBox="0 0 24 24" aria-hidden="true">'+icons[key]+'</svg></span><span>'+label+'</span>';
 });
 const out=document.querySelector('#logout');
 if(out&&!out.querySelector('.logout-icon')){const label=out.textContent.trim();out.innerHTML='<span class="logout-icon"><svg viewBox="0 0 24 24" aria-hidden="true">'+icons.logout+'</svg></span><span>'+label+'</span>'}
})();

// APEX polish: keep the authentication surface English-only and icon-first.
(function(){
  const t=document.querySelector('#togglePassword');
  if(t){
    t.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
    t.onclick=()=>{const p=document.querySelector('#password');const show=p.type==='password';p.type=show?'text':'password';t.classList.toggle('is-open',show)};
  }
})();

setTimeout(()=>{const r=$('#rq');if(r)r.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runClientRequest()}})},0);


/* V13 mobile keyboard safety: keep focused fields visible on iOS Safari. */
(function(){
  const scrollFocused=()=>{
    const el=document.activeElement;
    if(!el || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    setTimeout(()=>{ try{ el.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'}); }catch{} },120);
  };
  document.addEventListener('focusin',scrollFocused,{passive:true});
  if(window.visualViewport){
    let t;
    window.visualViewport.addEventListener('resize',()=>{
      clearTimeout(t); t=setTimeout(()=>{const el=document.activeElement;if(el&&/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))scrollFocused()},120)
    },{passive:true});
  }
})();

/* V7 native interaction layer */
(function(){
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,.btn,.icon-tile,.featured-property,.property');
    if(!b || b.disabled) return;
    if(navigator.vibrate) try{navigator.vibrate(8)}catch{}
  },{passive:true});
  document.addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){
      e.preventDefault();document.querySelector('[data-page="properties"]')?.click();setTimeout(()=>$('#q')?.focus(),120);
    }
  });
})();

/* DREAM HOUSE V9 dashboard stats */
(function(){
  function dhStats(){
    try{
      const p=(typeof properties!=='undefined' && Array.isArray(properties))?properties:[];
      const c=(typeof clients!=='undefined' && Array.isArray(clients))?clients:[];
      const ep=document.getElementById('dhStatProperties'), ec=document.getElementById('dhStatClients');
      if(ep)ep.textContent=p.length;
      if(ec)ec.textContent=c.length;
      const er=document.getElementById('dhStatReports');if(er)er.textContent='PDF';
    }catch(e){}
  }
  window.addEventListener('load',()=>setTimeout(dhStats,250));
  setInterval(dhStats,2000);
})();

async function dhSafeImage(src){
  try{
    if(!src)return null;
    return await loadImage(src);
  }catch(e){
    return null;
  }
}

/* V10 PDF data guards */
(function(){
  if(typeof window.__DH_PDF_MAX_PHOTOS==='undefined') window.__DH_PDF_MAX_PHOTOS=10;
})();

(function markReportButtons(){
  document.querySelectorAll('button').forEach(b=>{
    const t=(b.textContent||'').trim();
    if(/PDF|تقرير|تقارير/.test(t)) b.setAttribute('data-report-action','1');
  });
})();
