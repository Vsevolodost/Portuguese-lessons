(() => {
  const key='bora-theme-v1';
  const preference=matchMedia('(prefers-color-scheme: dark)');
  function saved(){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
  function apply(){
    const choice=saved();
    const theme=['light','dark'].includes(choice)?choice:preference.matches?'dark':'light';
    document.documentElement.dataset.theme=theme;
    document.documentElement.style.colorScheme=theme;
    const button=document.querySelector('#theme-toggle');
    if(button){button.textContent=theme==='dark'?'☀ Светлая тема':'☾ Тёмная тема';button.setAttribute('aria-pressed',String(theme==='dark'));button.setAttribute('aria-label',theme==='dark'?'Включить светлую тему':'Включить тёмную тему');}
  }
  apply();
  document.addEventListener('DOMContentLoaded',()=>{
    apply();
    document.querySelector('#theme-toggle')?.addEventListener('click',()=>{
      const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
      try{localStorage.setItem(key,JSON.stringify(next));}catch{document.documentElement.dataset.theme=next;document.documentElement.style.colorScheme=next;const button=document.querySelector('#theme-toggle');button.textContent=next==='dark'?'☀ Светлая тема':'☾ Тёмная тема';button.setAttribute('aria-pressed',String(next==='dark'));button.setAttribute('aria-label',next==='dark'?'Включить светлую тему':'Включить тёмную тему');const notice=document.querySelector('#storage-notice');if(notice)notice.hidden=false;return;}
      apply();
    });
  });
  preference.addEventListener('change',apply);
  addEventListener('storage',event=>{if(event.key===key||event.key===null)apply();});
  window.BoraTheme={apply};
})();
