# Plano de Implantação — "Caça-Palavras"

Jogo de caça-palavras para celular Android, feito sob medida para uma idosa
que foi professora de Português por cerca de 30 anos.

O projeto persegue seis coisas ao mesmo tempo, e nenhuma delas pode ser
sacrificada pelas outras:

```
INTERFACE SIMPLES PARA UMA IDOSA
+ DESAFIO COGNITIVO REAL
+ JOGABILIDADE POR MUITO TEMPO
+ 100% OFFLINE
+ ARQUITETURA SIMPLES E CONFIÁVEL
+ TESTES AUTOMATIZADOS
+ PARTIDAS DE QUALIDADE
```

A tensão central do projeto é a segunda linha. É fácil fazer um jogo simples
para idoso; é fácil fazer um caça-palavras difícil. **Este documento existe
para não trocar um pelo outro.** Sempre que uma decisão facilitar a vida dela
motoramente ou visualmente, ela é bem-vinda. Sempre que uma decisão facilitar
o *achar a palavra*, ela precisa de justificativa explícita.

> **Para quem for implementar:** este plano foi escrito para ser seguido sem
> tomar decisões de arquitetura por conta própria. Onde houver um número, ele
> foi calculado, não chutado. Onde houver uma proibição, ela veio de um defeito
> real medido no projeto de referência. Se algo aqui parecer arbitrário,
> procure a justificativa antes de trocar — ela costuma estar no parágrafo
> seguinte.

---

## 1. Projeto de referência: "Paciência Spider"

Existe neste mesmo computador, em `C:\Users\elder\Documents\App_Paciencia`, um
projeto irmão já concluído e publicado: um Paciência Spider para a mesma
jogadora. Ele tem 3.807 linhas, 203 verificações automáticas, 72 KB de pacote
publicável, e um `PLANO.md` de 43 KB documentando dez fases, os defeitos
encontrados e as correções.

**Ele é referência de engenharia e de aprendizado, não projeto para clonar.**
Este projeto é independente e **nada em `App_Paciencia` deve ser alterado.**

### 1.1 O que foi aproveitado dele

1. **`core/` sem DOM.** As regras rodam no Node, então é possível validar
   milhares de partidas por linha de comando com *exatamente o mesmo código*
   que roda no celular dela.
2. **"Toda ação faz alguma coisa."** A descoberta mais valiosa do Spider: mão
   trêmula escorrega 10 a 20 px ao levantar o dedo, e "gesto cancelado" é
   lido por ela como "o aparelho não funcionou".
3. **"Escurece o papel, nunca a tinta."** A cor de fundo carrega informação; o
   texto nunca perde contraste.
4. **Mostrar em vez de escrever.** Mensagem escrita é a última opção.
5. **Dimensionar por conta, não por `@media`.** A altura útil de verdade
   depende do entalhe e da barra de gestos, que só existem em tempo de
   execução. No Spider isso nasceu de um bug real: o monte cobria um botão.
6. **Margem obrigatória de 16 px nas bordas laterais e inferior.** Sem isso, o
   toque dela perto da borda vira "voltar" do Android e o jogo some da tela.
7. **Service Worker com cinco cuidados**, cada um corrigindo um defeito
   medido: navegação pela rede primeiro com prazo de 3 s, nome de cache
   derivado do conteúdo, lista de pré-carga gerada do `dist/`, `ignoreVary` na
   busca do cache, e `cache: 'no-cache'` no `index.html`.
8. **Toda pergunta com duas saídas escritas por extenso**, lado seguro
   primeiro e destacado em verde. Nunca "OK/Cancelar", nunca um "X" no canto.
9. **Teste que varre uma faixa de tamanhos de tela**, não um tamanho só.
10. **CI que não publica se um teste quebrar.**

### 1.2 O que foi deliberadamente recusado

| Decisão do Spider | Por que não aqui |
|---|---|
| **Paisagem travada** | Nasceu de 10 colunas de cartas. A grade é quadrada e a lista é vertical. Retrato é a posição natural da mão e **elimina inteira a tela "gire o celular"** — um modo de falha a menos. |
| **Arrasto inválido move para o melhor destino assim mesmo** | Aqui isso significaria *revelar a palavra*. O princípio "sempre acontece algo" precisa virar **retorno visual**, nunca solução automática. Copiar literalmente destruiria o jogo. |
| **Botão VOLTAR (desfazer)** | Não existe jogada destrutiva num caça-palavras. Um botão a menos na tela dela. |
| **Solucionador em feixe + `seeds.json` pré-verificado** | Spider gastava 27 s por partida para *provar* que era vencível. Caça-palavras é vencível por construção: as palavras entram antes do enchimento. Ver §7.1. |
| **Tamanho da grade como alavanca de dificuldade** | Degrada exatamente as duas coisas que o projeto protege: legibilidade e precisão de toque. Ver §2.2. |
| **Pininhos de progresso** | A lista de palavras riscadas já é o indicador. Elemento redundante. |

---

## 2. Decisões fechadas

| Item | Decisão |
|---|---|
| Tecnologia | Web app (HTML/CSS/JS, ES Modules, sem framework) empacotado como **PWA** |
| Empacotador | **Vite**, só em desenvolvimento. A saída são arquivos estáticos |
| Entrega | **GitHub Pages** + GitHub Actions, com portão de teste |
| Repositório | `https://github.com/eldergithub/caca_palavras` |
| Funcionamento | **100% offline** após instalar; nenhum dado sai do aparelho |
| Orientação | **Retrato travado** (celular em pé) |
| Grade | Quadrada, **célula nunca menor que 30 px**; `n` derivado da tela (§2.2) |
| Palavras por partida | 8 a 10. **Teto rígido de 10** (§5.3) |
| Direções | As 8, liberadas progressivamente pela escada de dificuldade (§6) |
| Acentos | **Grade sem acento, lista com acento** (§4.2) |
| Seleção | Arrastar **e** dois toques, no mesmo mecanismo, sem modo (§3.2) |
| Dificuldade | **Escada interna invisível de 12 níveis, que sobe e desce** (§6.3) |
| Dicas | Um botão, **3 degraus por palavra**, ilimitadas, nunca oferecidas (§8) |
| Geração | **No aparelho**, por semente, com validação independente (§7) |
| Persistência | `localStorage`: semente + palavras encontradas. Sem servidor |
| Som | **Nenhum**. Vibração curta ao acertar, mais longa ao completar |
| Ajuda | Nenhuma tela de tutorial — abre direto numa partida |
| Placar | **Nenhum** na tela de jogo: sem cronômetro, sem pontos, sem contagem |
| Nome / ícone | "Caça-Palavras" — grade de letras com uma palavra destacada |
| Perfil da jogadora | Visão reduzida + mão trêmula + pouca familiaridade com toque + **excelente domínio da língua portuguesa** |

### 2.1 O perfil dela, e o que ele NÃO autoriza

Ela tem visão reduzida, mão trêmula e pouca familiaridade com toque. Isso
autoriza: letra grande, alvo de toque generoso, tolerância geométrica,
ausência de gestos avançados, ausência de menus.

Ela foi **professora de Português por 30 anos**. Isso **proíbe**: vocabulário
infantilizado, palavras óbvias demais, grade preenchida com letras aleatórias
que ela desmonta em dois minutos, e tratar como erro uma palavra real que ela
encontrou por conta própria no enchimento.

> **A interface é para uma idosa. O jogo é para uma linguista.**
> Quem implementar deve saber distinguir os dois e nunca simplificar o segundo
> para ajudar o primeiro.

### 2.2 Tamanho da grade é decisão de hardware, não de dificuldade

Esta é a discordância mais importante com a intuição comum, e a conta explica:

```
Celular 6,5" em retrato ≈ 412 px CSS de largura
largura_útil = 412 − 32 (margens seguras)        = 380 px
célula = (largura_útil − (n−1)·vão) / n

n = 10, vão 4 px  →  34,4 px  →  letra ~24 px   ✔
n = 11, vão 3 px  →  31,8 px  →  letra ~22 px   ✔ aceitável
n = 12, vão 3 px  →  28,9 px  →  letra ~20 px   ✖ abaixo do piso
n = 14, vão 3 px  →  24,1 px  →  letra ~17 px   ✖✖
```

