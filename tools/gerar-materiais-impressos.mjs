/* ----------------------------------------------------------------
   tools/gerar-materiais-impressos.mjs

   Gera os dois impressos de relacionamento, na identidade da Vanessa:
     build/carta-profissionais.html   carta de apresentacao a colegas
                                      de saude (rede de encaminhamento)
     build/cartilhas-pacientes.html   as cartilhas de js/adherence.js,
                                      uma por folha A4, para entregar
                                      na sessao

   Fonte unica: o texto das cartilhas vem de js/adherence.js e os dados
   da profissional de js/ficha.js (CREFITO, CONTATO).

   Diagramacao (revista em 2026-09-20): texto justificado; cada folha e
   um bloco de altura fixa com cabecalho e rodape proprios, o que permite
   ancorar o quadro "Como agendar" no pe de toda cartilha.

   Uso:   node tools/gerar-materiais-impressos.mjs
   PDF:   chrome --headless --no-pdf-header-footer --print-to-pdf=X.pdf build/<arquivo>.html
   ---------------------------------------------------------------- */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const Ficha = require(join(raiz, 'js/ficha.js'));
const A = require(join(raiz, 'js/adherence.js'));

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* width/height explicitos (na proporcao do viewBox, 201 x 141): sem eles
   o html2canvas usa o tamanho padrao de SVG e a marca sai recortada no
   PDF e na imagem gerados pelo navegador. O CSS continua mandando no
   tamanho exibido e impresso. */
const LOGO_SVG = readFileSync(join(raiz, 'assets/logo.svg'), 'utf8')
  .replace(/\s(?:width|height)="[\d.]+"/g, '')
  .replace('<svg ', '<svg width="402" height="282" ');
const LOGO = '<img class="logo" alt="" src="data:image/svg+xml;base64,' +
  Buffer.from(LOGO_SVG, 'utf8').toString('base64') + '">';

/* A folha util e 297 - 2 x 12 mm de margem = 273 mm. Cada .pagina tem
   exatamente essa altura; o que vai ao pe usa margin-top:auto. */
