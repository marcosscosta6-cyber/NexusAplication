import {api,e,aviso,usuarioAtual,fotoSrc} from '/shared/ui.js';
import {cursos} from '/shared/catalogo.js';
export async function iniciar(){
 const inicial=new URLSearchParams(location.search).get('aba');let aba=['todos','solicitacoes','enviados'].includes(inicial)?inicial:'solicitacoes';
 document.querySelectorAll('.aba[onclick]').forEach(b=>{const ativa=b.getAttribute('onclick').includes("'"+aba+"'");b.classList.toggle('active',ativa);b.setAttribute('aria-pressed',String(ativa));});const lista=document.getElementById('lista-conexoes');
 async function carregar(){
  const [a,r,s]=await Promise.all([api('/conexoes'),api('/conexoes/recebidas'),api('/conexoes/enviadas')]);
  const badges=document.querySelectorAll('.badge-count');if(badges[0])badges[0].textContent=a.conexoes.length;if(badges[1])badges[1].textContent=r.solicitacoes.length;
  const registros=aba==='todos'?a.conexoes:aba==='solicitacoes'?r.solicitacoes:s.solicitacoes;
  lista.innerHTML=registros.map(c=>{const u=aba==='solicitacoes'?c.solicitante:aba==='enviados'?c.destinatario:c.solicitanteId===usuarioAtual.id?c.destinatario:c.solicitante;
   const botoes=aba==='solicitacoes'?'<button class="btn-confirmar" data-acao="ACEITA">Confirmar</button><button class="btn-excluir" data-acao="RECUSADA">Excluir</button>':aba==='enviados'?'<button class="btn-excluir" data-acao="remover">Cancelar</button>':'<button class="btn-mensagem" data-pessoa="'+u.id+'">Mensagem</button><button class="btn-remover" data-acao="remover">Remover</button>';
   const avatar=u.fotoPerfil?'<img class="avatar" src="'+e(fotoSrc(u))+'" alt="">':'<div class="avatar">'+e(u.nome.trim().split(/\s+/).slice(0,2).map(n=>n[0]).join(''))+'</div>';
   return '<div class="conexao-card" data-id="'+c.id+'">'+avatar+'<div class="conexao-info"><h4><a class="nexus-text-link" href="../perfil/perfilUser.html?id='+u.id+'">'+e(u.nome)+'</a></h4><p>'+e(u.funcao||cursos[u.curso]||'')+'</p></div><div class="conexao-btns">'+botoes+'</div></div>';
  }).join('')||'<p>Nenhuma conexão nesta lista.</p><a class="nexus-proximo-passo" href="../explorar/explorar.html">Encontrar pessoas em Explorar →</a>';
 }
 window.trocarAba=(el,nova)=>{aba=nova;history.replaceState(null,'','?aba='+aba);document.querySelectorAll('.aba[onclick]').forEach(b=>{b.classList.toggle('active',b===el);b.setAttribute('aria-pressed',String(b===el));});carregar().catch(err=>aviso(err.message));};
 document.querySelector('.btn-gerenciar')?.addEventListener('click',()=>aviso('Use as abas para confirmar, cancelar ou remover conexões.'));
 lista.addEventListener('click',async ev=>{const b=ev.target.closest('[data-acao],[data-pessoa]');if(!b)return;if(b.dataset.pessoa){location.href='../mensagens/mensagens.html?usuario='+b.dataset.pessoa;return;}b.disabled=true;try{const id=b.closest('[data-id]').dataset.id;await api('/conexoes/'+id+(b.dataset.acao==='remover'?'':'/responder'),{method:b.dataset.acao==='remover'?'DELETE':'PATCH',...(b.dataset.acao==='remover'?{}:{body:{decisao:b.dataset.acao}})});await carregar();}catch(err){b.disabled=false;aviso(err.message);}});
 await carregar();
}
