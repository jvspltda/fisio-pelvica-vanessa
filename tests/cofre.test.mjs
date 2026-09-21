/* ════════════════════════════════════════════════════════════════
   tests/cofre.test.mjs — Testes do núcleo do prontuário.
   Executar:  node tests/cofre.test.mjs
   ════════════════════════════════════════════════════════════════ */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Cofre = require('../js/cofre.js');
/* Iterações reduzidas só para o teste rodar rápido; o formato e a
   lógica são os mesmos. */
Cofre.ITERACOES = 1000;

let passou = 0, falhou = 0;
const falhas = [];
async function teste(nome, fn) {
  try { await fn(); passou++; }
  catch (e) { falhou++; falhas.push({ nome, erro: e.message }); }
}
const AUTORIA = { nome: 'Vanessa Fernandes', registro: 'CREFITO-4: 252806-F' };

await teste('criar e reabrir com a senha certa devolve o mesmo banco', async () => {
  const c = await Cofre.criar('senha-forte-1');
  c.banco.pacientes.push(Cofre.novaPaciente({ nome: 'Ana Teste' }));
  const env = await Cofre.cifrar(c.sessao, c.banco);
  const r = await Cofre.abrir('senha-forte-1', env);
  assert.equal(r.banco.pacientes.length, 1);
  assert.equal(r.banco.pacientes[0].nome, 'Ana Teste');
});

await teste('senha errada é recusada', async () => {
  const c = await Cofre.criar('senha-forte-1');
  await assert.rejects(() => Cofre.abrir('senha-errada', c.envelope), /Senha incorreta/);
});

await teste('envelope adulterado é recusado (autenticação do GCM)', async () => {
  const c = await Cofre.criar('senha-forte-1');
  const env = { ...c.envelope };
  const bytes = Buffer.from(env.dados, 'base64'); bytes[0] ^= 0xff;
  env.dados = bytes.toString('base64');
  await assert.rejects(() => Cofre.abrir('senha-forte-1', env), /Senha incorreta ou arquivo danificado/);
});

await teste('o conteúdo cifrado não contém o nome da paciente em claro', async () => {
  const c = await Cofre.criar('senha-forte-1');
  c.banco.pacientes.push(Cofre.novaPaciente({ nome: 'Maria Sigilosa' }));
  const env = await Cofre.cifrar(c.sessao, c.banco);
  const texto = JSON.stringify(env) + Buffer.from(env.dados, 'base64').toString('latin1');
  assert.ok(!texto.includes('Maria Sigilosa'));
});

await teste('senha curta é recusada', async () => {
  await assert.rejects(() => Cofre.criar('curta'), /pelo menos 8/);
});

await teste('arquivo que não é backup é recusado', async () => {
  await assert.rejects(() => Cofre.abrir('senha-forte-1', { formato: 'outro' }), /não é um backup/);
});

await teste('trocar a senha: a nova abre, a antiga não', async () => {
  const c = await Cofre.criar('senha-antiga-1');
  c.banco.pacientes.push(Cofre.novaPaciente({ nome: 'Bia' }));
  const t = await Cofre.trocarSenha(c.banco, 'senha-nova-22');
  assert.equal((await Cofre.abrir('senha-nova-22', t.envelope)).banco.pacientes[0].nome, 'Bia');
  await assert.rejects(() => Cofre.abrir('senha-antiga-1', t.envelope), /Senha incorreta/);
});

await teste('paciente nasce com todos os campos da Resolução 414/2012', async () => {
  const p = Cofre.novaPaciente({ nome: 'Carla' });
  for (const campo of ['historia', 'exameFisico', 'examesComplementares', 'diagnostico', 'prognostico', 'plano', 'evolucoes']) {
    assert.ok(campo in p, 'falta ' + campo);
  }
});

await teste('paciente sem nome é recusada', async () => {
  assert.throws(() => Cofre.novaPaciente({ nome: '   ' }), /nome/);
});

await teste('evolução exige texto e autoria com registro', async () => {
  assert.throws(() => Cofre.novaEvolucao('', '2026-09-21', AUTORIA), /Escreva/);
  assert.throws(() => Cofre.novaEvolucao('ok', '2026-09-21', { nome: 'X' }), /registro/);
  const e = Cofre.novaEvolucao('Primeira sessão.', '2026-09-21', AUTORIA);
  assert.equal(e.registro, 'CREFITO-4: 252806-F');
  assert.equal(e.autora, 'Vanessa Fernandes');
});

await teste('guarda: não pode excluir antes de 5 anos do último registro', async () => {
  const p = Cofre.novaPaciente({ nome: 'Dora' });
  p.criadoEm = p.atualizadoEm = '2026-01-10T12:00:00.000Z';
  p.evolucoes.push({ criadoEm: '2027-03-01T12:00:00.000Z' });
  assert.equal(Cofre.podeExcluir(p, new Date('2031-01-11T12:00:00Z')), false);
  assert.equal(Cofre.podeExcluir(p, new Date('2032-03-02T12:00:00Z')), true);
  assert.equal(Cofre.dataLiberacao(p).getFullYear(), 2032);
});

await teste('busca ignora acento e caixa, e esconde arquivadas', async () => {
  const b = Cofre.bancoVazio();
  const a = Cofre.novaPaciente({ nome: 'Conceição Alves' });
  const z = Cofre.novaPaciente({ nome: 'Zélia Arquivada' }); z.arquivada = true;
  b.pacientes.push(a, z);
  assert.equal(Cofre.buscar(b, 'conceicao').length, 1);
  assert.equal(Cofre.buscar(b, 'zelia').length, 0);
  assert.equal(Cofre.buscar(b, 'zelia', true).length, 1);
});

await teste('busca põe primeiro quem tem próxima ação mais próxima', async () => {
  const b = Cofre.bancoVazio();
  const x = Cofre.novaPaciente({ nome: 'Ana' });
  const y = Cofre.novaPaciente({ nome: 'Bruna' }); y.proximaAcao = { texto: 'reavaliar', data: '2026-10-01' };
  const w = Cofre.novaPaciente({ nome: 'Cida' });  w.proximaAcao = { texto: 'D+7', data: '2026-09-25' };
  b.pacientes.push(x, y, w);
  assert.deepEqual(Cofre.buscar(b, '').map(p => p.nome), ['Cida', 'Bruna', 'Ana']);
});

/* ── RELATÓRIO ────────────────────────────────────────────────── */
console.log('\n  cofre.test.mjs');
console.log('  ' + '─'.repeat(46));
if (falhou === 0) {
  console.log('  ✓ ' + passou + ' testes — todos passaram');
} else {
  for (const f of falhas) console.log('  ✗ ' + f.nome + '\n      ' + f.erro);
  console.log('\n  ' + passou + ' passaram · ' + falhou + ' falharam');
}
console.log('');
process.exit(falhou === 0 ? 0 : 1);
