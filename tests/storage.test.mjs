/* ════════════════════════════════════════════════════════════════
   tests/storage.test.mjs — Testes de serialização e validação.
   Executar:  node tests/storage.test.mjs
   ════════════════════════════════════════════════════════════════ */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Storage = require('../js/storage.js');

let passou = 0, falhou = 0;
const falhas = [];

function teste(nome, fn) {
  try { fn(); passou++; }
  catch (e) { falhou++; falhas.push({ nome, erro: e.message }); }
}

/* Documento válido de referência, com dados em todas as seções. */
function docValido() {
  return {
    schemaVersion: 1,
    perfil: 'feminino',
    dadosComuns: { ident_nome: 'Maria de Teste', ident_idade: '41' },
    dadosFemininos: { wexner_solido: 3, s5_iu: 'sim' },
    dadosMasculinos: {},
    prescricao: { series: 3, sustentacao: 5 },
    aderencia: { meta: 'Treinar 2× ao dia' },
    atualizadoEm: '2026-08-30T12:00:00.000Z'
  };
}

/* ── SCHEMA E DOCUMENTO NOVO ──────────────────────────────────── */

teste('chave e versão do schema conforme contrato', () => {
  assert.equal(Storage.CHAVE, 'vf-pelvica-v1');
  assert.equal(Storage.VERSAO_SCHEMA, 1);
});

teste('novoDocumento() traz todas as seções do schema', () => {
  const d = Storage.novoDocumento();
  assert.equal(d.schemaVersion, 1);
  assert.equal(d.perfil, 'feminino');
  for (const s of ['dadosComuns','dadosFemininos','dadosMasculinos','prescricao','aderencia']) {
    assert.deepEqual(d[s], {}, 'seção ausente: ' + s);
  }
  assert.ok(!isNaN(Date.parse(d.atualizadoEm)));
});

teste('novoDocumento() passa na própria validação', () => {
  assert.equal(Storage.validar(Storage.novoDocumento()).valido, true);
});

/* ── VALIDAÇÃO ────────────────────────────────────────────────── */

teste('validar(): aceita documento completo', () => {
  const v = Storage.validar(docValido());
  assert.equal(v.valido, true);
  assert.deepEqual(v.erros, []);
});

teste('validar(): recusa null, array e primitivos', () => {
  assert.equal(Storage.validar(null).valido, false);
  assert.equal(Storage.validar([]).valido, false);
  assert.equal(Storage.validar('texto').valido, false);
  assert.equal(Storage.validar(42).valido, false);
});

teste('validar(): recusa versão de schema divergente', () => {
  const d = docValido(); d.schemaVersion = 2;
  const v = Storage.validar(d);
  assert.equal(v.valido, false);
  assert.ok(v.erros.some(e => e.includes('esquema')));
});

teste('validar(): recusa perfil desconhecido', () => {
  const d = docValido(); d.perfil = 'infantil';
  const v = Storage.validar(d);
  assert.equal(v.valido, false);
  assert.ok(v.erros.some(e => e.includes('Perfil inválido')));
});

teste('validar(): recusa seção ausente ou não-objeto', () => {
  const semSecao = docValido(); delete semSecao.prescricao;
  assert.equal(Storage.validar(semSecao).valido, false);

  const arrayNaSecao = docValido(); arrayNaSecao.dadosComuns = [];
  assert.equal(Storage.validar(arrayNaSecao).valido, false);

  const stringNaSecao = docValido(); stringNaSecao.aderencia = 'oi';
  assert.equal(Storage.validar(stringNaSecao).valido, false);
});

teste('validar(): recusa data inválida', () => {
  const d = docValido(); d.atualizadoEm = 'ontem';
  assert.equal(Storage.validar(d).valido, false);

  const d2 = docValido(); delete d2.atualizadoEm;
  assert.equal(Storage.validar(d2).valido, false);
});

teste('validar(): acumula múltiplos erros de uma vez', () => {
  const v = Storage.validar({ schemaVersion: 9, perfil: 'x' });
  assert.equal(v.valido, false);
  assert.ok(v.erros.length >= 3, 'esperado ao menos 3 erros, veio ' + v.erros.length);
});

/* ── ROUND-TRIP ───────────────────────────────────────────────── */

teste('round-trip: serializar → desserializar preserva os dados', () => {
  const original = docValido();
  const texto = Storage.serializar(original);
  const r = Storage.desserializar(texto);

  assert.equal(r.valido, true);
  assert.equal(r.doc.perfil, 'feminino');
  assert.equal(r.doc.dadosComuns.ident_nome, 'Maria de Teste');
  assert.equal(r.doc.dadosFemininos.wexner_solido, 3);
  assert.equal(r.doc.prescricao.sustentacao, 5);
  assert.equal(r.doc.aderencia.meta, 'Treinar 2× ao dia');
});

teste('round-trip: preserva acentuação e caracteres especiais', () => {
  const d = docValido();
  d.dadosComuns.ident_nome = 'Ana Conceição d’Ávila — 1º atendimento';
  d.dadosFemininos.obs = 'Dispareunia superficial · EVA 7/10 <urgência>';
  const r = Storage.desserializar(Storage.serializar(d));
  assert.equal(r.doc.dadosComuns.ident_nome, 'Ana Conceição d’Ávila — 1º atendimento');
  assert.equal(r.doc.dadosFemininos.obs, 'Dispareunia superficial · EVA 7/10 <urgência>');
});

teste('serializar(): atualiza o carimbo de tempo', () => {
  const d = docValido();
  const antes = d.atualizadoEm;
  const saida = JSON.parse(Storage.serializar(d));
  assert.notEqual(saida.atualizadoEm, antes);
  assert.ok(!isNaN(Date.parse(saida.atualizadoEm)));
});