const CSS = `
:root{ --terracota:#B86657; --deep:#9E4F42; --cafe:#3D2E28; --areia:#F7F4F0;
       --rosegold:#D49A8D; --linha:#C9BDB4; --tenue:#7A6960; }
@page{ size:A4 portrait; margin:12mm 17mm; }
*{ box-sizing:border-box; }
html,body{ margin:0; background:#fff; color:var(--cafe);
  font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif; font-size:9.7pt; line-height:1.48;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.pagina{ height:273mm; display:flex; flex-direction:column; break-after:page; overflow:visible; }
.pagina:last-child{ break-after:auto; }

/* cabecalho */
.timbre{ display:flex; align-items:flex-end; justify-content:space-between; gap:8mm;
  border-bottom:0.8pt solid var(--terracota); padding-bottom:2mm; margin-bottom:4.5mm; }
.marca{ display:flex; align-items:center; gap:3mm; }
.marca .logo{ height:12.5mm; width:17.8mm; display:block; }
.lockup{ display:flex; flex-direction:column; line-height:1.15; }
.lockup .nome{ font-family:'Playfair Display',Georgia,serif; font-size:14pt; font-weight:700; color:var(--terracota); }
.lockup .esp{ font-size:6.2pt; letter-spacing:.34em; text-transform:uppercase; }
.doc-tit{ font-size:7pt; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
  color:var(--deep); text-align:right; line-height:1.4; }

/* rodape */
.rodape{ border-top:0.5pt solid #E6DCD4; padding-top:1.8mm; margin-top:4mm;
  font-size:6.8pt; line-height:1.5; color:var(--tenue); text-align:center; }

/* texto */
p, li{ text-align:justify; hyphens:auto; -webkit-hyphens:auto; }
p{ margin:0 0 1.8mm; }
ul{ margin:0 0 1.8mm; padding-left:5mm; }
li{ margin-bottom:0.6mm; }
li::marker{ color:var(--terracota); }
h1{ font-family:'Playfair Display',Georgia,serif; font-size:18pt; font-weight:700;
  color:var(--deep); margin:0 0 1mm; line-height:1.18; }
.sub{ font-size:9.7pt; color:var(--tenue); margin:0 0 2.5mm; text-align:left; }
.acolhe{ font-style:italic; color:var(--cafe); border-left:1.4mm solid var(--rosegold);
  padding:0.3mm 0 0.3mm 3.2mm; margin:0 0 2.6mm; }
h2{ font-size:9.6pt; font-weight:700; letter-spacing:.07em; text-transform:uppercase; color:var(--deep);
  margin:3.2mm 0 1.3mm; padding-bottom:0.8mm; border-bottom:0.7pt solid var(--rosegold); break-after:avoid; }
.bloco{ break-inside:avoid; }
.nota{ background:var(--areia); border-left:1.4mm solid var(--terracota); padding:2mm 3.4mm;
  margin:1.8mm 0; font-size:9.4pt; text-align:justify; break-inside:avoid; }

/* quadro de anotacao da sessao */
.anot{ margin-top:3mm; border:0.6pt solid var(--linha); border-radius:2pt; padding:2.6mm 4mm 1mm; }
.anot b{ font-size:8pt; letter-spacing:.07em; text-transform:uppercase; color:var(--deep); }
.anot .l{ border-bottom:0.5pt solid var(--linha); height:7.5mm; }

/* quadro de agendamento, ancorado no pe da folha */
.agenda{ margin-top:auto; background:var(--terracota); color:#fff; border-radius:3pt;
  padding:2.8mm 5mm; }
.agenda .t{ font-family:'Playfair Display',Georgia,serif; font-size:12pt; font-weight:700; line-height:1.2; margin-bottom:1mm; }
.agenda p{ margin:0 0 0.8mm; font-size:9pt; line-height:1.45; color:#fff; }
.agenda p:last-child{ margin:0; }
.agenda b{ color:#fff; }

/* carta */
.cab-carta{ display:flex; justify-content:space-between; align-items:flex-start; gap:8mm; margin:0 0 2.5mm; }
.cab-carta .local-data{ margin:0 0 0 auto; white-space:nowrap; }
.destino{ font-size:9.4pt; line-height:1.45; max-width:95mm; }
.local-data{ text-align:right; margin:0 0 3.5mm; }
.msg-pessoal{ font-style:italic; }
.carta h2{ margin:2.6mm 0 1.1mm; }
.carta p{ margin-bottom:1.5mm; }
.carta .contato{ padding:2.6mm 5mm; }
.duas{ display:grid; grid-template-columns:1fr 1fr; column-gap:9mm; }
.duas ul{ margin:0; }
.duas li{ text-align:left; }
.formacao{ margin:0 0 1mm; columns:2; column-gap:9mm; }
.formacao li{ break-inside:avoid; }
.formacao li{ text-align:left; margin-bottom:0.8mm; }
.assin{ margin-top:4mm; width:84mm; }
.assin .r{ border-top:0.6pt solid var(--cafe); margin-bottom:1.4mm; }
.assin .n{ font-weight:700; }
.assin .g{ font-size:8.6pt; color:var(--tenue); }
.contato{ margin-top:auto; display:grid; grid-template-columns:1.9fr 1.15fr 1.15fr 1.1fr; gap:4.5mm;
  background:var(--areia); border-radius:3pt; padding:3.4mm 5mm; font-size:8.8pt; }
.contato div{ line-height:1.5; }
.contato b{ color:var(--deep); display:block; font-size:7.6pt; letter-spacing:.07em; text-transform:uppercase; }
`;

/* Barra de personalizacao (so na tela) e previa das folhas como A4.
   Na impressao a barra some e a folha volta a ocupar a area util. */
