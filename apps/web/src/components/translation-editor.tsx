'use client'

import { Textarea } from '@/components/ui/textarea'

interface Props {
  label: string
  value: string
  readOnly?: boolean
  onChange?: (value: string) => void
}

export function TranslationEditor({ label, value, readOnly = false, onChange }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b bg-muted/30">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1 p-4">
        {readOnly ? (
          <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed h-full overflow-auto">
            {value}
          </pre>
        ) : (
          <Textarea
            value={value}
            onChange={e => onChange?.(e.target.value)}
            className="h-full min-h-[60vh] font-mono text-sm rounded-xl resize-none"
          />
        )}
      </div>
    </div>
  )
}
