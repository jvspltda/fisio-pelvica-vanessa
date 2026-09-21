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

  var barra = document.getElementById('barra');
  if (!barra) return;
  var tipo = barra.getAttribute('data-tipo');          // cartilhas | carta | ficha
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
    var base = { cartilhas: 'orientacoes', carta: 'carta-apresentacao', ficha: 'ficha-avaliacao' }[tipo] || 'material';
    var quem = slug(nomeAtual().replace(/^(Dr\(a\)\.|Dr\.|Dra\.|Enf\.)\s*/, ''));
    var nome = 'vanessa-fernandes-' + base + (quem ? '-' + quem : '');
    if (total > 1) nome += '-' + (i + 1);
    return nome + '.' + ext;
  }
  async function capturar() {
    await carregar(H2C);
    var pags = paginasVisiveis();
    if (!pags.length) throw new Error('Escolha ao menos uma folha.');
    var telas = [];
    for (var i = 0; i < pags.length; i++) {
      avisar('Montando folha ' + (i + 1) + ' de ' + pags.length + '…');
      telas.push(await window.html2canvas(pags[i], { scale: 2, backgroundColor: '#ffffff', useCORS: true, windowWidth: 1280 }));
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
  async function compartilharOuBaixar(arqs) {
    if (navigator.canShare && navigator.canShare({ files: arqs })) {
      try {
        await navigator.share({ files: arqs, title: 'Vanessa Fernandes — Fisioterapia Pélvica' });
        avisar('Pronto.');
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') { avisar(''); return; }
      }
    }
    arqs.forEach(baixar);
    avisar(arqs.length > 1 ? 'Baixados ' + arqs.length + ' arquivos. Anexe no WhatsApp.' : 'Arquivo baixado. Anexe no WhatsApp.');
  }
  function ligar(id, fn) {
    var b = document.getElementById(id);
    if (!b) return;
    b.addEventListener('click', async function () {
      var botoes = barra.querySelectorAll('button');
      botoes.forEach(function (x) { x.disabled = true; });
      try { await fn(); }
      catch (e) { avisar(e.message || 'Não foi possível gerar o arquivo.', true); }
      finally { botoes.forEach(function (x) { x.disabled = false; }); }
    });
  }

  ligar('b-imprimir', async function () { avisar(''); window.print(); });
  ligar('b-pdf', async function () { await compartilharOuBaixar([await montarPDF()]); });
  ligar('b-img', async function () { await compartilharOuBaixar(await montarImagens()); });

  aplicarNome();
})();
