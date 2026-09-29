/* js/roteiros-pagina.js — Monta roteiros.html a partir de js/roteiros.js.
   Todo texto entra por textContent. */
(function () {
  'use strict';
  var R = window.Roteiros;
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined && texto !== null) e.textContent = texto;
    return e;
  }

  var toast = $('toast'), t;
  function avisar(msg) { toast.textContent = msg; toast.style.display = 'block'; clearTimeout(t); t = setTimeout(function () { toast.style.display = 'none'; }, 2500); }
  function copiar(texto, rotulo) {
    function ok() { avisar(rotulo + ' copiado.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, function () { reserva(texto); ok(); });
    } else { reserva(texto); ok(); }
  }
  function reserva(texto) {
    var a = el('textarea'); a.value = texto; a.style.position = 'fixed'; a.style.opacity = '0';
    document.body.appendChild(a); a.select(); try { document.execCommand('copy'); } catch (e) {} a.remove();
  }
  function botaoCopiar(rotulo, texto, principal) {
    var b = el('button', 'copiar' + (principal ? ' pri' : ''), 'Copiar ' + rotulo.toLowerCase());
    b.type = 'button';
    b.addEventListener('click', function () { copiar(texto, rotulo); });
    return b;
  }

  /* blocos fixos */
  R.GRAVACAO.forEach(function (g) { $('gravacao').appendChild(el('li', null, g)); });
  $('selo').textContent = R.SELO;
  $('cartela').textContent = R.CARTELA.join('\n');
  R.CHECKLIST.forEach(function (c) { $('checklist').appendChild(el('li', null, c)); });
  $('nunca').textContent = R.NUNCA.map(function (n) { return '"' + n + '"'; }).join(' · ');
  R.DESCARTADOS.forEach(function (d) {
    var li = el('li'); li.appendChild(el('b', null, d.titulo + ': ')); li.appendChild(document.createTextNode(d.motivo));
    $('descartados').appendChild(li);
  });

  /* roteiros */
  function cartaoRoteiro(r) {
    var s = el('section', 'cartao roteiro');
    s.id = 'roteiro-' + r.id;
    s.setAttribute('data-serie', r.serie);

    var cab = el('div', 'cab');
    cab.appendChild(el('span', 'codigo', r.id));
    cab.appendChild(el('h2', 'tit', r.titulo));
    cab.appendChild(el('span', 'dur', r.duracao));
    s.appendChild(cab);
    s.appendChild(el('p', 'apoio', r.objetivo));

    var tw = el('div', 'tabela'), tb = el('table', 'cenas'), th = el('thead'), tr0 = el('tr');
    ['Tempo', 'Imagem', 'Fala', 'Texto na tela'].forEach(function (h) { tr0.appendChild(el('th', null, h)); });
    th.appendChild(tr0); tb.appendChild(th);
    var corpo = el('tbody');
    r.cenas.forEach(function (c) {
      var tr = el('tr');
      [['Tempo', c.tempo, ''], ['Imagem', c.imagem, ''], ['Fala', c.fala, 'fala'], ['Texto na tela', c.tela, '']].forEach(function (x) {
        var td = el('td', x[2], x[1]); td.setAttribute('data-rotulo', x[0]); tr.appendChild(td);
      });
      corpo.appendChild(tr);
    });
    tb.appendChild(corpo); tw.appendChild(tb); s.appendChild(tw);

    var legendaCompleta = r.legenda + '\n\n' + R.RODAPE_LEGENDA + '\n' + r.hashtags;
    var leg = el('div', 'caixa');
    leg.appendChild(el('h3', null, 'Legenda do post'));
    leg.appendChild(el('pre', null, legendaCompleta));
    leg.appendChild(botaoCopiar('Legenda', legendaCompleta, true));
    s.appendChild(leg);

    var tf = el('div', 'caixa trafego');
    tf.appendChild(el('h3', null, 'No tráfego pago'));
    var dl = el('dl');
    [['Quando', r.trafego.prioridade], ['Objetivo', r.trafego.objetivo], ['Público', r.trafego.publico]].forEach(function (p) {
      dl.appendChild(el('dt', null, p[0])); dl.appendChild(el('dd', null, p[1]));
    });
    if (r.trafego.anuncio) {
      dl.appendChild(el('dt', null, 'Título do anúncio')); dl.appendChild(el('dd', null, r.trafego.anuncio.titulo));
      dl.appendChild(el('dt', null, 'Texto do anúncio')); dl.appendChild(el('dd', null, r.trafego.anuncio.texto));
    }
    tf.appendChild(dl);
    var va = R.versaoAnuncio(r);
    if (va) {
      tf.appendChild(el('h3', null, 'Vídeo do anúncio'));
      tf.appendChild(el('p', 'apoio', 'O que muda em relação ao post. "Igual ao post" usa a mesma gravação; "regravar" é gravado na mesma sessão; "cortar" é só aparar na edição.'));
      var COMO = { igual: 'Igual ao post', regravar: 'Regravar', cortar: 'Cortar na edição', tela: 'Só trocar o texto na tela' };
      var tw2 = el('div', 'tabela'), tb2 = el('table', 'cenas anuncio'), th2 = el('thead'), trh = el('tr');
      ['Tempo', 'O que fazer', 'Fala', 'Texto na tela'].forEach(function (h) { trh.appendChild(el('th', null, h)); });
      th2.appendChild(trh); tb2.appendChild(th2);
      var corpo2 = el('tbody');
      va.forEach(function (c) {
        var tr = el('tr', c.como === 'igual' ? 'igual' : 'muda');
        [['Tempo', c.tempo, ''], ['O que fazer', COMO[c.como] + (c.nota ? ' — ' + c.nota : ''), 'como'],
         ['Fala', c.como === 'igual' || c.como === 'tela' ? '(mesma fala do post)' : c.fala, 'fala'], ['Texto na tela', c.tela, '']].forEach(function (x) {
          var td = el('td', x[2], x[1]); td.setAttribute('data-rotulo', x[0]); tr.appendChild(td);
        });
        corpo2.appendChild(tr);
      });
      tb2.appendChild(corpo2); tw2.appendChild(tb2); tf.appendChild(tw2);
    }
    if (r.trafego.anuncio) {
      var bts = el('div', 'linha-botoes');
      bts.appendChild(botaoCopiar('Texto do anúncio', r.trafego.anuncio.texto + '\n\n' + R.SELO));
      var msg = 'Olá! Vi um vídeo da Vanessa no Instagram (código ' + r.id + ') e gostaria de agendar uma avaliação.';
      bts.appendChild(botaoCopiar('Mensagem pronta', msg));
      var a = el('a', 'botao', 'Testar link do WhatsApp');
      a.href = R.linkWhatsApp(r.id); a.target = '_blank'; a.rel = 'noopener';
      bts.appendChild(a);
      tf.appendChild(bts);
    }
    s.appendChild(tf);

    if (r.lastro && r.lastro.length) {
      var det = el('details');
      det.appendChild(el('summary', null, 'De onde vem cada frase (uso interno, não vai ao ar)'));
      var ul = el('ul');
      r.lastro.forEach(function (l) {
        var li = el('li'); li.appendChild(el('b', null, l[0] + ' — ')); li.appendChild(document.createTextNode(l[1])); ul.appendChild(li);
      });
      det.appendChild(ul);
      s.appendChild(det);
    }
    return s;
  }

  var lista = $('lista');
  R.LISTA.forEach(function (r) { lista.appendChild(cartaoRoteiro(r)); });

  /* filtros */
  var filtros = [{ id: 'todos', nome: 'Todos' }].concat(R.SERIES);
  filtros.forEach(function (f) {
    var b = el('button', null, f.nome);
    b.type = 'button';
    b.setAttribute('aria-pressed', f.id === 'todos' ? 'true' : 'false');
    b.addEventListener('click', function () {
      $('filtros').querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      lista.querySelectorAll('.roteiro').forEach(function (s) {
        s.hidden = f.id !== 'todos' && s.getAttribute('data-serie') !== f.id;
      });
    });
    $('filtros').appendChild(b);
  });
})();
