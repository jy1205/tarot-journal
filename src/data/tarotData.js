// 大阿卡纳 (Major Arcana) - 22张
export const majorArcana = [
  { id: 'm0',  name: '愚人',     nameEn: 'The Fool',        number: 0,  keyword: '开始·冒险·天真',  astrology: '天王星 Uranus' },
  { id: 'm1',  name: '魔术师',   nameEn: 'The Magician',    number: 1,  keyword: '创造·意志·技巧',  astrology: '水星 Mercury' },
  { id: 'm2',  name: '女祭司',   nameEn: 'The High Priestess', number: 2, keyword: '直觉·潜意识·神秘',  astrology: '月亮 Moon' },
  { id: 'm3',  name: '女皇',     nameEn: 'The Empress',     number: 3,  keyword: '丰饶·母性·感官',  astrology: '金星 Venus' },
  { id: 'm4',  name: '皇帝',     nameEn: 'The Emperor',     number: 4,  keyword: '权威·结构·掌控',  astrology: '白羊座 Aries' },
  { id: 'm5',  name: '教皇',     nameEn: 'The Hierophant',  number: 5,  keyword: '传统·信仰·教导',  astrology: '金牛座 Taurus' },
  { id: 'm6',  name: '恋人',     nameEn: 'The Lovers',      number: 6,  keyword: '爱·选择·和谐',  astrology: '双子座 Gemini' },
  { id: 'm7',  name: '战车',     nameEn: 'The Chariot',     number: 7,  keyword: '胜利·意志·征服',  astrology: '巨蟹座 Cancer' },
  { id: 'm8',  name: '力量',     nameEn: 'Strength',        number: 8,  keyword: '勇气·耐心·柔和',  astrology: '狮子座 Leo' },
  { id: 'm9',  name: '隐士',     nameEn: 'The Hermit',      number: 9,  keyword: '内省·指引·孤独',  astrology: '处女座 Virgo' },
  { id: 'm10', name: '命运之轮', nameEn: 'Wheel of Fortune', number: 10, keyword: '命运·转折·循环',  astrology: '木星 Jupiter' },
  { id: 'm11', name: '正义',     nameEn: 'Justice',         number: 11, keyword: '公正·真理·因果',  astrology: '天秤座 Libra' },
  { id: 'm12', name: '倒吊人',   nameEn: 'The Hanged Man',  number: 12, keyword: '牺牲·换个视角·等待',  astrology: '海王星 Neptune' },
  { id: 'm13', name: '死神',     nameEn: 'Death',           number: 13, keyword: '结束·转变·重生',  astrology: '天蝎座 Scorpio' },
  { id: 'm14', name: '节制',     nameEn: 'Temperance',      number: 14, keyword: '调和·平衡·中庸',  astrology: '射手座 Sagittarius' },
  { id: 'm15', name: '恶魔',     nameEn: 'The Devil',       number: 15, keyword: '欲望·束缚·物质',  astrology: '摩羯座 Capricorn' },
  { id: 'm16', name: '高塔',     nameEn: 'The Tower',       number: 16, keyword: '崩塌·剧变·觉醒',  astrology: '火星 Mars' },
  { id: 'm17', name: '星星',     nameEn: 'The Star',        number: 17, keyword: '希望·灵感·疗愈',  astrology: '水瓶座 Aquarius' },
  { id: 'm18', name: '月亮',     nameEn: 'The Moon',        number: 18, keyword: '幻象·恐惧·潜意识',  astrology: '双鱼座 Pisces' },
  { id: 'm19', name: '太阳',     nameEn: 'The Sun',         number: 19, keyword: '喜悦·成功·活力',  astrology: '太阳 Sun' },
  { id: 'm20', name: '审判',     nameEn: 'Judgement',       number: 20, keyword: '觉醒·召唤·重生',  astrology: '冥王星 Pluto' },
  { id: 'm21', name: '世界',     nameEn: 'The World',       number: 21, keyword: '完成·整合·成就',  astrology: '土星 Saturn' },
]

// 小阿卡纳 (Minor Arcana) - 按四元素分组
const suitConfigs = [
  { element: '火', elementEn: 'Fire',  name: '权杖', nameEn: 'Wands', symbol: '🜂' },
  { element: '风', elementEn: 'Air',   name: '宝剑', nameEn: 'Swords', symbol: '🜁' },
  { element: '水', elementEn: 'Water', name: '圣杯', nameEn: 'Cups',   symbol: '🜄' },
  { element: '土', elementEn: 'Earth', name: '星币', nameEn: 'Pentacles', symbol: '🜃' },
]

const courtNames = ['侍从', '骑士', '皇后', '国王']
const courtNamesEn = ['Page', 'Knight', 'Queen', 'King']

export const minorArcana = suitConfigs.map((suit, si) => {
  const cards = []
  // 数字牌 1-10
  for (let i = 1; i <= 10; i++) {
    cards.push({
      id: `s${si}-n${i}`,
      name: `${suit.name}${i === 1 ? 'Ace' : i}`,
      nameEn: `${i === 1 ? 'Ace' : i} of ${suit.nameEn}`,
      number: i,
      element: suit.element,
      elementEn: suit.elementEn,
      suit: suit.name,
      suitEn: suit.nameEn,
      symbol: suit.symbol,
      keyword: `${suit.name}·数字${i}`,
      type: 'number'
    })
  }
  // 宫廷牌
  courtNames.forEach((cn, ci) => {
    cards.push({
      id: `s${si}-c${ci}`,
      name: `${suit.name}${cn}`,
      nameEn: `${courtNamesEn[ci]} of ${suit.nameEn}`,
      number: 11 + ci,
      element: suit.element,
      elementEn: suit.elementEn,
      suit: suit.name,
      suitEn: suit.nameEn,
      symbol: suit.symbol,
      keyword: `${suit.name}·宫廷·${cn}`,
      type: 'court',
      court: cn
    })
  })
  return {
    suit: suit.name,
    suitEn: suit.nameEn,
    element: suit.element,
    elementEn: suit.elementEn,
    symbol: suit.symbol,
    cards
  }
})

// 大阿卡纳布局分组
// 愚人单独第一行，剩下21张分三行每行7张
export const majorLayout = {
  fool: majorArcana[0], // 愚人单独
  row1: majorArcana.slice(1, 8),   // 魔术师~战车 (1-7)
  row2: majorArcana.slice(8, 15),  // 力量~节制 (8-14)
  row3: majorArcana.slice(15, 22), // 恶魔~世界 (15-21)
}
