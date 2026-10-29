/* ════════════════════════════════════════════════════════════════
   js/carrossel-pagina.js — Desenha os slides de js/carrossel.js e
   gera as imagens (html2canvas, via js/externas.js).

   Cada slide é montado em tamanho real (1080 × 1350). A prévia é o
   mesmo slide reduzido; para gerar a imagem, uma cópia sem redução vai
   para um palco fora da tela. A data escolhida entra no rodapé de todos
   os slides e não é guardada.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var C = window.Carrossel;
  var $ = function (id) { return document.getElementById(id); };
  /* versões das figuras com a borda esmaecida (o fundo some no slide) */
  var FIG = 'assets/carrossel/';
  function figura(nome) { return FIG + nome.replace(/\.jpg$/, '.png'); }
  var W = C.FORMATO.largura, H = C.FORMATO.altura;

  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined && texto !== null) e.textContent = texto;
    return e;
  }
  function hoje() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  var atual = C.LISTA[0];

  /* ---------- um slide ---------- */
  function slide(s, i, total) {
    var d = el('div', 'slide slide-' + s.tipo);
    d.style.width = W + 'px'; d.style.height = H + 'px';

    var topo = el('div', 's-topo');
    var logo = el('img', 's-logo'); logo.src = 'assets/logo.svg'; logo.alt = '';
    topo.appendChild(logo);
    var marca = el('div', 's-marca');
    marca.appendChild(el('b', null, 'Vanessa Fernandes'));
    marca.appendChild(el('span', null, 'Fisioterapia Pélvica'));
    topo.appendChild(marca);
    topo.appendChild(el('span', 's-conta', (i + 1) + '/' + total));
    d.appendChild(topo);

    var corpo = el('div', 's-corpo');
    if (s.tipo === 'capa') {
      corpo.appendChild(el('p', 's-chamada', s.chamada));
      corpo.appendChild(el('h1', null, s.titulo));
      corpo.appendChild(el('p', 's-texto', s.texto));
      var fc = el('img', 's-fig'); fc.src = figura(s.figura); fc.alt = ''; corpo.appendChild(fc);
    } else if (s.tipo === 'exercicio') {
      var fe = el('img', 's-fig'); fe.src = figura(s.figura); fe.alt = ''; corpo.appendChild(fe);
      var t = el('div', 's-txt');
      t.appendChild(el('span', 's-num', String(s.numero)));
      t.appendChild(el('h2', null, s.titulo));
      t.appendChild(el('p', 's-texto', s.texto));
      corpo.appendChild(t);
    } else if (s.tipo === 'cuidados') {
      corpo.appendChild(el('h2', null, s.titulo));
      var ul = el('ul');
      s.itens.forEach(function (x) { ul.appendChild(el('li', null, x)); });
      corpo.appendChild(ul);
      corpo.appendChild(el('p', 's-alerta', s.alerta));
    } else if (s.tipo === 'fecho') {
      corpo.appendChild(el('h2', null, s.titulo));
      corpo.appendChild(el('p', 's-texto', s.texto));
      var ag = el('div', 's-agenda');
      ag.appendChild(el('span', 's-ag1', C.AGENDA.linha1));
      ag.appendChild(el('b', 's-tel', C.AGENDA.telefone));
      ag.appendChild(el('span', 's-local', C.AGENDA.local));
      ag.appendChild(el('span', 's-insta', C.AGENDA.insta));
      corpo.appendChild(ag);
    }
    d.appendChild(corpo);

    var rod = el('div', 's-rodape');
    rod.appendChild(el('span', 's-id', C.rodape($('c-data').value)));
    if (s.rodapeExtra) rod.appendChild(el('span', 's-extra', s.rodapeExtra));
    d.appendChild(rod);
    return d;
  }

  /* ---------- prévias (o slide reduzido para caber na coluna) ---------- */
  var previas = $('c-previas');
  function escalar() {
    previas.querySelectorAll('.previa').forEach(function (p) {
      p.style.setProperty('--escala', String(p.clientWidth / W));
    });
  }
  function montar() {
    previas.textContent = '';
    var n = atual.slides.length;
    atual.slides.forEach(function (s, i) {
      var p = el('figure', 'previa');
      p.appendChild(slide(s, i, n));
      p.setAttribute('aria-label', 'Slide ' + (i + 1) + ': ' + s.alt);
      previas.appendChild(p);
    });
    escalar();
    $('c-titulo').textContent = atual.titulo;
    $('c-organico').hidden = !atual.soOrganico;
    $('c-legenda').textContent = C.legendaCompleta(atual, $('c-data').value);
    var alts = $('c-alts'); alts.textContent = '';
    atual.slides.forEach(function (s) { alts.appendChild(el('li', null, s.alt)); });
  }
  if (window.ResizeObserver) new ResizeObserver(escalar).observe(previas);
  else window.addEventListener('resize', escalar);

  /* ---------- escolha do carrossel (aparece quando houver mais de um) ---------- */
  var escolha = $('c-escolha');
  C.LISTA.forEach(function (c) { var o = el('option', null, c.titulo); o.value = c.id; escolha.appendChild(o); });
  $('c-escolha-rotulo').hidden = C.LISTA.length < 2;
  escolha.addEventListener('change', function () {
    atual = C.LISTA.filter(function (c) { return c.id === escolha.value; })[0] || C.LISTA[0];
    montar();
  });

  /* A data começa vazia: exportar hoje e postar amanhã deixaria a peça
     com a data errada. Data no passado só gera alerta. */
  $('c-data').min = '';
  $('c-data').addEventListener('change', function () {
    var t = C.rodape(this.value);
    document.querySelectorAll('.s-id').forEach(function (e) { e.textContent = t; });
    $('c-legenda').textContent = C.legendaCompleta(atual, this.value);
    avisar(this.value && this.value < hoje() ? 'Essa data já passou. Confira se é mesmo o dia em que vai postar.' : '');
  });

  /* ---------- legenda ---------- */
  var aviso = $('c-aviso');
  function avisar(t, erro) { aviso.textContent = t || ''; aviso.className = erro ? 'erro' : ''; }
  $('c-copiar').addEventListener('click', function () {
    var txt = C.legendaCompleta(atual, $('c-data').value);
    var feito = function () { avisar('Legenda copiada.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(feito, copiarAntigo);
    else copiarAntigo();
    function copiarAntigo() {
      var ta = el('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); feito(); } catch (e) { avisar('Selecione a legenda e copie à mão.', true); }
      ta.remove();
    }
  });

  /* ---------- imagens ---------- */
  function paraBlob(canvas) { return new Promise(function (ok) { canvas.toBlob(ok, 'image/png'); }); }
  function esperarImagens(raiz) {
    return Promise.all(Array.prototype.map.call(raiz.querySelectorAll('img'), function (im) {
      return im.complete ? null : new Promise(function (ok) { im.onload = im.onerror = ok; });
    }));
  }
  async function gerar() {
    if (!$('c-data').value) { avisar('Escolha a data da publicação: ela vai em todos os slides.', true); $('c-data').focus(); return null; }
    await window.Externas.carregar('html2canvas');
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    var palco = $('c-palco'); palco.textContent = '';
    var n = atual.slides.length, arquivos = [];
    for (var i = 0; i < n; i++) {
      avisar('Montando a imagem ' + (i + 1) + ' de ' + n + '…');
      var s = slide(atual.slides[i], i, n);
      palco.appendChild(s);
      await esperarImagens(s);
      var cv = await window.html2canvas(s, { width: W, height: H, scale: 1, backgroundColor: null, useCORS: true, logging: false });
      var blob = await paraBlob(cv);
      arquivos.push(new File([blob], 'carrossel-' + atual.id + '-' + String(i + 1).padStart(2, '0') + '.png', { type: 'image/png' }));
      palco.removeChild(s);
    }
    return arquivos;
  }
  /* Aberta direto do arquivo, o navegador não deixa transformar as
     figuras em imagem ("canvas contaminado"): avisa antes, com o link. */
  var SITE = 'https://jvspltda.github.io/fisio-pelvica-vanessa/carrossel.html';
  if (location.protocol === 'file:') {
    var p = el('p', 'erro-local');
    p.appendChild(document.createTextNode('Para gerar as imagens, abra esta página pelo site: '));
    var a = el('a', null, SITE); a.href = SITE; p.appendChild(a);
    p.appendChild(document.createTextNode('. Aberta do arquivo do computador, o navegador bloqueia.'));
    $('c-baixar').parentNode.after(p);
    $('c-baixar').disabled = true;
  }
  $('c-baixar').addEventListener('click', async function () {
    var b = this; b.disabled = true;
    try {
      var arquivos = await gerar();
      if (!arquivos) return;
      if (navigator.canShare && navigator.canShare({ files: arquivos })) {
        try { await navigator.share({ files: arquivos, title: atual.titulo }); avisar('Pronto.'); return; }
        catch (e) {
          if (e && e.name === 'AbortError') { avisar(''); return; }
          /* montar 7 imagens leva segundos e a permissão do toque expira:
             um toque novo, neste botão, abre o compartilhar */
          if (e && e.name === 'NotAllowedError') {
            var cb = $('c-compartilhar'); cb.hidden = false;
            cb.onclick = async function () {
              try { await navigator.share({ files: arquivos, title: atual.titulo }); avisar('Pronto.'); cb.hidden = true; }
              catch (e2) { if (!(e2 && e2.name === 'AbortError')) avisar('Não abriu o compartilhar. Baixe as imagens abaixo.', true); }
            };
            avisar('Imagens prontas. Toque em "Compartilhar agora".');
          }
        }
      }
      /* As imagens ficam na página com um link cada: se o navegador
         barrar os downloads seguidos ("baixar vários arquivos?"), dá para
         baixar uma a uma. */
      var prontas = $('c-prontas'), lista = $('c-prontas-lista');
      lista.querySelectorAll('a[href^="blob:"]').forEach(function (a) { URL.revokeObjectURL(a.href); });
      lista.textContent = '';
      var links = arquivos.map(function (f) {
        var url = URL.createObjectURL(f);
        var a = el('a', 'pronta'); a.href = url; a.download = f.name;
        var im = el('img'); im.src = url; im.alt = 'Imagem ' + f.name; a.appendChild(im);
        a.appendChild(el('span', null, f.name));
        lista.appendChild(a);
        return a;
      });
      prontas.hidden = false;
      for (var i = 0; i < links.length; i++) {
        links[i].click();
        await new Promise(function (ok) { setTimeout(ok, 350); });
      }
      avisar(arquivos.length + ' imagens prontas. Se o navegador perguntar, permita baixar vários arquivos — ou toque em cada uma abaixo.');
    } catch (e) {
      var seg = (e && e.name === 'SecurityError') || /tainted|insecure/i.test(String(e && e.message));
      avisar(seg ? 'O navegador bloqueou a montagem das imagens. Abra a página pelo site: ' + SITE
                 : (e && e.message ? e.message : 'Não deu para montar as imagens.'), true);
    } finally { b.disabled = false; }
  });

  montar();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(escalar);
})();
