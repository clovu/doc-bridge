export function extractJSON(text: string): string[] {
  // Remove markdown code blocks
  const cleaned = text.replace(/```(?:json)?\s*\n?([\s\S]*?)\n?```/g, '$1')

  // Find the first [ and try to parse from there
  const startIndex = cleaned.indexOf('[')
  if (startIndex === -1) {
    // Check if there's a JSON object instead
    if (cleaned.includes('{')) {
      throw new Error('Expected JSON array, got object')
    }
    throw new Error('No JSON array found in response')
  }

  // Try to parse JSON starting from the first [
  // We'll try progressively longer substrings until we get valid JSON
  let parsed: unknown = null

  for (let endIndex = startIndex + 1; endIndex <= cleaned.length; endIndex++) {
    const candidate = cleaned.substring(startIndex, endIndex)
    if (candidate.endsWith(']')) {
      try {
        parsed = JSON.parse(candidate)
        break
      } catch {
        // Continue trying longer substrings
      }
    }
  }

  if (!parsed) {
    throw new Error('Failed to parse JSON array from response')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Expected JSON array, got ' + typeof parsed)
  }

  return parsed as string[]
}
