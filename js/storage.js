/* js/storage.js — persistência e backup. Preenchido em F2. */
(function (raiz) {
  'use strict';
  var Storage = {};
  raiz.Storage = Storage;
  if (typeof module !== "undefined") module.exports = Storage;
})(typeof window !== "undefined" ? window : globalThis);
