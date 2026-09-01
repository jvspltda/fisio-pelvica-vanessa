/* ----------------------------------------------------------------
   tools/gerar-ficha-pdf.mjs

   Gera o HTML da ficha de avaliacao em branco, para impressao A4,
   a partir da MESMA estrutura de dados que a aplicacao usa
   (js/ficha.js + js/scores.js). Assim o papel e a tela nao divergem.

   Timbre repetido: <thead>/<tfoot> de uma tabela que envolve o corpo.
   Elemento fixed com deslocamento negativo -- a tecnica de print.css --
   NAO repete por pagina no Chrome usado aqui: o cabecalho saiu uma
   unica vez, a ~260mm do topo. A tabela e a via confiavel.

   Uso:   node tools/gerar-ficha-pdf.mjs
   Saida: build/ficha-avaliacao.html
   ---------------------------------------------------------------- */
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

const Scores = require(join(raiz, 'js/scores.js'));
const Ficha  = require(join(raiz, 'js/ficha.js'));

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const linha = (largura = '100%') =>
  `<span class="linha" style="width:${largura}"></span>`;

/* ---------- render de um campo ---------- */
function campo(c) {
  if (c.tipo === 'titulo') return `<h4 class="sub">${esc(c.texto)}</h4>`;
  if (c.tipo === 'nota')   return `<p class="nota">${esc(c.texto)}</p>`;

  const total = c.larguraTotal ? ' total' : '';

  if (c.tipo === 'texto' || c.tipo === 'data' || c.tipo === 'calculado') {
    return `<div class="campo${total}"><span class="rot">${esc(c.label)}</span>${linha()}</div>`;
  }

  if (c.tipo === 'numero') {
    const faixa = (c.min !== undefined && c.max !== undefined)
      ? ` <em class="faixa">(${c.min}–${c.max})</em>` : '';
    return `<div class="campo${total}"><span class="rot">${esc(c.label)}${faixa}</span>${linha('55%')}</div>`;
  }

  if (c.tipo === 'area') {
    const alt = Math.max(2, (c.linhas || 3)) * 5.4;
    return `<div class="campo total"><span class="rot">${esc(c.label)}</span>` +
           `<div class="caixa" style="height:${alt}mm"></div></div>`;
  }

  if (c.tipo === 'select' || c.tipo === 'radio' || c.tipo === 'checks') {
    const forma = c.tipo === 'checks' ? 'quad' : 'circ';
    const ops = (c.opcoes || []).map(o =>
      `<span class="op"><i class="${forma}"></i>${esc(o)}</span>`).join('');
    return `<div class="campo${total}"><span class="rot">${esc(c.label)}</span>` +
           `<div class="ops">${ops}</div></div>`;
  }

  if (c.tipo === 'eva') {
    const nums = Array.from({ length: 11 }, (_, i) =>
      `<span class="eva-n">${i}</span>`).join('');
    return `<div class="campo total"><span class="rot">${esc(c.label)}</span>` +
           `<div class="eva"><span class="eva-lab">sem dor</span>${nums}` +
           `<span class="eva-lab">máxima</span></div></div>`;
  }

  if (c.tipo === 'escala') {
    const itens = (Scores[c.fonte] || []).map(n =>
      `<div class="nivel"><i class="circ"></i><b>${n.valor}</b><span>${esc(n.texto)}</span></div>`).join('');
    return `<div class="campo total"><span class="rot">${esc(c.label)}</span>` +
           `<div class="niveis">${itens}</div></div>`;
  }

  return '';
}

/* ---------- Wexner: matriz 5 x 5 ---------- */
function wexner() {
  const cols = Scores.WEXNER_COLUNAS;
  const cab = cols.map(c =>
    `<th><span class="wx-rot">${esc(c.rotulo)}</span>` +
    (c.ancora ? `<span class="wx-anc">${esc(c.ancora)}</span>` : '') +
    `<span class="wx-pt">${c.pontos}</span></th>`).join('');

  const linhas = Scores.WEXNER_ITENS.map(it =>
    `<tr><th scope="row">${esc(it.label)}</th>` +
    cols.map(() => `<td><i class="circ"></i></td>`).join('') + `</tr>`).join('');

  return `
  <div class="wx-grupo">
  <table class="wexner">
    <thead><tr><th class="wx-canto"></th>${cab}</tr></thead>
    <tbody>${linhas}</tbody>
  </table>
  <div class="wx-total">
    <span>Somatório</span><span class="wx-caixa"></span><span class="wx-max">/ 20</span>
    <em>0 = continência perfeita · 20 = incontinência completa</em>
  </div>
  </div>`;
}

/* ---------- render de uma secao ---------- */
function secao(s, numero) {
  const corpo = s.tipoEspecial === 'wexner'
    ? wexner()
    : `<div class="grade">${(s.campos || []).map(campo).join('')}</div>`;

  return `
  <section class="bloco">
    <div class="bloco-cab">
      ${numero ? `<span class="bloco-num">${esc(numero)}</span>` : ''}
      <h2>${esc(s.titulo)}</h2>
    </div>
    <div class="bloco-corpo">${corpo}</div>
  </section>`;
}

