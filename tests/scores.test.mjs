/* ════════════════════════════════════════════════════════════════
   tests/scores.test.mjs — Testes do motor de cálculo clínico.
   Executar:  node tests/scores.test.mjs
   ════════════════════════════════════════════════════════════════ */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Scores = require('../js/scores.js');

let passou = 0, falhou = 0;
const falhas = [];

function teste(nome, fn) {
  try { fn(); passou++; }
  catch (e) { falhou++; falhas.push({ nome, erro: e.message }); }
}

/* Auxiliar: monta respostas preenchendo todos os itens com o mesmo valor. */
function respostas(itens, valor) {
  const o = {};
  for (const it of itens) o[it.id] = valor;
  return o;
}

/* ── WEXNER ───────────────────────────────────────────────────── */

teste('Wexner: mínimo 0 = continência perfeita', () => {
  const r = Scores.calcularWexner(respostas(Scores.WEXNER_ITENS, 0));
  assert.equal(r.total, 0);
  assert.equal(r.severidade, 'ok');
  assert.equal(r.rotulo, 'Continência perfeita');
});

teste('Wexner: máximo 20 = incontinência completa', () => {
  const r = Scores.calcularWexner(respostas(Scores.WEXNER_ITENS, 4));
  assert.equal(r.total, 20);
  assert.equal(r.severidade, 'grave');
});

teste('Wexner: somatório correto com valores mistos', () => {
  const r = Scores.calcularWexner({
    wexner_solido: 3, wexner_liquido: 4, wexner_gases: 2,
    wexner_protecao: 4, wexner_estilo: 3
  });
  assert.equal(r.total, 16);
  assert.equal(r.severidade, 'grave');
});

teste('Wexner: limites das faixas de badge (1, 8, 9, 14, 15)', () => {
  assert.equal(Scores.classificarWexner(1).severidade,  'atencao');
  assert.equal(Scores.classificarWexner(8).severidade,  'atencao');
  assert.equal(Scores.classificarWexner(9).severidade,  'alerta');
  assert.equal(Scores.classificarWexner(14).severidade, 'alerta');
  assert.equal(Scores.classificarWexner(15).severidade, 'grave');
});

teste('Wexner: item acima do máximo lança RangeError', () => {
  assert.throws(() => Scores.calcularWexner({
    wexner_solido: 5, wexner_liquido: 0, wexner_gases: 0,
    wexner_protecao: 0, wexner_estilo: 0
  }), RangeError);
});

teste('Wexner: item negativo lança RangeError', () => {
  assert.throws(() => Scores.calcularWexner({
    wexner_solido: -1, wexner_liquido: 0, wexner_gases: 0,
    wexner_protecao: 0, wexner_estilo: 0
  }), RangeError);
});

teste('Wexner: item ausente lança RangeError', () => {
  assert.throws(() => Scores.calcularWexner({ wexner_solido: 2 }), RangeError);
});

teste('Wexner: total fora de 0–20 lança RangeError', () => {
  assert.throws(() => Scores.classificarWexner(21), RangeError);
  assert.throws(() => Scores.classificarWexner(-1), RangeError);
});

teste('Wexner: 5 linhas e 5 colunas com âncoras de frequência', () => {
  assert.equal(Scores.WEXNER_ITENS.length, 5);
  assert.equal(Scores.WEXNER_COLUNAS.length, 5);
  assert.equal(Scores.WEXNER_COLUNAS[1].ancora, '<1×/mês');
  assert.equal(Scores.WEXNER_COLUNAS[4].ancora, '≥1×/dia');
});

/* ── IPSS ─────────────────────────────────────────────────────── */

teste('IPSS: 7 itens de 0 a 5', () => {
  assert.equal(Scores.IPSS_ITENS.length, 7);
  assert.equal(Scores.IPSS_ITENS[0].min, 0);
  assert.equal(Scores.IPSS_ITENS[0].max, 5);
});

