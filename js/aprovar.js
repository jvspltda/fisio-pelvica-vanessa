/* ════════════════════════════════════════════════════════════════
   js/aprovar.js — O que espera o aval da Vanessa (conteúdo, sem DOM).

   A página aprovar.html mostra cada item com o texto ATUAL, lido dos
   próprios módulos (cartilhas, exercícios, plano, carrossel, roteiros):
   o que ela aprova é exatamente o que sai para a paciente ou para o
   Instagram. Ela marca "Aprovo" ou "Quero mudar" e devolve as respostas
   pelo WhatsApp.

   Depois de aprovado, o item sai desta lista (e da lista de pendências
   em docs/lyra/progresso.md). tests/aprovar.test.mjs confere que cada
   texto existe e que os links levam a páginas publicadas.
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var AP = {};

  function cartilha(A, id) { return A.CARTILHAS.filter(function (c) { return c.id === id; })[0]; }
  function figura(E, id) { return E.BIBLIOTECA.filter(function (b) { return b.id === id; })[0]; }
  /* blocos de uma cartilha como trechos: título do bloco + texto, lista e nota */
  function blocos(c) {
    return c.blocos.map(function (b) {
      return { rotulo: b.h, texto: b.p, lista: b.l, nota: b.nota };
    });
  }

  /* m = { A: Adherence, E: Exercicios, P: Plano, C: Carrossel, R: Roteiros } */
  AP.LISTA = [
    {
      id: 'carrossel-bola', desde: '2026-10-29', grupo: 'Instagram',
      titulo: 'Carrossel "Bola de pilates na gestação"',
      porque: 'Peça nova para o feed: 7 slides e a legenda. Só para post normal, sem "Impulsionar".',
      onde: [{ rotulo: 'Ver os slides', href: 'carrossel.html' }],
      trechos: function (m) {
        var c = m.C.LISTA.filter(function (x) { return x.id === 'bola-gestacao'; })[0];
        return c.slides.map(function (s, i) {
          return { rotulo: 'Slide ' + (i + 1) + (s.titulo ? ' — ' + s.titulo : ''),
            texto: [s.chamada && s.tipo !== 'capa' ? s.chamada : '', s.texto].filter(Boolean).join(' '),
            lista: s.itens, nota: s.alerta };
        }).concat([{ rotulo: 'Legenda', texto: c.legenda }]);
      }
    },
    {
      id: 'roteiro-p1', desde: '2026-09-29', grupo: 'Instagram',
      titulo: 'Roteiro de Reel P1 "Escape de xixi depois do parto"',
      porque: 'Rascunho no padrão de roteiro que você já aprovou.',
      onde: [{ rotulo: 'Ver o roteiro', href: 'roteiros.html#roteiro-P1' }],
      trechos: function (m) {
        var r = m.R.LISTA.filter(function (x) { return x.id === 'P1'; })[0];
        return r.cenas.map(function (c) { return { rotulo: c.tempo, texto: c.fala, nota: 'Na tela: ' + c.tela }; })
          .concat([{ rotulo: 'Legenda', texto: r.legenda }]);
      }
    },
    {
      id: 'cartilha-alimentos-bexiga', desde: '2026-10-29', grupo: 'Cartilhas',
      titulo: 'Cartilha nova "O que Você Come e Bebe e a Bexiga"',
      porque: 'Para perda de urina e urgência. Diz na folha que quem monta a dieta é a nutricionista ou o médico.',
      onde: [{ rotulo: 'Ver a folha', href: 'impressos/cartilhas.html#c-alimentos-bexiga' }],
      trechos: function (m) { return blocos(cartilha(m.A, 'alimentos-bexiga')); }
    },
    {
      id: 'cartilha-alimentos-gestacao', desde: '2026-10-29', grupo: 'Cartilhas',
      titulo: 'Cartilha nova "Bexiga e Intestino na Gestação"',
      porque: 'Para gestantes. Diz na folha que quem monta a alimentação é a obstetra ou a nutricionista.',
      onde: [{ rotulo: 'Ver a folha', href: 'impressos/cartilhas.html#c-alimentos-gestacao' }],
      trechos: function (m) { return blocos(cartilha(m.A, 'alimentos-gestacao')); }
    },
    {
      id: 'sinais-gestacao', desde: '2026-10-29', grupo: 'Cartilhas',
      titulo: 'Sinais de alerta da gestação, ampliados',
      porque: 'Mudou a cartilha de gestação que você já tinha aprovado. Entraram: tontura, falta de ar já antes de começar, ' +
        'fraqueza ou perda de equilíbrio, dor no peito, dor de cabeça forte e dor ou inchaço na batata da perna ' +
        '(lista do colégio americano de obstetras, ACOG). O mesmo texto vai no plano para casa e no carrossel.',
      onde: [{ rotulo: 'Ver a cartilha de gestação', href: 'impressos/cartilhas.html#c-gestacao' }],
      trechos: function (m) {
        return [{ rotulo: 'Como fica', texto: cartilha(m.A, 'gestacao').blocos.map(function (b) { return b.nota; }).filter(Boolean)[0] }];
      }
    },
    {
      id: 'frase-soltar-contrair', desde: '2026-10-29', grupo: 'Plano para casa',
      titulo: 'Frase para quem tem dor e também perde urina',
      porque: 'Aparece no plano quando a paciente está com "Foco em soltar" e o plano também manda contrair ' +
        '(cartilha de perda de urina ou um "Como fazer" com "contraia"). Antes, a folha só dizia "contraia", e isso confunde quem precisa soltar.',
      onde: [{ rotulo: 'Abrir o plano para casa', href: 'impressos/plano.html' }],
      trechos: function (m) { return [{ rotulo: 'Frase', texto: m.P.SOLTAR_E_CONTRAIR }]; }
    },
    {
      id: 'ressalvas-bola', desde: '2026-10-29', grupo: 'Plano para casa',
      titulo: 'Ressalvas novas no agachamento e na elevação do quadril',
      porque: 'Entraram depois da revisão de segurança: o agachamento ganhou o que fazer se doer na frente da pelve, ' +
        'e a elevação do quadril com os pés na bola só depois de conferir na sessão.',
      onde: [{ rotulo: 'Abrir o plano para casa', href: 'impressos/plano.html' }],
      trechos: function (m) {
        return [
          { rotulo: figura(m.E, 'bola-agachamento').titulo, texto: figura(m.E, 'bola-agachamento').descricao,
            nota: 'Trecho novo: ' + AP.NOVO['bola-agachamento'] },
          { rotulo: figura(m.E, 'bola-elevacao-quadril').titulo, texto: figura(m.E, 'bola-elevacao-quadril').descricao,
            nota: 'Trecho novo: ' + AP.NOVO['bola-elevacao-quadril'] }
        ];
      }
    },
    {
      id: 'como-fazer', desde: '2026-10-20', grupo: 'Plano para casa',
      titulo: 'Textos de "Como fazer" dos exercícios',
      porque: 'Vêm preenchidos quando você põe uma figura no plano (dá para mudar em cada plano). ' +
        'São os 5 de assoalho pélvico e os 8 de gestação com bola.',
      onde: [{ rotulo: 'Abrir o plano para casa', href: 'impressos/plano.html' }],
      trechos: function (m) {
        return m.E.BIBLIOTECA.map(function (b) {
          var g = m.E.GRUPOS.filter(function (x) { return x.id === b.grupo; })[0];
          return { rotulo: b.titulo + (g ? ' (' + g.titulo + ')' : ''), texto: b.descricao };
        });
      }
    },
    {
      id: 'quadro-gestacao', desde: '2026-10-20', grupo: 'Plano para casa',
      titulo: 'Quadro de segurança da gestação',
      porque: 'Sai sozinho no plano de toda paciente marcada como gestante, mesmo que ela só faça exercícios de assoalho.',
      onde: [{ rotulo: 'Abrir o plano para casa', href: 'impressos/plano.html' }],
      trechos: function (m) {
        var G = m.E.SEMPRE_GESTACAO;
        return [
          { rotulo: 'Sempre', lista: G.inicio.concat([G.restricao]) },
          { rotulo: 'Quando há exercício com bola', texto: G.bola },
          { rotulo: 'Quando há exercício deitada', texto: G.deitada },
          { rotulo: 'Quando parar', texto: G.sinais }
        ];
      }
    },
    {
      id: 'modelo-assoalho', desde: '2026-10-20', grupo: 'Plano para casa',
      titulo: 'Modelo pronto "Assoalho pélvico — deitada, sentada e em pé"',
      porque: 'Ponto de partida comum no pós-parto e na perda de urina: começa deitada e termina em pé. ' +
        'No plano, escolha este modelo em "Comece por".',
      onde: [{ rotulo: 'Abrir o plano para casa', href: 'impressos/plano.html' }],
      trechos: function (m) {
        var o = m.E.MODELOS_PRONTOS.filter(function (x) { return x.id === 'assoalho-progressao'; })[0];
        return [{ rotulo: 'Exercícios, nesta ordem', lista: o.itens.map(function (id) { return figura(m.E, id).titulo; }) }];
      }
    }

  ];

  /* Trechos acrescentados em textos que já existiam (a página e o teste
     conferem que continuam lá). */
  AP.NOVO = {
    'bola-agachamento': 'Desça só até onde for confortável; se doer na frente da pelve ou na virilha, desça menos e aproxime os pés.',
    'bola-elevacao-quadril': 'Faça só depois de conferirmos juntas na sessão.'
  };

  /* "29/10/2026" a partir de "2026-10-29" */
  AP.data = function (iso) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return p ? p[3] + '/' + p[2] + '/' + p[1] : '';
  };

  /* Impressão digital do texto de um item: se o texto mudar depois da
     resposta, a resposta antiga deixa de valer. */
  AP.assinatura = function (trechos) {
    var s = JSON.stringify(trechos), h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  };

  /* Texto para mandar pelo WhatsApp. respostas = { id: { voto, obs } } */
  AP.mensagem = function (respostas) {
    var linhas = ['Respostas da página "Para aprovar":', ''];
    var algum = false;
    AP.LISTA.forEach(function (it) {
      var r = respostas[it.id];
      if (!r || !r.voto) return;
      algum = true;
      linhas.push((r.voto === 'aprovo' ? '✅ Aprovo: ' : '✏️ Quero mudar: ') + it.titulo);
      if (r.obs && r.obs.trim()) linhas.push('   ' + r.obs.trim().replace(/\s*\n\s*/g, ' / '));
    });
    if (!algum) return '';
    var faltam = AP.LISTA.filter(function (it) { return !(respostas[it.id] && respostas[it.id].voto); }).length;
    if (faltam) linhas.push('', 'Ainda sem resposta: ' + faltam + (faltam === 1 ? ' item.' : ' itens.'));
    return linhas.join('\n');
  };

  raiz.Aprovar = AP;
  if (typeof module !== 'undefined') module.exports = AP;

})(typeof window !== 'undefined' ? window : globalThis);