const CSS_BARRA = `
@media screen{
  body{ background:#E9E4DF; }
  .folhas{ padding:16px 12px 40px; overflow-x:auto; }
  .pagina{ width:210mm; height:297mm; padding:12mm 17mm; margin:0 auto 10mm; background:#fff;
    box-shadow:0 2px 14px rgba(61,46,40,.16); }
}
@media print{ #barra{ display:none !important; } }
.pagina[hidden]{ display:none !important; }
#barra{ position:sticky; top:0; z-index:10; background:#fff; border-bottom:1px solid #E6DCD4;
  box-shadow:0 2px 10px rgba(61,46,40,.08); font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif; }
#barra .in{ max-width:1100px; margin:0 auto; padding:10px 14px; display:flex; flex-wrap:wrap; gap:10px 14px; align-items:center; }
#barra .grupo{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
#barra label{ font-size:13px; color:var(--cafe); display:flex; gap:6px; align-items:center; }
#barra input[type=text], #barra select{ font:inherit; font-size:14px; padding:7px 10px; border:1px solid #C9BDB4;
  border-radius:8px; min-width:0; }
#barra input[type=text]{ width:240px; max-width:62vw; }
#barra button{ font:inherit; font-size:13px; font-weight:600; padding:8px 12px; border-radius:8px; cursor:pointer;
  border:1px solid var(--terracota); background:#fff; color:var(--deep); }
#barra button.pri{ background:var(--terracota); color:#fff; }
#barra button:disabled{ opacity:.5; cursor:wait; }
#barra .escolha{ max-width:1100px; margin:0 auto; padding:0 14px 10px; display:flex; flex-wrap:wrap; gap:6px 14px; font-size:13px; }
#barra .escolha label{ font-size:12.5px; }
#b-aviso{ font-size:12.5px; color:var(--tenue); }
#b-aviso.erro{ color:#A33; }
`;

const barra = (tipo, extra, escolha) => `<div id="barra" data-tipo="${tipo}">
  <div class="in">
    <a class="link-inicio" href="../index.html">← Início</a>
    <div class="grupo">${extra}</div>
    <div class="grupo">
      <button id="b-imprimir" class="pri" type="button">Imprimir / PDF</button>
      <button id="b-pdf" type="button">Enviar PDF</button>
      <button id="b-img" type="button">Enviar como imagem</button>
    </div>
    <span id="b-aviso" role="status"></span>
  </div>
  ${escolha || ''}
</div>`;

const SCRIPT = readFileSync(join(raiz, 'tools/impressos-cliente.js'), 'utf8');

const cabecalho = (tituloDoc) => `<div class="timbre">
  <div class="marca">${LOGO}<div class="lockup"><span class="nome">Vanessa Fernandes</span><span class="esp">Fisioterapia Pélvica</span></div></div>
  <div class="doc-tit">${tituloDoc}</div>
</div>`;
const rodape = `<div class="rodape">Vanessa Fernandes · Fisioterapeuta · ${esc(Ficha.CREFITO)}<br>${esc(Ficha.CONTATO)}</div>`;