Grade maior é a alavanca de dificuldade mais barata de programar e a mais cara
para ela: ataca legibilidade e precisão de toque ao mesmo tempo. Portanto:

```js
// src/ui/layout.js
export const CELULA_MINIMA = 30;   // px CSS. Piso inegociável.
export const VAO = 4;              // px entre células

export function colunasPossiveis(larguraUtil) {
  const n = Math.floor((larguraUtil + VAO) / (CELULA_MINIMA + VAO));
  return Math.max(8, Math.min(14, n));   // 8 é o mínimo jogável; 14 o teto
}
```

Num celular de 412 px isso dá **n_max = 11**. A escada de dificuldade recebe
`n_max` como *orçamento disponível* e escolhe `n ≤ n_max`; nunca o contrário.

**Consequência arquitetural:** como `n` depende da tela, um arquivo de
tabuleiros pré-gerados teria de fixar `n` — ficaria apertado num aparelho e
desperdiçaria espaço em outro. Este é um dos dois argumentos que levam à
geração no aparelho (§7.1).

---

## 3. Mecânica e interação

### 3.1 O coração do projeto: projeção sobre 8 direções

**Esta é a decisão técnica mais importante do projeto inteiro.**

A implementação ingênua marca as células por onde o dedo passou. Com tremor, o
dedo serpenteia e a seleção sai torta, com buracos e desvios. **Nunca faça
isso.** A seleção num caça-palavras é sempre um segmento reto em uma das 8
direções — então ela deve ser *calculada* como um segmento, não *coletada*
célula a célula.

```
âncora       = célula sob o pointerdown (sempre existe — §3.3)
vetor        = ponteiro_atual − centro_da_âncora
direção      = a mais próxima entre as 8, por menor ângulo
comprimento  = round( projeção_escalar(vetor, direção) / passo_da_célula )
comprimento  = clamp(comprimento, 0, distância_até_a_borda_naquela_direção)
seleção      = âncora + direção × 0..comprimento
```

Onde `passo_da_célula` é `célula + VAO` na horizontal e na vertical, e
`(célula + VAO) · √2` nas diagonais.

**Consequência:** o dedo pode tremer 20 px para fora da linha e a seleção
continua perfeitamente reta e correta. A tolerância deixa de ser um ajuste
fino e vira uma **propriedade geométrica do modelo**. É estritamente superior
a qualquer tratamento a posteriori, e é o equivalente — melhor — das cinco
regras de desfecho de arrasto do Spider.

As 8 direções, em `(dl, dc)`:

```js
export const DIRECOES = [
  { id: 'L',  dl:  0, dc:  1 },   // →   esquerda para direita
  { id: 'O',  dl:  0, dc: -1 },   // ←   direita para esquerda
  { id: 'S',  dl:  1, dc:  0 },   // ↓   cima para baixo
  { id: 'N',  dl: -1, dc:  0 },   // ↑   baixo para cima
  { id: 'SE', dl:  1, dc:  1 },   // ↘
  { id: 'NO', dl: -1, dc: -1 },   // ↖
  { id: 'SO', dl:  1, dc: -1 },   // ↙
  { id: 'NE', dl: -1, dc:  1 },   // ↗
];
```

### 3.2 Arrastar e dois toques: um só mecanismo, não dois modos

**Não haverá ajuste "modo de seleção".** A mesma máquina de estados atende os
dois gestos, e ela nunca precisa saber em qual está. Se o arrasto falhar por
tremor, o gesto degrada sozinho em "toquei numa ponta, toquei na outra" — que
é o equivalente do "tocar para mover" que no Spider é o caminho principal.

```
OCIOSO
  └─ pointerdown numa célula ──────────────► ANCORADO
                                               acende a âncora

ANCORADO
  ├─ pointermove acumulando > 10 px ───────► ARRASTANDO
  ├─ pointerup com < 10 px percorridos ────► ESPERANDO_SEGUNDO_TOQUE
  └─ pointercancel ────────────────────────► OCIOSO

ARRASTANDO
  ├─ pointermove ──► recalcula o segmento e redesenha a cápsula
  ├─ pointerup ────► resolve(segmento) ────► OCIOSO
  └─ pointercancel ► resolve(segmento) ────► OCIOSO   (não descarta!)

ESPERANDO_SEGUNDO_TOQUE            (a âncora fica acesa)
  ├─ toque em outra célula ───► resolve(âncora→célula) ──► OCIOSO
  ├─ toque na própria âncora ─► apaga, sem resolver ─────► OCIOSO
  ├─ toque fora da grade ─────► apaga, sem resolver ─────► OCIOSO
  └─ 15 s sem nada ───────────► apaga, sem resolver ─────► OCIOSO
```

`LIMIAR_DE_ARRASTO = 10` px (o Spider usou 8; a célula aqui é menor que a
carta, mas o gesto é mais longo — 10 px foi o valor escolhido, e é uma
constante a afinar na Fase 10 observando ela jogar).

`pointercancel` **resolve em vez de descartar**. O Android dispara
`pointercancel` quando interpreta o movimento como gesto do sistema; descartar
ali seria exatamente o "toquei e não funcionou" que o projeto existe para
eliminar.

### 3.3 Tolerância ao toque — zero pixel morto

1. **A área sensível de cada célula inclui metade do vão de cada lado.** Não
   existe espaço entre células que não pertença a alguma delas.
2. **O `pointerdown` ancora na célula de centro mais próximo**, dentro de um
   raio de uma célula inteira. Um toque em qualquer ponto da grade *sempre*
   ancora em alguma coisa.
3. **O dedo sair da grade não cancela nada** — o comprimento é limitado à
   borda e a seleção continua viva.
4. **Tolerância de extremidade de ±1 célula.** Se o segmento exato não soletrar
   palavra pendente, testa-se encurtar e alongar em 1 célula em cada ponta;
   aceita-se **apenas se o resultado soletrar exatamente uma palavra pendente
   da lista**. Havendo mais de um candidato, vence o de menor desvio.

   > Isto perdoa o erro **motor** (parar o dedo na célula certa) sem perdoar o
   > erro **cognitivo** (encontrar a palavra). `TOLERANCIA_PONTA = 1`, constante
   > única e ajustável.

5. **O segmento e o seu inverso são sempre testados.** Começar a seleção pela
   última letra funciona igual.
6. **A cápsula é desenhada atrás das letras e o dedo nunca é compensado.**
   Diferente do Spider, onde a carta subia 30 px acima do dedo: aqui o alvo é
   fixo na grade, e mover o desenho quebraria a correspondência entre o que ela
   vê e onde está tocando.

### 3.4 Resolução de uma seleção — os quatro desfechos

```js
function resolver(segmento) {
  const texto = letrasDe(segmento);
  // 1. acertou (direto ou com ±1 de tolerância)
  const alvo = casarComPendente(texto, segmento);      // testa ida, volta, ±1
  if (alvo) return acertou(alvo);

  // 2. é palavra de verdade, mas não é uma das procuradas
  if (segmento.length >= 4 && BANCO_NORMALIZADO.has(texto)) return palavraReal();

  // 3. seleção de uma célula só: ela só tocou. Nada acontece, sem balanço.
  if (segmento.length <= 1) return nada();

  // 4. não é palavra nenhuma
  return errou();
}
```

| Desfecho | O que ela vê |
|---|---|
| **Acertou** | Cápsula assume a cor do ciclo (§9.4), palavra riscada e apagada na lista, vibração de 40 ms, pequena onda de escala na cápsula |
| **É palavra real, mas não é da lista** | **Lampejo âmbar** de 500 ms e a cápsula some. *Ela foi professora de Português por 30 anos: vai encontrar palavras reais no enchimento. Tratar isso como erro é desrespeitoso, e custa apenas um `Set` com o banco inteiro em memória.* |
| **Errou** | Cápsula fica cinza-neutra, balança 200 ms e some. **Sem vermelho, sem som, sem mensagem escrita.** A mensagem é "aqui não tem palavra", e é passada pelo movimento |
| **Só tocou (1 célula)** | A âncora acende e o jogo espera o segundo toque. Não é erro |

---

## 4. Português

### 4.1 Estrutura do registro de palavra

```json
{ "t": "CORAÇÃO", "n": "CORACAO", "nv": 1 }
```

