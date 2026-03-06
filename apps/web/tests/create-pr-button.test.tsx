import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { CreatePRButton } from '../src/components/create-pr-button'

describe('CreatePRButton', () => {
  it('should render with default text when not submitting', () => {
    const onClick = vi.fn()
    render(<CreatePRButton isSubmitting={false} onClick={onClick} />)

    expect(screen.getByRole('button', { name: /create pull request/i })).toBeInTheDocument()
  })

  it('should be enabled when not submitting', () => {
    const onClick = vi.fn()
    render(<CreatePRButton isSubmitting={false} onClick={onClick} />)

    const button = screen.getByRole('button', { name: /create pull request/i })
    expect(button).not.toBeDisabled()
  })

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<CreatePRButton isSubmitting={false} onClick={onClick} />)

    const button = screen.getByRole('button', { name: /create pull request/i })
    await user.click(button)

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should show loading state when submitting', () => {
    const onClick = vi.fn()
    render(<CreatePRButton isSubmitting={true} onClick={onClick} />)

    expect(screen.getByText(/creating pr/i)).toBeInTheDocument()
  })

  it('should be disabled when submitting', () => {
    const onClick = vi.fn()
    render(<CreatePRButton isSubmitting={true} onClick={onClick} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should show spinner with proper accessibility when submitting', () => {
    const onClick = vi.fn()
    render(<CreatePRButton isSubmitting={true} onClick={onClick} />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })

  it('should not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<CreatePRButton isSubmitting={true} onClick={onClick} />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(onClick).not.toHaveBeenCalled()
  })

  it('should respect additional disabled prop', () => {
    const onClick = vi.fn()
    render(<CreatePRButton isSubmitting={false} onClick={onClick} disabled={true} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should transition from normal to loading state', () => {
    const onClick = vi.fn()
    const { rerender } = render(<CreatePRButton isSubmitting={false} onClick={onClick} />)

    // Initial state
    expect(screen.getByRole('button', { name: /create pull request/i })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    // Loading state
    rerender(<CreatePRButton isSubmitting={true} onClick={onClick} />)
    expect(screen.getByText(/creating pr/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should transition from loading back to normal state', () => {
    const onClick = vi.fn()
    const { rerender } = render(<CreatePRButton isSubmitting={true} onClick={onClick} />)

    // Loading state
    expect(screen.getByText(/creating pr/i)).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Back to normal
    rerender(<CreatePRButton isSubmitting={false} onClick={onClick} />)
    expect(screen.getByRole('button', { name: /create pull request/i })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