const documento = (titulo, paginas, barraHtml) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap">
<link rel="stylesheet" href="../css/navegacao.css">
<style>${CSS}${CSS_BARRA}</style></head><body>${barraHtml || ''}<div class="folhas">${paginas}</div>
<script>${SCRIPT}</script></body></html>`;

/* ---------- 1. Carta de apresentacao a profissionais de saude ----------
   Registro formal: o leitor e colega de saude. Sem promessa de resultado
   (Artigo 15, III do Codigo de Etica) e sem contrapartida pelo
   encaminhamento (Artigo 40, III). Formacao: nada de "especialista" sem
   titulo reconhecido pelo COFFITO (Artigo 30, II); na assinatura so o
   titulo stricto sensu, que o Artigo 30, III permite. A contrarreferencia e mencionada em
   uma frase: o detalhe vai no proprio laudo, nao na apresentacao. */
const carta = documento('Carta de apresentação — Vanessa Fernandes', `
<section class="pagina carta">
  ${cabecalho('Carta de apresentação<br>a profissionais de saúde')}

  <div class="cab-carta">
    <div class="destino" data-destino hidden><span data-ao>À(o)</span> <span data-nome-alvo></span><br><span data-servico-alvo hidden></span></div>
    <p class="local-data">Conceição do Mato Dentro, <span data-data-vazio>______ de ____________________ de ________</span><span data-data-cheio hidden data-data-extenso></span>.</p>
  </div>
  <p><span data-nome-vazio>Prezado(a) colega,</span><span data-nome-cheio hidden><span data-prezado>Prezado(a)</span> <span data-nome-alvo></span>,</span></p>

  <p>Meu nome é Vanessa Fernandes, sou fisioterapeuta (${esc(Ficha.CREFITO)}) com atuação em
  <b>fisioterapia pélvica</b>, e passei a atender em Conceição do Mato Dentro, na Clínica Veracis.
  Escrevo para me apresentar e me colocar à disposição para receber e acompanhar pacientes
  que possam se beneficiar desse cuidado.</p>

  <p>São queixas que muitas pacientes demoram a contar, por constrangimento ou por acreditarem
  que fazem parte da idade, da gestação ou do pós-parto. Meu compromisso é oferecer escuta
  atenta, avaliação criteriosa e um plano de cuidado construído em conjunto, respeitando o
  tempo e a intimidade de cada uma.</p>

  <h2>Formação</h2>
  <ul class="formacao">
    <li><b>Mestrado em Reabilitação e Desempenho Funcional</b> — Universidade Federal dos Vales do Jequitinhonha e Mucuri (UFVJM), 2019–2021</li>
    <li><b>Residência em Saúde Coletiva</b> — 2016–2018</li>
    <li><b>Graduação em Fisioterapia</b> — UFVJM, 2011–2016</li>
    <li><b>Formação complementar em fisioterapia pélvica</b>, com atuação clínica dedicada à área</li>
  </ul>

  <h2>Condições que atendo</h2>
  <div class="duas">
    <ul>
      <li>Incontinência urinária de esforço, de urgência e mista</li>
      <li>Urgência, aumento de frequência e noctúria</li>
      <li>Constipação, disfunção evacuatória e incontinência fecal</li>
      <li>Prolapso de órgãos pélvicos, em conduta conservadora</li>
    </ul>
    <ul>
      <li>Dor pélvica, dispareunia e vaginismo</li>
      <li>Gestação: preparo do assoalho pélvico e dor lombopélvica</li>
      <li>Pós-parto: recuperação perineal e abdominal</li>
      <li>Incontinência após prostatectomia</li>
    </ul>
  </div>

  <h2>Como encaminhar</h2>
  <p>Basta um pedido com o diagnóstico ou a hipótese diagnóstica e os exames que houver.
  A paciente agenda com hora marcada pelo telefone ou WhatsApp da clínica, <b>(31) 3868-1120</b>.
  Após a avaliação, envio ao(à) colega um breve relatório com as condutas propostas, para
  acompanharmos a paciente de forma integrada.</p>

  <p>Coloco-me à disposição para discutir casos e alinhar condutas — o contato comigo
  pode ser feito diretamente pelo número <b>(31) 98323-9192</b>.</p>

  <p class="msg-pessoal" data-msg-alvo hidden></p>
  <p style="margin-top:2mm">Com estima e à disposição,</p>
  <div class="assin"><div class="r"></div>
    <div class="n">Vanessa Fernandes</div>
    <div class="g">Fisioterapeuta · ${esc(Ficha.CREFITO)}</div>
    <div class="g">Mestre em Reabilitação e Desempenho Funcional (UFVJM)</div>
  </div>

  <div class="contato">
    <div><b>Onde atendo</b>Clínica Veracis<br>Rodovia MG-010, 598 · Bela Vista Mall<br>Conceição do Mato Dentro/MG</div>
    <div><b>Agendamento</b>(31) 3868-1120<br>telefone e WhatsApp<br>da clínica</div>
    <div><b>Contato direto</b>Vanessa Fernandes<br>(31) 98323-9192</div>
    <div><b>Instagram</b>@vanessa.fernands<br>@clinicaveracis</div>
  </div>
  <div class="rodape">Vanessa Fernandes · Fisioterapeuta · ${esc(Ficha.CREFITO)}</div>
