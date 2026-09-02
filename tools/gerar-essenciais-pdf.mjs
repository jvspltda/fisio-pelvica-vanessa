/* ----------------------------------------------------------------
   tools/gerar-essenciais-pdf.mjs

   Folha de trabalho para a Vanessa revisar Ficha.ESSENCIAIS.

   Contexto: a lista de essenciais hoje e uma PROPOSTA minha, nao dela.
   Ela decide quais campos abrem na primeira tela do atendimento. Os
   demais continuam na ficha e sempre saem no impresso -- so ficam
   recolhidos, para a consulta comecar com conversa e nao com um
   formulario de 183 perguntas.

   Uso:   node tools/gerar-essenciais-pdf.mjs
   Saida: build/essenciais-revisao.html
   ---------------------------------------------------------------- */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const Ficha = require(join(raiz, 'js/ficha.js'));

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const PREENCHIVEIS = ['texto','area','numero','data','radio','checks','select','eva','escala','calculado'];

let totalCampos = 0, totalEssenciais = 0;

/* Uma seção vira um cartão com uma linha por campo preenchível. */
function secao(s, numero) {
  if (s.tipoEspecial === 'wexner') return '';           // instrumento inteiro, não campo a campo
  const campos = (s.campos || []).filter(c => PREENCHIVEIS.indexOf(c.tipo) >= 0);
  if (!campos.length) return '';

  const linhas = campos.map(c => {
    const ess = Ficha.ESSENCIAIS.indexOf(c.id) >= 0;
    totalCampos++; if (ess) totalEssenciais++;
    return `<tr class="${ess ? 'e' : ''}">
      <td class="marca">${ess ? '<i class="cheio"></i>' : '<i class="vazio"></i>'}</td>
      <td class="lbl">${esc(c.label)}</td>
      <td class="tick"><span class="quad"></span></td>
    </tr>`;
  }).join('');

  const n = campos.length;
  const e = campos.filter(c => Ficha.ESSENCIAIS.indexOf(c.id) >= 0).length;

  return `<section class="bloco">
    <div class="bloco-cab">
      ${numero ? `<span class="bloco-num">${esc(numero)}</span>` : ''}
      <h2>${esc(s.titulo)}</h2>
      <span class="cont">${e} de ${n} abertos</span>
    </div>
    <table class="lista">${linhas}</table>
  </section>`;
}

const EF = Ficha.EXAME_FISICO;
const corpo = [
  secao(Ficha.IDENTIFICACAO, 'ID'),
  ...Ficha.FEMININO.map(s => secao(s, s.numero)),
  secao(EF.consentimento, 'C'),
  secao(EF.geral, 'EF'),
  secao(EF.inspecao, 'EF'),
  secao(EF.prolapsos, 'EF'),
  secao(EF.sensibilidade, 'EF'),
  secao(EF.reflexos, 'EF'),
  secao(EF.afa, 'EF'),
  secao(EF.diagnostico, 'DX')
].filter(Boolean).join('\n');

/* Marca em vetor, pelo mesmo motivo do gerador da ficha. */
const LOGO = readFileSync(join(raiz, 'assets/logo.svg'), 'utf8')
  /* Tira width/height intrinsecos: o SVG traz 201x141, que renderiza a
     ~53mm e estoura o timbre. O viewBox e mantido, entao o CSS passa a
     controlar o tamanho sozinho. */
  .replace(/\s(?:width|height)="[\d.]+"/g, '')
  .replace('<svg ', '<svg class="logo" ');

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Revisão dos Campos Essenciais</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap">
<style>
:root{
  --terracota:#B86657; --terracota-deep:#9E4F42; --cafe:#3D2E28;
  --areia:#F7F4F0; --rosegold:#D49A8D; --linha:#D8CCC4; --tenue:#8A7268;
}
@page{ size:A4 portrait; margin:11mm 13mm 10mm 13mm; }
*{ box-sizing:border-box; }
html,body{ margin:0; padding:0; background:#fff; color:var(--cafe);
  font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;
  font-size:8.4pt; line-height:1.35;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }

table.folha{ width:100%; border-collapse:collapse; }
table.folha > thead th{ padding:0 0 2mm; }
table.folha > tbody > tr > td{ padding:3.5mm 0 0; vertical-align:top; }
table.folha > tfoot td{ padding:2mm 0 0; }

.timbre{ display:flex; align-items:flex-end; justify-content:space-between;
  gap:8mm; height:14mm; border-bottom:0.8pt solid var(--terracota);
  padding-bottom:1.8mm; text-align:left; font-weight:400; }
.marca-t{ display:flex; align-items:center; gap:2.6mm; }
/* Largura explicita, nao auto: dentro de <th> o layout de tabela e o
   width:auto do SVG se realimentam e a marca cresce so na impressao
   (medido: 11mm na tela, 19mm no PDF). Com as duas dimensoes fixas
   nao ha ambiguidade. */
.logo{ height:11mm; width:15.68mm; display:block; }
.lockup{ display:flex; flex-direction:column; line-height:1.16; }
.lockup .nome{ font-family:'Playfair Display',Georgia,serif; font-size:12.5pt;
  font-weight:700; color:var(--terracota); }
.lockup .esp{ font-size:5.7pt; letter-spacing:.34em; text-transform:uppercase; color:var(--cafe); }
.doc-tit{ font-size:6.6pt; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
  color:var(--terracota-deep); text-align:right; max-width:68mm; line-height:1.3; }