teste('IPSS: itens trazem placeholder oficial, nunca texto inventado', () => {
  for (const it of Scores.IPSS_ITENS) {
    assert.ok(it.label.startsWith('[INSERIR TEXTO OFICIAL'), 'label sem placeholder: ' + it.id);
  }
  assert.ok(Scores.IPSS_QV.label.startsWith('[INSERIR TEXTO OFICIAL'));
});

teste('IPSS: mínimo 0 = leve, máximo 35 = grave', () => {
  assert.equal(Scores.calcularIPSS(respostas(Scores.IPSS_ITENS, 0)).total, 0);
  assert.equal(Scores.calcularIPSS(respostas(Scores.IPSS_ITENS, 0)).severidade, 'ok');
  assert.equal(Scores.calcularIPSS(respostas(Scores.IPSS_ITENS, 5)).total, 35);
  assert.equal(Scores.calcularIPSS(respostas(Scores.IPSS_ITENS, 5)).severidade, 'grave');
});

teste('IPSS: limites de classificação (7, 8, 19, 20)', () => {
  assert.equal(Scores.classificarIPSS(7).rotulo,  'Sintomas leves');
  assert.equal(Scores.classificarIPSS(8).rotulo,  'Sintomas moderados');
  assert.equal(Scores.classificarIPSS(19).rotulo, 'Sintomas moderados');
  assert.equal(Scores.classificarIPSS(20).rotulo, 'Sintomas graves');
});

teste('IPSS: total fora de 0–35 lança RangeError', () => {
  assert.throws(() => Scores.classificarIPSS(36), RangeError);
  assert.throws(() => Scores.classificarIPSS(-1), RangeError);
});

/* ── IIEF-5 ───────────────────────────────────────────────────── */

teste('IIEF-5: 5 itens de 1 a 5', () => {
  assert.equal(Scores.IIEF5_ITENS.length, 5);
  assert.equal(Scores.IIEF5_ITENS[0].min, 1);
  assert.equal(Scores.IIEF5_ITENS[0].max, 5);
});

teste('IIEF-5: itens trazem placeholder oficial', () => {
  for (const it of Scores.IIEF5_ITENS) {
    assert.ok(it.label.startsWith('[INSERIR TEXTO OFICIAL'), 'label sem placeholder: ' + it.id);
  }
});

teste('IIEF-5: mínimo 5 e máximo 25', () => {
  assert.equal(Scores.calcularIIEF5(respostas(Scores.IIEF5_ITENS, 1)).total, 5);
  assert.equal(Scores.calcularIIEF5(respostas(Scores.IIEF5_ITENS, 5)).total, 25);
  assert.equal(Scores.calcularIIEF5(respostas(Scores.IIEF5_ITENS, 5)).rotulo, 'Sem disfunção erétil');
});

teste('IIEF-5: todos os limites de classificação', () => {
  assert.equal(Scores.classificarIIEF5(1).rotulo,  'Disfunção grave');
  assert.equal(Scores.classificarIIEF5(7).rotulo,  'Disfunção grave');
  assert.equal(Scores.classificarIIEF5(8).rotulo,  'Disfunção moderada');
  assert.equal(Scores.classificarIIEF5(11).rotulo, 'Disfunção moderada');
  assert.equal(Scores.classificarIIEF5(12).rotulo, 'Disfunção leve a moderada');
  assert.equal(Scores.classificarIIEF5(16).rotulo, 'Disfunção leve a moderada');
  assert.equal(Scores.classificarIIEF5(17).rotulo, 'Disfunção leve');
  assert.equal(Scores.classificarIIEF5(21).rotulo, 'Disfunção leve');
  assert.equal(Scores.classificarIIEF5(22).rotulo, 'Sem disfunção erétil');
  assert.equal(Scores.classificarIIEF5(25).rotulo, 'Sem disfunção erétil');
});

teste('IIEF-5: 0 é inválido — a faixa começa em 1', () => {
  assert.throws(() => Scores.classificarIIEF5(0), RangeError);
  assert.throws(() => Scores.classificarIIEF5(26), RangeError);
});

/* ── NIH-CPSI ─────────────────────────────────────────────────── */

