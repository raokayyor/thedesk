// Anonymous, production-only page counts. Never send assessment IDs or query data.
(()=>{if(location.hostname!=='thedesk.vercel.app'||new URLSearchParams(location.search).has('testing')||navigator.doNotTrack==='1')return;
 window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};
 window.va('beforeSend',event=>{if(event.type!=='pageview')return null;const url=new URL(event.url,location.origin);url.search='';url.hash='';return {...event,url:url.href};});
 const script=document.createElement('script');script.defer=true;script.src='/_vercel/insights/script.js';document.head.append(script);
})();