const ASA = "M60,44 C54,28 38,21 29,30 C20,39 30,51 49,53 C31,60 19,78 27,92 C35,106 55,99 60,74 Z";
const EF = Ficha.EXAME_FISICO;

const corpo = [
  secao(Ficha.IDENTIFICACAO, 'ID'),
  ...Ficha.FEMININO.map(s => secao(s, s.numero)),
  `<h1 class="titulo-parte">Exame Físico</h1>`,
  secao(EF.consentimento, 'C'),
  secao(EF.geral, 'EF'),
  secao(EF.inspecao, 'EF'),
  secao(EF.prolapsos, 'EF'),
  secao(EF.sensibilidade, 'EF'),
  secao(EF.reflexos, 'EF'),
  secao(EF.afa, 'EF'),
  secao(EF.diagnostico, 'DX'),
  `<div class="assinaturas">
     <div class="assin">
       <div class="assin-linha"></div>
       <div class="assin-nome">Dra. Vanessa Fernandes</div>
       <div class="assin-reg">Fisioterapeuta Pélvica · ${esc(Ficha.CREFITO)}</div>
     </div>
     <div class="assin">
       <div class="assin-linha"></div>
       <div class="assin-nome">Assinatura da paciente</div>
       <div class="assin-reg">Ciente da avaliação realizada</div>
     </div>
   </div>`
].join('\n');

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Ficha de Avaliação — Disfunções dos Músculos do Assoalho Pélvico</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap">
<style>
:root{
  --terracota:#B86657; --terracota-deep:#9E4F42; --cafe:#3D2E28;
  --areia:#F7F4F0; --rosegold:#D49A8D; --linha:#D8CCC4; --tenue:#8A7268;
}
/* Margens enxutas: o timbre vem do <thead>, nao da margem de pagina. */
@page{ size:A4 portrait; margin:11mm 13mm 10mm 13mm; }

