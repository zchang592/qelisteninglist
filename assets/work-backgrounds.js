import { data } from './data.js';

// Bilingual editorial notes keyed by the original catalogue IDs.
const composers = {
  "Gregorian chant": ["匿名（格里高利圣咏）", "Anonymous (Gregorian chant)"],
  "Medieval 6-part polyphony": ["匿名", "Anonymous"],
  "Guillaume de Machaut": ["纪尧姆·德·马肖", "Guillaume de Machaut"],
  "Josquin des Prés": ["若斯坎·德·普雷", "Josquin des Prés"],
  "Giovanni de Palestrina": ["乔瓦尼·皮耶路易吉·达·帕莱斯特里纳", "Giovanni Pierluigi da Palestrina"],
  "Thomas Tallis": ["托马斯·塔利斯", "Thomas Tallis"],
  "Thomas Morley": ["托马斯·莫利", "Thomas Morley"],
  "John Dowland": ["约翰·道兰德", "John Dowland"],
  "16th century English folksong": ["匿名（英国民歌）", "Anonymous (English ballad)"],
  "Claudio Monteverdi": ["克劳迪奥·蒙特威尔第", "Claudio Monteverdi"],
  "Antonio Vivaldi": ["安东尼奥·维瓦尔第", "Antonio Vivaldi"],
  "Johann Sebastian Bach": ["约翰·塞巴斯蒂安·巴赫", "Johann Sebastian Bach"],
  "Georg Frideric Handel": ["乔治·弗里德里希·亨德尔", "Georg Frideric Handel"],
  "François Couperin": ["弗朗索瓦·库普兰", "François Couperin"],
  "Jeremiah Clarke": ["杰里迈亚·克拉克", "Jeremiah Clarke"],
  "C. P. E. Bach": ["卡尔·菲利普·埃马努埃尔·巴赫", "Carl Philipp Emanuel Bach"],
  "J. C. Bach": ["约翰·克里斯蒂安·巴赫", "Johann Christian Bach"],
  "Carl Stamitz": ["卡尔·施塔米茨", "Carl Stamitz"],
  "Gluck": ["克里斯托夫·维利巴尔德·格鲁克", "Christoph Willibald Gluck"],
  "Haydn": ["约瑟夫·海顿", "Joseph Haydn"],
  "Mozart": ["沃尔夫冈·阿马德乌斯·莫扎特", "Wolfgang Amadeus Mozart"],
  "Beethoven": ["路德维希·凡·贝多芬", "Ludwig van Beethoven"],
  "Schubert": ["弗朗茨·舒伯特", "Franz Schubert"],
  "Schumann": ["罗伯特·舒曼", "Robert Schumann"],
  "Mendelssohn": ["费利克斯·门德尔松", "Felix Mendelssohn"],
  "Berlioz": ["埃克托尔·柏辽兹", "Hector Berlioz"],
  "Brahms": ["约翰内斯·布拉姆斯", "Johannes Brahms"],
  "Tchaikovsky": ["彼得·伊里奇·柴科夫斯基", "Pyotr Ilyich Tchaikovsky"],
  "Dvořák": ["安东宁·德沃夏克", "Antonín Dvořák"],
  "Bruckner": ["安东·布鲁克纳", "Anton Bruckner"],
  "Mahler": ["古斯塔夫·马勒", "Gustav Mahler"],
  "Elgar": ["爱德华·埃尔加", "Edward Elgar"],
  "Rachmaninoff": ["谢尔盖·拉赫玛尼诺夫", "Sergei Rachmaninoff"],
  "Liszt": ["弗朗茨·李斯特", "Franz Liszt"],
  "Smetana": ["贝德日赫·斯美塔那", "Bedřich Smetana"],
  "R. Strauss": ["理查·施特劳斯", "Richard Strauss"],
  "Schoenberg": ["阿诺德·勋伯格", "Arnold Schoenberg"],
  "Rossini": ["焦阿基诺·罗西尼", "Gioachino Rossini"],
  "Verdi": ["朱塞佩·威尔第", "Giuseppe Verdi"],
  "Wagner": ["理查德·瓦格纳", "Richard Wagner"],
  "Puccini": ["贾科莫·普契尼", "Giacomo Puccini"],
  "Debussy": ["克洛德·德彪西", "Claude Debussy"],
  "Scriabin": ["亚历山大·斯克里亚宾", "Alexander Scriabin"],
  "Ravel": ["莫里斯·拉威尔", "Maurice Ravel"],
  "Sibelius": ["让·西贝柳斯", "Jean Sibelius"],
  "Falla": ["曼努埃尔·德·法雅", "Manuel de Falla"],
  "Stravinsky": ["伊戈尔·斯特拉文斯基", "Igor Stravinsky"],
  "Janáček": ["莱奥什·雅纳切克", "Leoš Janáček"],
  "Prokofiev": ["谢尔盖·普罗科菲耶夫", "Sergei Prokofiev"],
  "Poulenc": ["弗朗西斯·普朗克", "Francis Poulenc"],
  "Honegger": ["阿图尔·奥涅格", "Arthur Honegger"],
  "Bartók": ["贝拉·巴托克", "Béla Bartók"],
  "Berg": ["阿尔班·贝尔格", "Alban Berg"],
  "Britten": ["本杰明·布里顿", "Benjamin Britten"],
  "Webern": ["安东·韦伯恩", "Anton Webern"],
  "Ives": ["查尔斯·艾夫斯", "Charles Ives"],
  "Shostakovich": ["德米特里·肖斯塔科维奇", "Dmitri Shostakovich"],
  "Messiaen": ["奥利维埃·梅西安", "Olivier Messiaen"],
  "Boulez": ["皮埃尔·布列兹", "Pierre Boulez"],
  "Ligeti": ["捷尔吉·利盖蒂", "György Ligeti"],
  "John Adams": ["约翰·亚当斯", "John Adams"],
  "Crumb": ["乔治·克拉姆", "George Crumb"],
  "Barber": ["塞缪尔·巴伯", "Samuel Barber"],
  "Cage": ["约翰·凯奇", "John Cage"],
  "Reich": ["史蒂夫·赖希", "Steve Reich"],
  "Dutilleux": ["亨利·迪蒂耶", "Henri Dutilleux"],
  "Penderecki": ["克日什托夫·潘德列茨基", "Krzysztof Penderecki"],
  "Rzewski": ["弗雷德里克·热夫斯基", "Frederic Rzewski"],
  "Takemitsu": ["武满彻", "Tōru Takemitsu"],
  "Lutosławski": ["维托尔德·卢托斯瓦夫斯基", "Witold Lutosławski"],
};

