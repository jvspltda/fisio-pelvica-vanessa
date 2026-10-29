/* ════════════════════════════════════════════════════════════════
   js/plano.js — Núcleo do "Plano para casa" (sem DOM).

   Um plano junta, na ordem que a Vanessa escolher, dois tipos de peça:
     - orientação: um bloco de qualquer cartilha (js/adherence.js) ou
       escrito por ela — título, texto, lista e destaque;
     - exercício: uma figura da biblioteca (js/exercicios.js), com os
       números e o "como fazer".
   Assim a paciente leva um documento só: entender, fazer, hábitos e
   quando procurar ajuda, com um único quadro de agendamento.

   O texto das cartilhas continua vindo de js/adherence.js (fonte
   única). O que a Vanessa ajusta num plano fica só naquele plano.
   O nome da paciente nunca entra aqui: quem cuida dele é o
   tools/impressos-cliente.js, que só o põe na folha e no arquivo.

   A página é tools/plano-cliente.js; o teste, tests/plano.test.mjs.
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var P = {};

  P.LIMITES = { titulo: 80, h: 80, p: 700, item: 220, itens: 10, nota: 420, recado: 300 };

  /* Blocos de cartilha que só dizem "faça os exercícios combinados": o
     exercício novo entra logo depois deles, e não no fim do plano. */
  P.PONTO_EXERCICIOS = {
    gestacao: 'Seus exercícios',
    posparto: 'Quando voltar aos exercícios',
    incontinencia: 'O treino da musculatura',
    posprostatectomia: 'Deitado, sentado, em pé',
    dor: 'Aqui o exercício é soltar'
  };

  /* Dor na relação e dor pélvica: o exercício é soltar, não contrair.
     Frases tiradas da cartilha "Dor na Relação e Dor Pélvica", já
     aprovada; a última é a mesma de E.SEMPRE. */
  P.SEMPRE_SOLTAR = [
    'Aqui o exercício é soltar: quando a musculatura está tensa demais, apertar mais piora.',
    'Respiração lenta, com a barriga solta.',
    'Nunca insista na dor. Parar não é desistir: é não ensinar o corpo a ter medo.'
  ];

  function texto(v, max) { return String(v === undefined || v === null ? '' : v).slice(0, max); }

  /* Todos os blocos de todas as cartilhas, com a referência "tema/posição". */
  P.blocos = function (A) {
    var r = [];
    A.CARTILHAS.forEach(function (c) {
      c.blocos.forEach(function (b, i) {
        r.push({ ref: c.id + '/' + i, tema: c.id, temaTitulo: c.titulo, h: b.h || '', p: b.p || '', l: (b.l || []).slice(), nota: b.nota || '' });
      });
    });
    return r;
  };
  P.bloco = function (A, ref) {
    var m = /^([\w-]+)\/(\d+)$/.exec(String(ref || ''));
    if (!m) return null;
    var c = A.CARTILHAS.filter(function (x) { return x.id === m[1]; })[0];
    var b = c && c.blocos[+m[2]];
    return b ? { ref: ref, tema: c.id, temaTitulo: c.titulo, h: b.h || '', p: b.p || '', l: (b.l || []).slice(), nota: b.nota || '' } : null;
  };

  /* ---------- peças ---------- */
  P.orientacao = function (A, ref) {
    var b = ref ? P.bloco(A, ref) : null;
    return { tipo: 'bloco', ref: b ? b.ref : null, h: b ? b.h : '', p: b ? b.p : '', l: b ? b.l : [], nota: b ? b.nota : '' };
  };
  P.exercicio = function (E, id) {
    var b = null;
    for (var i = 0; i < E.BIBLIOTECA.length; i++) if (E.BIBLIOTECA[i].id === id) b = E.BIBLIOTECA[i];
    var p = {}; E.PARAMETROS.forEach(function (x) { p[x.id] = ''; });
    return { tipo: 'ex', id: b ? b.id : 'livre', titulo: b ? b.titulo : '', descricao: b ? b.descricao : '', params: p };
  };
  P.deCartilha = function (A, tema) {
    var c = A.CARTILHAS.filter(function (x) { return x.id === tema; })[0];
    return c ? c.blocos.map(function (_, i) { return P.orientacao(A, tema + '/' + i); }) : [];
  };

  /* Temas do plano: as cartilhas de onde vieram as orientações, na ordem. */
  P.temas = function (itens) {
    var r = [];
    (itens || []).forEach(function (it) {
      if (it.tipo === 'bloco' && it.ref) { var t = it.ref.split('/')[0]; if (r.indexOf(t) === -1) r.push(t); }
    });
    return r;
  };

  P.tituloPadrao = function (A, itens) {
    var t = P.temas(itens);
    var temEx = (itens || []).some(function (it) { return it.tipo === 'ex'; });
    if (t.length === 1 && !(temEx && !P.PONTO_EXERCICIOS[t[0]])) {
      return A.CARTILHAS.filter(function (c) { return c.id === t[0]; })[0].titulo;
    }
    if (!t.length && temEx) return 'Seus exercícios em casa';
    return 'Seu plano para casa';
  };

  /* Onde entra um exercício novo: depois do último exercício; se ainda
     não há nenhum, depois do bloco "faça os exercícios" da cartilha;
     senão, no fim. */
  P.posicaoExercicio = function (itens) {
    var i;
    for (i = itens.length - 1; i >= 0; i--) if (itens[i].tipo === 'ex') return i + 1;
    for (i = 0; i < itens.length; i++) {
      var it = itens[i];
      if (it.tipo === 'bloco' && it.ref && P.PONTO_EXERCICIOS[it.ref.split('/')[0]] === it.h) return i + 1;
    }
    return itens.length;
  };

  /* Perfil da paciente. Não se adivinha pelo tipo de exercício: uma
     gestante pode receber só exercícios de assoalho (deitada!), e uma
     paciente de dor, só exercícios sem a cartilha de dor. Por isso o
     plano guarda duas marcas que a Vanessa confere no painel; elas se
     ligam sozinhas quando entra algo desses temas (P.perfilSugerido). */
  P.perfilSugerido = function (E, itens) {
    var t = P.temas(itens);
    var gestEx = (itens || []).some(function (it) {
      if (it.tipo !== 'ex') return false;
      var b = E.BIBLIOTECA.filter(function (x) { return x.id === it.id; })[0];
      return !!b && b.grupo === 'gestacao';
    });
    return { gestante: t.indexOf('gestacao') !== -1 || t.indexOf('alimentos-gestacao') !== -1 || gestEx, soltar: t.indexOf('dor') !== -1 };
  };
  P.perfil = function (E, itens, marcado) {
    var sug = P.perfilSugerido(E, itens), m = marcado || {};
    return { gestante: !!(m.gestante || sug.gestante), soltar: !!(m.soltar || sug.soltar) };
  };

  /* Dor junto com um tema de treino de força (perda de urina, urgência,
     próstata): a folha diria "soltar" e "aperte antes do esforço". Esta
     frase desfaz o conflito — sugestão, aguarda o aval da Vanessa. */
  P.SOLTAR_E_CONTRAIR = 'Contrair, só o que combinamos na sessão. No resto do dia, a prioridade é soltar.';
  var TEMAS_CONTRAIR = ['incontinencia', 'urgencia', 'posprostatectomia', 'vesical'];

  /* Quadro "Em todos os exercícios", montado pelo perfil:
     - base: soltar (dor) ou contrair (assoalho); só exercícios de bola,
       sem foco em soltar → respiração e ritmo;
     - gestante: restrição da obstetra, bola, barriga para cima, sinais;
     - fecho: "Sentiu dor ou ficou em dúvida…".
     O aviso que a cartilha já trouxe ANTES dos exercícios não se repete. */
  P.sempre = function (E, itens, marcado) {
    itens = itens || [];
    var G = E.SEMPRE_GESTACAO, perfil = P.perfil(E, itens, marcado);
    var ex = itens.filter(function (it) { return it.tipo === 'ex'; });
    var doLivro = ex.map(function (it) { return E.BIBLIOTECA.filter(function (b) { return b.id === it.id; })[0]; }).filter(Boolean);
    var soBola = doLivro.length > 0 && doLivro.length === ex.length && doLivro.every(function (b) { return b.grupo === 'gestacao'; });
    var fim = E.SEMPRE[E.SEMPRE.length - 1];
    var base;
    if (perfil.soltar) {
      base = P.SEMPRE_SOLTAR.slice();
      if (P.temas(itens).some(function (t) { return TEMAS_CONTRAIR.indexOf(t) !== -1; })) base.push(P.SOLTAR_E_CONTRAIR);
    } else base = soBola ? G.inicio.slice() : E.SEMPRE.slice(0, -1);
    var seguranca = [];
    if (perfil.gestante) {
      seguranca.push(G.restricao);
      if (doLivro.some(function (b) { return /^bola-/.test(b.id); })) seguranca.push(G.bola);
      if (doLivro.some(function (b) { return b.formato === 'deitada'; })) seguranca.push(G.deitada);
      seguranca.push(G.sinais);
    }
    var r = base.concat(seguranca.filter(function (x) { return base.indexOf(x) === -1; }), [fim]);
    var primeiro = -1;
    for (var k = 0; k < itens.length; k++) if (itens[k].tipo === 'ex') { primeiro = k; break; }
    var notasAntes = itens.slice(0, primeiro < 0 ? itens.length : primeiro)
      .filter(function (it) { return it.tipo === 'bloco'; }).map(function (it) { return String(it.nota || '').trim(); });
    return r.filter(function (x) { return notasAntes.indexOf(x) === -1; });
  };

  /* Avisos para a Vanessa no painel (não vão para a folha). */
  P.LIMITE_EXERCICIOS = 8;
  P.avisos = function (E, A, itens, marcado) {
    itens = itens || [];
    var r = [], perfil = P.perfil(E, itens, marcado), t = P.temas(itens);
    var ex = itens.filter(function (it) { return it.tipo === 'ex'; });
    if (perfil.soltar) {
      var n = ex.filter(function (it) { return /contra[ií]/i.test(it.descricao || ''); }).length;
      if (n) r.push('Plano com foco em soltar, mas ' + (n === 1 ? 'um exercício fala' : n + ' exercícios falam') + ' em contrair. Revise o "Como fazer".');
    }
    if (t.indexOf('posprostatectomia') !== -1 && ex.length)
      r.push('Plano de próstata: os textos e as figuras dos exercícios estão no feminino. Ajuste para o paciente.');
    var vistos = {};
    itens.forEach(function (it) {
      if (it.tipo !== 'bloco') return;
      var h = String(it.h || '').trim().toLowerCase();
      if (h) vistos[h] = (vistos[h] || 0) + 1;
    });
    Object.keys(vistos).forEach(function (h) {
      if (vistos[h] > 1) r.push('"' + itens.filter(function (it) { return it.tipo === 'bloco' && String(it.h || '').trim().toLowerCase() === h; })[0].h + '" aparece ' + vistos[h] + ' vezes. Deixe um só.');
    });
    if (ex.length > P.LIMITE_EXERCICIOS) r.push(ex.length + ' exercícios é muito para casa. Veja se dá para dividir em fases.');
    if (t.length > 2) r.push('Plano com ' + t.length + ' temas. Veja se tudo é para agora.');
    return r;
  };

  /* ---------- estado guardado ----------
     Rascunhos e modelos antigos (só exercícios, sem "tipo") continuam
     valendo: cada item sem tipo é um exercício. */
  P.vazio = function () { return { titulo: '', vezes: '', recado: '', anotacao: true, gestante: false, soltar: false, itens: [] }; };
  P.limpo = function (s, E, A) {
    var r = P.vazio();
    if (!s || !Array.isArray(s.itens)) return r;
    var L = P.LIMITES;
    r.titulo = texto(s.titulo, L.titulo);
    r.vezes = texto(s.vezes, 4);
    r.recado = texto(s.recado, L.recado);
    r.anotacao = s.anotacao !== false;
    r.gestante = s.gestante === true;
    r.soltar = s.soltar === true;
    var temId = function (id) { return id === 'livre' || E.BIBLIOTECA.some(function (b) { return b.id === id; }); };
    s.itens.forEach(function (it) {
      if (!it || typeof it !== 'object') return;
      if (it.tipo === 'bloco') {
        var ref = it.ref && P.bloco(A, it.ref) ? String(it.ref) : null;
        r.itens.push({ tipo: 'bloco', ref: ref, h: texto(it.h, L.h), p: texto(it.p, L.p),
          l: (Array.isArray(it.l) ? it.l : []).slice(0, L.itens).map(function (x) { return texto(x, L.item); }).filter(function (x) { return x.trim(); }),
          nota: texto(it.nota, L.nota) });
      } else if (temId(it.id)) {
        var p = {};
        E.PARAMETROS.forEach(function (x) { p[x.id] = texto((it.params || {})[x.id], 7); });
        r.itens.push({ tipo: 'ex', id: it.id, titulo: texto(it.titulo, 60), descricao: texto(it.descricao, E.LIMITE_DESCRICAO), params: p });
      }
    });
    return r;
  };

  raiz.Plano = P;
  if (typeof module !== 'undefined') module.exports = P;

})(typeof window !== 'undefined' ? window : globalThis);
