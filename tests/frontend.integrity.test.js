import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { e, avatar } from '../public/shared/ui.js';
import { cursos, areas, estados } from '../public/shared/catalogo.js';
const raiz=fileURLToPath(new URL('../public/',import.meta.url));
function arquivos(pasta){return readdirSync(pasta,{withFileTypes:true}).flatMap(a=>a.isDirectory()?arquivos(resolve(pasta,a.name)):[resolve(pasta,a.name)]);}
test('todas as telas internas usam a sessão e não mantêm pessoas de demonstração',()=>{
 const paginas=arquivos(resolve(raiz,'FrontEnd Interno')).filter(f=>f.endsWith('.html'));
 assert.equal(paginas.length,10);
 for(const arquivo of paginas){const html=readFileSync(arquivo,'utf8');assert.match(html,/data-pagina=/,arquivo);assert.doesNotMatch(html,/class="nx-/,arquivo);assert.match(html,/class="(?:main-content|mensagens-container)"/,arquivo);assert.match(html,/type="module" src="\/FrontEnd%20Interno\/app.js"/,arquivo);assert.match(html,/data-usuario-nome/,arquivo);assert.doesNotMatch(html,/Mariana Costa|Juliana Lima|Rafael Cruz|João Silva|NovaFlow|Plataforma de ONGs/,arquivo);
 const ids=[...html.matchAll(/\bid="([^"\n]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'IDs duplicados em '+arquivo);
 }
});
test('scripts e folhas de estilo locais referenciados existem',()=>{
 for(const arquivo of arquivos(raiz).filter(f=>f.endsWith('.html'))){const html=readFileSync(arquivo,'utf8');for(const m of html.matchAll(/(?:src|href)="([^"#?]+\.(?:js|css))"/g)){if(/^https?:/.test(m[1]))continue;const caminho=decodeURIComponent(m[1]);const destino=caminho.startsWith('/')?resolve(raiz,caminho.slice(1)):resolve(dirname(arquivo),caminho);assert.ok(existsSync(destino),arquivo+' referencia '+caminho);}}
});
test('catálogos usados pelo perfil e filtros possuem os valores existentes nas telas',()=>{assert.ok(Object.keys(cursos).length>=20);assert.ok(Object.keys(areas).length>=10);assert.equal(Object.keys(estados).length,27);assert.ok(cursos.desenvolvimento_de_sistemas);});
test('nomes, mensagens e biografias são escapados antes de entrar no HTML',()=>{assert.equal(e('<script>"&'), '&lt;script&gt;&quot;&amp;');const imagem=avatar({nome:'<Teste>',fotoPerfil:'javascript:alert(1)'});assert.ok(!imagem.includes('javascript:'));assert.ok(!imagem.includes('<Teste>'));});

test('estrutura visual original continua presente nas páginas',()=>{
 const partes={
 'home/home.html':['hero','hero-card','acesso-rapido','status-container','feed','recomendados'],
 'perfil/perfil.html':['banner','perfil-card','perfil-cols','overlayEditar','modalEditar'],
 'explorar/explorar.html':['filtros','filtro-group','talentos-grid'],
 'mensagens/mensagens.html':['mensagens-container','lista-conversas','chat-area','chat-header','chat-input'],
 'config/config.html':['perfil-config','config-layout','config-secao','config-item'],
 'conexões/conec.html':['page-header','abas','conexoes-lista'],
 'projetos/projetos.html':['page-header','abas','projetos-lista'],
 };
 for(const [nome,classes]of Object.entries(partes)){const html=readFileSync(resolve(raiz,'FrontEnd Interno',nome),'utf8');for(const classe of classes)assert.ok(html.includes('class="'+classe+'"')||html.includes('class="'+classe+' '),nome+' perdeu '+classe);}
});