| Campo | Significado |
|---|---|
| `t` | Ortografia correta. **É o que aparece na lista.** |
| `n` | Forma normalizada. **É o que vai para a grade.** |
| `nv` | Dificuldade lexical 1–3: familiaridade da palavra, não raridade gratuita |

### 4.2 Grade sem acento, lista com acento — decisão e justificativa

```
grade:  C O R A C A O
lista:  CORAÇÃO
```

Três razões, sendo a terceira a decisiva:

1. `Ã`, `Ç`, `Ô` quebram o ritmo da célula e comem altura em letras de 24 px.
2. É o padrão dos caça-palavras impressos brasileiros — é o que ela reconhece.
3. **Um `Ç` sozinho no meio da grade entrega a palavra.** Acento vira dica
   involuntária e mata o desafio. Esta razão sozinha decidiria a questão.

A lista sempre mostra a grafia correta, então nenhuma ortografia errada é
ensinada.

### 4.3 Normalização — a regra exata

```js
// src/core/texto.js
export function normalizar(palavra) {
  return palavra
    .normalize('NFD')                  // Ç → C + cedilha, Ã → A + til
    .replace(/\p{Diacritic}/gu, '')    // remove todos os sinais combinantes
    .toLocaleUpperCase('pt-BR');
}
```

A cedilha se decompõe em `C` + `U+0327` no NFD, então **cai na mesma regra e
não precisa de caso especial**. Só existe uma função de normalização no
projeto inteiro, e ela mora aqui.

**O campo `n` é gerado no build e gravado no arquivo, nunca calculado no
celular.** O aparelho não executa `normalize()` nem regex Unicode em tempo de
jogo — é trabalho que já foi feito na máquina de desenvolvimento, e é uma
classe inteira de diferença entre navegadores que simplesmente não existe.

Os arquivos são UTF-8 sem BOM, e um teste confere isso byte a byte.

### 4.4 Alfabeto — K, W e Y ficam de fora

São raríssimas em português. Uma delas no meio da grade é uma célula que ela
**elimina de graça**: sabe de imediato que não faz parte de palavra nenhuma.
Isso vale tanto para o enchimento quanto para as palavras do banco.

```js
export const ALFABETO = 'ABCDEFGHIJLMNOPQRSTUVXZ'.split('');  // 23 letras
```

### 4.5 Regras de exclusão do banco

Verificadas em tempo de build por `tools/valida-banco.mjs`, que **falha o
build** se qualquer uma for violada:

| Regra | Motivo |
|---|---|
| Sem hífen e sem espaço | `GUARDA-CHUVA` não cabe numa linha reta de letras |
| De 4 a 11 letras | Abaixo de 4 aparece por acaso no enchimento; acima de 11 não cabe em `n = 10` |
| Sem K, W, Y | §4.4 |
| `t` normaliza exatamente para `n` | Impede erro de digitação no banco |
| **Sem colisão de `n` entre duas palavras** | `SEDE`/`SEDE`, `PÊLO`/`PELO` gerariam ambiguidade insolúvel dentro de uma partida |
| Sem duplicata dentro da categoria nem entre categorias | Mantém o sorteio sem repetição honesto |
| Sem termo ofensivo | Lista de bloqueio própria, pequena e explícita |
| **Sem plural cujo singular já esteja no banco** | `CASA`/`CASAS` seriam a mesma palavra para ela |
| **Sem flexão verbal conjugada** | Sufixos `-AMOS -ARAM -ASSEM -ARIAM -AVAM -ERAM -IRAM -ASSE -ESSE -ISSE` e afins, checados por lista de terminações |
| **Sem diminutivo nem aumentativo de palavra já presente** | Sufixos `-INHO -INHA -ZINHO -ZINHA -AO -ARRAO` quando o radical já existe |

As três últimas são heurísticas por terminação: erram para o lado seguro e
podem reprovar uma palavra legítima (`CARINHO`, `IRMAO`). Quando isso
acontecer, a palavra entra numa lista curta de exceções declarada no próprio
`valida-banco.mjs`, **nunca desligando a regra**.

### 4.6 Categorias

Quinze arquivos em `public/palavras/`, entre 40 e 60 palavras cada,
**600 a 800 no total no MVP**:

```
cotidiano   familia     natureza    animais     alimentos
objetos     lugares     profissoes  cultura     literatura
portugues   sentimentos plantas     musica      corpo
```

`portugues` e `literatura` são as categorias de mais alto nível lexical —
existem especificamente para o repertório dela. `literatura` inclui autores,
obras e gêneros; `portugues` inclui figuras de linguagem e termos gramaticais.

**A curadoria é o maior trabalho manual do projeto e não pode sair de um
dicionário despejado da internet.** Um dump produz lixo: flexões, siglas,
estrangeirismos e palavras que ninguém usa. Cada palavra entra escolhida.

**Não há etapa de aprovação humana do banco.** A curadoria é responsabilidade
de quem implementa, e por isso o critério não pode ficar no julgamento de
ninguém: está escrito em §4.7, e a parte automatizável está em §4.5, dentro de
`valida-banco.mjs`, que falha o build. Na dúvida sobre uma palavra, o padrão é
**não incluir** — o banco é ampliável a qualquer momento sem tocar em código,
então deixar uma palavra de fora custa nada e incluir uma palavra ruim custa
uma partida ruim para ela.

### 4.7 Critérios de curadoria

O que **entra**:

- Substantivos, adjetivos e verbos no **infinitivo**, sempre no singular e na
  forma de dicionário.
- Palavras que uma pessoa culta de 70 e poucos anos usa ou reconhece sem
  hesitar. O teste mental é: *ela usaria esta palavra numa conversa, numa aula
  ou numa leitura?*
- Vocabulário de repertório: `SAUDADE`, `CREPÚSCULO`, `ACERVO`, `TRAÇO`,
  `ORVALHO`, `CRÔNICA`, `METÁFORA`, `ALFARRÁBIO`. Palavra bonita e conhecida
  vale mais que palavra rara.
- Em `literatura` e `cultura`, nomes próprios são bem-vindos: `MACHADO`,
  `DRUMMOND`, `CECÍLIA`, `SONETO`, `ROMANCE`.

O que **não entra**:

| Rejeitar | Exemplo |
|---|---|
| Flexão verbal conjugada | `CORREMOS`, `ANDARIAM` |
| Plural quando o singular já está no banco | `CASAS` se `CASA` existe |
| Diminutivo e aumentativo de palavra já presente | `CASINHA`, `CASARÃO` |
| Estrangeirismo não assimilado | `SHOPPING`, `DELIVERY` |
| Sigla e abreviação | `ONU`, `SRA` |
| Gíria, regionalismo restrito e neologismo recente | — |
| Palavra técnica sem uso corrente | `ANACOLUTO` fora de `portugues` |
| Palavra de conotação triste, clínica ou fúnebre | `VELÓRIO`, `TUMOR`, `SOLIDÃO` |
| Rara a ponto de virar adivinhação | `EFÊMERIDE` |
| Sinônimo redundante de outra já presente na mesma categoria | — |

A última linha da tabela de rejeição merece destaque: **o jogo é estímulo, não
prova de vocabulário.** Uma palavra que ela não reconhece não produz desafio —
produz a sensação de estar sendo testada e reprovada, que é exatamente o que o
projeto inteiro existe para evitar. O desafio vem de *encontrar* a palavra na
grade (§6.1), nunca de *saber* a palavra.

**Distribuição de nível lexical por categoria**, para o banco não ficar todo
no nível 1 nem todo no 3:

```
nv 1 (familiar)   ≈ 45% do banco   — cotidiano, familia, alimentos, corpo
nv 2 (culta)      ≈ 40% do banco   — natureza, objetos, cultura, sentimentos
nv 3 (repertório) ≈ 15% do banco   — literatura, portugues, e o topo das demais
```

`valida-banco.mjs` confere essa distribuição com tolerância de ±8 pontos
percentuais e **avisa** (sem falhar o build) quando sai da faixa — é um
desequilíbrio de conteúdo, não um defeito.

**Pares de vizinhas lexicais** (§6.1, alavanca 5) ficam num arquivo próprio,
`public/palavras/_vizinhas.json`, referenciando palavras que já existem nas
categorias:

```json
[["CASA","CAUSA"], ["TERCO","TRACO"], ["SENSO","CENSO"], ["MANTA","MATA"]]
```

