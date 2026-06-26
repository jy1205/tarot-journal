// 塔罗牌图片生成器 - 使用 Canvas 动态生成卡片图片
// 返回一个函数，调用后返回 data URL

const cardColors = {
  major: ['#3a2a1a', '#c9a96e'],
  '火':  ['#3a1a0a', '#d4784a'],   // 权杖 - Fire
  '风':  ['#1a2a3a', '#8aaacc'],   // 宝剑 - Air
  '水':  ['#0a1a2a', '#6a9abc'],   // 圣杯 - Water
  '土':  ['#1a2a0a', '#8aaa6a'],   // 星币 - Earth
}

// 大阿卡纳编号对应的象征符号
const majorSymbols = {
  0: '★', 1: '☿', 2: '☽', 3: '♀', 4: '♄', 5: '♃', 6: '☉',
  7: '♈', 8: '♌', 9: '♍', 10: '⊕', 11: '♎', 12: '♆', 13: '♏',
  14: '♐', 15: '♑', 16: '♅', 17: '♒', 18: '♓', 19: '☀', 20: '♇', 21: '🌍'
}

// 小阿卡纳符号
const suitSymbols = { '火':'🜂', '风':'🜁', '水':'🜄', '土':'🜃' }
const courtSymbols = { '侍从':'♟', '骑士':'♞', '皇后':'♛', '国王':'♚' }

function getNumberDisplay(card) {
  if (card.number === 0) return '0'
  if (card.type === 'court') {
    return courtSymbols[card.court] || ''
  }
  if (card.type === 'number') {
    return romanNumeral(card.number)
  }
  return romanNumeral(card.number)
}

function romanNumeral(n) {
  const map = {1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',10:'X',
    11:'XI',12:'XII',13:'XIII',14:'XIV',15:'XV',16:'XVI',17:'XVII',18:'XVIII',19:'XIX',20:'XX',21:'XXI'}
  return map[n] || String(n)
}

/**
 * 为一张塔罗牌生成 Canvas 图片
 */
export function generateCardImage(card) {
  const canvas = document.createElement('canvas')
  canvas.width = 300
  canvas.height = 500
  const ctx = canvas.getContext('2d')

  const isMajor = card.number !== undefined && card.element === undefined
  const colors = isMajor ? cardColors.major : cardColors[card.element] || cardColors.earth

  // 背景
  const bgGrad = ctx.createLinearGradient(0, 0, 300, 500)
  bgGrad.addColorStop(0, colors[0])
  bgGrad.addColorStop(0.5, adjustColor(colors[0], 15))
  bgGrad.addColorStop(1, colors[0])
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, 300, 500)

  // 纹理效果 - 细线
  ctx.strokeStyle = 'rgba(255,255,255,0.02)'
  ctx.lineWidth = 1
  for (let y = 0; y < 500; y += 4) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(300, y)
    ctx.stroke()
  }

  // 外边框
  const margin = 14
  ctx.strokeStyle = colors[1]
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.6
  ctx.strokeRect(margin, margin, 300 - margin * 2, 500 - margin * 2)

  // 内边框
  const innerMargin = margin + 10
  ctx.lineWidth = 0.5
  ctx.globalAlpha = 0.3
  ctx.strokeRect(innerMargin, innerMargin, 300 - innerMargin * 2, 500 - innerMargin * 2)

  // 角落装饰
  const cm = margin + 6
  const cl = 20
  ctx.strokeStyle = colors[1]
  ctx.lineWidth = 1.5
  ctx.globalAlpha = 0.5
  // 四角
  drawCorner(ctx, cm, cm, cl, 1, 1)
  drawCorner(ctx, 300 - cm, cm, cl, -1, 1)
  drawCorner(ctx, cm, 500 - cm, cl, 1, -1)
  drawCorner(ctx, 300 - cm, 500 - cm, cl, -1, -1)

  ctx.globalAlpha = 1

  // 上部区域 - 编号
  const topY = 60
  ctx.fillStyle = colors[1]
  ctx.globalAlpha = 0.8
  ctx.font = 'bold 42px "Georgia", "Noto Serif SC", serif'
  ctx.textAlign = 'center'
  const numDisplay = getNumberDisplay(card)
  ctx.fillText(numDisplay, 150, topY)

  // 元素/组别标签
  ctx.globalAlpha = 0.5
  ctx.font = '14px "Georgia", "Noto Serif SC", serif'
  if (card.element) {
    ctx.fillText(`${card.element}元素`, 150, topY + 30)
  } else {
    ctx.fillText('大阿卡纳', 150, topY + 30)
  }

  // 中央符号区
  const centerY = 240
  ctx.globalAlpha = 0.15
  ctx.font = '120px serif'

  let symbol = '✦'
  if (isMajor) {
    symbol = majorSymbols[card.number] || '✦'
  } else if (card.type === 'number') {
    // 数字牌：画对应数量的小符号
    ctx.font = '24px serif'
    const n = card.number
    const sym = card.symbol || '✦'
    const positions = getNumberPositions(n)
    positions.forEach(([x, y]) => {
      ctx.fillText(sym, 150 + x, centerY + y)
    })
    symbol = ''
  } else if (card.type === 'court' && card.court) {
    symbol = courtSymbols[card.court] || '✦'
  } else if (card.symbol) {
    symbol = card.symbol
  }

  if (symbol) {
    ctx.font = '120px serif'
    ctx.fillText(symbol, 150, centerY + 30)
  }

  // 牌名
  ctx.globalAlpha = 0.9
  ctx.fillStyle = '#d4c5b2'
  ctx.font = 'bold 22px "Noto Serif SC", "Georgia", serif'
  ctx.fillText(card.name, 150, 380)

  // 英文名
  ctx.globalAlpha = 0.5
  ctx.font = 'italic 13px "Georgia", serif'
  ctx.fillText(card.nameEn, 150, 410)

  // 关键词
  if (card.keyword) {
    ctx.globalAlpha = 0.4
    ctx.font = '13px "Noto Serif SC", "Georgia", serif'
    ctx.fillText(card.keyword, 150, 440)
  }

  // 底部装饰线
  ctx.strokeStyle = colors[1]
  ctx.globalAlpha = 0.3
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(80, 460)
  ctx.lineTo(220, 460)
  ctx.stroke()

  return canvas.toDataURL('image/png')
}

