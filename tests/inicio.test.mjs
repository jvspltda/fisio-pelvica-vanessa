/* ════════════════════════════════════════════════════════════════
   tests/inicio.test.mjs — Guarda da página inicial (saudação, carta de
   boas-vindas e novidades).
   Executar:  node tests/inicio.test.mjs
   ════════════════════════════════════════════════════════════════ */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const N = require('../js/novidades.js');
const A = require('../js/adherence.js');

let passou = 0, falhou = 0;
const falhas = [];
function teste(nome, fn) { try { fn(); passou++; } catch (e) { falhou++; falhas.push({ nome, erro: e.message }); } }

const wf = readFileSync(join(raiz, '.github/workflows/publicar.yml'), 'utf8');
const index = readFileSync(join(raiz, 'index.html'), 'utf8');

teste('saudação pela hora', () => {
  assert.equal(N.saudacao(4), 'Boa noite'); assert.equal(N.saudacao(5), 'Bom dia'); assert.equal(N.saudacao(11), 'Bom dia');
  assert.equal(N.saudacao(12), 'Boa tarde'); assert.equal(N.saudacao(17), 'Boa tarde'); assert.equal(N.saudacao(18), 'Boa noite');
  assert.equal(N.saudacao(23), 'Boa noite');
});

teste('data por extenso em português', () => {
  assert.equal(N.dataLonga(new Date(2026, 9, 29)), 'quinta-feira, 29 de outubro');
  assert.equal(N.dataLonga(new Date(2026, 2, 1)), 'domingo, 1 de março');
  assert.equal(N.dataCurta('2026-10-29'), '29/10');
});

teste('novidades: ids únicos, datas válidas e da mais nova para a mais velha', () => {
  const ids = new Set();
  N.LISTA.forEach((n, i) => {
    assert.ok(!ids.has(n.id), 'id repetido ' + n.id); ids.add(n.id);
    assert.ok(N.dataCurta(n.data) && n.titulo && n.texto && n.link, n.id + ' incompleta');
    if (i) assert.ok(n.data <= N.LISTA[i - 1].data, n.id + ' fora de ordem');
  });
});

teste('novidades: links levam a páginas publicadas', () => {
  for (const n of N.LISTA) {
    const [arq, ancora] = n.href.split('#');
    if (arq.startsWith('impressos/')) assert.ok(wf.includes('_site/' + arq), n.id + ': ' + arq + ' não é publicado');
    else assert.ok(existsSync(join(raiz, arq)) && new RegExp('cp [^\\n]*' + arq.replace('.', '\\.')).test(wf), n.id + ': ' + arq + ' não é publicado');
    if (ancora) assert.ok(A.CARTILHAS.some(c => 'c-' + c.id === ancora), n.id + ': âncora ' + ancora);
  }
});

teste('"Novo" só no que ainda não foi visto', () => {
  assert.equal(N.novas([]).length, Math.min(N.MOSTRAR, N.LISTA.length));
  assert.deepEqual(N.novas(N.LISTA.map(n => n.id)), []);
  assert.deepEqual(N.novas(N.LISTA.slice(1).map(n => n.id)), [N.LISTA[0].id]);
});

teste('página inicial: funciona sem JavaScript e carrega os scripts na ordem', () => {
  /* sem JS: nome no título, carta e novidades escondidas, atalhos de sempre */
  assert.ok(/<h1 id="i-ola">Vanessa Fernandes<\/h1>/.test(index));
  assert.ok(/id="i-carta" hidden/.test(index) && /id="i-novidades" hidden/.test(index));
  for (const h of ['avaliacao.html', 'prontuario.html', 'impressos/plano.html', 'aprovar.html']) assert.ok(index.includes('href="' + h + '"'), 'sem ' + h);
  const ordem = ['aprovar', 'novidades', 'inicio'].map(s => index.indexOf('src="js/' + s + '.js"'));
  assert.ok(ordem.every((i, k) => i > 0 && (k === 0 || i > ordem[k - 1])), 'ordem dos scripts');
  assert.ok(wf.includes('node tests/inicio.test.mjs'), 'workflow não roda este teste');
});

teste('nada de paciente no que a página inicial guarda', () => {
  const js = readFileSync(join(raiz, 'js/inicio.js'), 'utf8');
  const chaves = [...js.matchAll(/'(vf-[\w-]+)'/g)].map(m => m[1]);
  assert.deepEqual([...new Set(chaves)].sort(), ['vf-aprovacoes', 'vf-boas-vindas', 'vf-novidades-vistas']);
  assert.ok(!js.includes('vf-pelvica'), 'a página inicial não deve ler os dados da avaliação');
});

console.log('\n  inicio.test.mjs');
console.log('  ' + '─'.repeat(46));
if (falhou === 0) console.log('  ✓ ' + passou + ' testes — todos passaram');
else { for (const f of falhas) console.log('  ✗ ' + f.nome + '\n      ' + f.erro); console.log('\n  ' + passou + ' passaram · ' + falhou + ' falharam'); }
console.log('');
process.exit(falhou === 0 ? 0 : 1);
