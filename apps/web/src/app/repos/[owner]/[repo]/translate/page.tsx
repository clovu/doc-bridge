'use client'

import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { LanguageSelector } from '@/components/language-selector'
import { ProviderSelector } from '@/components/provider-selector'
import type { ProviderOption } from '@/components/provider-selector'
import type { ProviderConfig } from '@docbridge/ai'
import { removeFile } from '@docbridge/core'

const SUPPORTED_LANGUAGES = [
  { code: 'zh', label: 'Chinese (Simplified)' },
  { code: 'zh-TW', label: 'Chinese (Traditional)' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
]

const PROVIDERS: ProviderOption[] = [
  {
    id: 'claude',
    label: 'Claude (Anthropic)',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        required: false,
        secret: true,
        placeholder: 'Uses ANTHROPIC_API_KEY if not provided',
      },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    fields: [
      { key: 'apiKey', label: 'API Key', required: true, secret: true, placeholder: 'sk-...' },
      { key: 'model', label: 'Model', required: false, secret: false, placeholder: 'gpt-4o' },
    ],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    fields: [
      { key: 'apiKey', label: 'API Key', required: true, secret: true, placeholder: 'sk-...' },
      { key: 'model', label: 'Model', required: false, secret: false, placeholder: 'deepseek-reasoner | deepseek-chat' },
    ],
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    fields: [
      { key: 'apiKey', label: 'API Key', required: true, secret: true },
      { key: 'baseURL', label: 'Base URL', required: true, secret: false, placeholder: 'https://...' },
      { key: 'model', label: 'Model', required: false, secret: false },
    ],
  },
]

function isProviderConfigValid(config: ProviderConfig): boolean {
  const provider = PROVIDERS.find(p => p.id === config.id)
  if (!provider) return false
  return provider.fields
    .filter(f => f.required)
    .every(f => Boolean(config[f.key]))
}

export default function TranslatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { owner, repo } = useParams<{ owner: string; repo: string }>()
  const [selectedFiles, setSelectedFiles] = useState<string[]>(() => searchParams.getAll('file'))
  const [targetLocale, setTargetLocale] = useState('')
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>({ id: 'claude' })
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleTranslate() {
    if (!targetLocale || selectedFiles.length === 0) return

    setIsTranslating(true)
    setError(null)

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, files: selectedFiles, targetLocale, provider: providerConfig }),
      })

      if (!response.ok) throw new Error('Translation failed')

      const data = await response.json() as { results: unknown[] }

      sessionStorage.setItem('translationResults', JSON.stringify(data.results))
      sessionStorage.setItem('translationMeta', JSON.stringify({ owner, repo, targetLocale }))

      router.push(`/repos/${owner}/${repo}/review`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsTranslating(false)
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-6">Translation Settings</h1>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Selected files ({selectedFiles.length})</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {selectedFiles.map(f => (
                <li key={f} className="flex items-center justify-between">
                  <span>{f}</span>
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => setSelectedFiles(removeFile(selectedFiles, f))}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Target language</p>
            <LanguageSelector
              languages={SUPPORTED_LANGUAGES}
              value={targetLocale}
              onChange={setTargetLocale}
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">AI provider</p>
            <ProviderSelector
              providers={PROVIDERS}
              value={providerConfig}
              onChange={setProviderConfig}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button
            onClick={handleTranslate}
            disabled={!targetLocale || isTranslating || !isProviderConfigValid(providerConfig)}
          >
            {isTranslating ? (
              <><Spinner className="mr-2" /> Translating...</>
            ) : (
              'Translate'
            )}
          </Button>
        </div>
      </div>
    </main>
  )
}