O validador confere que **as duas palavras de cada par existem no banco** e
que a distância de edição entre as formas normalizadas é de 1 ou 2 — um par
que não se confunde não serve para nada.

---

## 5. Interface

### 5.1 Layout — retrato travado

```
┌──────────────────────────────┐
│ (sair)                  (eng)│  pequenos, apagados, cantos opostos
│                              │
│   ┌──────────────────────┐   │
│   │  A  P  L  M  O  R  T │   │
│   │  R  O  S  E  I  R  A │   │  grade ocupa a largura útil inteira
│   │  V  I  N  H  A  C  E │   │  célula ≥ 30 px, letra ~24 px, peso 700
│   │  ...                 │   │  sem linhas de grade
│   └──────────────────────┘   │
│                              │
│        TEMA: PLANTAS         │  rótulo pequeno, maiúsculo, apagado
│                              │
│   ORVALHO        SEMENTE     │  2 colunas, ~20 px
│   ~~RAIZ~~       NEBLINA     │  MAIÚSCULA COM ACENTO
│   MUSGO          ORQUÍDEA    │  encontrada = riscada e apagada
│   SAMAMBAIA      CIPRESTE    │  tocável: marca "é esta que eu procuro"
│                              │
│  ┌──────────┐  ┌───────────┐ │
│  │   DICA   │  │ JOGO NOVO │ │  ≥ 64 px de altura
│  └──────────┘  └───────────┘ │
└──────────────────────────────┘
        + env(safe-area-inset-bottom) + 16 px
```

> **Ordem revista na Fase 8:** o tema e a lista ficam **acima** e a grade
> **abaixo**, logo acima dos botões. Ela lê primeiro o que tem de procurar e
> só então encara o tabuleiro — e a grade passa a ficar na metade de baixo da
> tela, onde o polegar alcança sem mudar a pegada. O diagrama acima mostra a
> ordem original.
>
> Ao lado do tema aparecem as **setas das direções realmente usadas naquele
> tabuleiro** (→ ← ↓ ↑ ↘ ↗ ↙ ↖). É a mesma informação que o enunciado de um
> caça-palavras impresso traz: diz onde procurar sem entregar palavra nenhuma.

**Retrato elimina a tela "gire o celular".** O Spider precisou construir uma
ilustração animada de celular girando; aqui esse modo de falha simplesmente
não existe, porque retrato é como o aparelho é segurado por padrão. Ainda
assim, se o app for aberto pelo navegador em paisagem, o layout se reorganiza
sozinho (grade à esquerda, lista à direita) em vez de quebrar — sem aviso e
sem jargão.

### 5.2 Conta de espaço (celular de 412 × 915 px CSS)

```
altura útil = 915 − 24 (topo) − 24 (barra de gestos)      = 867 px
  cantos superiores (sair / engrenagem)                      40 px
  grade  (11 × 31,8 + 10 × 4)                               390 px
  rótulo de tema                                             32 px
  lista  (5 linhas × 44 px, 2 colunas, 10 palavras)          220 px
  botões                                                      72 px
  respiros                                                    64 px
                                                          --------
                                                            818 px   ✔ cabe
```

Folga de 49 px num aparelho típico. `layout.js` faz esta conta em tempo de
execução com a altura real, e a ordem em que as coisas cedem quando a tela é
baixa — mesma técnica do `calcularTrilho()` do Spider — é:

```
1. respiros         64 px  →  24 px   (cedem primeiro)
2. rótulo de tema   32 px  →   0 px   (some inteiro se precisar)
3. grade            reduz n em 1, mantendo a célula ≥ 30 px
4. lista            nunca encolhe abaixo de 18 px de fonte
5. botões           nunca abaixo de 64 px          (últimos: são o que ela toca)
```

### 5.3 A lista nunca rola — e isso manda na mecânica

**Se ela não vê uma palavra, para ela essa palavra não existe.** Rolagem é um
gesto que ela não domina e que esconde informação essencial.

Portanto a lista precisa caber inteira, sempre. Isso impõe o **teto rígido de
10 palavras por partida** — uma restrição de interface que manda na mecânica,
e não o contrário. Nenhum nível de dificuldade pode passar de 10.

### 5.4 Botões

- **DICA e JOGO NOVO embaixo**, onde o polegar alcança sem mudar a pegada.
  No mínimo 64 px de altura, ícone **e** rótulo em caixa alta — ícone sozinho
  exige decifrar, palavra sozinha exige ler; juntos são reconhecidos mais
  rápido (lição direta do Spider).
- **JOGO NOVO pede confirmação** se houver partida em andamento. Duas saídas
  por extenso: **"Sim, começar outro"** / **"Não, continuar esta"**, a segunda
  primeiro e em verde.
- **SAIR pequeno, apagado, no canto superior esquerdo**, longe dos dois botões
  de jogo. Confirma em duas saídas, avisa que a partida fica guardada, e tenta
  `window.close()`. Como o Android não garante isso, se em meio segundo a tela
  continuar ali aparece a ilustração do gesto de voltar à tela inicial, com
  uma frase curta.
- **Botão "voltar" do Android abre essa mesma confirmação**, nunca fecha direto.
- **Engrenagem minúscula e apagada** no canto superior direito, com exatamente
  dois itens e um botão enorme "Voltar ao jogo":
  - `letras maiores / menores` (ajusta o piso de célula em ±3 px)
  - `jogo mais fácil / mais difícil` (move a escada em ±1 nível)

  > A engrenagem existe **para o cuidador**, não para ela. É a rede de
  > segurança caso a escada automática julgue mal o desempenho dela. Sem isso,
  > um erro da escada a deixaria travada num nível frustrante sem recurso.
  > Ela também mostra o número de partidas concluídas — que **não aparece na
  > tela de jogo**.

### 5.5 Nada de placar

Sem cronômetro, sem pontos, sem contador de jogadas, sem porcentagem, sem
barra de progresso. A lista de palavras riscadas já é o progresso, e é o
suficiente. **Nenhum elemento da tela de jogo pode dar a ela a sensação de
estar sendo avaliada ou cronometrada.** O tempo é medido internamente para a
escada (§6.3) e nunca é exibido.

### 5.6 A palavra da lista é tocável

Tocar numa palavra da lista a marca como "é esta que eu estou procurando":
ela ganha um realce suave e **a DICA passa a se referir a ela**. Se a jogadora
nunca tocar em nada, a DICA escolhe sozinha. Não cria modo, não cria estado
perdido, e dá a ela a agência de pedir ajuda com uma palavra específica.

### 5.7 Ensinar sem tela de tutorial

No primeiro tabuleiro de uma instalação nova, um **dedo fantasma** percorre
lentamente, em laço, uma palavra curta já visível, demonstrando "toca aqui,
toca ali". **Para para sempre na primeira seleção bem-sucedida dela.** Nenhum
texto, nenhum botão "entendi", nenhuma tela, nenhum jargão.

Respeita `prefers-reduced-motion`: com a preferência ligada, o dedo fantasma
aparece em três posições estáticas encadeadas em vez de deslizar.

---

## 6. Dificuldade progressiva

### 6.1 As alavancas, ordenadas por ganho cognitivo ÷ custo de legibilidade

| # | Alavanca | Por que funciona |
|---|---|---|
| 1 | **Direções liberadas** | A alavanca mais barata e mais eficaz. Varre de "só → e ↓" até as 8 |
| 2 | **Enchimento adversário** | Letras escolhidas para formar **começos falsos** das palavras da lista. Contra uma professora de Português, enchimento aleatório é desmontado em dois minutos. De longe a alavanca mais potente |
| 3 | **Comprimento das palavras** | Contraintuitivo e importante: **palavra longa é mais fácil de ver**. Dificuldade sobe ⇒ mais palavras de 4 e 5 letras |
| 4 | **Cruzamentos** | Palavras compartilhando letras quebram o reconhecimento de padrão |
| 5 | **Vizinhança lexical** | Pares que se confundem no mesmo tabuleiro: CASA/CAUSA, TERÇO/TRAÇO, SENSO/CENSO. Desafio de *linguista*, não de vista |
| 6 | **Abstração do tema** | `cozinha`, `animais` → `sentimentos`, `literatura` → `portugues` |
| 7 | Quantidade de palavras | 8 → 10. Teto rígido de 10 (§5.3) |
| 8 | Tamanho da grade | Alavanca **residual**, limitada por `n_max` do aparelho (§2.2) |

