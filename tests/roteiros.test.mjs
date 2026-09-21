/* ════════════════════════════════════════════════════════════════
   tests/roteiros.test.mjs — Guarda de conformidade dos roteiros.
   Roda na publicação: se alguém editar js/roteiros.js e colocar uma
   promessa, um número sem fonte ou um anúncio que pergunta a condição
   de saúde de quem vê, o site não é atualizado até corrigir.
   Executar:  node tests/roteiros.test.mjs
   ════════════════════════════════════════════════════════════════ */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const R = require('../js/roteiros.js');

let passou = 0, falhou = 0;
const falhas = [];
function teste(nome, fn) { try { fn(); passou++; } catch (e) { falhou++; falhas.push({ nome, erro: e.message }); } }

const textosDoPost = (r) => [r.legenda, ...r.cenas.map(c => c.fala), ...r.cenas.map(c => c.tela)].join('\n');
const PROIBIDAS = /\b(garant\w*|infal[íi]vel|a solução|eficaz|curar?|cura-se|não é normal|resultado garantido)\b/i;

teste('todo roteiro tem código, série, cenas e legenda', () => {
  for (const r of R.LISTA) {
    assert.ok(r.id && r.serie && r.cenas.length && r.legenda, 'incompleto: ' + r.id);
    assert.ok(R.SERIES.some(s => s.id === r.serie), 'série desconhecida em ' + r.id);
  }
});

teste('códigos únicos', () => {
  const ids = R.LISTA.map(r => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

teste('nenhuma palavra proibida nas falas, na tela, na legenda ou no anúncio', () => {
  for (const r of R.LISTA) {
    const tudo = textosDoPost(r) + '\n' + (r.trafego.anuncio ? r.trafego.anuncio.texto + ' ' + r.trafego.anuncio.titulo : '') + ' ' + r.trafego.aberturaAnuncio;
    const m = tudo.match(PROIBIDAS);
    assert.ok(!m, r.id + ' contém "' + (m && m[0]) + '"');
  }
});

teste('nenhum percentual ou nome de estudo na fala ou na legenda', () => {
  for (const r of R.LISTA) {
    const t = textosDoPost(r);
    assert.ok(!/%|\bcochrane\b|\brevisão\b|\bestudo(s)?\b|segundo a ciência/i.test(t), 'número ou estudo em ' + r.id);
  }
});

teste('anúncio não pergunta nem afirma a condição de quem vê (atributos pessoais da Meta)', () => {
  for (const r of R.LISTA) {
    if (!r.trafego.anuncio) continue;
    const t = [r.trafego.anuncio.titulo, r.trafego.anuncio.texto, r.trafego.aberturaAnuncio].join(' ');
    assert.ok(!t.includes('?'), r.id + ': anúncio com pergunta');
    assert.ok(!/\bvocê\b|\bseu\b|\bsua\b|\bte\b/i.test(t), r.id + ': anúncio dirigido à pessoa');
  }
});

teste('legenda final leva nome, CREFITO e os dois Instagrams', () => {
  assert.ok(R.RODAPE_LEGENDA.includes('CREFITO-4: 252806-F'));
  assert.ok(R.RODAPE_LEGENDA.includes('@vanessa.fernands') && R.RODAPE_LEGENDA.includes('@clinicaveracis'));
});

teste('cartela tem identificação e lugar para a data', () => {
  const c = R.CARTELA.join(' ');
  assert.ok(c.includes('CREFITO-4: 252806-F') && c.includes('[data da publicação]'));
});

teste('nada de dias da semana nos roteiros (horário saiu dos materiais)', () => {
  const tudo = JSON.stringify(R);
  assert.ok(!/segunda a quinta/i.test(tudo));
});

teste('endereço é a Rodovia MG-010', () => {
  const tudo = JSON.stringify(R);
  assert.ok(tudo.includes('MG-010') && !/MG-10\b/.test(tudo));
});

teste('link do WhatsApp usa o número da clínica e o código, sem citar queixa', () => {
  const u = R.linkWhatsApp('A');
  assert.ok(u.startsWith('https://wa.me/553138681120?text='));
  const msg = decodeURIComponent(u.split('text=')[1]);
  assert.ok(msg.includes('código A'));
  assert.ok(!/xixi|urina|dor|próstata|relação/i.test(msg));
});

console.log('\n  roteiros.test.mjs');
console.log('  ' + '─'.repeat(46));
if (falhou === 0) console.log('  ✓ ' + passou + ' testes — todos passaram');
else { for (const f of falhas) console.log('  ✗ ' + f.nome + '\n      ' + f.erro); console.log('\n  ' + passou + ' passaram · ' + falhou + ' falharam'); }
console.log('');
process.exit(falhou === 0 ? 0 : 1);
