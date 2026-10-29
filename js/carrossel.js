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
      /* o fecho fala com a gestante ("a sua gestação"): a política de
         atributos pessoais da Meta não deixa isso ir para anúncio */
      soOrganico: true,
      slides: [
        { tipo: 'capa', chamada: 'Gestação', titulo: 'Bola de pilates na gestação',
          texto: 'Movimentos suaves para fazer em casa', figura: 'bola-circulos-quadril.jpg', rodapeExtra: 'Arraste para o lado →',
          alt: 'Ilustração de gestante sentada numa bola de pilates. Título: Bola de pilates na gestação.' },
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
        { tipo: 'cuidados', titulo: 'Antes de começar',
          itens: ['Tapete que não escorrega e uma parede ou alguém por perto.',
                  'Pés bem apoiados no chão, o tempo todo.',
                  'Devagar e só até onde for confortável. Se doer, pare.'],
          alerta: 'Pare e procure sua obstetra ou o pronto atendimento se tiver sangramento, perda de líquido, contrações fortes antes da hora ou dor forte.',
          alt: 'Cuidados: tapete firme, apoio por perto, pés no chão, devagar. Quando parar e procurar a obstetra.' },
        { tipo: 'fecho', titulo: 'Cada gestação é de um jeito',
          texto: 'Quais movimentos fazem sentido para a sua, e em que fase, pede uma avaliação.',
          alt: 'Cada gestação é de um jeito. Agende pelo WhatsApp (31) 3868-1120, Clínica Veracis.' }
      ],
      legenda: 'A bola de pilates pode ser uma boa companheira na gestação. Separei quatro movimentos suaves para fazer em casa — arrasta para o lado.\n\n' +
        'Antes de começar: tapete que não escorrega, pés bem apoiados e uma parede ou alguém por perto. Se doer, pare.\n\n' +
        'Cada gestação é de um jeito. Quais movimentos fazem sentido para a sua, e em que fase, sai da avaliação. Para agendar, é só chamar no WhatsApp (31) 3868-1120.',
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
  C.rodape = function (iso) { var d = C.dataCurta(iso); return C.RODAPE + (d ? ' · publicado em ' + d : ''); };
  C.legendaCompleta = function (c) { return c.legenda + '\n\n' + C.ASSINATURA + '\n\n' + c.hashtags; };

  raiz.Carrossel = C;
  if (typeof module !== 'undefined') module.exports = C;

})(typeof window !== 'undefined' ? window : globalThis);
