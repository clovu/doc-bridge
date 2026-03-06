'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface CreatePRButtonProps {
  isSubmitting: boolean
  onClick: () => void
  disabled?: boolean
}

export function CreatePRButton({ isSubmitting, onClick, disabled }: CreatePRButtonProps) {
  return (
    <Button onClick={onClick} disabled={isSubmitting || disabled}>
      {isSubmitting ? (
        <>
          <Spinner className="mr-2" /> Creating PR...
        </>
      ) : (
        'Create Pull Request'
      )}
    </Button>
  )
}
