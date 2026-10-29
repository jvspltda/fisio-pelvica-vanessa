/* ════════════════════════════════════════════════════════════════
   tests/aprovar.test.mjs — Guarda da página "Para aprovar".
   Cada item mostra texto de verdade (lido dos módulos), os links levam
   a páginas publicadas e a mensagem do WhatsApp só leva as respostas.
   Executar:  node tests/aprovar.test.mjs
   ════════════════════════════════════════════════════════════════ */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const AP = require('../js/aprovar.js');
const M = { A: require('../js/adherence.js'), E: require('../js/exercicios.js'), P: require('../js/plano.js'),
  C: require('../js/carrossel.js'), R: require('../js/roteiros.js') };

let passou = 0, falhou = 0;
const falhas = [];
function teste(nome, fn) { try { fn(); passou++; } catch (e) { falhou++; falhas.push({ nome, erro: e.message }); } }

const wf = readFileSync(join(raiz, '.github/workflows/publicar.yml'), 'utf8');

teste('cada item tem texto de verdade, sem "undefined"', () => {
  const ids = new Set();
  for (const it of AP.LISTA) {
    assert.ok(!ids.has(it.id), 'id repetido ' + it.id); ids.add(it.id);
    assert.ok(it.titulo && it.porque && it.grupo && AP.data(it.desde), it.id + ' incompleto');
    const t = it.trechos(M);
    assert.ok(t.length > 0, it.id + ' sem texto');
    for (const x of t) {
      assert.ok(x.rotulo && (x.texto || (x.lista && x.lista.length)), it.id + ': trecho vazio');
      assert.ok(!/undefined|null/.test(JSON.stringify(x)), it.id + ': ' + JSON.stringify(x).slice(0, 80));
    }
  }
});

teste('trechos novos continuam no texto do exercício', () => {
  for (const [id, novo] of Object.entries(AP.NOVO))
    assert.ok(M.E.BIBLIOTECA.find(b => b.id === id).descricao.includes(novo), id + ': trecho novo sumiu');
});

teste('links levam a páginas publicadas', () => {
  for (const it of AP.LISTA) for (const o of it.onde) {
    const [arq, ancora] = o.href.split('#');
    if (arq.startsWith('impressos/')) {
      const nome = arq.slice('impressos/'.length);
      assert.ok(wf.includes('_site/impressos/' + nome), it.id + ': ' + arq + ' não é publicado');
      if (ancora) assert.ok(M.A.CARTILHAS.some(c => 'c-' + c.id === ancora), it.id + ': âncora ' + ancora + ' não existe');
    } else {
      assert.ok(existsSync(join(raiz, arq)) && wf.includes(arq), it.id + ': ' + arq + ' não é publicado');
      if (ancora) assert.ok(ancora === 'roteiro-' + (M.R.LISTA.find(r => 'roteiro-' + r.id === ancora) || {}).id, it.id + ': âncora ' + ancora);
    }
  }
});

teste('assinatura muda quando o texto muda', () => {
  const a = AP.LISTA[0].trechos(M);
  const b = JSON.parse(JSON.stringify(a)); b[0].texto += ' x';
  assert.notEqual(AP.assinatura(a), AP.assinatura(b));
  assert.equal(AP.assinatura(a), AP.assinatura(AP.LISTA[0].trechos(M)));
});

teste('mensagem: só os itens respondidos, com o comentário e o que falta', () => {
  assert.equal(AP.mensagem({}), '');
  const [x, y] = AP.LISTA;
  const m = AP.mensagem({ [x.id]: { voto: 'aprovo', obs: '' }, [y.id]: { voto: 'mudar', obs: 'trocar a\nfrase 2' } });
  assert.ok(m.includes('Aprovo: ' + x.titulo) && m.includes('Quero mudar: ' + y.titulo) && m.includes('trocar a / frase 2'));
  assert.ok(m.includes('Ainda sem resposta: ' + (AP.LISTA.length - 2)));
  assert.ok(!AP.mensagem({ [x.id]: { voto: '', obs: 'só rascunho' } }), 'comentário sem resposta não vai');
});

teste('página no site: scripts na ordem, atalho no início e publicada', () => {
  const h = readFileSync(join(raiz, 'aprovar.html'), 'utf8');
  const ordem = ['adherence', 'exercicios', 'plano', 'carrossel', 'roteiros', 'aprovar', 'aprovar-pagina'].map(s => h.indexOf('src="js/' + s + '.js"'));
  assert.ok(ordem.every((i, k) => i > 0 && (k === 0 || i > ordem[k - 1])), 'ordem dos scripts');
  assert.ok(readFileSync(join(raiz, 'index.html'), 'utf8').includes('href="aprovar.html"'), 'sem atalho na página inicial');
  assert.ok(/cp [^\n]*aprovar\.html/.test(wf), 'workflow não publica a página');
  assert.ok(wf.includes('node tests/aprovar.test.mjs'), 'workflow não roda este teste');
});

console.log('\n  aprovar.test.mjs');
console.log('  ' + '─'.repeat(46));
if (falhou === 0) console.log('  ✓ ' + passou + ' testes — todos passaram');
else { for (const f of falhas) console.log('  ✗ ' + f.nome + '\n      ' + f.erro); console.log('\n  ' + passou + ' passaram · ' + falhou + ' falharam'); }
console.log('');
process.exit(falhou === 0 ? 0 : 1);