### 6.2 Os 12 níveis

`n_max` é o que o aparelho permite (§2.2). Onde a tabela diz `n_max`, use o
valor do aparelho; onde diz um número, use `min(número, n_max)`.

| Nv | n | Palavras | Letras | Direções | Cruz. | Enchimento | Léxico | Faixa D |
|---|---|---|---|---|---|---|---|---|
| 1 | 9 | 8 | 5–8 | → ↓ | 0% | uniforme | 1 | 0–21 |
| 2 | 9 | 8 | 5–8 | → ↓ | 10% | uniforme | 1 | 8–29 |
| 3 | 9 | 8 | 4–8 | → ↓ ← ↑ | 15% | frequência | 1 | 11–33 |
| 4 | 10 | 9 | 4–8 | → ↓ ← ↑ | 20% | frequência | 1–2 | 18–37 |
| 5 | 10 | 9 | 4–8 | + ↘ ↗ | 25% | frequência | 1–2 | 29–49 |
| 6 | 10 | 9 | 4–8 | + ↘ ↗ | 30% | frequência | 2 | 32–52 |
| 7 | 10 | 10 | 4–7 | + ↘ ↗ | 35% | adversário leve | 2 | 42–63 |
| 8 | 10 | 10 | 4–7 | todas as 8 | 40% | adversário leve | 2 | 44–67 |
| 9 | 11 | 10 | 4–7 | todas as 8 | 45% | adversário | 2–3 | 64–80 |
| 10 | 11 | 10 | 4–6 | todas as 8 | 50% | adversário | 3 | 65–83 |
| 11 | 11 | 10 | 4–6 | todas as 8 | 55% | adversário | 3 | 66–85 |
| 12 | 11 | 10 | 4–6 | todas as 8 | 60% | adversário | 3 | 67–86 |

A partir do nível 5, um par de **vizinhas lexicais** é injetado quando existir
no banco; a partir do 9, dois pares.

> **As faixas de `D` acima foram recalibradas contra o gerador real** (medição
> de 800 sementes por nível, faixa = percentil 0,5 a 99,5). As faixas do
> planejamento original eram inalcançáveis por construção: `D = 100` exigiria
> `n = 14`, que o piso de célula de 30 px proíbe num celular de 412 px (§2.2).
> O teto observado é `D ≈ 86`. A ordem e a distância entre os níveis foram
> preservadas; o que mudou foi a escala.
>
> **Os níveis 10, 11 e 12 são muito parecidos entre si** — pela própria tabela
> acima, só a meta de cruzamentos os distingue (50%, 55%, 60%). As medianas
> medidas ficam em 73, 76 e 75. Se o topo da escada precisar de mais separação
> depois da Fase 10, a alavanca com folga é o comprimento das palavras
> (`4–6` → `4–5` no nível 12).

### 6.3 A escada sobe **e desce**

> **Progressão automática sem caminho de volta é uma armadilha.** Se a escada
> errar para cima, ela trava e não tem como reclamar. Por isso a escada desce,
> e por isso existe o ajuste na engrenagem (§5.4).

Ao terminar cada partida:

```js
// src/core/escada.js
function classificar(partida, medianaDoNivel) {
  if (partida.abandonada)                          return 'desce';
  if (partida.dicas >= 3)                          return 'desce';
  if (partida.segundos > 2.5 * medianaDoNivel)     return 'desce';
  if (partida.dicas === 0 &&
      partida.segundos <= medianaDoNivel)          return 'sobe';
  return 'mantem';
}
```

O nível só se move após **duas classificações seguidas na mesma direção**,
para não oscilar. A mediana é aprendida das últimas 10 partidas dela naquele
nível; até haver 3 amostras, usa-se a mediana estimada da tabela.

Partida é "abandonada" quando ela toca JOGO NOVO com menos de metade das
palavras encontradas.

Estado guardado em `localStorage` sob `cp_escada_v1`:

```json
{ "nivel": 5, "seguidas": { "direcao": "sobe", "quantas": 1 },
  "tempos": { "5": [212, 188, 240] }, "ajusteManual": 0 }
```

### 6.4 A pontuação de dificuldade `D`

Calculada **a partir do tabuleiro pronto**, nunca dos parâmetros pedidos —
é isso que permite ao validador rejeitar um tabuleiro que saiu fora do alvo.

```
D = 12·f_dir + 20·f_ench + 18·f_curtas + 16·f_cruz
  + 12·f_vizinhas + 10·f_tema + 7·f_qtd + 5·f_grade          (cada f em 0..1)
```

| Fator | Definição |
|---|---|
| `f_dir` | (direções distintas usadas − 1) / 7, ponderado: diagonal vale 1,0, invertida 0,7, reta 0,3 |
| `f_ench` | fração de células de enchimento que participam de um **começo falso** de ≥ 2 letras de alguma palavra da lista |
| `f_curtas` | fração de palavras com ≤ 5 letras |
| `f_cruz` | fração de palavras que compartilham ao menos uma célula com outra |
| `f_vizinhas` | pares de vizinhas lexicais presentes / 2, limitado a 1 |
| `f_tema` | nível de abstração da categoria, tabelado 0..1 por categoria |
| `f_qtd` | (palavras − 8) / 2 |
| `f_grade` | (n − 9) / 5, limitado a 0..1 |

O tabuleiro só é aprovado se `D` cair dentro da faixa do nível (§6.2). Assim
"a dificuldade calculada é compatível com a pretendida" deixa de ser promessa
e vira teste automatizado (§10).

---

## 7. Geração e validação de partidas

### 7.1 Geração **no aparelho** — e por que não um arquivo pré-gerado

O Spider precisou de um solucionador de busca em feixe e de um `seeds.json`
pré-verificado porque **provar que um Paciência é vencível custava 27 segundos
por partida**. Aqui, dois fatos mudam tudo:

1. **Caça-palavras é vencível por construção.** As palavras entram na grade
   *antes* das letras de enchimento. Não existe o problema que o solucionador
   do Spider resolvia. Importar aquele aparato seria construir maquinário caro
   para um problema inexistente — o erro mais caro possível neste projeto.
2. **`n` depende da largura real da tela** (§2.2). Um arquivo pré-gerado teria
   de fixar `n`, ficando apertado num aparelho e desperdiçando espaço em
   outro. Geração no aparelho **adapta a grade ao hardware**, o que um arquivo
   não consegue fazer por definição.

Gerar custa 2 a 10 ms; validar custa menos. O trabalho pesado continua na
máquina de desenvolvimento — só que na forma de **20.000 sementes rodadas no
CI** (§10), em vez de um arquivo de saída. O celular executa apenas código que
já provou funcionar em centenas de milhares de tabuleiros.

### 7.2 O fluxo completo

```
semente = hash32(nível, índice_da_partida, id_do_tema)
   │
   ├─► gerador(semente, n, parâmetros_do_nível)
   │      1. sorteia o tema e as palavras (sem repetir no ciclo)
   │      2. coloca as palavras, mais longas primeiro, com retrocesso
   │      3. enche o resto conforme a estratégia do nível
   │
   ├─► validador(grade, lista)          ← INDEPENDENTE do gerador
   │      reprovou → semente + 1, até 20 tentativas
   │
   ├─► dificuldade(tabuleiro)
   │      fora da faixa → semente + 1, mesma contagem de tentativas
   │
   └─► 20 falhas → sorteia de public/tabuleiros-reserva.json
                   (jamais uma tela de erro para ela)
```

### 7.3 Colocação

```
ordena as palavras da mais longa para a mais curta
para cada palavra:
    monta todas as posições possíveis (linha, coluna, direção permitida)
    pontua cada posição:
        + 3 por cada letra que coincide com uma já colocada  (cruzamento)
        − 2 se ficar adjacente e paralela a uma palavra já colocada
        + 1 se a direção ainda foi pouco usada neste tabuleiro
    embaralha as posições de mesma pontuação com o PRNG da semente
    escolhe conforme a meta de cruzamentos do nível:
        se cruzamentos_atuais < meta → prefere pontuação alta
        senão                        → prefere pontuação média
    se nenhuma posição couber → retrocede a palavra anterior
    após 200 retrocessos → falha, e o fluxo tenta a semente seguinte
```