const notes = {
  1: {
    zh: ["约15–16世纪", "《天使弥撒》第八套常规经文圣咏中的《垂怜经》。不伴奏的单声部反复唱出希腊语祈求，适合辨认圣咏的自由节奏与一字多音。"],
    en: ["c. 15th–16th century", "The Kyrie of Mass VIII in the Gregorian Kyriale is an unaccompanied chant. Its repeated Greek petitions are a useful example of flexible chant rhythm and several notes sung to one syllable."],
    source: "https://en.wikipedia.org/wiki/Missa_de_Angelis",
  },
  2: {
    zh: ["中世纪，确年不详", "罗马礼亡者弥撒的进堂咏，为亡者祈求永恒安息。单声部拉丁圣咏直接依循语句展开，也为后世多种《安魂曲》提供了开篇经文。"],
    en: ["Medieval, exact year unknown", "This Latin plainchant opens the Roman Mass for the Dead with a prayer for eternal rest. Its text also opens many later composed requiems."],
    source: "https://en.wikipedia.org/wiki/Requiem",
  },
  3: {
    zh: ["至迟13世纪", "传统亡者弥撒的拉丁继叙咏，以押韵诗句描写末日审判。单声部旋律后来成为死亡的音乐符号，例如柏辽兹在《幻想交响曲》中引用它。"],
    en: ["By the 13th century", "This Latin sequence pictures the Last Judgment in rhyming verse. Its plainchant melody became a musical emblem of death, quoted by Berlioz in Symphonie fantastique."],
    source: "https://en.wikipedia.org/wiki/Dies_irae",
  },
  4: {
    zh: ["约13世纪中叶", "雷丁修道院相关手稿保存的中古英语轮唱，歌咏夏日。四声部依次进入，下方两个声部反复唱固定音型，是早期多声部轮唱的重要实例。"],
    en: ["Mid-13th century", "Preserved in a manuscript associated with Reading Abbey, this Middle English round celebrates summer. Four voices enter in turn over a repeating two-voice bass, an important early example of a polyphonic round."],
    source: "https://en.wikipedia.org/wiki/Sumer_Is_Icumen_In",
  },
  5: {
    zh: ["约1360年代", "四声部复调弥撒，伴随兰斯的礼拜传统。《垂怜经》以圣咏作定旋律，是同一作曲家创作现存完整复调弥撒套曲的早期范例。"],
    en: ["c. 1360s", "This four-voice Mass is associated with worship at Reims. Its Kyrie builds on a chant tenor, and the cycle is an early surviving complete polyphonic Mass by one composer."],
    source: "https://en.wikipedia.org/wiki/Messe_de_Nostre_Dame",
  },
  6: {
    zh: ["约1515年", "为弥撒常规经文而写的四声部复调。各声部依次模仿圣体赞歌《Pange lingua》的片段，是若斯坎晚期释义弥撒的代表。"],
    en: ["c. 1515", "This four-voice Mass for the Ordinary reworks fragments of the Eucharistic hymn Pange lingua across the voices. It exemplifies Josquin’s late treatment of chant in a paraphrase Mass."],
    source: "https://en.wikipedia.org/wiki/Missa_Pange_lingua",
  },
  7: {
    zh: ["创作确年不详", "六声部拉丁经文歌，文本用于圣母升天节。此选段是经文歌；同名弥撒是另一部作品。可听声部如何接续宣告「玛利亚被接升天」。"],
    en: ["Exact composition year unknown", "This six-voice Latin motet sets a text for the Assumption of Mary. Palestrina’s Mass with the same title is a separate work. Listen for how the voices pass the proclamation of Mary’s assumption between them."],
    source: "https://imslp.org/wiki/Assumpta_est_Maria_(Palestrina,_Giovanni_Pierluigi_da)",
  },
  8: {
    zh: ["约1570年", "为八组各五声部写成的四十声部拉丁经文歌。模仿依次越过合唱组，再汇成全体齐鸣；具体委约场合尚无定论。"],
    en: ["c. 1570", "This Latin motet for eight five-voice choirs passes imitation from group to group before the full forty parts converge. The original occasion is uncertain."],
    source: "https://en.wikipedia.org/wiki/Spem_in_alium",
  },
  9: {
    zh: ["1595年出版", "五声部英语芭蕾歌曲（ballett），从意大利歌曲传统发展而来。整齐的舞步节奏和反复的「fa-la-la」衬词构成了它明快的性格。"],
    en: ["Published 1595", "This five-part English ballett draws on an Italian song model. Its regular dance rhythms and repeated “fa-la-la” refrains are hallmarks of the genre."],
    source: "https://en.wikipedia.org/wiki/Now_Is_the_Month_of_Maying",
  },
  10: {
    zh: ["1597年出版", "收入《第一歌曲集》的英语鲁特琴歌，可用独唱配鲁特琴或多声部演唱。不安的歌词配上轻快的加亚尔德舞曲节奏，形成鲜明反差。"],
    en: ["Published 1597", "Published in the First Booke of Songes, this English lute song can be sung solo with lute or in parts. An agile galliard rhythm plays against the speaker’s troubled words."],
    source: "https://en.wikipedia.org/wiki/Can_She_Excuse_My_Wrongs",
  },
  11: {
    zh: ["1580年已有记载", "伊丽莎白时代流传的英国歌谣，词曲归属无定论。鲜明的旋律及反复的和声框架衍生出许多变奏，也曾被填作《What Child Is This?》。"],
    en: ["Documented in 1580", "This Elizabethan ballad has no securely known author. Its distinctive tune and recurring harmonic pattern prompted many variations and were later used for “What Child Is This?”"],
    source: "https://en.wikipedia.org/wiki/Greensleeves",
  },
  12: {
    zh: ["1607年", "为曼图亚宫廷演出而作的早期歌剧。开头的铜管托卡塔是宫廷式号角，随后转入序幕；全剧以独唱、合唱与丰富的器乐描绘俄耳甫斯神话。"],
    en: ["1607", "Composed for the Mantuan court, this early opera begins with a ceremonial brass toccata before the prologue. Solo voices, chorus and varied instruments tell the Orpheus myth."],
    source: "https://en.wikipedia.org/wiki/L%27Orfeo",
  },
  13: {
    zh: ["约1718–1723年，1725年出版", "《四季》第一首，为小提琴、弦乐和通奏低音而作。协奏曲把鸟鸣、溪流和牧人舞蹈写进音乐，是巴洛克标题音乐的名例。"],
    en: ["c. 1718–1723, published 1725", "The first of The Four Seasons is for solo violin, strings and continuo. Birdsong, running water and a pastoral dance make it a vivid instance of Baroque program music."],
    source: "https://en.wikipedia.org/wiki/The_Four_Seasons_(Vivaldi)",
  },
  14: {
    zh: ["约1718–1723年，1725年出版", "《四季》第二首，小提琴与弦乐从闷热的静止写到暴风雨。终乐章急速的同音反复把雷雨变成可以辨认的音乐形象。"],
    en: ["c. 1718–1723, published 1725", "The second concerto of The Four Seasons takes solo violin and strings from oppressive heat to a storm. Rapid repeated notes turn the thunderstorm into a recognizable musical image."],
    source: "https://en.wikipedia.org/wiki/The_Four_Seasons_(Vivaldi)",
  },
  15: {
    zh: ["约1718–1723年，1725年出版", "《四季》第三首为独奏小提琴、弦乐和通奏低音所作，从丰收庆典和醉眠写到狩猎。节拍的摇晃与终乐章的号角式音型很醒耳。"],
    en: ["c. 1718–1723, published 1725", "The third concerto of The Four Seasons depicts a harvest feast, drunken sleep and a hunt. Lurching rhythms and horn-like figures color the writing for violin, strings and continuo."],
    source: "https://en.wikipedia.org/wiki/The_Four_Seasons_(Vivaldi)",
  },
  16: {
    zh: ["约1718–1723年，1725年出版", "《四季》第四首，独奏小提琴与弦乐描写寒风、炉边避雨和冰上滑行。短促重复音与舒展的慢板让画面形成强烈对比。"],
    en: ["c. 1718–1723, published 1725", "The last concerto of The Four Seasons paints icy winds, a fireside respite and slips on the ice. Short repeated notes and the flowing slow movement contrast vividly."],
    source: "https://en.wikipedia.org/wiki/The_Four_Seasons_(Vivaldi)",
  },
  17: {
    zh: ["约1715年", "可能为威尼斯慈善院的礼仪音乐所作，将弥撒《荣耀经》分成多个段落。女高音、女低音独唱与合唱、乐队交替，开头的八度跳进很有辨识度。"],
    en: ["c. 1715", "Probably written in the orbit of Venice’s Pietà, this sacred work divides the Gloria into contrasting movements. Soprano and alto soloists alternate with chorus and orchestra, and octave leaps announce the opening."],
    source: "https://en.wikipedia.org/wiki/Gloria_(Vivaldi)",
  },
  18: {
    zh: ["1711年出版", "《和谐的灵感》Op. 3 第六首，为小提琴、弦乐和通奏低音而作。独奏与全奏轮替构成鲜明的回归段结构；巴赫还将它改编为管风琴协奏曲。"],
    en: ["Published 1711", "No. 6 of L’estro armonico is for violin, strings and continuo. Solo and tutti passages articulate the ritornello form, and Bach later transcribed it as an organ concerto."],
    source: "https://en.wikipedia.org/wiki/L%27estro_armonico",
  },
  19: {
    zh: ["1721年汇编呈献", "呈献给勃兰登堡侯爵的六首协奏曲之一。第一乐章让高音小号、竖笛、双簧管和小提琴成为独奏组，和弦乐及通奏低音交织。"],
    en: ["Presented in 1721", "One of six concertos presented to the Margrave of Brandenburg. In the first movement the high trumpet, recorder, oboe and violin form an unusually varied solo group against strings and continuo."],
    source: "https://www.bachvereniging.nl/en/bwv/bwv-1047",
  },
  20: {
    zh: ["1723年初版，约1733年修订", "为莱比锡节日晚祷而写的拉丁《尊主颂》。通行的D大调版为五声部合唱、独唱及乐队；原清单的「六声部」与总谱不符。"],
    en: ["First version 1723, revised c. 1733", "This Latin Magnificat was written for festal Vespers in Leipzig. The familiar D-major version calls for five-part choir, solo voices and orchestra. The score specifies five vocal parts."],
    source: "https://www.bachvereniging.nl/en/bwv/bwv-243",
  },
  21: {
    zh: ["约1731年", "第三管弦乐组曲的第二乐章《咏叹调》仅用弦乐与通奏低音。第一小提琴的长线条浮于行走的低音之上，后来衍生出「G弦上的咏叹调」改编。"],
    en: ["c. 1731", "The Air of Bach’s Third Orchestral Suite uses strings and continuo. A sustained first-violin melody floats over a walking bass and later inspired the arrangement known as Air on the G String."],
    source: "https://en.wikipedia.org/wiki/Orchestral_suites_(Bach)",
  },
  22: {
    zh: ["约1706–1713年", "管风琴帕萨卡利亚先让固定低音反复出现，上方织体不断变化，再把低音前半段变为赋格主题。它展示了巴赫如何把变奏和对位连为一体。"],
    en: ["c. 1706–1713", "In this organ work a recurring bass supports increasingly varied textures. Its first half becomes the fugue subject, connecting the variation form and the counterpoint."],
    source: "https://www.bachvereniging.nl/en/bwv/bwv-582",
  },
  23: {
    zh: ["确年与作者归属有争议", "传统归于巴赫的管风琴曲，现存早期抄本未注明创作日期。开头自由而戏剧性的托卡塔引出赋格；后来的管弦乐改编使它广为人知。"],
    en: ["Date and authorship disputed", "Traditionally attributed to Bach, this organ piece survives in an early copy without a composition date. A theatrical free toccata leads into a fugue, and later orchestral arrangements popularized it."],
    source: "https://www.bachvereniging.nl/en/bwv/bwv-565",
  },
  24: {
    zh: ["1723年莱比锡版", "为圣母访亲节改写的清唱剧 BWV 147 终曲。四声部圣咏上方是流动的器乐三连音，而后世常以《耶稣，人们仰望的喜悦》独立演奏。"],
    en: ["Leipzig version, 1723", "The closing chorale of the cantata revised for the Visitation sets a four-part hymn against flowing instrumental triplets. It often appears separately as Jesu, Joy of Man’s Desiring."],
    source: "https://www.bachvereniging.nl/en/bwv/bwv-147",
  },
  25: {
    zh: ["约1740年代，1751年出版", "《赋格的艺术》探究同一主题的对位可能，第七首把主题用加倍和缩短的时值叠在一起。原谱以各声部独立书写，具体演奏编制未定。"],
    en: ["c. 1740s, published 1751", "The Art of Fugue explores a single theme’s contrapuntal possibilities. Contrapunctus 7 combines longer and shorter note values of that theme, and the open score leaves instrumentation unspecified."],
    source: "https://en.wikipedia.org/wiki/The_Art_of_Fugue",
  },
  26: {
    zh: ["约1717–1723年", "为独奏小提琴、弦乐与通奏低音写的协奏曲，以意大利式快慢快组织。首乐章全奏的音型与独奏交替，慢乐章则让旋律在重复低音上延展。"],
    en: ["c. 1717–1723", "This violin concerto with strings and continuo follows the Italian fast–slow–fast design. Tutti and solo alternate in the opener, while the slow movement sustains a melody over repeating bass."],
    source: "https://en.wikipedia.org/wiki/Violin_Concerto_in_E_major_(Bach)",
  },
  27: {
    zh: ["约1730年", "两把独奏小提琴与弦乐、通奏低音组成对话。慢乐章尤具代表性，两个独奏声部轮流接过旋律，在交错模仿中保持各自的线条。"],
    en: ["c. 1730", "Two solo violins converse over strings and continuo. In the slow movement the soloists pass the melody between them and weave independent, imitative lines together."],
    source: "https://en.wikipedia.org/wiki/Double_Violin_Concerto_(Bach)",
  },
  28: {
    zh: ["1727年首演，后修订", "莱比锡受难日礼拜用的《马太受难曲》开场。两组唱诗班和乐队彼此问答，上方加入圣咏旋律，让哀悼和宗教默想同时展开。"],
    en: ["Premiered 1727, later revised", "The opening of Bach’s Good Friday Passion for Leipzig sets two choirs and orchestras in dialogue. A chorale melody above them adds a separate voice of devotion to the lament."],
    source: "https://www.bachvereniging.nl/en/bwv/bwv-244",
  },
  29: {
    zh: ["1727年首演，后修订", "《马太受难曲》在基督安葬场景后的终曲。双合唱与乐队反复呼唤「安息」，平稳的摇曳节奏将叙事收束为哀悼。"],
    en: ["Premiered 1727, later revised", "The final chorus of the St Matthew Passion follows Christ’s burial. Double choir and orchestra repeat a call to rest, drawing the narrative to a close in a rocking lament."],
    source: "https://www.bachvereniging.nl/en/bwv/bwv-244",
  },
  30: {
    zh: ["约1742年汇编", "《平均律键盘曲集》第二册降E大调前奏曲与赋格，为键盘教学和演奏而写。前奏曲的流动与赋格各声部轮流呈示主题形成对照。"],
    en: ["Compiled c. 1742", "This E-flat prelude and fugue from Book II was collected for keyboard study and performance. The flowing prelude leads to a fugue in which the voices successively introduce the subject."],
    source: "https://en.wikipedia.org/wiki/The_Well-Tempered_Clavier",
  },
  31: {
    zh: ["1741年", "英语神剧《弥赛亚》第一部分的合唱，把《以赛亚书》的诞生预言变为轻快的多声部歌唱。旋转的花腔与整齐喊出的称号交替出现。"],
    en: ["1741", "This Part I chorus of Messiah sets Isaiah’s prophecy of the birth. In the English oratorio’s choral and orchestral texture, agile runs alternate with emphatic, collective acclamations."],
    source: "https://en.wikipedia.org/wiki/Messiah_(Handel)",
  },
  32: {
    zh: ["1741年", "《弥赛亚》第二部分终曲，以合唱、乐队及小号和定音鼓唱出《启示录》的经文。齐唱式宣告、对位展开和高声部持续推进共同塑造庆典效果。"],
    en: ["1741", "The close of Part II sets verses from Revelation for choir and orchestra with trumpets and timpani. Homophonic acclamations and contrapuntal entries combine to create the celebratory climax."],
    source: "https://en.wikipedia.org/wiki/Messiah_(Handel)",
  },
  33: {
    zh: ["1749年", "乔治二世委约，为伦敦庆祝《亚琛和约》的烟火盛典而作。序曲由法国式附点节奏转入快速段，原庆典编制突出大型管乐与鼓。"],
    en: ["1749", "Commissioned by George II for London’s fireworks celebrating the Treaty of Aix-la-Chapelle, this overture pairs French dotted grandeur with fast music. The outdoor version emphasized massed winds and drums."],
    source: "https://en.wikipedia.org/wiki/Music_for_the_Royal_Fireworks",
  },
  34: {
    zh: ["1749年", "《皇家烟火音乐》的《欢庆》原为露天盛典写作。短小的乐章以小号、圆号等管乐的强音和鼓的节奏，突出公开庆祝的气氛。"],
    en: ["1749", "La Réjouissance from the Royal Fireworks Music was written for an outdoor celebration. The compact movement uses bright brass and percussion for a public, festive effect."],
    source: "https://en.wikipedia.org/wiki/Music_for_the_Royal_Fireworks",
  },
  35: {
    zh: ["1738年首演", "歌剧《塞尔斯》开场唱段，君王赞叹树荫。为高音角色与弦乐伴奏写成的舒展旋律，后来常单独演出，亦称「亨德尔的广板」。"],
    en: ["Premiered 1738", "At the opening of Serse, the king praises the shade of a plane tree. This spacious aria for a high voice with strings became a recital favorite often called Handel’s Largo."],
    source: "https://en.wikipedia.org/wiki/Ombra_mai_fu",
  },
  36: {
    zh: ["1717年演出", "为乔治一世泰晤士河游船盛事演出的管弦乐套曲之一。D大调《号笛舞曲》让铜管号角与弦乐交替，以有力的节奏适应户外场合。"],
    en: ["Performed 1717", "Part of the orchestral music performed for George I’s Thames excursion. The D-major Hornpipe exchanges brass calls and string responses in a strongly marked outdoor dance."],
    source: "https://en.wikipedia.org/wiki/Water_Music_(Handel)",
  },
  37: {
    zh: ["1746年原作，约1751年移入此剧", "这段庆祝英雄凯旋的合唱原为《约书亚》而写，后来加入《犹大·马加比》。独唱组到合唱全体的递进，使旋律广为流传。"],
    en: ["Oratorio 1746, chorus added c. 1751", "Originally composed for Joshua and later added to Judas Maccabaeus, this chorus celebrates a returning hero. Its tune grows from smaller vocal groups to chorus and orchestra and circulated widely."],
    source: "https://en.wikipedia.org/wiki/Judas_Maccabaeus_(Handel)",
  },
  38: {
    zh: ["1727年", "为乔治二世加冕而作的圣歌，沿用所罗门受膏的经文。弦乐长时间累积张力，合唱和铜管突然进入，后来成为英国加冕礼惯例。"],
    en: ["1727", "Written for George II’s coronation, this anthem sets the anointing of Solomon. A long orchestral buildup releases into a sudden entry of choir and brass, a tradition at subsequent British coronations."],
    source: "https://en.wikipedia.org/wiki/Zadok_the_Priest",
  },
  39: {
    zh: ["1713–1730年分册出版", "四册羽管键琴曲依「组曲」编排，兼有舞曲和人物、场景小品。法国式装饰音与节奏细节是辨认关键，原清单未指定册数或单曲。"],
    en: ["Published 1713–1730", "Four books of harpsichord pieces arrange dances and character portraits into ordres. French ornamentation and rhythm are central to the style. The source list does not specify a book or selection."],
    source: "https://imslp.org/wiki/Pi%C3%A8ces_de_clavecin_(Couperin,_Fran%C3%A7ois)",
  },
  40: {
    zh: ["约1700年", "原为键盘出版的英国进行曲，后来常改编为小号和管风琴，成为典礼常用曲。清晰的号角式旋律使这种改编十分自然。"],
    en: ["c. 1700", "This English march was published for keyboard, then widely arranged for trumpet and organ and used at ceremonies. Its clearly articulated, fanfare-like melody suits that adaptation."],
    source: "https://en.wikipedia.org/wiki/Prince_of_Denmark%27s_March",
  },
  41: {
    zh: ["1771年", "为羽管键琴和乐队写成，收入六首键盘协奏曲 Wq. 43。首乐章快速段之间插入较缓的段落，体现作曲家用速度和情绪突变组织音乐的手法。"],
    en: ["1771", "Written for harpsichord and orchestra, this concerto belongs to the set Wq. 43. A slower episode interrupts the first movement’s fast music, illustrating the composer’s abrupt shifts of pace and mood."],
    source: "https://imslp.org/wiki/Harpsichord_Concerto_in_D_major,_H.472_(Bach,_Carl_Philipp_Emanuel)",
  },
  42: {
    zh: ["约1770年出版", "旅居伦敦期间出版的六首交响曲之一，为弦乐和成对的管乐所作。G小调终曲短促急切，是早期古典交响曲少见的小调实例。"],
    en: ["Published c. 1770", "One of six symphonies issued during Bach’s London years, scored for strings and pairs of winds. Its taut G-minor finale is an example of minor-mode writing in the early Classical symphony."],
    source: "https://imslp.org/wiki/6_Symphonies%2C_Op.6_(Bach%2C_Johann_Christian)",
  },
  43: {
    zh: ["1774年或更早", "1774年已出版的中提琴协奏曲，为独奏中提琴和乐队而作。首乐章全奏后独奏接过主题，在宽广中音区与灵活的快速音群之间转换。"],
    en: ["1774 or earlier", "Published in 1774, this concerto pairs solo viola with orchestra. The first-movement soloist takes up the music after the tutti, moving between a resonant middle register and agile passagework."],
    source: "https://imslp.org/wiki/Viola_Concerto_in_D_major,_Op.1_(Stamitz,_Carl_Philipp)",
  },
  44: {
    zh: ["1762年维也纳首演", "歌剧《奥菲欧与尤丽狄茜》中，奥菲欧痛悼再次失去爱人。原版为高音男声主角与乐队而作，简洁反复的旋律展现格鲁克以戏剧表达为核心的歌剧改革。"],
    en: ["Vienna premiere, 1762", "Orpheus laments losing Eurydice again in Gluck’s opera. The simple recurring melody for the high-voiced lead and orchestra exemplifies Gluck’s effort to put dramatic expression at the center of opera."],
    source: "https://en.wikipedia.org/wiki/Orfeo_ed_Euridice",
  },
  45: {
    zh: ["1785年", "海顿为巴黎音乐会写的交响曲之一。弦乐与管乐奏出紧张的G小调开场，随后第二主题中双簧管的啄动音型引出「母鸡」外号。"],
    en: ["1785", "One of Haydn’s Paris symphonies, scored for strings and winds. Its tense G-minor opening gives way to the pecking oboe figure in the second theme that inspired the nickname “The Hen.”"],
    source: "https://en.wikipedia.org/wiki/Symphony_No._83_(Haydn)",
  },
  46: {
    zh: ["1795年", "第二次伦敦之旅写成的最后一首交响曲。终乐章在弦乐持续低音之上唱出民歌般主题，将乡村音响放进大型古典交响乐队。"],
    en: ["1795", "Haydn’s final symphony was written during his second London visit. A folk-like melody over a string drone opens the finale and brings a rustic sound into the Classical orchestra."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._104_(Haydn)",
  },
  47: {
    zh: ["1793–1794年", "为伦敦音乐会写作的《军队》交响曲，第二乐章引入三角铁、钹和大鼓等当时称为「土耳其式」的打击乐，温和的开头逐渐变成军乐。"],
    en: ["1793–1794", "Written for Haydn’s London concerts, the Military Symphony adds triangle, cymbals and bass drum to its second movement. The then fashionable “Turkish” percussion transforms a gentle opening into a military scene."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._100_(Haydn)",
  },
  48: {
    zh: ["1781年", "献给俄国大公保罗的六首弦乐四重奏之一，为两把小提琴、中提琴与大提琴而写。急速终曲的轻巧断句和相互接话，体现海顿的室内乐幽默。"],
    en: ["1781", "One of the Op. 33 quartets dedicated to Grand Duke Paul of Russia, scored for two violins, viola and cello. The brisk finale’s clipped phrases and exchanges capture Haydn’s chamber-music wit."],
    source: "https://en.wikipedia.org/wiki/String_Quartets,_Op._33_(Haydn)",
  },
  49: {
    zh: ["1797–1798年", "神剧《创世纪》开篇为纯管弦乐的《混沌的描绘》。海顿延迟清晰的调性落点，用不稳定的和声表现秩序尚未形成的世界。"],
    en: ["1797–1798", "The Creation opens with an orchestral depiction of chaos. Haydn delays a clear tonal resolution, making unsettled harmony stand for a world before order."],
    source: "https://en.wikipedia.org/wiki/The_Creation_(Haydn)",
  },
  50: {
    zh: ["1783年", "为独奏大提琴与乐队写作。第一乐章以抒情主题引出高把位和快速音群，充分展示大提琴在高音区也能像歌者一样展开旋律。"],
    en: ["1783", "Written for solo cello and orchestra. In the first movement a lyrical theme leads into high-register and agile passagework, highlighting the cello’s ability to sing in its upper range."],
    source: "https://en.wikipedia.org/wiki/Cello_Concerto_No._2_(Haydn)",
  },
  51: {
    zh: ["1796年", "为安东·魏丁格的键孔小号而作，展示旧式自然小号难以奏出的半音。第三乐章的回旋主题与灵活的半音经过句使它成为小号保留曲目。"],
    en: ["1796", "Written for Anton Weidinger’s keyed trumpet, the concerto exploits chromatic notes difficult on the natural trumpet. The finale’s recurring tune and agile chromatic runs helped make it a repertory staple."],
    source: "https://en.wikipedia.org/wiki/Trumpet_Concerto_(Haydn)",
  },
  52: {
    zh: ["1794年", "在伦敦为特蕾泽·扬森写的晚期钢琴奏鸣曲之一。终乐章的快速重复音、急转和弦与重音错置，兼具演奏挑战和诙谐的意外感。"],
    en: ["1794", "This late piano sonata was written in London for Therese Jansen. The finale’s rapid repeated notes, quick harmonic turns and displaced accents combine virtuosity with surprise."],
    source: "https://en.wikipedia.org/wiki/Piano_Sonata_No._62_(Haydn)",
  },
  53: {
    zh: ["1773年", "莫扎特在萨尔茨堡写的小调交响曲，全曲用四支圆号。第一乐章切分音和急促弦乐制造不安，是所谓「狂飙突进」风格的重要听辨线索。"],
    en: ["1773", "Written in Salzburg, this minor-key symphony uses four horns. The first movement’s syncopations and urgent strings are characteristic of the style often called Sturm und Drang."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._25_(Mozart)",
  },
  54: {
    zh: ["1786年", "次年在布拉格首演的三乐章交响曲。第一乐章由戏剧性的慢引子进入快板，木管和弦乐以活跃的对位共同发展音乐。"],
    en: ["1786", "Premiered in Prague the following year, this three-movement symphony opens with a theatrical slow introduction. Winds and strings then develop the Allegro through active counterpoint."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._38_(Mozart)",
  },
  55: {
    zh: ["1788年", "莫扎特最后三首交响曲之一，有带和不带单簧管的两种配器。第一乐章摇动的中提琴伴奏和略带叹息的主题，营造持续的不安。"],
    en: ["1788", "One of Mozart’s last three symphonies, with versions both with and without clarinets. The first movement’s restless viola accompaniment and sighing theme sustain its sense of unease."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._40_(Mozart)",
  },
  56: {
    zh: ["1788年", "莫扎特最后一首交响曲，后来被称为《朱庇特》。终乐章让几个动机在古典奏鸣曲框架中彼此叠合，结尾五个动机同时出现。"],
    en: ["1788", "Mozart’s last symphony later acquired the nickname Jupiter. Its finale combines contrapuntal ideas within sonata form, bringing five motifs together in the coda."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._41_(Mozart)",
  },
  57: {
    zh: ["1791年未完，1792年补全", "受匿名委托写的安魂弥撒，莫扎特去世后由叙斯迈尔补全通行版。《震怒之日》以合唱和乐队的急促齐奏描绘末日审判。"],
    en: ["Begun 1791, completed 1792", "Commissioned anonymously, Mozart’s Requiem was unfinished at his death. In the familiar completion by Süssmayr, the Dies irae uses urgent choral and orchestral gestures to picture the Last Judgment."],
    source: "https://en.wikipedia.org/wiki/Requiem_(Mozart)",
  },
  58: {
    zh: ["1786年", "喜歌剧《费加罗的婚礼》第二幕，少年侍从凯鲁比诺询问何谓爱情。通常由女中音饰演，乐队模仿拨弦伴奏，衬出角色的羞怯。"],
    en: ["1786", "In Act II of The Marriage of Figaro, the young page Cherubino asks what love is. Usually sung by a mezzo-soprano, the aria’s orchestral accompaniment suggests a plucked instrument."],
    source: "https://en.wikipedia.org/wiki/The_Marriage_of_Figaro",
  },
  59: {
    zh: ["1791年", "德语歌唱剧《魔笛》中夜后命女儿复仇的咏叹调。花腔女高音跃至高音F，尖锐的音区和短促节奏把愤怒变成舞台行动。"],
    en: ["1791", "In The Magic Flute the Queen of the Night orders her daughter to take revenge. Her coloratura reaches high F, and the extreme register and clipped rhythms give the threat theatrical force."],
    source: "https://en.wikipedia.org/wiki/The_Magic_Flute",
  },
  60: {
    zh: ["1791年", "《魔笛》的管弦乐序曲，以庄严和弦引出快速模仿段落。庄重仪式音响与喜剧般的活力并存，为德语歌唱剧的两种气质开场。"],
    en: ["1791", "The orchestral overture to The Magic Flute opens with ceremonial chords before a quick imitative section. Its mix of ritual grandeur and comic energy sets up the German Singspiel."],
    source: "https://en.wikipedia.org/wiki/The_Magic_Flute",
  },
  61: {
    zh: ["1787年", "《唐·乔万尼》第一幕的二重唱，男主角试图诱惑采琳娜。男中音与女声由一句一答转为合唱，同步的曲调刻画她逐渐被说服的过程。"],
    en: ["1787", "In this Act I duet from Don Giovanni, the title character tries to seduce Zerlina. The two voices move from alternating phrases to singing together, tracing her gradual persuasion."],
    source: "https://en.wikipedia.org/wiki/Don_Giovanni",
  },
  62: {
    zh: ["1786年", "喜歌剧《费加罗的婚礼》的管弦乐序曲，弦乐以轻声急跑开场，木管接力推高速度感。它为整部戏的忙乱和机智定下基调。"],
    en: ["1786", "The orchestral overture to The Marriage of Figaro begins with hushed, scurrying strings and lively wind exchanges. Its momentum sets the tone for the opera’s quick-witted confusion."],
    source: "https://en.wikipedia.org/wiki/The_Marriage_of_Figaro",
  },
  63: {
    zh: ["1785年", "为维也纳演出写的钢琴协奏曲，首演由莫扎特独奏。第一乐章切分弦乐和小调张力使它与许多同类作品气质不同，贝多芬还为它写过华彩。"],
    en: ["1785", "Mozart premiered this D-minor piano concerto in Vienna as soloist. Syncopated strings and minor-key tension mark the first movement. Beethoven later wrote cadenzas for the work."],
    source: "https://en.wikipedia.org/wiki/Piano_Concerto_No._20_(Mozart)",
  },
  64: {
    zh: ["1785年", "为维也纳音乐会写的钢琴协奏曲。第二乐章以加弱音器的弦乐和轻柔三连音衬托宽广旋律，钢琴进入后把歌唱线条继续展开。"],
    en: ["1785", "Written for Mozart’s Vienna concerts, this piano concerto features a slow movement in which muted strings and gentle triplets support a broad melody that the piano carries forward."],
    source: "https://en.wikipedia.org/wiki/Piano_Concerto_No._21_(Mozart)",
  },
  65: {
    zh: ["1775年", "萨尔茨堡时期为小提琴与乐队写的协奏曲。首乐章让明亮的全奏主题与独奏的灵活变形对答，体现年轻莫扎特的古典协奏曲风格。"],
    en: ["1775", "Written in Salzburg for violin and orchestra, the opening movement contrasts bright tutti themes with the soloist’s flexible treatment of them, characteristic of Mozart’s early concerto style."],
    source: "https://en.wikipedia.org/wiki/Violin_Concerto_No._3_(Mozart)",
  },
  66: {
    zh: ["1784年", "献给海顿的六首弦乐四重奏之一，为两把小提琴、中提琴和大提琴而作。开篇六八拍和号角式主题使听众联想到狩猎。"],
    en: ["1784", "One of six string quartets dedicated to Haydn. Its opening 6/8 meter and horn-like theme suggest hunting calls, giving the quartet its later nickname “The Hunt.”"],
    source: "https://en.wikipedia.org/wiki/String_Quartet_No._17_(Mozart)",
  },
  67: {
    zh: ["主要创作于1803–1804年", "大型管弦乐交响曲，1805年公开首演。第一乐章大幅扩大了奏鸣曲的篇幅和冲突，葬礼进行曲把公共哀悼写入交响曲。它拓宽了同代人对交响曲体量与表达的预期，成为后世浪漫派交响写作的重要参照。"],
    en: ["Composed mainly 1803–1804", "Publicly premiered in 1805, Eroica expands sonata form and orchestral drama on an unprecedented scale for Beethoven. Its funeral march adds an act of public mourning. The work widened expectations for what a symphony could express and became a model for later Romantic composers."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._3_(Beethoven)",
  },
  68: {
    zh: ["1808年完成", "五乐章《田园》交响曲，是贝多芬少数明确赋予各乐章标题的交响曲。第一乐章以弦乐、木管和反复动机呈现抵达乡间的愉快感受。"],
    en: ["Completed 1808", "Beethoven gave each movement of this five-movement Pastoral Symphony a title. In the opener, strings, woodwinds and repeated motifs evoke the pleasure of arriving in the countryside."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._6_(Beethoven)",
  },
  69: {
    zh: ["1811–1812年", "为大型乐队写作，1813年于维也纳首演。第二乐章从低弦的持续节奏出发，一层层加入变奏与对位，首演时已获观众要求重演。"],
    en: ["1811–1812", "Premiered in Vienna in 1813, the symphony’s Allegretto builds variations and counterpoint over a persistent low-string rhythm. Audiences requested an encore of the movement at its premiere."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._7_(Beethoven)",
  },
  70: {
    zh: ["1812年", "这首紧凑的管弦乐交响曲以古典比例容纳强烈的错拍和重音游戏。第一乐章一开场就推出主题，发展部让力量在压缩中积累。"],
    en: ["1812", "This compact orchestral symphony places displaced accents and rhythmic jokes within Classical proportions. The first movement gives its theme immediately and builds considerable force in a tightly compressed design."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._8_(Beethoven)",
  },
  71: {
    zh: ["1826年", "晚期弦乐四重奏，七个乐章连续演奏。第一乐章由慢速赋格开始，四件弦乐器依次进入，沉思气质也为整部作品设定基调。"],
    en: ["1826", "A late string quartet in seven connected movements. A slow fugue opens the work as the four instruments enter in succession, setting its meditative tone."],
    source: "https://en.wikipedia.org/wiki/String_Quartet_No._14_(Beethoven)",
  },
  72: {
    zh: ["1825年", "原为降B大调四重奏 Op. 130 的终曲，后以 Op. 133 独立出版。尖锐的复节奏、切分和多重赋格使这首弦乐四重奏作品远超当时习惯，后来被视为对位实验的先声。"],
    en: ["1825", "Originally the finale of Op. 130 and later published separately, the Grosse Fuge pushes string quartet counterpoint through dense fugal writing, syncopation and rhythmic conflict. Its reception changed as later generations heard those experiments afresh."],
    source: "https://en.wikipedia.org/wiki/Gro%C3%9Fe_Fuge",
  },
  73: {
    zh: ["1806年", "俄国外交官拉祖莫夫斯基委约的弦乐四重奏，为两把小提琴、中提琴和大提琴写作。首乐章由大提琴给出宽广主题，扩大了当时四重奏的尺度。"],
    en: ["1806", "Commissioned by Count Razumovsky for two violins, viola and cello. The cello introduces the first movement’s broad theme, a sign of the work’s expanded dimensions for a quartet of its time."],
    source: "https://en.wikipedia.org/wiki/String_Quartets,_Op._59_(Beethoven)",
  },
  74: {
    zh: ["1805–1806年", "为钢琴和乐队写成，贝多芬本人担任独奏。第一乐章由钢琴独自轻声开场，随后乐队从意外的调性回应，重写了协奏曲的开场惯例。"],
    en: ["1805–1806", "Composed for piano and orchestra and performed by Beethoven as soloist. The first movement begins quietly with piano alone, then draws an unexpected harmonic response from the orchestra."],
    source: "https://en.wikipedia.org/wiki/Piano_Concerto_No._4_(Beethoven)",
  },
  75: {
    zh: ["1809年", "献给鲁道夫大公的最后一首钢琴协奏曲，后世称为《皇帝》。开头乐队和弦与钢琴即兴般的华彩交替，给独奏与乐队同等的开场气势。"],
    en: ["1809", "Beethoven’s last piano concerto, dedicated to Archduke Rudolf, later acquired the nickname Emperor. The first movement opens with orchestral chords punctuated by cadenza-like flourishes from the soloist."],
    source: "https://en.wikipedia.org/wiki/Piano_Concerto_No._5_(Beethoven)",
  },
  76: {
    zh: ["1806年", "为小提琴家弗朗茨·克莱门特写的协奏曲。第一乐章由定音鼓重复敲击开始，独奏旋律在大型交响式结构中展开；1844年的演出推动它重回曲目。"],
    en: ["1806", "Written for violinist Franz Clement, the concerto begins with repeated timpani strokes and unfolds on a symphonic scale. A celebrated performance in 1844 helped restore it to the repertoire."],
    source: "https://en.wikipedia.org/wiki/Violin_Concerto_(Beethoven)",
  },
  77: {
    zh: ["1817–1818年", "献给鲁道夫大公的大型独奏钢琴奏鸣曲。首乐章以强劲的和弦号角开场，宽广结构和音域在当时大幅推开了钢琴奏鸣曲的尺度。"],
    en: ["1817–1818", "Dedicated to Archduke Rudolf, this large solo piano sonata opens with a forceful chordal fanfare. The scale and range of its first movement stretched contemporary ideas of the piano sonata."],
    source: "https://imslp.org/wiki/Piano_Sonata_No.29,_Op.106_(Beethoven,_Ludwig_van)",
  },
  78: {
    zh: ["1819–1823年", "为迪亚贝利征集变奏而写的独奏钢琴作品，最终发展成33首变奏。清单选的是开头简短的圆舞曲主题，后续以节奏、性格和对位重新组织素材。"],
    en: ["1819–1823", "Diabelli’s invitation to vary a waltz led to a cycle of 33 solo piano variations. The excerpt is the original waltz theme, later transformed through rhythm, character and counterpoint."],
    source: "https://en.wikipedia.org/wiki/Diabelli_Variations",
  },
  79: {
    zh: ["1819–1823年", "为鲁道夫大公就任总主教而构思的大型弥撒，写给独唱四重唱、合唱和管弦乐队。《垂怜经》在庄严合唱与更亲密的独唱祈祷之间转换。"],
    en: ["1819–1823", "Conceived for Archduke Rudolf’s installation as archbishop, this Mass calls for four soloists, choir and orchestra. Its Kyrie shifts between solemn choral music and more intimate solo prayer."],
    source: "https://en.wikipedia.org/wiki/Missa_solemnis_(Beethoven)",
  },
  80: {
    zh: ["1809–1810年", "为歌德的话剧《艾格蒙特》写的戏剧配乐中的管弦乐序曲。阴沉引子通向明亮的胜利结尾，把牺牲与反抗的叙事压缩成独立音乐会曲。"],
    en: ["1809–1810", "The orchestral overture to Beethoven’s incidental music for Goethe’s Egmont moves from a grave introduction to a triumphant close, distilling the play’s struggle and sacrifice into a concert piece."],
    source: "https://en.wikipedia.org/wiki/Egmont_(Beethoven)",
  },
  81: {
    zh: ["1822年", "舒伯特留下两个完成乐章和谐谑曲草稿，完整部分直到1865年才公演。低弦的阴影与木管歌唱并存，显示浪漫派交响曲如何结合戏剧性和歌曲式旋律。"],
    en: ["1822", "Schubert left two complete orchestral movements and a sketch of a scherzo. First performed in 1865, the surviving music combines shadowy low strings and songlike winds in an early Romantic symphony."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._8_(Schubert)",
  },
  82: {
    zh: ["1824年", "弦乐四重奏取名自第二乐章引用的舒伯特同名歌曲。低声反复的死亡主题变成一组变奏，与其他乐章急剧的节奏形成张力。"],
    en: ["1824", "This string quartet takes its nickname from Schubert’s song quoted in the second movement. The quiet, recurring death theme becomes a set of variations amid the driving rhythms of the other movements."],
    source: "https://en.wikipedia.org/wiki/String_Quartet_No._14_(Schubert)",
  },
  83: {
    zh: ["1819年", "为施泰尔的业余大提琴家西尔韦斯特·鲍姆加特纳而作。钢琴、小提琴、中提琴、大提琴和低音提琴的组合，让第四乐章《鳟鱼》歌曲变奏清晰轻快。"],
    en: ["1819", "Written for amateur cellist Sylvester Paumgartner in Steyr, this quintet combines piano, violin, viola, cello and double bass. A movement of variations on Schubert’s song The Trout gave it its nickname."],
    source: "https://en.wikipedia.org/wiki/Trout_Quintet",
  },
  84: {
    zh: ["1828年", "舒伯特晚期室内乐，为两把小提琴、中提琴和两把大提琴而作。双大提琴扩大低音与音色范围，慢乐章的静谧和中段风暴是典型听辨点。"],
    en: ["1828", "A late chamber work for two violins, viola and two cellos. The extra cello deepens the sonority, while the slow movement’s stillness is interrupted by a turbulent middle section."],
    source: "https://en.wikipedia.org/wiki/String_Quintet_(Schubert)",
  },
  85: {
    zh: ["1815年", "为歌者和钢琴谱写歌德叙事诗。单一歌者切换叙述者、父亲、孩子和魔王四个角色，钢琴急促三连音模仿马蹄，把艺术歌曲变成小型戏剧。"],
    en: ["1815", "This song for voice and piano sets Goethe’s ballad. One singer delivers four characters, while insistent piano triplets suggest hoofbeats and make the Lied a miniature drama."],
    source: "https://en.wikipedia.org/wiki/Erlk%C3%B6nig_(Schubert)",
  },
  86: {
    zh: ["1827年", "为独唱和钢琴写的24首艺术歌曲套曲，以威廉·缪勒诗作描写冬夜旅人。所选三曲从离别到回忆与哀伤，钢琴的步态与风声参与叙事。"],
    en: ["1827", "This twenty-four-song cycle for voice and piano follows a winter wanderer through poems by Wilhelm Müller. In the selected songs, the piano’s footsteps and gusts of wind help tell the story of departure, memory and grief."],
    source: "https://en.wikipedia.org/wiki/Winterreise",
  },
  87: {
    zh: ["1850年", "舒曼到杜塞尔多夫任职后创作的五乐章交响曲。第一乐章错拍热烈，第四乐章低铜管的庄严音色像一场典礼，展现莱茵题材的多重气质。"],
    en: ["1850", "Written after Schumann took up his post in Düsseldorf, this five-movement symphony opens with buoyant cross-rhythms. The fourth movement’s low brass adds a contrasting ceremonial sound."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._3_(Schumann)",
  },
  88: {
    zh: ["1842年", "献给克拉拉·舒曼的钢琴与弦乐四重奏作品，为后世钢琴五重奏确立重要范例。葬礼进行曲和终曲中旧主题回返，赋予室内乐近似交响曲的规模。"],
    en: ["1842", "Dedicated to Clara Schumann, the work pairs piano with string quartet and helped establish the modern piano quintet. A funeral march and the return of earlier material in the finale give it a symphonic span."],
    source: "https://en.wikipedia.org/wiki/Piano_Quintet_(Schumann)",
  },
  89: {
    zh: ["1840年", "舒曼「歌曲之年」以海涅诗歌写成的独唱与钢琴套曲，通行出版版为16首。短歌在憧憬、反讽和失落间切换，钢琴尾声常说出歌声结束后的余意。"],
    en: ["1840", "Written in Schumann’s song year to poems by Heine, the published cycle has sixteen songs for voice and piano. Brief songs turn from hope to irony and grief, often leaving the piano to continue the thought."],
    source: "https://en.wikipedia.org/wiki/Dichterliebe",
  },
  90: {
    zh: ["1833年首演版，1834年修订", "从意大利旅途汲取灵感，为交响乐队写作。首乐章的明亮推进和小调萨尔塔雷洛终曲，将古典交响曲的布局和旅行印象结合。"],
    en: ["1833 premiere version, revised 1834", "Inspired by Mendelssohn’s Italian travels, this symphony pairs a bright, propulsive first movement with a minor-key saltarello finale. Travel impressions animate its Classical orchestral design."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._4_(Mendelssohn)",
  },
  91: {
    zh: ["1844年完成", "为小提琴家费迪南德·大卫写的协奏曲，次年首演。独奏一开始即提出主题，华彩移至再现部之前，三个乐章衔接紧密，影响后来的协奏曲布局。"],
    en: ["Completed 1844", "Written for violinist Ferdinand David and premiered the next year. The soloist enters immediately, the cadenza precedes the recapitulation, and the movements connect closely, shaping later approaches to concerto design."],
    source: "https://en.wikipedia.org/wiki/Violin_Concerto_(Mendelssohn)",
  },
  92: {
    zh: ["1830年", "为大型管弦乐队写的五乐章标题交响曲，表现艺术家幻觉中的爱情与噩梦。反复出现的「固定乐思」随场景变形，结尾引用《震怒之日》，影响后世标题音乐。"],
    en: ["1830", "In this five-movement program symphony, a recurring idée fixe changes with an artist’s hallucinated love and nightmares. The finale quotes Dies irae, and the work helped shape later orchestral program music."],
    source: "https://en.wikipedia.org/wiki/Symphonie_fantastique",
  },
  93: {
    zh: ["1850年代起构思，1876年完成", "布拉姆斯多年写成的首部管弦乐交响曲。由紧张的C小调通向终曲C大调，内嵌圆号呼唤和庄严主题，回应了贝多芬之后如何继续写交响曲的问题。"],
    en: ["Begun in the 1850s, completed 1876", "Brahms took years to complete his first orchestral symphony. Its path from tense C minor to the finale’s C major and horn calls addresses the challenge of writing symphonies after Beethoven."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._1_(Brahms)",
  },
  94: {
    zh: ["1884–1885年", "布拉姆斯最后一首管弦乐交响曲，首乐章由间隔音程生成旋律。终乐章用反复的低音框架写成帕萨卡利亚，将古老变奏形式置于浪漫派交响曲中。"],
    en: ["1884–1885", "In Brahms’s final symphony, interval patterns generate the first movement’s melody. The finale uses a recurring foundation for a passacaglia, placing an old variation form inside a Romantic symphony."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._4_(Brahms)",
  },
  95: {
    zh: ["1878年", "为小提琴家约阿希姆写的协奏曲，独奏小提琴与乐队分量均衡。慢乐章以双簧管长旋律开头，终曲则用带匈牙利舞曲色彩的节奏。"],
    en: ["1878", "Written for violinist Joseph Joachim, this concerto gives the soloist and orchestra substantial roles. An oboe sings the opening of the slow movement, and the finale draws on Hungarian-style dance rhythms."],
    source: "https://en.wikipedia.org/wiki/Violin_Concerto_(Brahms)",
  },
  96: {
    zh: ["1890年", "原拟作为告别创作的室内乐之一，为两把小提琴、两把中提琴和大提琴写成。首乐章大提琴的宽广旋律从密集的弦乐震音里浮现。"],
    en: ["1890", "Written during Brahms’s brief plan to retire, this quintet uses two violins, two violas and cello. The cello’s expansive opening melody rises out of a dense string tremolo."],
    source: "https://en.wikipedia.org/wiki/String_Quintet_No._2_(Brahms)",
  },
  97: {
    zh: ["1877–1878年", "献给资助者梅克夫人的交响曲。铜管「命运」号角贯穿作品，谐谑曲大段拨弦以及借用俄国民歌的终曲，让色彩与节奏格外鲜明。"],
    en: ["1877–1878", "Dedicated to Tchaikovsky’s patron Nadezhda von Meck, the symphony opens with a recurring “fate” fanfare. Pizzicato strings dominate the scherzo, while a Russian folk tune appears in the finale."],
    source: "https://en.tchaikovsky-research.net/pages/Symphony_No._4",
  },
  98: {
    zh: ["1893年", "柴科夫斯基最后一首完成的交响曲，由本人指挥首演。激昂的第三乐章后，弦乐的悲叹慢板让全曲消逝在低音里，倒转了传统交响曲的收束方式。"],
    en: ["1893", "Tchaikovsky conducted the premiere of his last completed symphony. After the energetic march of the third movement, a lamenting slow finale fades into the low strings, reversing a conventional symphonic ending."],
    source: "https://en.tchaikovsky-research.net/pages/Symphony_No._6",
  },
  99: {
    zh: ["1878年", "在瑞士写成的小提琴协奏曲。歌唱性的首乐章与以俄式舞蹈节奏推进的终曲，既突出独奏技巧，也体现柴科夫斯基的旋律写作。"],
    en: ["1878", "This violin concerto was composed in Switzerland. A lyrical opening movement and a finale driven by Russian-style dance rhythms showcase the soloist’s virtuosity and Tchaikovsky’s melodic writing."],
    source: "https://en.tchaikovsky-research.net/pages/Violin_Concerto",
  },
  100: {
    zh: ["1874–1875年，后修订", "钢琴与乐队协奏曲，1875年由汉斯·冯·彪罗在波士顿首演。宽阔引子中钢琴和弦托起弦乐旋律，随后主题让位于不同的主要音乐材料。"],
    en: ["1874–1875, later revised", "Hans von Bülow premiered this piano concerto in Boston in 1875. The piano’s opening chords support a broad string melody, which yields to different thematic material once the main movement begins."],
    source: "https://en.tchaikovsky-research.net/pages/Piano_Concerto_No._1",
  },
  101: {
    zh: ["1893年", "德沃夏克在纽约任教期间写给管弦乐队。作品将五声音阶、切分与捷克式节奏纳入交响曲，第二乐章英国管独奏成为全曲最著名的旋律之一。"],
    en: ["1893", "Written while Dvořák was teaching in New York, this orchestral symphony brings pentatonic melodies, syncopation and Czech-style rhythms into a symphonic design. The Largo’s English horn solo became especially well known."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._9_(Dvo%C5%99%C3%A1k)",
  },
  102: {
    zh: ["1894–1895年", "在美国时期为大提琴与乐队写成，后来修订结尾。独奏器的抒情性与乐队对话并重，终曲回忆早先主题，以近似告别的方式结束前进入短暂快板。"],
    en: ["1894–1895", "Composed in America for cello and orchestra, with the ending later revised. The finale recalls earlier themes in a long farewell before a brief fast close, balancing solo lyricism and orchestral dialogue."],
    source: "https://en.wikipedia.org/wiki/Cello_Concerto_(Dvo%C5%99%C3%A1k)",
  },
  103: {
    zh: ["1887年", "为钢琴与弦乐四重奏写成。第二乐章杜姆卡在沉思与活泼间转换，谐谑曲采用捷克舞曲富里安特的重音特征，将本土舞蹈带入室内乐。"],
    en: ["1887", "Written for piano and string quartet. The dumka alternates reflective and lively music, and the scherzo draws on the accents of the Czech furiant, bringing local dance rhythms into chamber music."],
    source: "https://en.wikipedia.org/wiki/Piano_Quintet_No._2_(Dvo%C5%99%C3%A1k)",
  },
  104: {
    zh: ["1881–1883年", "为大型乐队写的交响曲，1884年莱比锡首演推动布鲁克纳声名。慢乐章用瓦格纳大号增添厚重色彩，其中的哀悼段落与瓦格纳之死相关。"],
    en: ["1881–1883", "The 1884 Leipzig premiere helped establish Bruckner’s reputation. The symphony’s large orchestra includes Wagner tubas in the Adagio, whose solemn music is associated with the death of Wagner."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._7_(Bruckner)",
  },
  105: {
    zh: ["1887–1888年初稿，后修订", "早期演出使用过《泰坦》题名，定稿为四乐章交响曲。大型乐队从自然声响走到讽刺性的葬礼进行曲，其中低音提琴奏出小调版《两只老虎》的旋律。"],
    en: ["First version 1887–1888, later revised", "Early performances used the title Titan. In the final four-movement orchestral version, sounds of nature lead to a satirical funeral march, introduced by solo double bass playing a minor-key Frère Jacques."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._1_(Mahler)",
  },
  106: {
    zh: ["1888–1894年", "《复活》交响曲从葬礼乐章走向合唱终曲，以大型乐队、女高音、女低音和合唱探索死亡与复活。末乐章融合远处号角、静默和人声，扩大了交响曲的表现规模。"],
    en: ["1888–1894", "The Resurrection Symphony moves from a funeral movement to a choral finale with large orchestra, soprano and alto soloists. Offstage calls, silence and voices give its treatment of death and resurrection an unusually wide scale."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._2_(Mahler)",
  },
  107: {
    zh: ["1901–1902年，后修订", "以小号独奏的葬礼进行曲开场的大型交响曲。著名《小柔板》只用弦乐与竖琴，和铜管强音形成反差；终曲以活跃对位走向明朗。"],
    en: ["1901–1902, later revised", "A large symphony launched by a trumpet funeral march. The famous Adagietto uses only strings and harp, a marked change of scale before the energetic counterpoint of the finale."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._5_(Mahler)",
  },
  108: {
    zh: ["1908–1909年", "六首管弦乐歌曲构成的交响套曲，以德译中国诗歌为文本，供女低音或男中音与男高音交替演唱。《告别》在反复的「永远」中逐渐隐去。"],
    en: ["1908–1909", "Six orchestral songs set German adaptations of Chinese poems, alternating tenor with alto or baritone. In the closing Der Abschied, repetitions of “ewig” gradually disappear into the orchestra."],
    source: "https://en.wikipedia.org/wiki/Das_Lied_von_der_Erde",
  },
  109: {
    zh: ["1919年", "一战后写成的大提琴协奏曲，整体气质内省。独奏以宣叙调式和弦开场，这个手势在终曲返回，使全曲像一段回望。"],
    en: ["1919", "Written after the First World War, Elgar’s cello concerto has an inward tone. The soloist’s opening recitative-like chords return in the finale, framing the work as a reflection."],
    source: "https://en.wikipedia.org/wiki/Cello_Concerto_(Elgar)",
  },
  110: {
    zh: ["1900–1901年", "拉赫玛尼诺夫恢复大型创作后写成的钢琴协奏曲，献给帮助他的达尔医生。钟鸣般的钢琴和弦引出弦乐长旋律，是典型的晚期浪漫派协奏曲音响。"],
    en: ["1900–1901", "Written as Rachmaninoff returned to large-scale composition and dedicated to Dr. Nikolai Dahl. The piano’s bell-like chords release a broad string melody, an emblematic late-Romantic concerto sound."],
    source: "https://en.wikipedia.org/wiki/Piano_Concerto_No._2_(Rachmaninoff)",
  },
  111: {
    zh: ["1909年", "为赴美巡演写的钢琴协奏曲，作曲家在纽约首演时独奏。开头朴素的钢琴主题逐渐扩展成复杂的独奏与乐队织体，首乐章有两种华彩可选。"],
    en: ["1909", "Composed for Rachmaninoff’s American tour and premiered with him at the piano in New York. A plain opening melody grows into intricate solo and orchestral textures, with two alternative first-movement cadenzas."],
    source: "https://en.wikipedia.org/wiki/Piano_Concerto_No._3_(Rachmaninoff)",
  },
  112: {
    zh: ["1845–1854年", "李斯特为管弦乐队写的交响诗，由早期合唱计划的序曲发展而来。相近动机在不同速度和性格中变形，体现单乐章交响诗的主题变形手法。"],
    en: ["1845–1854", "A symphonic poem for orchestra developed from the overture to an earlier choral project. Related motifs change tempo and character across one movement, exemplifying Liszt’s thematic transformation."],
    source: "https://en.wikipedia.org/wiki/Les_Pr%C3%A9ludes",
  },
  113: {
    zh: ["1874年", "《我的祖国》第二首交响诗，用管弦乐描绘伏尔塔瓦河由双源汇流，经过舞蹈与激流。河流主题贯穿场景，成为捷克民族音乐的标志。"],
    en: ["1874", "The second symphonic poem of Má vlast follows the Vltava from two springs through dances and rapids. The river theme links the scenes and became an emblem of Czech musical identity."],
    source: "https://en.wikipedia.org/wiki/M%C3%A1_vlast",
  },
  114: {
    zh: ["1888–1889年", "管弦乐交响诗描写艺术家生命最后时刻与死后升华。开头断续节奏像气息，最后强烈的主题回归，呈现晚期浪漫派借配器讲述故事的方式。"],
    en: ["1888–1889", "This tone poem depicts a dying artist and a final transfiguration. Halting rhythms suggest failing breath, while a broad thematic return shows how late-Romantic orchestration can carry a narrative."],
    source: "https://en.wikipedia.org/wiki/Death_and_Transfiguration",
  },
  115: {
    zh: ["1888年", "取材于莱瑙的《唐璜》诗剧的管弦乐交响诗。开头高速上冲、圆号宽阔主题与最终骤停，描写追逐欲望及幻灭，也确立了施特劳斯的交响诗声望。"],
    en: ["1888", "Based on Lenau’s Don Juan, this orchestral tone poem moves from a rushing opening and expansive horn theme to an abrupt ending. Its virtuoso narrative helped establish Strauss’s reputation."],
    source: "https://en.wikipedia.org/wiki/Don_Juan_(Strauss)",
  },
  116: {
    zh: ["1899年，后有弦乐团版", "原为两把小提琴、两把中提琴和两把大提琴写成，取材自德默尔诗歌。夜色中的紧张半音逐渐转明，显示勋伯格早期从晚期浪漫派走向新语言。"],
    en: ["1899, later arranged for string orchestra", "Originally a string sextet after a poem by Richard Dehmel. Its nocturnal chromatic tension gives way to brighter harmony, showing the young Schoenberg working within and stretching late-Romantic language."],
    source: "https://en.wikipedia.org/wiki/Verkl%C3%A4rte_Nacht",
  },
  117: {
    zh: ["1816年", "意大利喜歌剧，为独唱、合唱及乐队而作。序曲有标志性的渐强，罗西娜的咏叹调呈现花腔和机智，费加罗以连珠快唱介绍自己。"],
    en: ["1816", "An Italian comic opera for soloists, chorus and orchestra. The selections contrast the overture’s crescendo, Rosina’s witty coloratura and Figaro’s rapid patter as he introduces himself."],
    source: "https://en.wikipedia.org/wiki/The_Barber_of_Seville",
  },
  118: {
    zh: ["1852–1853年", "取材自《茶花女》的意大利歌剧。两段选曲都在第一幕，众人伴随乐队祝酒，随后薇奥莱塔以花腔表达对自由的渴望。"],
    en: ["1852–1853", "Verdi’s opera adapts La Dame aux camélias. The two Act I selections pair a communal drinking song with Violetta’s coloratura declaration of freedom, for solo voices, chorus and orchestra."],
    source: "https://en.wikipedia.org/wiki/La_traviata",
  },
  119: {
    zh: ["1857–1859年", "音乐戏剧以管弦乐序曲开始、在伊索尔德最终演唱中结束。序曲的「特里斯坦和弦」长期回避解决，对晚期浪漫派和声及后来的调性探索影响深远。"],
    en: ["1857–1859", "Wagner’s music drama begins with an orchestral Prelude and ends with Isolde’s final song. The unresolved tension of the “Tristan chord” influenced late-Romantic harmony and later approaches to tonality."],
    source: "https://en.wikipedia.org/wiki/Tristan_und_Isolde",
  },
  120: {
    zh: ["1920–1924年未完，1926年首演", "普契尼最后的歌剧，为独唱、合唱与大型乐队写作，常演结尾由阿尔法诺补成。选段从第一幕合唱到第三幕卡拉夫的男高音咏叹调，展示群像与独唱的对照。"],
    en: ["Unfinished 1920–1924, premiered 1926", "Puccini’s last opera uses soloists, chorus and large orchestra, with its usual ending completed by Alfano. The excerpts contrast an Act I chorus with Calaf’s Act III tenor aria."],
    source: "https://en.wikipedia.org/wiki/Turandot",
  },
  121: {
    zh: ["1892–1894年", "受马拉美诗歌启发而写的管弦乐前奏曲，长笛以自由而含混的旋律开场。重音、和声和音色的流动削弱传统的发展感，后来也成为尼金斯基芭蕾的音乐。"],
    en: ["1892–1894", "Inspired by Mallarmé’s poem, this orchestral prelude begins with an elusive flute melody. Fluid accents, harmony and timbre loosen traditional musical development. The piece later became the music for Nijinsky’s ballet."],
    source: "https://en.wikipedia.org/wiki/Pr%C3%A9lude_%C3%A0_l%27apr%C3%A8s-midi_d%27un_faune",
  },
  122: {
    zh: ["1903–1905年", "三幅管弦乐「交响素描」描写晨海、浪花和风海对话。反复出现的动机靠配器与节奏不断改变形态，是德彪西用音色组织全曲的代表。"],
    en: ["1903–1905", "Three orchestral sketches follow the sea at dawn, the play of waves and a dialogue of wind and sea. Recurring motifs change through orchestration and rhythm, showing how Debussy uses color to shape a large form."],
    source: "https://en.wikipedia.org/wiki/La_mer_(Debussy)",
  },
  123: {
    zh: ["1907年", "第二册是三首钢琴独奏小品，描绘钟声、月下废寺和金鱼。三行谱上的分层、踏板和快速音型让一件乐器呈现多重距离和色彩。"],
    en: ["1907", "Book II contains three solo piano pieces evoking bells, a moonlit temple and goldfish. Layered writing on three staves, pedaling and quick figurations create several planes of sound on one instrument."],
    source: "https://en.wikipedia.org/wiki/Images_(Debussy)",
  },
  124: {
    zh: ["1907年", "单乐章独奏钢琴奏鸣曲，题头引用斯克里亚宾自己的《狂喜之诗》。突发的快速音群和停顿、反复积累的高涨段落，预示他后期更自由的和声。"],
    en: ["1907", "This single-movement piano sonata quotes Scriabin’s own Poem of Ecstasy as an epigraph. Bursts of motion, pauses and rising climaxes anticipate the looser harmonic language of his later works."],
    source: "https://en.wikipedia.org/wiki/Piano_Sonata_No._5_(Scriabin)",
  },
  125: {
    zh: ["1919–1920年", "以维也纳圆舞曲为素材的管弦乐舞蹈诗。舞曲从低音的迷雾中渐现，末尾加速并扭曲成近乎失控的旋转，展现拉威尔的配器与节奏控制。"],
    en: ["1919–1920", "An orchestral choreographic poem built from Viennese waltzes. The dance emerges from a murky opening and accelerates toward a distorted close, showing Ravel’s control of color and rhythmic momentum."],
    source: "https://en.wikipedia.org/wiki/La_valse",
  },
  126: {
    zh: ["1906–1912年，芭蕾1912年首演", "为佳吉列夫的俄罗斯芭蕾舞团而作。第二组曲保留黎明、哑剧和全体舞，庞大管弦乐队与可用的无词合唱从晨光渐强推向五拍子的狂舞。"],
    en: ["Ballet 1906–1912, premiered 1912", "Written for Diaghilev’s Ballets Russes, the Second Suite includes daybreak, pantomime and the final dance. A large orchestra with optional wordless chorus leads from a dawn crescendo to a dance in five."],
    source: "https://en.wikipedia.org/wiki/Daphnis_et_Chlo%C3%A9",
  },
  127: {
    zh: ["1924年完成", "西贝柳斯最后一首完成的交响曲，首演时题作《交响幻想曲》。速度与性格在同一乐章内连续变化，长号主题反复出现，帮助听出整体结构。"],
    en: ["Completed 1924", "Sibelius’s last completed symphony was premiered as Fantasia sinfonica. Tempo and character change continuously within a single orchestral movement, and a recurring trombone theme helps articulate the form."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._7_(Sibelius)",
  },
  128: {
    zh: ["1915年原版，后改订", "原为歌舞家帕斯托拉·因佩里奥委约的舞台作品，后来改为芭蕾等版本。女声、器乐与安达卢西亚舞蹈节奏结合，《火祭之舞》尤为知名。"],
    en: ["Original version 1915, later revised", "Originally commissioned for dancer and singer Pastora Imperio, this stage work later took ballet and other forms. Voice and instruments draw on Andalusian rhythms, notably in the Ritual Fire Dance."],
    source: "https://en.wikipedia.org/wiki/El_amor_brujo",
  },
  129: {
    zh: ["1911–1913年", "为俄罗斯芭蕾舞团写的祭祀题材舞剧。大型乐队用尖锐和弦、重复音型和不断移位的重音重塑舞蹈节奏，1913年首演后成为音乐现代主义的重要作品。"],
    en: ["1911–1913", "Written for the Ballets Russes, this ballet imagines a ritual sacrifice. A large orchestra reshapes dance through pungent chords, ostinatos and shifting accents. It became a landmark of musical modernism after its 1913 premiere."],
    source: "https://en.wikipedia.org/wiki/The_Rite_of_Spring",
  },
  130: {
    zh: ["1930年，1948年修订", "为波士顿交响乐团五十周年创作，以合唱与特殊编制乐队唱拉丁诗篇。乐队省去小提琴和中提琴，双钢琴和管乐突出，复调与反复节奏使祈祷富有张力。"],
    en: ["1930, revised 1948", "Written for the Boston Symphony’s fiftieth anniversary, this work sets Latin psalms for chorus and an orchestra without violins or violas. Two pianos and winds give its counterpoint and repeated rhythms a distinctive edge."],
    source: "https://en.wikipedia.org/wiki/Symphony_of_Psalms",
  },
  131: {
    zh: ["1926年", "应体操组织索科尔的活动而作的五乐章管弦乐曲，后来与布尔诺联系紧密。开场和尾声额外使用大批铜管，号角构成一听就能认出的轮廓。"],
    en: ["1926", "Written in connection with the Sokol gymnastic festival, this five-movement work became closely associated with Brno. An expanded brass section frames the orchestra with striking fanfares."],
    source: "https://en.wikipedia.org/wiki/Sinfonietta_(Jan%C3%A1%C4%8Dek)",
  },
  132: {
    zh: ["1916–1917年", "普罗科菲耶夫第一首正式编号交响曲，为古典式小型乐队而作。它借用海顿式四乐章和轻巧比例，同时加入突兀的和声转折，是新古典主义先声。"],
    en: ["1916–1917", "Prokofiev’s first numbered symphony uses a small Classical-style orchestra. Haydn-like proportions and a four-movement layout meet pointed harmonic turns, anticipating neoclassical practice."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._1_(Prokofiev)",
  },
  133: {
    zh: ["芭蕾1935年，第一组曲1936年", "根据莎士比亚悲剧写的芭蕾音乐选编成管弦乐组曲，第一套含七个场景。舞步、抒情旋律与冷峻的冲突段落勾画人物和情节。"],
    en: ["Ballet 1935, First Suite 1936", "Adapted from Prokofiev’s ballet on Shakespeare’s tragedy, the First Suite selects seven orchestral scenes. Dances, lyrical themes and hard-edged music for conflict sketch the characters and story."],
    source: "https://en.wikipedia.org/wiki/Romeo_and_Juliet_(Prokofiev)",
  },
  134: {
    zh: ["1932年", "为温纳蕾塔·辛格委约的双钢琴与乐队作品。两台钢琴用敲击般的重复与乐队对答，慢乐章开头有意向莫扎特式协奏曲语言致意。"],
    en: ["1932", "Commissioned by Winnaretta Singer for two pianos and orchestra. Percussive repetitions pass between the keyboards and ensemble, while the slow movement opens in a deliberate homage to Mozart."],
    source: "https://en.wikipedia.org/wiki/Concerto_for_Two_Pianos_and_Orchestra_(Poulenc)",
  },
  135: {
    zh: ["1923年", "取名自蒸汽机车类别的管弦乐乐章。密度不断提高的节奏制造机器加速的错觉，体现两次大战之间作曲家对工业声音与运动的兴趣。"],
    en: ["1923", "Named after a type of steam locomotive, this orchestral movement creates an illusion of acceleration through increasingly dense rhythms, reflecting interwar fascination with industrial sound and motion."],
    source: "https://en.wikipedia.org/wiki/Pacific_231",
  },
  136: {
    zh: ["1943年，1945年修订结尾", "库塞维茨基委约，为大型管弦乐队写的五乐章音乐会曲。各声部轮流被当作独奏组突出，尤其是第二乐章成对管乐的音程对话。"],
    en: ["1943, ending revised 1945", "Commissioned by Koussevitzky, this orchestral work gives soloistic challenges to successive sections. The second movement’s pairs of winds illustrate why Bartók called it a concerto for orchestra."],
    source: "https://en.wikipedia.org/wiki/Concerto_for_Orchestra_(Bart%C3%B3k)",
  },
  137: {
    zh: ["1926年", "五首独奏钢琴小品中的第四和第五首。《夜的音乐》用低音、簇音与零星鸟鸣写夜景，《追逐》以持续快速音型展现钢琴的打击乐性格。"],
    en: ["1926", "The fourth and fifth pieces of this solo piano set contrast nocturnal clusters and isolated calls in The Night’s Music with the insistent patterns and percussive attack of The Chase."],
    source: "https://en.wikipedia.org/wiki/Out_of_Doors_(Bart%C3%B3k)",
  },
  138: {
    zh: ["1928年", "两把小提琴、中提琴和大提琴构成五乐章拱形结构。首尾互相呼应，清单选的第二乐章加弱音器急行，终曲用强烈节奏照应第一乐章。"],
    en: ["1928", "This five-movement string quartet forms an arch. The outer movements mirror one another, and the selected muted second movement races by before the rhythmic final movement echoes the first."],
    source: "https://en.wikipedia.org/wiki/String_Quartet_No._4_(Bart%C3%B3k)",
  },
  139: {
    zh: ["1912年", "为说唱女声与五位器乐演奏者写的21首小品，取材于吉罗诗歌的德译本。介于说话与歌唱的「说唱」技法和频繁变化的小编制，是辨认表现主义风格的关键。"],
    en: ["1912", "Twenty-one settings of German translations of Albert Giraud for reciter and five instrumentalists. Sprechstimme hovers between speech and song, while shifting instrumental colors sharpen the expressionist drama."],
    source: "https://en.wikipedia.org/wiki/Pierrot_Lunaire",
  },
  140: {
    zh: ["1914–1922年，1925年首演", "贝尔格根据毕希纳戏剧改编的歌剧，写给独唱、合唱和大型乐队。第三幕把暴力与社会压迫的结局写成一系列以单音、节奏等要素组织的「创意曲」。"],
    en: ["1914–1922, premiered 1925", "Based on Büchner’s play, Berg’s opera uses soloists, chorus and large orchestra. In Act III its violent conclusion is organized through inventions on elements such as a single note or a rhythm."],
    source: "https://en.wikipedia.org/wiki/Wozzeck",
  },
  141: {
    zh: ["1944–1945年", "根据克拉布诗作改编的英语歌剧，独唱、合唱与乐队呈现渔村对格莱姆斯的排斥。海的管弦音色与村民合唱推动戏剧，原清单未指定第一幕哪一场。"],
    en: ["1944–1945", "An English opera after George Crabbe, with solo voices, chorus and orchestra portraying a fishing village’s rejection of Grimes. Sea music and the crowd drive the drama. The catalogue does not specify which Act I scene."],
    source: "https://en.wikipedia.org/wiki/Peter_Grimes",
  },
  142: {
    zh: ["1909年，1928年修订", "六首极简短的管弦乐小品，用分散的音色、留白和突发强音写出密集情绪。第四首葬礼进行曲的巨大渐强尤其鲜明。"],
    en: ["1909, revised 1928", "Six concentrated orchestral miniatures use isolated colors, silence and sudden intensities. The enormous crescendo of the fourth piece, a funeral march, is especially distinctive."],
    source: "https://imslp.org/wiki/6_Pieces_for_Large_Orchestra,_Op.6_(Webern,_Anton)",
  },
  143: {
    zh: ["约1908年，1930年代修订", "静止的弦乐、发问的小号和试图回答的木管形成三个独立速度层。它以可同时听见的不同步音乐呈现哲学寓意，是艾夫斯多层写作的代表。"],
    en: ["c. 1908, revised in the 1930s", "Quiet strings, a questioning trumpet and answering woodwinds move in independent tempos. The simultaneous layers turn a philosophical premise into a clear example of Ives’s experimental writing."],
    source: "https://en.wikipedia.org/wiki/The_Unanswered_Question",
  },
  144: {
    zh: ["1953年", "斯大林去世之年写成的管弦乐交响曲。所选两乐章从漫长沉思转为短促猛烈的谐谑曲，形成全曲早段最鲜明的速度与音响反差。"],
    en: ["1953", "Completed in the year of Stalin’s death, this symphony contrasts a long, brooding opener with a short, violent scherzo. The two selected movements make that difference in pace and sound especially clear."],
    source: "https://en.wikipedia.org/wiki/Symphony_No._10_(Shostakovich)",
  },
  145: {
    zh: ["1960年", "在德累斯顿附近写成的弦乐四重奏，题献「法西斯主义与战争的受害者」。五乐章连续，作曲家姓名的 DSCH 音型和他自己作品的引语贯穿其中。"],
    en: ["1960", "Written near Dresden, this string quartet is dedicated to victims of fascism and war. Its five connected movements use the DSCH musical signature and quotations from Shostakovich’s own works."],
    source: "https://en.wikipedia.org/wiki/String_Quartet_No._8_(Shostakovich)",
  },
  146: {
    zh: ["1940–1941年", "二战战俘营中写成并首演，为单簧管、小提琴、大提琴与钢琴而作。鸟鸣、缓慢长线条和不对称节奏表现《启示录》中时间终止的意象。"],
    en: ["1940–1941", "Composed and premiered in a wartime prisoner-of-war camp for clarinet, violin, cello and piano. Birdsong, sustained melodies and irregular rhythms evoke the end of time from Revelation."],
    source: "https://en.wikipedia.org/wiki/Quartet_for_the_End_of_Time",
  },
  147: {
    zh: ["1946–1948年", "为波士顿交响乐团委约，钢琴与马特诺电子琴加入大型乐队。所选二、五、六乐章在情歌、狂喜舞蹈和静谧长线条之间切换，电子琴滑音极为醒耳。"],
    en: ["1946–1948", "Commissioned for the Boston Symphony, it combines piano and ondes Martenot with a large orchestra. Movements II, V and VI contrast love song, ecstatic dance and repose, with the electronic instrument’s gliding sound especially audible."],
    source: "https://en.wikipedia.org/wiki/Turangal%C3%AEla-Symphonie",
  },
  148: {
    zh: ["1953–1955年", "为女低音与六位器乐演奏者谱写勒内·夏尔诗歌。清单选的两个乐章是器乐段，以颤音琴、吉他等细分音色和序列组织连接全曲。"],
    en: ["1953–1955", "This setting of René Char uses contralto and six instrumentalists. Both selected movements are instrumental, linking the cycle through serial organization and sharply differentiated colors such as guitar and vibraphone."],
    source: "https://en.wikipedia.org/wiki/Le_Marteau_sans_ma%C3%AEtre",
  },
  149: {
    zh: ["1985年，第一册", "钢琴练习曲第一册用双手不同的重音和节奏制造错觉。选曲由《无序》的声部错位到《华沙之秋》的层层下降，技巧本身就是主要听点。"],
    en: ["Book I, 1985", "Book I uses different accents and rhythms in the two hands to create perceptual illusions. From the offsets of Désordre to the falling layers of Automne à Varsovie, the technical problem is part of the music."],
    source: "https://en.wikipedia.org/wiki/%C3%89tudes_(Ligeti)",
  },
  150: {
    zh: ["1961年", "为大型管弦乐队写作，以密集的微复调和音簇取代可分辨的旋律。黑暗与明亮音域不断变化，后来在电影《2001太空漫游》中为更广听众熟知。"],
    en: ["1961", "This large-orchestra work blends dense micropolyphony and clusters into changing masses of sound. Its shifting registers reached a wider audience through the film 2001: A Space Odyssey."],
    source: "https://en.wikipedia.org/wiki/Atmosph%C3%A8res",
  },
  151: {
    zh: ["1985–1987年", "根据尼克松1972年访华写的英语歌剧，古德曼编剧。第一幕以独唱、合唱与扩充乐队呈现抵达和国宴，重复音型与公众演说的韵律交织。"],
    en: ["1985–1987", "This English-language opera by Adams and librettist Alice Goodman dramatizes Nixon’s 1972 visit to China. Act I uses soloists, chorus and orchestra to depict the arrival and banquet, weaving repeating patterns into the rhythms of public speech."],
    source: "https://www.earbox.com/nixon-in-china/",
  },
  152: {
    zh: ["1970年", "原题《儿童的古老声音》，为歌者、童声与包括双簧管、曼陀林、竖琴、键盘和打击乐的室内乐队写作。洛尔卡诗歌在呼喊、耳语与异质音色之间呈现。"],
    en: ["1970", "Titled Ancient Voices of Children, the piece sets Lorca for singer, boy soprano and an ensemble including oboe, mandolin, harp, keyboards and percussion. Cries and whispers are woven into its unusual instrumental colors."],
    source: "https://en.wikipedia.org/wiki/Ancient_Voices_of_Children",
  },
  153: {
    zh: ["1947–1949年", "为作曲家联盟二十五周年委约的独奏钢琴奏鸣曲，由霍洛维茨首演。清单选的第一乐章节奏坚硬，第四乐章高速赋格放大了对位的演奏难度。"],
    en: ["1947–1949", "Commissioned for the League of Composers and premiered by Horowitz, this solo sonata pairs the first movement’s hard-edged rhythm with a virtuosic fugal finale in the selected movements."],
    source: "https://en.wikipedia.org/wiki/Piano_Sonata_(Barber)",
  },
  154: {
    zh: ["1946–1948年", "由16首奏鸣曲和4首间奏曲组成的预置钢琴套曲。在琴弦间放置螺丝、橡胶等物，使钢琴发出锣鼓般音色，并用这些声音探索不同情绪。"],
    en: ["1946–1948", "Sixteen sonatas and four interludes for prepared piano. Screws, rubber and other objects change the sound of the strings into a percussion-like palette for exploring contrasting emotional states."],
    source: "https://en.wikipedia.org/wiki/Sonatas_and_Interludes",
  },
  155: {
    zh: ["1967年", "为两台钢琴或钢琴与录音带写作。两组相同音型由同步渐次错开，再稳定到新的相位，让一个简单过程产生可听见的重音与旋律。"],
    en: ["1967", "Written for two pianos or piano and tape, identical patterns start together, drift apart, then lock into a new phase. Clear accents and apparent melodies emerge from the gradual process."],
    source: "https://en.wikipedia.org/wiki/Piano_Phase",
  },
  156: {
    zh: ["1983–1985年", "法国广播电台为艾萨克·斯特恩委约的小提琴协奏曲，副题《梦之树》。四个乐章以间奏相接，旋律材料像树枝般不断伸展和更新。"],
    en: ["1983–1985", "Commissioned by Radio France for Isaac Stern, The Tree of Dreams is a violin concerto with four movements linked by interludes. Themes grow and renew like branches of a tree."],
    source: "https://en.wikipedia.org/wiki/L%27arbre_des_songes",
  },
  157: {
    zh: ["约1960–1961年", "为52件弦乐器而作，后来题献广岛原爆受难者。音簇、滑音、非常规奏法与按秒标示的段落，将弦乐集合音色推到前景。"],
    en: ["c. 1960–1961", "Scored for 52 individual strings and later dedicated to the victims of Hiroshima. Clusters, glissandi, extended techniques and sections timed in seconds place collective sonority at the forefront."],
    source: "https://polishmusic.usc.edu/research/composers/krzysztof-penderecki/",
  },
  158: {
    zh: ["1975年", "为钢琴家厄休拉·奥彭斯写的36首钢琴变奏，以智利团结歌曲为主题。所选前六首开始改变主题的节奏和织体，把政治歌曲转化为大型音乐会作品。"],
    en: ["1975", "Composed for Ursula Oppens, these 36 piano variations take a Chilean solidarity song as their theme. The first six variations begin transforming its rhythm and texture into a large concert work."],
    source: "https://en.wikipedia.org/wiki/The_People_United_Will_Never_Be_Defeated!",
  },
  159: {
    zh: ["1967年", "为纽约爱乐成立125周年委约，把日本尺八、琵琶与西方管弦乐队并置。独奏器的气息、拨击和停顿各有辨识度，展示传统之间的对话。"],
    en: ["1967", "Commissioned for the New York Philharmonic’s 125th anniversary, this work places shakuhachi and biwa beside a Western orchestra. Breath, plucked attacks and silence give the soloists distinct voices."],
    source: "https://en.wikipedia.org/wiki/November_Steps",
  },
  160: {
    zh: ["1961年", "为克拉科夫爱乐委约的四段管弦乐，作曲家规定音高与整体布局，让演奏者在部分段落各自控制节奏。原清单所写「第Ⅴ段」在通行四段结构中无对应。"],
    en: ["1961", "Commissioned by the Kraków Philharmonic, these four orchestral movements fix pitches and overall form while allowing rhythmic independence in some passages. The standard four-movement score has no corresponding Movement V."],
    source: "https://en.wikipedia.org/wiki/Jeux_v%C3%A9nitiens",
  },
};

export const workBackgrounds = Object.fromEntries(data.flatMap(([, groups]) =>
  groups.flatMap(([name, works]) => works.map(([id]) => {
    const note = notes[id];
    const [chinese, english] = id === 23
      ? ['传统归于约翰·塞巴斯蒂安·巴赫', 'Traditionally attributed to Johann Sebastian Bach']
      : composers[name];
    return [id, {
      zh: { composer: chinese, year: note.zh[0], description: note.zh[1] },
      en: { composer: english, year: note.en[0], description: note.en[1] },
      source: note.source,
    }];
  }))
));
