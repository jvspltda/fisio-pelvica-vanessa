/* js/scores.js — motor de cálculo puro (sem DOM). Preenchido em F1. */
(function (raiz) {
  'use strict';
  var Scores = {};
  raiz.Scores = Scores;
  if (typeof module !== "undefined") module.exports = Scores;
})(typeof window !== "undefined" ? window : globalThis);