function drawCorner(ctx, x, y, len, dx, dy) {
  ctx.beginPath()
  ctx.moveTo(x, y + len * dy)
  ctx.lineTo(x, y)
  ctx.lineTo(x + len * dx, y)
  ctx.stroke()
}

function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `rgb(${r},${g},${b})`
}

function getNumberPositions(n) {
  // 为数字牌生成符号排列位置
  const layouts = {
    1: [[0, 0]],
    2: [[0, -30], [0, 30]],
    3: [[0, -40], [0, 0], [0, 40]],
    4: [[-30, -30], [30, -30], [-30, 30], [30, 30]],
    5: [[-30, -30], [30, -30], [0, 0], [-30, 30], [30, 30]],
    6: [[-30, -40], [30, -40], [-30, 0], [30, 0], [-30, 40], [30, 40]],
    7: [[-30, -40], [30, -40], [-15, -10], [15, -10], [0, 10], [-30, 40], [30, 40]],
    8: [[-30, -40], [30, -40], [-30, -5], [30, -5], [-30, 20], [30, 20], [-30, 45], [30, 45]],
    9: [[-30, -40], [30, -40], [-30, -10], [30, -10], [0, 5], [-30, 25], [30, 25], [-30, 45], [30, 45]],
    10: [[-30, -45], [30, -45], [-30, -20], [30, -20], [-30, 5], [30, 5], [-30, 30], [30, 30], [-15, 45], [15, 45]],
  }
  return layouts[n] || [[0, 0]]
}

/**
 * 为所有牌批量生成图片并缓存
 */
const imageCache = {}

export function getCardImage(card, forceRegenerate = false) {
  if (!forceRegenerate && imageCache[card.id]) {
    return imageCache[card.id]
  }
  const img = generateCardImage(card)
  imageCache[card.id] = img
  return img
}

/**
 * 预生成所有图片（在后台进行）
 */
export function preGenerateAll(cards, onProgress) {
  let done = 0
  const total = cards.length
  cards.forEach(card => {
    // 使用 setTimeout 分片执行，不阻塞 UI
    setTimeout(() => {
      getCardImage(card)
      done++
      if (onProgress) onProgress(done, total)
    }, 0)
  })
}
