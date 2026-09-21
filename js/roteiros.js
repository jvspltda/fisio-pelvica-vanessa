/* ════════════════════════════════════════════════════════════════
   js/roteiros.js — Roteiros de Reels e o papel de cada um no tráfego pago.

   Fonte única: a página roteiros.html lê daqui. Revisado em 2026-09-21.

   Padrão aprovado pela Vanessa: ~45 s, abre com uma pergunta sobre o que
   a paciente sente, linguagem do dia a dia, fecha em "isso pede
   avaliação". Nenhuma fala cita estudo, autor, ano ou porcentagem — as
   fontes ficam em "lastro", para conferência, não para ir ao ar.

   Anúncio pago: a política de atributos pessoais da Meta proíbe texto que
   pergunte ou insinue a condição de saúde de quem vê ("Do you have
   diabetes?" é o exemplo dela). Por isso cada roteiro tem:
     - aberturaAnuncio: primeira fala neutra, gravada na mesma sessão,
       para a versão impulsionada;
     - anuncio.texto / anuncio.titulo: falam do serviço, não da pessoa.
   ════════════════════════════════════════════════════════════════ */
(function (raiz) {
  'use strict';

  var R = {};

  R.WHATSAPP = '553138681120';          // (31) 3868-1120, WhatsApp da clínica
  R.SELO = 'Vanessa Fernandes · Fisioterapeuta · CREFITO-4: 252806-F';
  R.CARTELA = [
    'Vanessa Fernandes',
    'Fisioterapeuta · CREFITO-4: 252806-F',
    'FISIOTERAPIA PÉLVICA',
    'Clínica Veracis · Rodovia MG-010, 598 · Bela Vista Mall',
    'Conceição do Mato Dentro/MG',
    'Agende pelo WhatsApp: (31) 3868-1120',
    '@vanessa.fernands · @clinicaveracis',
    '[data da publicação]'
  ];
  R.RODAPE_LEGENDA =
    'Agende pelo WhatsApp da clínica: (31) 3868-1120 · Clínica Veracis, Rodovia MG-010, 598, Bela Vista Mall, Conceição do Mato Dentro\n' +
    'Vanessa Fernandes · Fisioterapeuta · CREFITO-4: 252806-F · @vanessa.fernands · @clinicaveracis';

  R.NUNCA = ['garanto', 'resultado garantido', 'infalível', 'a solução', 'eficaz', 'cura', 'não é normal',
             'antes e depois', 'depoimento de paciente', 'valor da consulta'];

  R.CHECKLIST = [
    'Selo com nome, "Fisioterapeuta" e CREFITO-4: 252806-F do início ao fim',
    'Data da publicação na cartela final',
    'Nenhuma imagem de paciente, depoimento ou antes e depois',
    'Nenhum valor de consulta — na peça, na legenda ou nos comentários',
    'Nenhuma palavra da lista de "nunca dizer"',
    'Nenhum número, nome de estudo ou "segundo a ciência" na fala',
    'Nenhum quadro com a marca da clínica antiga',
    'Para anúncio: usar a abertura neutra e o texto de anúncio desta página'
  ];

  R.GRAVACAO = [
    'Fundo: sala de atendimento ou corredor da recepção da Veracis. A placa da clínica não é a assinatura da peça — quem anuncia é você.',
    'Vertical 1080×1920, plano médio, olhos no terço de cima.',
    'Luz de frente (janela ou softbox), nunca de costas para a luz.',
    'Microfone de lapela sempre.',
    'Grave as DUAS aberturas de cada roteiro: a do post e a neutra, para anúncio.',
    'Salve o projeto de edição junto do vídeo final — sem ele, corrigir depois exige regravar.'
  ];

  R.SERIES = [
    { id: 'gestantes', nome: 'Gestantes', descricao: 'Série nova, para a gestação e o pós-parto.' },
    { id: 'regravacao', nome: 'Regravação dos antigos', descricao: 'Substituem os Reels gravados na clínica anterior.' }
  ];

  R.LISTA = [
    /* ───────────── GESTANTES ───────────── */
    {
      id: 'G1', serie: 'gestantes', titulo: 'Escape de urina na gravidez', duracao: '45 s',
      objetivo: 'Captar a queixa mais comum da gestação, sem prometer nada.',
      cenas: [
        { tempo: '0–6 s', imagem: 'Você na sala, plano médio, olhando para a câmera', fala: 'Escapou um pouquinho de urina quando você tossiu, riu ou espirrou? Se isso está acontecendo na sua gravidez, presta atenção nesse vídeo.', tela: 'Escapou xixi na gravidez?' },
        { tempo: '6–20 s', imagem: 'Mesmo plano', fala: 'O bebê cresce, o peso todo vai pra frente e a musculatura lá embaixo, que segura a bexiga, passa a trabalhar muito mais. Aí, numa tossida, escapa. Acontece bastante — e não quer dizer que você tem que conviver com isso até o fim da gestação.', tela: 'Por que acontece' },
        { tempo: '20–36 s', imagem: 'Sala de atendimento, sem ninguém na maca', fala: 'Na consulta eu vejo se essa musculatura está forte, se ela está no tempo certo e se ela aguenta. Olho também os seus hábitos: quanto você bebe, de quanto em quanto tempo vai ao banheiro. Com isso a gente monta um jeito de treinar que cabe na sua rotina — e eu confiro com você se está fazendo do jeito certo, porque apertar a barriga não é treinar o assoalho pélvico.', tela: 'O que eu avalio' },
        { tempo: '36–45 s', imagem: 'Plano médio, tom acolhedor', fala: 'Se você se reconheceu, isso aqui pede avaliação. Me chama no WhatsApp da clínica.', tela: 'Isso pede avaliação' }
      ],
      legenda: 'Escapou um pouquinho de xixi quando tossiu, riu ou espirrou? Na gravidez isso aparece bastante — e não é algo que você precise simplesmente aguentar até o parto.\n\nO bebê cresce, o peso vai pra frente e a musculatura que segura a bexiga passa a trabalhar bem mais. Na consulta eu avalio essa musculatura e os seus hábitos de banheiro, e a gente monta um treino que cabe na sua rotina, conferindo se está sendo feito do jeito certo.',
      hashtags: '#fisioterapiapelvica #gravidez #gestante #conceicaodomatodentro',
      trafego: {
        prioridade: 'Semana 2', objetivo: 'Mensagens (WhatsApp)',
        publico: 'Mulheres de 20 a 45 anos, Conceição do Mato Dentro + 25 km',
        aberturaAnuncio: 'Na gravidez, escapar um pouco de urina ao tossir ou rir é comum — e tem avaliação.',
        anuncio: { titulo: 'Fisioterapia pélvica na gestação', texto: 'Avaliação do assoalho pélvico na gravidez, com um plano de exercícios que cabe na rotina. Atendimento com hora marcada na Clínica Veracis, em Conceição do Mato Dentro.' }
      },
      lastro: [
        ['"quem trabalha essa musculatura… costuma se queixar menos"', 'Revisão Cochrane 2020 (Woodley SJ e cols., CD007471.pub4): treino no pré-natal reduziu o relato de incontinência no fim da gestação e no pós-parto. https://pmc.ncbi.nlm.nih.gov/articles/PMC7203602/ (acesso em 2026-09-20)'],
        ['"apertar a barriga não é treinar"', 'Texto já usado com pacientes em js/adherence.js (cartilha pós-prostatectomia).']
      ]
    },
    {
      id: 'G2', serie: 'gestantes', titulo: 'Dor nas costas e peso embaixo da barriga', duracao: '45 s',
      objetivo: 'Apresentar o serviço pela queixa que quase toda gestante tem.',
      cenas: [
        { tempo: '0–6 s', imagem: 'Plano médio', fala: 'Está com dor nas costas, um peso embaixo da barriga, e alguém já te disse que é assim mesmo, que é da gravidez?', tela: '"É assim mesmo"? Não é bem assim' },
        { tempo: '6–20 s', imagem: 'Mesmo plano', fala: 'Seu corpo mudou muito rápido: a barriga puxa você pra frente, a postura se ajusta pra compensar, e algumas partes passam a trabalhar dobrado. É isso que dói. E dor tem explicação — e tem o que fazer.', tela: 'O corpo mudou rápido' },
        { tempo: '20–36 s', imagem: 'Sala de atendimento', fala: 'Eu vejo como você respira, como você senta, como você levanta da cama, o que dói em qual movimento. Daí saem os ajustes do dia a dia e os exercícios certos pro seu trimestre. Nada de exercício de internet que serve pra todo mundo.', tela: 'O que eu avalio' },
        { tempo: '36–45 s', imagem: 'Plano médio', fala: 'Você não precisa aguentar calada até o parto. Isso pede avaliação.', tela: 'Isso pede avaliação' }
      ],
      legenda: '"É assim mesmo, é da gravidez." Você já ouviu isso?\n\nDor nas costas e peso na pelve aparecem porque o corpo muda muito rápido, e algumas partes passam a trabalhar dobrado. Isso tem explicação e tem o que fazer.\n\nNa consulta eu olho respiração, postura e os movimentos que doem, e a partir daí a gente ajusta a rotina e escolhe os exercícios certos para o seu trimestre.',
      hashtags: '#fisioterapiapelvica #gravidez #dornascostas #gestante',
      trafego: {
        prioridade: 'Reforço (semana 3), se for o que mais trouxer conversa', objetivo: 'Mensagens (WhatsApp)',
        publico: 'Mulheres de 20 a 45 anos, Conceição do Mato Dentro + 25 km',
        aberturaAnuncio: 'Dor nas costas e peso na pelve na gravidez têm explicação — e têm o que fazer.',
        anuncio: { titulo: 'Gestação com menos dor', texto: 'Avaliação de postura, respiração e movimento na gestação, com exercícios escolhidos para cada trimestre. Hora marcada na Clínica Veracis, Conceição do Mato Dentro.' }
      },
      lastro: []
    },
    {
      id: 'G3', serie: 'gestantes', titulo: 'Como é a primeira consulta', duracao: '50 s',
      objetivo: 'Derrubar o medo do exame íntimo, que é a maior barreira para procurar ajuda.',
      cenas: [
        { tempo: '0–6 s', imagem: 'Plano médio', fala: 'Muita gente adia a consulta com a fisioterapeuta pélvica com medo do que vai acontecer na sala. Então deixa eu te contar exatamente como é.', tela: 'Como é a primeira consulta' },
        { tempo: '6–18 s', imagem: 'Sala, mostrando cadeira e mesa, sem ninguém deitado', fala: 'Primeiro a gente senta e conversa. Vestida, sem pressa. Eu pergunto da sua gravidez, do seu intestino, da sua bexiga, do seu sono, do que te incomoda.', tela: '1 · A gente conversa' },
        { tempo: '18–34 s', imagem: 'Mesma sala', fala: 'Depois eu examino postura, respiração, barriga. E o exame lá embaixo, se for o caso, só acontece depois que eu explico o que vou fazer e você disser que pode. Se você não quiser, tudo bem — a consulta continua e a gente segue por outro caminho.', tela: '2 · Você autoriza cada passo' },
        { tempo: '34–44 s', imagem: 'Plano médio', fala: 'No fim você sai com um papel na mão: o que fazer em casa e quando voltar.', tela: '3 · Você sai com um plano escrito' },
        { tempo: '44–50 s', imagem: 'Cartela final', fala: '—', tela: 'Cartela final' }
      ],
      legenda: '"O que vai acontecer nessa consulta?" é a pergunta que mais chega aqui — e é por causa dela que muita mulher adia.\n\nPrimeiro a gente senta e conversa, vestida e sem pressa. Depois eu examino postura, respiração e barriga. O exame íntimo, quando indicado, só acontece depois que eu explico cada passo e você autoriza — e você pode dizer não a qualquer momento.\n\nVocê sai com um plano escrito e com a data do retorno.',
      hashtags: '#fisioterapiapelvica #gestante #primeiraconsulta #acolhimento',
      trafego: {
        prioridade: 'Semana 1', objetivo: 'Mensagens (WhatsApp)',
        publico: 'Mulheres de 20 a 60 anos, Conceição do Mato Dentro + 25 km',
        aberturaAnuncio: 'Como é uma primeira consulta de fisioterapia pélvica, passo a passo.',
        anuncio: { titulo: 'Como é a primeira consulta', texto: 'Conversa sem pressa, exame só com autorização da paciente e um plano escrito ao final. Fisioterapia pélvica com hora marcada na Clínica Veracis, Conceição do Mato Dentro.' }
      },
      lastro: [
        ['o fluxo de consentimento', 'É o que a ficha faz: a avaliação interna só é liberada com as duas perguntas de consentimento respondidas "sim" (README.md, "Gate de consentimento").']
      ]
    },
    {
      id: 'G4', serie: 'gestantes', titulo: 'Treinar antes do parto ajuda depois', duracao: '45 s',
      objetivo: 'Mostrar que o cuidado começa antes do bebê nascer. Tem lastro em pesquisa, que não aparece na fala.',
      cenas: [
        { tempo: '0–6 s', imagem: 'Plano médio', fala: 'Dá pra se preparar antes do parto pra ter menos problema de xixi depois? Dá.', tela: 'Dá pra se preparar antes' },
        { tempo: '6–22 s', imagem: 'Mesmo plano', fala: 'Quem trabalha essa musculatura durante a gestação costuma se queixar menos de escape de urina no fim da gravidez e nos primeiros meses com o bebê. Não é mágica e não é promessa: é músculo trabalhado com orientação, do jeito certo, na hora certa.', tela: 'Músculo trabalhado com orientação' },
        { tempo: '22–38 s', imagem: 'Sala de atendimento', fala: 'E é aí que mora o detalhe: quase todo mundo que tenta sozinho aperta a barriga, aperta o bumbum ou prende a respiração. Faz esforço todo dia e o músculo que precisava trabalhar continua parado. Por isso a gente confere junto antes de virar rotina em casa.', tela: 'O erro mais comum: apertar a barriga' },
        { tempo: '38–45 s', imagem: 'Plano médio', fala: 'Se você está grávida, isso aqui pede avaliação — e quanto antes, melhor.', tela: 'Isso pede avaliação' }
      ],
      legenda: 'Dá pra se preparar antes do parto para ter menos problema de xixi depois.\n\nQuem trabalha a musculatura do assoalho pélvico durante a gestação costuma se queixar menos de escape de urina no fim da gravidez e nos primeiros meses com o bebê. Não é promessa: é músculo trabalhado com orientação.\n\nO detalhe é que, sozinha, a maioria aperta a barriga ou prende a respiração — e o músculo que precisava trabalhar fica parado. Por isso conferimos juntas antes de virar rotina.',
      hashtags: '#fisioterapiapelvica #gravidez #posparto #gestante',
      trafego: {
        prioridade: 'Reforço (semana 3), se for o que mais trouxer conversa', objetivo: 'Mensagens (WhatsApp)',
        publico: 'Mulheres de 20 a 45 anos, Conceição do Mato Dentro + 25 km',
        aberturaAnuncio: 'Preparar o assoalho pélvico na gestação ajuda depois do parto.',
        anuncio: { titulo: 'Preparo do assoalho pélvico', texto: 'Treino do assoalho pélvico na gestação, conferido em consulta antes de virar rotina em casa. Hora marcada na Clínica Veracis, Conceição do Mato Dentro.' }
      },
      lastro: [
        ['"costuma se queixar menos de escape… no fim da gravidez e nos primeiros meses"', 'Revisão Cochrane 2020 (Woodley SJ e cols., CD007471.pub4): evidência de qualidade moderada (fim da gestação) e alta (pós-parto intermediário). https://pmc.ncbi.nlm.nih.gov/articles/PMC7203602/ (acesso em 2026-09-20)'],
        ['"não é promessa"', 'A revisão trata de redução de risco na média dos estudos, não de garantia individual.']
      ]
    },

    /* ───────────── REGRAVAÇÃO ───────────── */
    {
      id: 'A', serie: 'regravacao', titulo: 'Escape de xixi ao tossir, rir ou na academia', duracao: '45 s',
      objetivo: 'Substitui os dois vídeos antigos de incontinência (um deles dizia "de Capelinha e região").',
      cenas: [
        { tempo: '0–6 s', imagem: 'Você na sala da Veracis, plano médio', fala: 'Já escapou xixi quando você tossiu, riu, espirrou ou levantou um peso na academia? Então esse vídeo é pra você.', tela: 'Escapou xixi no esforço?' },
        { tempo: '6–22 s', imagem: 'Mesmo plano', fala: 'Quando você faz força, a pressão dentro da barriga aumenta e empurra a bexiga pra baixo. Quem segura isso é uma musculatura lá embaixo, o assoalho pélvico. Se ela não dá conta naquele momento, escapa. Não é frescura, não é preguiça e não é só coisa de quem teve filho.', tela: 'Por que escapa' },
        { tempo: '22–38 s', imagem: 'Sala de avaliação', fala: 'Na consulta eu vejo se essa musculatura tem força, se ela responde rápido e se ela aguenta o esforço. Vejo também seus hábitos de banheiro. Aí a gente treina do jeito certo — porque apertar a barriga, prender a respiração ou apertar o bumbum não é treinar essa musculatura, e é o que quase todo mundo faz sozinho.', tela: 'O que eu avalio' },
        { tempo: '38–45 s', imagem: 'Plano médio', fala: 'Se você anda evitando pular, correr ou rir solto com medo de escapar, isso pede avaliação.', tela: 'Isso pede avaliação' }
      ],
      legenda: 'Escapou xixi ao tossir, rir, espirrar ou levantar peso na academia?\n\nQuando você faz força, a pressão na barriga empurra a bexiga — e quem segura é a musculatura do assoalho pélvico. Se ela não dá conta naquele momento, escapa. Não é frescura nem é só de quem teve filho.\n\nNa consulta eu avalio força, resposta e resistência dessa musculatura, além dos seus hábitos de banheiro, e a gente treina do jeito certo.',
      hashtags: '#fisioterapiapelvica #incontinenciaurinaria #conceicaodomatodentro',
      trafego: {
        prioridade: 'Semana 1', objetivo: 'Mensagens (WhatsApp)',
        publico: 'Mulheres de 25 a 60 anos, Conceição do Mato Dentro + 25 km',
        aberturaAnuncio: 'Escape de urina ao tossir, rir ou fazer exercício tem nome — e tem avaliação.',
        anuncio: { titulo: 'Fisioterapia pélvica em Conceição', texto: 'Avaliação da musculatura do assoalho pélvico e treino orientado para escape de urina no esforço. Hora marcada na Clínica Veracis, Conceição do Mato Dentro.' }
      },
      lastro: [
        ['"apertar a barriga… é o que quase todo mundo faz sozinho"', 'Texto já usado com pacientes em js/adherence.js.']
      ]
    },
    {
      id: 'B', serie: 'regravacao', titulo: 'Vontade de fazer xixi que chega de repente', duracao: '45 s',
      objetivo: 'Substitui o vídeo antigo sobre urgência.',
      cenas: [
        { tempo: '0–6 s', imagem: 'Plano médio', fala: 'Aquela vontade de fazer xixi que chega de repente e você mal consegue segurar até o banheiro — acontece com você?', tela: 'Vontade que chega de repente' },
        { tempo: '6–22 s', imagem: 'Mesmo plano', fala: 'Tem gente que já decora onde fica o banheiro de cada lugar aonde vai. Que acorda várias vezes à noite. Que sai correndo quando põe a chave na porta de casa. Isso tem nome, tem explicação, e não é da idade.', tela: 'Você decora onde fica o banheiro?' },
        { tempo: '22–38 s', imagem: 'Sala de atendimento', fala: 'Na consulta eu peço um diário: o que você bebe, a que horas, quantas vezes vai ao banheiro. Vejo como a sua musculatura responde. E a gente trabalha duas coisas juntas — acalmar essa urgência e reeducar o hábito da bexiga, que aprendeu a avisar cedo demais.', tela: 'Diário da bexiga · treino' },
        { tempo: '38–45 s', imagem: 'Plano médio', fala: 'Organizar a sua vida em volta do banheiro não precisa ser o seu normal. Isso pede avaliação.', tela: 'Isso pede avaliação' }
      ],
      legenda: 'Aquela vontade de fazer xixi que chega de repente e é difícil segurar até o banheiro tem nome e tem explicação — e não é "da idade".\n\nDecorar onde fica o banheiro de cada lugar, acordar várias vezes à noite, sair correndo ao chegar em casa: tudo isso entra na avaliação.\n\nNa consulta a gente usa um diário da bexiga, eu vejo como a musculatura responde, e trabalhamos acalmar a urgência e reeducar o hábito.',
      hashtags: '#fisioterapiapelvica #bexiga #urgenciaurinaria #conceicaodomatodentro',
      trafego: {
        prioridade: 'Semana 2', objetivo: 'Mensagens (WhatsApp)',
        publico: 'Mulheres de 35 a 70 anos, Conceição do Mato Dentro + 25 km',
        aberturaAnuncio: 'Vontade de urinar que chega de repente tem nome, tem explicação — e não é da idade.',
        anuncio: { titulo: 'Reeducação da bexiga', texto: 'Diário da bexiga, treino da musculatura e estratégias para a urgência urinária. Fisioterapia pélvica com hora marcada na Clínica Veracis, Conceição do Mato Dentro.' }
      },
      lastro: [
        ['"isso tem nome"', 'International Continence Society, definição de urgency (2017): "A compelling need to urinate which is difficult to defer". https://www.ics.org/committees/standardisation/terminologydiscussions/urgency (acesso em 2026-09-20)']
      ]
    },
    {
      id: 'C', serie: 'regravacao', titulo: 'Dor na hora da relação', duracao: '45 s',
      objetivo: 'Substitui o vídeo antigo sobre dispareunia, sem a promessa que ele fazia. Tom mais baixo e mais lento.',
      cenas: [
        { tempo: '0–7 s', imagem: 'Plano médio, olhar direto, tom baixo', fala: 'Dói na hora da relação? Esse é o assunto que quase ninguém tem coragem de levar pro consultório.', tela: 'Dói na hora da relação?' },
        { tempo: '7–22 s', imagem: 'Mesmo plano', fala: 'E olha: os motivos são bem diferentes uns dos outros. Pode ser a musculatura que fica tensa e não relaxa, pode ser cicatriz de parto ou de cirurgia, pode ser ressecamento, pode ser questão ginecológica. Cada motivo pede uma conduta diferente — por isso conselho genérico de internet não resolve.', tela: 'Cada motivo, uma conduta' },
        { tempo: '22–38 s', imagem: 'Sala, sem ninguém na maca', fala: 'Na consulta a gente senta e conversa primeiro, vestida. O exame só acontece depois que eu explico o que vou fazer e você disser que pode. E você pode dizer que não, em qualquer momento — a consulta continua.', tela: 'Você autoriza cada passo' },
        { tempo: '38–45 s', imagem: 'Plano médio', fala: 'Se dói, não é pra aguentar calada. Isso pede avaliação.', tela: 'Isso pede avaliação' }
      ],
      legenda: 'Dói na hora da relação? Esse é o assunto que quase ninguém tem coragem de levar ao consultório — e é justamente um assunto de consulta.\n\nOs motivos são diferentes: musculatura tensa que não relaxa, cicatriz de parto ou cirurgia, ressecamento, questões ginecológicas. Cada um pede uma conduta.\n\nA gente conversa primeiro, vestida. O exame só acontece depois que eu explico cada passo e você autoriza — e você pode dizer não a qualquer momento.',
      hashtags: '#fisioterapiapelvica #dispareunia #saudedamulher',
      trafego: {
        prioridade: 'Só orgânico no começo', objetivo: '—',
        publico: 'Se impulsionar: mulheres a partir de 18 anos, com texto clínico',
        aberturaAnuncio: 'Dor na relação sexual tem causas diferentes — e cada uma pede uma avaliação.',
        anuncio: { titulo: 'Dor na relação: avaliação', texto: 'Avaliação fisioterapêutica da dor na relação sexual, com conversa antes de qualquer exame e consentimento em cada etapa. Clínica Veracis, Conceição do Mato Dentro.' }
      },
      lastro: [
        ['lista de causas', 'São as causas que a própria ficha de avaliação investiga (função sexual, dor e exame físico).']
      ]
    },
    {
      id: 'D', serie: 'regravacao', titulo: 'Depois da cirurgia de próstata', duracao: '45 s',
      objetivo: 'Substitui o vídeo antigo sobre próstata, sem o "eficaz". Fala com o homem e com quem cuida dele.',
      cenas: [
        { tempo: '0–7 s', imagem: 'Plano médio', fala: 'Fez cirurgia de próstata e está perdendo urina? Ou é seu pai, seu marido, que está passando por isso e não fala do assunto?', tela: 'Depois da cirurgia de próstata' },
        { tempo: '7–22 s', imagem: 'Mesmo plano', fala: 'Homem também tem assoalho pélvico, e é essa musculatura que ajuda a segurar o xixi. Depois da cirurgia ela precisa reaprender a trabalhar, e isso costuma ser um caminho de meses, não de dias.', tela: 'Homem também tem assoalho pélvico' },
        { tempo: '22–38 s', imagem: 'Sala de atendimento', fala: 'O que eu faço na consulta: conferir se a musculatura certa está sendo usada — muita gente faz força com a barriga e acha que está treinando —, organizar os hábitos de banheiro e acompanhar a evolução com medida, não com impressão. Eu não vou te prometer resultado: eu vou te acompanhar e te mostrar o que mudou.', tela: 'Conferir · orientar · medir' },
        { tempo: '38–45 s', imagem: 'Plano médio', fala: 'Se está acontecendo na sua casa, isso pede avaliação.', tela: 'Isso pede avaliação' }
      ],
      legenda: 'Fez cirurgia de próstata e está perdendo urina? Ou é seu pai ou seu marido que está passando por isso e não toca no assunto?\n\nHomem também tem assoalho pélvico, e é essa musculatura que ajuda a segurar o xixi. Depois da cirurgia ela precisa reaprender a trabalhar, e isso costuma levar meses.\n\nNa consulta eu confiro se a musculatura certa está sendo usada, organizo hábitos de banheiro e acompanho a evolução com medida. Sem promessa de resultado.',
      hashtags: '#fisioterapiapelvica #saudedohomem #prostata',
      trafego: {
        prioridade: 'Campanha própria, depois das 4 semanas', objetivo: 'Mensagens (WhatsApp)',
        publico: 'Homens de 55 a 75 anos e mulheres de 45 a 70 (quem costuma marcar a consulta do marido ou do pai), Conceição do Mato Dentro + 25 km',
        aberturaAnuncio: 'Depois da cirurgia de próstata, a musculatura do assoalho pélvico precisa reaprender a trabalhar.',
        anuncio: { titulo: 'Fisioterapia após cirurgia de próstata', texto: 'Treino orientado do assoalho pélvico masculino, com acompanhamento e medida da evolução. Hora marcada na Clínica Veracis, Conceição do Mato Dentro.' }
      },
      lastro: [
        ['"caminho de meses" e a ausência de promessa', 'Revisão Cochrane 2023 (Johnson EE e cols., CD014799): o valor das intervenções conservadoras após cirurgia de próstata ainda é incerto. https://www.cochrane.org/evidence/CD014799_conservative-interventions-managing-urinary-incontinence-after-prostate-surgery (acesso em 2026-09-20)']
      ]
    },
    {
      id: 'E', serie: 'regravacao', titulo: 'Perna inchada: quando é caso de correr', duracao: '45 s',
      objetivo: 'Substitui os dois vídeos antigos de inchaço. Vira utilidade pública, não oferta de drenagem.',
      cenas: [
        { tempo: '0–6 s', imagem: 'Plano médio', fala: 'Perna inchada no fim do dia todo mundo já teve. Mas tem um tipo de inchaço que não é pra esperar passar.', tela: 'Nem todo inchaço é igual' },
        { tempo: '6–22 s', imagem: 'Mesmo plano, sério', fala: 'Se o inchaço aparece de repente, só numa perna, com dor, calor ou a pele vermelha: isso é pra procurar um médico no mesmo dia. Não é caso de massagem, não é caso de esperar pra ver.', tela: 'De repente, numa perna só, com dor ou calor → médico no mesmo dia' },
        { tempo: '22–38 s', imagem: 'Sala de atendimento', fala: 'Descartado o que é urgência, aí sim a gente conversa sobre o seu dia a dia: quanto tempo você passa em pé ou sentada, como você dorme, o que ajuda a aliviar. Eu avalio, oriento e acompanho junto com quem fez o diagnóstico.', tela: 'Depois disso, a gente avalia junto' },
        { tempo: '38–45 s', imagem: 'Plano médio', fala: 'Na dúvida sobre qual é o seu caso, isso pede avaliação.', tela: 'Isso pede avaliação' }
      ],
      legenda: 'Perna inchada no fim do dia quase todo mundo já teve. Mas existe um tipo de inchaço que não é para esperar passar.\n\nInchaço que aparece de repente, em uma perna só, com dor, calor ou pele vermelha: procure um médico no mesmo dia. Não é caso de massagem.\n\nDescartada a urgência, a gente conversa sobre a sua rotina, eu avalio, oriento e acompanho junto com quem fez o diagnóstico.',
      hashtags: '#fisioterapia #inchaco #saude',
      trafego: {
        prioridade: 'Não impulsionar', objetivo: '—',
        publico: 'Conteúdo de utilidade pública, fora do foco pélvico',
        aberturaAnuncio: '—',
        anuncio: null
      },
      lastro: [
        ['sinais de alerta', 'O roteiro não afirma diagnóstico: só encaminha ao médico. Nenhuma alegação de eficácia de drenagem — era o problema dos vídeos originais.']
      ]
    }
  ];

  /* Não regravar */
  R.DESCARTADOS = [
    { titulo: 'Canetas emagrecedoras e flacidez', motivo: 'O original afirma que um recurso devolve firmeza e estimula colágeno, sem fonte que sustente, e o tema é estético e fora do eixo pélvico. Só volta com referência citada.' }
  ];

  /* Link do WhatsApp com mensagem pronta e o código do vídeo: ajuda a
     saber qual anúncio trouxe o contato, sem a mensagem citar a queixa. */
  R.linkWhatsApp = function (codigo) {
    var msg = 'Olá! Vi um vídeo da Vanessa no Instagram (código ' + codigo + ') e gostaria de agendar uma avaliação.';
    return 'https://wa.me/' + R.WHATSAPP + '?text=' + encodeURIComponent(msg);
  };

  raiz.Roteiros = R;
  if (typeof module !== 'undefined') module.exports = R;

})(typeof window !== 'undefined' ? window : globalThis);
