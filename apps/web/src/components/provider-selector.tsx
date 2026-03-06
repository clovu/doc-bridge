'use client'

import { Input } from '@/components/ui/input'
import type { ProviderConfig, ProviderField } from '@docbridge/ai'

export interface ProviderOption {
  id: string
  label: string
  fields: ProviderField[]
}

interface Props {
  providers: ProviderOption[]
  value: ProviderConfig
  onChange: (config: ProviderConfig) => void
}

export function ProviderSelector({ providers, value, onChange }: Props) {
  const selected = providers.find(p => p.id === value.id)

  function handleCardClick(id: string) {
    if (id === value.id) return
    onChange({ id })
  }

  function handleFieldChange(key: 'apiKey' | 'baseURL' | 'model', fieldValue: string) {
    onChange({ ...value, [key]: fieldValue })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {providers.map(p => (
          <button
            key={p.id}
            onClick={() => handleCardClick(p.id)}
            className={`px-4 py-2 rounded-xl border text-sm text-left transition-colors ${
              value.id === p.id
                ? 'bg-primary text-primary-foreground border-transparent'
                : 'border-border hover:bg-muted'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {selected && selected.fields.length > 0 && (
        <div className="space-y-3">
          {selected.fields.map(field => (
            <div key={field.key}>
              <p className="text-sm font-medium mb-2">{field.label}</p>
              <Input
                type={field.secret ? 'password' : 'text'}
                placeholder={field.placeholder}
                value={value[field.key] ?? ''}
                onChange={e => handleFieldChange(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
