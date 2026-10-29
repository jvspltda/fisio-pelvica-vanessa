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

/* Código QR do WhatsApp da clínica (assets/qr-whatsapp.svg, gerado uma
   vez com segno e conferido por leitura). Abre a conversa com "Olá! Quero
   agendar um horário." — nada sobre a queixa da paciente. O destino fica
   no <title> do SVG e o teste confere que é o número de Ficha.CONTATO. */
const QR_SVG = readFileSync(join(raiz, 'assets/qr-whatsapp.svg'), 'utf8');
const QR = '<img class="qr" alt="Código QR do WhatsApp da clínica" src="data:image/svg+xml;base64,' +
  Buffer.from(QR_SVG, 'utf8').toString('base64') + '">';

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
.anot-linha{ display:flex; gap:4mm; align-items:stretch; margin-top:3mm; }
.anot-linha .anot{ flex:1; margin-top:0; }
.qr-cartao{ flex:none; width:22mm; border:0.6pt solid var(--linha); border-radius:2pt; padding:1.4mm 1.4mm 1mm;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.6mm;
  font-size:6.2pt; line-height:1.2; font-weight:700; color:var(--deep); text-align:center; }
.qr-cartao .qr{ display:block; width:15mm; height:15mm; }

/* quadro de agendamento, ancorado no pe da folha */
.agenda{ margin-top:auto; background:var(--terracota); color:#fff; border-radius:3pt;
  padding:2.8mm 5mm; }
