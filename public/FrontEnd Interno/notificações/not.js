import {api,e,aviso,paginas,data,mensagemNotificacao,linkNotificacao} from '/shared/ui.js';
export async function iniciar(){
 let pagina=1;const lista=document.getElementById('lista-notif');
 async function carregar(p=pagina){pagina=p;const dados=await api('/notificacoes?pagina='+pagina+'&q='+encodeURIComponent(new URLSearchParams(location.search).get('q')||''));
  document.querySelector('.btn-marcar').disabled=!dados.naoLidas;
  lista.innerHTML=dados.notificacoes.map(n=>'<div class="notif-card '+(n.lidaEm?'lida':'nao-lida')+'" data-id="'+n.id+'"><div class="'+(n.lidaEm?'dot-lida':'dot-nao-lida')+'"></div><div class="notif-avatar">'+e(n.ator.nome.split(/\s+/).slice(0,2).map(t=>t[0]).join(''))+'</div><div class="notif-texto"><p role="link" tabindex="0" data-abrir data-href="'+e(linkNotificacao(n))+'"><span>'+e(n.ator.nome)+'</span>'+e(mensagemNotificacao(n).slice(n.ator.nome.length))+'</p><p class="notif-tempo">'+data(n.dataCriacao)+'</p></div><button class="notif-fechar" data-excluir aria-label="Excluir notificação"><i class="fa-solid fa-xmark"></i></button></div>').join('')||'<div class="empty-state"><i class="fa-solid fa-bell-slash"></i><h3>Tudo em dia!</h3><p>Você ainda não tem nenhuma notificação.</p></div>';
  const nav=document.getElementById('paginacao');nav.hidden=dados.paginas<2;paginas(nav,pagina,dados.paginas,p=>carregar(p).catch(err=>aviso(err.message)));
 }
 window.marcarTodasLidas=async()=>{try{await api('/notificacoes/lidas',{method:'PATCH'});await carregar();}catch(err){aviso(err.message);}};
 lista.addEventListener('click',async ev=>{const b=ev.target.closest('[data-excluir],[data-abrir]');if(!b)return;ev.preventDefault();try{await api('/notificacoes/'+b.closest('[data-id]').dataset.id,{method:b.hasAttribute('data-excluir')?'DELETE':'PATCH'});if(b.hasAttribute('data-abrir'))location.href=b.dataset.href;else await carregar();}catch(err){aviso(err.message);}});
 await carregar();
}