teste('serializar(): produz JSON legível e reimportável', () => {
  const texto = Storage.serializar(docValido());
  assert.ok(texto.includes('\n'), 'JSON deveria estar indentado');
  assert.equal(Storage.desserializar(texto).valido, true);
});

/* ── DESSERIALIZAÇÃO DE PAYLOAD MALFORMADO ────────────────────── */

teste('desserializar(): recusa JSON sintaticamente inválido', () => {
  const r = Storage.desserializar('{ isso não é json ');
  assert.equal(r.valido, false);
  assert.equal(r.doc, null);
  assert.ok(r.erros[0].includes('JSON válido'));
});

teste('desserializar(): recusa JSON válido com estrutura errada', () => {
  const r = Storage.desserializar('{"foo":"bar"}');
  assert.equal(r.valido, false);
  assert.equal(r.doc, null);
  assert.ok(r.erros.length > 0);
});

teste('desserializar(): recusa texto vazio', () => {
  assert.equal(Storage.desserializar('').valido, false);
});

/* ── IMPORTAÇÃO SEGURA ────────────────────────────────────────── */

teste('importar(): payload malformado NÃO sobrescreve os dados atuais', () => {
  const atual = docValido();
  atual.dadosComuns.ident_nome = 'PACIENTE EM ATENDIMENTO';

  const r = Storage.importar('{"lixo":true}', atual);

  assert.equal(r.ok, false);
  assert.ok(r.erros.length > 0);
  assert.equal(r.doc.dadosComuns.ident_nome, 'PACIENTE EM ATENDIMENTO',
    'os dados em uso foram corrompidos pela importação recusada');
  assert.ok(r.mensagem.includes('preservados'));
});

teste('importar(): JSON quebrado NÃO sobrescreve os dados atuais', () => {
  const atual = docValido();
  const r = Storage.importar('<<<>>>', atual);
  assert.equal(r.ok, false);
  assert.equal(r.doc.dadosComuns.ident_nome, 'Maria de Teste');
});

teste('importar(): payload válido substitui o documento', () => {
  const atual = docValido();
  const novo = docValido();
  novo.dadosComuns.ident_nome = 'Outra Paciente';
  novo.perfil = 'masculino';

  const r = Storage.importar(JSON.stringify(novo), atual);

  assert.equal(r.ok, true);
  assert.equal(r.doc.dadosComuns.ident_nome, 'Outra Paciente');
  assert.equal(r.doc.perfil, 'masculino');
});

/* ── NORMALIZAÇÃO ─────────────────────────────────────────────── */

teste('normalizar(): completa seções faltantes sem perder dados', () => {
  const parcial = {
    schemaVersion: 1, perfil: 'masculino',
    dadosComuns: { ident_nome: 'João' },
    atualizadoEm: '2026-08-30T12:00:00.000Z'
  };
  const n = Storage.normalizar(parcial);
  assert.equal(n.dadosComuns.ident_nome, 'João');
  assert.deepEqual(n.dadosFemininos, {});
  assert.deepEqual(n.prescricao, {});
  assert.equal(n.perfil, 'masculino');
});

teste('normalizar(): perfil inválido cai no padrão feminino', () => {
  const n = Storage.normalizar({ schemaVersion: 1, perfil: 'xyz', atualizadoEm: 'x' });
  assert.equal(n.perfil, 'feminino');
});

/* ── NOME DE ARQUIVO DE BACKUP ────────────────────────────────── */

teste('nomeArquivo(): usa o nome da paciente, sem acento nem espaço', () => {
  const nome = Storage.nomeArquivo({ dadosComuns: { ident_nome: 'Maria Aparecida Souza' } });
  assert.ok(nome.startsWith('vf-pelvica-maria-aparecida-souza-'), nome);
  assert.ok(nome.endsWith('.json'));
  assert.ok(!/[^a-z0-9\-.]/.test(nome), 'nome contém caractere inseguro: ' + nome);
});

teste('nomeArquivo(): sem nome preenchido usa rótulo genérico', () => {
  const nome = Storage.nomeArquivo({ dadosComuns: {} });
  assert.ok(nome.startsWith('vf-pelvica-atendimento-'), nome);
});

teste('nomeArquivo(): tolera documento incompleto sem lançar', () => {
  assert.ok(Storage.nomeArquivo({}).endsWith('.json'));
  assert.ok(Storage.nomeArquivo(null).endsWith('.json'));
});

/* ── AMBIENTE SEM localStorage (caso do Node) ─────────────────── */

teste('disponivel(): retorna false sem localStorage, sem lançar', () => {
  assert.equal(typeof Storage.disponivel(), 'boolean');
});

teste('salvar()/carregar(): degradam com elegância fora do navegador', () => {
  const r = Storage.salvar(docValido());
  assert.equal(typeof r.ok, 'boolean');
  if (!r.ok) assert.ok(r.erro.length > 0);
  assert.doesNotThrow(() => Storage.carregar());
});

/* ── RELATÓRIO ────────────────────────────────────────────────── */
console.log('\n  storage.test.mjs');
console.log('  ' + '─'.repeat(46));
if (falhou === 0) {
  console.log('  ✓ ' + passou + ' testes — todos passaram');
} else {
  for (const f of falhas) console.log('  ✗ ' + f.nome + '\n      ' + f.erro);
  console.log('\n  ' + passou + ' passaram · ' + falhou + ' falharam');
}
console.log('');
process.exit(falhou === 0 ? 0 : 1);
