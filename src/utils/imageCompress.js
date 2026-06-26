/**
 * 压缩图片，返回 base64 数据 URL。
 * 解决 localStorage 5MB 配额限制导致大图存储失败的问题。
 *
 * @param {File|Blob} file - 原始图片文件
 * @param {Object} options
 * @param {number} [options.maxWidth=800] - 最大宽度（等比缩放）
 * @param {number} [options.maxHeight=800] - 最大高度
 * @param {number} [options.quality=0.7] - JPEG 质量 0-1
 * @returns {Promise<string>} base64 data URL
 */
export function compressImage(file, options = {}) {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7,
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 计算缩放比例
        let { width, height } = img
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        // Canvas 压缩
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // 导出为 JPEG（base64），比 PNG 小得多
        const dataUrl = canvas.toDataURL('image/jpeg', quality)

        // 如果压缩后仍然太大（>2MB），再降质量
        if (dataUrl.length > 2 * 1024 * 1024 && quality > 0.3) {
          console.warn('[compressImage] 压缩后仍超过2MB，进一步降低质量...')
          resolve(canvas.toDataURL('image/jpeg', 0.4))
        } else {
          resolve(dataUrl)
        }
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}