</section>`, barra('carta', `
  <label>Para <select id="b-trat" aria-label="Tratamento">
    <option value="Dr(a).">Dr(a).</option><option value="Dra.">Dra.</option><option value="Dr.">Dr.</option>
    <option value="Enf.">Enf.</option><option value="">(sem título)</option></select></label>
  <input id="b-nome" type="text" placeholder="Nome do(a) colega (opcional)" autocomplete="off">
  <input id="b-servico" type="text" placeholder="Especialidade ou serviço (opcional)" autocomplete="off">
  <label><input id="b-data" type="checkbox" checked> Data de hoje</label>
  <input id="b-msg" type="text" maxlength="140" placeholder="Mensagem pessoal, até 140 letras (opcional)" autocomplete="off" style="width:420px">`));

/* ---------- 2. Cartilhas para a paciente, uma por folha ----------
   Toda folha abre com uma frase de acolhimento e fecha com o quadro
   de agendamento. Os lembretes por WhatsApp so seguem com autorizacao
   (ver mensagem 'aceite' em js/adherence.js). */
const ACOLHE = 'Leia com calma, no seu tempo. Se alguma coisa não ficar clara, me chama — ' +
  'você não precisa esperar a próxima sessão para tirar dúvida.';

const AGENDA = `<div class="agenda">
  <div class="t">Como agendar</div>
  <p>Atendo <b>com hora marcada</b>, na Clínica Veracis — Rodovia MG-010, 598, Bela Vista Mall, Conceição do Mato Dentro.
  Para marcar, remarcar ou tirar uma dúvida, chame no <b>WhatsApp ou ligue: (31) 3868-1120</b>.</p>
  <p>Precisou faltar? Me avise assim que puder, sem problema nenhum — a gente encontra outro horário.
  Na véspera, se você autorizou, chega um lembrete pelo WhatsApp. Instagram: <b>@vanessa.fernands</b> e <b>@clinicaveracis</b>.</p>
</div>`;

const paginasCartilhas = A.CARTILHAS.map((c) => {
  const blocos = c.blocos.map(b => `<div class="bloco">
    <h2>${esc(b.h)}</h2>
    ${b.p ? `<p>${esc(b.p)}</p>` : ''}
    ${b.l ? `<ul>${b.l.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${b.nota ? `<div class="nota">${esc(b.nota)}</div>` : ''}
  </div>`).join('');
  return `<section class="pagina" id="c-${c.id}">
    ${cabecalho('<span data-nome-vazio>Orientações para você<br>levar para casa</span>' +
      '<span data-nome-cheio hidden>Orientações para<br><span data-nome-alvo></span></span>')}
    <h1>${esc(c.titulo)}</h1>
    <p class="sub">${esc(c.resumo)}</p>
    <p class="acolhe">${esc(ACOLHE)}</p>
    ${blocos}
    <div class="anot"><b>O que combinamos na sessão de ____/____</b>
      <div class="l"></div><div class="l"></div></div>
    <div style="height:3mm"></div>
    ${AGENDA}
    <div class="rodape">Vanessa Fernandes · Fisioterapeuta · ${esc(Ficha.CREFITO)}</div>
  </section>`;
}).join('');
const escolha = `<div class="escolha"><strong style="font-size:12.5px">Folhas:</strong>
  ${A.CARTILHAS.map(c => `<label><input type="checkbox" data-escolhe="c-${c.id}" checked> ${esc(c.titulo)}</label>`).join('')}
  <button id="b-todas" type="button" style="padding:4px 10px;font-size:12px">Marcar / desmarcar todas</button></div>`;
const cartilhas = documento('Cartilhas — Vanessa Fernandes', paginasCartilhas, barra('cartilhas',
  `<label for="b-nome">Paciente</label>
   <input id="b-nome" type="text" placeholder="Nome da paciente (opcional)" autocomplete="off">`, escolha));

mkdirSync(join(raiz, 'build'), { recursive: true });
writeFileSync(join(raiz, 'build/carta-profissionais.html'), carta, 'utf8');
writeFileSync(join(raiz, 'build/cartilhas-pacientes.html'), cartilhas, 'utf8');
console.log('  build/carta-profissionais.html gerado');
console.log('  build/cartilhas-pacientes.html gerado ·', A.CARTILHAS.length, 'cartilhas');
