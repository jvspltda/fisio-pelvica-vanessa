/* ════════════════════════════════════════════════════════════════
   js/carrossel.js — Carrosséis do Instagram (conteúdo, sem DOM).

   A página carrossel.html desenha cada slide em 1080 × 1350 (4:5, o
   formato do feed) e baixa as imagens; tests/carrossel.test.mjs confere
   a conformidade antes da publicação.

   Regras (as mesmas dos Reels, js/roteiros.js): nome, "Fisioterapeuta",
   CREFITO-4 e data da publicação em TODO slide (o rodapé é posto pela
   página, com a data escolhida); nenhuma promessa, depoimento, antes e
   depois, imagem de paciente ou valor. As figuras são ilustrações da
   biblioteca de exercícios (assets/exercicios/), não fotos.

   Texto no padrão aprovado dos roteiros: frases curtas, linguagem do dia
   a dia, sem estudo nem número estatístico, fecho em "pede avaliação".
   Os "como fazer" resumem os da folha de exercícios (js/exercicios.js) e,
   como eles, aguardam o aval da Vanessa.
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var C = {};

  C.FORMATO = { largura: 1080, altura: 1350 };

  C.LISTA = [
    {
      id: 'bola-gestacao',
      titulo: 'Bola de pilates na gestação',
      tema: 'Gestação',
      /* fala com a gestante ("a sua gestação", "sua obstetra", "mãos na
         barriga"): a política de atributos pessoais da Meta não deixa isso
         ir para anúncio. Para anunciar, seria preciso reescrever o fecho,
         o slide de cuidados e a legenda. */
      soOrganico: true,
      slides: [
        { tipo: 'capa', chamada: 'Gestação', titulo: 'Bola de pilates na gestação',
          texto: 'Movimentos suaves para fazer em casa', figura: 'bola-circulos-quadril.jpg', rodapeExtra: 'Arraste para o lado →',
          alt: 'Ilustração de gestante sentada numa bola de pilates. Título: Bola de pilates na gestação.' },
        /* logo depois da capa: quem para de arrastar cedo já viu os cuidados */
        { tipo: 'cuidados', titulo: 'Antes de começar',
          itens: ['Só faça se a sua obstetra não pediu repouso nem restringiu exercício.',
                  'Bola bem cheia: sentada, joelhos na altura do quadril ou um pouco abaixo.',
                  'Tapete que não escorrega, descalça ou de tênis, e uma parede ou alguém por perto.',
                  'Devagar e só até onde for confortável. Se doer, pare.'],
          alerta: 'Pare e procure sua obstetra ou o pronto atendimento se tiver sangramento, perda de líquido, contrações fortes e regulares antes da hora, dor forte, tontura, falta de ar já antes de começar, fraqueza ou perda de equilíbrio, dor no peito, dor de cabeça forte, dor ou inchaço na batata da perna, ou se o bebê mexer bem menos.',
          alt: 'Antes de começar: liberação da obstetra, bola e apoio certos, devagar. Quando parar.' },
        { tipo: 'exercicio', numero: 1, titulo: 'Círculos com o quadril', figura: 'bola-circulos-quadril.jpg',
          texto: 'Sentada na bola, pés bem apoiados no chão e afastados. Faça círculos lentos com o quadril, para um lado e depois para o outro.',
          alt: 'Gestante sentada na bola fazendo círculos com o quadril.' },
        { tipo: 'exercicio', numero: 2, titulo: 'Balanço para frente e para trás', figura: 'bola-balanco.jpg',
          texto: 'Leve o quadril para frente e para trás com suavidade, deixando a bola rolar só um pouquinho embaixo de você.',
          alt: 'Gestante sentada na bola balançando o quadril para frente e para trás.' },
        { tipo: 'exercicio', numero: 3, titulo: 'Oito com o quadril', figura: 'bola-oito.jpg',
          texto: 'Mãos na barriga, desenhe um oito deitado com o quadril, bem devagar, sentindo a pelve se mover.',
          alt: 'Gestante sentada na bola, de frente, desenhando um oito com o quadril.' },
        { tipo: 'exercicio', numero: 4, titulo: 'Respiração sentada na bola', figura: 'bola-respiracao.jpg',
          texto: 'Puxe o ar pelo nariz sentindo a barriga e as costelas se abrirem. Solte devagar pela boca.',
          alt: 'Gestante sentada na bola, olhos fechados, com as mãos na barriga, respirando.' },
        { tipo: 'fecho', titulo: 'Cada gestação é de um jeito',
          texto: 'Quais movimentos fazem sentido para a sua, e em que fase, pede avaliação.',
          alt: 'Cada gestação é de um jeito. Agende pelo WhatsApp (31) 3868-1120, Clínica Veracis.' }
      ],
      legenda: 'A bola de pilates pode ser uma boa companheira na gestação. Separei quatro movimentos suaves para fazer em casa — arrasta para o lado.\n\n' +
        'Antes de começar: só faça se a sua obstetra não pediu repouso nem restringiu exercício. Bola bem cheia, tapete que não escorrega e uma parede ou alguém por perto. Se doer, pare.\n\n' +
        'Cada gestação é de um jeito: quais movimentos fazem sentido para a sua, e em que fase, pede avaliação. Para agendar, é só chamar no WhatsApp (31) 3868-1120.',
      hashtags: '#fisioterapiapelvica #gestante #gravidez #boladepilates #conceicaodomatodentro'
    }
  ];

  /* Bloco final da legenda: identificação de quem anuncia (a clínica é o
     local de atendimento, não a anunciante). */
  C.ASSINATURA = 'Vanessa Fernandes · Fisioterapeuta · CREFITO-4: 252806-F\nClínica Veracis · Rodovia MG-010, 598 · Bela Vista Mall · Conceição do Mato Dentro\n@vanessa.fernands · @clinicaveracis';
  C.RODAPE = 'Vanessa Fernandes · Fisioterapeuta · CREFITO-4: 252806-F';
  C.AGENDA = { linha1: 'Agende pelo WhatsApp', telefone: '(31) 3868-1120',
    local: 'Clínica Veracis · Rodovia MG-010, 598 · Bela Vista Mall · Conceição do Mato Dentro', insta: '@vanessa.fernands · @clinicaveracis' };

  /* "29/10/2026" a partir de "2026-10-29" (campo de data da página). */
  C.dataCurta = function (iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  };
  /* Sem data escolhida, o rodapé mostra o espaço em branco: a página não
     gera as imagens assim (a data da publicação é obrigatória na peça). */
  C.rodape = function (iso) { return C.RODAPE + ' · publicado em ' + (C.dataCurta(iso) || '__/__/____'); };
  C.legendaCompleta = function (c, iso) {
    var d = C.dataCurta(iso);
    return c.legenda + '\n\n' + C.ASSINATURA + (d ? '\nPublicado em ' + d : '') + '\n\n' + c.hashtags;
  };

  raiz.Carrossel = C;
  if (typeof module !== 'undefined') module.exports = C;

})(typeof window !== 'undefined' ? window : globalThis);
