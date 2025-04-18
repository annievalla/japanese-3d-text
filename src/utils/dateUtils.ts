/**
 * Interface representing Japanese date components
 */
export interface JapaneseDate {
  firstLine: string
  secondLine: string
}

/**
 * Gets the current date formatted in Japanese style
 * Returns the date split into two lines for display
 */
export function getCurrentDateInJapanese(): JapaneseDate {
  const today = new Date()
  const month = today.getMonth() + 1 // getMonth is 0-indexed
  const day = today.getDate()

  return {
    firstLine: '今日は',
    secondLine: `${month}月${day}日`,
  }
}
