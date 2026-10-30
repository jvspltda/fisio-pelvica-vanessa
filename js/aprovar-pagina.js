/* js/aprovar-pagina.js — Monta aprovar.html a partir de js/aprovar.js.
   As respostas ficam só neste aparelho (localStorage) até ela tocar em
   "Enviar pelo WhatsApp"; nenhuma é sobre paciente. */
(function () {
  'use strict';
  var AP = window.Aprovar;
  var M = { A: window.Adherence, E: window.Exercicios, P: window.Plano, R: window.Roteiros };
  var CHAVE = 'vf-aprovacoes';
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { return {}; } }
  function gravar() { try { localStorage.setItem(CHAVE, JSON.stringify(respostas)); } catch (e) { /* aba anônima: segue sem guardar */ } }

  /* resposta dada a um texto que depois mudou não vale mais */
  var respostas = ler();
  var assinaturas = {};
  AP.LISTA.forEach(function (it) {
    assinaturas[it.id] = AP.assinatura(it.trechos(M));
    var r = respostas[it.id];
    if (!r) return;
    if (r.voto && r.assin !== assinaturas[it.id]) { r.voto = ''; r.mudou = true; }
    else delete r.mudou;
  });

  function trecho(t) {
    var d = el('div', 'trecho');
    d.appendChild(el('h4', null, t.rotulo));
    if (t.texto) t.texto.split('\n\n').forEach(function (p) { d.appendChild(el('p', null, p)); });
    if (t.lista) { var ul = el('ul'); t.lista.forEach(function (x) { ul.appendChild(el('li', null, x)); }); d.appendChild(ul); }
    if (t.nota) d.appendChild(el('p', 'nota', t.nota));
    return d;
  }

  function cartao(it) {
    var r = respostas[it.id] || (respostas[it.id] = { voto: '', obs: '' });
    var s = el('section', 'cartao item');
    s.id = it.id;
    var cab = el('div', 'item-cab');
    cab.appendChild(el('span', 'tag', it.grupo));
    cab.appendChild(el('span', 'desde', 'desde ' + AP.data(it.desde)));
    var estado = el('span', 'estado');
    cab.appendChild(estado);
    s.appendChild(cab);
    s.appendChild(el('h2', null, it.titulo));
    s.appendChild(el('p', 'porque', it.porque));
    if (r.mudou) s.appendChild(el('p', 'mudou', 'O texto mudou depois da sua resposta. Leia de novo, por favor.'));

    var trechos = it.trechos(M);
    var det = el('details', 'textos');
    det.open = trechos.length <= 2;
    det.appendChild(el('summary', null, trechos.length <= 2 ? 'O texto' : 'Ler o texto (' + trechos.length + ' partes)'));
    trechos.forEach(function (t) { det.appendChild(trecho(t)); });
    s.appendChild(det);

    var links = el('p', 'links');
    it.onde.forEach(function (o) { var a = el('a', null, o.rotulo + ' →'); a.href = o.href; links.appendChild(a); });
    s.appendChild(links);

    var votos = el('div', 'votos');
    votos.setAttribute('role', 'group');
    votos.setAttribute('aria-label', 'Sua resposta para ' + it.titulo);
    var bA = el('button', 'voto aprovo', 'Aprovo'), bM = el('button', 'voto mudar', 'Quero mudar');
    bA.type = bM.type = 'button';
    votos.appendChild(bA); votos.appendChild(bM);
    s.appendChild(votos);
    var obs = el('textarea');
    obs.rows = 2;
    obs.setAttribute('aria-label', 'Comentário sobre ' + it.titulo);
    obs.value = r.obs || '';
    s.appendChild(obs);

    function mostrar() {
      bA.setAttribute('aria-pressed', r.voto === 'aprovo' ? 'true' : 'false');
      bM.setAttribute('aria-pressed', r.voto === 'mudar' ? 'true' : 'false');
      obs.placeholder = r.voto === 'mudar' ? 'O que mudar? Pode escrever do seu jeito.' : 'Comentário (opcional)';
      estado.textContent = r.voto === 'aprovo' ? '✓ Aprovado' : r.voto === 'mudar' ? '✎ Quer mudar' : '';
      s.classList.toggle('respondido', !!r.voto);
      atualizar();
    }
    function votar(v) {
      r.voto = r.voto === v ? '' : v;
      r.assin = assinaturas[it.id]; delete r.mudou;
      gravar(); mostrar();
      if (r.voto === 'mudar') obs.focus();
    }
    bA.addEventListener('click', function () { votar('aprovo'); });
    bM.addEventListener('click', function () { votar('mudar'); });
    obs.addEventListener('input', function () { r.obs = obs.value; r.assin = assinaturas[it.id]; gravar(); atualizar(); });
    mostrar();
    return s;
  }

  function atualizar() {
    var feitos = AP.LISTA.filter(function (it) { return respostas[it.id] && respostas[it.id].voto; }).length;
    $('a-progresso').textContent = feitos + ' de ' + AP.LISTA.length + ' respondidos';
    var msg = AP.mensagem(respostas);
    $('a-enviar').disabled = $('a-copiar').disabled = !msg;
  }

  var lista = $('a-lista'), grupo = null;
  AP.LISTA.forEach(function (it) {
    if (it.grupo !== grupo) { grupo = it.grupo; lista.appendChild(el('h3', 'grupo', grupo)); }
    lista.appendChild(cartao(it));
  });
  $('a-total').textContent = AP.LISTA.length;

  function aviso(t) { $('a-aviso').textContent = t; }
  $('a-enviar').addEventListener('click', function () {
    var msg = AP.mensagem(respostas);
    if (!msg) return;
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    aviso('Abri o WhatsApp: escolha a conversa e envie.');
  });
  $('a-copiar').addEventListener('click', function () {
    var msg = AP.mensagem(respostas);
    if (!msg || !navigator.clipboard) { aviso('Não consegui copiar neste navegador.'); return; }
    navigator.clipboard.writeText(msg).then(function () { aviso('Respostas copiadas.'); }, function () { aviso('Não consegui copiar neste navegador.'); });
  });
})();
