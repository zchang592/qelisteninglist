// Only split multiple selections explicitly named in the source; catalogue IDs stay unchanged.
const specific = entries => entries.map(([name,video,start])=>({name,video,start}));
export const workParts = {
  86:specific([['No. 1 · Gute Nacht','wIw1OiLyZZk'],['No. 5 · Der Lindenbaum','jyxMMg6bxrg'],['No. 6 · Wasserflut','bFG8nUJ8qdM']]),
  89:specific([['No. 1 · Im wunderschönen Monat Mai','00-7gHZLWC0'],['No. 7 · Ich grolle nicht','jf8WvfCTd7M'],['No. 12 · Am leuchtenden Sommermorgen','ZF4yLMob3Ko']]),
  117:specific([['Overture','L0HYxNb0-eI'],['Una voce poco fa','q3UNeqTHfgQ'],['Largo al factotum','6EZ-tjip_uY']]),
  118:specific([['Libiamo ne’ lieti calici','afhAqMeeQJk'],['Sempre libera','ooHtAm_-5Yo']]),
  119:specific([['Prelude','J-qoaioG2UA'],['Liebestod','WGsTJd5NBjw']]),
  120:specific([["Là, sui monti dell’Est",'T4J--_6JLec'],['Nessun dorma','cWc7vYjgnTs']]),
  137:specific([["IV · The Night’s Music",'13AfuAIYU6o'],['V · The Chase','N_aCRA8tcH4']]),
  138:specific([['I · Allegro','5aJe5U_6aMI',0],['II · Prestissimo, con sordino','5aJe5U_6aMI',432],['V · Allegro molto','5aJe5U_6aMI',1182]]),
  144:specific([['I · Moderato','TSvsVvrzuN8'],['II · Allegro','C2T97GsY0nI']]),
  147:specific([["II · Chant d’amour I",'-oYuZVrCX10'],['V · Joie du sang des étoiles','Tv67YkOWJNA'],["VI · Jardin du sommeil d’amour",'ZsHfOElDtaM']]),
  148:specific([["I · Avant ‘L’Artisanat furieux’",'slKzzo3AYTc'],["VIII · Commentaire III de ‘Bourreaux de solitude’",'Ngl2Pe0McAk']]),
  149:specific([['No. 1 · Désordre','6WHdNub6Agk'],['No. 4 · Fanfares','UrRmZkaBImI'],['No. 5 · Arc-en-ciel','ELZk7mNbs9I'],['No. 6 · Automne à Varsovie','u047t1SOByE']]),
  153:specific([['I · Allegro energico','3jmd4rC6MW4'],['IV · Fuga','9cQd7uwmKII']]),
  158:specific([['Variation 1','u1uouugnTCo'],['Variation 2','7uBqQYspZHA'],['Variation 3','U6vOKAJimaE'],['Variation 4','RlQO5wx-c88'],['Variation 5','eSe0XvzrwQY'],['Variation 6','BfTsgl21q5M']]),
  160:[{name:'I · Movement I',video:'XxsRMvlbEvQ'},{name:'V · Movement V',unresolved:true}],
};
export const scopeNotes = {
  39:'原清单没有指定《羽管键琴曲集》的册数或曲目；首选录音为第二册，不能代表全部四册。',
  128:'原清单未说明芭蕾或组曲版本；各版本结构不同，暂按原条目提供录音。',
  141:'原清单只写第一幕的一个场景，未指定具体场景；首选录音包含全剧并定位到第一幕。',
  152:'原清单作品名称和编制需要核对。',
  160:'原清单写第 I、V 乐章，但常见资料仅列四个段落；第五乐章待核对。',
};
// These titles specify a single excerpt; show the source's actual movement or title next to the work.
export const selectedSingleTracks = new Set([1,2,3,5,6,12,19,21,24,25,28,29,31,32,33,34,35,36,37,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,68,69,70,71,73,74,75,76,77,78,79,140,141,151]);