.rodape{ border-top:0.5pt solid #E6DCD4; padding-top:1.6mm;
  font-size:5.9pt; line-height:1.4; color:#7A6960; text-align:center; }

/* ---------- instruções ---------- */
.abertura{ border:0.6pt solid var(--rosegold); border-radius:2pt; background:var(--areia);
  padding:3mm 3.4mm; margin-bottom:3.5mm; break-inside:avoid; }
.abertura h1{ font-family:'Playfair Display',Georgia,serif; font-size:13pt;
  margin:0 0 1.6mm; color:var(--terracota-deep); }
.abertura p{ margin:0 0 1.4mm; font-size:8pt; line-height:1.5; }
.abertura p:last-child{ margin-bottom:0; }
.legenda{ display:flex; gap:6mm; margin-top:2.4mm; padding-top:2mm;
  border-top:0.5pt solid var(--rosegold); font-size:7.4pt; align-items:center; flex-wrap:wrap; }
.legenda span{ display:inline-flex; align-items:center; gap:1.4mm; }

/* ---------- seções ---------- */
.colunas{ column-count:2; column-gap:6mm; }
.bloco{ border:0.6pt solid var(--linha); border-radius:2pt; margin-bottom:2.6mm;
  break-inside:avoid; }
.bloco-cab{ display:flex; align-items:center; gap:2mm; padding:1.4mm 2.4mm;
  background:var(--areia); border-bottom:0.5pt solid var(--linha); }
.bloco-num{ flex:none; min-width:5mm; height:5mm; padding:0 0.9mm; border-radius:99px;
  background:var(--terracota); color:#fff; font-size:5.6pt; font-weight:700;
  display:flex; align-items:center; justify-content:center; }
.bloco-cab h2{ font-family:'Playfair Display',Georgia,serif; font-size:9.4pt;
  font-weight:600; margin:0; color:var(--cafe); }
.cont{ margin-left:auto; font-size:6.2pt; color:var(--tenue); white-space:nowrap; }

table.lista{ width:100%; border-collapse:collapse; }
table.lista td{ padding:0.9mm 1mm; border-bottom:0.4pt solid #EFE7E1; vertical-align:middle; }
table.lista tr:last-child td{ border-bottom:none; }
table.lista tr.e{ background:#FBF6F4; }
td.marca{ width:5mm; text-align:center; }
td.lbl{ font-size:7.3pt; line-height:1.3; }
tr.e td.lbl{ font-weight:600; }
td.tick{ width:6mm; text-align:center; }

i.cheio,i.vazio{ display:inline-block; width:2.3mm; height:2.3mm; border-radius:50%; }
i.cheio{ background:var(--terracota); }
i.vazio{ border:0.6pt solid #C9BDB4; background:#fff; }
.quad{ display:inline-block; width:3mm; height:3mm; border:0.6pt solid var(--tenue);
  border-radius:0.4pt; background:#fff; }

.fecho{ margin-top:4mm; border-top:0.8pt solid var(--terracota); padding-top:2.5mm;
  break-inside:avoid; }
.fecho h3{ font-family:'Playfair Display',Georgia,serif; font-size:10pt;
  margin:0 0 1.5mm; color:var(--terracota-deep); }
.fecho p{ margin:0 0 1.5mm; font-size:7.6pt; line-height:1.5; }
.assin-linha{ border-top:0.6pt solid var(--cafe); margin:8mm 0 1.2mm; width:70mm; }
.assin-nome{ font-size:7.6pt; font-weight:600; }
</style></head>
<body>
<table class="folha">
  <thead><tr><th>
    <div class="timbre">
      <div class="marca-t">
        ${LOGO}
        <div class="lockup">
          <span class="nome">Vanessa Fernandes</span>
          <span class="esp">Fisioterapia Pélvica</span>
        </div>
      </div>
      <div class="doc-tit">Revisão dos Campos Essenciais<br>Suíte de Avaliação</div>
    </div>
  </th></tr></thead>
  <tfoot><tr><td>
    <div class="rodape">Documento de trabalho interno · não integra o prontuário da paciente.</div>
  </td></tr></tfoot>
  <tbody><tr><td>

  <div class="abertura">
    <h1>Quais perguntas abrem na tela?</h1>
    <p><strong>O problema:</strong> a ficha completa tem ${totalCampos} campos preenchíveis. Abrir todos de uma vez
    transforma a primeira consulta em interrogatório — a paciente responde a um formulário em vez de conversar.</p>
    <p><strong>Como está resolvido:</strong> a suíte abre no modo <em>Essencial</em>, com ${totalEssenciais} campos visíveis.
    Os demais ficam recolhidos por seção e abrem com um clique, quando o caso pedir.</p>
    <p><strong>Importante:</strong> campo recolhido <u>não é campo perdido</u>. Tudo continua na ficha e
    <u>tudo sai no impresso</u>. O recolhimento muda apenas o que aparece na tela durante o atendimento.</p>
    <p><strong>O que preciso de você:</strong> esta lista de essenciais é a minha proposta clínica, não a sua.
    Percorra as seções e marque no quadrado <span class="quad"></span> todo campo que deve <strong>mudar de estado</strong> —
    seja um que precisa abrir, seja um que pode recolher. Só os marcados serão alterados.</p>
    <div class="legenda">
      <span><i class="cheio"></i> abre na tela hoje (${totalEssenciais})</span>
      <span><i class="vazio"></i> recolhido hoje (${totalCampos - totalEssenciais})</span>
      <span><span class="quad"></span> marque para inverter</span>
    </div>
  </div>

  <div class="colunas">
${corpo}
  </div>

  <div class="fecho">
    <h3>Duas perguntas que valem mais que a lista</h3>
    <p><strong>1.</strong> Existe alguma pergunta aqui que você <em>nunca</em> faz na primeira consulta,
    porque prefere deixar para a segunda, quando já há vínculo? Marque-a — sobretudo nas seções de
    função sexual e dor.</p>
    <p><strong>2.</strong> Existe algo que você sempre pergunta e que <em>não está</em> nesta ficha?
    Escreva abaixo; eu incluo.</p>
    <div class="assin-linha"></div>
    <div class="assin-linha"></div>
    <div class="assin-linha"></div>
    <div class="assin-linha" style="margin-top:6mm"></div>
    <div class="assin-nome">Dra. Vanessa Fernandes · data ____ / ____ / ______</div>
  </div>

  </td></tr></tbody>
</table>
</body></html>`;

mkdirSync(join(raiz, 'build'), { recursive: true });
writeFileSync(join(raiz, 'build/essenciais-revisao.html'), html, 'utf8');
console.log(`  build/essenciais-revisao.html gerado`);
console.log(`  campos preenchiveis: ${totalCampos} · essenciais hoje: ${totalEssenciais}`);
