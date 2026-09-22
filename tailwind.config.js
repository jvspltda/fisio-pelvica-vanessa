/* Tailwind compilado localmente para a suíte de avaliação (avaliacao.html).
   Antes vinha do Play CDN (cdn.tailwindcss.com), que o próprio Tailwind
   desaconselha em produção. Mesma versão (3) e mesma configuração padrão
   do CDN, então a aparência não muda.
   Regerar:  npx tailwindcss@3 -c tailwind.config.js -i css/tailwind.src.css -o css/tailwind.css --minify
   A publicação regera sozinha (.github/workflows/publicar.yml). */
module.exports = {
  content: ['./avaliacao.html', './js/app.js', './js/ficha.js', './js/adherence.js', './js/scores.js'],
  theme: { extend: {} },
  plugins: []
};
