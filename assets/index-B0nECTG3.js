(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`};function t(t){return String(t).replace(/[&<>"']/g,t=>e[t]??t)}function n(e){return(e/1e3).toFixed(2)}function r(e){return e===null?`—`:`${e}%`}var i=(e,t=``)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" ${t}>${e}</svg>`,a={today:i(`<path d="M5 4h14v17H5z"/><path d="M9 2v4M15 2v4M5 9h14"/><path d="M9 14.5l2 2 4-4"/>`),water:i(`<path d="M12 3.5c3.5 4.5 6 8 6 11a6 6 0 0 1-12 0c0-3 2.5-6.5 6-11z"/>`),history:i(`<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/><path d="M12 8v4.5l3 2"/>`),dashboard:i(`<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/>`),stats:i(`<path d="M3 20h18"/><path d="M4 16l5-6 4 3 7-8"/><circle cx="9" cy="10" r="0.6" fill="currentColor"/><circle cx="13" cy="13" r="0.6" fill="currentColor"/>`),gear:i(`<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><path d="M14 4.5v5h4v-5zM6 14.5v5h4v-5z"/>`),chevronDown:i(`<path d="M6 9l6 6 6-6"/>`),chevronRight:i(`<path d="M9 6l6 6-6 6"/>`),chevronLeft:i(`<path d="M15 6l-6 6 6 6"/>`),up:i(`<path d="M12 19V5M6 11l6-6 6 6"/>`),down:i(`<path d="M12 5v14M6 13l6 6 6-6"/>`),plus:i(`<path d="M12 5v14M5 12h14"/>`),trash:i(`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>`),pencil:i(`<path d="M4 20h4L19 9l-4-4L4 16z"/>`),close:i(`<path d="M6 6l12 12M18 6L6 18"/>`),download:i(`<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>`),upload:i(`<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>`),done:i(`<path d="M5 12.5l4.5 4.5L19 7.5"/>`,`stroke-width="2"`),partial:i(`<path d="M6 12h12"/>`,`stroke-width="2"`),missed:i(`<path d="M7 7l10 10M17 7L7 17"/>`,`stroke-width="2"`)},o,s,c,l,u=0,d=null,f=null;function p(e){e.insertAdjacentHTML(`beforeend`,`<div class="sheet" id="sheet" aria-hidden="true">
       <div class="sheet__scrim" data-action="sheet-close"></div>
       <div class="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
         <div class="sheet__grip" aria-hidden="true"></div>
         <div class="sheet__head">
           <h2 class="sheet__title" id="sheet-title"></h2>
           <button class="icon-btn" data-action="sheet-close" aria-label="بستن">${a.close}</button>
         </div>
         <div id="sheet-body"></div>
       </div>
     </div>
     <div class="toast" id="toast" role="status" aria-live="polite"></div>`),o=e.querySelector(`#sheet`),s=e.querySelector(`#sheet-body`),c=e.querySelector(`#sheet-title`),l=e.querySelector(`#toast`),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&m()&&g()})}function m(){return o.classList.contains(`is-open`)}function h(e,t,n={}){d=document.activeElement instanceof HTMLElement?document.activeElement:null,f=n.onClose??null,c.textContent=e,s.innerHTML=t,o.classList.add(`is-open`),o.setAttribute(`aria-hidden`,`false`),document.body.style.overflow=`hidden`;let r=s.querySelector(`[autofocus], input, textarea, select, button`);return window.setTimeout(()=>r?.focus({preventScroll:!0}),60),s}function ee(e){return s.innerHTML=e,s}function g(){if(!m())return;o.classList.remove(`is-open`),o.setAttribute(`aria-hidden`,`true`),document.body.style.overflow=``;let e=f;f=null,e?.(),d?.focus({preventScroll:!0})}function _(e,t=2600){window.clearTimeout(u),l.textContent=e,l.classList.add(`is-visible`),u=window.setTimeout(()=>l.classList.remove(`is-visible`),t)}function te(e,n,r,i=!1){return new Promise(a=>{let o=!1,s=e=>{o||(o=!0,a(e))};h(e,`<div data-confirm-root>
         <p class="muted" style="margin:0 0 20px">${t(n)}</p>
         <div class="btn-row">
           <button class="btn ${i?`btn--danger`:`btn--primary`}" data-confirm="yes">${t(r)}</button>
           <button class="btn btn--ghost" data-confirm="no">انصراف</button>
         </div>
       </div>`,{onClose:()=>s(!1)}).querySelector(`[data-confirm-root]`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-confirm]`);t&&(s(t.dataset.confirm===`yes`),g())})})}var ne=!1;function re(){if(!(`serviceWorker`in navigator))return;let e=!1;navigator.serviceWorker.addEventListener(`controllerchange`,()=>{ne&&!e&&(e=!0,window.location.reload())}),window.addEventListener(`load`,()=>{navigator.serviceWorker.register(`./sw.js`,{scope:`./`}).then(e=>{let t=e=>ie(e);e.waiting&&navigator.serviceWorker.controller&&t(e.waiting),e.addEventListener(`updatefound`,()=>{let n=e.installing;n&&n.addEventListener(`statechange`,()=>{n.state===`installed`&&navigator.serviceWorker.controller&&t(n)})}),document.addEventListener(`visibilitychange`,()=>{document.visibilityState===`visible`&&e.update().catch(()=>void 0)})}).catch(()=>{})})}function ie(e){if(document.getElementById(`update-bar`))return;let t=document.createElement(`div`);t.id=`update-bar`,t.className=`banner settings-row`,t.style.cssText=`position:fixed;inset-inline:16px;top:72px;z-index:40;background:var(--charcoal);max-width:448px;margin:0 auto`,t.innerHTML=`<span>نسخه‌ی تازه‌ی اپ آماده است.</span>
    <button class="btn btn--primary" style="min-height:36px;padding:6px 14px">به‌روزرسانی</button>`,t.querySelector(`button`).addEventListener(`click`,()=>{ne=!0,e.postMessage({type:`SKIP_WAITING`}),_(`در حال به‌روزرسانی…`)}),document.body.appendChild(t)}var v=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178],y=(e,t)=>Math.trunc(e/t),b=(e,t)=>e-Math.trunc(e/t)*t;function ae(e){let t=v[0],n=v[v.length-1];if(e<t||e>=n)throw RangeError(`Jalali year out of supported range: ${e}`);let r=e+621,i=-14,a=t,o=0;for(let t=1;t<v.length;t+=1){let n=v[t];if(o=n-a,e<n)break;i=i+y(o,33)*8+y(b(o,33),4),a=n}let s=e-a;i=i+y(s,33)*8+y(b(s,33)+3,4),b(o,33)===4&&o-s===4&&(i+=1);let c=y(r,4)-y((y(r,100)+1)*3,4)-150,l=20+i-c;o-s<6&&(s=s-o+y(o+4,33)*33);let u=b(b(s+1,33)-1,4);return u===-1&&(u=4),{leap:u,gy:r,march:l}}function x(e,t,n){let r=y((e+y(t-8,6)+100100)*1461,4)+y(153*b(t+9,12)+2,5)+n-34840408;return r=r-y(y(e+100100+y(t-8,6),100)*3,4)+752,r}function oe(e){let t=4*e+139361631;t=t+y(y(4*e+183187720,146097)*3,4)*4-3908;let n=y(b(t,1461),4)*5+308,r=y(b(n,153),5)+1,i=b(y(n,153),12)+1;return{gy:y(t,1461)-100100+y(8-i,6),gm:i,gd:r}}function se(e,t,n){let r=ae(e);return x(r.gy,3,r.march)+(t-1)*31-y(t,7)*(t-7)+n-1}function ce(e){let t=oe(e).gy,n=t-621,r=ae(n),i=e-x(t,3,r.march);if(i>=0){if(i<=185)return{jy:n,jm:1+y(i,31),jd:b(i,31)+1};i-=186}else--n,i+=179,r.leap===1&&(i+=1);return{jy:n,jm:7+y(i,30),jd:b(i,30)+1}}function le(e){return ae(e).leap===0}function ue(e,t){if(t<1||t>12)throw RangeError(`Invalid Jalali month: ${t}`);return t<=6?31:t<=11||le(e)?30:29}function de(e){return b(e+2,7)}var S=[`فروردین`,`اردیبهشت`,`خرداد`,`تیر`,`مرداد`,`شهریور`,`مهر`,`آبان`,`آذر`,`دی`,`بهمن`,`اسفند`],fe=[`شنبه`,`یکشنبه`,`دوشنبه`,`سه‌شنبه`,`چهارشنبه`,`پنجشنبه`,`جمعه`],pe=[`ش`,`ی`,`د`,`س`,`چ`,`پ`,`ج`],me=/^(\d{4})-(\d{2})-(\d{2})$/,C=e=>String(e).padStart(2,`0`);function w(e){if(typeof e!=`string`)return!1;let t=me.exec(e);if(!t)return!1;let n=Number(t[1]),r=Number(t[2]),i=Number(t[3]);return r<1||r>12||i<1||i>31?!1:D(x(n,r,i))===e}function he(e){return`${e.getFullYear()}-${C(e.getMonth()+1)}-${C(e.getDate())}`}function T(e=new Date){return he(e)}function E(e){let t=me.exec(e);if(!t)throw RangeError(`Invalid day key: ${e}`);return x(Number(t[1]),Number(t[2]),Number(t[3]))}function D(e){let{gy:t,gm:n,gd:r}=oe(e);return`${t}-${C(n)}-${C(r)}`}function ge(e,t){return D(E(e)+t)}function O(e){return ce(E(e))}function _e(e){return de(E(e))}function k(e){let{jy:t,jm:n}=O(e);return{jy:t,jm:n}}function ve(e){let t=ue(e.jy,e.jm),n=se(e.jy,e.jm,1);return Array.from({length:t},(e,t)=>D(n+t))}function ye(e,t){let n=e.jy*12+(e.jm-1)+t;return{jy:Math.floor(n/12),jm:n%12+1}}function A(e,t){return e.jy*12+e.jm-(t.jy*12+t.jm)}function j(e){return`${S[e.jm-1]} ${e.jy}`}function M(e){let{jy:t,jm:n,jd:r}=O(e);return`${fe[_e(e)]}، ${r} ${S[n-1]} ${t}`}function be(e){let{jm:t,jd:n}=O(e);return`${fe[_e(e)]}، ${n} ${S[t-1]}`}function xe(e){let{jm:t,jd:n}=O(e);return`${n} ${S[t-1]}`}function Se(e,t){let n=E(e),r=E(t),i=[];for(let e=n;e<=r;e+=1)i.push(D(e));return i}var N=[{id:`morning`,index:`01`,label:`MORNING`,title:`روتین صبح`},{id:`day`,index:`02`,label:`DAYTIME`,title:`طول روز و سیستم‌ها`},{id:`night`,index:`03`,label:`EVENING`,title:`روتین شب`}],P={taskName:60,taskNote:120,containerName:40,containerMinMl:10,containerMaxMl:5e3,goalMaxMl:1e4,journal:5e3};function Ce(e,t,n,r){if(!e.tasks.some(e=>e.id===n))return;let i=Ee(e,t);r===null?delete i.tasks[n]:i.tasks[n]=r,I(e,t)}function we(e,t,n){let r=Ee(e,t);r.journal=n.slice(0,P.journal),I(e,t)}function Te(){return{tasks:{},water:{},journal:``}}function F(e,t){return e.days[t]??Te()}function Ee(e,t){let n=e.days[t];return n||(n=Te(),e.days[t]=n),n}function I(e,t){let n=e.days[t];if(!n)return;let r=Object.values(n.water).some(e=>e.count>0);Object.keys(n.tasks).length===0&&!r&&n.journal.trim()===``&&delete e.days[t]}var De=new Set(N.map(e=>e.id));function Oe(e){let t=e.name.trim().replace(/\s+/g,` `),n=e.note.trim().replace(/\s+/g,` `);return t?t.length>P.taskName?{ok:!1,error:`نام تسک حداکثر ${P.taskName} حرف است.`}:n.length>P.taskNote?{ok:!1,error:`توضیح حداکثر ${P.taskNote} حرف است.`}:De.has(e.category)?{ok:!0,value:{name:t,note:n,category:e.category}}:{ok:!1,error:`دسته‌ی نامعتبر.`}:{ok:!1,error:`نام تسک را بنویس.`}}function ke(e,t){return e.tasks.filter(e=>e.category===t)}function Ae(e,t,n,r){let i={id:t,name:n.name,note:n.note,category:n.category,createdOn:r};return Pe(e,i),i}function je(e,t,n){let r=e.tasks.find(e=>e.id===t);r&&(r.name=n.name,r.note=n.note,r.category!==n.category&&(e.tasks=e.tasks.filter(e=>e.id!==t),r.category=n.category,Pe(e,r)))}function Me(e,t){e.tasks=e.tasks.filter(e=>e.id!==t);for(let n of Object.keys(e.days)){let r=e.days[n];r&&t in r.tasks&&(delete r.tasks[t],I(e,n))}}function Ne(e,t,n){let r=e.tasks.find(e=>e.id===t);if(!r)return;let i=ke(e,r.category),a=i[i.findIndex(e=>e.id===t)+n];if(!a)return;let o=e.tasks.indexOf(r),s=e.tasks.indexOf(a);e.tasks[o]=a,e.tasks[s]=r}function Pe(e,t){let n=N.map(e=>e.id),r=n.indexOf(t.category),i=e.tasks.findIndex(e=>n.indexOf(e.category)>r);i===-1?e.tasks.push(t):e.tasks.splice(i,0,t)}function L(e){let t=0;for(let n of Object.values(e.water))t+=n.ml*n.count;return t}function Fe(e,t){return e>=t.fullMl?`done`:e>=t.partialMl?`partial`:`missed`}function Ie(e,t){return F(e,t).waterGoal??e.waterGoal}function Le(e,t,n,r){if(r<0){let r=e.days[t]?.water[n];if(!r||r.count===0)return;--r.count,r.count===0&&delete e.days[t]?.water[n],I(e,t);return}let i=e.days[t]?.water[n],a=e.containers.find(e=>e.id===n);if(!i&&!a)return;let o=Ee(e,t);i?i.count+=1:a&&(o.water[n]={name:a.name,ml:a.ml,count:1}),o.waterGoal||(o.waterGoal={...e.waterGoal})}function Re(e,t){let n=e.trim();if(!n)return{ok:!1,error:`نام ظرف را بنویس.`};if(n.length>P.containerName)return{ok:!1,error:`نام ظرف حداکثر ${P.containerName} حرف است.`};let r=typeof t==`number`?t:Number(He(t.trim()).replace(/[,،٬]/g,``));return!Number.isInteger(r)||r<P.containerMinMl||r>P.containerMaxMl?{ok:!1,error:`حجم باید عدد صحیح بین ${P.containerMinMl} تا ${P.containerMaxMl} میلی‌لیتر باشد.`}:{ok:!0,value:{name:n,ml:r}}}function ze(e,t){e.containers.push(t)}function Be(e,t){e.containers=e.containers.filter(e=>e.id!==t)}function Ve(e,t){let n=Number(He(e.trim())),r=Number(He(t.trim()));if(!Number.isFinite(n)||!Number.isFinite(r))return{ok:!1,error:`عدد معتبر وارد کن.`};let i=Math.round(n*1e3),a=Math.round(r*1e3);return a<=0?{ok:!1,error:`هدف «ناقص» باید بیشتر از صفر باشد.`}:i<=a?{ok:!1,error:`هدف «کامل» باید بیشتر از «ناقص» باشد.`}:i>P.goalMaxMl?{ok:!1,error:`هدف حداکثر ${P.goalMaxMl/1e3} لیتر است.`}:{ok:!0,value:{fullMl:i,partialMl:a}}}function He(e){return e.replace(/[۰-۹]/g,e=>String(e.charCodeAt(0)-1776)).replace(/[٠-٩]/g,e=>String(e.charCodeAt(0)-1632)).replace(/٫/g,`.`)}var Ue=[{id:`t-no-ig-morning`,name:`بدون اینستاگرام بعد از بیدار شدن`,category:`morning`},{id:`t-minox-am`,name:`ماینوکسیدیل صبح`,category:`morning`},{id:`t-bed`,name:`مرتب کردن تخت`,category:`morning`},{id:`t-sleep`,name:`خواب`,category:`morning`,note:`کامل: 7 تا 9 ساعت · ناقص: 6 تا 7 یا 9 تا 10 ساعت`},{id:`t-exercise`,name:`ورزش`,category:`day`},{id:`t-food`,name:`تغذیه سالم`,category:`day`},{id:`t-water`,name:`آب`,category:`day`,link:`water`},{id:`t-reading`,name:`مطالعه`,category:`day`},{id:`t-language`,name:`یادگیری زبان`,category:`day`},{id:`t-learning`,name:`یادگیری مطلب جدید`,category:`day`},{id:`t-procrastination`,name:`دوری از احمال‌کاری`,category:`day`,note:`انجام کارها در موعد مقرر بدون تعویق`},{id:`t-brush`,name:`مسواک شب`,category:`night`},{id:`t-minox-pm`,name:`ماینوکسیدیل شب`,category:`night`},{id:`t-no-ig-night`,name:`بدون اینستاگرام قبل خواب`,category:`night`},{id:`t-meditation`,name:`مدیتیشن`,category:`night`},{id:`t-journal`,name:`ژورنال‌نویسی`,category:`night`,link:`journal`,note:`با نوشتن ژورنال امروز خودکار کامل می‌شود؛ قابل تغییر دستی`},{id:`t-planning`,name:`برنامه‌ریزی روز بعد`,category:`night`,note:`ثبت در دفترچه فیزیکی شخصی`}],We=[{id:`c-cooler-cup`,name:`لیوان آب‌سردکن`,ml:220},{id:`c-cafe-large`,name:`لیوان بزرگ کافه`,ml:360},{id:`c-bottle-small`,name:`بطری آب معدنی کوچک`,ml:500},{id:`c-bottle-large`,name:`بطری آب معدنی بزرگ`,ml:1500}],Ge={fullMl:3e3,partialMl:1500};function Ke(e){return{schemaVersion:1,firstUse:e,tasks:Ue.map(e=>{let t={id:e.id,name:e.name,note:e.note??``,category:e.category,createdOn:null};return e.link&&(t.link=e.link),t}),containers:We.map(e=>({...e})),waterGoal:{...Ge},days:{}}}var R=e=>typeof e==`object`&&!!e&&!Array.isArray(e),z=(e,t=1e4)=>typeof e==`string`&&e.length<=t,B=(e,t)=>Number.isInteger(e)&&e>0&&e<=t,qe=new Set([`done`,`partial`,`missed`]),Je=new Set(N.map(e=>e.id)),V=class extends Error{constructor(e){super(`Invalid data at ${e}`),this.name=`SchemaError`}};function Ye(e,t){if(!R(e)||!B(e.fullMl,P.goalMaxMl)||!B(e.partialMl,P.goalMaxMl)||e.fullMl<=e.partialMl)throw new V(t);return{fullMl:e.fullMl,partialMl:e.partialMl}}function Xe(e,t){if(!R(e)||!z(e.id,80)||!e.id||!z(e.name,P.taskName)||!e.name.trim()||!z(e.note,P.taskNote))throw new V(t);if(typeof e.category!=`string`||!Je.has(e.category))throw new V(`${t}.category`);if(e.createdOn!==null&&!w(e.createdOn))throw new V(`${t}.createdOn`);let n={id:e.id,name:e.name,note:e.note,category:e.category,createdOn:e.createdOn};if(e.link!==void 0){if(e.link!==`water`&&e.link!==`journal`)throw new V(`${t}.link`);n.link=e.link}return n}function Ze(e,t){if(!R(e)||!z(e.id,80)||!e.id||!z(e.name,P.containerName)||!B(e.ml,P.containerMaxMl))throw new V(t);return{id:e.id,name:e.name,ml:e.ml}}function Qe(e,t){if(!R(e)||!R(e.tasks)||!R(e.water)||!z(e.journal,P.journal))throw new V(t);let n={};for(let[r,i]of Object.entries(e.tasks)){if(typeof i!=`string`||!qe.has(i))throw new V(`${t}.tasks.${r}`);n[r]=i}let r={};for(let[n,i]of Object.entries(e.water)){if(!R(i)||!z(i.name,P.containerName)||!B(i.ml,P.containerMaxMl)||!B(i.count,1e3))throw new V(`${t}.water.${n}`);r[n]={name:i.name,ml:i.ml,count:i.count}}let i={tasks:n,water:r,journal:e.journal};return e.waterGoal!==void 0&&(i.waterGoal=Ye(e.waterGoal,`${t}.waterGoal`)),i}function $e(e){if(!R(e))throw new V(`root`);if(e.schemaVersion!==1)throw new V(`schemaVersion`);if(!w(e.firstUse))throw new V(`firstUse`);if(!Array.isArray(e.tasks)||e.tasks.length>200)throw new V(`tasks`);if(!Array.isArray(e.containers)||e.containers.length>50)throw new V(`containers`);if(!R(e.days))throw new V(`days`);let t=e.tasks.map((e,t)=>Xe(e,`tasks[${t}]`));if(new Set(t.map(e=>e.id)).size!==t.length)throw new V(`tasks (duplicate id)`);let n=e.containers.map((e,t)=>Ze(e,`containers[${t}]`));if(new Set(n.map(e=>e.id)).size!==n.length)throw new V(`containers (duplicate id)`);let r={};for(let[t,n]of Object.entries(e.days)){if(!w(t))throw new V(`days.${t}`);r[t]=Qe(n,`days.${t}`)}return{schemaVersion:1,firstUse:e.firstUse,tasks:t,containers:n,waterGoal:Ye(e.waterGoal,`waterGoal`),days:r}}var et=`maktab.habit.v1`,tt=`maktab.habit.corrupt.`,nt=`maktab-habit`;function rt(e,t){let n;try{n=e.getItem(et)}catch{return{data:Ke(t),recovered:!1,fresh:!0}}if(n===null)return{data:Ke(t),recovered:!1,fresh:!0};try{return{data:$e(JSON.parse(n)),recovered:!1,fresh:!1}}catch{try{e.setItem(`${tt}${Date.now()}`,n)}catch{}return{data:Ke(t),recovered:!0,fresh:!1}}}function it(e,t){try{return e.setItem(et,JSON.stringify(t)),{ok:!0}}catch(e){return{ok:!1,reason:e instanceof DOMException&&(e.name===`QuotaExceededError`||e.code===22)?`quota`:`unavailable`}}}function at(e,t=new Date){let n={app:nt,schemaVersion:1,exportedAt:t.toISOString(),data:e};return JSON.stringify(n)}function ot(e){if(e.length>5242880)return{ok:!1,error:`فایل بیش از حد بزرگ است.`};let t;try{t=JSON.parse(e)}catch{return{ok:!1,error:`این فایل، فایل پشتیبان معتبر نیست.`}}if(typeof t!=`object`||!t||t.app!==nt)return{ok:!1,error:`این فایل، فایل پشتیبان مکتب نیست.`};let n=t;if(n.schemaVersion!==1)return{ok:!1,error:`نسخه‌ی این فایل پشتیبان پشتیبانی نمی‌شود.`};try{return{ok:!0,data:$e(n.data),exportedAt:typeof n.exportedAt==`string`?n.exportedAt:``}}catch{return{ok:!1,error:`محتوای فایل پشتیبان خراب است.`}}}var st=new URL(`mark-color-on-dark-BIREpE4H.svg`,import.meta.url).href,H={done:2,partial:1,missed:0},U=[{min:90,label:`فوق‌العاده`,tone:`top`},{min:70,label:`عالی`,tone:`great`},{min:40,label:`خوب`,tone:`good`},{min:0,label:`نیاز به بهبود`,tone:`low`}];function W(e){return U.find(t=>e>=t.min)??U[U.length-1]}function ct(e,t){return e.filter(e=>e.createdOn===null||e.createdOn<=t)}function G(e,t,n,r=F(e,n)){if(t.link===`water`)return Fe(L(r),Ie(e,n));let i=r.tasks[t.id];if(i)return i;if(t.link===`journal`&&r.journal.trim()!==``)return`done`}function lt(e){return Object.keys(e.tasks).length>0||L(e)>0||e.journal.trim()!==``}function K(e,t){let n=F(e,t),r=ct(e.tasks,t),i=r.length*H.done,a=0;for(let i of r){let r=G(e,i,t,n);r&&(a+=H[r])}let o=!lt(n)||i===0?null:Math.round(a/i*100);return{score:a,max:i,pct:o}}function ut(e,t){let n=Object.keys(e.days).filter(e=>e<=t).sort(),r=[e.firstUse,...n].filter(e=>e<=t).sort()[0]??t,i=t=>{let{pct:n}=K(e,t);return n!==null&&n>=70},a=0,o=0;for(let e of Se(r,t))o=i(e)?o+1:0,o>a&&(a=o);let s=0,c=i(t)?t:ge(t,-1);for(;c>=r&&i(c);)s+=1,c=ge(c,-1);return{current:s,best:a}}function dt(e,t){return e.tasks.map(n=>{let r=0,i=0;for(let a of t){if(n.createdOn!==null&&n.createdOn>a)continue;let t=F(e,a);if(!lt(t))continue;i+=H.done;let o=G(e,n,a,t);o&&(r+=H[o])}return{task:n,rate:i===0?null:Math.round(r/i*100)}})}var ft=340,pt=210,q={top:14,right:10,bottom:26,left:34},mt=[0,40,70,100];function ht(e,n,r){let i=ft-q.left-q.right,a=pt-q.top-q.bottom,o=e=>q.left+(e-1)/Math.max(1,r-1)*i,s=e=>q.top+(1-e/100)*a,c=mt.map(e=>`<line x1="${q.left}" x2="${ft-q.right}" y1="${s(e)}" y2="${s(e)}" stroke="var(--line)" stroke-width="1"
        ${e===70?`stroke-dasharray="3 3"`:``}/>
      <text x="${q.left-6}" y="${s(e)+3}" text-anchor="end">${e}%</text>`).join(``),l=[1,5,10,15,20,25,r].filter((e,t,n)=>e<=r&&n.indexOf(e)===t&&!(e!==r&&r-e<3)).map(e=>`<text x="${o(e)}" y="202" text-anchor="middle">${e}</text>`).join(``),u=``,d=!1;for(let t of e){if(t.pct===null){d=!1;continue}let e=O(t.day).jd;u+=`${d?`L`:`M`}${o(e).toFixed(1)} ${s(t.pct).toFixed(1)} `,d=!0}let f=e.filter(e=>e.pct!==null),p=f.find(e=>e.day===n),m=p?`<line x1="${o(O(p.day).jd)}" x2="${o(O(p.day).jd)}" y1="${q.top}" y2="${pt-q.bottom}"
         stroke="var(--copper)" stroke-width="1" opacity="0.5"/>`:``,h=f.map(e=>{let t=o(O(e.day).jd).toFixed(1),r=s(e.pct).toFixed(1),i=e.day===n;return`<circle cx="${t}" cy="${r}" r="${i?5:3}" fill="${i?`var(--cream)`:`var(--copper)`}"
          stroke="${i?`var(--copper)`:`none`}" stroke-width="2"/>`}).join(``),ee=f.map(e=>`<circle cx="${o(O(e.day).jd).toFixed(1)}" cy="${s(e.pct).toFixed(1)}" r="14" fill="transparent"
          data-action="chart-point" data-day="${t(e.day)}" style="cursor:pointer"><title>${e.pct}%</title></circle>`).join(``);return`<svg class="chart" viewBox="0 0 ${ft} ${pt}" role="img" aria-label="نمودار درصد امتیاز روزانه">
      ${c}${l}${m}
      <path d="${u.trim()}" fill="none" stroke="var(--copper)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
      ${h}${ee}
    </svg>`}function J(e){"@babel/helpers - typeof";return J=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},J(e)}function gt(e,t){if(J(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t||`default`);if(J(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}function _t(e){var t=gt(e,`string`);return J(t)==`symbol`?t:t+``}function Y(e,t,n){return(t=_t(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var vt=[`today`,`water`,`history`,`dashboard`,`stats`,`settings`],yt=`maktab.habit.ui`,X=new class{constructor(){Y(this,`appData`,void 0),Y(this,`uiState`,void 0),Y(this,`listeners`,[]),Y(this,`storage`,null),Y(this,`lastToday`,T()),Y(this,`saveErrorShown`,!1),Y(this,`onSaveError`,null),Y(this,`recoveredFromCorruption`,!1)}init(e){this.storage=e;let t=T();this.lastToday=t;let n=rt(e||{getItem:()=>null,setItem:()=>void 0},t);this.appData=n.data,this.recoveredFromCorruption=n.recovered,n.fresh&&this.persist(),this.uiState=this.restoreUi(t)}get persistent(){return this.storage!==null}get data(){return this.appData}get ui(){return this.uiState}get today(){return T()}get minMonth(){return k([this.appData.firstUse,...Object.keys(this.appData.days)].sort()[0]??this.today)}get maxMonth(){return k(this.today)}subscribe(e){this.listeners.push(e)}mutate(e,t={}){e(this.appData),this.persist(),t.render!==!1&&this.emit()}replaceData(e){this.appData=e,this.persist(),this.uiState={...this.uiState,activeDay:this.today,viewMonth:k(this.today),chartDay:null},this.emit()}setUi(e){let t={...this.uiState,...e};t.activeDay>this.today&&(t.activeDay=this.today),A(t.viewMonth,this.maxMonth)>0&&(t.viewMonth=this.maxMonth),A(t.viewMonth,this.minMonth)<0&&(t.viewMonth=this.minMonth),this.uiState=t,this.saveUi(),this.emit()}checkDayRollover(){let e=this.today;if(e===this.lastToday)return;let t=this.uiState.activeDay===this.lastToday;this.lastToday=e,this.setUi(t?{activeDay:e,viewMonth:k(e)}:{})}emit(){for(let e of this.listeners)e()}persist(){if(!this.storage)return;let e=it(this.storage,this.appData);!e.ok&&this.onSaveError&&this.onSaveError(e.reason)}saveUi(){try{let{tab:e,activeDay:t,viewMonth:n}=this.uiState;sessionStorage.setItem(yt,JSON.stringify({tab:e,activeDay:t,viewMonth:n}))}catch{}}restoreUi(e){let t={tab:`today`,activeDay:e,viewMonth:k(e),editTasks:!1,editContainers:!1,chartDay:null};try{let n=sessionStorage.getItem(yt);if(!n)return t;let r=JSON.parse(n);typeof r.tab==`string`&&vt.includes(r.tab)&&(t.tab=r.tab),w(r.activeDay)&&r.activeDay<=e&&(t.activeDay=r.activeDay);let i=r.viewMonth;if(i&&Number.isInteger(i.jy)&&Number.isInteger(i.jm)&&i.jm>=1&&i.jm<=12){let n={jy:i.jy,jm:i.jm};A(n,k(e))<=0&&(t.viewMonth=n)}}catch{}return t}};function bt(e){return ve(e).filter(e=>e<=X.today)}function Z(e,n=`month`){let r=A(e,X.minMonth)>0,i=A(e,X.maxMonth)<0;return`<div class="month-nav">
      <button class="icon-btn" data-action="${n}" data-delta="-1" aria-label="ماه قبل" ${r?``:`disabled style="opacity:.25"`}>${a.chevronRight}</button>
      <div class="month-nav__title">${t(j(e))}</div>
      <button class="icon-btn" data-action="${n}" data-delta="1" aria-label="ماه بعد" ${i?``:`disabled style="opacity:.25"`}>${a.chevronLeft}</button>
    </div>`}function xt(e){return e===null?`cal__cell--empty`:`heat-${W(e).tone}`}function St(e,n){let r=ve(e),i=_e(r[0]);return`<div class="cal">${pe.map(e=>`<div class="cal__dow" aria-hidden="true">${e}</div>`).join(``)}${Array.from({length:i},()=>`<div aria-hidden="true"></div>`).join(``)}${r.map((e,r)=>{let i=e>X.today,{pct:a}=K(X.data,e),o=[`cal__cell`,`num`,i?``:xt(a),e===X.today?`cal__cell--today`:``,e===n.selected?`cal__cell--selected`:``].filter(Boolean).join(` `),s=`${M(e)}${a===null?``:` · ${a}%`}`;return`<button class="${o}" data-action="${n.action}" data-day="${e}" aria-label="${t(s)}"
          ${i?`disabled`:``}>${r+1}</button>`}).join(``)}</div>`}function Ct(){return`<div class="legend" aria-hidden="true">
      <span><i class="heat-top"></i><span class="num">90%+</span></span>
      <span><i class="heat-great"></i><span class="num">70–89%</span></span>
      <span><i class="heat-good"></i><span class="num">40–69%</span></span>
      <span><i class="heat-low"></i>زیر <span class="num">40%</span></span>
    </div>`}function wt(){let e=X.ui.viewMonth,n=bt(e).reverse().map(e=>{let{pct:n,score:i,max:o}=K(X.data,e),s=n===null?null:W(n);return`<button class="day-row" data-action="open-day" data-day="${e}">
          <span class="day-row__dot ${n===null?``:xt(n)}" style="${n===null?`border:1px solid var(--line)`:``}"></span>
          <span class="day-row__date">
            <span class="task__name">${t(M(e))}</span>
            <span class="task__note">${s?`${t(s.label)} · <span class="num">${i}/${o}</span>`:`ثبت نشده`}</span>
          </span>
          <span class="day-row__pct num ${s?`tone-${s.tone}`:`muted`}">${r(n)}</span>
          <span class="muted" style="width:16px">${a.chevronLeft}</span>
        </button>`}).join(``);return`<div class="stack">
      ${Z(e)}
      <section class="panel" aria-label="روزهای ${t(j(e))}">
        ${n||`<div class="empty">روزی برای نمایش نیست.</div>`}
      </section>
      <p class="small muted" style="text-align:center">روی هر روز بزن تا آن را ببینی یا ویرایش کنی.</p>
    </div>`}function Tt(e){let t=bt(e).map(e=>K(X.data,e).pct).filter(e=>e!==null);return{avg:t.length?Math.round(t.reduce((e,t)=>e+t,0)/t.length):null,excellent:t.filter(e=>e>=70).length,recorded:t.length}}function Et(){let e=X.ui.viewMonth,n=Tt(e),i=ut(X.data,X.today);return`<div class="stack">
      ${Z(e)}
      <div class="tiles">
        <div class="tile"><div class="label">AVERAGE</div><div class="small muted">میانگین ماه</div>
          <div class="tile__value num">${r(n.avg)}</div></div>
        <div class="tile"><div class="label">70%+</div><div class="small muted">روزهای عالی</div>
          <div class="tile__value num">${n.excellent} <small>از ${n.recorded}</small></div></div>
        <div class="tile"><div class="label">STREAK</div><div class="small muted">پیوستگی فعلی</div>
          <div class="tile__value num tone-top">${i.current} <small>روز</small></div></div>
        <div class="tile"><div class="label">BEST</div><div class="small muted">بهترین پیوستگی</div>
          <div class="tile__value num">${i.best} <small>روز</small></div></div>
      </div>
      <section class="panel" aria-labelledby="heat-title">
        <div class="panel__head">
          <div><div class="label">HEATMAP</div><h2 class="panel__title" id="heat-title">تقویم ${t(j(e))}</h2></div>
        </div>
        <div class="panel__body">
          ${St(e,{action:`open-day`})}
          ${Ct()}
        </div>
      </section>
      <p class="small muted" style="text-align:center">پیوستگی یعنی روزهای پشت‌سرهم با امتیاز <span class="num">70%</span> یا بیشتر.</p>
    </div>`}function Dt(){let e=X.ui.viewMonth,n=ve(e),i=n.filter(e=>e<=X.today).map(e=>({day:e,pct:K(X.data,e).pct})),a=Tt(e),o=X.ui.chartDay&&i.some(e=>e.day===X.ui.chartDay&&e.pct!==null)?X.ui.chartDay:null,s=o?K(X.data,o).pct:null,c=o&&s!==null?`<span>${t(xe(o))} · <span class="${`tone-${W(s).tone}`}">${t(W(s).label)}</span></span>
         <strong class="num">${s}%</strong>`:`<span class="muted">میانگین ${t(j(e))} · <span class="num">${a.recorded}</span> روز ثبت‌شده</span>
         <strong class="num">${r(a.avg)}</strong>`,l=dt(X.data,n.filter(e=>e<=X.today)).sort((e,t)=>(e.rate??-1)-(t.rate??-1)).map(({task:e,rate:n})=>{let i=n===null?`muted`:`tone-${W(n).tone}`,a=n===null?``:`<span class="${xt(n)}" style="width:${n}%"></span>`;return`<div class="rate">
          <div class="rate__head"><span>${t(e.name)}</span><span class="num ${i}">${r(n)}</span></div>
          <div class="rate__track">${a}</div>
        </div>`}).join(``);return`<div class="stack">
      ${Z(e)}
      <section class="panel" aria-labelledby="chart-title">
        <div class="panel__head">
          <div><div class="label">MONTHLY CHART</div><h2 class="panel__title" id="chart-title">روند امتیاز روزانه</h2></div>
        </div>
        <div class="panel__body">
          <div class="chart__readout" aria-live="polite">${c}</div>
          ${a.recorded?ht(i,o,n.length):`<div class="empty">در این ماه هنوز روزی ثبت نشده است.</div>`}
          <p class="small muted" style="margin:8px 0 0">روی هر نقطه بزن. خط‌چین مرز <span class="num">70%</span> است؛ روزهای ثبت‌نشده خط را قطع می‌کنند.</p>
        </div>
      </section>
      <section class="panel" aria-labelledby="rates-title">
        <div class="panel__head">
          <div><div class="label">HABITS</div><h2 class="panel__title" id="rates-title">عملکرد عادت‌ها (از ضعیف‌ترین)</h2></div>
        </div>
        <div class="panel__body">${l||`<div class="empty">تسکی وجود ندارد.</div>`}</div>
      </section>
    </div>`}var Ot=`1.0.0`,kt=`bardia.bkhaledi@gmail.com`,At=e=>String(Number((e/1e3).toFixed(2)));function jt(){let{waterGoal:e}=X.data;return`<div class="stack">
      <div>
        <div class="label">SETTINGS</div>
        <h1 class="title">تنظیمات</h1>
      </div>

      <section class="panel" aria-labelledby="goal-title">
        <div class="panel__head"><h2 class="panel__title" id="goal-title">هدف آب روزانه</h2></div>
        <form class="panel__body" data-form="goal" novalidate>
          <label class="field">
            <span class="field__label">«کامل» از (لیتر)</span>
            <input class="input input--ltr" name="full" inputmode="decimal" value="${t(At(e.fullMl))}" autocomplete="off" />
          </label>
          <label class="field">
            <span class="field__label">«ناقص» از (لیتر)</span>
            <input class="input input--ltr" name="partial" inputmode="decimal" value="${t(At(e.partialMl))}" autocomplete="off" />
          </label>
          <div class="error" data-error></div>
          <button class="btn btn--primary btn--block" type="submit">ذخیره‌ی هدف</button>
          <p class="small muted" style="margin:10px 0 0">هدف جدید از امروز اعمال می‌شود؛ روزهایی که قبلاً آب ثبت کرده‌اند تغییر نمی‌کنند.</p>
        </form>
      </section>

      <section class="panel" aria-labelledby="backup-title">
        <div class="panel__head"><h2 class="panel__title" id="backup-title">پشتیبان‌گیری</h2></div>
        <div class="panel__body">
          <p class="small muted" style="margin:0 0 14px">داده‌هایت فقط روی همین گوشی ذخیره می‌شود. پیش از تعویض گوشی یا پاک کردن داده‌های مرورگر، فایل پشتیبان بگیر.</p>
          <div class="btn-row">
            <button class="btn btn--ghost" data-action="export-backup">${a.download.replace(`<svg`,`<svg width="18" height="18"`)} دریافت فایل</button>
            <button class="btn btn--ghost" data-action="import-backup">${a.upload.replace(`<svg`,`<svg width="18" height="18"`)} بازیابی</button>
          </div>
          <input type="file" accept="application/json,.json" id="backup-file" hidden />
        </div>
      </section>

      <p class="small muted" style="text-align:center">نسخه‌ی <span class="num">${t(Ot)}</span></p>

      <p class="fine-print"><a href="mailto:${kt}">ارتباط با سازنده · <span class="num">${kt}</span></a></p>
    </div>`}var Mt={done:`کامل`,partial:`ناقص`,missed:`انجام نشده`},Nt=[`done`,`partial`,`missed`];function Pt(){let{activeDay:e}=X.ui;return e===X.today?``:`<div class="banner settings-row">
      <span>در حال ثبت برای <strong>${t(xe(e))}</strong></span>
      <button class="btn btn--ghost" style="min-height:36px;padding:6px 12px" data-action="go-today">بازگشت به امروز</button>
    </div>`}function Ft(){let{activeDay:e}=X.ui,n=K(X.data,e),r=n.pct===null?null:W(n.pct),i=n.max===0?0:n.score/n.max;return`<section class="panel score" aria-label="ارزیابی روز">
      <div>
        <div class="label">DAILY SCORE</div>
        <div class="score__pct num">${n.pct===null?`—`:`${n.pct}<small>%</small>`}</div>
      </div>
      <div class="score__meta">
        <div class="score__level ${r?`tone-${r.tone}`:`muted`}">${r?t(r.label):`هنوز ثبت نشده`}</div>
        <div class="small muted"><span class="num">${n.score} / ${n.max}</span> امتیاز</div>
      </div>
      <div class="bar" aria-hidden="true"><span style="transform:scaleX(${i.toFixed(3)})"></span></div>
    </section>`}function It(e,n){return`<div class="states" role="group" aria-label="${t(e.name)}">
    ${Nt.map(r=>`<button class="state state--${r}" data-action="set-status" data-task="${t(e.id)}" data-status="${r}"
         data-key="st-${t(e.id)}-${r}" aria-pressed="${n===r}" aria-label="${Mt[r]}">${a[r]}</button>`).join(``)}
  </div>`}function Lt(e,r){let i=L(F(X.data,X.ui.activeDay));return`<div class="task">
      <div class="task__text">
        <div class="task__name">${t(e.name)}</div>
        <span class="task__note">محاسبه‌ی خودکار از آب‌سنج</span>
      </div>
      <button class="chip" data-action="tab" data-tab="water" aria-label="باز کردن آب‌سنج">
        <span class="num">${n(i)} L</span>
        <span class="state state--${r} state--mini${i>0?` is-on`:``}" aria-label="${Mt[r]}">${a[r]}</span>
      </button>
    </div>`}function Rt(e){let{activeDay:n}=X.ui,r=F(X.data,n),i=G(X.data,e,n,r);if(e.link===`water`)return Lt(e,i??`missed`);let a=e.link===`journal`&&!r.tasks[e.id]&&i===`done`;return`<div class="task">
      <div class="task__text">
        <div class="task__name">${t(e.name)}</div>
        ${a?`<span class="task__auto">خودکار از ژورنال</span>`:``}
        ${e.note?`<span class="task__note">${t(e.note)}</span>`:``}
      </div>
      ${It(e,a?void 0:i)}
    </div>`}function zt(e,n,r){return`<div class="task task--edit">
      <button class="task__text" style="text-align:inherit" data-action="edit-task" data-task="${t(e.id)}">
        <div class="task__name">${t(e.name)} <span class="muted" style="display:inline-block;width:14px;vertical-align:-2px">${a.pencil}</span></div>
        ${e.note?`<span class="task__note">${t(e.note)}</span>`:``}
      </button>
      <div class="reorder">
        <button class="icon-btn" data-action="move-task" data-task="${t(e.id)}" data-dir="-1" data-key="mv-${t(e.id)}-up"
          aria-label="بالا بردن" ${n===0?`disabled`:``}>${a.up}</button>
        <button class="icon-btn" data-action="move-task" data-task="${t(e.id)}" data-dir="1" data-key="mv-${t(e.id)}-down"
          aria-label="پایین آوردن" ${n===r-1?`disabled`:``}>${a.down}</button>
      </div>
    </div>`}function Bt(){let{activeDay:e,editTasks:n}=X.ui,r=new Set(ct(X.data.tasks,e).map(e=>e.id));return N.map(e=>{let i=ke(X.data,e.id),o=n?i:i.filter(e=>r.has(e.id)),s=o.length?o.map((e,t)=>n?zt(e,t,o.length):Rt(e)).join(``):`<div class="empty">تسکی در این دسته نیست.</div>`;return`<section class="panel cat" aria-labelledby="cat-${e.id}">
        <div class="cat__head">
          <div>
            <div class="label">${e.index} / ${e.label}</div>
            <h2 class="cat__name" id="cat-${e.id}">${t(e.title)}</h2>
          </div>
          <span class="cat__count num">${o.length}</span>
        </div>
        ${s}
        ${n?`<button class="add-row" data-action="add-task" data-category="${e.id}">${a.plus.replace(`<svg`,`<svg width="16" height="16"`)} افزودن تسک</button>`:``}
      </section>`}).join(``)}function Vt(){let{activeDay:e}=X.ui,n=F(X.data,e).journal;return`<section class="panel" aria-labelledby="journal-title">
      <div class="panel__head">
        <div>
          <div class="label">JOURNAL</div>
          <h2 class="panel__title" id="journal-title">ژورنال ${e===X.today?`امروز`:t(xe(e))}</h2>
        </div>
      </div>
      <div class="panel__body">
        <label class="sr-only" for="journal">متن ژورنال</label>
        <textarea class="textarea" id="journal" data-input="journal" data-key="journal" maxlength="${P.journal}"
          placeholder="امروز بابت چه چیزهایی شکرگزاری؟ چه کارهایی انجام دادی؟">${t(n)}</textarea>
        <div class="journal__meta">
          <span>ذخیره‌ی خودکار</span>
          <span class="num" id="journal-count">${n.length} / ${P.journal}</span>
        </div>
      </div>
    </section>`}function Ht(){let{editTasks:e}=X.ui;return`<div class="stack">
      ${Pt()}
      ${e?`<div class="banner">ترتیب، نام و دسته‌ی تسک‌ها را تغییر بده. تغییرات روی همه‌ی روزها اعمال می‌شود.</div>`:Ft()}
      ${Bt()}
      <button class="btn ${e?`btn--primary`:`btn--ghost`} btn--block" data-action="toggle-edit-tasks" data-key="toggle-edit">
        ${e?`پایان ویرایش`:`${a.pencil.replace(`<svg`,`<svg width="16" height="16"`)} ویرایش تسک‌ها`}
      </button>
      ${e?``:Vt()}
    </div>`}var Ut={done:`کامل`,partial:`ناقص`,missed:`هنوز به هدف نرسیده`};function Wt(){let{activeDay:e,editContainers:r}=X.ui,i=F(X.data,e),o=L(i),s=Ie(X.data,e),c=Fe(o,s),l=Math.min(1,o/s.fullMl),u=X.data.containers.map(e=>{let n=i.water[e.id]?.count??0,o=r?`<button class="icon-btn" style="border:1px solid var(--line)" data-action="delete-container" data-id="${t(e.id)}"
             aria-label="حذف ${t(e.name)}">${a.trash}</button>`:`<div class="stepper">
             <button class="stepper__btn" data-action="water" data-id="${t(e.id)}" data-delta="-1" data-key="w-${t(e.id)}-minus"
               aria-label="کم کردن ${t(e.name)}" ${n===0?`disabled`:``}>−</button>
             <span class="stepper__count num" aria-live="polite">${n}</span>
             <button class="stepper__btn stepper__btn--plus" data-action="water" data-id="${t(e.id)}" data-delta="1" data-key="w-${t(e.id)}-plus"
               aria-label="افزودن ${t(e.name)}">+</button>
           </div>`;return`<div class="container-row">
          <div class="task__text">
            <div class="task__name">${t(e.name)}</div>
            <span class="task__note num">${e.ml} ml</span>
          </div>
          ${o}
        </div>`}).join(``),d=new Set(X.data.containers.map(e=>e.id)),f=Object.entries(i.water).filter(([e])=>!d.has(e)).map(([e,n])=>`<div class="container-row">
          <div class="task__text">
            <div class="task__name">${t(n.name)} <span class="small muted">(حذف‌شده)</span></div>
            <span class="task__note num">${n.ml} ml</span>
          </div>
          <div class="stepper">
            <button class="stepper__btn" data-action="water" data-id="${t(e)}" data-delta="-1" aria-label="کم کردن ${t(n.name)}">−</button>
            <span class="stepper__count num">${n.count}</span>
          </div>
        </div>`).join(``);return`<div class="stack">
      ${Pt()}
      <section class="panel water-total" aria-label="مجموع آب">
        <div class="label">WATER</div>
        <div class="water-total__value num">${n(o)}<span class="water-total__unit"> L</span></div>
        <div class="water-goal" aria-hidden="true"><span style="width:${(l*100).toFixed(1)}%"></span></div>
        <div class="small"><span class="${c===`done`?`tone-top`:c===`partial`?`tone-great`:`muted`}">${Ut[c]}</span></div>
        <div class="small muted">هدف کامل <span class="num">${n(s.fullMl)} L</span> · ناقص از <span class="num">${n(s.partialMl)} L</span></div>
      </section>

      <section class="panel" aria-labelledby="containers-title">
        <div class="panel__head">
          <div>
            <div class="label">CONTAINERS</div>
            <h2 class="panel__title" id="containers-title">ظرف‌ها</h2>
          </div>
          <button class="btn btn--ghost" style="min-height:36px;padding:6px 12px" data-action="toggle-edit-containers">
            ${r?`پایان`:`ویرایش`}
          </button>
        </div>
        ${u||`<div class="empty">ظرفی تعریف نشده است.</div>`}
        ${f}
        ${r?`<button class="add-row" data-action="add-container">${a.plus.replace(`<svg`,`<svg width="16" height="16"`)} افزودن ظرف</button>`:``}
      </section>
      <button class="btn btn--ghost btn--block" data-action="tab" data-tab="settings">تغییر هدف روزانه</button>
    </div>`}var Gt=[{tab:`today`,label:`امروز`,icon:`today`},{tab:`water`,label:`آب‌سنج`,icon:`water`},{tab:`history`,label:`تاریخچه`,icon:`history`},{tab:`dashboard`,label:`داشبورد`,icon:`dashboard`},{tab:`stats`,label:`آمار`,icon:`stats`}],Kt={today:Ht,water:Wt,history:wt,dashboard:Et,stats:Dt,settings:jt},Q,$,qt=null,Jt=e=>`${e}-${typeof crypto<`u`&&`randomUUID`in crypto?crypto.randomUUID():`${Date.now().toString(36)}${Math.random().toString(36).slice(2,10)}`}`;function Yt(e){e.innerHTML=`
    <img class="edge-mark" src="${st}" alt="" aria-hidden="true" />
    <header class="appbar">
      <div class="appbar__inner">
        <div class="brand">
          <img class="brand__mark" src="${st}" alt="" />
          <div>
            <div class="brand__name">مکتب</div>
            <span class="brand__sub">مدرسه فکری رفتار و انضباط</span>
          </div>
        </div>
        <button class="appbar__date" id="date-btn" data-action="open-picker" aria-haspopup="dialog"></button>
        <button class="icon-btn" data-action="tab" data-tab="settings" aria-label="تنظیمات">${a.gear}</button>
      </div>
    </header>
    <main class="main" id="main" tabindex="-1"></main>
    <nav class="nav" aria-label="بخش‌ها">
      <div class="nav__inner">
        ${Gt.map(e=>`<button class="nav__btn" data-action="tab" data-tab="${e.tab}">${a[e.icon]}<span>${e.label}</span></button>`).join(``)}
      </div>
    </nav>`,p(e),Q=e.querySelector(`#main`),$=e.querySelector(`#date-btn`),document.addEventListener(`click`,Qt),document.addEventListener(`submit`,nn),document.addEventListener(`input`,$t),document.addEventListener(`change`,tn),document.addEventListener(`focusout`,en),X.onSaveError=e=>{X.saveErrorShown||(X.saveErrorShown=!0,_(e===`quota`?`فضای ذخیره‌سازی مرورگر پر است؛ تغییرات ذخیره نشد.`:`ذخیره‌سازی در این مرورگر ممکن نیست.`,6e3))},X.subscribe(Xt),Xt(),X.persistent||_(`ذخیره‌سازی در این مرورگر غیرفعال است؛ داده‌ها پس از بستن اپ از بین می‌روند.`,7e3),X.recoveredFromCorruption&&_(`داده‌های ذخیره‌شده قابل خواندن نبود؛ یک نسخه کنار گذاشته شد و اپ از نو شروع شد.`,7e3),window.setInterval(()=>X.checkDayRollover(),6e4),document.addEventListener(`visibilitychange`,()=>{document.visibilityState===`visible`&&X.checkDayRollover()})}function Xt(){let{tab:e,activeDay:n,viewMonth:r}=X.ui,i=document.activeElement?.dataset?.key,o=e===`today`||e===`water`,s=e===`settings`?X.today:n,c=O(s).jy===O(X.today).jy?be(s):M(s);$.innerHTML=`${t(o||e===`settings`?c:j(r))}${a.chevronDown}`,$.setAttribute(`aria-label`,`انتخاب تاریخ — ${$.textContent??``}`);for(let t of document.querySelectorAll(`.nav__btn`))t.dataset.tab===e?t.setAttribute(`aria-current`,`page`):t.removeAttribute(`aria-current`);Q.innerHTML=Kt[e](),e!==qt&&(window.scrollTo({top:0}),qt=e),i&&Q.querySelector(`[data-key="${CSS.escape(i)}"]`)?.focus({preventScroll:!0})}var Zt={tab:e=>{let t=e.dataset.tab;g(),X.setUi({tab:t,editTasks:!1,editContainers:!1,chartDay:null})},"go-today":()=>X.setUi({activeDay:X.today,viewMonth:k(X.today)}),"set-status":e=>{let t=e.dataset.task,n=e.dataset.status,r=e.getAttribute(`aria-pressed`)===`true`;X.mutate(e=>Ce(e,X.ui.activeDay,t,r?null:n))},water:e=>{let t=e.dataset.delta===`1`?1:-1;X.mutate(n=>Le(n,X.ui.activeDay,e.dataset.id,t))},"toggle-edit-tasks":()=>X.setUi({editTasks:!X.ui.editTasks}),"toggle-edit-containers":()=>X.setUi({editContainers:!X.ui.editContainers}),"move-task":e=>X.mutate(t=>Ne(t,e.dataset.task,e.dataset.dir===`1`?1:-1)),"add-task":e=>rn(null,e.dataset.category),"edit-task":e=>rn(e.dataset.task,null),"delete-task":async e=>{let t=e.dataset.task,n=X.data.tasks.find(e=>e.id===t);n&&await te(`حذف تسک`,`«${n.name}» و همه‌ی سابقه‌ی ثبت‌شده‌اش پاک می‌شود و امتیاز روزهای گذشته دوباره حساب می‌شود. این کار برگشت‌پذیر نیست.`,`حذف کن`,!0)&&(X.mutate(e=>Me(e,t)),_(`تسک حذف شد.`))},"add-container":()=>an(),"delete-container":async e=>{let t=X.data.containers.find(t=>t.id===e.dataset.id);t&&await te(`حذف ظرف`,`«${t.name}» از فهرست حذف می‌شود. آب‌هایی که قبلاً با آن ثبت شده سر جایشان می‌مانند.`,`حذف کن`,!0)&&X.mutate(e=>Be(e,t.id))},month:e=>X.setUi({viewMonth:ye(X.ui.viewMonth,Number(e.dataset.delta)),chartDay:null}),"open-day":e=>{let t=e.dataset.day;t>X.today||X.setUi({tab:`today`,activeDay:t,editTasks:!1})},"chart-point":e=>{let t=e.dataset.day;X.setUi({chartDay:X.ui.chartDay===t?null:t})},"open-picker":()=>sn(),"picker-month":e=>{let t=Number(e.dataset.delta);X.setUi({viewMonth:ye(X.ui.viewMonth,t),chartDay:null}),ee(on())},"picker-day":e=>{let t=e.dataset.day;t>X.today||(g(),X.setUi({tab:X.ui.tab===`water`?`water`:`today`,activeDay:t,viewMonth:k(t),editTasks:!1}))},"picker-today":()=>{g(),X.setUi({activeDay:X.today,viewMonth:k(X.today)})},"sheet-close":()=>g(),"export-backup":()=>cn(),"import-backup":()=>document.querySelector(`#backup-file`)?.click()};function Qt(e){let t=e.target.closest(`[data-action]`);if(!t||t.disabled)return;let n=Zt[t.dataset.action];n&&(e.preventDefault(),n(t))}function $t(e){let t=e.target;if(t instanceof HTMLTextAreaElement&&t.dataset.input===`journal`){X.mutate(e=>we(e,X.ui.activeDay,t.value),{render:!1});let e=document.querySelector(`#journal-count`);e&&(e.textContent=`${t.value.length} / ${P.journal}`)}}function en(e){let t=e.target;if(t instanceof HTMLTextAreaElement&&t.dataset.input===`journal`&&!m()){if(e.relatedTarget?.closest(`[data-action]`))return;X.setUi({})}}function tn(e){let t=e.target;t instanceof HTMLInputElement&&t.id===`backup-file`&&t.files?.[0]&&(ln(t.files[0]),t.value=``)}function nn(e){let t=e.target,n=t.dataset.form;if(!n)return;e.preventDefault();let r=new FormData(t),i=e=>String(r.get(e)??``),a=e=>{let n=t.querySelector(`[data-error]`);n&&(n.textContent=e)};if(n===`goal`){let e=Ve(i(`full`),i(`partial`));if(!e.ok)return a(e.error);X.mutate(t=>{t.waterGoal=e.value}),_(`هدف آب ذخیره شد.`)}else if(n===`task`){let e=Oe({name:i(`name`),note:i(`note`),category:i(`category`)});if(!e.ok)return a(e.error);let n=t.dataset.id;n?X.mutate(t=>je(t,n,e.value)):X.mutate(t=>Ae(t,Jt(`t`),e.value,T())),g(),_(n?`تسک ذخیره شد.`:`تسک اضافه شد.`)}else if(n===`container`){let e=Re(i(`name`),i(`ml`));if(!e.ok)return a(e.error);X.mutate(t=>ze(t,{id:Jt(`c`),...e.value})),g(),_(`ظرف اضافه شد.`)}}function rn(e,n){let r=e?X.data.tasks.find(t=>t.id===e):void 0,i=r?.category??n??`morning`,o=r?.link===`water`?`<p class="small muted">وضعیت این تسک خودکار از آب‌سنج محاسبه می‌شود.</p>`:r?.link===`journal`?`<p class="small muted">این تسک با نوشتن ژورنال خودکار کامل می‌شود.</p>`:``;h(r?`ویرایش تسک`:`تسک تازه`,`<form data-form="task" ${r?`data-id="${t(r.id)}"`:``} novalidate>
       <label class="field">
         <span class="field__label">نام تسک</span>
         <input class="input" name="name" maxlength="${P.taskName}" value="${t(r?.name??``)}" autocomplete="off" required />
       </label>
       <label class="field">
         <span class="field__label">توضیح کوتاه (اختیاری)</span>
         <input class="input" name="note" maxlength="${P.taskNote}" value="${t(r?.note??``)}" autocomplete="off" />
       </label>
       <label class="field">
         <span class="field__label">دسته</span>
         <select class="select" name="category">
           ${N.map(e=>`<option value="${e.id}" ${e.id===i?`selected`:``}>${t(e.title)}</option>`).join(``)}
         </select>
       </label>
       ${o}
       ${r?``:`<p class="small muted">تسک تازه از امروز حساب می‌شود و امتیاز روزهای گذشته را تغییر نمی‌دهد.</p>`}
       <div class="error" data-error></div>
       <button class="btn btn--primary btn--block" type="submit">${r?`ذخیره`:`افزودن`}</button>
       ${r?`<button class="btn btn--danger btn--block" type="button" style="margin-top:10px" data-action="delete-task" data-task="${t(r.id)}">${a.trash.replace(`<svg`,`<svg width="18" height="18"`)} حذف تسک</button>`:``}
     </form>`)}function an(){h(`ظرف تازه`,`<form data-form="container" novalidate>
       <label class="field">
         <span class="field__label">نام ظرف</span>
         <input class="input" name="name" maxlength="${P.containerName}" autocomplete="off" placeholder="مثلاً قمقمه‌ی باشگاه" />
       </label>
       <label class="field">
         <span class="field__label">حجم (میلی‌لیتر)</span>
         <input class="input input--ltr" name="ml" inputmode="numeric" autocomplete="off" placeholder="750" />
       </label>
       <div class="error" data-error></div>
       <button class="btn btn--primary btn--block" type="submit">افزودن</button>
     </form>`)}function on(){let e=X.ui.viewMonth;return`${Z(e,`picker-month`)}
    ${St(e,{selected:X.ui.activeDay,action:`picker-day`})}
    <div class="legend" style="justify-content:space-between">
      <span>روزهای آینده بسته‌اند.</span>
    </div>
    <button class="btn btn--ghost btn--block" style="margin-top:14px" data-action="picker-today">امروز</button>`}function sn(){let{tab:e,activeDay:t}=X.ui;(e===`today`||e===`water`||e===`settings`)&&X.setUi({viewMonth:k(t)}),h(`انتخاب روز`,on())}function cn(){let e=new Blob([at(X.data)],{type:`application/json`}),t=URL.createObjectURL(e),n=document.createElement(`a`);n.href=t,n.download=`maktab-backup-${T()}.json`,document.body.appendChild(n),n.click(),n.remove(),window.setTimeout(()=>URL.revokeObjectURL(t),1e4),_(`فایل پشتیبان آماده‌ی دانلود شد.`)}async function ln(e){let t;try{t=await e.text()}catch{_(`خواندن فایل ممکن نشد.`);return}let n=ot(t);if(!n.ok){_(n.error,4e3);return}let r=Object.keys(n.data.days).length;await te(`بازیابی پشتیبان`,`همه‌ی داده‌های فعلی این گوشی با فایل پشتیبان (${r} روز ثبت‌شده) جایگزین می‌شود.`,`جایگزین کن`,!0)&&(X.replaceData(n.data),_(`پشتیبان بازیابی شد.`))}function un(){try{let e=`__maktab_probe__`;return window.localStorage.setItem(e,`1`),window.localStorage.removeItem(e),window.localStorage}catch{return null}}var dn=un();X.init(dn),Yt(document.getElementById(`app`)),re(),navigator.storage?.persist?.().catch(()=>void 0);