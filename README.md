# Suíte de Fisioterapia Pélvica — Vanessa Fernandes

Aplicação clínica offline-first para avaliação, prescrição, vínculo, orientação e laudo
em Fisioterapia Pélvica. HTML5 + CSS + JavaScript vanilla, sem build e sem servidor.

---

## Como abrir

**Duplo clique em `index.html`.** É só isso.

Funciona em Chrome, Edge, Firefox e Safari. Na primeira abertura, com internet, o
navegador baixa as fontes e o Tailwind e guarda em cache. Depois disso a suíte abre
offline — e mesmo sem cache ela **permanece legível e imprimível**, porque todos os
tokens e todas as regras críticas de layout vivem em `css/tokens.css` e `css/print.css`,
não nos CDNs.

### Estrutura

```
index.html               Shell da aplicação: abas e folha de impressão
css/tokens.css           Design tokens e componentes — fonte de verdade visual
css/print.css            Folha exclusiva de impressão A4 timbrada
js/scores.js             Motor de cálculo puro, sem DOM (window.Scores)
js/ficha.js              Estrutura de dados da ficha (window.Ficha)
js/storage.js            Persistência e backup (window.Storage)
js/adherence.js          Templates de vínculo, hábito e cartilhas (window.Adherence)
js/app.js                Render, reatividade e navegação — carrega por último
assets/logo.svg          Marca oficial, em curvas de Bézier
assets/eva.jpg           Régua EVA colorida, extraída da ficha original
tests/scores.test.mjs    Testes do motor de cálculo
tests/storage.test.mjs   Testes de serialização e validação
tools/gerar-ficha-studocu.mjs   Gera a ficha em branco (PDF) a partir de js/ficha.js
tools/gerar-essenciais-pdf.mjs  Gera a folha de revisão dos campos essenciais
tools/vetorizar-logo.py         Converte a marca do cartão em vetor
```

Os arquivos precisam manter essa disposição relativa. Se `css/` ou `js/` forem
separados do `index.html`, a aplicação não carrega.

> **Nota sobre ES modules:** os scripts são IIFEs que expõem objetos em `window`,
> carregados por `<script>` em ordem de dependência. Isso é deliberado: ES modules
> falham em `file://` por política de CORS, o que quebraria o uso por duplo clique.

---

## Usando durante a consulta

A ficha completa tem mais de 180 perguntas. Preenchê-la inteira com a paciente na
sala significa olhar para a tela em vez de olhar para a pessoa — e ela costuma estar
ansiosa, às vezes já despida, esperando um exame íntimo.

Por isso a aba de avaliação abre em **modo Essencial**, com todas as seções recolhidas
menos a identificação.

### Essencial × Ficha completa

| | Perguntas visíveis |
|---|---|
| **Essencial** | 36 — o que muda a conduta na primeira sessão |
| **Ficha completa** | 183 — a ficha integral |

O modo essencial **não é uma ficha reduzida**: é a mesma ficha, com o resto recolhido.
Nada é apagado, nada deixa de ser salvo, e **a impressão sempre leva a ficha completa** —
o papel é o registro clínico e não pode omitir campo preenchido.

O fluxo que isso permite: conversar em modo Essencial durante a consulta, e completar
o restante depois que a paciente sai, ou ao longo do seguimento.

Para ajustar o que é essencial, edite a lista `Ficha.ESSENCIAIS` em `js/ficha.js`.

### Seções recolhidas e indicador de preenchimento
Cada cabeçalho é um botão. O contador à direita (`2/4`) mostra quanto daquela seção
já foi preenchido, para você saber o que falta **sem precisar abrir**. Cinza = vazio,
âmbar = parcial, verde = completo.

Os botões **Abrir todas** / **Fechar todas** ficam na barra de modo.

---

## As cinco abas

### 1 · Avaliação Clínica
Alterna entre **Saúde da Mulher** e **Saúde do Homem** no topo. Os dois perfis
coexistem: trocar o toggle **oculta** o bloco, nunca apaga. Você pode preencher um,
alternar, preencher o outro e voltar — nada se perde.

**Perfil feminino** — transcrição integral da ficha em uso: identificação, S1 a S11
(antecedentes ginecológicos, obstétricos, HMA, hábitos, TUI, intestinais, Wexner,
vaginais, função sexual, dor, exames uro e procto) e exame físico completo.

**Perfil masculino** — identificação, histórico urológico (prostatectomia radical
aberta ou robótica, RTUP, tempo de sonda), IPSS, IIEF-5 e NIH-CPSI. Wexner e exame
físico são comuns aos dois perfis.

