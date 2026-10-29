/* ════════════════════════════════════════════════════════════════
   tests/plano.test.mjs — Guarda do "Plano para casa".
   Roda na publicação: orientações vindas das cartilhas (fonte única),
   exercício no lugar certo, quadro de cuidados conforme o tema, rascunhos
   antigos da folha de exercícios ainda válidos e página com
   identificação, agendamento e sem o nome da paciente no que é salvo.
   Executar:  node tests/plano.test.mjs
   ════════════════════════════════════════════════════════════════ */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const A = require('../js/adherence.js');
const E = require('../js/exercicios.js');
const P = require('../js/plano.js');

let passou = 0, falhou = 0;
const falhas = [];
function teste(nome, fn) { try { fn(); passou++; } catch (e) { falhou++; falhas.push({ nome, erro: e.message }); } }

teste('todo bloco de cartilha vira orientação, com o texto da cartilha', () => {
  const total = A.CARTILHAS.reduce((n, c) => n + c.blocos.length, 0);
  const blocos = P.blocos(A);
  assert.equal(blocos.length, total);
  for (const b of blocos) {
    const o = P.orientacao(A, b.ref);
    const c = A.CARTILHAS.find(x => x.id === b.tema).blocos[+b.ref.split('/')[1]];
    assert.equal(o.h, c.h); assert.equal(o.p, c.p || ''); assert.deepEqual(o.l, c.l || []); assert.equal(o.nota, c.nota || '');
  }
  assert.equal(P.bloco(A, 'nao-existe/0'), null);
  assert.equal(P.bloco(A, 'gestacao/99'), null);
});

teste('o ponto "faça os exercícios" de cada cartilha existe com esse título', () => {
  for (const [tema, h] of Object.entries(P.PONTO_EXERCICIOS)) {
    const c = A.CARTILHAS.find(x => x.id === tema);
    assert.ok(c, 'cartilha inexistente: ' + tema);
    assert.ok(c.blocos.some(b => b.h === h), tema + ' não tem o bloco "' + h + '" (o título mudou na cartilha?)');
  }
});

teste('exercício novo entra depois do ponto da cartilha, depois dos outros exercícios, ou no fim', () => {
  const g = P.deCartilha(A, 'gestacao');
  const ponto = g.findIndex(b => b.h === P.PONTO_EXERCICIOS.gestacao);
  assert.equal(P.posicaoExercicio(g), ponto + 1);
  g.splice(ponto + 1, 0, P.exercicio(E, 'bola-circulos'));
  g.push(P.orientacao(A, 'incontinencia/2'));
  assert.equal(P.posicaoExercicio(g), ponto + 2, 'segundo exercício não ficou junto do primeiro');
  const sem = P.deCartilha(A, 'vesical');
  assert.equal(P.posicaoExercicio(sem), sem.length);
  assert.equal(P.posicaoExercicio([]), 0);
});

teste('quadro "Em todos os exercícios": soltar na dor, contrair no resto, segurança da gestação mantida', () => {
  const dor = P.deCartilha(A, 'dor').concat([P.exercicio(E, 'joelhos-dobrados')]);
  const s = P.sempre(E, dor);
  assert.ok(!s.some(x => /contraia/i.test(x)), 'manda contrair num plano de dor');
  assert.deepEqual(s.slice(0, P.SEMPRE_SOLTAR.length), P.SEMPRE_SOLTAR);
  const inc = P.deCartilha(A, 'incontinencia').concat([P.exercicio(E, 'sentada')]);
  assert.deepEqual(P.sempre(E, inc), E.SEMPRE);
  const dorGest = dor.concat([P.exercicio(E, 'bola-respiracao')]);
  assert.ok(P.sempre(E, dorGest).includes(E.SEMPRE_GESTACAO.sinais), 'perdeu os sinais de alerta da gestação');
  /* com a cartilha de gestação no plano, o aviso já está no destaque dela: não repete */
  const gest = P.deCartilha(A, 'gestacao').concat([P.exercicio(E, 'bola-balanco')]);
  assert.ok(!P.sempre(E, gest).includes(E.SEMPRE_GESTACAO.sinais), 'aviso repetido no quadro');
  assert.ok(P.sempre(E, [P.exercicio(E, 'bola-balanco')]).includes(E.SEMPRE_GESTACAO.sinais), 'sem a cartilha, o aviso precisa estar no quadro');
  /* as frases de "soltar" vêm da cartilha de dor, já aprovada */
  const dorTxt = JSON.stringify(A.CARTILHAS.find(c => c.id === 'dor'));
  assert.ok(dorTxt.includes('apertar mais piora') && dorTxt.includes('Respiração lenta, com a barriga solta') && dorTxt.includes('é não ensinar o corpo a ter medo'));
});

