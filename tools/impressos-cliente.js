/* ----------------------------------------------------------------
   tools/impressos-cliente.js

   Barra de personalização dos impressos (cartilhas, carta, ficha).
   Os geradores embutem este arquivo inteiro num <script> de cada
   página; não é carregado sozinho.

   Tudo acontece no navegador de quem usa:
     - o nome digitado vai para a folha e para o nome do arquivo;
     - NÃO é salvo em lugar nenhum (nem localStorage): recarregou a
       página, sumiu. É nome de paciente — dado pessoal de saúde.
     - PDF e imagem são montados aqui mesmo (html2canvas + jsPDF, de
       cdnjs, baixados só no clique). Imprimir não precisa de internet.

   Contrato com a página:
     .pagina            uma folha A4 (cartilhas e carta)
     [data-nome-alvo]   onde o nome digitado aparece
     [data-nome-vazio]  o que aparece enquanto o nome está em branco
     #barra             a barra (fica fora da impressão)
   ---------------------------------------------------------------- */
(function () {
  'use strict';

  var H2C = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  var JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  /* Integridade (SRI): se o arquivo servido pelo cdnjs mudar, o navegador
     recusa e o botão cai no aviso de "Use Imprimir / PDF". Hashes
     conferidos em 2026-10-29 com os publicados pelo próprio cdnjs. */
  var INTEGRIDADE = {};
  INTEGRIDADE[H2C] = 'sha512-BNaRQnYJYiPSqHHDb58B0yaPfCu+Wgds8Gp/gU33kqBtgNS4tSPHuGibyoeqMV/TJlSKda6FXzoEyYGjTe+vXA==';
  INTEGRIDADE[JSPDF] = 'sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==';

  var barra = document.getElementById('barra');
  if (!barra) return;
  var tipo = barra.getAttribute('data-tipo');          // cartilhas | carta | ficha | plano
  var campoNome = document.getElementById('b-nome');
  var campoTrat = document.getElementById('b-trat');
  var aviso = document.getElementById('b-aviso');
  var campoServico = document.getElementById('b-servico');
  var campoMsg = document.getElementById('b-msg');

  function avisar(txt, erro) {
    if (!aviso) return;
    aviso.textContent = txt || '';
    aviso.className = erro ? 'erro' : '';
  }

  /* ---------- nome na folha ---------- */
  function nomeAtual() {
    var n = (campoNome && campoNome.value || '').trim();
    if (!n) return '';
    if (campoTrat && campoTrat.value) return campoTrat.value + ' ' + n;
    return n;
  }
  function aplicarNome() {
    var n = nomeAtual();
    document.querySelectorAll('[data-nome-alvo]').forEach(function (el) {
      el.textContent = n;
    });
    document.querySelectorAll('[data-nome-vazio]').forEach(function (el) {
      el.hidden = !!n;
    });
    document.querySelectorAll('[data-nome-cheio]').forEach(function (el) {
      el.hidden = !n;
    });
    /* carta: saudacao concorda com o titulo escolhido */
    var t = campoTrat ? campoTrat.value : '';
    var conc = { 'Dra.': ['Prezada', 'À'], 'Dr.': ['Prezado', 'Ao'] }[t] || ['Prezado(a)', 'À(o)'];
    document.querySelectorAll('[data-prezado]').forEach(function (el) { el.textContent = conc[0]; });
    document.querySelectorAll('[data-ao]').forEach(function (el) { el.textContent = conc[1]; });
    /* carta: bloco do destinatario e mensagem pessoal */
    var sv = (campoServico && campoServico.value || '').trim();
    var ms = (campoMsg && campoMsg.value || '').trim();
    document.querySelectorAll('[data-servico-alvo]').forEach(function (el) { el.textContent = sv; el.hidden = !sv; });
    document.querySelectorAll('[data-destino]').forEach(function (el) { el.hidden = !(n || sv); });
    document.querySelectorAll('[data-msg-alvo]').forEach(function (el) { el.textContent = ms; el.hidden = !ms; });
  }
  if (campoNome) campoNome.addEventListener('input', aplicarNome);
  if (campoTrat) campoTrat.addEventListener('change', aplicarNome);
  if (campoServico) campoServico.addEventListener('input', aplicarNome);
  if (campoMsg) campoMsg.addEventListener('input', aplicarNome);

  /* ---------- data de hoje (carta e ficha) ---------- */
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
               'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var campoData = document.getElementById('b-data');
  function aplicarData() {
    var ligado = campoData && campoData.checked;
    var h = new Date();
    document.querySelectorAll('[data-data-extenso]').forEach(function (el) {
      el.textContent = ligado ? (h.getDate() + ' de ' + MESES[h.getMonth()] + ' de ' + h.getFullYear()) : '';
    });
    document.querySelectorAll('[data-data-dia]').forEach(function (el) { el.textContent = ligado ? String(h.getDate()).padStart(2, '0') : ''; });
    document.querySelectorAll('[data-data-mes]').forEach(function (el) { el.textContent = ligado ? String(h.getMonth() + 1).padStart(2, '0') : ''; });
    document.querySelectorAll('[data-data-ano]').forEach(function (el) { el.textContent = ligado ? String(h.getFullYear()) : ''; });
    document.querySelectorAll('[data-data-vazio]').forEach(function (el) { el.hidden = !!ligado; });
    document.querySelectorAll('[data-data-cheio]').forEach(function (el) { el.hidden = !ligado; });
  }
  if (campoData) { campoData.addEventListener('change', aplicarData); aplicarData(); }

  /* ---------- escolher cartilhas ---------- */
  var caixas = document.querySelectorAll('[data-escolhe]');
  function aplicarEscolha() {
    caixas.forEach(function (cx) {
      var pag = document.getElementById(cx.getAttribute('data-escolhe'));
      if (pag) pag.hidden = !cx.checked;
    });
  }
  caixas.forEach(function (cx) { cx.addEventListener('change', aplicarEscolha); });
  var todas = document.getElementById('b-todas');
  if (todas) todas.addEventListener('click', function () {
    var marcar = Array.prototype.some.call(caixas, function (c) { return !c.checked; });
    caixas.forEach(function (c) { c.checked = marcar; });
    aplicarEscolha();
  });

  /* ---------- arquivos ---------- */
  function carregar(src) {
    return new Promise(function (ok, falha) {
      if (document.querySelector('script[src="' + src + '"]')) return ok();
      var s = document.createElement('script');
      s.src = src;
      s.integrity = INTEGRIDADE[src];
      s.crossOrigin = 'anonymous';
      s.onload = ok;
      s.onerror = function () { falha(new Error('Sem internet para montar o arquivo. Use "Imprimir / PDF".')); };
      document.head.appendChild(s);
    });
  }
  function paginasVisiveis() {
    return Array.prototype.filter.call(document.querySelectorAll('.pagina'), function (p) { return !p.hidden; });
  }
  function slug(t) {
    return (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function nomeArquivo(ext, i, total) {
    var base = { cartilhas: 'orientacoes', carta: 'carta-apresentacao', ficha: 'ficha-avaliacao',
                 plano: 'plano-para-casa' }[tipo] || 'material';
    var quem = slug(nomeAtual().replace(/^(Dr\(a\)\.|Dr\.|Dra\.|Enf\.)\s*/, ''));
    var nome = 'vanessa-fernandes-' + base + (quem ? '-' + quem : '');
    if (total > 1) nome += '-' + (i + 1);
    return nome + '.' + ext;
  }
  /* Cópia que vira arquivo (html2canvas):
     - sem a sombra da prévia, que ele pinta como um bloco cinza;
     - sem hifenização automática, que ele desenha como palavra partida
       ("afastad os"). Se sem hífen a folha não couber mais, ela fica com
       hífen — melhor uma palavra partida do que texto cortado. */
  function prepararCopia(doc) {
    var st = doc.createElement('style');
    st.textContent = '.pagina, .pagina *{ hyphens:manual !important; -webkit-hyphens:manual !important; }' +
      '.pagina.com-hifen, .pagina.com-hifen *{ hyphens:auto !important; -webkit-hyphens:auto !important; }';
    doc.head.appendChild(st);
    doc.querySelectorAll('.pagina').forEach(function (p) {
      p.style.boxShadow = 'none';
      var c = p.querySelector('.corpo');
      if (p.scrollHeight > p.clientHeight + 1 || (c && c.scrollHeight > c.clientHeight + 1)) p.classList.add('com-hifen');
    });
  }
  async function capturar() {
    await carregar(H2C);
    var pags = paginasVisiveis();
    if (!pags.length) throw new Error('Escolha ao menos uma folha.');
    var telas = [];
    for (var i = 0; i < pags.length; i++) {
      avisar('Montando folha ' + (i + 1) + ' de ' + pags.length + '…');
      /* exercícios: escala 3 (~290 pontos por polegada no A4), para as figuras
         saírem nítidas também no PDF e na imagem enviados pelo WhatsApp */
      /* a sombra da prévia (box-shadow) o html2canvas pinta como um bloco
         cinza por cima da folha: sai só na cópia que vira arquivo */
      telas.push(await window.html2canvas(pags[i], { scale: tipo === 'plano' ? 3 : 2, backgroundColor: '#ffffff', useCORS: true, windowWidth: 1280,
        onclone: prepararCopia }));
    }
    return telas;
  }
  async function montarPDF() {
    var telas = await capturar();
    await carregar(JSPDF);
    var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
    telas.forEach(function (c, i) {
      if (i) pdf.addPage();
      pdf.addImage(c.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297);
    });
    return new File([pdf.output('blob')], nomeArquivo('pdf', 0, 1), { type: 'application/pdf' });
  }
  async function montarImagens() {
    var telas = await capturar();
    var arqs = [];
    for (var i = 0; i < telas.length; i++) {
      var blob = await new Promise(function (r) { telas[i].toBlob(r, 'image/jpeg', 0.9); });
      arqs.push(new File([blob], nomeArquivo('jpg', i, telas.length), { type: 'image/jpeg' }));
    }
    return arqs;
  }
  function baixar(arq) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(arq);
    a.download = arq.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 8000);
  }
  /* No celular (e no Chrome/Edge recentes do Windows) o compartilhar
     abre direto a lista de apps, com o WhatsApp. Onde não houver,
     o arquivo é baixado para anexar no WhatsApp Web. */
  /* Montar várias folhas leva segundos, e o navegador só deixa abrir o
     compartilhar logo depois de um toque. Se a permissão tiver expirado,
     aparece "Compartilhar agora", e o toque nele abre a lista de apps. */
  function botaoCompartilhar(arqs) {
    var b = document.getElementById('b-compartilhar');
    if (!b) {
      b = document.createElement('button'); b.id = 'b-compartilhar'; b.type = 'button'; b.className = 'pri';
      b.textContent = 'Compartilhar agora';
      aviso.parentNode.insertBefore(b, aviso);
    }
    b.hidden = false;
    b.onclick = async function () {
      try { await navigator.share({ files: arqs, title: 'Vanessa Fernandes — Fisioterapia Pélvica' }); avisar('Pronto.'); b.hidden = true; }
      catch (e) { if (!(e && e.name === 'AbortError')) { b.hidden = true; arqs.forEach(baixar); avisar('Arquivo baixado. Anexe no WhatsApp.'); } }
    };
    avisar('Arquivo pronto. Toque em "Compartilhar agora".');
  }
  async function compartilharOuBaixar(arqs) {
    var velho = document.getElementById('b-compartilhar'); if (velho) velho.hidden = true;
    if (navigator.canShare && navigator.canShare({ files: arqs })) {
      try {
        await navigator.share({ files: arqs, title: 'Vanessa Fernandes — Fisioterapia Pélvica' });
        avisar('Pronto.');
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') { avisar(''); return; }
        if (e && e.name === 'NotAllowedError') { botaoCompartilhar(arqs); return; }
      }
    }
    arqs.forEach(baixar);
    avisar(arqs.length > 1 ? 'Baixados ' + arqs.length + ' arquivos. Anexe no WhatsApp.' : 'Arquivo baixado. Anexe no WhatsApp.');
  }
  /* Aberta direto do arquivo (duplo clique), a página não pode
     transformar as figuras em PDF ou imagem: o navegador bloqueia
     ("canvas contaminado"). Imprimir continua funcionando. */
  function mensagemDeErro(e) {
    var m = String(e && e.message || '');
    if ((e && e.name === 'SecurityError') || /tainted|insecure/i.test(m) || location.protocol === 'file:')
      return 'Aberta do arquivo do computador, a página não consegue montar o PDF ou a imagem. Use "Imprimir / PDF", ou abra pelo site: https://jvspltda.github.io/fisio-pelvica-vanessa/';
    return m || 'Não foi possível gerar o arquivo.';
  }
  function ligar(id, fn) {
    var b = document.getElementById(id);
    if (!b) return;
    b.addEventListener('click', async function () {
      var botoes = barra.querySelectorAll('button');
      botoes.forEach(function (x) { x.disabled = true; });
      try { await fn(); }
      catch (e) { avisar(mensagemDeErro(e), true); }
      finally { botoes.forEach(function (x) { x.disabled = false; }); }
    });
  }

  ligar('b-imprimir', async function () { avisar(''); window.print(); });
  ligar('b-pdf', async function () { await compartilharOuBaixar([await montarPDF()]); });
  ligar('b-img', async function () { await compartilharOuBaixar(await montarImagens()); });

  aplicarNome();
})();