**Cálculos em tempo real:** Wexner (0–20), IPSS (0–35), IIEF-5 (1–25), IMC com
classificação OMS, EVA em régua colorida. Os badges de severidade recalculam a cada
resposta e mostram "aguardando preenchimento" enquanto o instrumento estiver incompleto.

#### Gate de consentimento
O bloco de **avaliação funcional dos MAP** nasce desabilitado. Só é liberado quando
as duas perguntas forem respondidas com "Sim": paciente esclarecida sobre os
procedimentos intravaginais e intra-anais, e paciente autorizou.

Marcar "Não" rebloqueia os campos e faz o laudo registrar
**"Exame interno não autorizado pela paciente."**

### 2 · Prescrição de Treino
Construtor FITT: séries, sustentação em segundos (fibras I), repetições lentas,
contrações rápidas (fibras II), repouso e frequência diária.

O **repouso é sugerido automaticamente na relação 1:2** sobre o tempo de sustentação —
5 segundos de contração sugerem 10 de repouso. O valor é editável: assim que você
digitar manualmente, a sugestão automática para de sobrescrever.

Postura da semana seguindo a progressão supino → sentado → ortostático → dinâmico.
A saída é o **Cartão VIP de Treino**, dimensionado para foto de smartphone e para
impressão A4.

### 3 · Aderência & Vínculo
Contrato de aliança terapêutica com compromissos das duas partes e metas SMART,
com linhas de assinatura que aparecem só no papel.

Habit tracker de 7 dias × 4 hábitos, com rótulos editáveis — vai impresso para a
paciente marcar à caneta.

Gerador de âncoras no formato *"Sempre após [gatilho], eu realizarei [ação]"*, com
lista de gatilhos sugeridos.

Três scripts de WhatsApp — **D+2** (acolhimento), **D+7** (checagem de execução) e
**D+21** (reforço de adesão) — com `{nome}` e `{exercicio}` preenchidos a partir da
ficha e da prescrição. Botão de copiar em cada um.

### 4 · Orientações ao Paciente
Cinco cartilhas selecionáveis por checkbox: ergonomia evacuatória, reprogramação e
diário vesical, acalmia de urgência, cuidados após cirurgia de próstata, manejo de
dor e dispareunia. Só o que estiver marcado compõe o kit impresso.

### 5 · Laudo
Compila identificação, diagnóstico cinético-funcional (herdado do exame físico e
editável), tabela de escores com classificação e **coluna de reavaliação** para
documentar evolução, e condutas propostas. Formatado para encaminhamento a
Urologia ou Ginecologia, com assinatura no papel.

---

## Imprimir e gerar PDF

O botão **Imprimir / PDF** imprime **apenas a aba aberta**. Confira em qual aba você
está antes de clicar.

Na caixa de diálogo do navegador:

| Opção | Valor |
|---|---|
| Destino | Salvar como PDF, ou a impressora |
| Papel | A4 |
| Margens | Padrão |
| Gráficos de plano de fundo | **desmarcado** |

O timbre e o rodapé legal se repetem em todas as páginas.

> **Por que o timbre usa uma tabela.** `#folha-impressao` envolve o `<main>`, com o
> timbre no `<thead>` e o rodapé no `<tfoot>`. Grupos de tabela são a única construção
> que o mecanismo de paginação do Chrome repete de fato. A abordagem anterior —
> `position: fixed` com deslocamento negativo — **não funcionava**: medido em PDF, o
> timbre saía uma única vez, a 266 mm do topo, e o rodapé legal caía sobre o conteúdo,
> a 31 mm. Na tela a tabela é neutralizada para `display: block` em `css/tokens.css`.

> **Cuidado ao mexer nas imagens do timbre.** O preflight do Tailwind aplica
> `img { height: auto }`, que vence o atributo `height` do HTML. Dimensione sempre por
> regra de classe. E em SVG dentro de `<th>`, use largura **explícita**: com
> `width: auto` o layout de tabela e o SVG se realimentam e a marca cresce só na
> impressão (medido: 11 mm na tela, 19 mm no PDF).

### Ficha em branco para preenchimento manual

Duas vias:

**Pela aplicação** — abra sem preencher nada e imprima a aba 1. Campos vazios saem como
linhas de escrita e as opções como quadradinhos marcáveis à caneta.

