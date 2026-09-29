/* ════════════════════════════════════════════════════════════════
   tests/exercicios.test.mjs — Guarda da folha "Exercícios para casa".
   Roda na publicação: biblioteca completa, figuras presentes e em
   resolução de impressão, texto sem promessa e sem número pronto, e o
   nome da paciente fora de tudo o que é salvo.
   Executar:  node tests/exercicios.test.mjs
   ════════════════════════════════════════════════════════════════ */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = require('../js/exercicios.js');

let passou = 0, falhou = 0;
const falhas = [];
function teste(nome, fn) { try { fn(); passou++; } catch (e) { falhou++; falhas.push({ nome, erro: e.message }); } }

/* largura e altura de um JPEG, lidas do cabeçalho SOF */
function tamanhoJpeg(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const m = buf[i + 1];
    if (m >= 0xC0 && m <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

teste('biblioteca com código, título, figura, formato e descrição', () => {
  assert.ok(E.BIBLIOTECA.length >= 5);
  const ids = E.BIBLIOTECA.map(b => b.id);
  assert.equal(new Set(ids).size, ids.length, 'códigos repetidos');
  for (const b of E.BIBLIOTECA) {
    assert.ok(b.id && b.titulo && b.imagem && b.descricao, 'incompleto: ' + b.id);
    assert.ok(['deitada', 'em-pe'].includes(b.formato), 'formato desconhecido em ' + b.id);
    assert.notEqual(b.id, 'livre', '"livre" é reservado ao exercício sem imagem');
  }
});

teste('toda figura existe e tem resolução de impressão (lado maior ≥ 1500 px)', () => {
  for (const b of E.BIBLIOTECA) {
    const arq = join(raiz, 'assets/exercicios', b.imagem);
    assert.ok(existsSync(arq), 'falta ' + b.imagem);
    const t = tamanhoJpeg(readFileSync(arq));
    assert.ok(t, 'não é JPEG: ' + b.imagem);
    assert.ok(Math.max(t.w, t.h) >= 1500, b.imagem + ' com ' + t.w + '×' + t.h);
    const deitada = t.w > t.h;
    assert.equal(b.formato === 'deitada', deitada, b.imagem + ': formato não bate com a figura');
  }
});

teste('descrição sugerida cabe no limite e não traz número pronto (os números são da Vanessa)', () => {
  for (const b of E.BIBLIOTECA) {
    assert.ok(b.descricao.length <= E.LIMITE_DESCRICAO, b.id + ' passa do limite');
    assert.ok(!/\d/.test(b.descricao), b.id + ' tem número na descrição');
  }
});

teste('nenhuma promessa nos textos da folha', () => {
  const PROIBIDAS = /(?<!\p{L})(garant\p{L}*|infal[íi]vel|a solução|eficaz|curar?|resultado garantido|não é normal)(?!\p{L})/iu;
  const tudo = E.BIBLIOTECA.map(b => b.titulo + ' ' + b.descricao).concat(E.SEMPRE).join('\n');
  const m = tudo.match(PROIBIDAS);
  assert.ok(!m, 'contém "' + (m && m[0]) + '"');
});

teste('resumo dos números: só o que foi preenchido, com singular e plural', () => {
  assert.equal(E.resumoParametros({ series: '3', repeticoes: '10', segurar: '5', descansar: '' }), '3 séries · 10 repetições · segurar 5 s');
  assert.equal(E.resumoParametros({ series: '1', repeticoes: '1' }), '1 série · 1 repetição');
  assert.equal(E.resumoParametros({}), '');
});

teste('o montador nunca guarda o nome da paciente', () => {
  const c = readFileSync(join(raiz, 'tools/exercicios-cliente.js'), 'utf8');
  assert.ok(!/localStorage\.setItem\([^)]*nome/i.test(c));
  /* o que vai para o rascunho e para os modelos sai só de paraGuardar */
  const guardar = c.slice(c.indexOf('function paraGuardar'), c.indexOf('var tGravar'));
  assert.ok(guardar.length > 0 && !/b-nome|nomeAtual/.test(guardar));
  /* o montador pode disparar e escutar eventos do campo, mas nunca ler o que foi digitado */
  assert.ok(!/(\$\('b-nome'\)|campoNome|\bnome)\.value/.test(c), 'o montador lê o nome digitado');
});

teste('folha gerada traz identificação, data e quadro de agendamento', () => {
  const arq = join(raiz, 'build/exercicios.html');
  if (!existsSync(arq)) return;           // na publicação, o gerador roda depois dos testes
  const h = readFileSync(arq, 'utf8');
  assert.ok(h.includes('CREFITO-4: 252806-F'), 'sem CREFITO');
  assert.ok(h.includes('data-data-extenso'), 'sem data');
  assert.ok(h.includes('Como agendar') && h.includes('(31) 3868-1120'), 'sem agendamento');
  const curta = h.slice(h.indexOf('id="t-agenda-curta"'), h.indexOf('</template>', h.indexOf('id="t-agenda-curta"')));
  assert.ok(curta.includes('(31) 3868-1120'), 'quadro curto de agendamento sem o telefone');
  assert.ok(/\[data-folha\]\{[^}]*min-height/.test(h), 'linha do "Folha 1 de 2" não reservada: o rodapé cresceria e cortaria a folha');
});

console.log('\n  exercicios.test.mjs');
console.log('  ' + '─'.repeat(46));
if (falhou === 0) console.log('  ✓ ' + passou + ' testes — todos passaram');
else { for (const f of falhas) console.log('  ✗ ' + f.nome + '\n      ' + f.erro); console.log('\n  ' + passou + ' passaram · ' + falhou + ' falharam'); }
console.log('');
process.exit(falhou === 0 ? 0 : 1);
