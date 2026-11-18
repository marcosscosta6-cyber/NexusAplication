import {api,e,mensagemNotificacao,linkNotificacao,fotoSrc} from '/shared/ui.js';
export async function iniciar(){
 const destinos=['../conexões/conec.html?aba=todos','../projetos/projetos.html?aba=meus','../mensagens/mensagens.html','../conexões/conec.html?aba=solicitacoes'];
 document.querySelectorAll('.status-card').forEach((card,i)=>{
  const link=document.createElement('a');link.className=card.className+' nexus-card-link';link.href=destinos[i];
  link.setAttribute('aria-label','Ver '+card.querySelector('p').textContent.toLowerCase());
  link.append(...card.childNodes);card.replaceWith(link);
 });
 document.querySelectorAll('a[href*="projetos.html"]').forEach(link=>{if(link.querySelector('h3')?.textContent==='Encontrar projetos')link.href='../projetos/projetos.html?aba=explorar';});
 const dados=await api('/painel');
 document.querySelectorAll('.status-card h3').forEach((el,i)=>el.textContent=[dados.conexoes,dados.projetos||0,dados.mensagens,dados.solicitacoes][i]);
 document.getElementById('atividades').innerHTML=dados.atividades.length?dados.atividades.map(n=>'<div class="atividade" role="link" tabindex="0" data-href="'+e(linkNotificacao(n))+'"><img src="'+e(fotoSrc(n.ator))+'" alt=""><div class="texto"><h5><span>'+e(n.ator.nome)+'</span>'+e(mensagemNotificacao(n).slice(n.ator.nome.length))+'</h5></div></div>').join(''):'<div class="atividade-vazia"><i class="fa-regular fa-bell" aria-hidden="true"></i><strong>Seu espaço está pronto</strong><p>Suas atividades e novidades aparecerão aqui conforme você se conectar.</p></div>';
 document.getElementById('atividades').addEventListener('click',ev=>{const alvo=ev.target.closest('[data-href]');if(alvo)location.href=alvo.dataset.href;});
 document.getElementById('atividades').addEventListener('keydown',ev=>{if(ev.key==='Enter'){const alvo=ev.target.closest('[data-href]');if(alvo)location.href=alvo.dataset.href;}});
 document.getElementById('verAtvds').addEventListener('click',()=>location.href='../notificações/not.html');
 document.getElementById('explorarBtn').addEventListener('click',()=>location.href='../explorar/explorar.html');
}