teste('NIH-CPSI: 9 itens com placeholder e pendência declarada', () => {
  assert.equal(Scores.NIH_CPSI_ITENS.length, 9);
  assert.equal(Scores.NIH_CPSI_PENDENTE, true);
  for (const it of Scores.NIH_CPSI_ITENS) {
    assert.ok(it.label.startsWith('[INSERIR TEXTO OFICIAL'), 'label sem placeholder: ' + it.id);
  }
});

teste('NIH-CPSI: domínios dor/urinário/qv mapeados', () => {
  const dominios = new Set(Scores.NIH_CPSI_ITENS.map(i => i.dominio));
  assert.deepEqual([...dominios].sort(), ['dor', 'qv', 'urinario']);
});

teste('NIH-CPSI: resultado sinaliza contexto insuficiente', () => {
  const r = Scores.calcularNihCpsi(respostas(Scores.NIH_CPSI_ITENS, 0));
  assert.equal(r.pendente, true);
  assert.ok(r.rotulo.includes('[CONTEXTO INSUFICIENTE'));
});

/* ── IMC ──────────────────────────────────────────────────────── */

teste('IMC: cálculo e arredondamento a uma casa', () => {
  const r = Scores.calcularIMC(72, 1.62);
  assert.equal(r.valor, 27.4);
  assert.equal(r.rotulo, 'Sobrepeso');
});

teste('IMC: todas as faixas da OMS', () => {
  assert.equal(Scores.calcularIMC(45, 1.70).rotulo, 'Baixo peso');        // 15.6
  assert.equal(Scores.calcularIMC(64, 1.70).rotulo, 'Eutrofia');          // 22.1
  assert.equal(Scores.calcularIMC(78, 1.70).rotulo, 'Sobrepeso');         // 27.0
  assert.equal(Scores.calcularIMC(92, 1.70).rotulo, 'Obesidade grau I');  // 31.8
  assert.equal(Scores.calcularIMC(102, 1.70).rotulo, 'Obesidade grau II');// 35.3
  assert.equal(Scores.calcularIMC(125, 1.70).rotulo, 'Obesidade grau III');// 43.3
});

teste('IMC: fronteiras exatas 18.5 / 25 / 30 com valores plausíveis', () => {
  // altura 1,60 m → peso = IMC × 2,56
  assert.equal(Scores.calcularIMC(47.36, 1.60).rotulo, 'Eutrofia');          // IMC 18.5
  assert.equal(Scores.calcularIMC(47.10, 1.60).rotulo, 'Baixo peso');        // IMC 18.4
  assert.equal(Scores.calcularIMC(64.00, 1.60).rotulo, 'Sobrepeso');         // IMC 25.0
  assert.equal(Scores.calcularIMC(76.80, 1.60).rotulo, 'Obesidade grau I');  // IMC 30.0
  assert.equal(Scores.calcularIMC(89.60, 1.60).rotulo, 'Obesidade grau II'); // IMC 35.0
  assert.equal(Scores.calcularIMC(102.4, 1.60).rotulo, 'Obesidade grau III');// IMC 40.0
});

teste('IMC: peso ou altura implausível lança RangeError', () => {
  assert.throws(() => Scores.calcularIMC(10, 1.70), RangeError);
  assert.throws(() => Scores.calcularIMC(70, 0.4), RangeError);
  assert.throws(() => Scores.calcularIMC(70, 3.1), RangeError);
  assert.throws(() => Scores.calcularIMC('abc', 1.7), RangeError);
});

/* ── EVA ──────────────────────────────────────────────────────── */

teste('EVA: faixas leve / moderada / intensa', () => {
  assert.equal(Scores.classificarEVA(0).rotulo,  'Sem dor');
  assert.equal(Scores.classificarEVA(2).rotulo,  'Dor leve');
  assert.equal(Scores.classificarEVA(3).rotulo,  'Dor moderada');
  assert.equal(Scores.classificarEVA(7).rotulo,  'Dor moderada');
  assert.equal(Scores.classificarEVA(8).rotulo,  'Dor intensa');
  assert.equal(Scores.classificarEVA(10).rotulo, 'Dor intensa');
});

