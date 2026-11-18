import {api,aviso,paginas,fotoSrc} from '/shared/ui.js';
import {cursos,cursosPorArea} from '/shared/catalogo.js';
export async function iniciar(){
 const lista=document.querySelector('.talentos-grid'),area=document.getElementById('area'),funcao=document.getElementById('funcao'),nivel=document.getElementById('nivel'),disponibilidade=document.getElementById('disponibilidade'),busca=document.querySelector('.skill-search input');
 const atualizarFuncoes=(selecionada='')=>{funcao.replaceChildren(new Option('Todas',''));for(const id of (area.value?cursosPorArea[area.value]||[]:Object.keys(cursos)))funcao.add(new Option(cursos[id],id));funcao.value=[...funcao.options].some(o=>o.value===selecionada)?selecionada:'';};
 for(const select of [nivel,disponibilidade])select.options[0].value='';
 const url=new URLSearchParams(location.search);busca.value=url.get('habilidade')||'';for(const [k,el]of Object.entries({area,nivel,disponibilidade}))if(url.has(k))el.value=url.get(k);atualizarFuncoes(url.get('curso')||'');
 let versao=0;
 async function carregar(pagina=1){
  const token=++versao;const params=new URLSearchParams({area:area.value,curso:funcao.value,nivel:nivel.value,disponibilidade:disponibilidade.value,habilidade:busca.value.trim(),q:url.get('q')||'',pagina});
  const dados=await api('/usuarios?'+params);if(token!==versao)return;history.replaceState(null,'','?'+params);
  document.querySelector('.resultado-info span').textContent=dados.total+' talentos';lista.replaceChildren();
  for(const u of dados.usuarios){
   const card=document.getElementById('talento-template').content.firstElementChild.cloneNode(true);
   const avatar=card.querySelector('.avatar-placeholder');avatar.textContent=u.nome.trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('');if(u.fotoPerfil){avatar.style.backgroundImage='url("'+fotoSrc(u)+'")';avatar.style.backgroundSize='cover';avatar.textContent='';}
   card.querySelector('.talento-nome').textContent=u.nome;card.querySelector('.talento-cargo').textContent=u.funcao||cursos[u.curso]||'';const local=card.querySelector('.talento-local'),icone=document.createElement('i');icone.className='fa-solid fa-location-dot';local.replaceChildren(icone,' '+(u.localizacao||''));
   card.querySelector('.talento-tags').replaceChildren(...u.habilidades.map(h=>{const t=document.createElement('span');t.className='tag';t.textContent=h.nome;return t;}));
   const status=card.querySelector('.disponivel');status.replaceChildren();if(u.disponibilidade){const dot=document.createElement('span');dot.className='disponivel-dot'+(u.disponibilidade==='Ocupado'?' ocupado-dot':'');status.append(dot,u.disponibilidade);status.classList.toggle('ocupado',u.disponibilidade==='Ocupado');}
   card.querySelector('.btn-perfil').addEventListener('click',()=>location.href='../perfil/perfilUser.html?id='+u.id);
   const b=card.querySelector('.btn-conectar');b.disabled=['PENDENTE','ACEITA'].includes(u.conexao?.status);b.textContent=u.conexao?.status==='ACEITA'?'Conectados':u.conexao?.status==='PENDENTE'?'Pendente':'Conectar';
   b.addEventListener('click',async()=>{b.disabled=true;try{await api('/conexoes',{method:'POST',body:{destinatarioId:u.id}});b.textContent='Pendente';aviso('Solicitação enviada.','sucesso');}catch(err){b.disabled=false;aviso(err.message);}});lista.appendChild(card);
  }
  if(!dados.usuarios.length){const p=document.createElement('p');p.className='empty-state';p.textContent='Nenhuma pessoa encontrada.';lista.appendChild(p);}
  const paginacao=document.getElementById('paginacao');paginacao.hidden=dados.paginas<2;paginas(paginacao,dados.pagina,dados.paginas,p=>carregar(p).catch(err=>aviso(err.message)));
 }
 area.addEventListener('change',()=>{atualizarFuncoes();carregar().catch(err=>aviso(err.message));});
 for(const el of [funcao,nivel,disponibilidade])el.addEventListener('change',()=>carregar().catch(err=>aviso(err.message)));
 let timer;busca.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>carregar().catch(err=>aviso(err.message)),350);});
 document.querySelector('.btn-limpar').addEventListener('click',()=>{for(const s of [area,nivel,disponibilidade])s.value='';atualizarFuncoes();busca.value='';url.delete('q');carregar().catch(err=>aviso(err.message));});
 await carregar();
}
