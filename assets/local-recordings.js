// Recordings served with the site, keyed by the work IDs shared by the library and player.
// Set album to a key in recordingAlbums. Optional quizTitle and titleAliases describe the recorded selection.
export const localRecordings = {
  1: {
    src: './assets/audio/medieval/01-missa-de-angelis-kyrie.mp3',
    credit: 'Schola Gregoriana Mediolanensis', duration: 130.92,
    titleAliases: ['Missa de Angelis', 'Missa VIII de Angelis', 'Mass of the Angels', '天使弥撒', '天使弥撒慈悲经'],
  },
  2: {
    src: './assets/audio/medieval/02-requiem-aeternam.mp3',
    credit: 'Harpa Dei', duration: 310.68,
    titleAliases: ['Requiem aeternam', '永恒的安息', '永远的安息'],
  },
  3: {
    src: './assets/audio/medieval/03-dies-irae.mp3',
    credit: 'Harpa Dei', duration: 342.96,
    titleAliases: ['Dies irae', '震怒之日', '忿怒之日'],
  },
  4: {
    src: './assets/audio/medieval/04-sumer-is-icumen-in.mp3',
    credit: 'Hilliard Ensemble', duration: 107.328,
    titleAliases: ['Sumer is icumen in', 'Summer is a-coming in', '夏天来了'],
  },
  5: {
    src: './assets/audio/medieval/05-machaut-kyrie.mp3',
    credit: 'Messe de Nostre Dame · Kyrie', duration: 468.456,
    titleAliases: ['Messe de Notre Dame', 'Messe de Nostre Dame', 'Messe de Nostre Dame Kyrie', 'Notre Dame Mass', '圣母弥撒', '圣母弥撒慈悲经'],
  },
};

// Add sourced album information here using { title, artist, year?, artwork? }.
export const recordingAlbums = {};