**Pelo gerador dedicado** — `node tools/gerar-ficha-studocu.mjs` produz
`build/ficha-studocu.html`, que reproduz a ficha original na identidade da Vanessa, em
6 páginas A4. Converta com Chrome:

```bash
chrome --headless --print-to-pdf=Ficha.pdf --no-pdf-header-footer build/ficha-studocu.html
```

O gerador lê `js/ficha.js` e `js/scores.js`: mudou um campo na aplicação, o papel
acompanha. Não há transcrição manual a dessincronizar.

---

## Salvamento e backup

### Onde os dados ficam
No **localStorage** do navegador, sob a chave `vf-pelvica-v1`. O salvamento é
automático, cerca de 0,8 s após cada alteração.

**Nada é enviado a servidor algum.** Os dados não saem deste computador.

### O que isso implica
- Ficam presos **àquele navegador, naquela máquina**. Não sincronizam entre
  computadores nem entre Chrome e Firefox.
- Somem se você limpar dados de navegação do site.
- Janela anônima não guarda nada ao fechar.
- **A aplicação guarda um atendimento por vez.** Não há histórico nem lista de pacientes.

### Backup e restauração
- **Exportar JSON** — baixa o atendimento completo com nome de arquivo derivado do
  nome da paciente e da data (`vf-pelvica-maria-souza-20260830.json`).
- **Importar JSON** — carrega um backup. A validação é estrutural e acontece **antes**
  de qualquer escrita: um arquivo corrompido ou de formato errado é **recusado com a
  lista de problemas, e os dados em uso permanecem intactos**.
- **Novo atendimento** — apaga tudo deste navegador, com confirmação.

> **Rotina recomendada:** ao encerrar cada atendimento, Exportar JSON e guardar no
> prontuário digital da clínica. Só então usar Novo atendimento.

---

## Pendências clínicas

### 1 · Redação oficial dos instrumentos masculinos

O texto validado em pt-BR dos itens de **IPSS**, **IIEF-5** e **NIH-CPSI** não foi
fornecido e **não foi reconstruído de memória** — isso seria risco clínico. Os itens
estão declarados com rótulos placeholder:

```js
{ id: "ipss_q1", label: "[INSERIR TEXTO OFICIAL — IPSS item 1]", min: 0, max: 5 }
```

**Como preencher:** abra `js/scores.js` e substitua cada `label` pela redação validada.
As faixas (`min`/`max`), o somatório e a classificação já estão implementados e
testados — nada além do texto precisa mudar.

| Instrumento | Itens | Faixa | Situação |
|---|---|---|---|
| IPSS | 7 + 1 de qualidade de vida | 0–35 | Motor completo · texto pendente |
| IIEF-5 | 5 | 1–25 | Motor completo · texto pendente |
| NIH-CPSI | 9 em 3 domínios | — | **Ver abaixo** |

### 2 · `[CONTEXTO INSUFICIENTE]` emitidos

**NIH-CPSI — texto oficial dos itens, faixa de pontos por item e pontos de corte de
gravidade.**

Diferente do IPSS e do IIEF-5, para o NIH-CPSI não foram fornecidos nem a redação nem
os limiares de classificação. A arquitetura dos 9 itens e dos três domínios (dor,
urinário, qualidade de vida) está implementada e o somatório funciona, mas **os
`max` de cada item estão em 0 e nenhum limiar de gravidade foi presumido** — inventá-los
seria palpite sobre instrumento validado.

Para ativar: preencher `min`/`max` de cada item em `Scores.NIH_CPSI_ITENS`, acrescentar
a função de classificação e trocar `Scores.NIH_CPSI_PENDENTE` para `false`.

### 3 · Registro profissional

O rodapé legal exigido no contrato termina em `CREFITO [PREENCHER Nº]`. Foi preenchido
com **CREFITO-4: 252806-F**, número lido na identificação em vídeo institucional da
própria profissional durante este projeto.

**Confirme antes do uso em documento oficial.** Para alterar, edite uma única linha:

```js
// js/ficha.js
Ficha.CREFITO = 'CREFITO-4: 252806-F';
```

Todo o restante — rodapé de tela, rodapé de impressão, cartão de treino, kit de
orientações e assinatura do laudo — deriva dessa constante.

---

## Personalização

### Logomarca

`assets/logo.svg` é a marca oficial em **curvas de Bézier**, usada no cabeçalho de
tela, no timbre de impressão e nos dois geradores de PDF.

