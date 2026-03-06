'use client'

interface Language {
  code: string
  label: string
}

interface Props {
  languages: Language[]
  value: string
  onChange: (code: string) => void
}

export function LanguageSelector({ languages, value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          className={`px-4 py-2 rounded-xl border text-sm text-left transition-colors ${
            value === lang.code
              ? 'bg-primary text-primary-foreground border-transparent'
              : 'border-border hover:bg-muted'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
