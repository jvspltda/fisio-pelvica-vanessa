/* ----------------------------------------------------------------
   tools/plano-cliente.js

   Montador do "Plano para casa". O gerador
   (tools/gerar-materiais-impressos.mjs) embute este arquivo, o
   js/adherence.js, o js/exercicios.js e o js/plano.js na página; não é
   carregado sozinho.

   A Vanessa junta, na ordem que quiser, orientações (blocos de qualquer
   cartilha, ou escritas por ela) e exercícios com figura. A folha A4 é
   montada ao vivo e paginada por medida: nenhuma orientação ou
   exercício fica partido entre duas folhas.

   O que fica salvo NESTE navegador (localStorage), e nada mais:
     - o rascunho do plano atual;
     - os modelos que ela nomear ("Pós-parto — fase 1").
   As chaves são as da antiga folha de exercícios, para os modelos que
   ela já tinha continuarem aparecendo (Plano.limpo os converte).
   O nome da paciente nunca é salvo: é tratado pelo
   tools/impressos-cliente.js, que só o põe na folha e no arquivo.
   ---------------------------------------------------------------- */
(function () {
  'use strict';

  var A = window.Adherence, E = window.Exercicios, P = window.Plano;
  var CHAVE_RASCUNHO = 'vf-exercicios-rascunho';
  var CHAVE_MODELOS = 'vf-exercicios-modelos';
  var PASTA = '../assets/exercicios/';
  /* no painel, miniaturas leves (assets/exercicios/mini/); na folha, a figura de impressão */
  var MINI = PASTA + 'mini/';
  var FOLHAS_DEMAIS = 3;

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined && texto !== null) e.textContent = texto;
    return e;
  }
  function ler(chave, padrao) {
    try { var v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; } catch (e) { return false; }
  }
  function daBiblioteca(id) {
    for (var i = 0; i < E.BIBLIOTECA.length; i++) if (E.BIBLIOTECA[i].id === id) return E.BIBLIOTECA[i];
    return null;
  }
  function cartilha(id) { return A.CARTILHAS.filter(function (c) { return c.id === id; })[0] || null; }
  var seq = 0;
  function uid() { seq += 1; return 'x' + Date.now().toString(36) + seq; }
  function comUid(it) { it.uid = uid(); return it; }

  /* ---------- estado ---------- */
  function limpo(s) { var r = P.limpo(s, E, A); r.itens.forEach(comUid); return r; }
  var estado = limpo(ler(CHAVE_RASCUNHO, null));
  function paraGuardar(s) {
    return { titulo: s.titulo, vezes: s.vezes, recado: s.recado, anotacao: s.anotacao, gestante: s.gestante, soltar: s.soltar, itens: s.itens.map(function (it) {
      return it.tipo === 'bloco'
        ? { tipo: 'bloco', ref: it.ref, h: it.h, p: it.p, l: it.l, nota: it.nota }
        : { tipo: 'ex', id: it.id, titulo: it.titulo, descricao: it.descricao, params: it.params };
    }) };
  }
  var tGravar = null;
  function gravarRascunhoJa() {
    if (tGravar === null) return;
    clearTimeout(tGravar); tGravar = null;
    gravar(CHAVE_RASCUNHO, paraGuardar(estado));
  }
  function salvarRascunho() {
    clearTimeout(tGravar);
    tGravar = setTimeout(function () { tGravar = null; gravar(CHAVE_RASCUNHO, paraGuardar(estado)); }, 300);
  }
  /* fechou a aba logo depois de digitar: grava o que ainda estava na espera */
  window.addEventListener('pagehide', gravarRascunhoJa);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') gravarRascunhoJa(); });

  function inserirExercicio(it) {
    var pos = P.posicaoExercicio(estado.itens);
    estado.itens.splice(pos, 0, comUid(it));
    return pos;
  }

  /* Segundo toque na figura ou na orientação: tira as cópias que estão
     como vieram. Uma cópia ajustada (números, texto) não some num toque:
     para ela, o ✕ da lista ou os dois cliques na folha.
     Devolve 'tirou', 'ajustada' (há cópia ajustada e nada foi tirado) ou ''. */
  function ajustada(it) {
    if (it.tipo === 'ex') {
      var b = daBiblioteca(it.id);
      return E.PARAMETROS.some(function (x) { return String(it.params[x.id] || '').trim(); }) ||
        !b || it.titulo !== b.titulo || it.descricao !== b.descricao;
    }
    var o = it.ref ? P.bloco(A, it.ref) : null;
    return !o || it.h !== o.h || it.p !== o.p || it.nota !== o.nota || JSON.stringify(it.l) !== JSON.stringify(o.l);
  }
  function tirarTodos(teste) {
    var achados = estado.itens.filter(teste);
    if (!achados.length) return '';
    var intactos = achados.filter(function (it) { return !ajustada(it); });
    if (!intactos.length) return 'ajustada';
    estado.itens = estado.itens.filter(function (it) { return intactos.indexOf(it) === -1; });
    return 'tirou';
  }
  /* figuras e orientações que já estão no plano ficam marcadas (✓) */
  function marcarEscolhidos() {
    var ids = {}, refs = {};
    estado.itens.forEach(function (it) { if (it.tipo === 'ex') ids[it.id] = true; else if (it.ref) refs[it.ref] = true; });
    document.querySelectorAll('#e-biblioteca [data-id]').forEach(function (b) {
      var sim = !!ids[b.getAttribute('data-id')];
      b.classList.toggle('no-plano', sim); b.setAttribute('aria-pressed', sim ? 'true' : 'false');
    });
    document.querySelectorAll('#e-orientacoes [data-ref]').forEach(function (b) {
      var sim = !!refs[b.getAttribute('data-ref')];
      b.classList.toggle('no-plano', sim); b.setAttribute('aria-pressed', sim ? 'true' : 'false');
    });
    document.querySelectorAll('#e-orientacoes details.tema').forEach(function (d) {
      var n = d.querySelectorAll('.bloco-op.no-plano').length;
      d.querySelector('.conta').textContent = n ? n + ' no plano' : String(d.querySelectorAll('.bloco-op').length);
    });
  }

  /* ---------- editor ---------- */
  var aviso = $('e-aviso');
  function avisar(t) { aviso.textContent = t || ''; }

  function campo(rotulo, input) {
    var l = el('label', 'campo');
    l.appendChild(el('span', null, rotulo));
    l.appendChild(input);
    return l;
  }
  function botao(texto, classe, fn, titulo) {
    var b = el('button', classe || '', texto);
    b.type = 'button';
    if (titulo) { b.title = titulo; b.setAttribute('aria-label', titulo); }
    b.addEventListener('click', fn);
    return b;
  }
  function areaTexto(valor, max, linhas, aoMudar) {
    var ta = el('textarea'); ta.rows = linhas; ta.maxLength = max; ta.value = valor;
    ta.addEventListener('input', function () { aoMudar(ta.value); });
    return ta;
  }

  /* 1 · orientações: os blocos de cada cartilha, recolhidos por tema */
  function montarOrientacoes() {
    var alvo = $('e-orientacoes');
    alvo.appendChild(botao('+ Orientação escrita por você', 'nova-orientacao', function () {
      estado.itens.push(comUid(P.orientacao(A, null)));
      foco = { item: estado.itens.length - 1, seletor: 'input' };
      mudouEstrutura('Orientação em branco no fim do plano. Dê um título e escreva o texto.');
    }));
    A.CARTILHAS.forEach(function (c) {
      var d = el('details', 'tema');
      var s = el('summary', null, c.titulo);
      s.appendChild(el('span', 'conta', String(c.blocos.length)));
      d.appendChild(s);
      d.appendChild(el('p', 'apoio', c.resumo));
      var g = el('div', 'blocos');
      c.blocos.forEach(function (b, i) {
        var ref = c.id + '/' + i;
        var bt = botao(b.h, 'bloco-op', function () {
          /* segundo toque no que já está no plano: tira */
          var t = tirarTodos(function (it) { return it.tipo === 'bloco' && it.ref === ref; });
          if (t === 'tirou') { mudouEstrutura('"' + b.h + '" saiu do plano. Toque de novo para pôr de volta.'); return; }
          if (t === 'ajustada') { avisar('"' + b.h + '" está no plano com texto ajustado. Para tirar, use o ✕ na lista ou dois cliques na folha.'); return; }
          estado.itens.push(comUid(P.orientacao(A, ref)));
          mudouEstrutura('"' + b.h + '" entrou no fim do plano. Toque de novo para tirar.');
        });
        bt.setAttribute('data-ref', ref);
        bt.title = b.p || (b.l || []).join(' · ') || b.nota || '';
        g.appendChild(bt);
      });
      g.appendChild(botao('Colocar a cartilha inteira', 'discreto', function () {
        var ja = 0;
        P.deCartilha(A, c.id).forEach(function (it) {
          if (estado.itens.some(function (x) { return x.tipo === 'bloco' && x.ref === it.ref; })) { ja++; return; }
          estado.itens.push(comUid(it));
        });
        var total = c.blocos.length;
        mudouEstrutura(ja === total ? 'A cartilha "' + c.titulo + '" já estava inteira no plano.'
          : 'Cartilha "' + c.titulo + '" no fim do plano' + (ja ? ' — ' + ja + (ja > 1 ? ' blocos já estavam e não se repetiram.' : ' bloco já estava e não se repetiu.') : '.'));
      }));
      d.appendChild(g);
      alvo.appendChild(d);
    });
  }

  /* 2 · exercícios: as figuras por grupo */
  function montarBiblioteca() {
    var raizBib = $('e-biblioteca');
    var alvo = null;
    function grupo(titulo) {
      raizBib.appendChild(el('p', 'grupo', titulo));
      alvo = el('div', 'biblioteca');
      raizBib.appendChild(alvo);
    }
    function miniatura(b) {
      var bt = el('button', 'miniatura');
      bt.type = 'button';
      var img = el('img'); img.src = MINI + b.imagem; img.alt = ''; img.loading = 'lazy';
      bt.appendChild(img);
      bt.appendChild(el('span', 'nome', b.titulo));
      bt.setAttribute('data-id', b.id);
      bt.addEventListener('click', function () {
        /* segundo toque no que já está no plano: tira (para repetir de
           propósito, use o botão de duplicar na lista) */
        var t = tirarTodos(function (it) { return it.tipo === 'ex' && it.id === b.id; });
        if (t === 'tirou') { mudouEstrutura('"' + b.titulo + '" saiu do plano. Toque de novo para pôr de volta.'); return; }
        if (t === 'ajustada') { avisar('"' + b.titulo + '" está no plano com números ou texto ajustados. Para tirar, use o ✕ na lista ou dois cliques na folha; para repetir, o ⧉.'); return; }
        inserirExercicio(P.exercicio(E, b.id));
        mudouEstrutura('"' + b.titulo + '" entrou no plano, junto dos outros exercícios. Toque de novo para tirar.');
      });
      alvo.appendChild(bt);
    }
    E.GRUPOS.forEach(function (g) {
      grupo(g.titulo);
      E.BIBLIOTECA.filter(function (b) { return b.grupo === g.id; }).forEach(miniatura);
    });
    grupo('Outro');
    var livre = el('button', 'miniatura livre');
    livre.type = 'button';
    livre.appendChild(el('span', 'mais', '+'));
    livre.appendChild(el('span', null, 'Exercício sem imagem'));
    livre.addEventListener('click', function () {
      var pos = inserirExercicio(P.exercicio(E, 'livre'));
      foco = { item: pos, seletor: 'input' };
      mudouEstrutura('Exercício sem imagem entrou no plano. Dê um nome a ele.');
    });
    alvo.appendChild(livre);
  }

  /* 3 · o plano: orientações e exercícios na mesma lista */
  function cabecalhoItem(it, i, tag, titulo, rotulo) {
    var cab = el('div', 'item-cab');
    cab.appendChild(el('span', 'num', String(i + 1)));
    if (it.tipo === 'ex') {
      var b = daBiblioteca(it.id);
      if (b) { var im = el('img'); im.src = MINI + b.imagem; im.alt = ''; cab.appendChild(im); }
    }
    var tit = el('input'); tit.type = 'text'; tit.value = titulo; tit.maxLength = it.tipo === 'ex' ? 60 : P.LIMITES.h;
    tit.placeholder = rotulo; tit.setAttribute('aria-label', rotulo + ' ' + (i + 1));
    tit.addEventListener('input', function () { if (it.tipo === 'ex') it.titulo = tit.value; else it.h = tit.value; mudouTexto(); });
    cab.appendChild(tit);
    var acoes = el('div', 'acoes');
    var sobe = botao('↑', 'sobe', function () { mover(i, -1); }, 'Subir'); sobe.disabled = i === 0;
    var desce = botao('↓', 'desce', function () { mover(i, 1); }, 'Descer'); desce.disabled = i === estado.itens.length - 1;
    acoes.appendChild(sobe); acoes.appendChild(desce);
    acoes.appendChild(botao('⧉', 'duplicar', function () {
      var copia = JSON.parse(JSON.stringify(it)); delete copia.uid;
      estado.itens.splice(i + 1, 0, comUid(copia));
      foco = { item: i + 1, seletor: 'input' };
      mudouEstrutura((it.tipo === 'ex' ? 'Exercício' : 'Orientação') + ' repetido logo abaixo.');
    }, 'Repetir logo abaixo'));
    acoes.appendChild(botao('✕', 'tirar', function () {
      estado.itens.splice(i, 1);
      foco = { item: Math.min(i, estado.itens.length - 1), seletor: '.tirar' };
      mudouEstrutura((it.tipo === 'ex' ? 'Exercício' : 'Orientação') + ' retirado do plano.');
    }, 'Tirar do plano'));
    cab.appendChild(acoes);
    var t = el('p', 'tag ' + it.tipo, tag);
    return [t, cab];
  }

  function itemOrientacao(it, i) {
    var c = el('div', 'item orientacao');
    var orig = it.ref ? P.bloco(A, it.ref) : null;
    var tag = orig ? 'Orientação · da cartilha "' + orig.temaTitulo + '"' : 'Orientação · escrita por você';
    cabecalhoItem(it, i, tag, it.h, 'Título da orientação').forEach(function (n) { c.appendChild(n); });
    c.appendChild(campo('Texto', areaTexto(it.p, P.LIMITES.p, 3, function (v) { it.p = v; mudouTexto(); })));
    var lista = areaTexto(it.l.join('\n'), P.LIMITES.item * P.LIMITES.itens, Math.min(5, Math.max(2, it.l.length)), function (v) {
      it.l = v.split('\n').map(function (x) { return x.slice(0, P.LIMITES.item); }).filter(function (x) { return x.trim(); }).slice(0, P.LIMITES.itens);
      mudouTexto();
    });
    var nota = areaTexto(it.nota, P.LIMITES.nota, 2, function (v) { it.nota = v; mudouTexto(); });
    var cl = campo('Lista — um item por linha', lista), cn = campo('Destaque (quadro em cinza)', nota);
    var rod = el('div', 'item-rod');
    if (!it.l.length) { cl.hidden = true; rod.appendChild(botao('+ lista', 'discreto', function () { cl.hidden = false; this.remove(); lista.focus(); })); }
    if (!it.nota) { cn.hidden = true; rod.appendChild(botao('+ destaque', 'discreto', function () { cn.hidden = false; this.remove(); nota.focus(); })); }
    c.appendChild(cl); c.appendChild(cn);
    if (orig) rod.appendChild(botao('Voltar ao texto da cartilha', 'discreto', function () {
      it.h = orig.h; it.p = orig.p; it.l = orig.l.slice(); it.nota = orig.nota;
      foco = { item: i, seletor: 'input' };
      mudouEstrutura('Texto da cartilha de volta.');
    }));
    c.appendChild(rod);
    return c;
  }

  function itemExercicio(it, i) {
    var b = daBiblioteca(it.id);
    var c = el('div', 'item exercicio');
    cabecalhoItem(it, i, 'Exercício', it.titulo, 'Nome do exercício').forEach(function (n) { c.appendChild(n); });
    var nums = el('div', 'nums');
    E.PARAMETROS.forEach(function (x) {
      var inp = el('input'); inp.type = 'text'; inp.inputMode = 'numeric'; inp.maxLength = 7;
      inp.value = it.params[x.id]; inp.placeholder = '—';
      inp.addEventListener('input', function () { it.params[x.id] = inp.value; mudouTexto(); });
      nums.appendChild(campo(x.rotulo, inp));
    });
    c.appendChild(nums);
    var cont = el('span', 'contador');
    var ta = areaTexto(it.descricao, E.LIMITE_DESCRICAO, 4, function (v) { it.descricao = v; conta(); mudouTexto(); });
    ta.placeholder = 'Como fazer';
    function conta() { cont.textContent = ta.value.length + ' / ' + E.LIMITE_DESCRICAO; }
    conta();
    c.appendChild(campo('Como fazer', ta));
    var rod = el('div', 'item-rod');
    rod.appendChild(cont);
    if (b) rod.appendChild(botao('Voltar ao texto sugerido', 'discreto', function () {
      it.descricao = b.descricao; ta.value = b.descricao; conta(); mudouTexto();
    }));
    c.appendChild(rod);
    return c;
  }

  function montarLista() {
    var lista = $('e-lista');
    lista.textContent = '';
    if (!estado.itens.length) {
      lista.appendChild(el('p', 'vazio', 'O plano está vazio. Comece por uma cartilha ou um modelo lá em cima, ou escolha orientações e exercícios acima.'));
      return;
    }
    estado.itens.forEach(function (it, i) { lista.appendChild(it.tipo === 'bloco' ? itemOrientacao(it, i) : itemExercicio(it, i)); });
  }

  function mover(i, d) {
    var j = i + d;
    if (j < 0 || j >= estado.itens.length) return;
    var t = estado.itens[i]; estado.itens[i] = estado.itens[j]; estado.itens[j] = t;
    /* o foco acompanha a peça que mudou de lugar; na ponta, vai para a outra seta */
    var sel = d < 0 ? (j === 0 ? '.desce' : '.sobe') : (j === estado.itens.length - 1 ? '.sobe' : '.desce');
    foco = { item: j, seletor: sel };
    mudouEstrutura();
  }

  /* depois de remontar a lista, devolve o foco ao botão certo (teclado) */
  var foco = null;
  function devolverFoco() {
    if (!foco) return;
    var itens = document.querySelectorAll('#e-lista .item');
    var alvo = itens[foco.item] && itens[foco.item].querySelector(foco.seletor);
    if (alvo && alvo.disabled) alvo = itens[foco.item].querySelector('input');
    if (alvo) alvo.focus();
    foco = null;
  }

  /* 4 · para o plano todo */
  function montarGerais() {
    $('e-titulo').value = estado.titulo;
    $('e-titulo').placeholder = P.tituloPadrao(A, estado.itens);
    $('e-vezes').value = estado.vezes;
    $('e-recado').value = estado.recado;
    $('e-anotacao').checked = estado.anotacao;
    montarPerfil();
  }
  /* Perfil: a cartilha (ou os exercícios de bola) liga a marca sozinha e
     ela fica travada enquanto o tema estiver no plano; sem o tema, a
     Vanessa marca à mão (gestante só com exercícios de assoalho, etc.). */
  function montarPerfil() {
    var sug = P.perfilSugerido(E, estado.itens);
    [['gestante', 'e-gestante'], ['soltar', 'e-soltar']].forEach(function (par) {
      var cx = $(par[1]);
      cx.checked = !!(estado[par[0]] || sug[par[0]]);
      cx.disabled = !!sug[par[0]];
      cx.parentNode.title = sug[par[0]] ? 'Marcado pelo que está no plano' : '';
    });
  }
  $('e-titulo').maxLength = P.LIMITES.titulo;
  $('e-titulo').addEventListener('input', function () { estado.titulo = this.value; mudouTexto(); });
  $('e-vezes').addEventListener('input', function () { estado.vezes = this.value; mudouTexto(); });
  $('e-recado').maxLength = P.LIMITES.recado;
  $('e-recado').addEventListener('input', function () { estado.recado = this.value; mudouTexto(); });
  $('e-anotacao').addEventListener('change', function () { estado.anotacao = this.checked; mudouTexto(); });
  $('e-gestante').addEventListener('change', function () { estado.gestante = this.checked; mudouTexto(); });
  $('e-soltar').addEventListener('change', function () { estado.soltar = this.checked; mudouTexto(); });

  /* ---------- começar por / modelos ----------
     Na lista: cartilhas inteiras, sequências prontas de exercícios
     (E.MODELOS_PRONTOS) e os modelos salvos neste computador. O valor
     leva um prefixo para um modelo salvo nunca colidir com os outros. */
  function modelos() { var m = ler(CHAVE_MODELOS, {}); return (m && typeof m === 'object') ? m : {}; }
  function opcao(valor) {
    var i = valor.indexOf(':'); if (i < 0) return null;
    var tipo = valor.slice(0, i), id = valor.slice(i + 1);
    if (tipo === 'cartilha') { var c = cartilha(id); return c && { nome: c.titulo, itens: function () { return P.deCartilha(A, c.id); } }; }
    if (tipo === 'pronto') {
      var p = E.MODELOS_PRONTOS.filter(function (x) { return x.id === id; })[0];
      return p && { nome: p.nome, itens: function () { return p.itens.map(function (x) { return P.exercicio(E, x); }); } };
    }
    if (tipo === 'salvo') {
      var m = modelos();
      if (!Object.prototype.hasOwnProperty.call(m, id)) return null;
      return { nome: id, salvo: true, estado: P.limpo(m[id], E, A), itens: function () { return P.limpo(m[id], E, A).itens; } };
    }
    return null;
  }
  function montarModelos() {
    var sel = $('e-comeco'); sel.textContent = '';
    sel.appendChild(el('option', null, 'Escolha uma cartilha ou um modelo…'));
    sel.options[0].value = '';
    var gc = el('optgroup'); gc.label = 'Cartilhas inteiras';
    A.CARTILHAS.forEach(function (c) { var o = el('option', null, c.titulo); o.value = 'cartilha:' + c.id; gc.appendChild(o); });
    sel.appendChild(gc);
    var gp = el('optgroup'); gp.label = 'Exercícios prontos';
    E.MODELOS_PRONTOS.forEach(function (p) { var o = el('option', null, p.nome); o.value = 'pronto:' + p.id; gp.appendChild(o); });
    sel.appendChild(gp);
    var nomes = Object.keys(modelos()).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
    var gs = el('optgroup'); gs.label = nomes.length ? 'Salvos neste computador' : 'Salvos neste computador (nenhum)';
    nomes.forEach(function (n) { var o = el('option', null, n); o.value = 'salvo:' + n; gs.appendChild(o); });
    sel.appendChild(gs);
  }
  function escolhida() {
    var v = $('e-comeco').value;
    if (!v) { avisar('Escolha uma cartilha ou um modelo na lista.'); return null; }
    var o = opcao(v);
    if (!o) { montarModelos(); avisar('Esse modelo não existe mais.'); return null; }
    return o;
  }
  $('e-comecar').addEventListener('click', function () {
    var o = escolhida(); if (!o) return;
    if (o.salvo) { estado = o.estado; estado.itens.forEach(comUid); $('e-nome-modelo').value = o.nome; }
    else { estado = P.vazio(); estado.itens = o.itens().map(comUid); $('e-nome-modelo').value = ''; }
    montarGerais(); mudouEstrutura('"' + o.nome + '" carregado. Ajuste para a paciente: tire o que não serve, acrescente o que falta.');
  });
  $('e-acrescentar').addEventListener('click', function () {
    var o = escolhida(); if (!o) return;
    o.itens().forEach(function (it) {
      if (it.tipo === 'ex') inserirExercicio(it); else estado.itens.push(comUid(it));
    });
    mudouEstrutura('"' + o.nome + '" acrescentado ao plano.');
  });
  $('e-salvar').addEventListener('click', function () {
    var n = $('e-nome-modelo').value.trim();
    if (!n) { avisar('Dê um nome ao modelo, por exemplo "Pós-parto — fase 1".'); $('e-nome-modelo').focus(); return; }
    if (!estado.itens.length) { avisar('O plano está vazio.'); return; }
    /* "__proto__" e parecidos não viram chave comum de objeto: o modelo sumiria */
    if (/^(__proto__|constructor|prototype)$/.test(n)) { avisar('Escolha outro nome para o modelo.'); return; }
    var m = modelos(); var existia = Object.prototype.hasOwnProperty.call(m, n);
    m[n] = paraGuardar(estado);
    if (!gravar(CHAVE_MODELOS, m)) { avisar('Este navegador não deixou salvar. O modelo não foi guardado.'); return; }
    montarModelos(); $('e-comeco').value = 'salvo:' + n;
    avisar(existia ? 'Modelo "' + n + '" atualizado.' : 'Modelo "' + n + '" salvo neste computador.');
  });
  $('e-apagar').addEventListener('click', function () {
    var v = $('e-comeco').value;
    if (v.indexOf('salvo:') !== 0) { avisar('Escolha na lista lá em cima um modelo salvo neste computador. Cartilhas e exercícios prontos não se apagam.'); return; }
    var n = v.slice(6);
    var b = $('e-apagar');
    if (b.getAttribute('data-confirma') !== n) {
      b.setAttribute('data-confirma', n); b.textContent = 'Toque de novo para apagar';
      setTimeout(function () { b.removeAttribute('data-confirma'); b.textContent = 'Apagar modelo'; }, 4000);
      return;
    }
    var m = modelos(); delete m[n]; gravar(CHAVE_MODELOS, m);
    b.removeAttribute('data-confirma'); b.textContent = 'Apagar modelo';
    montarModelos(); avisar('Modelo "' + n + '" apagado.');
  });
  $('e-limpar').addEventListener('click', function () {
    var b = this;
    if (!b.hasAttribute('data-confirma')) {
      b.setAttribute('data-confirma', '1'); b.textContent = 'Toque de novo para limpar';
      setTimeout(function () { b.removeAttribute('data-confirma'); b.textContent = 'Começar do zero'; }, 4000);
      return;
    }
    b.removeAttribute('data-confirma'); b.textContent = 'Começar do zero';
    estado = P.vazio(); montarGerais(); mudouEstrutura('Plano limpo.');
  });

  /* ---------- folhas ---------- */
  var folhas = $('folhas');
  var tPagina = $('t-pagina');

  /* Nome e data entram na folha ANTES de medir: o nome muda a altura da
     abertura ("Para … · Entregue em …"). Quem os aplica é o
     impressos-cliente, que escuta estes mesmos eventos. */
  var reaplicando = false;
  function aplicarNomeEData() {
    reaplicando = true;
    try {
      var nome = $('b-nome'); if (nome) nome.dispatchEvent(new Event('input'));
      var data = $('b-data'); if (data) data.dispatchEvent(new Event('change'));
    } finally { reaplicando = false; }
  }
  function novaPagina() {
    var p = tPagina.content.firstElementChild.cloneNode(true);
    folhas.appendChild(p);
    return p.querySelector('.corpo');
  }
  function modelo(id) { return $(id).content.firstElementChild.cloneNode(true); }
  function transborda(corpo) { return corpo.scrollHeight > corpo.clientHeight + 1; }

  function blocoAbertura() {
    var d = el('div', 'abertura');
    d.appendChild(el('h1', null, String(estado.titulo || '').trim() || P.tituloPadrao(A, estado.itens)));
    var sub = el('p', 'sub');
    var para = el('span'); para.setAttribute('data-nome-cheio', ''); para.hidden = true;
    para.appendChild(document.createTextNode('Para '));
    var nm = el('b'); nm.setAttribute('data-nome-alvo', ''); para.appendChild(nm);
    para.appendChild(document.createTextNode(' · '));
    sub.appendChild(para);
    sub.appendChild(document.createTextNode('Entregue em '));
    var dv = el('span', null, '____/____/________'); dv.setAttribute('data-data-vazio', ''); sub.appendChild(dv);
    var dc = el('span'); dc.setAttribute('data-data-cheio', ''); dc.setAttribute('data-data-extenso', ''); dc.hidden = true; sub.appendChild(dc);
    d.appendChild(sub);
    d.appendChild(el('p', 'acolhe', $('t-acolhe').content.textContent.trim()));
    var rec = String(estado.recado || '').trim();
    if (rec) d.appendChild(el('p', 'recado', rec));
    return d;
  }

  function blocoOrientacao(it) {
    var d = el('div', 'bloco');
    d.setAttribute('data-uid', it.uid);
    var h = String(it.h || '').trim();
    if (h) d.appendChild(el('h2', null, h));
    var p = String(it.p || '').trim();
    if (p) d.appendChild(el('p', null, p));
    var l = (it.l || []).filter(function (x) { return String(x).trim(); });
    if (l.length) { var ul = el('ul'); l.forEach(function (x) { ul.appendChild(el('li', null, x)); }); d.appendChild(ul); }
    var n = String(it.nota || '').trim();
    if (n) d.appendChild(el('div', 'nota', n));
    return d;
  }

  /* Antes do primeiro exercício: quantas vezes e o quadro "Em todos os
     exercícios". Fica grudado no exercício seguinte (nunca sozinho no pé
     de uma folha). */
  /* Logo depois do bloco "faça os exercícios" da cartilha, o título e a
     frase "do jeito que conferimos" já foram ditos: só entra o número de
     vezes, se ela preencheu. */
  function blocoInicioExercicios(depoisDoPonto) {
    var d = el('div', 'ex-inicio');
    d.setAttribute('data-gruda', '');
    if (!depoisDoPonto) d.appendChild(el('h2', null, 'Seus exercícios'));
    var v = String(estado.vezes || '').trim();
    if (v) d.appendChild(el('p', 'quando', 'Faça a sequência abaixo, na ordem, ' + v + (v === '1' ? ' vez' : ' vezes') + ' por dia.'));
    else if (!depoisDoPonto) d.appendChild(el('p', 'quando', 'Faça a sequência abaixo na ordem, do jeito que conferimos juntas na sessão.'));
    var sempre = el('div', 'sempre');
    sempre.appendChild(el('b', null, 'Em todos os exercícios'));
    var ul = el('ul');
    P.sempre(E, estado.itens, estado).forEach(function (s) { ul.appendChild(el('li', null, s)); });
    sempre.appendChild(ul);
    d.appendChild(sempre);
    return d;
  }

  function blocoExercicio(it, n) {
    var b = daBiblioteca(it.id);
    var c = el('div', 'ex ' + (b ? 'ex-' + b.formato : 'ex-livre'));
    c.setAttribute('data-uid', it.uid);
    if (b) { var img = el('img'); img.src = PASTA + b.imagem; img.alt = b.titulo; c.appendChild(img); }
    var t = el('div', 'ex-txt');
    var h = el('h2');
    h.appendChild(el('span', 'n', String(n)));
    h.appendChild(document.createTextNode(String(it.titulo || '').trim() || 'Exercício'));
    t.appendChild(h);
    var r = E.resumoParametros(it.params);
    if (r) t.appendChild(el('p', 'param', r));
    var ds = String(it.descricao || '').trim();
    if (ds) t.appendChild(el('p', 'desc', ds));
    c.appendChild(t);
    return c;
  }

  /* A sequência de blocos da folha, na ordem, antes de paginar. */
  function blocosDaFolha() {
    var r = [], n = 0, comecou = false, anterior = null;
    /* o bloco "faça os exercícios" da cartilha já serve de título */
    function ehPonto(it) { return !!it && it.tipo === 'bloco' && !!it.ref && P.PONTO_EXERCICIOS[it.ref.split('/')[0]] === it.h; }
    function emPe(it) { var x = it && it.tipo === 'ex' && daBiblioteca(it.id); return !!x && x.formato === 'em-pe'; }
    for (var i = 0; i < estado.itens.length; i++) {
      var it = estado.itens[i];
      if (it.tipo === 'bloco') {
        var temTexto = [it.h, it.p, it.nota].some(function (x) { return String(x || '').trim(); }) ||
          (it.l || []).some(function (x) { return String(x).trim(); });
        if (temTexto) { r.push(blocoOrientacao(it)); anterior = it; }
        continue;
      }
      if (!comecou) { r.push(blocoInicioExercicios(ehPonto(anterior))); comecou = true; }
      var b = blocoExercicio(it, ++n);
      /* Duas figuras em pé seguidas dividem a mesma linha: sozinha, cada
         uma ocupa a largura toda com o texto curto ao lado. */
      if (emPe(it) && emPe(estado.itens[i + 1])) {
        var par = el('div', 'par');
        par.appendChild(b);
        par.appendChild(blocoExercicio(estado.itens[i + 1], ++n));
        b = par; i++;
      }
      r.push(b);
    }
    if (estado.anotacao) r.push(modelo('t-anotacao'));
    return r;
  }

  function renderFolhas() {
    folhas.textContent = '';
    clearTimeout(tRender); tRender = null;
    var corpo = novaPagina();
    corpo.appendChild(blocoAbertura());
    aplicarNomeEData();
    blocosDaFolha().forEach(function (b) {
      corpo.appendChild(b);
      if (transborda(corpo) && corpo.children.length > 1) {
        corpo.removeChild(b);
        /* o que gruda no seguinte (início dos exercícios) vai junto */
        var antes = corpo.lastElementChild;
        var levar = antes && antes.hasAttribute('data-gruda') && corpo.children.length > 1;
        if (levar) corpo.removeChild(antes);
        corpo = novaPagina();
        if (levar) corpo.appendChild(antes);
        corpo.appendChild(b);
      }
    });
    /* Quadro de agendamento no pé da última folha. O código QR já vai no
       quadro de anotação, quando ele existe; sem ele, vai no agendamento.
       Ordem de tentativa, sem abrir folha nova só por causa do quadro:
       com QR → completo → uma linha. Se nada couber: folha nova com o
       primeiro da lista, levando junto o último bloco — o quadro nunca
       fica sozinho. */
    var opcoes = estado.anotacao ? ['t-agenda', 't-agenda-curta'] : ['t-agenda-qr', 't-agenda', 't-agenda-curta'];
    var coube = false;
    for (var k = 0; k < opcoes.length && !coube; k++) {
      var ag = modelo(opcoes[k]);
      corpo.appendChild(ag);
      if (!transborda(corpo) || corpo.children.length === 1) coube = true;
      else corpo.removeChild(ag);
    }
    if (!coube) {
      var ultimo = corpo.lastElementChild;
      var antesDele = ultimo && ultimo.previousElementSibling;
      var levar = ultimo && !ultimo.classList.contains('abertura') && antesDele && !antesDele.classList.contains('abertura');
      /* se o último vai, o que gruda nele (início dos exercícios) vai junto —
         desde que a folha não fique só com a abertura */
      var junto = levar && antesDele.hasAttribute('data-gruda') && antesDele.previousElementSibling &&
                  !antesDele.previousElementSibling.classList.contains('abertura') ? antesDele : null;
      if (levar) corpo.removeChild(ultimo);
      if (junto) corpo.removeChild(junto);
      corpo = novaPagina();
      if (junto) corpo.appendChild(junto);
      if (levar) corpo.appendChild(ultimo);
      corpo.appendChild(modelo(opcoes[0]));
    }
    var paginas = folhas.querySelectorAll('.pagina');
    var n = paginas.length;
    paginas.forEach(function (p, i) {
      var f = p.querySelector('[data-folha]');
      if (f) f.textContent = n > 1 ? 'Folha ' + (i + 1) + ' de ' + n : '';
    });
    var no = estado.itens.filter(function (it) { return it.tipo === 'bloco'; }).length;
    var ne = estado.itens.length - no;
    var partes = [];
    if (no) partes.push(no + (no === 1 ? ' orientação' : ' orientações'));
    if (ne) partes.push(ne + (ne === 1 ? ' exercício' : ' exercícios'));
    partes.push(n + (n === 1 ? ' folha A4' : ' folhas A4'));
    $('e-folhas').textContent = partes.join(' · ');
    $('e-demais').hidden = n <= FOLHAS_DEMAIS;
    var alertas = $('e-alertas'); alertas.textContent = '';
    P.avisos(E, A, estado.itens, estado).forEach(function (t) { alertas.appendChild(el('li', null, t)); });
    alertas.hidden = !alertas.children.length;
    $('e-titulo').placeholder = P.tituloPadrao(A, estado.itens);
    /* cabeçalho das folhas novas */
    aplicarNomeEData();
  }

  var tRender = null;
  function renderPendente() { if (tRender !== null) renderFolhas(); }
  function mudouTexto() {
    salvarRascunho();
    clearTimeout(tRender);
    tRender = setTimeout(renderFolhas, 150);
  }
  function mudouEstrutura(msg) {
    fecharAcao();
    salvarRascunho();
    montarLista();
    marcarEscolhidos();
    montarPerfil();
    renderFolhas();
    avisar(msg || '');
    devolverFoco();
  }

  /* nome digitado ou data ligada/desligada: repagina (a abertura pode
     ganhar uma linha). Ignora os eventos que o próprio montador dispara. */
  function repaginarDepois() { clearTimeout(tRender); tRender = setTimeout(renderFolhas, 150); }
  var campoNome = $('b-nome'), campoData = $('b-data');
  if (campoNome) campoNome.addEventListener('input', function () { if (!reaplicando) repaginarDepois(); });
  if (campoData) campoData.addEventListener('change', function () { if (!reaplicando) repaginarDepois(); });

  /* Imprimir, Enviar PDF ou imagem logo depois de digitar: a folha é
     refeita na hora, antes do botão agir (fase de captura). */
  var barraTopo = $('barra');
  if (barraTopo) barraTopo.addEventListener('click', renderPendente, true);
  window.addEventListener('beforeprint', renderPendente);

  /* ---------- dois cliques na folha: tirar ou editar ----------
     Atalho de tela (o menu some na impressão e nas imagens). Pelo
     teclado, os mesmos botões estão na lista do painel. */
  var menu = $('acao-folha');
  var alvoMenu = null;
  function fecharAcao() { if (menu) menu.hidden = true; alvoMenu = null;
    document.querySelectorAll('.folhas .realce').forEach(function (x) { x.classList.remove('realce'); }); }
  function indicePorUid(uid) { for (var i = 0; i < estado.itens.length; i++) if (estado.itens[i].uid === uid) return i; return -1; }
  folhas.addEventListener('dblclick', function (ev) {
    var bloco = ev.target.closest && ev.target.closest('[data-uid]');
    if (!bloco) return;
    var i = indicePorUid(bloco.getAttribute('data-uid'));
    if (i < 0) return;
    ev.preventDefault();
    if (window.getSelection) window.getSelection().removeAllRanges();
    fecharAcao();
    alvoMenu = estado.itens[i].uid;
    bloco.classList.add('realce');
    var it = estado.itens[i];
    $('acao-titulo').textContent = (it.tipo === 'ex' ? 'Exercício: ' + (it.titulo || 'sem nome') : 'Orientação: ' + (it.h || 'sem título'));
    menu.hidden = false;
    var x = Math.min(ev.pageX, window.scrollX + document.documentElement.clientWidth - menu.offsetWidth - 8);
    menu.style.left = Math.max(window.scrollX + 8, x) + 'px';
    menu.style.top = (ev.pageY + 10) + 'px';
    $('acao-tirar').focus();
  });
  if (menu) {
    $('acao-tirar').addEventListener('click', function () {
      var i = indicePorUid(alvoMenu); if (i < 0) { fecharAcao(); return; }
      var it = estado.itens[i];
      estado.itens.splice(i, 1);
      mudouEstrutura('"' + ((it.tipo === 'ex' ? it.titulo : it.h) || 'Peça') + '" saiu do plano.');
    });
    $('acao-editar').addEventListener('click', function () {
      var i = indicePorUid(alvoMenu); fecharAcao();
      var card = document.querySelectorAll('#e-lista .item')[i];
      if (!card) return;
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
      card.classList.add('realce');
      setTimeout(function () { card.classList.remove('realce'); }, 1800);
      var campo = card.querySelector('textarea') || card.querySelector('input');
      if (campo) campo.focus({ preventScroll: true });
    });
    $('acao-fechar').addEventListener('click', fecharAcao);
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !menu.hidden) fecharAcao(); });
    document.addEventListener('mousedown', function (ev) { if (!menu.hidden && !menu.contains(ev.target)) fecharAcao(); });
    window.addEventListener('beforeprint', fecharAcao);
  }

  montarOrientacoes();
  montarBiblioteca();
  montarModelos();
  montarGerais();
  montarLista();
  marcarEscolhidos();
  renderFolhas();
  /* a paginação mede o texto: refaz quando a fonte da marca terminar de chegar */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderFolhas);
})();
