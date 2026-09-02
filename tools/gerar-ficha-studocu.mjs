/* ----------------------------------------------------------------
   tools/gerar-ficha-studocu.mjs

   Reproduz a ficha original ("Ficha avaliacao DAP Feminino", 5 paginas
   de conteudo do document-download.pdf) na identidade da Vanessa.

   Fidelidade: mesma ordem, mesmas secoes numeradas, mesmas perguntas,
   mesmas opcoes, mesmo fluxo em linha corrida. O que muda e a forma --
   timbre, tipografia, cor -- e as correcoes listadas em CORRECOES.

   Uso:   node tools/gerar-ficha-studocu.mjs [--pb] [--compacto]
   Saida: build/ficha-studocu.html  ou  build/ficha-studocu-pb.html
   ---------------------------------------------------------------- */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Este PDF existe para ser preenchido a caneta, entao o padrao e o modo
   folgado. Medido na versao anterior: 6,1mm de espacamento mediano entre
   filetes, contra 7-8mm de caderno pautado -- a letra invadia a linha de
   baixo. --compacto devolve o layout apertado, para arquivo em pasta. */
const CANETA = !process.argv.includes('--compacto');

/* Modo P&B: para laser monocromatica. Nao e dessaturar o colorido --
   e trocar a paleta por tons que rendem em toner e redesenhar a EVA,
   porque matiz nao sobrevive a escala de cinza (medido: o cinza padrao
   deixa 20 niveis de separacao entre a ponta leve e a intensa, contra
   os 91 do canal azul, e nenhum dos dois mantem os numeros legiveis). */
const PB = process.argv.includes('--pb');
const v = (folgado, apertado) => (CANETA ? folgado : apertado);
const Ficha = require(join(raiz, 'js/ficha.js'));

const b64 = (p, mime) =>
  `data:${mime};base64,` + readFileSync(join(raiz, p)).toString('base64');

/* Marca em vetor: o PDF passa a carregar curvas, nao pixels, entao
   a mesma arte serve do timbre de 22mm a um banner. */
const LOGO = readFileSync(join(raiz, 'assets/logo.svg'), 'utf8')
  /* Tira width/height intrinsecos: o SVG traz 201x141, que renderiza a
     ~53mm e estoura o timbre. O viewBox e mantido, entao o CSS passa a
     controlar o tamanho sozinho. */
  .replace(/\s(?:width|height)="[\d.]+"/g, '')
  .replace('<svg ', '<svg class="logo" ')
  .replace(/fill="#B86657"/g, PB ? 'fill="#1A1A1A"' : 'fill="#B86657"');
const EVA  = b64('assets/eva.jpg',  'image/jpeg');

/* No modo colorido vale a arte original da ficha; no P&B, a regua
   desenhada, que imprime melhor e economiza toner. A rampa de
   intensidade e a espessura crescente da borda sob cada numero. */
function evaBloco() {
  if (!PB) {
    return `<div class="eva-bloco">` +
      `<img src="${EVA}" alt="Escala Visual Analógica de 0 a 10"></div>`;
  }
  const celulas = Array.from({ length: 11 }, (_, n) => {
    const esp = (0.4 + n * 0.26).toFixed(2);   // 0,40mm a 3,00mm
    return `<div class="eva-c"><b>${n}</b>` +
           `<i style="border-bottom-width:${esp}mm"></i></div>`;
  }).join('');
  return `<div class="eva-bloco"><div class="eva-d">
    <div class="eva-zonas">
      <span style="flex:3">Leve</span>
      <span style="flex:5">Moderada</span>
      <span style="flex:3">Intensa</span>
    </div>
    <div class="eva-reg">${celulas}</div>
    <div class="eva-leg">Escala Visual Analógica — EVA</div>
  </div></div>`;
}

