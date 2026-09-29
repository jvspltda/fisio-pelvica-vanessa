/* ----------------------------------------------------------------
   tools/exercicios-cliente.js

   Montador da folha "Exercícios para casa". O gerador
   (tools/gerar-materiais-impressos.mjs) embute este arquivo e o
   js/exercicios.js na página; não é carregado sozinho.

   A Vanessa escolhe os exercícios, a ordem, os números e o texto de
   cada um; a folha A4 é montada ao vivo e paginada por medida (um
   exercício nunca fica partido entre duas folhas).

   O que fica salvo NESTE navegador (localStorage), e nada mais:
     - o rascunho da sequência atual;
     - os modelos que ela nomear ("Pós-parto — fase 1").
   O nome da paciente nunca é salvo: é tratado pelo
   tools/impressos-cliente.js, que só o põe na folha e no arquivo.
   ---------------------------------------------------------------- */
(function () {
  'use strict';

  var E = window.Exercicios;
  var CHAVE_RASCUNHO = 'vf-exercicios-rascunho';
  var CHAVE_MODELOS = 'vf-exercicios-modelos';
  var PASTA = '../assets/exercicios/';

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
  var seq = 0;
  function uid() { seq += 1; return 'x' + Date.now().toString(36) + seq; }

  /* ---------- estado ---------- */
  function vazio() { return { itens: [], vezes: '', recado: '' }; }
  function limpo(s) {
    var r = vazio();
    if (!s || !Array.isArray(s.itens)) return r;
    r.vezes = String(s.vezes || '').slice(0, 4);
    r.recado = String(s.recado || '').slice(0, E.LIMITE_RECADO);
    r.itens = s.itens.filter(function (it) { return it && (it.id === 'livre' || daBiblioteca(it.id)); }).map(function (it) {
      var p = {};
      E.PARAMETROS.forEach(function (x) { p[x.id] = String((it.params || {})[x.id] || '').slice(0, 7); });
      return { uid: uid(), id: it.id, titulo: String(it.titulo || '').slice(0, 60),
               descricao: String(it.descricao || '').slice(0, E.LIMITE_DESCRICAO), params: p };
    });
    return r;
  }
  var estado = limpo(ler(CHAVE_RASCUNHO, null));
  function paraGuardar(s) {
    return { vezes: s.vezes, recado: s.recado, itens: s.itens.map(function (it) {
      return { id: it.id, titulo: it.titulo, descricao: it.descricao, params: it.params };
    }) };
  }
  var tGravar;
  function salvarRascunho() {
    clearTimeout(tGravar);
    tGravar = setTimeout(function () { gravar(CHAVE_RASCUNHO, paraGuardar(estado)); }, 300);
  }

  function novoItem(id) {
    var b = daBiblioteca(id);
    var p = {}; E.PARAMETROS.forEach(function (x) { p[x.id] = ''; });
    return { uid: uid(), id: b ? b.id : 'livre', titulo: b ? b.titulo : '', descricao: b ? b.descricao : '', params: p };
  }

  /* ---------- editor ---------- */
  var editor = $('editor');
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

  function montarBiblioteca() {
    var alvo = $('e-biblioteca');
    E.BIBLIOTECA.forEach(function (b) {
      var bt = el('button', 'miniatura');
      bt.type = 'button';
      var img = el('img'); img.src = PASTA + b.imagem; img.alt = ''; img.loading = 'lazy';
      bt.appendChild(img);
      bt.appendChild(el('span', null, '+ ' + b.titulo));
      bt.addEventListener('click', function () {
        estado.itens.push(novoItem(b.id));
        mudouEstrutura('"' + b.titulo + '" entrou na sequência.');
      });
      alvo.appendChild(bt);
    });
    var livre = el('button', 'miniatura livre');
    livre.type = 'button';
    livre.appendChild(el('span', 'mais', '+'));
    livre.appendChild(el('span', null, 'Exercício sem imagem'));
    livre.addEventListener('click', function () {
      estado.itens.push(novoItem('livre'));
      mudouEstrutura('Exercício sem imagem entrou na sequência. Dê um nome a ele.');
    });
    alvo.appendChild(livre);
  }

  function montarLista() {
    var lista = $('e-lista');
    lista.textContent = '';
    if (!estado.itens.length) {
      lista.appendChild(el('p', 'vazio', 'Nenhum exercício ainda. Toque numa figura acima para começar.'));
      return;
    }
    estado.itens.forEach(function (it, i) {
      var b = daBiblioteca(it.id);
      var c = el('div', 'item');
      var cab = el('div', 'item-cab');
      cab.appendChild(el('span', 'num', String(i + 1)));
      if (b) { var im = el('img'); im.src = PASTA + b.imagem; im.alt = ''; cab.appendChild(im); }
      var tit = el('input'); tit.type = 'text'; tit.value = it.titulo; tit.maxLength = 60;
      tit.placeholder = 'Nome do exercício'; tit.setAttribute('aria-label', 'Nome do exercício ' + (i + 1));
      tit.addEventListener('input', function () { it.titulo = tit.value; mudouTexto(); });
      cab.appendChild(tit);
      var acoes = el('div', 'acoes');
      var sobe = botao('↑', '', function () { mover(i, -1); }, 'Subir'); sobe.disabled = i === 0;
      var desce = botao('↓', '', function () { mover(i, 1); }, 'Descer'); desce.disabled = i === estado.itens.length - 1;
      acoes.appendChild(sobe); acoes.appendChild(desce);
      acoes.appendChild(botao('✕', 'tirar', function () {
        estado.itens.splice(i, 1); mudouEstrutura('Exercício retirado.');
      }, 'Tirar da sequência'));
      cab.appendChild(acoes);
      c.appendChild(cab);

      var nums = el('div', 'nums');
      E.PARAMETROS.forEach(function (x) {
        var inp = el('input'); inp.type = 'text'; inp.inputMode = 'numeric'; inp.maxLength = 7;
        inp.value = it.params[x.id]; inp.placeholder = '—';
        inp.addEventListener('input', function () { it.params[x.id] = inp.value; mudouTexto(); });
        nums.appendChild(campo(x.rotulo, inp));
      });
      c.appendChild(nums);

      var ta = el('textarea'); ta.rows = 4; ta.maxLength = E.LIMITE_DESCRICAO; ta.value = it.descricao;
      ta.placeholder = 'Como fazer';
      var cont = el('span', 'contador');
      var conta = function () { cont.textContent = ta.value.length + ' / ' + E.LIMITE_DESCRICAO; };
      conta();
      ta.addEventListener('input', function () { it.descricao = ta.value; conta(); mudouTexto(); });
      var lt = campo('Como fazer', ta);
      c.appendChild(lt);
      var rod = el('div', 'item-rod');
      rod.appendChild(cont);
      if (b) rod.appendChild(botao('Voltar ao texto sugerido', 'discreto', function () {
        it.descricao = b.descricao; ta.value = b.descricao; conta(); mudouTexto();
      }));
      c.appendChild(rod);
      lista.appendChild(c);
    });
  }

  function mover(i, d) {
    var j = i + d;
    if (j < 0 || j >= estado.itens.length) return;
    var t = estado.itens[i]; estado.itens[i] = estado.itens[j]; estado.itens[j] = t;
    mudouEstrutura();
  }

  function montarGerais() {
    var v = $('e-vezes'), r = $('e-recado');
    v.value = estado.vezes; r.value = estado.recado;
  }
  $('e-vezes').addEventListener('input', function () { estado.vezes = this.value; mudouTexto(); });
  $('e-recado').maxLength = E.LIMITE_RECADO;
  $('e-recado').addEventListener('input', function () { estado.recado = this.value; mudouTexto(); });

  /* ---------- modelos ---------- */
  function modelos() { var m = ler(CHAVE_MODELOS, {}); return (m && typeof m === 'object') ? m : {}; }
  function montarModelos() {
    var sel = $('e-modelos'); sel.textContent = '';
    var nomes = Object.keys(modelos()).sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
    sel.appendChild(el('option', null, nomes.length ? 'Escolha um modelo…' : 'Nenhum modelo salvo'));
    sel.options[0].value = '';
    nomes.forEach(function (n) { var o = el('option', null, n); o.value = n; sel.appendChild(o); });
  }
  $('e-carregar').addEventListener('click', function () {
    var n = $('e-modelos').value; if (!n) { avisar('Escolha um modelo na lista.'); return; }
    estado = limpo(modelos()[n]); $('e-nome-modelo').value = n;
    montarGerais(); mudouEstrutura('Modelo "' + n + '" carregado.');
  });
  $('e-salvar').addEventListener('click', function () {
    var n = $('e-nome-modelo').value.trim();
    if (!n) { avisar('Dê um nome ao modelo, por exemplo "Pós-parto — fase 1".'); $('e-nome-modelo').focus(); return; }
    if (!estado.itens.length) { avisar('A sequência está vazia.'); return; }
    var m = modelos(); m[n] = paraGuardar(estado);
    if (!gravar(CHAVE_MODELOS, m)) { avisar('Este navegador não deixou salvar. O modelo não foi guardado.'); return; }
    montarModelos(); $('e-modelos').value = n; avisar('Modelo "' + n + '" salvo neste computador.');
  });
  $('e-apagar').addEventListener('click', function () {
    var n = $('e-modelos').value; if (!n) { avisar('Escolha na lista o modelo a apagar.'); return; }
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
    estado = vazio(); montarGerais(); mudouEstrutura('Sequência limpa.');
  });

  /* ---------- folhas ---------- */
  var folhas = $('folhas');
  var tPagina = $('t-pagina');
  var tAgenda = $('t-agenda');

  function novaPagina() {
    var p = tPagina.content.firstElementChild.cloneNode(true);
    folhas.appendChild(p);
    return p.querySelector('.corpo');
  }
  function transborda(corpo) { return corpo.scrollHeight > corpo.clientHeight + 1; }

  function blocoAbertura() {
    var d = el('div', 'abertura');
    d.appendChild(el('h1', null, 'Seus exercícios em casa'));
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

    var v = String(estado.vezes || '').trim();
    var quando = v
      ? 'Faça a sequência abaixo, na ordem, ' + v + (v === '1' ? ' vez' : ' vezes') + ' por dia.'
      : 'Faça a sequência abaixo na ordem, do jeito que conferimos juntas na sessão.';
    d.appendChild(el('p', 'quando', quando));
    var rec = String(estado.recado || '').trim();
    if (rec) d.appendChild(el('p', 'recado', rec));

    var sempre = el('div', 'sempre');
    sempre.appendChild(el('b', null, 'Em todos os exercícios'));
    var ul = el('ul');
    E.SEMPRE.forEach(function (s) { ul.appendChild(el('li', null, s)); });
    sempre.appendChild(ul);
    d.appendChild(sempre);
    return d;
  }

  function blocoExercicio(it, i) {
    var b = daBiblioteca(it.id);
    var c = el('div', 'ex ' + (b ? 'ex-' + b.formato : 'ex-livre'));
    if (b) { var img = el('img'); img.src = PASTA + b.imagem; img.alt = b.titulo; c.appendChild(img); }
    var t = el('div', 'ex-txt');
    var h = el('h2');
    h.appendChild(el('span', 'n', String(i + 1)));
    h.appendChild(document.createTextNode(String(it.titulo || '').trim() || 'Exercício'));
    t.appendChild(h);
    var r = E.resumoParametros(it.params);
    if (r) t.appendChild(el('p', 'param', r));
    var ds = String(it.descricao || '').trim();
    if (ds) t.appendChild(el('p', 'desc', ds));
    c.appendChild(t);
    return c;
  }

  function renderFolhas() {
    folhas.textContent = '';
    var corpo = novaPagina();
    corpo.appendChild(blocoAbertura());
    estado.itens.forEach(function (it, i) {
      var b = blocoExercicio(it, i);
      corpo.appendChild(b);
      if (transborda(corpo) && corpo.children.length > 1) {
        corpo.removeChild(b);
        corpo = novaPagina();
        corpo.appendChild(b);
      }
    });
    var ag = tAgenda.content.firstElementChild.cloneNode(true);
    corpo.appendChild(ag);
    if (transborda(corpo) && corpo.children.length > 1) {
      /* o quadro de agendamento não fica sozinho numa folha: leva junto o
         último exercício, se a folha anterior ainda tiver outro */
      corpo.removeChild(ag);
      var ultimo = corpo.lastElementChild;
      var levar = ultimo && ultimo.classList.contains('ex') &&
                  ultimo.previousElementSibling && ultimo.previousElementSibling.classList.contains('ex');
      if (levar) corpo.removeChild(ultimo);
      corpo = novaPagina();
      if (levar) corpo.appendChild(ultimo);
      corpo.appendChild(ag);
    }
    var n = folhas.querySelectorAll('.pagina').length;
    folhas.querySelectorAll('.pagina').forEach(function (p, i) {
      var f = p.querySelector('[data-folha]');
      if (f) f.textContent = n > 1 ? 'Folha ' + (i + 1) + ' de ' + n : '';
    });
    $('e-folhas').textContent = estado.itens.length
      ? estado.itens.length + (estado.itens.length === 1 ? ' exercício' : ' exercícios') + ' · ' + n + (n === 1 ? ' folha A4' : ' folhas A4')
      : '';
    /* nome e data na folha nova: quem cuida deles é o impressos-cliente */
    var nome = $('b-nome'); if (nome) nome.dispatchEvent(new Event('input'));
    var data = $('b-data'); if (data) data.dispatchEvent(new Event('change'));
  }

  var tRender;
  function mudouTexto() {
    salvarRascunho();
    clearTimeout(tRender);
    tRender = setTimeout(renderFolhas, 150);
  }
  function mudouEstrutura(msg) {
    salvarRascunho();
    montarLista();
    renderFolhas();
    avisar(msg || '');
  }

  montarBiblioteca();
  montarModelos();
  montarGerais();
  montarLista();
  renderFolhas();
  /* a paginação mede o texto: refaz quando a fonte da marca terminar de chegar */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderFolhas);
})();