teste('título padrão acompanha o conteúdo', () => {
  assert.equal(P.tituloPadrao(A, P.deCartilha(A, 'posparto')), 'Os Primeiros Meses Depois do Parto');
  assert.equal(P.tituloPadrao(A, [P.exercicio(E, 'ponte')]), 'Seus exercícios em casa');
  assert.equal(P.tituloPadrao(A, P.deCartilha(A, 'gestacao').concat(P.deCartilha(A, 'incontinencia'))), 'Seu plano para casa');
  /* cartilha sem ponto de exercício + exercício: já não é só aquela cartilha */
  assert.equal(P.tituloPadrao(A, P.deCartilha(A, 'vesical').concat([P.exercicio(E, 'ponte')])), 'Seu plano para casa');
});

teste('rascunhos e modelos antigos da folha de exercícios continuam valendo', () => {
  const antigo = { vezes: '2', recado: 'oi', itens: [{ id: 'ponte', titulo: 'Ponte', descricao: 'x', params: { series: '3' } }, { id: 'sumiu' }] };
  const r = P.limpo(antigo, E, A);
  assert.equal(r.itens.length, 1);
  assert.equal(r.itens[0].tipo, 'ex'); assert.equal(r.itens[0].params.series, '3');
  assert.equal(r.vezes, '2'); assert.equal(r.anotacao, true);
  const novo = P.limpo({ anotacao: false, itens: [{ tipo: 'bloco', ref: 'dor/0', h: 'H', p: 'p', l: ['a', ' ', 'b'], nota: '' },
    { tipo: 'bloco', ref: 'falso/1', h: 'livre' }, null, 'lixo'] }, E, A);
  assert.equal(novo.anotacao, false);
  assert.deepEqual(novo.itens.map(i => i.ref), ['dor/0', null]);
  assert.deepEqual(novo.itens[0].l, ['a', 'b']);
  assert.deepEqual(P.limpo(null, E, A), P.vazio());
  /* limites */
  const grande = P.limpo({ itens: [{ tipo: 'bloco', h: 'x'.repeat(500), p: 'y'.repeat(5000), l: Array(30).fill('z'.repeat(900)) }] }, E, A).itens[0];
  assert.ok(grande.h.length <= P.LIMITES.h && grande.p.length <= P.LIMITES.p && grande.l.length <= P.LIMITES.itens && grande.l[0].length <= P.LIMITES.item);
});

teste('nenhuma promessa nos textos próprios do plano', () => {
  const PROIBIDAS = /(?<!\p{L})(garant\p{L}*|infal[íi]vel|a solução|eficaz|curar?|resultado garantido|não é normal)(?!\p{L})/iu;
  const tudo = P.SEMPRE_SOLTAR.join('\n') + readFileSync(join(raiz, 'tools/plano-cliente.js'), 'utf8').match(/'[^']{12,}'/g).join('\n');
  const m = tudo.match(PROIBIDAS);
  assert.ok(!m, 'contém "' + (m && m[0]) + '"');
});

teste('o montador nunca guarda o nome da paciente', () => {
  const c = readFileSync(join(raiz, 'tools/plano-cliente.js'), 'utf8');
  assert.ok(!/localStorage\.setItem\([^)]*nome/i.test(c));
  const guardar = c.slice(c.indexOf('function paraGuardar'), c.indexOf('var tGravar'));
  assert.ok(guardar.length > 0 && !/b-nome|nomeAtual/.test(guardar));
  assert.ok(!/(\$\('b-nome'\)|campoNome|\bnome)\.value/.test(c), 'o montador lê o nome digitado');
  /* toda menção ao campo do nome só dispara ou escuta evento */
  const codigo = c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');   // sem comentários
  for (const linha of codigo.split('\n').filter(l => /b-nome|campoNome|(?<![.\w])nome\./.test(l))) {   // "p.nome" é o nome de um modelo, não o da paciente
    const ok = /dispatchEvent|addEventListener|= \$\('b-nome'\)|var nome = \$\('b-nome'\)/.test(linha);
    assert.ok(ok, 'uso suspeito do campo do nome: ' + linha.trim());
  }
  /* e nada do que vai para o navegador sai de outro lugar que não paraGuardar */
  const gravacoes = c.match(/gravar\(CHAVE_[A-Z]+, [^)]*\)/g) || [];
  assert.ok(gravacoes.length && gravacoes.every(g => /paraGuardar\(estado\)|, m\)$/.test(g)), 'gravação fora de paraGuardar: ' + gravacoes.join(' | '));
});

