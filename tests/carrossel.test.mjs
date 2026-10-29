/* ════════════════════════════════════════════════════════════════
   tests/carrossel.test.mjs — Guarda dos carrosséis do Instagram.
   Roda na publicação: identificação e data em todo slide, nenhuma
   promessa nem número estatístico, figuras existentes, legenda dentro
   dos limites do Instagram e bibliotecas externas com o mesmo SRI dos
   impressos.
   Executar:  node tests/carrossel.test.mjs
   ════════════════════════════════════════════════════════════════ */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const C = require('../js/carrossel.js');
const R = require('../js/roteiros.js');
const E = require('../js/exercicios.js');
const X = require('../js/externas.js');

let passou = 0, falhou = 0;
const falhas = [];
function teste(nome, fn) { try { fn(); passou++; } catch (e) { falhou++; falhas.push({ nome, erro: e.message }); } }

const textos = (c) => c.slides.flatMap(s => [s.chamada, s.titulo, s.texto, s.alerta, s.rodapeExtra, ...(s.itens || [])]).filter(Boolean);
const PROIBIDAS = /(?<!\p{L})(garant\p{L}*|infal[íi]vel|a solução|eficaz|curar?|cura-se|não é normal|resultado garantido|antes e depois|depoimento|R\$|valor da consulta)(?!\p{L})/iu;

