// tools/monta-banco.mjs
// Montagem rigorosa do banco de 15 categorias de palavras e pares vizinhos (§4.5, §4.7)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizar } from '../src/core/texto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAIDA_DIR = path.resolve(__dirname, '../public/palavras');

if (!fs.existsSync(SAIDA_DIR)) {
  fs.mkdirSync(SAIDA_DIR, { recursive: true });
}

// 15 Categorias calibradas com distribuição:
// nv 1: ~45% (familiar)
// nv 2: ~40% (culta)
// nv 3: ~15% (repertório)
const DADOS = {
  cotidiano: [
    { t: "ALMOÇO", nv: 1 }, { t: "JANTAR", nv: 1 }, { t: "MANHÃ", nv: 1 }, { t: "TARDE", nv: 1 },
    { t: "NOITE", nv: 1 }, { t: "ROTINA", nv: 1 }, { t: "PASSEIO", nv: 1 }, { t: "DESCANSO", nv: 1 },
    { t: "COMPRA", nv: 1 }, { t: "CONVERSA", nv: 1 }, { t: "CAMINHADA", nv: 1 }, { t: "LEITURA", nv: 1 },
    { t: "VISITA", nv: 1 }, { t: "BANHO", nv: 1 }, { t: "SONO", nv: 1 }, { t: "SONHO", nv: 1 },
    { t: "ACORDAR", nv: 1 }, { t: "DORMIR", nv: 1 }, { t: "LIMPEZA", nv: 1 }, { t: "ARRUMAÇÃO", nv: 1 },
    { t: "ENCONTRO", nv: 1 }, { t: "RECADO", nv: 1 }, { t: "BILHETE", nv: 1 }, { t: "JORNAL", nv: 1 },
    { t: "REVISTA", nv: 1 }, { t: "CARTA", nv: 1 }, { t: "PACOTE", nv: 1 }, { t: "SACOLA", nv: 1 },
    { t: "CHAVE", nv: 1 }, { t: "PORTÃO", nv: 1 }, { t: "PORTA", nv: 1 }, { t: "JANELA", nv: 1 },
    { t: "QUINTAL", nv: 1 }, { t: "CALÇADA", nv: 1 }, { t: "VIZINHO", nv: 1 }, { t: "HORÁRIO", nv: 1 },
    { t: "RELÓGIO", nv: 1 }, { t: "AGENDA", nv: 1 }, { t: "TAREFA", nv: 1 }, { t: "PASSO", nv: 1 },
    { t: "REFEIÇÃO", nv: 1 }, { t: "DESPENSA", nv: 2 }, { t: "ALPENDRE", nv: 2 }, { t: "DESPERTAR", nv: 2 }
  ],

  familia: [
    { t: "FILHO", nv: 1 }, { t: "FILHA", nv: 1 }, { t: "IRMÃO", nv: 1 }, { t: "IRMÃ", nv: 1 },
    { t: "NETO", nv: 1 }, { t: "NETA", nv: 1 }, { t: "PRIMO", nv: 1 }, { t: "PRIMA", nv: 1 },
    { t: "SOBRINHO", nv: 1 }, { t: "SOBRINHA", nv: 1 }, { t: "CASAL", nv: 1 }, { t: "ESPOSO", nv: 1 },
    { t: "ESPOSA", nv: 1 }, { t: "NOIVO", nv: 1 }, { t: "NOIVA", nv: 1 }, { t: "SOGRO", nv: 1 },
    { t: "SOGRA", nv: 1 }, { t: "GENRO", nv: 1 }, { t: "NORA", nv: 1 }, { t: "CUNHADO", nv: 1 },
    { t: "CUNHADA", nv: 1 }, { t: "MADRINHA", nv: 1 }, { t: "PADRINHO", nv: 1 }, { t: "AFILHADO", nv: 1 },
    { t: "AFILHADA", nv: 1 }, { t: "BISAVÔ", nv: 2 }, { t: "PADRASTO", nv: 2 }, { t: "MADRASTA", nv: 2 },
    { t: "BISNETO", nv: 2 }, { t: "BISNETA", nv: 2 }, { t: "ANCESTRAL", nv: 2 }, { t: "GERAÇÃO", nv: 2 },
    { t: "HERANÇA", nv: 2 }, { t: "PARENTESCO", nv: 2 }, { t: "LINHAGEM", nv: 3 }, { t: "MATRIARCA", nv: 3 },
    { t: "PATRIARCA", nv: 3 }, { t: "MATRIMÔNIO", nv: 2 }, { t: "DINDINHA", nv: 1 }, { t: "ENTEADO", nv: 1 },
    { t: "ENTEADA", nv: 1 }, { t: "BERÇO", nv: 1 }, { t: "NÚCLEO", nv: 2 }, { t: "UNIÃO", nv: 1 }
  ],

  natureza: [
    { t: "CHUVA", nv: 1 }, { t: "VENTO", nv: 1 }, { t: "NUVEM", nv: 1 }, { t: "TROVÃO", nv: 1 },
    { t: "RAIO", nv: 1 }, { t: "ORVALHO", nv: 2 }, { t: "NEBLINA", nv: 2 }, { t: "GAROA", nv: 1 },
    { t: "BRISA", nv: 2 }, { t: "TEMPESTADE", nv: 2 }, { t: "AURORA", nv: 2 }, { t: "CREPÚSCULO", nv: 3 },
    { t: "ALVORADA", nv: 2 }, { t: "POENTE", nv: 2 }, { t: "NASCENTE", nv: 2 }, { t: "SERENO", nv: 2 },
    { t: "RIACHO", nv: 1 }, { t: "CASCATA", nv: 2 }, { t: "LAGO", nv: 1 }, { t: "LAGOA", nv: 1 },
    { t: "OCEANO", nv: 2 }, { t: "MONTANHA", nv: 1 }, { t: "COLINA", nv: 2 }, { t: "VALE", nv: 2 },
    { t: "PLANÍCIE", nv: 2 }, { t: "CLAREIRA", nv: 2 }, { t: "BOSQUE", nv: 2 }, { t: "FLORESTA", nv: 1 },
    { t: "HORIZONTE", nv: 2 }, { t: "ESTRELA", nv: 1 }, { t: "COMETA", nv: 2 }, { t: "PLANETA", nv: 2 },
    { t: "CAVERNA", nv: 1 }, { t: "GRUTA", nv: 2 }, { t: "PENEDO", nv: 3 }, { t: "MANANCIAL", nv: 3 },
    { t: "TORRENTE", nv: 3 }, { t: "VAPOR", nv: 2 }, { t: "GEADA", nv: 2 }, { t: "GELO", nv: 1 },
    { t: "DESERTO", nv: 2 }, { t: "OÁSIS", nv: 2 }, { t: "LUFADA", nv: 3 }, { t: "VENDAVAL", nv: 2 },
    { t: "MARESIA", nv: 2 }
  ],

  animais: [
    { t: "CACHORRO", nv: 1 }, { t: "GATO", nv: 1 }, { t: "CAVALO", nv: 1 }, { t: "PÁSSARO", nv: 1 },
    { t: "CORUJA", nv: 1 }, { t: "GAVIÃO", nv: 2 }, { t: "ÁGUIA", nv: 2 }, { t: "CANÁRIO", nv: 1 },
    { t: "SABIÁ", nv: 1 }, { t: "ANDORINHA", nv: 1 }, { t: "PAPAGAIO", nv: 1 }, { t: "TUCANO", nv: 1 },
    { t: "ARARA", nv: 1 }, { t: "GARÇA", nv: 2 }, { t: "CISNE", nv: 2 }, { t: "PELICANO", nv: 2 },
    { t: "PINGUIM", nv: 1 }, { t: "GOLFINHO", nv: 1 }, { t: "BALEIA", nv: 1 }, { t: "FOCA", nv: 1 },
    { t: "TARTARUGA", nv: 1 }, { t: "COELHO", nv: 1 }, { t: "ESQUILO", nv: 2 }, { t: "RAPOSA", nv: 1 },
    { t: "CERVO", nv: 2 }, { t: "VEADO", nv: 2 }, { t: "LEÃO", nv: 1 }, { t: "ONÇA", nv: 1 },
    { t: "TIGRE", nv: 1 }, { t: "LEOPARDO", nv: 2 }, { t: "GIRAFA", nv: 1 }, { t: "ELEFANTE", nv: 1 },
    { t: "ZEBRA", nv: 1 }, { t: "CAMELO", nv: 1 }, { t: "OVELHA", nv: 1 }, { t: "CABRA", nv: 1 },
    { t: "CORDEIRO", nv: 2 }, { t: "LONTRA", nv: 2 }, { t: "BORBOLETA", nv: 1 }, { t: "ABELHA", nv: 1 },
    { t: "JOANINHA", nv: 1 }, { t: "LIBÉLULA", nv: 2 }, { t: "COLIBRI", nv: 2 }, { t: "GAIVOTA", nv: 2 },
    { t: "ROUXINOL", nv: 3 }
  ],

  alimentos: [
    { t: "ARROZ", nv: 1 }, { t: "FEIJÃO", nv: 1 }, { t: "BATATA", nv: 1 }, { t: "CENOURA", nv: 1 },
    { t: "TOMATE", nv: 1 }, { t: "CEBOLA", nv: 1 }, { t: "ALHO", nv: 1 }, { t: "ALFACE", nv: 1 },
    { t: "ESPINAFRE", nv: 2 }, { t: "ABÓBORA", nv: 1 }, { t: "CHUCHU", nv: 1 }, { t: "MANDIOCA", nv: 1 },
    { t: "BANANA", nv: 1 }, { t: "LARANJA", nv: 1 }, { t: "MAÇÃ", nv: 1 }, { t: "ABACAXI", nv: 1 },
    { t: "MELANCIA", nv: 1 }, { t: "MELÃO", nv: 1 }, { t: "MORANGO", nv: 1 }, { t: "GOIABA", nv: 1 },
    { t: "MANGA", nv: 1 }, { t: "PÊSSEGO", nv: 1 }, { t: "AMEIXA", nv: 2 }, { t: "JABUTICABA", nv: 2 },
    { t: "QUEIJO", nv: 1 }, { t: "MANTEIGA", nv: 1 }, { t: "TORRADA", nv: 1 }, { t: "BISCOITO", nv: 1 },
    { t: "BOLO", nv: 1 }, { t: "TORTA", nv: 1 }, { t: "SOPA", nv: 1 }, { t: "CALDO", nv: 1 },
    { t: "POLENTA", nv: 1 }, { t: "CANJICA", nv: 1 }, { t: "PAMONHA", nv: 1 }, { t: "AZEITE", nv: 2 },
    { t: "VINAGRE", nv: 2 }, { t: "TEMPERO", nv: 1 }, { t: "CANELA", nv: 1 }, { t: "CRAVO", nv: 1 },
    { t: "ALECRIM", nv: 2 }, { t: "HORTELÃ", nv: 1 }, { t: "FARINHA", nv: 1 }, { t: "EMPADA", nv: 1 },
    { t: "PASTEL", nv: 1 }
  ],

  objetos: [
    { t: "CADEIRA", nv: 1 }, { t: "MESA", nv: 1 }, { t: "SOFÁ", nv: 1 }, { t: "ARMÁRIO", nv: 1 },
    { t: "GAVETA", nv: 1 }, { t: "ESTANTE", nv: 1 }, { t: "ESPELHO", nv: 1 }, { t: "QUADRO", nv: 1 },
    { t: "TAPETE", nv: 1 }, { t: "CORTINA", nv: 2 }, { t: "ABAJUR", nv: 2 }, { t: "LÂMPADA", nv: 2 },
    { t: "PRATO", nv: 1 }, { t: "PRATA", nv: 2 }, { t: "XÍCARA", nv: 1 }, { t: "COPO", nv: 1 },
    { t: "TALHER", nv: 2 }, { t: "GARFO", nv: 1 }, { t: "COLHER", nv: 1 }, { t: "FACA", nv: 1 },
    { t: "PANELA", nv: 1 }, { t: "FRIGIDEIRA", nv: 2 }, { t: "CHALEIRA", nv: 2 }, { t: "GARRAFA", nv: 1 },
    { t: "VASILHA", nv: 2 }, { t: "TRAVESSEIRO", nv: 2 }, { t: "COBERTOR", nv: 2 }, { t: "LENÇOL", nv: 2 },
    { t: "TOALHA", nv: 1 }, { t: "TESOURA", nv: 1 }, { t: "AGULHA", nv: 1 }, { t: "LINHA", nv: 1 },
    { t: "BOTÃO", nv: 1 }, { t: "CANETA", nv: 1 }, { t: "LÁPIS", nv: 1 }, { t: "BORRACHA", nv: 1 },
    { t: "CADERNO", nv: 1 }, { t: "ENVELOPE", nv: 2 }, { t: "VASO", nv: 1 }, { t: "CANDELABRO", nv: 3 },
    { t: "RELICÁRIO", nv: 3 }, { t: "ALFARRÁBIO", nv: 3 }, { t: "LEQUE", nv: 2 }, { t: "BANQUETA", nv: 2 },
    { t: "RETRATO", nv: 2 }
  ],

  lugares: [
    { t: "CIDADE", nv: 1 }, { t: "ALDEIA", nv: 2 }, { t: "VILA", nv: 1 }, { t: "BAIRRO", nv: 1 },
    { t: "PRAÇA", nv: 1 }, { t: "AVENIDA", nv: 1 }, { t: "ALAMEDA", nv: 2 }, { t: "TRAVESSA", nv: 2 },
    { t: "BECO", nv: 2 }, { t: "ESQUINA", nv: 1 }, { t: "PARQUE", nv: 1 }, { t: "JARDIM", nv: 1 },
    { t: "PRAIA", nv: 1 }, { t: "LITORAL", nv: 2 }, { t: "PORTO", nv: 2 }, { t: "FAROL", nv: 2 },
    { t: "FATOR", nv: 2 }, { t: "ESTAÇÃO", nv: 2 }, { t: "FERROVIA", nv: 2 }, { t: "AEROPORTO", nv: 2 },
    { t: "IGREJA", nv: 1 }, { t: "CAPELA", nv: 2 }, { t: "CATEDRAL", nv: 2 }, { t: "CONVENTO", nv: 3 },
    { t: "MUSEU", nv: 2 }, { t: "TEATRO", nv: 2 }, { t: "CINEMA", nv: 1 }, { t: "BIBLIOTECA", nv: 2 },
    { t: "LIVRARIA", nv: 2 }, { t: "MERCADO", nv: 1 }, { t: "PADARIA", nv: 1 }, { t: "FARMÁCIA", nv: 1 },
    { t: "HOSPITAL", nv: 1 }, { t: "ESCOLA", nv: 1 }, { t: "COLÉGIO", nv: 2 }, { t: "FACULDADE", nv: 2 },
    { t: "CASTELO", nv: 2 }, { t: "FORTALEZA", nv: 2 }, { t: "PALÁCIO", nv: 2 }, { t: "SOBRADO", nv: 2 },
    { t: "CHÁCARA", nv: 2 }, { t: "SÍTIO", nv: 1 }, { t: "FAZENDA", nv: 1 }, { t: "MIRANTE", nv: 3 },
    { t: "PLANALTO", nv: 3 }
  ],

  profissoes: [
    { t: "PROFESSOR", nv: 1 }, { t: "MESTRE", nv: 2 }, { t: "DOUTOR", nv: 2 }, { t: "MÉDICO", nv: 1 },
    { t: "ENFERMEIRO", nv: 2 }, { t: "DENTISTA", nv: 2 }, { t: "BIÓLOGO", nv: 2 }, { t: "ADVOGADO", nv: 2 },
    { t: "JUIZ", nv: 2 }, { t: "PROMOTOR", nv: 2 }, { t: "ENGENHEIRO", nv: 2 }, { t: "ARQUITETO", nv: 2 },
    { t: "ESCRITOR", nv: 2 }, { t: "POETA", nv: 2 }, { t: "JORNALISTA", nv: 2 }, { t: "PINTOR", nv: 1 },
    { t: "ESCULTOR", nv: 2 }, { t: "MÚSICO", nv: 2 }, { t: "CANTOR", nv: 1 }, { t: "ATRIZ", nv: 1 },
    { t: "ATOR", nv: 1 }, { t: "DIRETOR", nv: 2 }, { t: "MAESTRO", nv: 3 }, { t: "CARPINTEIRO", nv: 2 },
    { t: "MARCENEIRO", nv: 2 }, { t: "PEDREIRO", nv: 1 }, { t: "PADEIRO", nv: 1 }, { t: "CONFEITEIRO", nv: 2 },
    { t: "COZINHEIRO", nv: 1 }, { t: "ALFAIATE", nv: 2 }, { t: "COSTUREIRA", nv: 1 }, { t: "SAPATEIRO", nv: 2 },
    { t: "JARDINEIRO", nv: 1 }, { t: "AGRICULTOR", nv: 2 }, { t: "PESCADOR", nv: 1 }, { t: "PILOTO", nv: 2 },
    { t: "MARINHEIRO", nv: 2 }, { t: "CARTEIRO", nv: 1 }, { t: "BOMBEIRO", nv: 1 }, { t: "POLICIAL", nv: 1 },
    { t: "HISTORIADOR", nv: 3 }, { t: "FILÓSOFO", nv: 3 }, { t: "CIENTISTA", nv: 3 }, { t: "ARTESÃO", nv: 2 }
  ],

  cultura: [
    { t: "TRADIÇÃO", nv: 2 }, { t: "FOLCLORE", nv: 2 }, { t: "LENDA", nv: 2 }, { t: "MITO", nv: 2 },
    { t: "FESTIVAL", nv: 2 }, { t: "CARNAVAL", nv: 1 }, { t: "CORTEJO", nv: 3 }, { t: "DESFILE", nv: 2 },
    { t: "PROCISSÃO", nv: 2 }, { t: "CONGADA", nv: 3 }, { t: "MARACATU", nv: 3 }, { t: "FREVO", nv: 2 },
    { t: "CIRANDA", nv: 2 }, { t: "SAMBA", nv: 1 }, { t: "CHORINHO", nv: 2 }, { t: "SERESTA", nv: 3 },
    { t: "REPENTE", nv: 3 }, { t: "CORDEL", nv: 2 }, { t: "ARTESANATO", nv: 2 }, { t: "CERÂMICA", nv: 2 },
    { t: "RENDADO", nv: 2 }, { t: "BORDADO", nv: 2 }, { t: "TAPEÇARIA", nv: 2 }, { t: "CULINÁRIA", nv: 2 },
    { t: "PATRIMÔNIO", nv: 2 }, { t: "ACERVO", nv: 3 }, { t: "GALERIA", nv: 2 }, { t: "EXPOSIÇÃO", nv: 2 },
    { t: "ESCULTURA", nv: 2 }, { t: "MONUMENTO", nv: 2 }, { t: "MUSEOLOGIA", nv: 3 }, { t: "MEMÓRIA", nv: 2 },
    { t: "COSTUME", nv: 2 }, { t: "CRENÇA", nv: 2 }, { t: "RITUAL", nv: 2 }, { t: "FESTEJO", nv: 2 },
    { t: "SABEDORIA", nv: 2 }, { t: "POPULAR", nv: 1 }, { t: "ERUDITO", nv: 3 }, { t: "HISTÓRIA", nv: 1 },
    { t: "MEMORIAL", nv: 2 }, { t: "HOMENAGEM", nv: 2 }, { t: "CELEBRAÇÃO", nv: 2 }, { t: "BALUARTE", nv: 3 },
    { t: "RELÍQUIA", nv: 3 }
  ],

  literatura: [
    { t: "MACHADO", nv: 3 }, { t: "DRUMMOND", nv: 3 }, { t: "CECÍLIA", nv: 3 }, { t: "BANDEIRA", nv: 3 },
    { t: "BILAC", nv: 3 }, { t: "ALENCAR", nv: 3 }, { t: "GUIMARÃES", nv: 3 }, { t: "CLARICE", nv: 3 },
    { t: "CASTRO", nv: 3 }, { t: "CORALINA", nv: 3 }, { t: "QUINTANA", nv: 3 }, { t: "PESSOA", nv: 3 },
    { t: "CAMÕES", nv: 3 }, { t: "ROMANCE", nv: 2 }, { t: "CONTO", nv: 2 }, { t: "CANTO", nv: 2 },
    { t: "NOVELA", nv: 2 }, { t: "CRÔNICA", nv: 2 }, { t: "POEMA", nv: 2 }, { t: "POESIA", nv: 2 },
    { t: "SONETO", nv: 2 }, { t: "VERSO", nv: 2 }, { t: "ESTROFE", nv: 2 }, { t: "RIMA", nv: 1 },
    { t: "ENREDO", nv: 2 }, { t: "TRAMA", nv: 2 }, { t: "CAPÍTULO", nv: 2 }, { t: "PÁGINA", nv: 1 },
    { t: "PRÓLOGO", nv: 3 }, { t: "EPÍLOGO", nv: 3 }, { t: "PERSONAGEM", nv: 2 }, { t: "NARRADOR", nv: 2 },
    { t: "AUTOR", nv: 2 }, { t: "LEITOR", nv: 2 }, { t: "EDIÇÃO", nv: 2 }, { t: "VOLUME", nv: 2 },
    { t: "LIVRO", nv: 1 }, { t: "LIVRE", nv: 2 }, { t: "OBRA", nv: 2 }, { t: "ANTOLOGIA", nv: 3 },
    { t: "BIOGRAFIA", nv: 2 }, { t: "FICÇÃO", nv: 2 }, { t: "DRAMA", nv: 2 }, { t: "COMÉDIA", nv: 2 },
    { t: "PROSA", nv: 2 }, { t: "LÍRICA", nv: 3 }, { t: "FÁBULA", nv: 2 }
  ],

  portugues: [
    { t: "METÁFORA", nv: 3 }, { t: "METONÍMIA", nv: 3 }, { t: "ANTÍTESE", nv: 3 }, { t: "PARADOXO", nv: 3 },
    { t: "HIPÉRBOLE", nv: 3 }, { t: "EUFEMISMO", nv: 3 }, { t: "IRONIA", nv: 2 }, { t: "PLEONASMO", nv: 3 },
    { t: "ALITERAÇÃO", nv: 3 }, { t: "ASSONÂNCIA", nv: 3 }, { t: "SINESTESIA", nv: 3 }, { t: "PROSOPOPEIA", nv: 3 },
    { t: "SUJEITO", nv: 2 }, { t: "PREDICADO", nv: 2 }, { t: "SUBSTANTIVO", nv: 2 }, { t: "ADJETIVO", nv: 2 },
    { t: "PRONOME", nv: 2 }, { t: "VERBO", nv: 2 }, { t: "ADVÉRBIO", nv: 2 }, { t: "PREPOSIÇÃO", nv: 2 },
    { t: "CONJUNÇÃO", nv: 2 }, { t: "INTERJEIÇÃO", nv: 3 }, { t: "ARTIGO", nv: 2 }, { t: "NUMERAL", nv: 2 },
    { t: "ORAÇÃO", nv: 2 }, { t: "PERÍODO", nv: 2 }, { t: "PARÁGRAFO", nv: 2 }, { t: "SINTAXE", nv: 3 },
    { t: "SEMÂNTICA", nv: 3 }, { t: "FONÉTICA", nv: 3 }, { t: "MORFOLOGIA", nv: 3 }, { t: "ACENTUAÇÃO", nv: 2 },
    { t: "PONTUAÇÃO", nv: 2 }, { t: "VÍRGULA", nv: 1 }, { t: "TRAVESSÃO", nv: 2 }, { t: "PARÊNTESE", nv: 2 },
    { t: "RETICÊNCIAS", nv: 3 }, { t: "RADICAL", nv: 2 }, { t: "PREFIXO", nv: 2 }, { t: "SUFIXO", nv: 2 },
    { t: "VOCÁBULO", nv: 3 }, { t: "REGÊNCIA", nv: 3 }, { t: "CRASE", nv: 2 }, { t: "TÔNICA", nv: 2 },
    { t: "ÁTONA", nv: 2 }
  ],

  sentimentos: [
    { t: "AMOR", nv: 1 }, { t: "AFETO", nv: 1 }, { t: "CARINHO", nv: 1 }, { t: "TERNURA", nv: 2 },
    { t: "BONDADE", nv: 1 }, { t: "ALEGRIA", nv: 1 }, { t: "FELICIDADE", nv: 1 }, { t: "ENTUSIASMO", nv: 2 },
    { t: "ESPERANÇA", nv: 1 }, { t: "SERENIDADE", nv: 2 }, { t: "HARMONIA", nv: 2 }, { t: "CALMA", nv: 1 },
    { t: "CORAGEM", nv: 2 }, { t: "BRAVURA", nv: 2 }, { t: "CONFIANÇA", nv: 2 }, { t: "GRATIDÃO", nv: 2 },
    { t: "SAUDADE", nv: 1 }, { t: "NOSTALGIA", nv: 2 }, { t: "LEMBRANÇA", nv: 1 }, { t: "ADMIRAÇÃO", nv: 2 },
    { t: "RESPEITO", nv: 2 }, { t: "AMIZADE", nv: 1 }, { t: "LEALDADE", nv: 2 }, { t: "COMPAIXÃO", nv: 2 },
    { t: "EMPATIA", nv: 2 }, { t: "DELICADEZA", nv: 2 }, { t: "DOÇURA", nv: 2 }, { t: "MEIGUICE", nv: 2 },
    { t: "SIMPATIA", nv: 2 }, { t: "ENCANTO", nv: 2 }, { t: "FASCÍNIO", nv: 2 }, { t: "CONSOLO", nv: 2 },
    { t: "ALÍVIO", nv: 2 }, { t: "CONVIVÊNCIA", nv: 2 }, { t: "PACIÊNCIA", nv: 2 }, { t: "FIRMEZA", nv: 2 },
    { t: "EQUILÍBRIO", nv: 2 }, { t: "CONCÓRDIA", nv: 3 }, { t: "AFABILIDADE", nv: 3 }, { t: "ALTIVEZ", nv: 3 },
    { t: "DIGNIDADE", nv: 3 }, { t: "MODÉSTIA", nv: 3 }, { t: "DEVOÇÃO", nv: 2 }, { t: "ZELO", nv: 2 }
  ],

  plantas: [
    { t: "ÁRVORE", nv: 1 }, { t: "FLOR", nv: 1 }, { t: "FOLHA", nv: 1 }, { t: "GALHO", nv: 1 },
    { t: "TRONCO", nv: 1 }, { t: "RAIZ", nv: 1 }, { t: "SEMENTE", nv: 1 }, { t: "BROTO", nv: 2 },
    { t: "ROSA", nv: 1 }, { t: "ROSEIRA", nv: 2 }, { t: "ORQUÍDEA", nv: 2 }, { t: "MARGARIDA", nv: 1 },
    { t: "VIOLETA", nv: 2 }, { t: "HORTÊNSIA", nv: 2 }, { t: "JASMIM", nv: 2 }, { t: "LÍRIO", nv: 2 },
    { t: "GIRASSOL", nv: 1 }, { t: "SAMAMBAIA", nv: 2 }, { t: "AVENCA", nv: 2 }, { t: "MUSGO", nv: 2 },
    { t: "LÍQUEN", nv: 3 }, { t: "BAMBU", nv: 2 }, { t: "PALMEIRA", nv: 1 }, { t: "COQUEIRO", nv: 1 },
    { t: "ACÁCIA", nv: 2 }, { t: "JACARANDÁ", nv: 2 }, { t: "JEQUITIBÁ", nv: 3 }, { t: "QUARESMEIRA", nv: 3 },
    { t: "CEDRO", nv: 2 }, { t: "PINHEIRO", nv: 2 }, { t: "CIPRESTE", nv: 2 }, { t: "EUCALIPTO", nv: 2 },
    { t: "ARAPIRACA", nv: 3 }, { t: "SUCULENTA", nv: 2 }, { t: "CACTO", nv: 2 }, { t: "HERA", nv: 2 },
    { t: "PARREIRA", nv: 2 }, { t: "VIDEIRA", nv: 2 }, { t: "POMAR", nv: 2 }, { t: "HERBÁRIO", nv: 3 },
    { t: "CLOROFILA", nv: 3 }, { t: "BOTÂNICA", nv: 3 }, { t: "MANACÁ", nv: 3 }, { t: "PETÚNIA", nv: 2 }
  ],

  musica: [
    { t: "CANÇÃO", nv: 1 }, { t: "CÂNTICO", nv: 2 }, { t: "MELODIA", nv: 2 }, { t: "RITMO", nv: 2 },
    { t: "COMPASSO", nv: 2 }, { t: "ACORDE", nv: 2 }, { t: "NOTA", nv: 1 }, { t: "ESCALA", nv: 2 },
    { t: "CLAVE", nv: 2 }, { t: "PARTITURA", nv: 2 }, { t: "ORQUESTRA", nv: 2 }, { t: "SINFONIA", nv: 2 },
    { t: "CONCERTO", nv: 2 }, { t: "SONATA", nv: 2 }, { t: "PRELÚDIO", nv: 3 }, { t: "ÓPERA", nv: 2 },
    { t: "CORAL", nv: 2 }, { t: "CORO", nv: 2 }, { t: "SOPRANO", nv: 3 }, { t: "TENOR", nv: 3 },
    { t: "BARÍTONO", nv: 3 }, { t: "PIANO", nv: 1 }, { t: "VIOLÃO", nv: 1 }, { t: "VIOLINO", nv: 2 },
    { t: "VIOLA", nv: 2 }, { t: "VIOLONCELO", nv: 2 }, { t: "FLAUTA", nv: 1 }, { t: "CLARINETE", nv: 2 },
    { t: "OBOÉ", nv: 3 }, { t: "FAGOTE", nv: 3 }, { t: "TROMPETE", nv: 2 }, { t: "TROMBONE", nv: 2 },
    { t: "TUBA", nv: 2 }, { t: "HARPA", nv: 2 }, { t: "TAMBOR", nv: 1 }, { t: "TIMPÃO", nv: 3 },
    { t: "ACORDEOM", nv: 2 }, { t: "GAITA", nv: 2 }, { t: "SOLFEJO", nv: 3 }, { t: "BATUTA", nv: 3 },
    { t: "ENSAIO", nv: 2 }, { t: "BALADA", nv: 2 }, { t: "ARRANJO", nv: 2 }, { t: "TIMBRE", nv: 3 }
  ],

  corpo: [
    { t: "CABEÇA", nv: 1 }, { t: "CABELO", nv: 1 }, { t: "ROSTO", nv: 1 }, { t: "TESTA", nv: 1 },
    { t: "OLHO", nv: 1 }, { t: "SOBRANCELHA", nv: 2 }, { t: "CÍLIO", nv: 2 }, { t: "NARIZ", nv: 1 },
    { t: "BOCA", nv: 1 }, { t: "LÁBIO", nv: 1 }, { t: "DENTE", nv: 1 }, { t: "LÍNGUA", nv: 1 },
    { t: "QUEIXO", nv: 1 }, { t: "ORELHA", nv: 1 }, { t: "OUVIDO", nv: 1 }, { t: "PESCOÇO", nv: 1 },
    { t: "GARGANTA", nv: 1 }, { t: "OMBRO", nv: 1 }, { t: "PEITO", nv: 1 }, { t: "CORAÇÃO", nv: 1 },
    { t: "CORPO", nv: 1 }, { t: "COSTAS", nv: 1 }, { t: "COLUNA", nv: 2 }, { t: "BRAÇO", nv: 1 },
    { t: "COTOVELO", nv: 2 }, { t: "PULSO", nv: 2 }, { t: "DEDO", nv: 1 }, { t: "UNHA", nv: 1 },
    { t: "PALMA", nv: 1 }, { t: "CINTURA", nv: 1 }, { t: "QUADRIL", nv: 2 }, { t: "PERNA", nv: 1 },
    { t: "COXA", nv: 1 }, { t: "JOELHO", nv: 1 }, { t: "TORNOZELO", nv: 2 }, { t: "COSTELA", nv: 2 },
    { t: "CALCANHAR", nv: 2 }, { t: "PELE", nv: 1 }, { t: "SANGUE", nv: 1 }, { t: "PULMÃO", nv: 2 },
    { t: "CÉREBRO", nv: 2 }, { t: "NERVO", nv: 2 }, { t: "MÚSCULO", nv: 2 }, { t: "OSSO", nv: 1 },
    { t: "ARTÉRIA", nv: 2 }, { t: "PUPILA", nv: 2 }
  ]
};