.agenda .t{ font-family:'Playfair Display',Georgia,serif; font-size:12pt; font-weight:700; line-height:1.2; margin-bottom:1mm; }
.agenda p{ margin:0 0 0.8mm; font-size:9pt; line-height:1.45; color:#fff; }
.agenda p:last-child{ margin:0; }
.agenda b{ color:#fff; }
.agenda .qr-caixa{ float:right; width:17mm; margin:0.4mm 0 0.6mm 4mm; text-align:center; font-size:6pt; line-height:1.2; color:#fff; }
.agenda .qr{ display:block; width:17mm; height:17mm; border-radius:1.2pt; margin:0 0 0.6mm; }

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
/* celular: presa no topo, a barra cobria até metade da tela (cartilhas,
   com a lista de folhas). Solta, com os botões numa linha que desliza. */
@media screen and (max-width:700px){
  #barra{ position:static; }
  #barra .in{ gap:8px 10px; padding:8px 12px; }
  #barra .acoes-barra{ flex-wrap:nowrap; overflow-x:auto; max-width:100%; padding-bottom:2px; }
  #barra .acoes-barra button{ flex:none; white-space:nowrap; }
  #barra input[type=text]{ width:100%; max-width:none; }
  #barra input[type=checkbox]{ width:20px; height:20px; }
  #barra .escolha label{ min-height:32px; }
}
#b-aviso.erro{ color:#A33; }
`;

const barra = (tipo, extra, escolha) => `<div id="barra" data-tipo="${tipo}">
  <div class="in">
    <a class="link-inicio" href="../index.html">← Início</a>
    <div class="grupo">${extra}</div>
    <div class="grupo acoes-barra">
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
/* Folha de exercícios: o QR flutua no quadro (a paginação por medida
   absorve a altura extra). Nas cartilhas ele fica ao lado do quadro de
   anotação, que tem altura de sobra — o quadro de agendamento continua
   na mesma altura em todas as folhas. */
const AGENDA_QR = AGENDA.replace('<div class="agenda">', '<div class="agenda"><div class="qr-caixa">' + QR + 'WhatsApp</div>');

const ANOTACAO = `<div class="anot-linha"><div class="anot"><b>O que combinamos na sessão de ____/____</b>
      <div class="l"></div><div class="l"></div></div>
      <div class="qr-cartao">${QR}<span>Agende pelo<br>WhatsApp</span></div></div>`;

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
    ${ANOTACAO}
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

/* ---------- 3. Plano para casa: orientacoes e exercicios juntos ----------
   Orientacoes: os blocos das cartilhas (js/adherence.js). Exercicios: a
   biblioteca de js/exercicios.js, ilustracoes em assets/exercicios/.
   Regras do plano em js/plano.js; a folha e montada e paginada no
   navegador (tools/plano-cliente.js). O nome da paciente segue a regra
   do impressos-cliente: nunca salvo. */
const CSS_EXERCICIOS = `
.corpo{ flex:1; min-height:0; overflow:hidden; display:flex; flex-direction:column; }
.corpo > .agenda{ margin-top:auto; }
.agenda.curta{ padding:1.8mm 4mm; font-size:8.6pt; line-height:1.4; }
.abertura h1{ margin-bottom:0.6mm; }
.abertura .sub{ margin-bottom:2mm; }
.quando{ font-weight:600; margin:0 0 1.6mm; text-align:left; }
.recado{ font-style:italic; border-left:1.4mm solid var(--rosegold); padding:0.3mm 0 0.3mm 3.2mm; margin:0 0 2mm; text-align:left; }
.sempre{ background:var(--areia); border-radius:3pt; padding:2.4mm 4mm 1.2mm; margin:0 0 3mm; }
.sempre b{ font-size:8pt; letter-spacing:.07em; text-transform:uppercase; color:var(--deep); }
.sempre ul{ margin:1mm 0 0; }
.sempre li{ text-align:left; margin-bottom:0.4mm; }
.ex{ display:grid; column-gap:5mm; align-items:start; padding:2.6mm 0; border-top:0.6pt solid #E6DCD4; break-inside:avoid; }
.ex-deitada{ grid-template-columns:74mm 1fr; }
.ex-em-pe{ grid-template-columns:44mm 1fr; }
.ex-livre{ grid-template-columns:1fr; }
.ex img{ display:block; width:100%; border-radius:2pt; }
.ex-deitada img{ height:49.3mm; object-fit:cover; }
.ex-em-pe img{ height:66mm; object-fit:cover; }
.ex h2{ display:flex; align-items:center; gap:2.2mm; margin:0 0 1.2mm; border:0; padding:0; text-transform:none;
  letter-spacing:0; font-family:'Playfair Display',Georgia,serif; font-size:13pt; color:var(--deep); }
.ex h2 .n{ flex:none; width:6.4mm; height:6.4mm; border-radius:50%; background:var(--terracota); color:#fff;
  font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif; font-size:9pt; display:inline-flex; align-items:center; justify-content:center; }
.ex .param{ display:inline-block; background:#F3E6E1; color:var(--deep); font-weight:700; font-size:9.2pt;
  border-radius:2pt; padding:0.8mm 2.4mm; margin:0 0 1.6mm; text-align:left; }
.ex .desc{ margin:0; }
/* duas figuras em pe seguidas dividem a linha (tools/plano-cliente.js) */
.par{ display:grid; grid-template-columns:1fr 1fr; column-gap:5mm; border-top:0.6pt solid #E6DCD4; break-inside:avoid; }
.par .ex{ border-top:0; grid-template-columns:36mm 1fr; column-gap:3.5mm; }
.par .ex-em-pe img{ height:54mm; }
.par .ex h2{ font-size:12pt; align-items:flex-start; }
.par .ex .desc{ text-align:left; hyphens:auto; }
/* a linha do "Folha 1 de 2" fica sempre reservada: se so aparecesse depois
   da paginacao, o rodape cresceria e cortaria o fim da folha */
.rodape [data-folha]{ display:block; min-height:1.5em; }
.corpo > .bloco{ padding-bottom:0.6mm; }
.ex-inicio{ break-inside:avoid; }
.ex-inicio h2{ margin-top:3.2mm; }
.corpo > .anot-linha{ margin-bottom:3mm; }
`;
const CSS_EDITOR = `
@media print{ #editor{ display:none !important; } }
@media screen{
  .montagem{ display:block; }
  @media (min-width:1240px){
    .montagem{ display:grid; grid-template-columns:420px 1fr; align-items:start; }
    #editor{ position:sticky; top:62px; max-height:calc(100vh - 62px); overflow:auto; }
  }
}
#editor{ background:#fff; border-right:1px solid #E6DCD4; padding:14px 16px 24px; font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif; font-size:14px; }
#editor h2{ font-family:'Playfair Display',Georgia,serif; font-size:20px; color:var(--deep); margin:0 0 4px; border:0; text-transform:none; letter-spacing:0; }
#editor h3{ font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--deep); margin:18px 0 8px; }
#editor .apoio{ color:var(--tenue); font-size:13px; margin:0; text-align:left; }
.biblioteca{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
#e-biblioteca .grupo{ font-size:12px; font-weight:700; color:var(--tenue); margin:12px 0 6px; text-align:left; }
#e-biblioteca .grupo:first-child{ margin-top:0; }
.miniatura{ display:flex; flex-direction:column; gap:4px; align-items:stretch; padding:6px; border:1px solid #D9CCC3; border-radius:10px;
  background:#fff; cursor:pointer; font:inherit; font-size:12px; font-weight:600; color:var(--deep); text-align:left; line-height:1.25; }
.miniatura:hover, .miniatura:focus-visible{ border-color:var(--terracota); outline:none; }
.miniatura img{ width:100%; aspect-ratio:3/2; object-fit:contain; background:#F1E3D3; border-radius:6px; }
.miniatura.livre .mais{ aspect-ratio:3/2; display:flex; align-items:center; justify-content:center; font-size:30px; background:var(--areia); border-radius:6px; }
.item{ border:1px solid #E6DCD4; border-radius:10px; padding:10px; margin-bottom:10px; background:#FFFCFA; }
.item-cab{ display:flex; align-items:center; gap:8px; }
.item-cab .num{ flex:none; width:24px; height:24px; border-radius:50%; background:var(--terracota); color:#fff; font-weight:700; font-size:13px;
  display:inline-flex; align-items:center; justify-content:center; }
.item-cab img{ width:44px; height:30px; object-fit:contain; background:#F1E3D3; border-radius:4px; flex:none; }
.item-cab input{ flex:1; min-width:0; font:inherit; font-weight:600; padding:6px 8px; border:1px solid #C9BDB4; border-radius:8px; }
.acoes{ display:flex; gap:4px; flex:none; }
.acoes button{ width:30px; height:30px; border:1px solid #D9CCC3; border-radius:8px; background:#fff; cursor:pointer; font-size:14px; color:var(--deep); }
.acoes button:disabled{ opacity:.35; cursor:default; }
.acoes .tirar{ color:#A33; }
.nums{ display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin:8px 0; }
.campo{ display:flex; flex-direction:column; gap:3px; font-size:11.5px; color:var(--tenue); }
.campo input, .campo textarea, #editor select, #editor input[type=text]{ font:inherit; font-size:14px; color:var(--cafe); padding:6px 8px; border:1px solid #C9BDB4; border-radius:8px; width:100%; }
.campo textarea{ resize:vertical; line-height:1.45; }
.item-rod{ display:flex; justify-content:space-between; align-items:center; margin-top:4px; }
.contador{ font-size:11.5px; color:var(--tenue); }
#editor button.discreto{ border:0; background:none; color:var(--deep); text-decoration:underline; cursor:pointer; font:inherit; font-size:12px; padding:6px 2px; min-height:32px; }
#editor .linha{ display:flex; gap:6px; align-items:center; margin-bottom:6px; }
#editor .linha button, #e-limpar{ flex:none; font:inherit; font-size:13px; font-weight:600; padding:7px 10px; border-radius:8px; cursor:pointer;
  border:1px solid var(--terracota); background:#fff; color:var(--deep); }
#editor .vazio{ color:var(--tenue); font-style:italic; }
#e-folhas{ font-weight:700; color:var(--deep); margin:14px 0 4px; }
#e-aviso{ font-size:13px; color:var(--tenue); min-height:1.2em; margin:0; }
#e-alertas{ margin:6px 0 0; padding:8px 10px 8px 26px; background:#FFF4E5; color:#8A4A12; border-radius:8px; font-size:13px; }
#e-alertas li{ margin-bottom:3px; text-align:left; }
#editor .marcar input:disabled{ opacity:.7; }
#e-demais{ font-size:13px; color:#8A4A12; background:#FFF4E5; border-radius:8px; padding:8px 10px; margin:6px 0 0; }
#editor .ordem{ font-size:12.5px; color:var(--cafe); background:var(--areia); border-radius:8px; padding:8px 10px; margin:8px 0 0; text-align:left; }
#e-orientacoes .nova-orientacao{ width:100%; text-align:left; font:inherit; font-size:13px; font-weight:600; padding:8px 10px; margin-bottom:8px;
  border:1px dashed var(--terracota); border-radius:8px; background:#fff; color:var(--deep); cursor:pointer; }
#e-orientacoes details.tema{ border:1px solid #E6DCD4; border-radius:10px; margin-bottom:6px; background:#fff; }
#e-orientacoes summary{ cursor:pointer; padding:8px 10px; font-weight:600; color:var(--deep); display:flex; justify-content:space-between; gap:8px; }
#e-orientacoes summary .conta{ color:var(--tenue); font-weight:400; font-size:12px; }
#e-orientacoes details .apoio{ padding:0 10px; font-size:12px; }
#e-orientacoes .blocos{ display:flex; flex-wrap:wrap; gap:6px; padding:8px 10px 10px; }
#e-orientacoes .bloco-op{ font:inherit; font-size:12.5px; padding:6px 9px; border:1px solid #D9CCC3; border-radius:999px; background:#FFFCFA; color:var(--cafe); cursor:pointer; text-align:left; }
#e-orientacoes .bloco-op:hover, #e-orientacoes .bloco-op:focus-visible{ border-color:var(--terracota); outline:none; }
.item .tag{ font-size:10.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; margin:0 0 6px; text-align:left; }
.item .tag.bloco{ color:var(--tenue); }
.item .tag.ex{ color:var(--terracota); }
.item.orientacao{ background:#fff; }
.item .campo{ margin-top:6px; }
.item-rod{ flex-wrap:wrap; gap:4px 10px; }
#editor .marcar{ display:flex; gap:8px; align-items:center; font-size:13px; margin-top:8px; }
#editor .marcar input{ width:18px; height:18px; flex:none; }
/* já no plano: ✓ e borda; tocar de novo tira */
.miniatura.no-plano{ border-color:var(--terracota); background:#FBF3F1; box-shadow:inset 0 0 0 1px var(--terracota); }
.miniatura .nome::before{ content:'+ '; }
.miniatura.no-plano .nome::before{ content:'✓ '; color:var(--terracota); }
#e-orientacoes .bloco-op::before{ content:'+ '; }
#e-orientacoes .bloco-op.no-plano{ border-color:var(--terracota); background:#FBF3F1; color:var(--deep); font-weight:600; }
#e-orientacoes .bloco-op.no-plano::before{ content:'✓ '; }
.acoes .duplicar{ font-size:13px; }
.item.realce{ box-shadow:0 0 0 3px var(--rosegold); transition:box-shadow .2s; }
@media screen{
  .folhas [data-uid]{ cursor:pointer; border-radius:2pt; }
  .folhas [data-uid]:hover{ outline:1px dashed #D9CCC3; outline-offset:1mm; }
  .folhas .realce{ outline:2px solid var(--terracota) !important; outline-offset:1mm; }
}
#acao-folha{ position:absolute; z-index:30; background:#fff; border:1px solid #D9CCC3; border-radius:10px; padding:10px 12px;
  box-shadow:0 8px 24px rgba(61,46,40,.18); font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif; max-width:320px; }
#acao-folha[hidden]{ display:none; }
#acao-titulo{ margin:0 0 8px; font-size:13px; font-weight:700; color:var(--deep); text-align:left; }
#acao-folha .linha-acao{ display:flex; gap:6px; }
#acao-folha button{ font:inherit; font-size:13px; font-weight:600; padding:8px 12px; border-radius:8px; cursor:pointer; border:1px solid var(--terracota); background:#fff; color:var(--deep); min-height:36px; }
#acao-tirar{ background:var(--terracota) !important; color:#fff !important; }
@media print{ #acao-folha{ display:none !important; } }
`;

const EXERCICIOS_JS = readFileSync(join(raiz, 'js/exercicios.js'), 'utf8');
const PLANO_JS = readFileSync(join(raiz, 'js/plano.js'), 'utf8');
const ADHERENCE_JS = readFileSync(join(raiz, 'js/adherence.js'), 'utf8');
const PLANO_CLIENTE = readFileSync(join(raiz, 'tools/plano-cliente.js'), 'utf8');

const plano = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plano para casa — Vanessa Fernandes</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap">
<link rel="stylesheet" href="../css/navegacao.css">
<style>${CSS}${CSS_BARRA}${CSS_EXERCICIOS}${CSS_EDITOR}</style></head><body>
${barra('plano', `<label for="b-nome">Paciente</label>
   <input id="b-nome" type="text" placeholder="Nome da paciente (não fica salvo)" autocomplete="off">
   <label><input id="b-data" type="checkbox" checked> Data de hoje</label>`)}
<div class="montagem">
  <aside id="editor" aria-label="Montar o plano">
    <h2>Plano para casa</h2>
    <p class="apoio">Orientações das cartilhas e exercícios num documento só, montado para a paciente.
    A folha se ajusta sozinha. O plano fica guardado neste computador; o nome da paciente, não.</p>
    <p class="ordem">Ordem que ajuda a paciente: <b>entender</b> o que acontece → <b>fazer</b> os exercícios → <b>hábitos</b> do dia a dia → <b>quando me procurar</b>. Menos folhas são mais lidas.</p>

    <h3>Comece por (opcional)</h3>
    <div class="linha"><select id="e-comeco" aria-label="Cartilhas, exercícios prontos e modelos salvos"></select></div>
    <div class="linha"><button id="e-comecar" type="button">Começar com este</button><button id="e-acrescentar" type="button">Acrescentar ao plano</button></div>

    <h3>1 · Orientações</h3>
    <p class="apoio" style="margin-bottom:8px">Toque num tema e escolha os blocos que servem para ela — de uma cartilha ou de várias.</p>
    <div id="e-orientacoes"></div>

    <h3>2 · Exercícios</h3>
    <div id="e-biblioteca"></div>

    <h3>3 · O plano dela</h3>
    <p class="apoio" style="margin-bottom:8px">Mude a ordem, tire o que não serve e ajuste os textos. A mudança vale só para este plano; a cartilha original não muda.
    <b>Atalhos:</b> tocar de novo numa figura ou orientação já marcada (✓) tira do plano; dois cliques num bloco da folha abrem "Tirar / Editar".</p>
    <div id="e-lista"></div>

    <h3>4 · Para o plano todo</h3>
    <label class="campo"><span>Título (opcional)</span><input id="e-titulo" type="text"></label>
    <div class="nums" style="grid-template-columns:1fr 3fr">
      <label class="campo"><span>Exercícios: vezes por dia</span><input id="e-vezes" type="text" inputmode="numeric" maxlength="4" placeholder="—"></label>
      <label class="campo"><span>Recado para a paciente (opcional)</span><textarea id="e-recado" rows="2" placeholder="Ex.: comece deitada e só passe para em pé na semana que vem."></textarea></label>
    </div>
    <label class="marcar"><input id="e-anotacao" type="checkbox" checked> Quadro "O que combinamos na sessão", com o código QR do WhatsApp</label>
    <p class="apoio" style="margin:12px 0 4px"><b>Para quem é</b> — muda o quadro de cuidados da folha:</p>
    <label class="marcar"><input id="e-gestante" type="checkbox"> Paciente gestante (restrição da obstetra, bola, barriga para cima e sinais de alerta)</label>
    <label class="marcar"><input id="e-soltar" type="checkbox"> Foco em soltar — dor na relação ou dor pélvica (no lugar de "contraia")</label>

    <h3>Guardar como modelo</h3>
    <p class="apoio" style="margin-bottom:8px">Guarde planos que você usa sempre, como "Pós-parto — fase 1". Sem nome de paciente.
    Para apagar um modelo salvo, escolha-o na lista lá em cima.</p>
    <div class="linha"><input id="e-nome-modelo" type="text" maxlength="50" placeholder="Nome do modelo" aria-label="Nome do modelo"><button id="e-salvar" type="button">Salvar</button></div>
    <div class="linha"><button id="e-apagar" type="button">Apagar modelo</button><button id="e-limpar" type="button">Começar do zero</button></div>

    <p id="e-folhas"></p>
    <ul id="e-alertas" hidden></ul>
    <p id="e-demais" hidden>Plano com mais de três folhas: veja se dá para tirar alguma coisa. Folha demais costuma ficar sem ler.</p>
    <p id="e-aviso" role="status"></p>
  </aside>
  <div class="folhas" id="folhas"></div>
</div>
<div id="acao-folha" role="dialog" aria-labelledby="acao-titulo" hidden>
  <p id="acao-titulo"></p>
  <div class="linha-acao"><button id="acao-tirar" type="button">Tirar do plano</button><button id="acao-editar" type="button">Editar</button><button id="acao-fechar" type="button" aria-label="Fechar">✕</button></div>
</div>
<template id="t-pagina"><section class="pagina">
  ${cabecalho('<span data-nome-vazio>Plano<br>para casa</span>' +
    '<span data-nome-cheio hidden>Plano para<br><span data-nome-alvo></span></span>')}
  <div class="corpo"></div>
  <div class="rodape">Vanessa Fernandes · Fisioterapeuta · ${esc(Ficha.CREFITO)} · @vanessa.fernands · @clinicaveracis<span data-folha></span></div>
</section></template>
<template id="t-agenda">${AGENDA}</template>
<template id="t-agenda-qr">${AGENDA_QR}</template>
<template id="t-anotacao">${ANOTACAO}</template>
<template id="t-acolhe">${esc(ACOLHE)}</template>
<template id="t-agenda-curta"><div class="agenda curta"><b>Como agendar:</b> WhatsApp ou telefone <b>(31) 3868-1120</b> · Clínica Veracis, Rodovia MG-010, 598, Bela Vista Mall, Conceição do Mato Dentro · @vanessa.fernands e @clinicaveracis</div></template>
<script>${ADHERENCE_JS}</script>
<script>${EXERCICIOS_JS}</script>
<script>${PLANO_JS}</script>
<script>${PLANO_CLIENTE}</script>
<script>${SCRIPT}</script></body></html>`;

/* O endereco antigo da folha de exercicios leva ao plano (favoritos e
   links ja enviados continuam funcionando; rascunho e modelos sao os mesmos). */
const exerciciosRedireciona = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=plano.html"><link rel="icon" href="data:,">
<title>Plano para casa — Vanessa Fernandes</title></head>
<body><p>A folha de exercícios agora faz parte do <a href="plano.html">Plano para casa</a>.</p></body></html>`;

mkdirSync(join(raiz, 'build'), { recursive: true });
writeFileSync(join(raiz, 'build/plano.html'), plano, 'utf8');
writeFileSync(join(raiz, 'build/exercicios.html'), exerciciosRedireciona, 'utf8');
console.log('  build/plano.html gerado ·', A.CARTILHAS.reduce((n, c) => n + c.blocos.length, 0), 'orientações ·',
  require(join(raiz, 'js/exercicios.js')).BIBLIOTECA.length, 'figuras');
writeFileSync(join(raiz, 'build/carta-profissionais.html'), carta, 'utf8');
writeFileSync(join(raiz, 'build/cartilhas-pacientes.html'), cartilhas, 'utf8');
console.log('  build/carta-profissionais.html gerado');
console.log('  build/cartilhas-pacientes.html gerado ·', A.CARTILHAS.length, 'cartilhas');
