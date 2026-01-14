
import { Question } from './types';

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'a1',
    text: 'Vad uttrycker positiva decibeltal (dB) i antenn- och kabel-TV-nät?',
    options: ['Dämpning', 'Störningar', 'Brus', 'Förstärkning'],
    correctIndex: 3,
    explanation: 'Positiva dB-tal indikerar en ökning av signalstyrkan, alltså förstärkning.'
  },
  {
    id: 'a2',
    text: 'Vad uttrycker negativa decibeltal (dB) i antenn- och kabel-TV-nät?',
    options: ['Förstärkning', 'Ingen förändring', 'Dämpning', 'Modulering'],
    correctIndex: 2,
    explanation: 'Negativa dB-tal indikerar en förlust av signalstyrka, vilket kallas dämpning.'
  },
  {
    id: 'a3',
    text: 'Vilken signalnivå ska uppnås i alla uttag?',
    options: ['30–40 dBµV', '45–75 dBµV', '20–30 dBµV', '80–100 dBµV'],
    correctIndex: 1,
    explanation: 'Enligt standard bör nivån i ett TV-uttag ligga mellan 45 och 75 dBµV.'
  },
  {
    id: 'a4',
    text: 'Vad innebär genomgångsdämpning?',
    options: ['Mellan två uttag', 'Förlust genom komponent', 'Skillnad i förstärkare', 'I antennen'],
    correctIndex: 1,
    explanation: 'Genomgångsdämpning är den förlust som uppstår när signalen passerar genom en komponent.'
  },
  {
    id: 'a5',
    text: 'Vad innebär avtappningsdämpning?',
    options: ['I huvudkabel', 'Mellan förstärkare', 'Mellan stam och uttag', 'I mantel'],
    correctIndex: 2,
    explanation: 'Avtappningsdämpning är dämpningen mellan stammedningen och själva uttaget.'
  },
  {
    id: 'a6',
    text: 'Rätt frekvensområden för TV/radio och satellit?',
    options: ['5–50 / 50–200', '47–862 / 950–2150', '950–2150 / 47–862', '1–10 GHz'],
    correctIndex: 1,
    explanation: 'Markbunden TV/Kabel använder 47–862 MHz, medan Satellit (MF) använder 950–2150 MHz.'
  },
  {
    id: 'a7',
    text: 'Vilken organisation fördelar frekvenser?',
    options: ['IEC', 'ISO', 'ITU', 'CENELEC'],
    correctIndex: 2,
    explanation: 'ITU (International Telecommunication Union) ansvarar för global frekvensfördelning.'
  },
  {
    id: 'a8',
    text: 'Vad betyder "program" i frekvenssammanhang?',
    options: ['8 MHz område', 'TV-program t.ex. TV4', 'Medelfrekvens', 'Modulatorfrekvens'],
    correctIndex: 0,
    explanation: 'Inom frekvensplanering avser ett program ett specifikt frekvensutrymme, ofta 8 MHz brett.'
  },
  {
    id: 'a9',
    text: 'Vad är en kanalplats?',
    options: ['Gränsfrekvenser', 'Medelfrekvens', '8 MHz område', 'Modulatorfrekvens'],
    correctIndex: 2,
    explanation: 'En kanalplats definieras av ett 8 MHz brett frekvensområde i TV-nätet.'
  },
  {
    id: 'a10',
    text: 'Digital information blandas i en …',
    options: ['Frekvensprocessor', 'Demodulator', 'Multiplexer', 'Förstärkare'],
    correctIndex: 2,
    explanation: 'En multiplexer (MUX) kombinerar flera digitala strömmar till en gemensam signal.'
  },
  {
    id: 'a11',
    text: 'Vad gör en frekvensprocessor?',
    options: ['Förstärker', 'Filtrerar brus', 'Flyttar/hanterar kanaler', 'Digitaliserar'],
    correctIndex: 2,
    explanation: 'Frekvensprocessorn används för att flytta eller omvandla kanaler till andra frekvenser.'
  },
  {
    id: 'a12',
    text: 'Varför förbättrar inte en förstärkare dålig signal?',
    options: ['Förstärker även brus', 'Byter frekvens', 'Sänker nivå', 'Tar bort störningar'],
    correctIndex: 0,
    explanation: 'Om signalen är dålig (lågt S/N-förhållande) förstärker förstärkaren även bruset, vilket inte ger bättre bild.'
  },
  {
    id: 'a13',
    text: 'En … fördelar signalen till flera utgångar.',
    options: ['Slutmotstånd', 'Avtappare', 'Fördelare', 'Förstärkare'],
    correctIndex: 2,
    explanation: 'En fördelare delar upp en inkommande signal jämnt på flera utgångar.'
  },
  {
    id: 'a14',
    text: 'Frekvensområde för antenn/kabel-TV?',
    options: ['5–50', '47–862', '950–2150', '1–10 GHz'],
    correctIndex: 1,
    explanation: 'Standardområdet för distribution av radio och TV i kabelnät är 47–862 MHz.'
  },
  {
    id: 'a15',
    text: 'Antennens uppgift?',
    options: ['Förstärka', 'Filtrera', 'Ta emot EM-vågor', 'Omvandla signal'],
    correctIndex: 2,
    explanation: 'Antennen fångar upp elektromagnetiska vågor i luften och omvandlar dem till elektrisk spänning.'
  },
  {
    id: 'a16',
    text: 'Spärrfilter används för att …',
    options: ['Släppa allt', 'Filtrera bort oönskat', 'Förstärka', 'Anpassa'],
    correctIndex: 1,
    explanation: 'Spärrfilter (notch-filter) används för att ta bort specifika oönskade frekvenser eller störningar.'
  },
  {
    id: 'a17',
    text: 'Låg-/högpassfilter …',
    options: ['Förstärker', 'Filtrerar över/under gräns', 'Endast satellit', 'Mäter nivå'],
    correctIndex: 1,
    explanation: 'Dessa filter släpper igenom signaler antingen under eller över en specifik brytfrekvens.'
  },
  {
    id: 'a18',
    text: 'Standard koaxialkabel vid antenn?',
    options: ['75 ohm', '50 ohm', '100 ohm', '120 ohm'],
    correctIndex: 0,
    explanation: '75 ohm är den universella standarden för impedans i TV- och radiosystem.'
  },
  {
    id: 'a19',
    text: 'Vad betyder 1,0 i KTV 1,0/4,8 CE?',
    options: ['Ytterdiameter', 'Innerledare', 'Skärm', 'Mantel'],
    correctIndex: 1,
    explanation: 'Siffran 1,0 anger diametern på innerledaren i millimeter.'
  },
  {
    id: 'a20',
    text: 'Bästa F-kontakt ur helhetssyn?',
    options: ['Skruv', 'Crimp', 'Kompressionskontakt', 'Push-on'],
    correctIndex: 2,
    explanation: 'Kompressionskontakter ger bäst skärmning, hållbarhet och kontakt över tid.'
  },
  {
    id: 'a21',
    text: 'Korrekt förläggning av koax?',
    options: ['Skarp böj', 'Undvik starkström', 'Ta bort skärm', 'Utan fäste'],
    correctIndex: 1,
    explanation: 'Koaxialkablar bör inte förläggas nära starkströmskablar för att undvika inducerade störningar.'
  },
  {
    id: 'a22',
    text: 'Vad mäts vid inmätning?',
    options: ['Färg', 'Signalnivå och MER/CN', 'Spänning', 'Temperatur'],
    correctIndex: 1,
    explanation: 'Vid kontroll mäter man signalstyrkan (nivå) och signalkvaliteten (MER = Modulation Error Ratio).'
  }
];

export const CLASSES = ['EE23'];

export const GAME_CONFIG = {
  GRAVITY: 0.7,
  JUMP_FORCE: -11,
  SPEED_INITIAL: 3.5, 
  SPEED_MAX: 15,
  PLAYER_SIZE: 45,
  GROUND_Y: 400,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
};
