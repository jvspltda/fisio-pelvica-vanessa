/* ════════════════════════════════════════════════════════════════
   js/exercicios.js — Biblioteca da folha "Exercícios para casa".

   Fonte única: a página impressos/exercicios.html (gerada por
   tools/gerar-materiais-impressos.mjs) lê daqui, e o teste
   tests/exercicios.test.mjs confere.

   Ilustrações (nenhuma é foto de paciente):
   - assoalho pélvico: extraídas da cartilha da Vanessa
     (Referencias/Cartilha-Exercicios-original.pdf, 2026-09-29), 1536 × 1024 px
     (ou 1024 × 1536) — passam de 500 pontos por polegada na folha;
   - gestação com bola: recortadas das duas pranchas de 2026-10-29
     (Referencias/Exercicios-Bola-Gestacao-*.jpeg), sem o texto embutido, que
     tinha erros. Ficaram entre 250 e 450 pontos por polegada na folha.
   O teste confere a resolução no tamanho em que cada figura é impressa.

   As descrições são SUGESTÃO de ponto de partida: a Vanessa revisa e
   ajusta para cada paciente no próprio site. Nenhum número vem pronto —
   séries, repetições e tempos são sempre dela.
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var E = {};

  /* Grupos da biblioteca, na ordem em que aparecem no montador. */
  E.GRUPOS = [
    { id: 'assoalho', titulo: 'Assoalho pélvico' },
    { id: 'gestacao', titulo: 'Gestação com bola' }
  ];

  E.BIBLIOTECA = [
    { id: 'ponte', grupo: 'assoalho', titulo: 'Ponte', imagem: 'ponte.jpg', formato: 'deitada',
      descricao: 'Deitada de barriga para cima, joelhos dobrados e pés apoiados no chão, na largura do quadril. Solte o ar, contraia a musculatura lá embaixo e suba o quadril devagar. Desça devagar e solte tudo antes de repetir.' },
    { id: 'pernas-esticadas', grupo: 'assoalho', titulo: 'Deitada com as pernas esticadas', imagem: 'deitada-pernas-esticadas.jpg', formato: 'deitada',
      descricao: 'Deitada de barriga para cima, pernas esticadas e braços ao lado do corpo. Solte o ar e contraia a musculatura lá embaixo, sem apertar o bumbum nem as coxas. Segure e depois solte por completo.' },
    { id: 'joelhos-dobrados', grupo: 'assoalho', titulo: 'Deitada com os joelhos dobrados', imagem: 'deitada-joelhos-dobrados.jpg', formato: 'deitada',
      descricao: 'Deitada de barriga para cima, joelhos dobrados e pés apoiados no chão. Solte o ar e contraia a musculatura lá embaixo, sem tirar o quadril do chão. Segure e depois solte por completo.' },
    { id: 'sentada', grupo: 'assoalho', titulo: 'Sentada na cadeira', imagem: 'sentada-cadeira.jpg', formato: 'em-pe',
      descricao: 'Sentada com os pés bem apoiados no chão e a coluna alongada, sem encostar. Solte o ar e contraia a musculatura lá embaixo, sem apertar a barriga. Segure e depois solte por completo.' },
    { id: 'em-pe', grupo: 'assoalho', titulo: 'Em pé', imagem: 'em-pe.jpg', formato: 'em-pe',
      descricao: 'Em pé, pés afastados na largura do quadril e o peso dividido nos dois pés. Solte o ar e contraia a musculatura lá embaixo, sem apertar o bumbum. Segure e depois solte por completo.' },

    { id: 'bola-circulos', grupo: 'gestacao', titulo: 'Círculos com o quadril', imagem: 'bola-circulos-quadril.jpg', formato: 'em-pe',
      descricao: 'Sentada na bola, pés bem apoiados no chão e afastados, mãos na barriga ou nas coxas. Faça círculos lentos com o quadril para um lado e depois para o outro, com o tronco tranquilo.' },
    { id: 'bola-balanco', grupo: 'gestacao', titulo: 'Balanço para frente e para trás', imagem: 'bola-balanco.jpg', formato: 'em-pe',
      descricao: 'Sentada na bola, pés bem apoiados no chão e afastados. Leve o quadril para frente e para trás com suavidade, deixando a bola rolar só um pouquinho embaixo de você. O tronco acompanha, sem forçar.' },
    { id: 'bola-oito', grupo: 'gestacao', titulo: 'Oito com o quadril', imagem: 'bola-oito.jpg', formato: 'em-pe',
      descricao: 'Sentada na bola, pés bem apoiados no chão e afastados, mãos na barriga. Desenhe um oito deitado com o quadril, devagar, sentindo a pelve ir de um lado para o outro e para frente e para trás.' },
    { id: 'bola-respiracao', grupo: 'gestacao', titulo: 'Respiração sentada na bola', imagem: 'bola-respiracao.jpg', formato: 'em-pe',
      descricao: 'Sentada na bola, pés apoiados e afastados, mãos na barriga. Puxe o ar pelo nariz sentindo a barriga e as costelas se abrirem, e solte devagar pela boca. Se quiser, balance o quadril bem de leve enquanto respira.' },
    { id: 'bola-agachamento', grupo: 'gestacao', titulo: 'Agachamento com a bola na parede', imagem: 'bola-agachamento.jpg', formato: 'em-pe',
      descricao: 'Em pé, com a bola entre as costas e a parede, pés um pouco à frente do corpo e afastados na largura do quadril. Desça devagar, como se fosse sentar, deixando a bola rolar nas costas. Solte o ar ao subir. Desça só até onde for confortável.' },
    { id: 'ponte-gestacao', grupo: 'gestacao', titulo: 'Ponte', imagem: 'ponte-gestacao.jpg', formato: 'deitada',
      descricao: 'Deitada de barriga para cima, joelhos dobrados e pés apoiados no chão, na largura do quadril. Solte o ar e suba o quadril devagar, sem arquear as costas. Desça devagar, apoiando a coluna aos poucos.' },
    { id: 'bola-elevacao-quadril', grupo: 'gestacao', titulo: 'Elevação do quadril com os pés na bola', imagem: 'bola-elevacao-quadril.jpg', formato: 'deitada',
      descricao: 'Deitada de barriga para cima, pernas esticadas, calcanhares apoiados na bola e braços ao lado do corpo. Solte o ar e suba o quadril devagar, sem deixar a bola fugir. Desça devagar.' },
    { id: 'bola-flexao-joelhos', grupo: 'gestacao', titulo: 'Dobrar os joelhos puxando a bola', imagem: 'bola-flexao-joelhos.jpg', formato: 'deitada',
      descricao: 'Deitada de barriga para cima, pernas esticadas e pés apoiados na bola. Dobre os joelhos e traga a bola rolando em direção ao quadril, sem tirar as costas do chão. Estique as pernas devagar, levando a bola de volta.' }
  ];

  /* Sequências que já vêm prontas no montador (não podem ser apagadas).
     As duas de gestação reproduzem as pranchas de 2026-10-29, na mesma ordem. */
  E.MODELOS_PRONTOS = [
    { id: 'gestacao-mobilidade', nome: 'Gestação — mobilidade na bola',
      itens: ['bola-circulos', 'bola-balanco', 'bola-oito', 'bola-respiracao', 'bola-agachamento', 'ponte-gestacao'] },
    { id: 'gestacao-deitada', nome: 'Gestação — pernas na bola, deitada',
      itens: ['bola-elevacao-quadril', 'bola-flexao-joelhos'] },
    /* Progressão de posição (deitada → sentada → em pé), ponto de partida
       comum no pós-parto e na perda de urina. Sugestão: precisa do aval
       da Vanessa, como os textos de "Como fazer". */
    { id: 'assoalho-progressao', nome: 'Assoalho pélvico — deitada, sentada e em pé',
      itens: ['joelhos-dobrados', 'pernas-esticadas', 'sentada', 'em-pe'] }
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

  /* Para a gestação, no lugar (ou ao lado) das instruções de contração.
     Lastro, não citar na folha: ACOG Committee Opinion 804 (2020),
     "Physical Activity and Exercise During Pregnancy and the Postpartum
     Period" — sinais para interromper o exercício e evitar ficar muito
     tempo de barriga para cima quando dá sintoma. */
  E.SEMPRE_GESTACAO = {
    inicio: [
      'Respire de forma tranquila durante todo o movimento. Nunca prenda a respiração.',
      'Faça devagar e só até onde for confortável.'
    ],
    bola: 'Na bola, use um tapete que não escorregue e fique perto de uma parede ou de alguém, para ter apoio.',
    deitada: 'Deitada de barriga para cima, sentiu tontura, enjoo ou falta de ar? Vire de lado, espere passar e me avise.',
    /* mesmo texto da cartilha de gestação (js/adherence.js), já aprovado
       pela Vanessa; o teste confere que os dois não se separam */
    sinais: 'Procure sua obstetra ou o pronto atendimento se tiver sangramento, perda de líquido, contrações fortes e regulares antes da hora, dor forte, ou se o bebê mexer bem menos que o normal. Nesses casos, não faça os exercícios antes de ser avaliada.'
  };

  /* O quadro "Em todos os exercícios" da sequência montada.
     Só assoalho pélvico (ou nada): E.SEMPRE. Só gestação: respiração,
     ritmo e segurança. Misturada: as de contração mais as de segurança. */
  E.sempre = function (ids) {
    var itens = (ids || []).map(function (id) {
      for (var i = 0; i < E.BIBLIOTECA.length; i++) if (E.BIBLIOTECA[i].id === id) return E.BIBLIOTECA[i];
      return null;
    }).filter(Boolean);
    var gest = itens.filter(function (b) { return b.grupo === 'gestacao'; });
    if (!gest.length) return E.SEMPRE.slice();
    var G = E.SEMPRE_GESTACAO;
    var seguranca = [];
    if (gest.some(function (b) { return /^bola-/.test(b.id); })) seguranca.push(G.bola);
    if (itens.some(function (b) { return b.formato === 'deitada'; })) seguranca.push(G.deitada);
    seguranca.push(G.sinais);
    var fim = E.SEMPRE[E.SEMPRE.length - 1];
    var base = gest.length === itens.length ? G.inicio : E.SEMPRE.slice(0, -1);
    return base.concat(seguranca, [fim]);
  };

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