/* Correcoes aplicadas ao original, para constar no README e na conversa. */
const CORRECOES = [
  'MOLÉTIA -> MOLÉSTIA (título da seção 3)',
  'ANTECENDENTES -> ANTECEDENTES (título da seção 4)',
  'CIRURGICOS -> CIRÚRGICOS (título da seção 4)',
  'INCOMODO -> INCÔMODO; "a queixa" -> "à queixa"',
  'Dismenoréia -> Dismenorreia',
  'Diarréia -> Diarreia',
  '"Apresenta IU::" -> "Apresenta IU:"',
  '"Inicio" -> "Início"; "episodio" -> "episódio"',
  'hemorróideas -> hemorroidas (inspeção do ânus)',
  '"Simetria direta-esquerda" -> "Simetria direita-esquerda"',
  'Removida a Percepção de prolapso duplicada da seção 6 (mantida na 7)',
  'Wexner: acrescentado campo de somatório (o original não tinha)',
  'Acrescentados timbre, rodapé legal com CREFITO, numeração e assinaturas'
];

/* ---------- helpers de marcação ---------- */
const o  = (t) => `<span class="o"><i></i>${t}</span>`;          // opção circular
const os = (...ts) => ts.map(o).join('');
const sn = () => os('Sim', 'Não');
const l  = (w) => `<span class="l" style="width:${w}"></span>`;  // linha de escrita
const lf = () => `<span class="lf"></span>`;                     // linha que ocupa o resto
const it = (txt, resto = '') =>                                  // item com traço
  `<div class="it"><span class="tx">${txt}</span>${resto}</div>`;
const sub = (txt, resto = '') =>                                 // linha recuada
  `<div class="it sub"><span class="tx">${txt}</span>${resto}</div>`;
const h   = (n, t) => `<h2><span class="n">${n}</span>${t}</h2>`;
const area = (n = 2) =>
  `<div class="area">${Array.from({ length: n }, () => '<span class="lf"></span>').join('')}</div>`;

/* ---------- Wexner, no formato do original ---------- */
const WX = ['Sólido', 'Líquido', 'Gases', 'Uso de fraldas/absorventes', 'Alteração no estilo de vida'];
const wexner = `
<div class="wx">
  <div class="wx-cab"><span class="wx-tipo">TIPO DE INCONTINÊNCIA</span><span>FREQUÊNCIA</span></div>
  ${WX.map(t => `<div class="wx-l"><span class="wx-tipo">${t}</span>
    <span class="wx-ops">${os('Nunca','Raramente','Às vezes','Frequentemente','Sempre')}</span></div>`).join('')}
  <div class="wx-nota">
    0 = Perfeito<br>
    20 = Completa incontinência<br>
    Nunca = 0 (Nota: 0)<br>
    Raramente = Menor que uma vez por mês (Nota: 1)<br>
    Às vezes = Menor que uma vez por semana e maior ou igual a uma vez por mês (Nota: 2)<br>
    Frequentemente = Menor que uma vez por dia e maior ou igual a uma vez por semana (Nota: 3)<br>
    Sempre = Maior ou igual a uma vez por dia (Nota: 4)
  </div>
  <div class="wx-soma"><span>Somatório</span><span class="cx"></span><span class="max">/ 20</span></div>
</div>`;

const OXFORD = [
  [0, 'Ausência de contração dos músculos perineais'],
  [1, 'Esboço de contração muscular não sustentada'],
  [2, 'Presença de contração de pequena intensidade, mas que se sustenta'],
  [3, 'Contração sentida com um aumento da pressão intravaginal que comprime os dedos do examinador com pequena elevação da parede vaginal posterior'],
  [4, 'Contração satisfatória que aperta os dedos do examinador com elevação da parede vaginal posterior em direção à sínfise púbica'],
  [5, 'Contração forte, compressão firme dos dedos do examinador com movimento positivo em relação à sínfise púbica']
];
const ICS = [
  [3, 'Forte (forte força de oclusão e elevação palpável)'],
  [2, 'Normal (oclusão e elevação palpáveis)'],
  [1, 'Fraca (contração curta sem oclusão palpável)'],
  [0, 'Ausente (sem contração)']
];

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>Ficha de Avaliação — Disfunções dos Músculos do Assoalho Pélvico Feminino</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap">
<style>
${PB
  ? `:root{ --terracota:#2E2A28; --deep:#000000; --cafe:#1A1A1A;
       --areia:#F2F2F2; --rosegold:#767676; --linha:#8C8C8C; --tenue:#4A4A4A; }`
  : `:root{ --terracota:#B86657; --deep:#9E4F42; --cafe:#3D2E28;
       --areia:#F7F4F0; --rosegold:#D49A8D; --linha:#C9BDB4; --tenue:#8A7268; }`}