*{ box-sizing:border-box; }
html,body{ margin:0; padding:0; background:#fff; color:var(--cafe);
  font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;
  font-size:8.5pt; line-height:1.36;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* ---------- folha: thead/tfoot repetem em cada pagina ---------- */
table.folha{ width:100%; border-collapse:collapse; }
table.folha > thead th{ padding:0 0 2mm; }
table.folha > tbody > tr > td{ padding:3.5mm 0 0; vertical-align:top; }
table.folha > tfoot td{ padding:2mm 0 0; }

.timbre{ display:flex; align-items:flex-end; justify-content:space-between;
  gap:8mm; height:14mm; border-bottom:0.8pt solid var(--terracota);
  padding-bottom:1.8mm; text-align:left; font-weight:400; }
.marca{ display:flex; align-items:center; gap:2.8mm; }
.lockup{ display:flex; flex-direction:column; line-height:1.16; }
.lockup .nome{ font-family:'Playfair Display',Georgia,serif; font-size:12.5pt;
  font-weight:700; color:var(--terracota); }
.lockup .esp{ font-size:5.7pt; letter-spacing:.34em; text-transform:uppercase; color:var(--cafe); }
.doc-tit{ font-size:6.6pt; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
  color:var(--terracota-deep); text-align:right; max-width:68mm; line-height:1.3; }

.rodape{ border-top:0.5pt solid #E6DCD4; padding-top:1.6mm;
  font-size:5.9pt; line-height:1.4; color:#7A6960; text-align:center; }

/* ---------- blocos ---------- */
.titulo-parte{ font-family:'Playfair Display',Georgia,serif; font-size:15pt;
  color:var(--terracota-deep); margin:4mm 0 2.5mm; padding-bottom:1.4mm;
  border-bottom:1pt solid var(--rosegold); break-after:avoid; break-before:page; }

.bloco{ border:0.6pt solid var(--linha); border-radius:2pt; margin-bottom:2.6mm; }
.bloco-cab{ display:flex; align-items:center; gap:2.2mm; padding:1.5mm 2.6mm;
  background:var(--areia); border-bottom:0.5pt solid var(--linha);
  break-after:avoid; break-inside:avoid; }
.bloco-num{ flex:none; min-width:5.2mm; height:5.2mm; padding:0 1mm; border-radius:99px;
  background:var(--terracota); color:#fff; font-size:5.7pt; font-weight:700;
  display:flex; align-items:center; justify-content:center; }
.bloco-cab h2{ font-family:'Playfair Display',Georgia,serif; font-size:10.2pt;
  font-weight:600; margin:0; color:var(--cafe); }
.bloco-corpo{ padding:2mm 2.6mm 2.4mm; }

/* ---------- grade de campos ---------- */
.grade{ display:grid; grid-template-columns:1fr 1fr; gap:1.6mm 5mm; align-items:start; }
.campo{ break-inside:avoid; }
.campo.total{ grid-column:1 / -1; }
.rot{ display:block; font-size:6.1pt; font-weight:600; letter-spacing:.05em;
  text-transform:uppercase; color:var(--tenue); margin-bottom:0.5mm; }
.faixa{ font-style:normal; text-transform:none; letter-spacing:0; color:#A89890; }

.linha{ display:inline-block; height:4.2mm; border-bottom:0.5pt solid var(--linha); }
.caixa{ border:0.5pt solid var(--linha); border-radius:1pt; }

h4.sub{ grid-column:1 / -1; font-size:7.5pt; font-weight:700; color:var(--terracota-deep);
  margin:1.4mm 0 0; break-after:avoid; }
p.nota{ grid-column:1 / -1; font-size:6.7pt; color:#7A6960; margin:0.7mm 0 0; line-height:1.45; }

/* ---------- opcoes ---------- */
.ops{ display:flex; flex-wrap:wrap; gap:0.7mm 3mm; }
.op{ display:inline-flex; align-items:center; gap:1.2mm; font-size:7.7pt; }
i.circ,i.quad{ display:inline-block; width:2.4mm; height:2.4mm; flex:none;
  border:0.6pt solid var(--tenue); background:#fff; }
i.circ{ border-radius:50%; }
i.quad{ border-radius:0.4pt; }

/* ---------- escalas descritivas (Oxford, ICS) ---------- */
.niveis{ display:flex; flex-direction:column; gap:0.6mm; }
.nivel{ display:flex; align-items:flex-start; gap:1.4mm; font-size:7.5pt;
  line-height:1.34; break-inside:avoid; }
.nivel b{ color:var(--terracota-deep); flex:none; min-width:3mm; }
.nivel i{ margin-top:0.5mm; }

/* ---------- EVA ---------- */
.eva{ display:flex; align-items:center; gap:1.3mm; }
.eva-n{ width:5.2mm; height:5.2mm; border:0.5pt solid var(--linha); border-radius:50%;
  display:inline-flex; align-items:center; justify-content:center;
  font-size:6.7pt; font-weight:600; }
.eva-lab{ font-size:5.9pt; color:#A89890; text-transform:uppercase; letter-spacing:.05em; }

/* ---------- Wexner ---------- */
.wx-grupo{ break-inside:avoid; }
table.wexner{ width:100%; border-collapse:collapse; }
table.wexner th,table.wexner td{ border:0.5pt solid var(--linha); padding:1.1mm 1mm; text-align:center; }
table.wexner thead th{ background:var(--areia); vertical-align:bottom; }
.wx-canto{ background:#fff !important; border:none !important; }
.wx-rot{ display:block; font-size:6.7pt; font-weight:700; }
.wx-anc{ display:block; font-size:5.5pt; color:var(--tenue); margin-top:0.3mm; }
.wx-pt{ display:block; font-size:6.3pt; font-weight:700; color:var(--terracota-deep); margin-top:0.4mm; }
table.wexner tbody th{ text-align:left; font-size:7.7pt; font-weight:500; }
.wx-total{ display:flex; align-items:center; gap:2mm; margin-top:1.8mm; font-size:7.5pt; }
.wx-caixa{ width:12mm; height:5.6mm; border:0.7pt solid var(--terracota); border-radius:1.5pt; }
.wx-max{ color:var(--tenue); }
.wx-total em{ margin-left:auto; font-size:6.3pt; color:var(--tenue); font-style:normal; }

/* ---------- assinaturas ---------- */
.assinaturas{ display:flex; gap:14mm; margin-top:10mm; break-inside:avoid; }
.assin{ flex:1; text-align:center; }
.assin-linha{ border-top:0.6pt solid var(--cafe); margin-bottom:1.4mm; }
.assin-nome{ font-size:8pt; font-weight:600; }
.assin-reg{ font-size:6.6pt; color:#6B564D; margin-top:0.4mm; }
</style></head>
<body>

<table class="folha">
  <thead><tr><th>
    <div class="timbre">
      <div class="marca">
        <svg viewBox="0 0 120 120" width="25" height="25" role="img" aria-label="Marca Vanessa Fernandes">
          <path d="${ASA}" fill="#B86657"/>
          <path d="${ASA}" transform="translate(120,0) scale(-1,1)" fill="none"
                stroke="#B86657" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div class="lockup">
          <span class="nome">Vanessa Fernandes</span>
          <span class="esp">Fisioterapia Pélvica</span>
        </div>
      </div>
      <div class="doc-tit">Ficha de Avaliação<br>Disfunções dos Músculos do Assoalho Pélvico</div>
    </div>
  </th></tr></thead>

  <tfoot><tr><td>
    <div class="rodape">${esc(Ficha.RODAPE_LEGAL)}</div>
  </td></tr></tfoot>

  <tbody><tr><td>
${corpo}
  </td></tr></tbody>
</table>

</body></html>`;

mkdirSync(join(raiz, 'build'), { recursive: true });
writeFileSync(join(raiz, 'build/ficha-avaliacao.html'), html, 'utf8');
console.log('  build/ficha-avaliacao.html gerado ·',
            1 + Ficha.FEMININO.length + 8, 'secoes ·', html.length, 'bytes');
