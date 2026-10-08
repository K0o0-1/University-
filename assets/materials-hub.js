(() => {
  'use strict';
  const root=document.getElementById('materialGrid');
  const registry=globalThis.MATERIAL_REGISTRY||[];
  if(!root) return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  root.innerHTML=registry.map(m=>`<a class="material-card" href="${esc(m.href)}" data-material-id="${esc(m.id)}" data-material-kind="${esc(m.kind)}"><div class="material-icon">${esc(m.icon||'📘')}</div><h2>${esc(m.title)}</h2><div class="material-meta">${(m.badges||[]).map((b,i)=>`<span class="material-pill ${i===1?'purple':i===2?'green':''}">${esc(b)}</span>`).join('')}</div></a>`).join('');
})();