A penalidade de palavras adjacentes e paralelas existe porque duas palavras
coladas lado a lado formam um bloco visual que **entrega as duas de uma vez**.

### 7.4 Enchimento

| Estratégia | Como |
|---|---|
| `uniforme` | Sorteia do `ALFABETO` com peso igual |
| `frequencia` | Sorteia pela frequência de letras do português escrito. Faz o enchimento "parecer português", o que é mais difícil de descartar de relance |
| `adversario` | Para cada célula vazia, monta o conjunto de letras que **prolongariam um começo falso** de alguma palavra da lista (a palavra começa ali, mas quebra em seguida) e sorteia entre elas quando possível; cai em `frequencia` quando não houver candidata. `adversario leve` aplica isso em 40% das células, `adversario` em 75% |

O enchimento **nunca pode completar acidentalmente uma palavra da lista numa
posição não prevista** — mas isso não é tratado proibindo, e sim aceitando:
ver §7.5, item 2.

### 7.5 O validador — independente, não cúmplice

> **O validador é escrito sem usar nenhuma estrutura do gerador.** Recebe só a
> grade de letras e a lista de palavras, e sai procurando do zero. Se ele
> usasse as posições anotadas pelo gerador, estaria validando o bug junto com
> o resultado.

Ele confere:

1. **Toda palavra anunciada está de fato na grade**, varrendo as 8 direções a
   partir de cada célula.
2. **Todas as ocorrências de cada palavra são registradas.** Se uma palavra
   aparecer duas vezes por acaso do enchimento, **o jogo aceita qualquer uma
   delas** — é mais robusto do que rejeitar o tabuleiro, e evita o caso cruel
   em que ela encontra a palavra num lugar legítimo e o jogo não reconhece.
3. Nenhuma direção fora das permitidas pelo nível.
4. Nenhuma célula vazia.
5. Nenhum K, W ou Y em lugar nenhum.
6. Nenhuma palavra fora do banco na lista anunciada.
7. `D` dentro da faixa do nível.

### 7.6 O que é salvo

```json
{
  "v": 1, "semente": 481923, "n": 11, "nivel": 5, "tema": "plantas",
  "encontradas": ["RAIZ", "MUSGO"], "dicas": 1, "iniciadaEm": 1758300000000
}
```

Algumas dezenas de bytes. **O tabuleiro é reconstruído idêntico a partir da
semente** — é a filosofia do Spider aplicada onde ela realmente cabe. `n` é
salvo junto porque a grade depende dele.

Carregamento resiliente: qualquer falha de `JSON.parse`, versão `v` diferente,
ou tabuleiro que não revalida → **descarta em silêncio e começa partida
nova**. Ela nunca vê erro.

---

## 8. Dicas

Um botão só, que escala **por palavra**. Se ela marcou uma palavra na lista
(§5.6), a dica se refere a essa; senão, o jogo escolhe a palavra pendente de
maior **achabilidade** calculada — a que provavelmente destrava mais rápido.

| Toque | O que acontece |
|---|---|
| **1º** | A **primeira letra** da palavra pulsa em dourado. Sem direção |
| **2º** | A **direção** aparece: a cápsula se estende 2 células a partir da primeira letra |
| **3º** | A **palavra inteira** é revelada e contada como encontrada |

Depois de pulsar por 3 segundos, a dica deixa **uma marca discreta e
permanente** na primeira letra, até aquela palavra ser encontrada. Ela pode
desviar o olhar e voltar sem perder a ajuda — e sem que o tabuleiro fique
marcado para sempre com palavras já achadas.

**Sem orçamento de dicas.** Limitar dicas é escassez artificial, prima de
"vidas" e "energia", que estão fora do projeto. A fricção de ter que tocar
três vezes já é suficiente para que a dica não seja o caminho preguiçoso.

**O jogo nunca oferece ajuda por conta própria**, em nenhuma circunstância,
por mais tempo que ela fique parada. Interromper alguém que está pensando é
exatamente o oposto de estimular.

O número de dicas usadas alimenta a escada (§6.3) e **nunca é exibido**.

Achabilidade de uma palavra pendente, do mais fácil para o mais difícil:
comprimento maior, direção reta, poucos começos falsos na vizinhança, e
primeira letra em região pouco densa.

---

## 9. Linguagem visual

### 9.1 Tema claro, sempre

`#16181c` sobre `#fdfcf7` dá contraste de cerca de **18:1**. Não haverá modo
escuro: texto claro sobre fundo escuro piora a leitura para visão reduzida, e
esta tela é feita quase só de texto.

### 9.2 Paleta

| Elemento | Valor |
|---|---|
| Fundo da tela | `#efe9dd` |
| Tabuleiro | `#fdfcf7`, canto 12 px, sombra suave |
| Letra | `#16181c`, peso 700 |
| **Sem linhas de grade** | Linha é ruído visual para vista cansada. Vão uniforme e letra de alto contraste bastam; as cápsulas dão a estrutura |
| Cápsula em seleção | `#ffd23f` (dourado, o mesmo realce do Spider) |
| Rótulo de tema | `#7a736a` |
| Palavra encontrada na lista | `#9a948a`, riscada |
| Botões grandes | `#14181a`, texto `#fdfcf7`, borda `rgba(255,255,255,.18)` |
| SAIR / engrenagem | `#8e877c`, pequenos, sem preenchimento |

### 9.3 A regra herdada: escurece o papel, nunca a tinta

Todas as cores de cápsula são **claras e saturadas**, de modo que a letra
continue em `#16181c` por cima com contraste mínimo de **7:1**. Nada fica mais
difícil de ler; o que muda é só o fundo, que passa a carregar informação.

### 9.4 Ciclo de cores das palavras encontradas

```
#a8e6a3  verde     #a9d4f5  azul      #ffd9a0  âmbar
#d8c0f0  violeta   #f5b9a8  terracota
```

Usadas em ciclo, na ordem em que as palavras são encontradas. Em cruzamentos,
as cápsulas se sobrepõem e a célula compartilhada fica com a cor da mais
recente — continua legível porque a tinta não muda.

### 9.5 Tipografia

**Fonte auto-hospedada, subconjunto A–Z apenas, ~8 KB em woff2.**

Num caça-palavras a letra aparece **isolada**, sem contexto de palavra para
desambiguar. A fonte do sistema varia por aparelho e não pode ser escolhida —
num jogo cuja matéria-prima é a forma da letra, isso é risco inaceitável.
Requisitos: humanista, peso 700 disponível, aberturas abertas, `M` e `N` bem
distintos, `Q` com cauda inconfundível.

Entra no pré-cache do Service Worker. Pilha de reserva declarada no CSS para
o caso de a fonte falhar, com `font-display: swap`.

### 9.6 Movimento e retorno tátil

- **Sem som**, em nenhuma situação.
- **Vibração** de 40 ms ao encontrar palavra; 200 ms ao completar o tabuleiro.
- Todas as animações respeitam `prefers-reduced-motion`: com a preferência
  ligada, os estados finais aparecem direto, sem percurso.
- Animações são curtas: nada acima de 500 ms, exceto a comemoração.

### 9.7 Comemoração

Ao completar todas as palavras: as cápsulas acendem em onda da primeira à
última encontrada, confete em CSS, e um botão gigante **"Jogar outra"**.
A decoração encolhe em telas baixas — no Spider, a caixa de vitória passava
64 px da tela num aparelho de 340 px de altura útil e o botão encostava na
borda. **O botão nunca encolhe abaixo dos 64 px e nunca sai da tela**, porque
se ela não vê o botão inteiro, acha que travou.

---

## 10. Testes automatizados

Mesmo estilo do Spider: **Node puro, runner próprio (`ok()` / `igual()`), zero
dependência de teste**, `npm test`, e portão no CI que impede publicar com
teste quebrado.

