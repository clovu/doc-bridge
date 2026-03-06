/**
 * Remove all occurrences of fileToRemove from the files array.
 * Returns a new array without mutating the original.
 */
export function removeFile(files: string[], fileToRemove: string): string[] {
  return files.filter(f => f !== fileToRemove)
}
