/* ════════════════════════════════════════════════════════════════
   js/externas.js — Bibliotecas de fora, baixadas só quando usadas.

   html2canvas (e jsPDF) vêm do cdnjs com verificação de integridade
   (SRI): se o arquivo servido mudar, o navegador recusa. Os mesmos
   hashes estão em tools/impressos-cliente.js (embutido nos impressos);
   tests/carrossel.test.mjs confere que os dois não se separam.
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var X = {};
  X.LIBS = {
    html2canvas: { src: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      integrity: 'sha512-BNaRQnYJYiPSqHHDb58B0yaPfCu+Wgds8Gp/gU33kqBtgNS4tSPHuGibyoeqMV/TJlSKda6FXzoEyYGjTe+vXA==' },
    jspdf: { src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      integrity: 'sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==' }
  };

  X.carregar = function (nome) {
    var lib = X.LIBS[nome];
    return new Promise(function (ok, falha) {
      if (!lib) return falha(new Error('Biblioteca desconhecida: ' + nome));
      if (document.querySelector('script[src="' + lib.src + '"]')) return ok();
      var s = document.createElement('script');
      s.src = lib.src; s.integrity = lib.integrity; s.crossOrigin = 'anonymous';
      s.onload = function () { ok(); };
      s.onerror = function () { s.remove(); falha(new Error('Sem internet para montar as imagens. Tente de novo com a conexão ligada.')); };
      document.head.appendChild(s);
    });
  };

  raiz.Externas = X;
  if (typeof module !== 'undefined') module.exports = X;

})(typeof window !== 'undefined' ? window : globalThis);