teste('página gerada: identificação, agendamento com e sem QR, e o endereço antigo leva ao plano', () => {
  const arq = join(raiz, 'build/plano.html');
  if (!existsSync(arq)) { assert.ok(!process.env.CI, 'build/ ausente: na publicação os geradores rodam antes dos testes'); return; }
  const h = readFileSync(arq, 'utf8');
  assert.ok(h.includes('CREFITO-4: 252806-F'), 'sem CREFITO');
  assert.ok(h.includes('data-data-extenso'), 'sem data');
  for (const id of ['t-agenda', 't-agenda-qr', 't-agenda-curta', 't-anotacao', 't-acolhe']) assert.ok(h.includes('id="' + id + '"'), 'sem ' + id);
  const qr = h.slice(h.indexOf('id="t-agenda-qr"'), h.indexOf('</template>', h.indexOf('id="t-agenda-qr"')));
  assert.ok(qr.includes('class="qr"') && qr.includes('(31) 3868-1120'));
  assert.ok(h.includes('window.Adherence') || h.includes('raiz.Adherence'), 'cartilhas não embutidas');
  const velho = readFileSync(join(raiz, 'build/exercicios.html'), 'utf8');
  assert.ok(/http-equiv="refresh" content="0; url=plano.html"/.test(velho), 'exercicios.html não leva ao plano');
});

teste('perfil da paciente decide o quadro de cuidados, não o tipo de exercício', () => {
  const G = E.SEMPRE_GESTACAO;
  const assoalho = E.MODELOS_PRONTOS.find(m => m.id === 'assoalho-progressao').itens.map(id => P.exercicio(E, id));
  /* gestante com exercícios de assoalho deitada: antes saía sem nenhum cuidado de gestação */
  const g = P.sempre(E, assoalho, { gestante: true });
  for (const x of [G.restricao, G.deitada, G.sinais]) assert.ok(g.includes(x), 'gestante sem: ' + x.slice(0, 40));
  assert.ok(!g.includes(G.bola), 'cuidado de bola sem exercício de bola');
  assert.ok(!P.sempre(E, assoalho).includes(G.sinais), 'sem marca nem tema, não é gestante');
  /* blocos da gestação, mas sem o bloco que traz o aviso: o quadro precisa trazer */
  const semAviso = P.deCartilha(A, 'gestacao').filter(b => !b.nota).concat(assoalho);
  assert.ok(P.sempre(E, semAviso).includes(G.sinais), 'cartilha de gestação parcial ficou sem sinais');
  /* aviso que vem DEPOIS dos exercícios não conta: o quadro repete */
  const avisoDepois = assoalho.concat(P.deCartilha(A, 'gestacao'));
  assert.ok(P.sempre(E, avisoDepois).includes(G.sinais), 'aviso depois dos exercícios suprimido do quadro');
  /* dor marcada à mão, sem a cartilha: nada de "contraia" */
  const d = P.sempre(E, [P.exercicio(E, 'ponte')], { soltar: true });
  assert.ok(!d.some(x => /contraia/i.test(x)));
  /* dor + perda de urina: a frase que desfaz o conflito */
  const mix = P.deCartilha(A, 'dor').concat(P.deCartilha(A, 'incontinencia'), [P.exercicio(E, 'sentada')]);
  assert.ok(P.sempre(E, mix).includes(P.SOLTAR_E_CONTRAIR));
  /* a marca de perfil é guardada, e um rascunho antigo vem sem marca */
  assert.deepEqual([P.limpo({ gestante: true, soltar: true, itens: [] }, E, A).gestante, P.limpo({ itens: [] }, E, A).soltar], [true, false]);
  assert.deepEqual(P.perfilSugerido(E, [P.exercicio(E, 'bola-oito')]), { gestante: true, soltar: false });
});

teste('avisos do painel: contrair no foco em soltar, próstata no feminino, repetição e excesso', () => {
  const dor = P.deCartilha(A, 'dor').concat([P.exercicio(E, 'ponte')]);
  assert.ok(P.avisos(E, A, dor).some(t => /contrair/.test(t)));
  assert.ok(P.avisos(E, A, P.deCartilha(A, 'posprostatectomia').concat([P.exercicio(E, 'sentada')])).some(t => /feminino/.test(t)));
  const rep = P.deCartilha(A, 'incontinencia').concat(P.deCartilha(A, 'posprostatectomia'));
  assert.ok(P.avisos(E, A, rep).some(t => /Aperte antes do esforço/.test(t) && /2 vezes/.test(t)), 'bloco repetido sem aviso');
  const muitos = Array.from({ length: P.LIMITE_EXERCICIOS + 1 }, () => P.exercicio(E, 'ponte'));
  assert.ok(P.avisos(E, A, muitos).some(t => /muito para casa/.test(t)));
  assert.deepEqual(P.avisos(E, A, P.deCartilha(A, 'vesical')), []);
});

console.log('\n  plano.test.mjs');
console.log('  ' + '─'.repeat(46));
if (falhou === 0) console.log('  ✓ ' + passou + ' testes — todos passaram');
else { for (const f of falhas) console.log('  ✗ ' + f.nome + '\n      ' + f.erro); console.log('\n  ' + passou + ' passaram · ' + falhou + ' falharam'); }
console.log('');
process.exit(falhou === 0 ? 0 : 1);
