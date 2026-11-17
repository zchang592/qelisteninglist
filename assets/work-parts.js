// Only split works when the source specifies several parts or the complete work is identifiable.
// IDs remain the original catalogue IDs; YouTube searches are not asserted to be exact recordings.
const movements = count => Array.from({length:count},(_,i)=>({name:`Movement ${['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'][i]}`}));
const named = names => names.map(name=>({name}));
const pieces = count => Array.from({length:count},(_,i)=>({name:`No. ${i+1}`}));
const specific = entries => entries.map(([name,video,start])=>({name,video,start}));
export const workParts = {
  13:movements(3),14:movements(3),15:movements(3),16:movements(3),
  17:named(['I · Gloria in excelsis Deo','II · Et in terra pax','III · Laudamus te','IV · Gratias agimus tibi','V · Propter magnam gloriam tuam','VI · Domine Deus','VII · Domine Fili unigenite','VIII · Domine Deus, Agnus Dei','IX · Qui tollis peccata mundi','X · Qui sedes ad dexteram Patris','XI · Quoniam tu solus sanctus','XII · Cum Sancto Spiritu']),18:movements(3),
  26:movements(3),27:movements(3),30:named(['Prelude','Fugue']),
  39:named(['Book 1 · Ordres 1–5','Book 2 · Ordres 6–12','Book 3 · Ordres 13–19','Book 4 · Ordres 20–27']),
  67:movements(4),
  81:movements(2),82:movements(4),83:movements(5),84:movements(4),
  86:specific([['No. 1 · Gute Nacht','wIw1OiLyZZk'],['No. 5 · Der Lindenbaum','jyxMMg6bxrg'],['No. 6 · Wasserflut','bFG8nUJ8qdM']]),
  87:movements(5),88:movements(4),
  89:specific([['No. 1 · Im wunderschönen Monat Mai','00-7gHZLWC0'],['No. 7 · Ich grolle nicht','jf8WvfCTd7M'],['No. 12 · Am leuchtenden Sommermorgen','ZF4yLMob3Ko']]),
  90:movements(4),91:movements(3),92:movements(5),93:movements(4),94:movements(4),95:movements(3),96:movements(4),97:movements(4),98:movements(4),99:movements(3),100:movements(3),101:movements(4),102:movements(3),103:movements(4),104:movements(4),105:movements(4),106:movements(5),107:movements(5),108:named(['I · Das Trinklied vom Jammer der Erde','II · Der Einsame im Herbst','III · Von der Jugend','IV · Von der Schönheit','V · Der Trunkene im Frühling','VI · Der Abschied']),109:movements(4),110:movements(3),111:movements(3),
  117:specific([['Overture','L0HYxNb0-eI'],['Una voce poco fa','q3UNeqTHfgQ'],['Largo al factotum','6EZ-tjip_uY']]),
  118:specific([['Libiamo ne’ lieti calici','afhAqMeeQJk'],['Sempre libera','ooHtAm_-5Yo']]),
  119:named(['Prelude','Liebestod']),
  120:specific([["Là, sui monti dell’Est",'T4J--_6JLec'],['Nessun dorma','cWc7vYjgnTs']]),
  122:movements(3),
  123:specific([['I · Cloches à travers les feuilles','2OUCiAH7UFc'],['II · Et la lune descend sur le temple qui fut','0C-NuNI6qeg'],["III · Poissons d’or",'JNWC3GUYgQw']]),
  126:named(['I · Lever du jour','II · Pantomime','III · Danse générale']),
  129:named(['Part I · Adoration of the Earth','Part II · The Sacrifice']),130:movements(3),131:movements(5),132:movements(4),133:movements(7),134:movements(3),136:movements(5),
  137:specific([["IV · The Night’s Music",'13AfuAIYU6o'],['V · The Chase','N_aCRA8tcH4']]),
  138:specific([['I · Allegro','5aJe5U_6aMI',0],['II · Prestissimo, con sordino','5aJe5U_6aMI',432],['V · Allegro molto','5aJe5U_6aMI',1182]]),
  139:pieces(21),140:pieces(5).map((p,i)=>({name:`Act III · Scene ${i+1}`})),142:pieces(6),
  144:specific([['I · Moderato'],['II · Allegro','C2T97GsY0nI']]),145:movements(5),146:movements(8),
  147:specific([["II · Chant d’amour I",'-oYuZVrCX10'],['V · Joie du sang des étoiles','Tv67YkOWJNA'],["VI · Jardin du sommeil d’amour",'ZsHfOElDtaM']]),
  148:specific([["I · Avant ‘L’Artisanat furieux’",'slKzzo3AYTc'],["VIII · Commentaire III de ‘Bourreaux de solitude’",'Ngl2Pe0McAk']]),
  149:specific([['No. 1 · Désordre','6WHdNub6Agk'],['No. 4 · Fanfares','UrRmZkaBImI'],['No. 5 · Arc-en-ciel','ELZk7mNbs9I'],['No. 6 · Automne à Varsovie','u047t1SOByE']]),
  151:named(['Act I · Scene 1','Act I · Scene 2','Act I · Scene 3']),
  153:specific([['I · Allegro energico','3jmd4rC6MW4'],['IV · Fuga','9cQd7uwmKII']]),
  154:named(['Sonata I','Sonata II','Sonata III','Sonata IV','First Interlude','Sonata V','Sonata VI','Sonata VII','Sonata VIII','Second Interlude','Third Interlude','Sonata IX','Sonata X','Sonata XI','Sonata XII','Fourth Interlude','Sonata XIII','Sonata XIV','Sonata XV','Sonata XVI']),
  156:movements(4),158:Array.from({length:6},(_,i)=>({name:`Variation ${i+1}`})),
};
export const scopeNotes = {
  39:'原清单只写《羽管键琴曲集》，没有指定册数、组曲或曲目；以下仅按四册提供浏览入口，并非考试范围。',
  128:'原清单未说明芭蕾或组曲版本；各版本结构不同，暂不拆分。',
  141:'原清单只写第一幕的一个场景，未指定具体场景；请先确认。',
  152:'原清单作品名称和编制需要核对，暂不拆分。',
  160:'原清单写第 I、V 乐章，但常见资料仅列四个段落；第五乐章待核对。',
};
