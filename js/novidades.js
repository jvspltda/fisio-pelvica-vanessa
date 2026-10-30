/* ════════════════════════════════════════════════════════════════
   js/novidades.js — O que há de novo no site, contado para a Vanessa
   (conteúdo, sem DOM). A página inicial mostra as mais recentes e marca
   com "Novo" as que ela ainda não viu neste aparelho (js/inicio.js).

   Ao publicar algo que ela vai usar, acrescente no TOPO da lista, com
   um id novo. Texto em linguagem do dia a dia, sem termo técnico.
   tests/inicio.test.mjs confere ids, datas e links.
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var N = {};

  N.LISTA = [
    { id: 'para-aprovar', data: '2026-10-29', titulo: 'Tudo o que precisa do seu aval, num lugar só',
      texto: 'Cada mudança com o texto que vai para a paciente. Aprove ou peça ajuste e mande as respostas pelo WhatsApp.',
      href: 'aprovar.html', link: 'Ver o que falta' },
    { id: 'plano-para-casa', data: '2026-10-29', titulo: 'Plano para casa: cartilhas e exercícios juntos',
      texto: 'Monte um documento só para cada paciente, com os blocos das cartilhas e os exercícios com figura. Marque "Paciente gestante" ou "Foco em soltar" e o quadro de cuidados se ajusta sozinho. Tocou duas vezes num exercício, ele sai.',
      href: 'impressos/plano.html', link: 'Montar um plano' },
    { id: 'bola-gestacao', data: '2026-10-29', titulo: 'Oito exercícios de gestação com bola',
      texto: 'Já com figura e "Como fazer", e dois modelos prontos para começar: mobilidade na bola e pernas na bola, deitada.',
      href: 'impressos/plano.html', link: 'Ver no plano' },
    { id: 'cartilhas-alimentacao', data: '2026-10-29', titulo: 'Duas cartilhas novas',
      texto: '"O que Você Come e Bebe e a Bexiga" e "Bexiga e Intestino na Gestação" — só os cuidados com bexiga e intestino; a dieta fica com a nutricionista ou o médico.',
      href: 'impressos/cartilhas.html#c-alimentos-bexiga', link: 'Ver as cartilhas' },
    { id: 'qr-whatsapp', data: '2026-10-29', titulo: 'Código QR do WhatsApp nas folhas',
      texto: 'A paciente aponta a câmera do celular e já cai na conversa da clínica, com "Olá! Quero agendar um horário." escrito.',
      href: 'impressos/cartilhas.html', link: 'Ver numa cartilha' },
    { id: 'enviar-limpo', data: '2026-10-29', titulo: '"Enviar PDF" e "Enviar como imagem" saem limpos',
      texto: 'Antes, o arquivo mandado pelo WhatsApp saía com uma mancha cinza sobre parte da folha. Se mandou algum antes de 29/10, vale conferir com a paciente.',
      href: 'impressos/plano.html', link: 'Abrir o plano' }
  ];

  N.MOSTRAR = 6;

  /* "Bom dia" de 5h a 11h59, "Boa tarde" até 17h59, "Boa noite" no resto */
  N.saudacao = function (hora) {
    return hora >= 5 && hora < 12 ? 'Bom dia' : hora >= 12 && hora < 18 ? 'Boa tarde' : 'Boa noite';
  };

  var DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  /* "quinta-feira, 29 de outubro" */
  N.dataLonga = function (d) { return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()]; };
  /* "29/10" a partir de "2026-10-29" */
  N.dataCurta = function (iso) {
    var m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[2] + '/' + m[1] : '';
  };

  /* ids que ela ainda não viu, entre os que aparecem */
  N.novas = function (vistas) {
    var v = vistas || [];
    return N.LISTA.slice(0, N.MOSTRAR).filter(function (n) { return v.indexOf(n.id) === -1; }).map(function (n) { return n.id; });
  };

  raiz.Novidades = N;
  if (typeof module !== 'undefined') module.exports = N;

})(typeof window !== 'undefined' ? window : globalThis);