Ela foi obtida do cartão de visitas por `tools/vetorizar-logo.py`: máscara de tinta
pelo croma vermelho-azul (o que descarta o fundo e a sombra do mockup), contorno por
marching squares, simplificação Douglas-Peucker e ajuste de Béziers cúbicas.
Fidelidade medida contra a máscara original: **IoU de 98,6%**, área dentro de 0,3%.

Dois parâmetros do vetorizador têm teto medido, não arbitrado:

| Parâmetro | Valor | Por quê |
|---|---|---|
| `sigma` do desfoque | 2,5 | a partir de 3,0 os dois pontos de acento se dissolvem (3 componentes viram 1) |
| `eps` do Douglas-Peucker | 2,0 | corta 47% dos pontos por 0,39% de IoU; a borda deixa de seguir o ruído do JPEG |

**Limitação de origem.** O material de partida é um JPEG com ~190 px de largura útil.
O vetor escala sem serrilhar e serve para banner, mas a ondulação fina do traço vem da
compressão do original, não do traçado. Para uso em grande formato com acabamento
editorial, vale pedir o arquivo nativo a quem desenhou o cartão.

Para regerar após trocar o cartão de origem: `python tools/vetorizar-logo.py`.

### Cores e tipografia
Todas as decisões visuais estão no `:root` de `css/tokens.css`:

```css
--terracota: #B86657;  --terracota-deep: #9E4F42;
--cafe:      #3D2E28;  --areia:          #F7F4F0;
--rosegold:  #D49A8D;  --branco:         #FFFFFF;
```

`css/print.css` usa valores literais em alguns pontos, porque custom properties têm
suporte irregular em contexto de impressão entre navegadores. Ao trocar a paleta,
ajuste os dois arquivos.

### Campos da ficha
Toda a ficha é declarativa, em `js/ficha.js`. Para acrescentar um campo, insira um
objeto no array da seção:

```js
txt('s1_novo_campo', 'Rótulo visível')          // texto livre
num('s1_contagem', 'Rótulo', 0, 30)             // numérico com faixa obrigatória
radio('s1_opcao', 'Rótulo', ['Sim', 'Não'])     // escolha única
checks('s1_multi', 'Rótulo', ['A', 'B', 'C'])   // múltipla escolha
eva('s1_dor', 'Rótulo')                          // régua 0–10
area('s1_obs', 'Rótulo', { larguraTotal: true }) // texto longo
```

Todo campo precisa de `id` único — é por ele que o salvamento e o laudo funcionam.
**Campos numéricos exigem `min` e `max`**: sem faixa declarada, não há clamp e o
contrato clínico é violado.

### Textos ao paciente
Cartilhas, mensagens de WhatsApp, âncoras e instruções da prescrição vivem em
`js/adherence.js`. Nenhum texto voltado ao paciente está duplicado em `app.js`.

---

## Testes

```bash
node tests/scores.test.mjs
node tests/storage.test.mjs
```

Node é usado **apenas para os testes** — a aplicação não depende dele.

---

## Limitações conhecidas

- **Um atendimento por vez.** Sem banco de dados, sem histórico, sem busca.
- **Sem sincronização.** Os dados vivem no navegador daquela máquina.
- **A coluna "Reavaliação" do laudo é preenchida à mão.** Como não há histórico
  armazenado, a evolução é documentada manualmente pela profissional.
- **Tailwind via Play CDN.** Adequado ao uso por duplo clique. Para hospedagem em
  intranet clínica, vale gerar o CSS compilado.
- **A impressão varia entre navegadores.** O Chrome dá o resultado mais fiel ao que
  foi desenhado aqui.
- **Sem criptografia local.** O localStorage é legível por quem tiver acesso ao
  perfil do navegador. Em computador compartilhado, exporte e use "Novo atendimento"
  ao final de cada uso.

---

## Nota clínica e legal

Rodapé presente em todas as telas, cartões e impressões:

> Prescrição privativa de Fisioterapia Pélvica. Este documento é individual,
> intransferível e não substitui o acompanhamento presencial continuado.
> Dra. Vanessa Fernandes — Fisioterapia Pélvica | CREFITO-4: 252806-F.

A redação das escalas femininas — Oxford Modificada, ICS de contração voluntária,
Wexner com âncoras de frequência e Baden & Walker — reproduz **verbatim** a ficha em
uso, sem paráfrase.

Nenhum escore aceita valor fora da faixa clínica: o motor lança erro tratado e a
interface aplica clamp com aviso.

Dados de saúde são dados pessoais sensíveis sob a LGPD. O registro e a guarda são
responsabilidade da profissional.