teste('EVA: fora de 0–10 lança RangeError', () => {
  assert.throws(() => Scores.classificarEVA(11), RangeError);
  assert.throws(() => Scores.classificarEVA(-1), RangeError);
  assert.throws(() => Scores.classificarEVA(2.5), RangeError);
});

/* ── OXFORD e ICS (verbatim) ──────────────────────────────────── */

teste('Oxford Modificada: 6 níveis, redação verbatim da ficha', () => {
  assert.equal(Scores.OXFORD_MODIFICADA.length, 6);
  assert.equal(Scores.textoOxford(0), 'Ausência de contração dos músculos perineais');
  assert.equal(Scores.textoOxford(1), 'Esboço de contração muscular não sustentada');
  assert.equal(Scores.textoOxford(2), 'Presença de contração de pequena intensidade, mas que se sustenta');
  assert.ok(Scores.textoOxford(5).startsWith('Contração forte, compressão firme'));
});

teste('Oxford: fora de 0–5 lança RangeError', () => {
  assert.throws(() => Scores.textoOxford(6), RangeError);
  assert.throws(() => Scores.textoOxford(-1), RangeError);
});

teste('ICS: 4 níveis, redação verbatim da ficha', () => {
  assert.equal(Scores.ICS_CONTRACAO_VOLUNTARIA.length, 4);
  assert.equal(Scores.textoICS(3), 'Forte (forte força de oclusão e elevação palpável)');
  assert.equal(Scores.textoICS(2), 'Normal (oclusão e elevação palpáveis)');
  assert.equal(Scores.textoICS(1), 'Fraca (contração curta sem oclusão palpável)');
  assert.equal(Scores.textoICS(0), 'Ausente (sem contração)');
});

teste('ICS: fora de 0–3 lança RangeError', () => {
  assert.throws(() => Scores.textoICS(4), RangeError);
});

/* ── TMFAP ────────────────────────────────────────────────────── */

teste('TMFAP: repouso sugerido é 1:2 sobre a sustentação', () => {
  assert.equal(Scores.repousoSugerido(5), 10);
  assert.equal(Scores.repousoSugerido(0), 0);
  assert.equal(Scores.repousoSugerido(10), 20);
});

teste('TMFAP: sustentação fora da faixa lança RangeError', () => {
  assert.throws(() => Scores.repousoSugerido(-1), RangeError);
  assert.throws(() => Scores.repousoSugerido(61), RangeError);
});

teste('TMFAP: progressão postural na ordem do contrato', () => {
  assert.deepEqual(Scores.PROGRESSAO_POSTURAL,
    ['supino', 'sentado', 'ortostático', 'dinâmico']);
});

/* ── UTILITÁRIOS ──────────────────────────────────────────────── */

teste('limitar(): prende dentro da faixa sem lançar', () => {
  assert.equal(Scores.limitar(15, 0, 10), 10);
  assert.equal(Scores.limitar(-5, 0, 10), 0);
  assert.equal(Scores.limitar(7, 0, 10), 7);
  assert.equal(Scores.limitar('xyz', 0, 10), 0);
});

teste('completo(): detecta instrumento parcialmente respondido', () => {
  assert.equal(Scores.completo(respostas(Scores.WEXNER_ITENS, 0), Scores.WEXNER_ITENS), true);
  assert.equal(Scores.completo({ wexner_solido: 1 }, Scores.WEXNER_ITENS), false);
  assert.equal(Scores.completo(null, Scores.WEXNER_ITENS), false);
});

/* ── RELATÓRIO ────────────────────────────────────────────────── */
console.log('\n  scores.test.mjs');
console.log('  ' + '─'.repeat(46));
if (falhou === 0) {
  console.log('  ✓ ' + passou + ' testes — todos passaram');
} else {
  for (const f of falhas) console.log('  ✗ ' + f.nome + '\n      ' + f.erro);
  console.log('\n  ' + passou + ' passaram · ' + falhou + ' falharam');
}
console.log('');
process.exit(falhou === 0 ? 0 : 1);
