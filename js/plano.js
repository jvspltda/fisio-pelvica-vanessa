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

  /* Quadro "Em todos os exercícios": o de js/exercicios.js, mas com a
     cartilha de dor no plano a instrução de contrair dá lugar à de soltar
     (mantendo os avisos de segurança da gestação, se houver). */
  P.sempre = function (E, itens) {
    var ids = (itens || []).filter(function (it) { return it.tipo === 'ex'; }).map(function (it) { return it.id; });
    var base = E.sempre(ids);
    var G = E.SEMPRE_GESTACAO;
    if (P.temas(itens).indexOf('dor') !== -1) {
      var seguranca = base.filter(function (s) { return s === G.bola || s === G.deitada || s === G.sinais; });
      base = P.SEMPRE_SOLTAR.concat(seguranca, [E.SEMPRE[E.SEMPRE.length - 1]]);
    }
    /* o aviso que já está no plano (destaque da cartilha de gestação)
       não se repete no quadro */
    var notas = (itens || []).filter(function (it) { return it.tipo === 'bloco'; }).map(function (it) { return String(it.nota || '').trim(); });
    return base.filter(function (s) { return notas.indexOf(s) === -1; });
  };

  /* ---------- estado guardado ----------
     Rascunhos e modelos antigos (só exercícios, sem "tipo") continuam
     valendo: cada item sem tipo é um exercício. */
  P.vazio = function () { return { titulo: '', vezes: '', recado: '', anotacao: true, itens: [] }; };
  P.limpo = function (s, E, A) {
    var r = P.vazio();
    if (!s || !Array.isArray(s.itens)) return r;
    var L = P.LIMITES;
    r.titulo = texto(s.titulo, L.titulo);
    r.vezes = texto(s.vezes, 4);
    r.recado = texto(s.recado, L.recado);
    r.anotacao = s.anotacao !== false;
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