| Grupo | O que é provado |
|---|---|
| **Texto pt-BR** | O banco inteiro faz ida e volta: `t` → `n` correto; nenhum diacrítico sobra; nenhum K/W/Y; nenhuma colisão de `n`; arquivos são UTF-8 válido sem BOM; todas as regras de §4.5 |
| **Banco** | As duas palavras de cada par de `_vizinhas.json` existem no banco e têm distância de edição 1 ou 2; a distribuição de nível lexical de §4.7 está dentro de ±8 pontos (aviso, não falha); toda exceção declarada no validador corresponde a uma palavra que existe |
| **Gerador × validador** | **20.000 sementes × 12 níveis**: 100% válidos, todas as palavras presentes, direções dentro do nível, grade cheia, nenhuma palavra fora do banco |
| **Determinismo** | A mesma semente produz a mesma grade byte a byte, no Node e no navegador |
| **Dificuldade** | `D` dentro da faixa do nível em ≥ 99% das sementes; **monotonia**: a média do nível 8 é significativamente maior que a do nível 4 |
| **Geometria da seleção** | Caminho de ponteiro com desvio de 18 px produz o segmento certo; dedo fora da grade limita e não cancela; `pointercancel` resolve em vez de descartar; ±1 aceita a palavra certa e **rejeita lixo**; segmento invertido aceito; toque em qualquer pixel da grade ancora em alguma célula |
| **Resolução** | Os quatro desfechos de §3.4, incluindo palavra real não listada → âmbar, e seleção de 1 célula → não é erro |
| **Layout** | **Varredura de 320→430 px de largura e 560→950 px de altura**: célula ≥ 30 px, lista sem rolagem, botões ≥ 64 px, nada sobrepõe, ordem de encolhimento de §5.2 respeitada. *Foi o teste equivalente que pegou um defeito real no Spider* |
| **Persistência** | Salvar/restaurar fiel; JSON corrompido, versão errada e tabuleiro que não revalida → partida nova sem travar |
| **Escada** | Jogadora simulada que sempre acerta sobe até o 12 e para; que sempre pede dica desce até o 1 e para; nenhuma oscilação em série; ajuste manual da engrenagem respeitado |
| **Reserva** | Todos os tabuleiros de `tabuleiros-reserva.json` passam pelo validador |

Além disso, na Fase 8: teste do **pacote de produção** no navegador com
eventos de ponteiro reais, emulando **412 × 915** e **360 × 640**, com o
servidor derrubado e com troca de versão.

---

## 11. Funcionamento, PWA e privacidade

### 11.1 Reaproveitado do Spider quase sem alteração

`tools/gen-sw.mjs` e o molde `public/sw.js` vêm do Spider com os cinco
cuidados que lá corrigiram defeitos medidos:

1. **Navegação pela rede primeiro**, com prazo de 3 s e o cache como rede de
   segurança. Com cache-first, uma versão nova nunca chegaria no aparelho dela.
2. **Nome de cache derivado do conteúdo** (SHA-1, 10 dígitos, de todos os
   arquivos do `dist/`). Sem isso, o `activate` não apaga o cache antigo.
3. **Lista de pré-carga gerada do `dist/`**, nunca escrita à mão — os arquivos
   de `assets/` têm o conteúdo no nome e mudam a cada build.
4. **`ignoreVary` na busca do cache** — hospedagens estáticas mandam
   `Vary: Origin`, e sem isso o cache tem o arquivo e responde que não tem.
5. **`cache: 'no-cache'` no `index.html`** — o GitHub Pages responde
   `max-age=600`, e sem isso uma correção demoraria 10 minutos para chegar.

O Service Worker descobre a subpasta onde foi publicado a partir do próprio
endereço, porque o GitHub Pages serve em `usuario.github.io/repo/` — neste
projeto, `https://eldergithub.github.io/caca_palavras/`. O `vite.config.js`
usa `base: './'` justamente para que a subpasta não precise ser configurada
em lugar nenhum.

### 11.2 Wake Lock

**Ainda mais necessário aqui do que no Spider:** ela vai encarar a grade por
minutos sem tocar em nada, e a tela apagando no meio de um raciocínio assusta.

Repedido a cada `visibilitychange`, dentro de `try/catch` silencioso: se o
aparelho recusar, o jogo segue normalmente e ela nunca vê erro nenhum.

### 11.3 Proteções contra acidente

- A partida é salva **a cada palavra encontrada e a cada dica**, então sair —
  de propósito ou sem querer — nunca perde nada.
- JOGO NOVO com partida em andamento pede confirmação (§5.4).
- Botão "voltar" do Android abre a confirmação de saída, não fecha direto.
- Zoom por duplo toque, seleção de texto e "puxar para recarregar"
  desativados — os três causam confusão e sumiço de tela em quem não domina o
  toque.
- A engrenagem não contém nada destrutivo e tem um botão enorme "Voltar ao
  jogo".

### 11.4 Privacidade

Partida, escada e contador ficam em `localStorage`, **no aparelho dela**. Sem
conta, sem login, sem anúncio, sem análise de uso, sem rastreamento, sem
notificação, sem permissão de Android. O endereço hospedado serve só os
arquivos e não registra nada.

---

## 12. Fora do escopo do MVP

Não entram: anúncios, login, multijogador, ranking online, compras, moedas,
vidas, energia, notificações, dependência de internet, servidor, análise de
uso, rastreamento, gamificação.

Ideias avaliadas e **adiadas de propósito**, para consideração futura:

| Ideia | Por que ficou de fora agora |
|---|---|
| Contar como conquista a palavra real encontrada fora da lista | O lampejo âmbar já respeita o achado dela (§3.4); transformar em pontuação seria gamificação |
| Escolha de tema pela jogadora | Criaria uma tela entre o ícone e o jogo. O tema rotaciona sozinho e aparece no rótulo |
| Tabuleiros com palavras de uma obra literária específica | Excelente para o perfil dela, mas é curadoria adicional depois que o banco base estiver de pé |
| Modo "sem diagonais" fixo | A escada já controla isso; um ajuste seria redundante |
| Compartilhar um tabuleiro por semente | Não há com quem compartilhar, e implicaria interface de rede |

---

## 13. Fases de implementação

| Fase | O que entrega |
|---|---|
| **0. Base** | Vite, estrutura de pastas de §14, `index.html` em retrato sem zoom e respeitando o entalhe, CSS base com a paleta de §9.2, fonte subconjunto auto-hospedada, repositório ligado ao GitHub |
| **1. Português e banco** | `core/texto.js`, `tools/valida-banco.mjs`, `_vizinhas.json`, e **600–800 palavras curadas em 15 categorias** pelos critérios de §4.7, **sem etapa de aprovação humana**. Testado por linha de comando, sem UI |
| **2. Gerador e validador** | `core/prng.js`, `gerador.js`, `validador.js` **independente**, `dificuldade.js`. 20.000 sementes × 12 níveis no CI. `tools/gen-reserva.mjs` produz os 50 tabuleiros de reserva. **Ainda sem nenhuma interface** |
| **3. Desenho** | `ui/layout.js` (só aritmética, sem DOM) e `ui/render.js` (uma `<div>` por célula, reaproveitada por id). Grade, rótulo de tema, lista em 2 colunas, botões. Teste de varredura de telas |
| **4. Seleção** | `ui/selecao.js`: projeção em 8 direções, arrasto e dois toques no mesmo mecanismo, as tolerâncias de §3.3, cápsulas, e os quatro desfechos de §3.4 |
| **5. Controles e dicas** | `core/dica.js` com os 3 degraus, JOGO NOVO com confirmação, SAIR, botão voltar do Android, engrenagem, palavra da lista tocável, dedo fantasma |
| **6. Persistência e escada** | `storage.js`, `core/escada.js`, comemoração, vibração, contador de partidas concluídas |
| **7. PWA** | Manifesto em retrato, `sw.js` + `gen-sw.mjs` do Spider, ícones 192/512/maskable, Wake Lock resiliente |
| **8. Revisão** | Revisão do código inteiro e teste do pacote de produção emulando 412×915 e 360×640, com servidor derrubado e com troca de versão |
| **9. Publicação** | GitHub Pages + Actions com portão de teste; instalação no celular dela |
| **10. Acompanhamento** | Observar ela jogando e afinar: `LIMIAR_DE_ARRASTO`, `TOLERANCIA_PONTA`, medianas da escada, e o que mais atrapalhar |

**As fases 1 e 2 entregam um jogo completamente testável sem interface
nenhuma** — é o mesmo alicerce que fez o Spider dar certo, e é por isso que
elas vêm antes de qualquer pixel.

---

## 14. Estrutura de pastas