@page{ size:A4 portrait; margin:10mm 12mm 9mm 12mm; }
*{ box-sizing:border-box; }
html,body{ margin:0; padding:0; background:#fff; color:var(--cafe);
  font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;
  font-size:${v('9.3pt','8.7pt')}; line-height:${v('1.5','1.5')};
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* folha: thead/tfoot repetem em cada pagina */
table.folha{ width:100%; border-collapse:collapse; }
table.folha > thead th{ padding:0 0 2.5mm; font-weight:400; }
table.folha > tbody > tr > td{ padding:0 0 0; vertical-align:top; }
table.folha > tfoot td{ padding:2mm 0 0; }

.timbre{ display:flex; align-items:flex-end; justify-content:space-between; gap:8mm;
  border-bottom:0.8pt solid var(--terracota); padding-bottom:1.8mm; text-align:left; }
.marca{ display:flex; align-items:center; gap:2.6mm; }
/* Largura explicita, nao auto: dentro de <th> o layout de tabela e o
   width:auto do SVG se realimentam e a marca cresce so na impressao
   (medido: 11mm na tela, 19mm no PDF). Com as duas dimensoes fixas
   nao ha ambiguidade. */
.marca .logo{ height:11mm; width:15.68mm; display:block; }
.lockup{ display:flex; flex-direction:column; line-height:1.15; }
.lockup .nome{ font-family:'Playfair Display',Georgia,serif; font-size:12.5pt;
  font-weight:700; color:var(--terracota); }
.lockup .esp{ font-size:5.7pt; letter-spacing:.34em; text-transform:uppercase; color:var(--cafe); }
.doc-tit{ font-size:6.5pt; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
  color:var(--deep); text-align:right; max-width:66mm; line-height:1.32; }
.rodape{ border-top:0.5pt solid #E6DCD4; padding-top:1.5mm;
  font-size:5.8pt; line-height:1.4; color:#7A6960; text-align:center; }

/* abertura */
.abre{ text-align:center; margin:1mm 0 3mm; }
.abre .t1{ font-family:'Playfair Display',Georgia,serif; font-size:12pt;
  font-weight:600; color:var(--deep); }
.abre .t2{ font-family:'Playfair Display',Georgia,serif; font-size:10pt;
  color:var(--cafe); margin-top:0.4mm; }
.data{ text-align:right; margin-bottom:2.5mm; font-size:8.7pt; }

/* identificacao */
.ident{ border:0.6pt solid var(--linha); border-radius:2pt; padding:2.4mm 3mm;
  background:#FDFCFB; margin-bottom:3.5mm; break-inside:avoid; }

/* secoes */
h2{ font-size:9pt; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
  color:var(--deep); margin:4.5mm 0 1.8mm; padding-bottom:1.1mm;
  border-bottom:0.7pt solid var(--rosegold); display:flex; align-items:center; gap:2.2mm;
  break-after:avoid; }
h2 .n{ flex:none; min-width:5mm; height:5mm; border-radius:99px; background:var(--terracota);
  color:#fff; font-size:5.9pt; display:flex; align-items:center; justify-content:center;
  letter-spacing:0; }
h3{ font-size:8.4pt; font-weight:700; color:var(--deep); margin:3mm 0 1.4mm;
  letter-spacing:.03em; break-after:avoid; }
h3.c{ text-align:center; }
h4{ font-size:8.4pt; font-weight:600; font-style:italic; color:var(--cafe);
  margin:2.4mm 0 1mm; break-after:avoid; }

/* itens em linha corrida */
.it{ display:flex; flex-wrap:wrap; align-items:baseline; gap:0 2.2mm;
  margin-bottom:${v('1.2mm','0.9mm')}; break-inside:avoid; }
/* O travessao e item de flex, nao pseudo-elemento absoluto: com
   align-items:baseline ele acompanha a linha de base sozinho. Absoluto
   sem top ancorava no topo da caixa e, com a linha de escrita alta do
   modo caneta, ficava boiando acima do texto. */
.it::before{ content:"–"; flex:none; width:3.4mm; color:var(--rosegold); }
.it.sub{ padding-left:9mm; }
.it.sub::before{ content:none; }
.it.plain{ padding-left:0; }
.it.plain::before{ content:none; }
.tx{ white-space:nowrap; }
.tx.w{ white-space:normal; }
.tx.nota{ font-size:7.4pt; color:#6B564D; }

/* linhas de escrita */
.l,.lf{ display:inline-block; border-bottom:0.5pt solid var(--linha);
  height:${v('6.6mm','4.1mm')}; }
.lf{ flex:1 1 40mm; min-width:20mm; }
.area{ display:flex; flex-direction:column; gap:${v('6.6mm','2.4mm')};
  margin:${v('2mm 0 2.4mm','1mm 0 1.4mm')}; }
.area .lf{ width:100%; flex:none; }

/* opcoes */
.o{ display:inline-flex; align-items:center; gap:1.1mm; white-space:nowrap; margin-right:3.2mm; }
.o i{ width:${v('3.2mm','2.5mm')}; height:${v('3.2mm','2.5mm')};
  border:0.6pt solid var(--tenue); border-radius:50%;
  background:#fff; flex:none; }
.ops{ display:flex; flex-wrap:wrap; }

/* destaque do consentimento */
.consent{ border:0.7pt solid var(--terracota); border-radius:2pt; background:var(--areia);
  padding:2.4mm 3mm; margin-bottom:3mm; break-inside:avoid; }
.consent .q{ font-weight:700; display:flex; flex-wrap:wrap; align-items:baseline; gap:0 3mm; }
.consent .q + .q{ margin-top:1.8mm; }

/* EVA */
.eva-bloco{ text-align:center; margin:2.5mm 0 1.5mm; break-inside:avoid; }
.eva-bloco img{ width:132mm; max-width:100%; height:auto; }
/* Regua desenhada, usada no modo P&B. Tudo em borda, nada em fundo:
   a instrucao de impressao pede "graficos de plano de fundo" desmarcado,
   e nesse modo qualquer background-color ou gradiente sumiria. */
.eva-d{ width:132mm; max-width:100%; margin:0 auto; }
.eva-zonas{ display:flex; font-size:7.4pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:var(--cafe); margin-bottom:0.8mm; }
.eva-zonas span{ text-align:center; }
.eva-zonas span + span{ border-left:0.8pt solid var(--cafe); }
.eva-reg{ display:flex; }
.eva-c{ flex:1; border:0.5pt solid var(--cafe); text-align:center;
  padding:1.1mm 0 0.5mm; }
.eva-c + .eva-c{ border-left:none; }
.eva-c b{ font-size:10pt; font-weight:700; color:var(--cafe); }
.eva-c i{ display:block; margin:1.1mm 1.1mm 0.2mm;
  border-bottom:0 solid var(--cafe); }
.eva-leg{ font-size:7.6pt; font-weight:700; letter-spacing:.1em;
  text-transform:uppercase; color:var(--cafe); margin-top:1.2mm; }
.eva-val{ text-align:right; font-weight:700; margin-top:1mm; }

/* Wexner */
.wx{ break-inside:avoid; }
.wx-cab{ display:flex; font-weight:700; font-size:8.2pt; text-transform:uppercase;
  letter-spacing:.04em; color:var(--deep); border-bottom:0.5pt solid var(--linha);
  padding-bottom:0.8mm; margin-bottom:1mm; }
.wx-tipo{ flex:0 0 52mm; }
.wx-l{ display:flex; align-items:baseline; padding:${v('1.5mm','0.6mm')} 0;
  border-bottom:0.4pt solid #EFE7E1; }
.wx-l .wx-tipo{ flex:0 0 52mm; }
.wx-ops{ display:flex; flex-wrap:wrap; }
.wx-nota{ font-size:6.9pt; color:#6B564D; line-height:1.5; margin:1.8mm 0 0 6mm; }
.wx-soma{ display:flex; align-items:center; gap:2mm; margin-top:2mm; font-weight:600; }
.wx-soma .cx{ width:13mm; height:5.6mm; border:0.7pt solid var(--terracota); border-radius:1.5pt; }
.wx-soma .max{ color:var(--tenue); font-weight:400; }

/* escalas graduadas */
.grad{ display:flex; align-items:baseline; gap:2mm;
  padding:${v('1.4mm','0.55mm')} 0; break-inside:avoid; }
.grad i{ width:2.5mm; height:2.5mm; border:0.6pt solid var(--tenue); border-radius:50%;
  background:#fff; flex:none; position:relative; top:0.3mm; }
.grad b{ flex:none; min-width:3.5mm; color:var(--deep); }
.cab-grad{ display:flex; gap:2mm; font-weight:700; font-size:7.6pt; text-transform:uppercase;
  letter-spacing:.05em; color:var(--tenue); margin-bottom:0.8mm; }
.cab-grad .g1{ flex:0 0 12mm; }

.quebra{ break-before:page; }

/* assinaturas */
.assin{ display:flex; gap:14mm; margin-top:6mm; break-inside:avoid; }
.assin > div{ flex:1; text-align:center; }
.assin .r{ border-top:0.6pt solid var(--cafe); margin-bottom:1.3mm; }
.assin .n2{ font-size:8pt; font-weight:600; }
.assin .g{ font-size:6.6pt; color:#6B564D; margin-top:0.3mm; }
</style></head>
<body>
<table class="folha">
<thead><tr><th>
  <div class="timbre">
    <div class="marca">
      ${LOGO}
      <div class="lockup">
        <span class="nome">Vanessa Fernandes</span>
        <span class="esp">Fisioterapia Pélvica</span>
      </div>
    </div>
    <div class="doc-tit">Avaliação das Disfunções dos Músculos<br>do Assoalho Pélvico Feminino</div>
  </div>
</th></tr></thead>

<tfoot><tr><td>
  <div class="rodape">${Ficha.RODAPE_LEGAL}</div>
</td></tr></tfoot>

<tbody><tr><td>

<div class="abre">
  <div class="t1">Fisioterapia Aplicada à Saúde da Mulher</div>
  <div class="t2">Avaliação das Disfunções dos Músculos do Assoalho Pélvico Feminino</div>
</div>

<div class="data">Data: ${l('9mm')} / ${l('9mm')} / ${l('14mm')}</div>

<div class="ident">
  ${it('Nome:', lf())}
  ${it('Idade:', l('16mm') + '<span class="tx">Data de Nascimento:</span>' + l('9mm') + '/' + l('9mm') + '/' + l('13mm') + '<span class="tx">Estado Civil:</span>' + lf())}
  ${it('Profissão:', lf())}
  ${it('Endereço:', l('62mm') + '<span class="tx">Escolaridade:</span>' + lf())}
  ${it('Telefones:', lf())}
  ${it('Clínica Solicitante:', lf())}
  ${it('Diagnóstico médico:', lf())}
</div>

${h(1, 'Antecedentes Ginecológicos')}
${it('Estado reprodutivo:', os('Menacme', 'Climatério', 'Pós-menopausa'))}
${it('Menarca:', l('26mm') + '<span class="tx">DUM:</span>' + l('8mm') + '/' + l('8mm') + '/' + l('12mm') + '<span class="tx">TH:</span>' + sn() + '<span class="tx">Tempo:</span>' + l('20mm'))}
${it('Ciclos menstruais:', '<span class="tx">Intervalo:</span>' + l('22mm') + '<span class="tx">Duração:</span>' + l('22mm') + '<span class="tx">Quantidade:</span>' + lf())}
${it('Sintomas menstruais:', '<span class="tx">Dismenorreia:</span>' + l('26mm') + '<span class="tx">Medicação?</span>' + lf())}
${it('Uso de métodos contraceptivos:', sn() + '<span class="tx">Qual?</span>' + lf())}

${h(2, 'Antecedentes Obstétricos')}
${it('G', l('11mm') + '<span class="tx">P</span>' + l('11mm') + '<span class="tx">A</span>' + l('11mm') + '<span class="tx">C</span>' + l('11mm') + '<span class="tx">Uso de fórceps?</span>' + l('18mm') + '<span class="tx">DUP</span>' + l('8mm') + '/' + l('8mm') + '/' + l('12mm'))}
${it('Peso do maior RN:', l('30mm'))}
${it('Complicações no Puerpério:', lf())}
${area(1)}

${h(3, 'História da Moléstia Atual')}
${it('Queixa principal, início, duração, evolução, limitações funcionais / participação social:', '')}
${area(4)}

<h3 class="c">Estimativa do incômodo relacionado à queixa principal</h3>
${evaBloco()}
<div class="eva-val">EVA: ${l('22mm')}</div>

${h(4, 'Hábitos de Vida e Antecedentes Clínicos e Cirúrgicos')}
${it('Antecedentes familiares:', lf())}
${it('Antecedentes pessoais:', lf())}
${it('Medicamentos em uso:', lf())}
${it('Hábitos de vida:', o('Tabagismo') + '<span class="tx">Quanto tempo?</span>' + lf())}
${sub(o('Etilismo'), '<span class="tx">Quanto tempo?</span>' + lf())}
${sub(o('Obesidade'))}
${sub(o('Atividade Física'), '<span class="tx">Qual?</span>' + l('34mm') + '<span class="tx">Frequência:</span>' + lf())}
${it('Doenças do SNC:', sn() + '<span class="tx">Qual?</span>' + lf())}
${it('Radioterapia pélvica:', sn() + '<span class="tx">Quando / Sessões?</span>' + lf())}
${it('Cirurgias pélvicas prévias:', sn() + '<span class="tx">Qual?</span>' + lf())}
${it('HTV / HTA:', sn() + '<span class="tx">Data</span>' + l('8mm') + '/' + l('8mm') + '/' + l('12mm'))}
${it('Cirurgia para IU:', sn() + '<span class="tx">Data</span>' + l('8mm') + '/' + l('8mm') + '/' + l('12mm'))}

${h(5, 'Sintomas do Trato Urinário Inferior (TUI)')}
${it('Apresenta IU:', sn())}
${sub('Essas perdas são:', os('Frequentes', 'Ocasionais'))}
${it('Urgência:', sn())}
${it('Por quanto tempo consegue retardar a micção:', os('Não', "1'", "3'", "5'", 'ou mais'))}
${it('Aumento da frequência diária:', sn() + '<span class="tx">Estimativa do nº diário</span>' + l('18mm'))}
${it('Noctúria:', sn() + '<span class="tx">Estimativa do nº diário</span>' + l('18mm'))}
${it('Enurese noturna:', sn() + '<span class="tx">Último episódio:</span>' + l('26mm'))}
${it('Dificuldade para iniciar a micção:', sn())}
${it('Sensação de esvaziamento incompleto:', sn())}
${it('Necessidade de esforço para completar a micção:', sn())}
${it('Adoção de novas posturas para a micção:', sn())}
${it('Atividades / Situações que desencadeiam a IU:', os('Tossir', 'Espirrar', 'Rir', 'Lavar as mãos'))}
${sub(os('Andar', 'Correr', 'Levantar-se', 'Pegar peso', 'Outros:'), lf())}
${it('Quantidade de urina perdida:', os('Pequena', 'Moderada', 'Grande'))}
${sub(os('Em jatos', 'Em gotas'))}
${it('Início ou agravamento após o parto:', sn() + '<span class="tx">Quanto tempo após o parto:</span>' + lf())}
${it('Esvaziamento vesical sem desejo (profilaxia):', sn())}
${it('Incontinência urinária insensível:', sn())}
${it('Uso de proteção:', sn() + '<span class="tx">Nº de trocas:</span>' + l('24mm'))}
${sub('Tipo:', os('Papel', 'Absorvente', 'Fralda'))}
${sub('Trocas:', os('Secos', 'Úmidos', 'Molhados'))}
${it('Mobilidade / Acesso ao banheiro limitada:', sn() + '<span class="tx">Motivo:</span>' + lf())}
${it('ITU:', sn() + '<span class="tx">Último episódio:</span>' + l('30mm'))}
${it('Outros Sintomas e Observações TUI:', '')}
${area(2)}

${h(6, 'Sintomas Intestinais')}
${it('Necessidade de manobras para completar a evacuação:', sn())}
${it('Adoção de novas posturas para a evacuação:', sn())}
${it('Uso de enemas, lavagens e supositórios:', sn() + '<span class="tx">Quantidade:</span>' + l('26mm'))}
${it('Sensação de esvaziamento incompleto:', sn())}
${it('Perda insensível de fezes:', sn())}
${it('Urgência:', sn() + '<span class="tx">Tempo de aviso:</span>' + lf())}
${it('Incontinência (por urgência):', sn())}
${it('Perda de fezes / flatos aos esforços:', os('Tosse', 'Espirro', 'Rir', 'Andar'))}
${sub(os('Correr', 'Levantar-se', 'Pegar peso', 'Mudança de posição', 'Outros:'), lf())}
${it('Quantidade de fezes / flatos perdida:', os('Pequena', 'Moderada', 'Grande'))}
${it('Uso de proteção:', sn() + '<span class="tx">Nº de trocas:</span>' + l('24mm'))}
${sub('Tipo:', os('Papel', 'Absorvente', 'Fralda'))}
${sub('Trocas:', os('Limpos', 'Sujos'))}
${it('Consistência das fezes:', os('Líquidas', 'Sólidas', 'Pastosas'))}
${it('Percepção (desejo de defecação e distinção de fezes / gases):', lf())}
${it('Cronologia em relação às refeições:', lf())}
${it('Sintomas associados:', os('Dor', 'Esforço', 'Diarreia', 'Fecaloma'))}
${sub(os('Sangramento', 'Flatulência', 'Urgência', 'Soiling', 'Constipação'))}

<h3 class="c">Continence Grading Scale — Índice de Incontinência ou Escala de Wexner</h3>
${wexner}

${h(7, 'Sintomas Vaginais')}
${it('Percepção de prolapso:', sn())}
${it('Outros Sintomas / Observações:', lf())}

${h(8, 'Função Sexual')}
${it('Atividade sexual:', os('Sim', 'Não', 'Não se aplica'))}
${it('Frequência do coito:', lf())}
${it('Libido:', l('56mm') + '<span class="tx">Orgasmo:</span>' + lf())}
${it('Dispareunia:', l('26mm') + '<span class="tx">Em que momento:</span>' + lf())}
${it('Problemas relacionados ao Parceiro:', lf())}
${it('Outros sintomas / Observações:', lf())}

${h(9, 'Dor')}
${it('Dor pélvica crônica:', sn())}
${it('Sintomas:', lf())}
${area(1)}
${it('Horário de agravamento / limitações de atividades / fatores que agravam ou diminuem a dor:', '')}
${area(2)}
${it('Exames complementares e testes especiais:', '')}
${area(2)}

${h(10, 'Exames Complementares em Urologia / Uroginecologia')}
${it('Diagnóstico Urodinâmico:', lf())}
${sub('* Considerações do exame urodinâmico:', lf())}
${sub('* Data:', l('8mm') + '/' + l('8mm') + '/' + l('12mm'))}
${it('Cistoscopia:', lf())}
${sub('* Data:', l('8mm') + '/' + l('8mm') + '/' + l('12mm'))}
${it('Outros Exames:', lf())}
${area(1)}

${h(11, 'Exames Complementares em Proctologia')}
${it('Manometria Anorretal:', lf())}
${sub('* Considerações:', lf())}
${sub('* Data:', l('8mm') + '/' + l('8mm') + '/' + l('12mm'))}
${it('Outros Exames:', lf())}
${area(1)}

<div class="quebra"></div>
<h3 class="c" style="font-size:11pt;margin-top:0">Exame Físico</h3>

<div class="consent">
  <div class="q"><span class="tx w">A paciente foi esclarecida e orientada com relação aos procedimentos
    intravaginais e intra-anais que serão realizados no exame físico?</span>${sn()}</div>
  <div class="q"><span class="tx w">A paciente autorizou a realização dos procedimentos?</span>${sn()}</div>
</div>

<h4>Exame físico geral</h4>
${it('PA:', l('30mm') + '<span class="tx">FC:</span>' + l('30mm') + '<span class="tx">FR:</span>' + l('30mm'))}
${it('Estatura:', l('30mm') + '<span class="tx">Peso:</span>' + l('30mm') + '<span class="tx">IMC:</span>' + l('30mm'))}

<h4>Exame físico especial — Inspeção</h4>
${it('Aparelho respiratório (tipo de respiração):', lf())}
${it('ABDOME (estrias, cicatrizes, pigmentação, hérnia, palpação):', lf())}
${it('PERÍNEO (roturas, tumorações, cicatrizes):', lf())}
${it('ÂNUS (esfíncter, fístulas, mucosa retal, tumorações, hemorroidas):', lf())}

<h3>Prolapso dos Órgãos Pélvicos — Escala de Baden e Walker</h3>
${it('Prolapso de parede vaginal anterior:', o('Não') + o('Sim:') + os('I', 'II', 'III', 'IV'))}
${it('Prolapso de parede vaginal posterior:', o('Não') + o('Sim:') + os('Leve', 'Moderada', 'Grave'))}
${it('Prolapso de cúpula vaginal ou uterino:', o('Não') + o('Sim:') + os('I', 'II', 'III'))}

<h3>Exame da Sensibilidade</h3>
${area(2)}

<h3>Reflexos Perineais</h3>
${it('Reflexo Clitoriano:', os('Presente', 'Ausente'))}
${it('Reflexo Anocutâneo:', os('Presente', 'Ausente'))}

<h3>Avaliação Funcional do Assoalho Pélvico</h3>
<h4>Movimento interno do períneo</h4>
${sub(o('Sim (algum movimento no sentido interno é percebido no períneo)'))}
${sub(o('Não (nenhum movimento no sentido interno é percebido no períneo)'))}
${sub(o('Paradoxal (movimento de “descida” do períneo é percebido)'))}

<h4>Reflexo contrátil à tosse</h4>
${sub(o('Sim (contração reflexa do assoalho pélvico junto à tosse)'))}
${sub(o('Não (contração reflexa ausente, nenhum movimento)'))}
${sub(o('Paradoxal (movimentação de “descida” do períneo à tosse)'))}

<h4>Estimativa da Função dos MAP</h4>
${it(os('Unidigital', 'Bidigital', 'Vaginal', 'Anal'), '')}

<h3 class="c">Escala de Oxford Modificada</h3>
<div class="cab-grad"><span class="g1">Grau</span><span>Palpação</span></div>
${OXFORD.map(([g, t]) => `<div class="grad"><i></i><b>${g}</b><span>${t}</span></div>`).join('')}

<h3 class="c">Contração voluntária — Escala ICS</h3>
${ICS.map(([g, t]) => `<div class="grad"><i></i><b>${g}</b><span>${t}</span></div>`).join('')}

<h4>Demais parâmetros</h4>
${it('Coativação:', o('Não') + o('Sim:') + os('Glúteos', 'Adutores', 'Abdominais'))}
${it('Relaxamento:', '')}
${sub(o('Sim (relaxamento visível diretamente após instrução)'))}
${sub(o('Não (ausência, hesitação ou relaxamento parcial após instrução)'))}
${it('Endurance (tempo de sustentação):', l('22mm') + '<span class="tx">segundos</span>')}
${it('Contrações rápidas:', l('22mm'))}
${sub('<span class="tx w nota">(número de contrações rápidas realizadas com período de descanso anterior às contrações de 2 minutos — máx. 10 repetições)</span>')}
${it('Palpação dolorosa:', os('Não', 'Sim'))}
${sub('* Local e achado:', lf())}
${it('Simetria direita-esquerda:', sn() + lf())}
${it('Simetria anteroposterior:', sn() + lf())}
${it('Teste de esforço (+):', os('Deitada', 'Em pé'))}
${it('Outros testes específicos (Perineometria, Pad test, EMG):', '')}
${area(3)}

<h3 class="c">Estimativa de desconforto da paciente ao exame do assoalho pélvico</h3>
${evaBloco()}
<div class="eva-val">EVA: ${l('22mm')}</div>

<h3>Diagnóstico Fisioterapêutico da condição do AP</h3>
${area(3)}

<div class="assin">
  <div><div class="r"></div><div class="n2">Dra. Vanessa Fernandes</div>
       <div class="g">Fisioterapeuta Pélvica · ${Ficha.CREFITO}</div></div>
  <div><div class="r"></div><div class="n2">Assinatura da paciente</div>
       <div class="g">Ciente da avaliação realizada</div></div>
</div>

</td></tr></tbody>
</table>
</body></html>`;

mkdirSync(join(raiz, 'build'), { recursive: true });
/* Arquivos separados: gerar uma variante nao pode apagar a outra. */
const SAIDA = PB ? 'build/ficha-studocu-pb.html' : 'build/ficha-studocu.html';
writeFileSync(join(raiz, SAIDA), html, 'utf8');
console.log('  ' + SAIDA + ' gerado ·', html.length, 'bytes');
console.log('  correcoes aplicadas ao original:', CORRECOES.length);
CORRECOES.forEach(c => console.log('    -', c));