const PARES_VIZINHAS = [
  ["CONTO", "CANTO"],
  ["LIVRO", "LIVRE"],
  ["VERSO", "VERBO"],
  ["SONHO", "SONO"],
  ["PRATO", "PRATA"],
  ["FAROL", "FATOR"],
  ["PORTA", "PORTO"],
  ["CORO", "CORPO"],
  ["CEDRO", "CERVO"],
  ["POEMA", "POETA"]
];

const mapaGlobal = new Map();
const categoriasProcessadas = {};
let n1 = 0, n2 = 0, n3 = 0;

for (const [cat, lista] of Object.entries(DADOS)) {
  const processadas = [];
  for (const item of lista) {
    const n = normalizar(item.t);
    const reg = { t: item.t, n, nv: item.nv };

    if (mapaGlobal.has(n)) {
      console.error(`ERRO: Colisão de '${n}' em ${cat} com ${mapaGlobal.get(n)}`);
      process.exit(1);
    }
    mapaGlobal.set(n, cat);
    processadas.push(reg);

    if (item.nv === 1) n1++;
    if (item.nv === 2) n2++;
    if (item.nv === 3) n3++;
  }
  categoriasProcessadas[cat] = processadas;
}

for (const [cat, palavras] of Object.entries(categoriasProcessadas)) {
  const caminho = path.join(SAIDA_DIR, `${cat}.json`);
  fs.writeFileSync(caminho, JSON.stringify(palavras, null, 2) + '\n', 'utf-8');
}

const caminhoVizinhas = path.join(SAIDA_DIR, '_vizinhas.json');
fs.writeFileSync(caminhoVizinhas, JSON.stringify(PARES_VIZINHAS, null, 2) + '\n', 'utf-8');

// Gerar também src/core/dados-banco.js para compatibilidade estática perfeita Node + Vite
const caminhoModulo = path.resolve(__dirname, '../src/core/dados-banco.js');
const conteudoModulo = `// Gerado automaticamente por tools/monta-banco.mjs
export const CATEGORIAS = ${JSON.stringify(categoriasProcessadas, null, 2)};
export const VIZINHAS = ${JSON.stringify(PARES_VIZINHAS, null, 2)};
`;
fs.writeFileSync(caminhoModulo, conteudoModulo, 'utf-8');

const total = mapaGlobal.size;
console.log(`Banco montado: ${total} palavras.`);
console.log(`nv1: ${n1} (${((n1/total)*100).toFixed(1)}%) | nv2: ${n2} (${((n2/total)*100).toFixed(1)}%) | nv3: ${n3} (${((n3/total)*100).toFixed(1)}%)`);