```
App_caca_palavras/
├─ index.html
├─ vite.config.js            # base: './', target es2020, host: true
├─ package.json              # dev / build / preview / test
├─ PLANO.md
├─ .github/workflows/publicar.yml
├─ public/
│  ├─ manifest.webmanifest
│  ├─ sw.js                          # molde: __VERSAO__ / __RECURSOS__
│  ├─ tabuleiros-reserva.json        # ~50 partidas pré-verificadas
│  ├─ .nojekyll   robots.txt
│  ├─ fontes/letras.woff2            # subconjunto A–Z
│  ├─ icons/                         # 192, 512, maskable
│  └─ palavras/
│     ├─ cotidiano.json     familia.json      natureza.json
│     ├─ animais.json       alimentos.json    objetos.json
│     ├─ lugares.json       profissoes.json   cultura.json
│     ├─ literatura.json    portugues.json    sentimentos.json
│     ├─ plantas.json       musica.json       corpo.json
│     └─ _vizinhas.json              # pares que se confundem (§4.7)
├─ src/
│  ├─ main.js                        # ponto de entrada, liga tudo
│  ├─ core/                          # ZERO DOM — roda no Node
│  │  ├─ prng.js                     # mulberry32 (do Spider)
│  │  ├─ texto.js                    # normalização pt-BR (§4.3)
│  │  ├─ banco.js                    # carga, filtro, sorteio sem repetição
│  │  ├─ gerador.js                  # colocação (§7.3) + enchimento (§7.4)
│  │  ├─ validador.js                # independente do gerador (§7.5)
│  │  ├─ dificuldade.js              # pontuação D (§6.4)
│  │  ├─ escada.js                   # nível interno (§6.3)
│  │  ├─ partida.js                  # estado, resolver seleção, salvar
│  │  └─ dica.js                     # 3 degraus (§8)
│  ├─ ui/
│  │  ├─ layout.js                   # só aritmética: célula, grade, lista
│  │  ├─ render.js                   # uma <div> por célula, por id
│  │  ├─ selecao.js                  # ponteiro → segmento (§3.1, §3.2)
│  │  ├─ lista.js                    # lista de palavras, toque para marcar
│  │  ├─ controles.js                # DICA, JOGO NOVO, SAIR, engrenagem
│  │  ├─ dialogo.js                  # duas saídas por extenso
│  │  ├─ ensino.js                   # dedo fantasma (§5.7)
│  │  ├─ vitoria.js                  # comemoração
│  │  └─ ajustes.js                  # engrenagem
│  ├─ storage.js
│  └─ styles.css
└─ tools/
   ├─ gen-sw.mjs                     # copiado do Spider
   ├─ valida-banco.mjs               # roda no build; falha o build
   ├─ gen-reserva.mjs
   └─ test-core.mjs                  # runner próprio
```

**`src/core/` não conhece o DOM.** Isso permite testar tudo por linha de
comando e usar exatamente o mesmo código dentro dos testes de 20.000 sementes
— garantia de que o que foi validado é o que ela joga.

---

## 15. Riscos conhecidos e mitigação

| Risco | Gravidade | Mitigação |
|---|---|---|
| **Curadoria do banco de palavras** | **Alta** — maior esforço manual, e **sem revisão humana** para pegar um erro de julgamento | O critério está escrito (§4.7) em vez de confiado; `valida-banco.mjs` automatiza o que dá e **falha o build**; na dúvida, não inclui; MVP fecha com 600 e o banco cresce sem tocar em código |
| Uma palavra ruim passar despercebida até o celular dela | Média | Fase 10: qualquer palavra que ela estranhar sai do banco numa linha, e a correção chega sozinha na próxima abertura com internet (§11.1) |
| Célula pequena demais para o dedo | Alta | Piso de 30 px (§2.2) + projeção em 8 direções (§3.1) + ±1 de extremidade |
| Diagonal é genuinamente difícil para olho envelhecido | Média | Só entra no nível 5; nunca no primeiro contato |
| Escada errar para cima e travá-la | Média | A escada desce (§6.3); dicas ilimitadas; ajuste na engrenagem |
| Ela achar palavra real no enchimento e o jogo dizer "errado" | Média — desrespeito direto ao perfil dela | Lampejo âmbar (§3.4) |
| Fonte não carregar offline | Média | Auto-hospedada, no pré-cache do SW, com pilha de reserva no CSS |
| Gerador falhar no aparelho dela sem ninguém ver | Média | 20 tentativas + `tabuleiros-reserva.json`. **Jamais uma tela de erro** |
| Enchimento aleatório ser desmontado por ela em minutos | Média | Enchimento adversário a partir do nível 7 (§7.4) |
| Atualização do PWA não chegar | Baixa | Padrão do Spider copiado inteiro — já foi medido e corrigido lá |
| Ela limpar os dados do Chrome | Baixa | Só a escada e o contador se perdem; o jogo continua funcionando |
| Aparelho abrir em paisagem pelo navegador | Baixa | O layout se reorganiza sozinho, sem aviso e sem jargão |

---

## 16. Critérios de aceite

O app está pronto quando, num celular real de 6,5" em retrato:

1. Ela toca no ícone e **em menos de 2 segundos está com um tabuleiro na
   frente** — sem menu, sem escolha, sem pergunta.
2. Consegue ler qualquer letra da grade sem aproximar o celular do rosto.
3. Consegue selecionar uma palavra com a mão trêmula, **arrastando ou com dois
   toques**, sem saber que existem duas formas.
4. Um desvio de **18 px fora da linha** não impede a seleção correta.
5. **Nenhum toque dentro da grade fica sem resposta visível.**
6. Palavra errada **nunca** produz vermelho, som ou mensagem escrita.
7. Palavra real que ela encontrar fora da lista é **reconhecida, não recusada**.
8. Todas as palavras anunciadas estão de fato na grade — em **100%** das
   partidas, provado por 20.000 sementes no CI.
9. Ela pede dica quando quer; **o jogo nunca oferece sozinho**.
10. Fecha o app, volta depois, e a partida está exatamente onde parou.
11. Nunca vê mensagem de erro, jargão técnico ou tela em inglês.
12. A lista de palavras cabe inteira na tela, **sem rolar**.
13. Consegue sair do jogo sozinha e voltar para o resto do celular.
14. Depois de 20 partidas, o jogo está **mensuravelmente mais difícil** do que
    na primeira.

---

## 17. Situação atual

**Fases 0 a 9 implementadas e publicadas** em
`https://eldergithub.github.io/caca_palavras/`, a partir de
`https://github.com/eldergithub/caca_palavras`.

Uma revisão do código inteiro (Fase 8) encontrou e corrigiu, entre outros:

- Restaurar a partida salva reconstruía **um tabuleiro diferente**: forçar o
  tema pulava um sorteio do PRNG e deslocava toda a sequência. Critério de
  aceite nº 10 estava quebrado.
- Três alavancas de §6.1 não funcionavam: as vizinhas lexicais só eram
  procuradas dentro do tema sorteado, a abstração do tema não acompanhava o
  nível, e o enchimento adversário otimizava algo diferente do que `f_ench`
  mede. O nível 1 vinha com metade das palavras cruzando, contra os 0% da
  tabela.
- O validador independente (§7.5) existia mas **nunca era chamado pelo jogo** —
  só pelos testes.
- Os botões de baixo saíam da tela num aparelho de 360 × 640.
- JOGO NOVO com metade das palavras achadas disparava a comemoração de vitória.

Também foram removidas as camadas que contrariavam decisões fechadas deste
documento e que tinham entrado numa reformulação de interface: som (§2, §9.6),
esteira de fases visível (§2, §5.5, §12), tela de instruções (§2, §5.7),
contador e barra de progresso (§5.5), e tempo e dicas na tela de vitória
(§5.5, §8).

**Pendências conhecidas:**

1. `public/fontes/letras.woff2` está **vazio** (0 byte). A fonte
   auto-hospedada de §9.5 ainda precisa ser produzida; até lá o jogo usa a
   pilha de reserva do sistema.
2. O banco tem duas cópias (`tools/monta-banco.mjs` gera
   `public/palavras/*.json` e `src/core/dados-banco.js`). Um teste confere que
   continuam idênticas, mas ampliar o banco exige rodar o gerador.

**Próximo passo: Fase 10** — observar ela jogando e afinar `LIMIAR_DE_ARRASTO`,
`TOLERANCIA_PONTA` e as medianas da escada.
