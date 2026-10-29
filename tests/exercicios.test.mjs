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

teste('toda figura existe, no formato da folha e com resolução de impressão (≥ 250 ppp)', () => {
  /* tamanho impresso: .ex-deitada img 74 mm de largura, .ex-em-pe img 66 mm de altura */
  for (const b of E.BIBLIOTECA) {
    const arq = join(raiz, 'assets/exercicios', b.imagem);
    assert.ok(existsSync(arq), 'falta ' + b.imagem);
    const t = tamanhoJpeg(readFileSync(arq));
    assert.ok(t, 'não é JPEG: ' + b.imagem);
    const deitada = t.w > t.h;
    assert.equal(b.formato === 'deitada', deitada, b.imagem + ': formato não bate com a figura');
    const razao = deitada ? t.w / t.h : t.h / t.w;
    assert.ok(Math.abs(razao - 1.5) < 0.02, b.imagem + ' fora de 3:2 (a folha cortaria a figura)');
    const ppp = deitada ? t.w / (74 / 25.4) : t.h / (66 / 25.4);
    assert.ok(ppp >= 250, b.imagem + ' com ' + Math.round(ppp) + ' ppp na folha');
  }
});

teste('todo exercício pertence a um grupo, e todo grupo tem exercício', () => {
  const grupos = E.GRUPOS.map(g => g.id);
  for (const b of E.BIBLIOTECA) assert.ok(grupos.includes(b.grupo), b.id + ' sem grupo conhecido');
  for (const g of grupos) assert.ok(E.BIBLIOTECA.some(b => b.grupo === g), 'grupo vazio: ' + g);
});

teste('modelos prontos só usam exercícios da biblioteca', () => {
  const ids = new Set(E.BIBLIOTECA.map(b => b.id));
  const nomes = new Set();
  for (const m of E.MODELOS_PRONTOS) {
    assert.ok(m.id && m.nome && m.itens.length, 'modelo incompleto');
    assert.ok(!nomes.has(m.id), 'modelo repetido: ' + m.id); nomes.add(m.id);
    for (const id of m.itens) assert.ok(ids.has(id), m.id + ' usa exercício inexistente: ' + id);
  }
});

teste('"Em todos os exercícios" acompanha a sequência', () => {
  const G = E.SEMPRE_GESTACAO;
  assert.deepEqual(E.sempre([]), E.SEMPRE);
  assert.deepEqual(E.sempre(['ponte', 'em-pe']), E.SEMPRE);
  /* só gestação: sem a instrução de contrair o assoalho, com os sinais de alerta */
  const sentada = E.sempre(['bola-circulos', 'bola-respiracao']);
  assert.ok(!sentada.some(s => /contra[ií]/i.test(s)), 'instrução de contração numa sequência só de gestação');
  assert.ok(sentada.includes(G.bola) && sentada.includes(G.sinais) && !sentada.includes(G.deitada));
  assert.ok(E.sempre(['bola-flexao-joelhos']).includes(G.deitada), 'exercício deitado sem o aviso de virar de lado');
  /* misturada: as de contração continuam, mais as de segurança, e a de dúvida fecha */
  const mista = E.sempre(['ponte', 'bola-balanco']);
  assert.ok(mista.includes(E.SEMPRE[0]) && mista.includes(G.sinais) && mista.includes(G.deitada));
  assert.equal(mista[mista.length - 1], E.SEMPRE[E.SEMPRE.length - 1]);
  /* sinais de alerta: o mesmo texto da cartilha de gestação */
  const A = require('../js/adherence.js');
  const nota = A.CARTILHAS.find(c => c.id === 'gestacao').blocos.map(b => b.nota).filter(Boolean)[0];
  assert.equal(G.sinais, nota, 'sinais de alerta diferentes da cartilha de gestação');
  const gestacao = new Set(E.BIBLIOTECA.filter(b => b.grupo === 'gestacao').map(b => b.id));
  for (const m of E.MODELOS_PRONTOS.filter(m => m.itens.some(id => gestacao.has(id))))
    assert.ok(E.sempre(m.itens).includes(G.sinais), m.id + ' sem sinais de alerta');
});

teste('descrição sugerida cabe no limite e não traz número pronto (os números são da Vanessa)', () => {
  for (const b of E.BIBLIOTECA) {
    assert.ok(b.descricao.length <= E.LIMITE_DESCRICAO, b.id + ' passa do limite');
    assert.ok(!/\d/.test(b.descricao), b.id + ' tem número na descrição');
  }
});

teste('nenhuma promessa nos textos da folha', () => {
  const PROIBIDAS = /(?<!\p{L})(garant\p{L}*|infal[íi]vel|a solução|eficaz|curar?|resultado garantido|não é normal)(?!\p{L})/iu;
  const G = E.SEMPRE_GESTACAO;
  const tudo = E.BIBLIOTECA.map(b => b.titulo + ' ' + b.descricao).concat(E.SEMPRE, G.inicio, G.bola, G.deitada, G.sinais,
    E.MODELOS_PRONTOS.map(m => m.nome)).join('\n');
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

teste('código QR do WhatsApp aponta para o número da clínica, sem falar da queixa', () => {
  const svg = readFileSync(join(raiz, 'assets/qr-whatsapp.svg'), 'utf8');
  assert.ok(/viewBox="0 0 \d+ \d+"/.test(svg), 'SVG sem viewBox não escala na folha');
  const destino = (svg.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
  const Ficha = require('../js/ficha.js');
  const tel = (String(Ficha.CONTATO).match(/\(31\) ?3868-1120/) || [''])[0];
  assert.ok(tel, 'telefone da clínica mudou em Ficha.CONTATO: gere o QR de novo');
  const numero = '55' + tel.replace(/\D/g, '');
  assert.ok(destino.startsWith('https://wa.me/' + numero + '?'), 'QR aponta para ' + destino);
  assert.equal(decodeURIComponent(destino.split('text=')[1] || ''), 'Olá! Quero agendar um horário.');
  for (const arq of ['build/exercicios.html', 'build/cartilhas-pacientes.html']) {
    const f = join(raiz, arq);
    if (existsSync(f)) assert.ok(readFileSync(f, 'utf8').includes('class="qr"'), arq + ' sem o QR no quadro de agendamento');
  }
});

console.log('\n  exercicios.test.mjs');
console.log('  ' + '─'.repeat(46));
if (falhou === 0) console.log('  ✓ ' + passou + ' testes — todos passaram');
else { for (const f of falhas) console.log('  ✗ ' + f.nome + '\n      ' + f.erro); console.log('\n  ' + passou + ' passaram · ' + falhou + ' falharam'); }
console.log('');
process.exit(falhou === 0 ? 0 : 1);
