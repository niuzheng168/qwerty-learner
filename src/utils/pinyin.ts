export type CharPinyinPair = {
  character: string
  pinyin: string
}

/**
 * Parse Chinese notation format "谢(xiè)谢(xie)" into character-pinyin pairs
 * @param notation - The notation string in format "字(pīn)字(yīn)"
 * @returns Array of character-pinyin pairs
 */
export function parseChineseNotation(notation: string): CharPinyinPair[] {
  const re = /(.+?)\((.+?)\)/g
  const pairs: CharPinyinPair[] = []
  let match
  while ((match = re.exec(notation))) {
    pairs.push({ character: match[1], pinyin: match[2] })
  }
  return pairs
}

/**
 * Remove tone marks from pinyin for comparison
 * @param pinyin - Pinyin string with possible tone marks
 * @returns Normalized pinyin without tone marks
 */
export function normalizePinyin(pinyin: string): string {
  const toneMap: Record<string, string> = {
    ā: 'a',
    á: 'a',
    ǎ: 'a',
    à: 'a',
    ē: 'e',
    é: 'e',
    ě: 'e',
    è: 'e',
    ī: 'i',
    í: 'i',
    ǐ: 'i',
    ì: 'i',
    ō: 'o',
    ó: 'o',
    ǒ: 'o',
    ò: 'o',
    ū: 'u',
    ú: 'u',
    ǔ: 'u',
    ù: 'u',
    ǖ: 'v',
    ǘ: 'v',
    ǚ: 'v',
    ǜ: 'v',
    ü: 'v',
  }
  return pinyin
    .split('')
    .map((c) => toneMap[c] || c)
    .join('')
    .toLowerCase()
}

/**
 * Check if typed pinyin matches expected pinyin (ignoring tones)
 * @param typed - The pinyin typed by user
 * @param expected - The expected pinyin
 * @returns True if they match (case-insensitive, tone-insensitive)
 */
export function isPinyinMatch(typed: string, expected: string): boolean {
  return normalizePinyin(typed) === normalizePinyin(expected)
}
