(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178],t=(e,t)=>Math.trunc(e/t),n=(e,t)=>e-Math.trunc(e/t)*t;function r(r){let i=e[0],a=e[e.length-1];if(r<i||r>=a)throw RangeError(`Jalali year out of supported range: ${r}`);let o=r+621,s=-14,c=i,l=0;for(let i=1;i<e.length;i+=1){let a=e[i];if(l=a-c,r<a)break;s=s+t(l,33)*8+t(n(l,33),4),c=a}let u=r-c;s=s+t(u,33)*8+t(n(u,33)+3,4),n(l,33)===4&&l-u===4&&(s+=1);let d=t(o,4)-t((t(o,100)+1)*3,4)-150,f=20+s-d;l-u<6&&(u=u-l+t(l+4,33)*33);let p=n(n(u+1,33)-1,4);return p===-1&&(p=4),{leap:p,gy:o,march:f}}function i(e,r,i){let a=t((e+t(r-8,6)+100100)*1461,4)+t(153*n(r+9,12)+2,5)+i-34840408;return a=a-t(t(e+100100+t(r-8,6),100)*3,4)+752,a}function a(e){let r=4*e+139361631;r=r+t(t(4*e+183187720,146097)*3,4)*4-3908;let i=t(n(r,1461),4)*5+308,a=t(n(i,153),5)+1,o=n(t(i,153),12)+1;return{gy:t(r,1461)-100100+t(8-o,6),gm:o,gd:a}}function o(e,n,a){let o=r(e);return i(o.gy,3,o.march)+(n-1)*31-t(n,7)*(n-7)+a-1}function s(e){let o=a(e).gy,s=o-621,c=r(s),l=e-i(o,3,c.march);if(l>=0){if(l<=185)return{jy:s,jm:1+t(l,31),jd:n(l,31)+1};l-=186}else--s,l+=179,c.leap===1&&(l+=1);return{jy:s,jm:7+t(l,30),jd:n(l,30)+1}}function c(e){return r(e).leap===0}function l(e,t){if(t<1||t>12)throw RangeError(`Invalid Jalali month: ${t}`);return t<=6?31:t<=11||c(e)?30:29}function u(e){return n(e+2,7)}var d=[`فروردین`,`اردیبهشت`,`خرداد`,`تیر`,`مرداد`,`شهریور`,`مهر`,`آبان`,`آذر`,`دی`,`بهمن`,`اسفند`],f=[`شنبه`,`یکشنبه`,`دوشنبه`,`سه‌شنبه`,`چهارشنبه`,`پنجشنبه`,`جمعه`],p=[`ش`,`ی`,`د`,`س`,`چ`,`پ`,`ج`],ee=/^(\d{4})-(\d{2})-(\d{2})$/,m=e=>String(e).padStart(2,`0`);function te(e){if(typeof e!=`string`)return!1;let t=ee.exec(e);if(!t)return!1;let n=Number(t[1]),r=Number(t[2]),a=Number(t[3]);return r<1||r>12||a<1||a>31?!1:re(i(n,r,a))===e}function ne(e){return`${e.getFullYear()}-${m(e.getMonth()+1)}-${m(e.getDate())}`}function h(e=new Date){return ne(e)}function g(e){let t=ee.exec(e);if(!t)throw RangeError(`Invalid day key: ${e}`);return i(Number(t[1]),Number(t[2]),Number(t[3]))}function re(e){let{gy:t,gm:n,gd:r}=a(e);return`${t}-${m(n)}-${m(r)}`}function ie(e,t){return re(g(e)+t)}function _(e){return s(g(e))}function ae(e){return u(g(e))}function v(e){let{jy:t,jm:n}=_(e);return{jy:t,jm:n}}function oe(e){let t=l(e.jy,e.jm),n=o(e.jy,e.jm,1);return Array.from({length:t},(e,t)=>re(n+t))}function se(e,t){let n=e.jy*12+(e.jm-1)+t;return{jy:Math.floor(n/12),jm:n%12+1}}function y(e,t){return e.jy*12+e.jm-(t.jy*12+t.jm)}function b(e){return`${d[e.jm-1]} ${e.jy}`}function ce(e){let{jy:t,jm:n,jd:r}=_(e);return`${f[ae(e)]}، ${r} ${d[n-1]} ${t}`}function le(e){let{jm:t,jd:n}=_(e);return`${f[ae(e)]}، ${n} ${d[t-1]}`}function ue(e){let{jm:t,jd:n}=_(e);return`${n} ${d[t-1]}`}function de(e,t){let n=g(e),r=g(t),i=[];for(let e=n;e<=r;e+=1)i.push(re(e));return i}var x=[{id:`morning`,index:`01`,label:`MORNING`,title:`روتین صبح`},{id:`day`,index:`02`,label:`DAYTIME`,title:`طول روز و سیستم‌ها`},{id:`night`,index:`03`,label:`EVENING`,title:`روتین شب`}],S={taskName:60,taskNote:120,containerName:40,containerMinMl:10,containerMaxMl:5e3,goalMaxMl:1e4,journal:5e3},fe=[{id:`t-bed`,name:`مرتب کردن تخت خواب`,category:`morning`},{id:`t-water`,name:`آب`,category:`day`,link:`water`},{id:`t-exercise`,name:`ورزش`,category:`day`},{id:`t-food`,name:`تغذیه سالم`,category:`day`},{id:`t-reading`,name:`مطالعه`,category:`day`},{id:`t-language`,name:`یادگیری زبان`,category:`day`},{id:`t-learning`,name:`یادگیری مطلب جدید`,category:`day`},{id:`t-procrastination`,name:`دوری از اهمال‌کاری`,category:`day`,note:`انجام کارها در موعد مقرر بدون تعویق`},{id:`t-no-phone-bed`,name:`عدم استفاده از موبایل در رختخواب`,category:`day`},{id:`t-brush`,name:`مسواک شب`,category:`night`},{id:`t-meditation`,name:`مدیتیشن`,category:`night`},{id:`t-journal`,name:`ژورنال‌نویسی`,category:`night`,link:`journal`,note:`با نوشتن ژورنال امروز خودکار کامل می‌شود؛ قابل تغییر دستی`},{id:`t-planning`,name:`برنامه‌ریزی روز بعد`,category:`night`,note:`در دفترچه‌ی شخصی یا گوگل کلندر`}],pe=[`t-no-ig-morning`,`t-minox-am`,`t-sleep`,`t-minox-pm`,`t-no-ig-night`];function me(e){let t={id:e.id,name:e.name,note:e.note??``,category:e.category,createdOn:null};return e.link&&(t.link=e.link),t}function he(e,t=h()){if((e.defaultsVersion??1)>=2)return!1;let n=new Set(pe);e.tasks=e.tasks.filter(e=>!(e.createdOn===null&&n.has(e.id)));for(let t of Object.values(e.days))for(let e of n)delete t.tasks[e];for(let t of Object.keys(e.days)){let n=e.days[t],r=Object.values(n.water).some(e=>e.count>0);Object.keys(n.tasks).length===0&&!r&&n.journal.trim()===``&&delete e.days[t]}let r=e.tasks.find(e=>e.id===`t-bed`);r&&r.name===`مرتب کردن تخت`&&(r.name=`مرتب کردن تخت خواب`);let i=e.tasks.find(e=>e.id===`t-procrastination`);i&&i.name===`دوری از احمال‌کاری`&&(i.name=`دوری از اهمال‌کاری`);let a=e.tasks.find(e=>e.id===`t-planning`);if(a&&a.note===`ثبت در دفترچه فیزیکی شخصی`&&(a.note=`در دفترچه‌ی شخصی یا گوگل کلندر`),!e.tasks.some(e=>e.id===`t-no-phone-bed`)){let n={...me(fe.find(e=>e.id===`t-no-phone-bed`)),createdOn:t},r=e.tasks.map(e=>e.category).lastIndexOf(`day`),i=e.tasks.findIndex(e=>e.category===`night`),a=r>=0?r+1:i>=0?i:e.tasks.length;e.tasks.splice(a,0,n)}return e.defaultsVersion=2,!0}var ge=[{id:`c-cooler-cup`,name:`لیوان آب‌سردکن`,ml:220},{id:`c-cafe-large`,name:`لیوان بزرگ کافه`,ml:360},{id:`c-bottle-small`,name:`بطری آب معدنی کوچک`,ml:500},{id:`c-bottle-large`,name:`بطری آب معدنی بزرگ`,ml:1500}],_e={fullMl:3e3,partialMl:1500};function ve(e){return{schemaVersion:1,defaultsVersion:2,firstUse:e,tasks:fe.map(me),containers:ge.map(e=>({...e})),waterGoal:{..._e},days:{}}}var C=e=>typeof e==`object`&&!!e&&!Array.isArray(e),w=(e,t=1e4)=>typeof e==`string`&&e.length<=t,ye=(e,t)=>Number.isInteger(e)&&e>0&&e<=t,be=new Set([`done`,`partial`,`missed`]),xe=new Set(x.map(e=>e.id)),T=class extends Error{constructor(e){super(`Invalid data at ${e}`),this.name=`SchemaError`}};function Se(e,t){if(!C(e)||!ye(e.fullMl,S.goalMaxMl)||!ye(e.partialMl,S.goalMaxMl)||e.fullMl<=e.partialMl)throw new T(t);return{fullMl:e.fullMl,partialMl:e.partialMl}}function Ce(e,t){if(!C(e)||!w(e.id,80)||!e.id||!w(e.name,S.taskName)||!e.name.trim()||!w(e.note,S.taskNote))throw new T(t);if(typeof e.category!=`string`||!xe.has(e.category))throw new T(`${t}.category`);if(e.createdOn!==null&&!te(e.createdOn))throw new T(`${t}.createdOn`);let n={id:e.id,name:e.name,note:e.note,category:e.category,createdOn:e.createdOn};if(e.link!==void 0){if(e.link!==`water`&&e.link!==`journal`)throw new T(`${t}.link`);n.link=e.link}return n}function we(e,t){if(!C(e)||!w(e.id,80)||!e.id||!w(e.name,S.containerName)||!ye(e.ml,S.containerMaxMl))throw new T(t);return{id:e.id,name:e.name,ml:e.ml}}function Te(e,t){if(!C(e)||!C(e.tasks)||!C(e.water)||!w(e.journal,S.journal))throw new T(t);let n={};for(let[r,i]of Object.entries(e.tasks)){if(typeof i!=`string`||!be.has(i))throw new T(`${t}.tasks.${r}`);n[r]=i}let r={};for(let[n,i]of Object.entries(e.water)){if(!C(i)||!w(i.name,S.containerName)||!ye(i.ml,S.containerMaxMl)||!ye(i.count,1e3))throw new T(`${t}.water.${n}`);r[n]={name:i.name,ml:i.ml,count:i.count}}let i={tasks:n,water:r,journal:e.journal};return e.waterGoal!==void 0&&(i.waterGoal=Se(e.waterGoal,`${t}.waterGoal`)),i}function Ee(e){if(!C(e))throw new T(`root`);if(e.schemaVersion!==1)throw new T(`schemaVersion`);if(!te(e.firstUse))throw new T(`firstUse`);if(!Array.isArray(e.tasks)||e.tasks.length>200)throw new T(`tasks`);if(!Array.isArray(e.containers)||e.containers.length>50)throw new T(`containers`);if(!C(e.days))throw new T(`days`);let t=e.tasks.map((e,t)=>Ce(e,`tasks[${t}]`));if(new Set(t.map(e=>e.id)).size!==t.length)throw new T(`tasks (duplicate id)`);let n=e.containers.map((e,t)=>we(e,`containers[${t}]`));if(new Set(n.map(e=>e.id)).size!==n.length)throw new T(`containers (duplicate id)`);let r={};for(let[t,n]of Object.entries(e.days)){if(!te(t))throw new T(`days.${t}`);r[t]=Te(n,`days.${t}`)}let i={schemaVersion:1,firstUse:e.firstUse,tasks:t,containers:n,waterGoal:Se(e.waterGoal,`waterGoal`),days:r};if(e.defaultsVersion!==void 0){if(!Number.isInteger(e.defaultsVersion)||e.defaultsVersion<1||e.defaultsVersion>1e3)throw new T(`defaultsVersion`);i.defaultsVersion=e.defaultsVersion}return i}var De=`maktab.habit.v1`,Oe=`maktab.habit.corrupt.`,ke=`maktab-habit`;function Ae(e,t){let n;try{n=e.getItem(De)}catch{return{data:ve(t),recovered:!1,fresh:!0}}if(n===null)return{data:ve(t),recovered:!1,fresh:!0};try{let e=Ee(JSON.parse(n));return{data:e,recovered:!1,fresh:!1,migrated:he(e)}}catch{try{e.setItem(`${Oe}${Date.now()}`,n)}catch{}return{data:ve(t),recovered:!0,fresh:!1}}}function je(e,t){try{return e.setItem(De,JSON.stringify(t)),{ok:!0}}catch(e){return{ok:!1,reason:e instanceof DOMException&&(e.name===`QuotaExceededError`||e.code===22)?`quota`:`unavailable`}}}function Me(e,t=new Date){let n={app:ke,schemaVersion:1,exportedAt:t.toISOString(),data:e};return JSON.stringify(n)}function Ne(e){if(e.length>5242880)return{ok:!1,error:`فایل بیش از حد بزرگ است.`};let t;try{t=JSON.parse(e)}catch{return{ok:!1,error:`این فایل، فایل پشتیبان معتبر نیست.`}}if(typeof t!=`object`||!t||t.app!==ke)return{ok:!1,error:`این فایل، فایل پشتیبان مکتب نیست.`};let n=t;if(n.schemaVersion!==1)return{ok:!1,error:`نسخه‌ی این فایل پشتیبان پشتیبانی نمی‌شود.`};try{let e=Ee(n.data);return he(e),{ok:!0,data:e,exportedAt:typeof n.exportedAt==`string`?n.exportedAt:``}}catch{return{ok:!1,error:`محتوای فایل پشتیبان خراب است.`}}}function Pe(e){"@babel/helpers - typeof";return Pe=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},Pe(e)}function Fe(e,t){if(Pe(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t||`default`);if(Pe(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}function Ie(e){var t=Fe(e,`string`);return Pe(t)==`symbol`?t:t+``}function E(e,t,n){return(t=Ie(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var Le=[`today`,`water`,`history`,`dashboard`,`stats`,`settings`],Re=`maktab.habit.ui`,D=new class{constructor(){E(this,`appData`,void 0),E(this,`uiState`,void 0),E(this,`listeners`,[]),E(this,`storage`,null),E(this,`lastToday`,h()),E(this,`saveErrorShown`,!1),E(this,`onSaveError`,null),E(this,`user`,null),E(this,`serverMode`,!0),E(this,`onPersist`,null),E(this,`recoveredFromCorruption`,!1)}init(e){this.storage=e;let t=h();this.lastToday=t;let n=Ae(e||{getItem:()=>null,setItem:()=>void 0},t);this.appData=n.data,this.recoveredFromCorruption=n.recovered,(n.fresh||n.migrated)&&this.persist(),this.uiState=this.restoreUi(t)}get persistent(){return this.storage!==null}get data(){return this.appData}get ui(){return this.uiState}get today(){return h()}get minMonth(){return v([this.appData.firstUse,...Object.keys(this.appData.days)].sort()[0]??this.today)}get maxMonth(){return v(this.today)}subscribe(e){this.listeners.push(e)}mutate(e,t={}){e(this.appData),this.persist(),this.onPersist?.(),t.render!==!1&&this.emit()}replaceData(e,t={}){this.appData=e,this.persist(),t.silent||this.onPersist?.(),t.keepUi||(this.uiState={...this.uiState,activeDay:this.today,viewMonth:v(this.today),chartDay:null}),y(this.uiState.viewMonth,this.minMonth)<0&&(this.uiState={...this.uiState,viewMonth:this.minMonth}),document.activeElement instanceof HTMLTextAreaElement||this.emit()}setUi(e){let t={...this.uiState,...e};t.activeDay>this.today&&(t.activeDay=this.today),y(t.viewMonth,this.maxMonth)>0&&(t.viewMonth=this.maxMonth),y(t.viewMonth,this.minMonth)<0&&(t.viewMonth=this.minMonth),this.uiState=t,this.saveUi(),this.emit()}checkDayRollover(){let e=this.today;if(e===this.lastToday)return;let t=this.uiState.activeDay===this.lastToday;this.lastToday=e,this.setUi(t?{activeDay:e,viewMonth:v(e)}:{})}emit(){for(let e of this.listeners)e()}persist(){if(!this.storage)return;let e=je(this.storage,this.appData);!e.ok&&this.onSaveError&&this.onSaveError(e.reason)}saveUi(){try{let{tab:e,activeDay:t,viewMonth:n}=this.uiState;sessionStorage.setItem(Re,JSON.stringify({tab:e,activeDay:t,viewMonth:n}))}catch{}}restoreUi(e){let t={tab:`today`,activeDay:e,viewMonth:v(e),editTasks:!1,editContainers:!1,chartDay:null};try{let n=sessionStorage.getItem(Re);if(!n)return t;let r=JSON.parse(n);typeof r.tab==`string`&&Le.includes(r.tab)&&(t.tab=r.tab),te(r.activeDay)&&r.activeDay<=e&&(t.activeDay=r.activeDay);let i=r.viewMonth;if(i&&Number.isInteger(i.jy)&&Number.isInteger(i.jm)&&i.jm>=1&&i.jm<=12){let n={jy:i.jy,jm:i.jm};y(n,v(e))<=0&&(t.viewMonth=n)}}catch{}return t}},O=class extends Error{constructor(e,t,n=null){super(t),E(this,`status`,void 0),E(this,`body`,void 0),this.status=e,this.body=n,this.name=`ApiError`}},ze=class extends Error{constructor(){super(`offline`),this.name=`OfflineError`}};async function k(e,t,n,r={}){let i;try{let a={method:e,credentials:`same-origin`,headers:{Accept:`application/json`}};n!==void 0&&(a.headers={...a.headers,"Content-Type":`application/json`},a.body=JSON.stringify(n)),r.keepalive&&(a.keepalive=!0),i=await fetch(`./api/${t}`,a)}catch{throw new ze}let a=null;try{a=await i.json()}catch{}if(!i.ok){let e=a?.error;throw new O(i.status,typeof e==`string`?e:`ارتباط با سرور ممکن نشد؛ دوباره امتحان کن.`,a)}return a}var A=()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||`Asia/Tehran`}catch{return`Asia/Tehran`}},Be=(e,t)=>JSON.stringify(e)===JSON.stringify(t);function Ve(e,t,n){let r={};for(let i of new Set([...Object.keys(e),...Object.keys(t),...Object.keys(n)])){let a=Be(t[i],e[i])?n[i]:t[i];a!==void 0&&(r[i]=a)}return r}var He={tasks:{},water:{},journal:``};function Ue(e,t,n){if(Be(t,e))return n;if(Be(n,e))return t;let r=e??He,i=t??He,a=n??He,o={tasks:Ve(r.tasks,i.tasks,a.tasks),water:Ve(r.water,i.water,a.water),journal:i.journal===r.journal?a.journal:i.journal},s=i.waterGoal??a.waterGoal;return s&&(o.waterGoal=s),o}function We(e,t){let n=new Set(e.map(e=>e.id));return[...e,...t.filter(e=>!n.has(e.id))]}function Ge(e){let t=new Set(e.tasks.map(e=>e.id));for(let[n,r]of Object.entries(e.days)){for(let e of Object.keys(r.tasks))t.has(e)||delete r.tasks[e];let i=Object.values(r.water).some(e=>e.count>0);Object.keys(r.tasks).length===0&&!i&&r.journal.trim()===``&&delete e.days[n]}return e}function Ke(e,t,n){let r=e=>JSON.parse(JSON.stringify(e));if(!e)return Ge(r({...n,tasks:We(n.tasks,t.tasks),containers:[...n.containers,...t.containers.filter(e=>!n.containers.some(t=>t.id===e.id))],days:{...n.days,...t.days}}));let i=r=>Be(t[r],e[r])?n[r]:t[r],a={};for(let r of new Set([...Object.keys(e.days),...Object.keys(t.days),...Object.keys(n.days)])){let i=Ue(e.days[r],t.days[r],n.days[r]);i&&(a[r]=i)}let o={schemaVersion:t.schemaVersion,firstUse:t.firstUse<n.firstUse?t.firstUse:n.firstUse,tasks:i(`tasks`),containers:i(`containers`),waterGoal:i(`waterGoal`),days:a},s=Math.max(t.defaultsVersion??1,n.defaultsVersion??1);return s>1&&(o.defaultsVersion=s),Ge(r(o))}var qe=`maktab.auth.v1`,Je=`maktab.sync.v1`,Ye=800,Xe=6e4,Ze=6e4,j={rev:0,base:null},Qe=0,M=null,$e=!1,N=`pending`,et=!1,tt=()=>void 0,nt=[];function rt(e){try{let t=localStorage.getItem(e);return t?JSON.parse(t):null}catch{return null}}function it(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{}}function at(){let e=rt(qe);return e&&typeof e.id==`number`&&typeof e.name==`string`&&typeof e.phone==`string`?e:null}function ot(){let e=rt(Je);if(!e||typeof e.rev!=`number`)return{rev:0,base:null};let t=null;try{t=e.base?Ee(e.base):null}catch{t=null}let n={rev:e.rev,base:t};return typeof e.userId==`number`&&(n.userId=e.userId),n}var st=()=>it(Je,j);function ct(e){let t=ot();it(qe,e),t.userId===void 0||t.userId===e.id?j={...t,userId:e.id}:(j={userId:e.id,rev:0,base:null},D.replaceData(ve(h()),{keepUi:!1})),st()}function lt(){for(let e of[qe,Je,De])try{localStorage.removeItem(e)}catch{}try{sessionStorage.clear()}catch{}}function ut(){return N}function dt(e){nt.push(e)}function P(e){if(e!==N){N=e;for(let e of nt)e()}}var ft=()=>F(),F=()=>j.base===null||JSON.stringify(D.data)!==JSON.stringify(j.base),pt=e=>JSON.parse(JSON.stringify(e));function mt(e){if(!e)return null;try{let t=Ee(e);return he(t),t}catch{return null}}function ht(e,t){let n=mt(t);if(!n)return j.rev=e,st(),!0;let r=(j.base!==null||Object.keys(D.data.days).length!==0)&&F()?Ke(j.base,D.data,n):n;return j.rev=e,j.base=n,st(),JSON.stringify(r)!==JSON.stringify(D.data)&&D.replaceData(r,{keepUi:!0,silent:!0}),JSON.stringify(r)!==JSON.stringify(n)}function gt(e){e instanceof O&&e.status===401?(P(`error`),tt()):P(e instanceof ze?`offline`:`error`)}async function _t(){let e=await k(`GET`,`data`);e.rev===j.rev&&j.base!==null?F()?await I():P(`synced`):ht(e.rev,e.data)||F()?await I():P(`synced`)}async function I(e=!1){for(let t=0;t<3;t+=1){let t=pt(D.data),n={data:t,baseRev:j.rev,tz:A()},r=e&&JSON.stringify(n).length<Xe;try{let e=await k(`PUT`,`data`,n,{keepalive:r});j.rev=e.rev,j.base=t,st(),P(F()?`pending`:`synced`);return}catch(e){if(e instanceof O&&e.status===409){let t=e.body;ht(Number(t?.rev??0),t?.data??null);continue}throw e}}P(`error`)}function L(e){return M?($e=!0,M):(M=e().catch(gt).finally(()=>{M=null,$e&&($e=!1,L(()=>F()?I():Promise.resolve()))}),M)}function vt(){P(`pending`),window.clearTimeout(Qe),Qe=window.setTimeout(()=>void L(()=>F()?I():Promise.resolve(P(`synced`))),Ye)}function yt(e=!1){return window.clearTimeout(Qe),F()?L(()=>I(e)):M??Promise.resolve()}function bt(e){et||(et=!0,tt=e.onUnauthorized,j=ot(),D.onPersist=vt,L(_t),window.addEventListener(`online`,()=>void L(_t)),document.addEventListener(`visibilitychange`,()=>{document.visibilityState===`visible`?L(_t):yt(!0)}),window.setInterval(()=>{(document.visibilityState===`visible`||N===`offline`||N===`error`||F())&&L(_t)},Ze))}var xt=`unknown`,St=[],Ct=()=>xt,wt=e=>void St.push(e);function R(e){if(e!==xt){xt=e;for(let e of St)e()}}function Tt(){let e=navigator.userAgent;return/iphone|ipad|ipod/i.test(e)||/Macintosh/.test(e)&&navigator.maxTouchPoints>1}function Et(){return window.matchMedia?.(`(display-mode: standalone)`).matches||navigator.standalone===!0}var Dt=()=>`serviceWorker`in navigator&&`PushManager`in window&&`Notification`in window;async function Ot(){if(!(`serviceWorker`in navigator))return null;let e=new Promise(e=>window.setTimeout(()=>e(null),8e3));return Promise.race([navigator.serviceWorker.ready,e])}function kt(e){let t=`=`.repeat((4-e.length%4)%4),n=atob((e+t).replace(/-/g,`+`).replace(/_/g,`/`)),r=new Uint8Array(new ArrayBuffer(n.length));for(let e=0;e<n.length;e+=1)r[e]=n.charCodeAt(e);return r}async function At(){if(!Dt()){R(Tt()&&!Et()?`needs-install`:`unsupported`);return}if(Notification.permission===`denied`)return R(`denied`);let e=await(await Ot())?.pushManager.getSubscription().catch(()=>null);Notification.permission===`granted`&&e?(R(`on`),k(`POST`,`push/subscribe`,{subscription:e.toJSON(),tz:A()}).catch(()=>void 0)):R(`off`)}async function jt(){if(!Dt())return Tt()&&!Et()?`در آیفون، اول اپ را با «Add to Home Screen» به صفحه‌ی اصلی اضافه کن و از همان آیکن باز کن.`:`این مرورگر از اعلان پشتیبانی نمی‌کند.`;let e=await Notification.requestPermission();if(e!==`granted`)return R(e===`denied`?`denied`:`off`),e===`denied`?`اجازه‌ی اعلان رد شد. از تنظیمات مرورگر یا گوشی، اعلان مکتب را روشن کن.`:`اجازه‌ی اعلان داده نشد.`;let t=await Ot();if(!t)return`سرویس اعلان آماده نیست؛ صفحه را یک بار ببند و دوباره باز کن.`;try{let{publicKey:e}=await k(`GET`,`push/key`),n=await t.pushManager.getSubscription();return n||(n=await t.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:kt(e)})),await k(`POST`,`push/subscribe`,{subscription:n.toJSON(),tz:A()}),R(`on`),null}catch{return`روشن کردن یادآوری ممکن نشد. اتصال اینترنت را بررسی کن و دوباره امتحان کن.`}}async function Mt(){let e=await(await Ot())?.pushManager.getSubscription().catch(()=>null);e&&(await k(`POST`,`push/unsubscribe`,{endpoint:e.endpoint}).catch(()=>void 0),await e.unsubscribe().catch(()=>void 0)),R(`off`)}async function Nt(){return(await k(`POST`,`push/test`,{})).sent}var Pt=`maktab.reminderBanner.dismissed`;function Ft(){try{return localStorage.getItem(Pt)===`1`}catch{return!1}}function It(){try{localStorage.setItem(Pt,`1`)}catch{}}var z=null;function Lt(e){window.addEventListener(`beforeinstallprompt`,t=>{t.preventDefault(),z=t,e()}),window.addEventListener(`appinstalled`,()=>{z=null,e()})}var Rt=()=>z!==null;async function zt(){z&&(await z.prompt(),await z.userChoice.catch(()=>void 0),z=null)}var Bt={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`};function B(e){return String(e).replace(/[&<>"']/g,e=>Bt[e]??e)}function Vt(e){return(e/1e3).toFixed(2)}function Ht(e){return e===null?`—`:`${e}%`}var V=(e,t=``)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" ${t}>${e}</svg>`,H={today:V(`<path d="M5 4h14v17H5z"/><path d="M9 2v4M15 2v4M5 9h14"/><path d="M9 14.5l2 2 4-4"/>`),water:V(`<path d="M12 3.5c3.5 4.5 6 8 6 11a6 6 0 0 1-12 0c0-3 2.5-6.5 6-11z"/>`),history:V(`<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/><path d="M12 8v4.5l3 2"/>`),dashboard:V(`<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/>`),stats:V(`<path d="M3 20h18"/><path d="M4 16l5-6 4 3 7-8"/><circle cx="9" cy="10" r="0.6" fill="currentColor"/><circle cx="13" cy="13" r="0.6" fill="currentColor"/>`),gear:V(`<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><path d="M14 4.5v5h4v-5zM6 14.5v5h4v-5z"/>`),chevronDown:V(`<path d="M6 9l6 6 6-6"/>`),chevronRight:V(`<path d="M9 6l6 6-6 6"/>`),chevronLeft:V(`<path d="M15 6l-6 6 6 6"/>`),up:V(`<path d="M12 19V5M6 11l6-6 6 6"/>`),down:V(`<path d="M12 5v14M6 13l6 6 6-6"/>`),plus:V(`<path d="M12 5v14M5 12h14"/>`),trash:V(`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>`),pencil:V(`<path d="M4 20h4L19 9l-4-4L4 16z"/>`),calendar:V(`<path d="M4 5h16v15H4z"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="M12 13v5M9.5 15.5h5"/>`),bell:V(`<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5h4"/>`),logout:V(`<path d="M14 4H5v16h9"/><path d="M10 12h10M16 8l4 4-4 4"/>`),close:V(`<path d="M6 6l12 12M18 6L6 18"/>`),download:V(`<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>`),upload:V(`<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>`),done:V(`<path d="M5 12.5l4.5 4.5L19 7.5"/>`,`stroke-width="2"`),partial:V(`<path d="M6 12h12"/>`,`stroke-width="2"`),missed:V(`<path d="M7 7l10 10M17 7L7 17"/>`,`stroke-width="2"`)},U,W,Ut,Wt,Gt=0,Kt=null,qt=null;function Jt(e){e.insertAdjacentHTML(`beforeend`,`<div class="sheet" id="sheet" aria-hidden="true">
       <div class="sheet__scrim" data-action="sheet-close"></div>
       <div class="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
         <div class="sheet__grip" aria-hidden="true"></div>
         <div class="sheet__head">
           <h2 class="sheet__title" id="sheet-title"></h2>
           <button class="icon-btn" data-action="sheet-close" aria-label="بستن">${H.close}</button>
         </div>
         <div id="sheet-body"></div>
       </div>
     </div>
     <div class="toast" id="toast" role="status" aria-live="polite"></div>`),U=e.querySelector(`#sheet`),W=e.querySelector(`#sheet-body`),Ut=e.querySelector(`#sheet-title`),Wt=e.querySelector(`#toast`),document.addEventListener(`keydown`,e=>{e.key===`Escape`&&Yt()&&G()})}function Yt(){return U.classList.contains(`is-open`)}function Xt(e,t,n={}){Kt=document.activeElement instanceof HTMLElement?document.activeElement:null,qt=n.onClose??null,Ut.textContent=e,W.innerHTML=t,U.classList.add(`is-open`),U.setAttribute(`aria-hidden`,`false`),document.body.style.overflow=`hidden`;let r=W.querySelector(`[autofocus], input, textarea, select, button`);return window.setTimeout(()=>r?.focus({preventScroll:!0}),60),W}function Zt(e){return W.innerHTML=e,W}function G(){if(!Yt())return;U.classList.remove(`is-open`),U.setAttribute(`aria-hidden`,`true`),document.body.style.overflow=``;let e=qt;qt=null,e?.(),Kt?.focus({preventScroll:!0})}function K(e,t=2600){window.clearTimeout(Gt),Wt.textContent=e,Wt.classList.add(`is-visible`),Gt=window.setTimeout(()=>Wt.classList.remove(`is-visible`),t)}function Qt(e,t,n,r=!1){return new Promise(i=>{let a=!1,o=e=>{a||(a=!0,i(e))};Xt(e,`<div data-confirm-root>
         <p class="muted" style="margin:0 0 20px">${B(t)}</p>
         <div class="btn-row">
           <button class="btn ${r?`btn--danger`:`btn--primary`}" data-confirm="yes">${B(n)}</button>
           <button class="btn btn--ghost" data-confirm="no">انصراف</button>
         </div>
       </div>`,{onClose:()=>o(!1)}).querySelector(`[data-confirm-root]`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-confirm]`);t&&(o(t.dataset.confirm===`yes`),G())})})}var $t=!1;function en(){if(!(`serviceWorker`in navigator))return;let e=!1;navigator.serviceWorker.addEventListener(`controllerchange`,()=>{$t&&!e&&(e=!0,window.location.reload())}),window.addEventListener(`load`,()=>{navigator.serviceWorker.register(`./sw.js`,{scope:`./`}).then(e=>{let t=e=>tn(e);e.waiting&&navigator.serviceWorker.controller&&t(e.waiting),e.addEventListener(`updatefound`,()=>{let n=e.installing;n&&n.addEventListener(`statechange`,()=>{n.state===`installed`&&navigator.serviceWorker.controller&&t(n)})}),document.addEventListener(`visibilitychange`,()=>{document.visibilityState===`visible`&&e.update().catch(()=>void 0)})}).catch(()=>{})})}function tn(e){if(document.getElementById(`update-bar`))return;let t=document.createElement(`div`);t.id=`update-bar`,t.className=`banner settings-row`,t.style.cssText=`position:fixed;inset-inline:16px;top:72px;z-index:40;background:var(--charcoal);max-width:448px;margin:0 auto`,t.innerHTML=`<span>نسخه‌ی تازه‌ی اپ آماده است.</span>
    <button class="btn btn--primary" style="min-height:36px;padding:6px 14px">به‌روزرسانی</button>`,t.querySelector(`button`).addEventListener(`click`,()=>{$t=!0,e.postMessage({type:`SKIP_WAITING`}),K(`در حال به‌روزرسانی…`)}),document.body.appendChild(t)}function nn(e,t,n,r){if(!e.tasks.some(e=>e.id===n))return;let i=on(e,t);r===null?delete i.tasks[n]:i.tasks[n]=r,sn(e,t)}function rn(e,t,n){let r=on(e,t);r.journal=n.slice(0,S.journal),sn(e,t)}function an(){return{tasks:{},water:{},journal:``}}function q(e,t){return e.days[t]??an()}function on(e,t){let n=e.days[t];return n||(n=an(),e.days[t]=n),n}function sn(e,t){let n=e.days[t];if(!n)return;let r=Object.values(n.water).some(e=>e.count>0);Object.keys(n.tasks).length===0&&!r&&n.journal.trim()===``&&delete e.days[t]}var cn=new Set(x.map(e=>e.id));function ln(e){let t=e.name.trim().replace(/\s+/g,` `),n=e.note.trim().replace(/\s+/g,` `);return t?t.length>S.taskName?{ok:!1,error:`نام تسک حداکثر ${S.taskName} حرف است.`}:n.length>S.taskNote?{ok:!1,error:`توضیح حداکثر ${S.taskNote} حرف است.`}:cn.has(e.category)?{ok:!0,value:{name:t,note:n,category:e.category}}:{ok:!1,error:`دسته‌ی نامعتبر.`}:{ok:!1,error:`نام تسک را بنویس.`}}function un(e,t){return e.tasks.filter(e=>e.category===t)}function dn(e,t,n,r){let i={id:t,name:n.name,note:n.note,category:n.category,createdOn:r};return hn(e,i),i}function fn(e,t,n){let r=e.tasks.find(e=>e.id===t);r&&(r.name=n.name,r.note=n.note,r.category!==n.category&&(e.tasks=e.tasks.filter(e=>e.id!==t),r.category=n.category,hn(e,r)))}function pn(e,t){e.tasks=e.tasks.filter(e=>e.id!==t);for(let n of Object.keys(e.days)){let r=e.days[n];r&&t in r.tasks&&(delete r.tasks[t],sn(e,n))}}function mn(e,t,n){let r=e.tasks.find(e=>e.id===t);if(!r)return;let i=un(e,r.category),a=i[i.findIndex(e=>e.id===t)+n];if(!a)return;let o=e.tasks.indexOf(r),s=e.tasks.indexOf(a);e.tasks[o]=a,e.tasks[s]=r}function hn(e,t){let n=x.map(e=>e.id),r=n.indexOf(t.category),i=e.tasks.findIndex(e=>n.indexOf(e.category)>r);i===-1?e.tasks.push(t):e.tasks.splice(i,0,t)}function gn(e){let t=0;for(let n of Object.values(e.water))t+=n.ml*n.count;return t}function _n(e,t){return e>=t.fullMl?`done`:e>=t.partialMl?`partial`:`missed`}function vn(e,t){return q(e,t).waterGoal??e.waterGoal}function yn(e,t,n,r){if(r<0){let r=e.days[t]?.water[n];if(!r||r.count===0)return;--r.count,r.count===0&&delete e.days[t]?.water[n],sn(e,t);return}let i=e.days[t]?.water[n],a=e.containers.find(e=>e.id===n);if(!i&&!a)return;let o=on(e,t);i?i.count+=1:a&&(o.water[n]={name:a.name,ml:a.ml,count:1}),o.waterGoal||(o.waterGoal={...e.waterGoal})}function bn(e,t){let n=e.trim();if(!n)return{ok:!1,error:`نام ظرف را بنویس.`};if(n.length>S.containerName)return{ok:!1,error:`نام ظرف حداکثر ${S.containerName} حرف است.`};let r=typeof t==`number`?t:Number(wn(t.trim()).replace(/[,،٬]/g,``));return!Number.isInteger(r)||r<S.containerMinMl||r>S.containerMaxMl?{ok:!1,error:`حجم باید عدد صحیح بین ${S.containerMinMl} تا ${S.containerMaxMl} میلی‌لیتر باشد.`}:{ok:!0,value:{name:n,ml:r}}}function xn(e,t){e.containers.push(t)}function Sn(e,t){e.containers=e.containers.filter(e=>e.id!==t)}function Cn(e,t){let n=Number(wn(e.trim())),r=Number(wn(t.trim()));if(!Number.isFinite(n)||!Number.isFinite(r))return{ok:!1,error:`عدد معتبر وارد کن.`};let i=Math.round(n*1e3),a=Math.round(r*1e3);return a<=0?{ok:!1,error:`هدف «ناقص» باید بیشتر از صفر باشد.`}:i<=a?{ok:!1,error:`هدف «کامل» باید بیشتر از «ناقص» باشد.`}:i>S.goalMaxMl?{ok:!1,error:`هدف حداکثر ${S.goalMaxMl/1e3} لیتر است.`}:{ok:!0,value:{fullMl:i,partialMl:a}}}function wn(e){return e.replace(/[۰-۹]/g,e=>String(e.charCodeAt(0)-1776)).replace(/[٠-٩]/g,e=>String(e.charCodeAt(0)-1632)).replace(/٫/g,`.`)}var Tn=new URL(`mark-color-on-dark-BIREpE4H.svg`,import.meta.url).href,En={done:2,partial:1,missed:0},Dn=[{min:90,label:`فوق‌العاده`,tone:`top`},{min:70,label:`عالی`,tone:`great`},{min:40,label:`خوب`,tone:`good`},{min:0,label:`نیاز به بهبود`,tone:`low`}];function J(e){return Dn.find(t=>e>=t.min)??Dn[Dn.length-1]}function On(e,t){return e.filter(e=>e.createdOn===null||e.createdOn<=t)}function kn(e,t,n,r=q(e,n)){if(t.link===`water`)return _n(gn(r),vn(e,n));let i=r.tasks[t.id];if(i)return i;if(t.link===`journal`&&r.journal.trim()!==``)return`done`}function An(e){return Object.keys(e.tasks).length>0||gn(e)>0||e.journal.trim()!==``}function Y(e,t){let n=q(e,t),r=On(e.tasks,t),i=r.length*En.done,a=0;for(let i of r){let r=kn(e,i,t,n);r&&(a+=En[r])}let o=!An(n)||i===0?null:Math.round(a/i*100);return{score:a,max:i,pct:o}}function jn(e,t){let n=Object.keys(e.days).filter(e=>e<=t).sort(),r=[e.firstUse,...n].filter(e=>e<=t).sort()[0]??t,i=t=>{let{pct:n}=Y(e,t);return n!==null&&n>=70},a=0,o=0;for(let e of de(r,t))o=i(e)?o+1:0,o>a&&(a=o);let s=0,c=i(t)?t:ie(t,-1);for(;c>=r&&i(c);)s+=1,c=ie(c,-1);return{current:s,best:a}}function Mn(e,t){return e.tasks.map(n=>{let r=0,i=0;for(let a of t){if(n.createdOn!==null&&n.createdOn>a)continue;let t=q(e,a);if(!An(t))continue;i+=En.done;let o=kn(e,n,a,t);o&&(r+=En[o])}return{task:n,rate:i===0?null:Math.round(r/i*100)}})}var Nn=340,Pn=210,X={top:14,right:10,bottom:26,left:34},Fn=[0,40,70,100];function In(e,t,n){let r=Nn-X.left-X.right,i=Pn-X.top-X.bottom,a=e=>X.left+(e-1)/Math.max(1,n-1)*r,o=e=>X.top+(1-e/100)*i,s=Fn.map(e=>`<line x1="${X.left}" x2="${Nn-X.right}" y1="${o(e)}" y2="${o(e)}" stroke="var(--line)" stroke-width="1"
        ${e===70?`stroke-dasharray="3 3"`:``}/>
      <text x="${X.left-6}" y="${o(e)+3}" text-anchor="end">${e}%</text>`).join(``),c=[1,5,10,15,20,25,n].filter((e,t,r)=>e<=n&&r.indexOf(e)===t&&!(e!==n&&n-e<3)).map(e=>`<text x="${a(e)}" y="202" text-anchor="middle">${e}</text>`).join(``),l=``,u=!1;for(let t of e){if(t.pct===null){u=!1;continue}let e=_(t.day).jd;l+=`${u?`L`:`M`}${a(e).toFixed(1)} ${o(t.pct).toFixed(1)} `,u=!0}let d=e.filter(e=>e.pct!==null),f=d.find(e=>e.day===t),p=f?`<line x1="${a(_(f.day).jd)}" x2="${a(_(f.day).jd)}" y1="${X.top}" y2="${Pn-X.bottom}"
         stroke="var(--copper)" stroke-width="1" opacity="0.5"/>`:``,ee=d.map(e=>{let n=a(_(e.day).jd).toFixed(1),r=o(e.pct).toFixed(1),i=e.day===t;return`<circle cx="${n}" cy="${r}" r="${i?5:3}" fill="${i?`var(--cream)`:`var(--copper)`}"
          stroke="${i?`var(--copper)`:`none`}" stroke-width="2"/>`}).join(``),m=d.map(e=>`<circle cx="${a(_(e.day).jd).toFixed(1)}" cy="${o(e.pct).toFixed(1)}" r="14" fill="transparent"
          data-action="chart-point" data-day="${B(e.day)}" style="cursor:pointer"><title>${e.pct}%</title></circle>`).join(``);return`<svg class="chart" viewBox="0 0 ${Nn} ${Pn}" role="img" aria-label="نمودار درصد امتیاز روزانه">
      ${s}${c}${p}
      <path d="${l.trim()}" fill="none" stroke="var(--copper)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
      ${ee}${m}
    </svg>`}function Ln(e){return oe(e).filter(e=>e<=D.today)}function Rn(e,t=`month`){let n=y(e,D.minMonth)>0,r=y(e,D.maxMonth)<0;return`<div class="month-nav">
      <button class="icon-btn" data-action="${t}" data-delta="-1" aria-label="ماه قبل" ${n?``:`disabled style="opacity:.25"`}>${H.chevronRight}</button>
      <div class="month-nav__title">${B(b(e))}</div>
      <button class="icon-btn" data-action="${t}" data-delta="1" aria-label="ماه بعد" ${r?``:`disabled style="opacity:.25"`}>${H.chevronLeft}</button>
    </div>`}function zn(e){return e===null?`cal__cell--empty`:`heat-${J(e).tone}`}function Bn(e,t){let n=oe(e),r=ae(n[0]);return`<div class="cal">${p.map(e=>`<div class="cal__dow" aria-hidden="true">${e}</div>`).join(``)}${Array.from({length:r},()=>`<div aria-hidden="true"></div>`).join(``)}${n.map((e,n)=>{let r=e>D.today,{pct:i}=Y(D.data,e),a=[`cal__cell`,`num`,r?``:zn(i),e===D.today?`cal__cell--today`:``,e===t.selected?`cal__cell--selected`:``].filter(Boolean).join(` `),o=`${ce(e)}${i===null?``:` · ${i}%`}`;return`<button class="${a}" data-action="${t.action}" data-day="${e}" aria-label="${B(o)}"
          ${r?`disabled`:``}>${n+1}</button>`}).join(``)}</div>`}function Vn(){return`<div class="legend" aria-hidden="true">
      <span><i class="heat-top"></i><span class="num">90%+</span></span>
      <span><i class="heat-great"></i><span class="num">70–89%</span></span>
      <span><i class="heat-good"></i><span class="num">40–69%</span></span>
      <span><i class="heat-low"></i>زیر <span class="num">40%</span></span>
    </div>`}function Hn(){let e=D.ui.viewMonth,t=Ln(e).reverse().map(e=>{let{pct:t,score:n,max:r}=Y(D.data,e),i=t===null?null:J(t);return`<button class="day-row" data-action="open-day" data-day="${e}">
          <span class="day-row__dot ${t===null?``:zn(t)}" style="${t===null?`border:1px solid var(--line)`:``}"></span>
          <span class="day-row__date">
            <span class="task__name">${B(ce(e))}</span>
            <span class="task__note">${i?`${B(i.label)} · <span class="num">${n}/${r}</span>`:`ثبت نشده`}</span>
          </span>
          <span class="day-row__pct num ${i?`tone-${i.tone}`:`muted`}">${Ht(t)}</span>
          <span class="muted" style="width:16px">${H.chevronLeft}</span>
        </button>`}).join(``);return`<div class="stack">
      ${Rn(e)}
      <section class="panel" aria-label="روزهای ${B(b(e))}">
        ${t||`<div class="empty">روزی برای نمایش نیست.</div>`}
      </section>
      <p class="small muted" style="text-align:center">روی هر روز بزن تا آن را ببینی یا ویرایش کنی.</p>
    </div>`}function Un(e){let t=Ln(e).map(e=>Y(D.data,e).pct).filter(e=>e!==null);return{avg:t.length?Math.round(t.reduce((e,t)=>e+t,0)/t.length):null,excellent:t.filter(e=>e>=70).length,recorded:t.length}}function Wn(){let e=D.ui.viewMonth,t=Un(e),n=jn(D.data,D.today);return`<div class="stack">
      ${Rn(e)}
      <div class="tiles">
        <div class="tile"><div class="label">AVERAGE</div><div class="small muted">میانگین ماه</div>
          <div class="tile__value num">${Ht(t.avg)}</div></div>
        <div class="tile"><div class="label">70%+</div><div class="small muted">روزهای عالی</div>
          <div class="tile__value num">${t.excellent} <small>از ${t.recorded}</small></div></div>
        <div class="tile"><div class="label">STREAK</div><div class="small muted">پیوستگی فعلی</div>
          <div class="tile__value num tone-top">${n.current} <small>روز</small></div></div>
        <div class="tile"><div class="label">BEST</div><div class="small muted">بهترین پیوستگی</div>
          <div class="tile__value num">${n.best} <small>روز</small></div></div>
      </div>
      <section class="panel" aria-labelledby="heat-title">
        <div class="panel__head">
          <div><div class="label">HEATMAP</div><h2 class="panel__title" id="heat-title">تقویم ${B(b(e))}</h2></div>
        </div>
        <div class="panel__body">
          ${Bn(e,{action:`open-day`})}
          ${Vn()}
        </div>
      </section>
      <p class="small muted" style="text-align:center">پیوستگی یعنی روزهای پشت‌سرهم با امتیاز <span class="num">70%</span> یا بیشتر.</p>
    </div>`}function Gn(){let e=D.ui.viewMonth,t=oe(e),n=t.filter(e=>e<=D.today).map(e=>({day:e,pct:Y(D.data,e).pct})),r=Un(e),i=D.ui.chartDay&&n.some(e=>e.day===D.ui.chartDay&&e.pct!==null)?D.ui.chartDay:null,a=i?Y(D.data,i).pct:null,o=i&&a!==null?`<span>${B(ue(i))} · <span class="${`tone-${J(a).tone}`}">${B(J(a).label)}</span></span>
         <strong class="num">${a}%</strong>`:`<span class="muted">میانگین ${B(b(e))} · <span class="num">${r.recorded}</span> روز ثبت‌شده</span>
         <strong class="num">${Ht(r.avg)}</strong>`,s=Mn(D.data,t.filter(e=>e<=D.today)).sort((e,t)=>(e.rate??101)-(t.rate??101)).map(({task:e,rate:t})=>{let n=t===null?`muted`:`tone-${J(t).tone}`,r=t===null?``:`<span class="${zn(t)}" style="width:${t}%"></span>`;return`<div class="rate">
          <div class="rate__head"><span>${B(e.name)}</span><span class="num ${n}">${Ht(t)}</span></div>
          <div class="rate__track">${r}</div>
        </div>`}).join(``);return`<div class="stack">
      ${Rn(e)}
      <section class="panel" aria-labelledby="chart-title">
        <div class="panel__head">
          <div><div class="label">MONTHLY CHART</div><h2 class="panel__title" id="chart-title">روند امتیاز روزانه</h2></div>
        </div>
        <div class="panel__body">
          <div class="chart__readout" aria-live="polite">${o}</div>
          ${r.recorded?In(n,i,t.length):`<div class="empty">در این ماه هنوز روزی ثبت نشده است.</div>`}
          <p class="small muted" style="margin:8px 0 0">روی هر نقطه بزن. خط‌چین مرز <span class="num">70%</span> است؛ روزهای ثبت‌نشده خط را قطع می‌کنند.</p>
        </div>
      </section>
      <section class="panel" aria-labelledby="rates-title">
        <div class="panel__head">
          <div><div class="label">HABITS</div><h2 class="panel__title" id="rates-title">عملکرد عادت‌ها (از ضعیف‌ترین)</h2></div>
        </div>
        <div class="panel__body">${s||`<div class="empty">تسکی وجود ندارد.</div>`}</div>
      </section>
    </div>`}var Kn=`2.0.0`,qn=`bardia.bkhaledi@gmail.com`,Jn=e=>String(Number((e/1e3).toFixed(2))),Z=e=>e.replace(`<svg`,`<svg width="18" height="18"`),Yn={synced:`همه‌ی داده‌ها روی حساب ذخیره شده است.`,pending:`در حال ذخیره روی حساب…`,offline:`آفلاین — تغییرات روی گوشی ذخیره شده و با وصل شدن اینترنت ارسال می‌شود.`,error:`ارسال به سرور ممکن نشد؛ دوباره تلاش می‌کنیم. داده‌ها روی گوشی امن است.`};function Xn(){let e=D.user;if(!e)return``;let t=ut();return`<section class="panel" aria-labelledby="account-title">
      <div class="panel__head"><div><div class="label">ACCOUNT</div><h2 class="panel__title" id="account-title">حساب کاربری</h2></div></div>
      <div class="panel__body">
        <div class="task__name">${B(e.name)}</div>
        <div class="small muted num" dir="ltr" style="text-align:right">${B(e.phone)}</div>
        <p class="small ${t===`synced`||t===`pending`?`muted`:`tone-low`}" style="margin:12px 0 14px" aria-live="polite">${B(Yn[t])}</p>
        <button class="btn btn--ghost btn--block" data-action="logout">${Z(H.logout)} خروج از حساب</button>
      </div>
    </section>`}function Zn(e){switch(e){case`on`:return`<p class="small muted" style="margin:0 0 14px">روشن است. هر شب ساعت <span class="num">21:30</span> اگر کاری از امروز مانده باشد، نامش را در اعلان می‌بینی.</p>
        <div class="btn-row">
          <button class="btn btn--ghost" data-action="test-reminder">اعلان آزمایشی</button>
          <button class="btn btn--ghost" data-action="disable-reminders">خاموش کن</button>
        </div>`;case`off`:case`unknown`:return`<p class="small muted" style="margin:0 0 14px">هر شب ساعت <span class="num">21:30</span> کارهای ناتمام امروز را با نام در یک اعلان یادآوری می‌کنیم.</p>
        <button class="btn btn--primary btn--block" data-action="enable-reminders">${Z(H.bell)} روشن کردن یادآوری</button>`;case`denied`:return`<p class="small muted" style="margin:0">اعلان‌های مکتب در این مرورگر مسدود شده است. از تنظیمات گوشی یا مرورگر (بخش Notifications سایت) اجازه بده و اپ را دوباره باز کن.</p>`;case`needs-install`:return`<p class="small muted" style="margin:0">در آیفون اعلان فقط برای اپ نصب‌شده کار می‌کند: در Safari دکمه‌ی Share و بعد <span dir="ltr">Add to Home Screen</span> را بزن، اپ را از آیکن صفحه‌ی اصلی باز کن و این‌جا یادآوری را روشن کن.</p>`;default:return`<p class="small muted" style="margin:0">این مرورگر از اعلان پشتیبانی نمی‌کند. اپ را در Chrome (اندروید) یا Safari (آیفون) نصب کن.</p>`}}function Qn(){if(Et())return``;let e;return e=Rt()?`<button class="btn btn--primary btn--block" data-action="install-app">${Z(H.download)} نصب اپ روی گوشی</button>`:Tt()?`<p class="small muted" style="margin:0">در Safari دکمه‌ی Share و بعد <span dir="ltr">Add to Home Screen</span> را بزن.</p>`:`<p class="small muted" style="margin:0">از منوی مرورگر گزینه‌ی «نصب برنامه» یا «Add to Home screen» را بزن.</p>`,`<section class="panel" aria-labelledby="install-title">
      <div class="panel__head"><h2 class="panel__title" id="install-title">نصب اپ</h2></div>
      <div class="panel__body">${e}</div>
    </section>`}function $n(){let{waterGoal:e}=D.data;return`<div class="stack">
      <div>
        <div class="label">SETTINGS</div>
        <h1 class="title">تنظیمات</h1>
      </div>

      ${Xn()}

      <section class="panel" aria-labelledby="reminder-title">
        <div class="panel__head"><div><div class="label">REMINDER</div><h2 class="panel__title" id="reminder-title">یادآوری شبانه</h2></div></div>
        <div class="panel__body">${D.serverMode?Zn(Ct()):`<p class="small muted" style="margin:0">به‌زودی: یادآوری هر شب ساعت <span class="num">21:30</span> با نام کارهای ناتمام، همراه با حساب کاربری و ذخیره‌ی داده روی سرور.</p>`}</div>
      </section>

      ${Qn()}

      <section class="panel" aria-labelledby="goal-title">
        <div class="panel__head"><h2 class="panel__title" id="goal-title">هدف آب روزانه</h2></div>
        <form class="panel__body" data-form="goal" novalidate>
          <label class="field">
            <span class="field__label">«کامل» از (لیتر)</span>
            <input class="input input--ltr" name="full" inputmode="decimal" value="${B(Jn(e.fullMl))}" autocomplete="off" />
          </label>
          <label class="field">
            <span class="field__label">«ناقص» از (لیتر)</span>
            <input class="input input--ltr" name="partial" inputmode="decimal" value="${B(Jn(e.partialMl))}" autocomplete="off" />
          </label>
          <div class="error" data-error></div>
          <button class="btn btn--primary btn--block" type="submit">ذخیره‌ی هدف</button>
          <p class="small muted" style="margin:10px 0 0">هدف جدید از امروز اعمال می‌شود؛ روزهایی که قبلاً آب ثبت کرده‌اند تغییر نمی‌کنند.</p>
        </form>
      </section>

      <section class="panel" aria-labelledby="backup-title">
        <div class="panel__head"><h2 class="panel__title" id="backup-title">پشتیبان‌گیری</h2></div>
        <div class="panel__body">
          <p class="small muted" style="margin:0 0 14px">${D.user?`داده‌هایت روی حساب تو ذخیره می‌شود و با ورود روی هر گوشی برمی‌گردد. برای اطمینان بیشتر می‌توانی یک فایل پشتیبان هم نگه داری.`:`داده‌هایت فقط روی همین گوشی ذخیره می‌شود. پیش از تعویض گوشی یا پاک کردن داده‌های مرورگر، فایل پشتیبان بگیر.`}</p>
          <div class="btn-row">
            <button class="btn btn--ghost" data-action="export-backup">${Z(H.download)} دریافت فایل</button>
            <button class="btn btn--ghost" data-action="import-backup">${Z(H.upload)} بازیابی</button>
          </div>
          <input type="file" accept="application/json,.json" id="backup-file" hidden />
        </div>
      </section>

      <p class="small muted" style="text-align:center">نسخه‌ی <span class="num">${B(Kn)}</span></p>

      <p class="fine-print"><a href="mailto:${qn}">ارتباط با سازنده · <span class="num">${qn}</span></a></p>
    </div>`}var er={done:`کامل`,partial:`ناقص`,missed:`انجام نشده`},tr=[`done`,`partial`,`missed`];function nr(){let{activeDay:e}=D.ui;return e===D.today?``:`<div class="banner settings-row">
      <span>در حال ثبت برای <strong>${B(ue(e))}</strong></span>
      <button class="btn btn--ghost" style="min-height:36px;padding:6px 12px" data-action="go-today">بازگشت به امروز</button>
    </div>`}function rr(){let{activeDay:e}=D.ui,t=Y(D.data,e),n=t.pct===null?null:J(t.pct),r=t.max===0?0:t.score/t.max;return`<section class="panel score" aria-label="ارزیابی روز">
      <div>
        <div class="label">DAILY SCORE</div>
        <div class="score__pct num">${t.pct===null?`—`:`${t.pct}<small>%</small>`}</div>
      </div>
      <div class="score__meta">
        <div class="score__level ${n?`tone-${n.tone}`:`muted`}">${n?B(n.label):`هنوز ثبت نشده`}</div>
        <div class="small muted"><span class="num">${t.score} / ${t.max}</span> امتیاز</div>
      </div>
      <div class="bar" aria-hidden="true"><span style="transform:scaleX(${r.toFixed(3)})"></span></div>
    </section>`}function ir(e,t){return`<div class="states" role="group" aria-label="${B(e.name)}">
    ${tr.map(n=>`<button class="state state--${n}" data-action="set-status" data-task="${B(e.id)}" data-status="${n}"
         data-key="st-${B(e.id)}-${n}" aria-pressed="${t===n}" aria-label="${er[n]}">${H[n]}</button>`).join(``)}
  </div>`}function ar(e,t){let n=gn(q(D.data,D.ui.activeDay));return`<div class="task">
      <div class="task__text">
        <div class="task__name">${B(e.name)}</div>
        <span class="task__note">محاسبه‌ی خودکار از آب‌سنج</span>
      </div>
      <button class="chip" data-action="tab" data-tab="water" aria-label="باز کردن آب‌سنج">
        <span class="num">${Vt(n)} L</span>
        <span class="state state--${t} state--mini${n>0?` is-on`:``}" aria-label="${er[t]}">${H[t]}</span>
      </button>
    </div>`}function or(e){let[t,n,r]=ie(e,1).split(`-`);return`https://calendar.google.com/calendar/r/day/${t}/${Number(n)}/${Number(r)}`}function sr(){return`<a class="cal-link" href="${or(D.ui.activeDay)}" target="_blank" rel="noopener noreferrer"
      aria-label="برنامه‌ریزی فردا در گوگل کلندر" title="برنامه‌ریزی فردا در گوگل کلندر">${H.calendar}<span>کلندر</span></a>`}function cr(e){let{activeDay:t}=D.ui,n=q(D.data,t),r=kn(D.data,e,t,n);if(e.link===`water`)return ar(e,r??`missed`);let i=e.link===`journal`&&!n.tasks[e.id]&&r===`done`;return`<div class="task">
      <div class="task__text">
        <div class="task__name">${B(e.name)}</div>
        ${i?`<span class="task__auto">خودکار از ژورنال</span>`:``}
        ${e.note?`<span class="task__note">${B(e.note)}</span>`:``}
      </div>
      ${e.id===`t-planning`?sr():``}
      ${ir(e,i?void 0:r)}
    </div>`}function lr(e,t,n){return`<div class="task task--edit">
      <button class="task__text" style="text-align:inherit" data-action="edit-task" data-task="${B(e.id)}">
        <div class="task__name">${B(e.name)} <span class="muted" style="display:inline-block;width:14px;vertical-align:-2px">${H.pencil}</span></div>
        ${e.note?`<span class="task__note">${B(e.note)}</span>`:``}
      </button>
      <div class="reorder">
        <button class="icon-btn" data-action="move-task" data-task="${B(e.id)}" data-dir="-1" data-key="mv-${B(e.id)}-up"
          aria-label="بالا بردن" ${t===0?`disabled`:``}>${H.up}</button>
        <button class="icon-btn" data-action="move-task" data-task="${B(e.id)}" data-dir="1" data-key="mv-${B(e.id)}-down"
          aria-label="پایین آوردن" ${t===n-1?`disabled`:``}>${H.down}</button>
      </div>
    </div>`}function ur(){let{activeDay:e,editTasks:t}=D.ui,n=new Set(On(D.data.tasks,e).map(e=>e.id));return x.map(e=>{let r=un(D.data,e.id),i=t?r:r.filter(e=>n.has(e.id)),a=i.length?i.map((e,n)=>t?lr(e,n,i.length):cr(e)).join(``):`<div class="empty">تسکی در این دسته نیست.</div>`;return`<section class="panel cat" aria-labelledby="cat-${e.id}">
        <div class="cat__head">
          <div>
            <div class="label">${e.index} / ${e.label}</div>
            <h2 class="cat__name" id="cat-${e.id}">${B(e.title)}</h2>
          </div>
          <span class="cat__count num">${i.length}</span>
        </div>
        ${a}
        ${t?`<button class="add-row" data-action="add-task" data-category="${e.id}">${H.plus.replace(`<svg`,`<svg width="16" height="16"`)} افزودن تسک</button>`:``}
      </section>`}).join(``)}function dr(){let{activeDay:e}=D.ui,t=q(D.data,e).journal;return`<section class="panel" aria-labelledby="journal-title">
      <div class="panel__head">
        <div>
          <div class="label">JOURNAL</div>
          <h2 class="panel__title" id="journal-title">ژورنال ${e===D.today?`امروز`:B(ue(e))}</h2>
        </div>
      </div>
      <div class="panel__body">
        <label class="sr-only" for="journal">متن ژورنال</label>
        <textarea class="textarea" id="journal" data-input="journal" data-key="journal" maxlength="${S.journal}"
          placeholder="امروز بابت چه چیزهایی شکرگزاری؟ چه کارهایی انجام دادی؟">${B(t)}</textarea>
        <div class="journal__meta">
          <span>ذخیره‌ی خودکار</span>
          <span class="num" id="journal-count">${t.length} / ${S.journal}</span>
        </div>
      </div>
    </section>`}function fr(){let e=Ct();return D.ui.activeDay!==D.today||Ft()||e!==`off`&&e!==`needs-install`?``:`<div class="banner reminder-banner">
      <span>${e===`off`?`هر شب ساعت <span class="num">21:30</span> کارهای ناتمام امروز را یادآوری کنیم؟`:`برای یادآوری شبانه در آیفون، اول از دکمه‌ی Share گزینه‌ی <span dir="ltr">Add to Home Screen</span> را بزن و اپ را از همان آیکن باز کن.`}</span>
      <span class="reminder-banner__actions">
        ${e===`off`?`<button class="btn btn--primary btn--sm" data-action="enable-reminders">روشن کن</button>`:``}
        <button class="icon-btn" data-action="dismiss-reminder-banner" aria-label="بستن">${H.close}</button>
      </span>
    </div>`}function pr(){let{editTasks:e}=D.ui;return`<div class="stack">
      ${nr()}
      ${e?``:fr()}
      ${e?`<div class="banner">ترتیب، نام و دسته‌ی تسک‌ها را تغییر بده. تغییرات روی همه‌ی روزها اعمال می‌شود.</div>`:rr()}
      ${ur()}
      <button class="btn ${e?`btn--primary`:`btn--ghost`} btn--block" data-action="toggle-edit-tasks" data-key="toggle-edit">
        ${e?`پایان ویرایش`:`${H.pencil.replace(`<svg`,`<svg width="16" height="16"`)} ویرایش تسک‌ها`}
      </button>
      ${e?``:dr()}
    </div>`}var mr={done:`کامل`,partial:`ناقص`,missed:`هنوز به هدف نرسیده`};function hr(){let{activeDay:e,editContainers:t}=D.ui,n=q(D.data,e),r=gn(n),i=vn(D.data,e),a=_n(r,i),o=Math.min(1,r/i.fullMl),s=D.data.containers.map(e=>{let r=n.water[e.id]?.count??0,i=t?`<button class="icon-btn" style="border:1px solid var(--line)" data-action="delete-container" data-id="${B(e.id)}"
             aria-label="حذف ${B(e.name)}">${H.trash}</button>`:`<div class="stepper">
             <button class="stepper__btn" data-action="water" data-id="${B(e.id)}" data-delta="-1" data-key="w-${B(e.id)}-minus"
               aria-label="کم کردن ${B(e.name)}" ${r===0?`disabled`:``}>−</button>
             <span class="stepper__count num" aria-live="polite">${r}</span>
             <button class="stepper__btn stepper__btn--plus" data-action="water" data-id="${B(e.id)}" data-delta="1" data-key="w-${B(e.id)}-plus"
               aria-label="افزودن ${B(e.name)}">+</button>
           </div>`;return`<div class="container-row">
          <div class="task__text">
            <div class="task__name">${B(e.name)}</div>
            <span class="task__note num">${e.ml} ml</span>
          </div>
          ${i}
        </div>`}).join(``),c=new Set(D.data.containers.map(e=>e.id)),l=Object.entries(n.water).filter(([e])=>!c.has(e)).map(([e,t])=>`<div class="container-row">
          <div class="task__text">
            <div class="task__name">${B(t.name)} <span class="small muted">(حذف‌شده)</span></div>
            <span class="task__note num">${t.ml} ml</span>
          </div>
          <div class="stepper">
            <button class="stepper__btn" data-action="water" data-id="${B(e)}" data-delta="-1" aria-label="کم کردن ${B(t.name)}">−</button>
            <span class="stepper__count num">${t.count}</span>
          </div>
        </div>`).join(``);return`<div class="stack">
      ${nr()}
      <section class="panel water-total" aria-label="مجموع آب">
        <div class="label">WATER</div>
        <div class="water-total__value num">${Vt(r)}<span class="water-total__unit"> L</span></div>
        <div class="water-goal" aria-hidden="true"><span style="width:${(o*100).toFixed(1)}%"></span></div>
        <div class="small"><span class="${a===`done`?`tone-top`:a===`partial`?`tone-great`:`muted`}">${mr[a]}</span></div>
        <div class="small muted">هدف کامل <span class="num">${Vt(i.fullMl)} L</span> · ناقص از <span class="num">${Vt(i.partialMl)} L</span></div>
      </section>

      <section class="panel" aria-labelledby="containers-title">
        <div class="panel__head">
          <div>
            <div class="label">CONTAINERS</div>
            <h2 class="panel__title" id="containers-title">ظرف‌ها</h2>
          </div>
          <button class="btn btn--ghost" style="min-height:36px;padding:6px 12px" data-action="toggle-edit-containers">
            ${t?`پایان`:`ویرایش`}
          </button>
        </div>
        ${s||`<div class="empty">ظرفی تعریف نشده است.</div>`}
        ${l}
        ${t?`<button class="add-row" data-action="add-container">${H.plus.replace(`<svg`,`<svg width="16" height="16"`)} افزودن ظرف</button>`:``}
      </section>
      <button class="btn btn--ghost btn--block" data-action="tab" data-tab="settings">تغییر هدف روزانه</button>
    </div>`}var gr=[{tab:`today`,label:`امروز`,icon:`today`},{tab:`water`,label:`آب‌سنج`,icon:`water`},{tab:`history`,label:`تاریخچه`,icon:`history`},{tab:`dashboard`,label:`داشبورد`,icon:`dashboard`},{tab:`stats`,label:`آمار`,icon:`stats`}],_r={today:pr,water:hr,history:Hn,dashboard:Wn,stats:Gn,settings:$n},vr,yr,br=null,xr=e=>`${e}-${typeof crypto<`u`&&`randomUUID`in crypto?crypto.randomUUID():`${Date.now().toString(36)}${Math.random().toString(36).slice(2,10)}`}`;function Sr(e){e.innerHTML=`
    <img class="edge-mark" src="${Tn}" alt="" aria-hidden="true" />
    <header class="appbar">
      <div class="appbar__inner">
        <div class="brand">
          <img class="brand__mark" src="${Tn}" alt="" />
          <div>
            <div class="brand__name">مکتب</div>
            <span class="brand__sub">مدرسه فکری رفتار و انضباط</span>
          </div>
        </div>
        <button class="appbar__date" id="date-btn" data-action="open-picker" aria-haspopup="dialog"></button>
        <button class="icon-btn" data-action="tab" data-tab="settings" aria-label="تنظیمات">${H.gear}</button>
      </div>
    </header>
    <main class="main" id="main" tabindex="-1"></main>
    <nav class="nav" aria-label="بخش‌ها">
      <div class="nav__inner">
        ${gr.map(e=>`<button class="nav__btn" data-action="tab" data-tab="${e.tab}">${H[e.icon]}<span>${e.label}</span></button>`).join(``)}
      </div>
    </nav>`,Jt(e),vr=e.querySelector(`#main`),yr=e.querySelector(`#date-btn`),document.addEventListener(`click`,wr),document.addEventListener(`submit`,Or),document.addEventListener(`input`,Tr),document.addEventListener(`change`,Dr),document.addEventListener(`focusout`,Er),D.onSaveError=e=>{D.saveErrorShown||(D.saveErrorShown=!0,K(e===`quota`?`فضای ذخیره‌سازی مرورگر پر است؛ تغییرات ذخیره نشد.`:`ذخیره‌سازی در این مرورگر ممکن نیست.`,6e3))},D.subscribe(Q);let t=()=>{let e=document.activeElement;e instanceof HTMLTextAreaElement||e instanceof HTMLInputElement||Q()};wt(t),dt(()=>{D.ui.tab===`settings`&&t()}),Q(),D.persistent||K(`ذخیره‌سازی در این مرورگر غیرفعال است؛ داده‌ها پس از بستن اپ از بین می‌روند.`,7e3),D.recoveredFromCorruption&&K(`داده‌های ذخیره‌شده قابل خواندن نبود؛ یک نسخه کنار گذاشته شد و اپ از نو شروع شد.`,7e3),window.setInterval(()=>D.checkDayRollover(),6e4),document.addEventListener(`visibilitychange`,()=>{document.visibilityState===`visible`&&D.checkDayRollover()})}function Q(){let{tab:e,activeDay:t,viewMonth:n}=D.ui,r=document.activeElement?.dataset?.key,i=e===`today`||e===`water`,a=e===`settings`?D.today:t,o=_(a).jy===_(D.today).jy?le(a):ce(a);yr.innerHTML=`${B(i||e===`settings`?o:b(n))}${H.chevronDown}`,yr.setAttribute(`aria-label`,`انتخاب تاریخ — ${yr.textContent??``}`);for(let t of document.querySelectorAll(`.nav__btn`))t.dataset.tab===e?t.setAttribute(`aria-current`,`page`):t.removeAttribute(`aria-current`);vr.innerHTML=_r[e](),e!==br&&(window.scrollTo({top:0}),br=e),r&&vr.querySelector(`[data-key="${CSS.escape(r)}"]`)?.focus({preventScroll:!0})}var Cr={tab:e=>{let t=e.dataset.tab;G(),D.setUi({tab:t,editTasks:!1,editContainers:!1,chartDay:null})},"go-today":()=>D.setUi({activeDay:D.today,viewMonth:v(D.today)}),"set-status":e=>{let t=e.dataset.task,n=e.dataset.status,r=e.getAttribute(`aria-pressed`)===`true`;D.mutate(e=>nn(e,D.ui.activeDay,t,r?null:n))},water:e=>{let t=e.dataset.delta===`1`?1:-1;D.mutate(n=>yn(n,D.ui.activeDay,e.dataset.id,t))},"toggle-edit-tasks":()=>D.setUi({editTasks:!D.ui.editTasks}),"toggle-edit-containers":()=>D.setUi({editContainers:!D.ui.editContainers}),"move-task":e=>D.mutate(t=>mn(t,e.dataset.task,e.dataset.dir===`1`?1:-1)),"add-task":e=>kr(null,e.dataset.category),"edit-task":e=>kr(e.dataset.task,null),"delete-task":async e=>{let t=e.dataset.task,n=D.data.tasks.find(e=>e.id===t);n&&await Qt(`حذف تسک`,`«${n.name}» و همه‌ی سابقه‌ی ثبت‌شده‌اش پاک می‌شود و امتیاز روزهای گذشته دوباره حساب می‌شود. این کار برگشت‌پذیر نیست.`,`حذف کن`,!0)&&(D.mutate(e=>pn(e,t)),K(`تسک حذف شد.`))},"add-container":()=>Ar(),"delete-container":async e=>{let t=D.data.containers.find(t=>t.id===e.dataset.id);t&&await Qt(`حذف ظرف`,`«${t.name}» از فهرست حذف می‌شود. آب‌هایی که قبلاً با آن ثبت شده سر جایشان می‌مانند.`,`حذف کن`,!0)&&D.mutate(e=>Sn(e,t.id))},month:e=>D.setUi({viewMonth:se(D.ui.viewMonth,Number(e.dataset.delta)),chartDay:null}),"open-day":e=>{let t=e.dataset.day;t>D.today||D.setUi({tab:`today`,activeDay:t,editTasks:!1})},"chart-point":e=>{let t=e.dataset.day;D.setUi({chartDay:D.ui.chartDay===t?null:t})},"open-picker":()=>Mr(),"picker-month":e=>{let t=Number(e.dataset.delta);D.setUi({viewMonth:se(D.ui.viewMonth,t),chartDay:null}),Zt(jr())},"picker-day":e=>{let t=e.dataset.day;t>D.today||(G(),D.setUi({tab:D.ui.tab===`water`?`water`:`today`,activeDay:t,viewMonth:v(t),editTasks:!1}))},"picker-today":()=>{G(),D.setUi({activeDay:D.today,viewMonth:v(D.today)})},"sheet-close":()=>G(),"enable-reminders":async e=>{e.disabled=!0;let t=await jt();e.disabled=!1,t?K(t,6e3):(It(),K(`یادآوری شبانه روشن شد: هر شب ساعت ۲۱:۳۰.`,4e3)),Q()},"disable-reminders":async()=>{await Mt(),K(`یادآوری شبانه خاموش شد.`),Q()},"test-reminder":async e=>{e.disabled=!0;try{K(await Nt()>0?`اعلان آزمایشی فرستاده شد.`:`اعلانی فرستاده نشد؛ یادآوری را یک بار خاموش و روشن کن.`,4e3)}catch(e){K(e instanceof Error&&e.message!==`offline`?e.message:`اتصال اینترنت برقرار نیست.`,4e3)}e.disabled=!1},"dismiss-reminder-banner":()=>{It(),Q()},"install-app":async()=>{await zt(),Q()},logout:async()=>{await Qt(`خروج از حساب`,`داده‌هایت روی حساب می‌ماند و با ورود دوباره برمی‌گردد. یادآوری شبانه روی این گوشی خاموش می‌شود.`,`خروج`,!0)&&(K(`در حال خروج…`),await yt().catch(()=>void 0),ft()?K(`بعضی تغییرات هنوز به سرور نرسیده. به اینترنت وصل شو و دوباره خروج را بزن.`,6e3):(await Mt().catch(()=>void 0),await k(`POST`,`logout`,{}).catch(()=>void 0),lt(),window.location.reload()))},"export-backup":()=>Nr(),"import-backup":()=>document.querySelector(`#backup-file`)?.click()};function wr(e){let t=e.target.closest(`[data-action]`);if(!t||t.disabled)return;let n=Cr[t.dataset.action];n&&(e.preventDefault(),n(t))}function Tr(e){let t=e.target;if(t instanceof HTMLTextAreaElement&&t.dataset.input===`journal`){D.mutate(e=>rn(e,D.ui.activeDay,t.value),{render:!1});let e=document.querySelector(`#journal-count`);e&&(e.textContent=`${t.value.length} / ${S.journal}`)}}function Er(e){let t=e.target;if(t instanceof HTMLTextAreaElement&&t.dataset.input===`journal`&&!Yt()){if(e.relatedTarget?.closest(`[data-action]`))return;D.setUi({})}}function Dr(e){let t=e.target;t instanceof HTMLInputElement&&t.id===`backup-file`&&t.files?.[0]&&(Pr(t.files[0]),t.value=``)}function Or(e){let t=e.target,n=t.dataset.form;if(!n)return;e.preventDefault();let r=new FormData(t),i=e=>String(r.get(e)??``),a=e=>{let n=t.querySelector(`[data-error]`);n&&(n.textContent=e)};if(n===`goal`){let e=Cn(i(`full`),i(`partial`));if(!e.ok)return a(e.error);D.mutate(t=>{t.waterGoal=e.value}),K(`هدف آب ذخیره شد.`)}else if(n===`task`){let e=ln({name:i(`name`),note:i(`note`),category:i(`category`)});if(!e.ok)return a(e.error);let n=t.dataset.id;n?D.mutate(t=>fn(t,n,e.value)):D.mutate(t=>dn(t,xr(`t`),e.value,h())),G(),K(n?`تسک ذخیره شد.`:`تسک اضافه شد.`)}else if(n===`container`){let e=bn(i(`name`),i(`ml`));if(!e.ok)return a(e.error);D.mutate(t=>xn(t,{id:xr(`c`),...e.value})),G(),K(`ظرف اضافه شد.`)}}function kr(e,t){let n=e?D.data.tasks.find(t=>t.id===e):void 0,r=n?.category??t??`morning`,i=n?.link===`water`?`<p class="small muted">وضعیت این تسک خودکار از آب‌سنج محاسبه می‌شود.</p>`:n?.link===`journal`?`<p class="small muted">این تسک با نوشتن ژورنال خودکار کامل می‌شود.</p>`:``;Xt(n?`ویرایش تسک`:`تسک تازه`,`<form data-form="task" ${n?`data-id="${B(n.id)}"`:``} novalidate>
       <label class="field">
         <span class="field__label">نام تسک</span>
         <input class="input" name="name" maxlength="${S.taskName}" value="${B(n?.name??``)}" autocomplete="off" required />
       </label>
       <label class="field">
         <span class="field__label">توضیح کوتاه (اختیاری)</span>
         <input class="input" name="note" maxlength="${S.taskNote}" value="${B(n?.note??``)}" autocomplete="off" />
       </label>
       <label class="field">
         <span class="field__label">دسته</span>
         <select class="select" name="category">
           ${x.map(e=>`<option value="${e.id}" ${e.id===r?`selected`:``}>${B(e.title)}</option>`).join(``)}
         </select>
       </label>
       ${i}
       ${n?``:`<p class="small muted">تسک تازه از امروز حساب می‌شود و امتیاز روزهای گذشته را تغییر نمی‌دهد.</p>`}
       <div class="error" data-error></div>
       <button class="btn btn--primary btn--block" type="submit">${n?`ذخیره`:`افزودن`}</button>
       ${n?`<button class="btn btn--danger btn--block" type="button" style="margin-top:10px" data-action="delete-task" data-task="${B(n.id)}">${H.trash.replace(`<svg`,`<svg width="18" height="18"`)} حذف تسک</button>`:``}
     </form>`)}function Ar(){Xt(`ظرف تازه`,`<form data-form="container" novalidate>
       <label class="field">
         <span class="field__label">نام ظرف</span>
         <input class="input" name="name" maxlength="${S.containerName}" autocomplete="off" placeholder="مثلاً قمقمه‌ی باشگاه" />
       </label>
       <label class="field">
         <span class="field__label">حجم (میلی‌لیتر)</span>
         <input class="input input--ltr" name="ml" inputmode="numeric" autocomplete="off" placeholder="750" />
       </label>
       <div class="error" data-error></div>
       <button class="btn btn--primary btn--block" type="submit">افزودن</button>
     </form>`)}function jr(){let e=D.ui.viewMonth;return`${Rn(e,`picker-month`)}
    ${Bn(e,{selected:D.ui.activeDay,action:`picker-day`})}
    <div class="legend" style="justify-content:space-between">
      <span>روزهای آینده بسته‌اند.</span>
    </div>
    <button class="btn btn--ghost btn--block" style="margin-top:14px" data-action="picker-today">امروز</button>`}function Mr(){let{tab:e,activeDay:t}=D.ui;(e===`today`||e===`water`||e===`settings`)&&D.setUi({viewMonth:v(t)}),Xt(`انتخاب روز`,jr())}function Nr(){let e=new Blob([Me(D.data)],{type:`application/json`}),t=URL.createObjectURL(e),n=document.createElement(`a`);n.href=t,n.download=`maktab-backup-${h()}.json`,document.body.appendChild(n),n.click(),n.remove(),window.setTimeout(()=>URL.revokeObjectURL(t),1e4),K(`فایل پشتیبان آماده‌ی دانلود شد.`)}async function Pr(e){let t;try{t=await e.text()}catch{K(`خواندن فایل ممکن نشد.`);return}let n=Ne(t);if(!n.ok){K(n.error,4e3);return}let r=Object.keys(n.data.days).length;await Qt(`بازیابی پشتیبان`,`همه‌ی داده‌های فعلی این گوشی با فایل پشتیبان (${r} روز ثبت‌شده) جایگزین می‌شود.`,`جایگزین کن`,!0)&&(D.replaceData(n.data),K(`پشتیبان بازیابی شد.`))}function Fr(e,t){let n=`signup`,r=!1,i=(e,t,n,r=`input`)=>`
    <label class="field">
      <span class="field__label">${B(t)}</span>
      <input class="${r}" name="${e}" ${n} />
    </label>`,a=(t=``,a={})=>{let o=e=>B(a[e]??``);e.innerHTML=`
      <img class="edge-mark" src="${Tn}" alt="" aria-hidden="true" />
      <main class="auth" id="main">
        <div class="auth__brand">
          <img class="auth__mark" src="${Tn}" alt="" />
          <div class="brand__name">مکتب</div>
          <span class="brand__sub">مدرسه فکری رفتار و انضباط</span>
        </div>
        <div>
          <div class="label">${n===`signup`?`SIGN UP`:`SIGN IN`}</div>
          <h1 class="title">${n===`signup`?`ساخت حساب`:`ورود به حساب`}</h1>
          <p class="small muted" style="margin:6px 0 0">${n===`signup`?`برای استفاده از ردیاب عادت مکتب یک حساب بساز. با همین شماره و رمز روی هر گوشی وارد می‌شوی و داده‌هایت همراهت می‌ماند.`:`با شماره همراه و رمز عبوری که موقع ثبت‌نام گذاشتی وارد شو.`}</p>
        </div>
        <div class="segmented" role="tablist" aria-label="ورود یا ثبت‌نام">
          <button type="button" role="tab" data-mode="signup" aria-selected="${n===`signup`}">ثبت‌نام</button>
          <button type="button" role="tab" data-mode="login" aria-selected="${n===`login`}">ورود</button>
        </div>
        <form class="panel panel__body" data-auth="${n}" novalidate>
          ${n===`signup`?i(`name`,`نام و نام خانوادگی`,`autocomplete="name" maxlength="60" required value="${o(`name`)}"`):``}
          ${i(`phone`,`شماره همراه`,`type="tel" inputmode="tel" autocomplete="tel" placeholder="09121234567" maxlength="20" required value="${o(`phone`)}"`,`input input--ltr`)}
          <label class="field">
            <span class="field__label">رمز عبور</span>
            <span class="pass">
              <input class="input input--ltr" name="password" type="password" autocomplete="${n===`signup`?`new-password`:`current-password`}"
                minlength="6" maxlength="128" required />
              <button type="button" class="pass__toggle" data-toggle-pass aria-label="نمایش رمز">نمایش</button>
            </span>
            ${n===`signup`?`<span class="task__note">دست‌کم ۶ کاراکتر</span>`:``}
          </label>
          <div class="error" role="alert" data-error>${B(t)}</div>
          <button class="btn btn--primary btn--block" type="submit" ${r?`disabled`:``}>
            ${r?`لطفاً صبر کن…`:n===`signup`?`ساخت حساب و ورود`:`ورود`}
          </button>
        </form>
        <p class="small muted" style="text-align:center">${n===`signup`?`قبلاً حساب ساخته‌ای؟ <button type="button" class="link" data-mode="login">وارد شو</button>`:`حساب نداری؟ <button type="button" class="link" data-mode="signup">ثبت‌نام کن</button><br/>رمز را فراموش کرده‌ای؟ به پشتیبانی مکتب پیام بده تا رمز تازه بگیری.`}</p>
      </main>`;let s=e.querySelector(`form input`);t||s?.focus({preventScroll:!0})};e.addEventListener(`click`,t=>{let i=t.target,o=i.closest(`[data-mode]`);if(o&&!r){let t=e.querySelector(`form`),r=t?Object.fromEntries([...new FormData(t)].map(([e,t])=>[e,String(t)])):{};delete r.password,n=o.dataset.mode,a(``,r);return}let s=i.closest(`[data-toggle-pass]`);if(s){let e=s.parentElement.querySelector(`input`),t=e.type===`password`;e.type=t?`text`:`password`,s.textContent=t?`پنهان`:`نمایش`,s.setAttribute(`aria-label`,t?`پنهان کردن رمز`:`نمایش رمز`)}}),e.addEventListener(`submit`,e=>{let i=e.target.closest(`form[data-auth]`);if(!i||(e.preventDefault(),r))return;let o=new FormData(i),s=Object.fromEntries([...o].map(([e,t])=>[e,String(t)])),c=i.querySelector(`[data-error]`);if(n===`signup`&&(s.name??``).trim().length<3)return void(c.textContent=`نام و نام خانوادگی را کامل بنویس.`);if(!(s.phone??``).trim())return void(c.textContent=`شماره همراه را بنویس.`);if((s.password??``).length<6)return void(c.textContent=`رمز عبور دست‌کم ۶ کاراکتر باشد.`);r=!0;let l=i.querySelector(`button[type="submit"]`);l.disabled=!0,l.textContent=`لطفاً صبر کن…`;let u=n===`signup`?{name:s.name,phone:s.phone,password:s.password,tz:A()}:{phone:s.phone,password:s.password,tz:A()};k(`POST`,n,u).then(e=>{r=!1,t(e.user)}).catch(e=>{r=!1;let t=e instanceof ze?`اتصال اینترنت برقرار نیست. برای ورود اول، اینترنت لازم است.`:e instanceof O?e.message:`خطای ناشناخته؛ دوباره امتحان کن.`;delete s.password,a(t,s),e instanceof O&&e.status===409&&(n=`login`,a(t,s))})}),a()}function Ir(){try{let e=`__maktab_probe__`;return window.localStorage.setItem(e,`1`),window.localStorage.removeItem(e),window.localStorage}catch{return null}}var $=document.getElementById(`app`),Lr=Ir();D.init(Lr);function Rr(){Mt().catch(()=>void 0);try{localStorage.removeItem(`maktab.auth.v1`)}catch{}window.location.reload()}function zr(e,t){D.user=e,Sr(t),bt({onUnauthorized:Rr}),At().then(()=>D.setUi({}))}Lt(()=>D.setUi({}));var Br=`maktab.server.v1`;async function Vr(){if(location.hostname.endsWith(`github.io`))return!1;try{if(localStorage.getItem(Br)===`1`)return!0}catch{}try{let e=new AbortController,t=window.setTimeout(()=>e.abort(),5e3),n=await fetch(`./api/push/key`,{signal:e.signal,headers:{Accept:`application/json`}});window.clearTimeout(t);let r=await n.json().catch(()=>null),i=n.ok&&typeof r?.publicKey==`string`;return i&&localStorage.setItem(Br,`1`),i}catch{return!1}}var Hr=at();Hr?zr(Hr,$):Vr().then(e=>{D.serverMode=e,e?Fr($,e=>{ct(e);let t=$.cloneNode(!1);$.replaceWith(t),zr(e,t)}):Sr($)}),en(),navigator.storage?.persist?.().catch(()=>void 0);