teste('todo slide leva nome, "Fisioterapeuta", CREFITO-4 e a data da publicação', () => {
  const r = C.rodape('2026-11-03');
  assert.ok(r.startsWith(R.SELO), 'rodapé diferente do selo dos Reels');
  assert.ok(r.includes('CREFITO-4: 252806-F') && r.includes('Fisioterapeuta') && r.includes('Vanessa Fernandes'));
  assert.ok(r.endsWith('publicado em 03/11/2026'));
  assert.equal(C.dataCurta('lixo'), '');
  /* a página põe o rodapé em todo slide e exige a data antes de gerar */
  const js = readFileSync(join(raiz, 'js/carrossel-pagina.js'), 'utf8');
  assert.ok(/s-rodape/.test(js) && /C\.rodape\(/.test(js), 'slide sem rodapé de identificação');
  assert.ok(/Escolha a data da publicação/.test(js), 'gera imagem sem data');
});

teste('estrutura: capa primeiro, fecho com agendamento por último, até dez slides', () => {
  const ids = new Set();
  for (const c of C.LISTA) {
    assert.ok(!ids.has(c.id)); ids.add(c.id);
    assert.ok(c.slides.length >= 3 && c.slides.length <= 10, c.id + ': ' + c.slides.length + ' slides');
    assert.equal(c.slides[0].tipo, 'capa'); assert.equal(c.slides[c.slides.length - 1].tipo, 'fecho');
    assert.equal(typeof c.soOrganico, 'boolean', c.id + ' sem a marcação de orgânico ou anúncio');
    for (const s of c.slides) assert.ok(['capa', 'exercicio', 'cuidados', 'fecho'].includes(s.tipo));
  }
  assert.ok(C.AGENDA.telefone === '(31) 3868-1120' && C.AGENDA.local.includes('Rodovia MG-010, 598'));
});

teste('figuras existem e são ilustrações da biblioteca (nunca foto de paciente)', () => {
  const biblioteca = new Set(E.BIBLIOTECA.map(b => b.imagem));
  for (const c of C.LISTA) for (const s of c.slides) if (s.figura) {
    assert.ok(biblioteca.has(s.figura), s.figura + ' fora da biblioteca de ilustrações');
    assert.ok(existsSync(join(raiz, 'assets/exercicios', s.figura)), 'falta ' + s.figura);
    /* versão de borda esmaecida usada no slide */
    assert.ok(existsSync(join(raiz, 'assets/carrossel', s.figura.replace(/\.jpg$/, '.png'))), 'falta a versão do slide de ' + s.figura);
  }
});

teste('nenhuma promessa, depoimento, valor ou palavra da lista de "nunca dizer"', () => {
  for (const c of C.LISTA) {
    const tudo = textos(c).concat(c.legenda, c.slides.map(s => s.alt)).join('\n');
    const m = tudo.match(PROIBIDAS);
    assert.ok(!m, c.id + ' contém "' + (m && m[0]) + '"');
    /* palavra inteira: "procurar" não é "cura" (os termos de R.NUNCA não têm símbolo de regex) */
    const palavras = tudo.toLowerCase().split(/[^\p{L}]+/u).join(' ');
    for (const n of R.NUNCA) assert.ok(!(' ' + palavras + ' ').includes(' ' + n.toLowerCase() + ' '), c.id + ' contém "' + n + '"');
  }
});

teste('sem número estatístico nos textos (contagem dos exercícios e contato podem)', () => {
  for (const c of C.LISTA) {
    const tudo = textos(c).concat(c.legenda).join('\n')
      .replace(/\(31\) 3868-1120/g, '').replace(/MG-010, 598/g, '');
    assert.ok(!/%|\d/.test(tudo), c.id + ' tem número no texto: ' + (tudo.match(/.{0,20}(%|\d).{0,20}/) || [''])[0]);
  }
});

teste('legenda e texto alternativo dentro dos limites do Instagram', () => {
  for (const c of C.LISTA) {
    const l = C.legendaCompleta(c);
    assert.ok(l.length <= 2200, c.id + ': legenda com ' + l.length + ' caracteres');
    assert.ok(l.includes('CREFITO-4: 252806-F') && l.includes('@vanessa.fernands') && l.includes('@clinicaveracis'));
    const tags = c.hashtags.trim().split(/\s+/);
    assert.ok(tags.length <= 30 && tags.every(t => /^#[\p{L}\d_]+$/u.test(t)), c.id + ': hashtags inválidas');
    for (const s of c.slides) assert.ok(s.alt && s.alt.length <= 100, c.id + ': texto alternativo vazio ou longo demais');
  }
});

teste('bibliotecas externas com o mesmo SRI dos impressos', () => {
  const imp = readFileSync(join(raiz, 'tools/impressos-cliente.js'), 'utf8');
  for (const lib of Object.values(X.LIBS)) {
    assert.ok(lib.src.startsWith('https://cdnjs.cloudflare.com/') && /^sha512-/.test(lib.integrity));
    assert.ok(imp.includes(lib.src) && imp.includes(lib.integrity), 'SRI de ' + lib.src + ' diferente em tools/impressos-cliente.js');
  }
});

teste('página carrega os scripts na ordem e está no site', () => {
  const h = readFileSync(join(raiz, 'carrossel.html'), 'utf8');
  const ordem = ['js/carrossel.js', 'js/externas.js', 'js/carrossel-pagina.js'].map(s => h.indexOf('src="' + s + '"'));
  assert.ok(ordem.every(i => i > 0) && ordem[0] < ordem[1] && ordem[1] < ordem[2], 'ordem dos scripts');
  assert.ok(readFileSync(join(raiz, 'index.html'), 'utf8').includes('href="carrossel.html"'), 'sem atalho na página inicial');
  assert.ok(readFileSync(join(raiz, '.github/workflows/publicar.yml'), 'utf8').includes('carrossel.html'), 'workflow não publica a página');
  /* nome de etapa com ": " quebra o YAML e a publicação nem começa (aconteceu em 2026-10-29) */
  const wf = readFileSync(join(raiz, '.github/workflows/publicar.yml'), 'utf8');
  for (const l of wf.split(/\r?\n/).filter(l => /^\s*- name: /.test(l)))
    assert.ok(!/: /.test(l.replace(/^\s*- name: /, '')) || /^\s*- name: (["']).*\1\s*$/.test(l), 'nome de etapa com ": " sem aspas: ' + l.trim());
});

teste('cuidados logo depois da capa, com os mesmos sinais de alerta da cartilha', () => {
  const A = require('../js/adherence.js');
  const nota = A.CARTILHAS.find(c => c.id === 'gestacao').blocos.map(b => b.nota).filter(Boolean)[0];
  for (const c of C.LISTA) {
    const i = c.slides.findIndex(s => s.tipo === 'cuidados');
    if (i < 0) continue;
    assert.equal(i, 1, c.id + ': cuidados no slide ' + (i + 1) + ' — quem para de arrastar cedo não vê');
    const al = c.slides[i].alerta.toLowerCase();
    for (const sinal of ['sangramento', 'perda de líquido', 'contrações fortes e regulares', 'tontura', 'falta de ar já antes de começar', 'perda de equilíbrio', 'dor no peito', 'dor de cabeça', 'batata da perna', 'bebê'])
      assert.ok(al.includes(sinal) && nota.toLowerCase().includes(sinal), c.id + ': sinal "' + sinal + '" fora do slide ou da cartilha');
    assert.ok(c.slides[i].itens.some(t => /obstetra/.test(t) && /restring/.test(t)), c.id + ': sem a restrição da obstetra');
  }
});

teste('data: em branco até ser escolhida, e vai também na legenda', () => {
  assert.ok(C.rodape('').endsWith('publicado em __/__/____'));
  assert.ok(C.legendaCompleta(C.LISTA[0], '2026-11-03').includes('Publicado em 03/11/2026'));
  assert.ok(!C.legendaCompleta(C.LISTA[0], '').includes('Publicado em'));
  const js = readFileSync(join(raiz, 'js/carrossel-pagina.js'), 'utf8');
  assert.ok(!/c-data'\)\.value = hoje\(\)/.test(js), 'a data não pode vir preenchida com hoje');
});

console.log('\n  carrossel.test.mjs');
console.log('  ' + '─'.repeat(46));
if (falhou === 0) console.log('  ✓ ' + passou + ' testes — todos passaram');
else { for (const f of falhas) console.log('  ✗ ' + f.nome + '\n      ' + f.erro); console.log('\n  ' + passou + ' passaram · ' + falhou + ' falharam'); }
console.log('');
process.exit(falhou === 0 ? 0 : 1);
