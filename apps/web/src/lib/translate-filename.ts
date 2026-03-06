export function translateFilename(filePath: string, locale: string): string {
  const dot = filePath.lastIndexOf('.')
  if (dot === -1) return `${filePath}.${locale}`
  return `${filePath.slice(0, dot)}.${locale}${filePath.slice(dot)}`
}
