/* ════════════════════════════════════════════════════════════════
   js/exercicios.js — Biblioteca da folha "Exercícios para casa".

   Fonte única: a página impressos/exercicios.html (gerada por
   tools/gerar-materiais-impressos.mjs) lê daqui, e o teste
   tests/exercicios.test.mjs confere.

   Ilustrações: extraídas da cartilha da Vanessa (Referencias/Cartilha-Exercicios-original.pdf, 2026-09-29),
   1536 × 1024 px (ou 1024 × 1536). Na folha, a maior tem 74 mm de largura —
   passa de 500 pontos por polegada, sobra para impressão.

   As descrições são SUGESTÃO de ponto de partida: a Vanessa revisa e
   ajusta para cada paciente no próprio site. Nenhum número vem pronto —
   séries, repetições e tempos são sempre dela.
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var E = {};

  E.BIBLIOTECA = [
    { id: 'ponte', titulo: 'Ponte', imagem: 'ponte.jpg', formato: 'deitada',
      descricao: 'Deitada de barriga para cima, joelhos dobrados e pés apoiados no chão, na largura do quadril. Solte o ar, contraia a musculatura lá embaixo e suba o quadril devagar. Desça devagar e solte tudo antes de repetir.' },
    { id: 'pernas-esticadas', titulo: 'Deitada com as pernas esticadas', imagem: 'deitada-pernas-esticadas.jpg', formato: 'deitada',
      descricao: 'Deitada de barriga para cima, pernas esticadas e braços ao lado do corpo. Solte o ar e contraia a musculatura lá embaixo, sem apertar o bumbum nem as coxas. Segure e depois solte por completo.' },
    { id: 'joelhos-dobrados', titulo: 'Deitada com os joelhos dobrados', imagem: 'deitada-joelhos-dobrados.jpg', formato: 'deitada',
      descricao: 'Deitada de barriga para cima, joelhos dobrados e pés apoiados no chão. Solte o ar e contraia a musculatura lá embaixo, sem tirar o quadril do chão. Segure e depois solte por completo.' },
    { id: 'sentada', titulo: 'Sentada na cadeira', imagem: 'sentada-cadeira.jpg', formato: 'em-pe',
      descricao: 'Sentada com os pés bem apoiados no chão e a coluna alongada, sem encostar. Solte o ar e contraia a musculatura lá embaixo, sem apertar a barriga. Segure e depois solte por completo.' },
    { id: 'em-pe', titulo: 'Em pé', imagem: 'em-pe.jpg', formato: 'em-pe',
      descricao: 'Em pé, pés afastados na largura do quadril e o peso dividido nos dois pés. Solte o ar e contraia a musculatura lá embaixo, sem apertar o bumbum. Segure e depois solte por completo.' }
  ];

  /* Os campos de número de cada exercício, na ordem em que aparecem. */
  E.PARAMETROS = [
    { id: 'series', rotulo: 'Séries', sufixo: function (v) { return v + (v === '1' ? ' série' : ' séries'); } },
    { id: 'repeticoes', rotulo: 'Repetições', sufixo: function (v) { return v + (v === '1' ? ' repetição' : ' repetições'); } },
    { id: 'segurar', rotulo: 'Segurar (s)', sufixo: function (v) { return 'segurar ' + v + ' s'; } },
    { id: 'descansar', rotulo: 'Descansar (s)', sufixo: function (v) { return 'descansar ' + v + ' s'; } }
  ];

  /* "Em todos os exercícios": as instruções de js/adherence.js
     (INSTRUCOES_RESPIRATORIAS e INSTRUCOES_PROPRIOCEPTIVAS) em linguagem
     de paciente, no tom das cartilhas. */
  E.SEMPRE = [
    'Solte o ar devagar enquanto contrai. Nunca prenda a respiração.',
    'Contraia só a musculatura lá embaixo, a que segura o xixi. Barriga, bumbum e coxas ficam soltos.',
    'Solte por completo entre uma contração e outra: relaxar também faz parte do exercício.',
    'Ombros e mandíbula soltos.',
    'Sentiu dor ou ficou em dúvida se está fazendo certo? Pare e me mande mensagem.'
  ];

  E.LIMITE_DESCRICAO = 420;
  E.LIMITE_RECADO = 300;

  /* Texto de uma linha com os números preenchidos: "3 séries · 10 repetições". */
  E.resumoParametros = function (p) {
    p = p || {};
    return E.PARAMETROS.filter(function (x) { return p[x.id] !== undefined && String(p[x.id]).trim() !== ''; })
      .map(function (x) { return x.sufixo(String(p[x.id]).trim()); }).join(' · ');
  };

  raiz.Exercicios = E;
  if (typeof module !== 'undefined') module.exports = E;

})(typeof window !== 'undefined' ? window : globalThis);
