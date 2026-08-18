(function(){
  const KEY='rozana_app_v2';
  const nativeSet=Storage.prototype.setItem;
  const nativeGet=Storage.prototype.getItem;
  const nativeRemove=Storage.prototype.removeItem;
  let ready=false;
  function parse(v){try{return JSON.parse(v)}catch{return null}}
  function merge(local,remote){
    if(!remote) return local;
    if(!local) return remote;
    const out={...remote,...local,settings:{...(remote.settings||{}),...(local.settings||{})}};
    for(const k of ['workers','guarantors','payments','expenses','followups']){
      const map=new Map((remote[k]||[]).map(x=>[String(x.id),x]));
      for(const x of (local[k]||[])){
        const id=String(x.id||'');
        if(!id){continue}
        const old=map.get(id);
        map.set(id,old?{...old,...x}:x);
      }
      out[k]=[...map.values()];
    }
    return out;
  }
  function syncNow(){
    try{
      const local=parse(nativeGet.call(localStorage,KEY));
      const xhr=new XMLHttpRequest();
      xhr.open('GET','/api/db',false);
      xhr.send();
      let remote=null;
      if(xhr.status>=200&&xhr.status<300) remote=parse(xhr.responseText);
      const merged=merge(local,remote);
      if(merged) nativeSet.call(localStorage,KEY,JSON.stringify(merged));
      if(!remote&&local){
        const p=new XMLHttpRequest();
        p.open('POST','/api/db',false);p.setRequestHeader('content-type','application/json');
        p.send(JSON.stringify(local));
      } else if(remote&&merged){
        const a=JSON.stringify(remote),b=JSON.stringify(merged);
        if(a!==b){const p=new XMLHttpRequest();p.open('POST','/api/db',false);p.setRequestHeader('content-type','application/json');p.send(JSON.stringify(merged));}
      }
    }catch(e){console.warn('Rozana sync startup:',e)}
    ready=true;
  }
  syncNow();
  Storage.prototype.setItem=function(k,v){
    nativeSet.call(this,k,v);
    if(ready&&this===localStorage&&k===KEY){
      fetch('/api/db',{method:'POST',headers:{'content-type':'application/json'},body:v,keepalive:true}).catch(()=>{});
    }
  };
  window.addEventListener('focus',()=>{
    if(!ready)return;
    fetch('/api/db').then(r=>r.ok?r.json():null).then(remote=>{
      if(!remote)return;
      const local=parse(nativeGet.call(localStorage,KEY));
      const merged=merge(local,remote);
      nativeSet.call(localStorage,KEY,JSON.stringify(merged));
      location.reload();
    }).catch(()=>{});
  });
})();
