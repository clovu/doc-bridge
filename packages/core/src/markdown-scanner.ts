const MARKDOWN_EXTENSIONS = ['.md', '.mdx'] as const

export function scanMarkdownFiles(filePaths: readonly string[]): string[] {
  return filePaths.filter((p) =>
    MARKDOWN_EXTENSIONS.some((ext) => {
      const name = p.split('/').at(-1) ?? p
      return name.endsWith(ext)
    }),
  )
}
