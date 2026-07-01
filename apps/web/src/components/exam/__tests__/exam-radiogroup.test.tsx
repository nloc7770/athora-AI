import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Isolated test for the exam answer options radiogroup behavior.
 * Tests roving tabindex and ArrowDown keyboard navigation.
 *
 * We render a minimal replica of the radiogroup from exam-page.tsx
 * to unit-test the accessibility contract without needing the full
 * page context (router, API, framer-motion, etc.).
 */

interface OptionCardProps {
  index: number
  option: string
  isSelected: boolean
  isFocused: boolean
  onSelect: (index: number) => void
  onFocus: (index: number) => void
  onKeyDown: (e: React.KeyboardEvent, index: number) => void
}

function OptionCard({
  index,
  option,
  isSelected,
  isFocused,
  onSelect,
  onFocus,
  onKeyDown,
}: OptionCardProps) {
  const letter = String.fromCharCode(65 + index)

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      tabIndex={isFocused ? 0 : -1}
      onClick={() => onSelect(index)}
      onFocus={() => onFocus(index)}
      onKeyDown={(e) => onKeyDown(e, index)}
      data-testid={`option-${index}`}
    >
      <span>{letter}</span>
      <span>{option}</span>
    </div>
  )
}

interface ExamRadioGroupProps {
  options: string[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

function ExamRadioGroup({ options, selectedIndex, onSelect }: ExamRadioGroupProps) {
  const [focusedIndex, setFocusedIndex] = React.useState<number>(selectedIndex ?? 0)

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    let nextIndex: number | null = null

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        nextIndex = (index + 1) % options.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        nextIndex = (index - 1 + options.length) % options.length
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect(index)
        return
    }

    if (nextIndex !== null) {
      setFocusedIndex(nextIndex)
      const el = document.querySelector(`[data-testid="option-${nextIndex}"]`) as HTMLElement
      el?.focus()
    }
  }

  return (
    <div role="radiogroup" aria-label="Answer options">
      {options.map((option, index) => (
        <OptionCard
          key={index}
          index={index}
          option={option}
          isSelected={selectedIndex === index}
          isFocused={index === focusedIndex}
          onSelect={(i) => {
            onSelect(i)
            setFocusedIndex(i)
          }}
          onFocus={setFocusedIndex}
          onKeyDown={handleKeyDown}
        />
      ))}
    </div>
  )
}

import React from 'react'

const OPTIONS = ['Photosynthesis', 'Respiration', 'Osmosis', 'Diffusion']

describe('ExamRadioGroup', () => {
  describe('roving tabIndex', () => {
    it('only the focused option has tabIndex={0}, others have tabIndex={-1}', () => {
      render(
        <ExamRadioGroup options={OPTIONS} selectedIndex={null} onSelect={vi.fn()} />
      )

      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(4)

      // First option is focused by default when nothing is selected
      expect(radios[0]).toHaveAttribute('tabindex', '0')
      expect(radios[1]).toHaveAttribute('tabindex', '-1')
      expect(radios[2]).toHaveAttribute('tabindex', '-1')
      expect(radios[3]).toHaveAttribute('tabindex', '-1')
    })

    it('selected option has tabIndex={0}, others have tabIndex={-1}', () => {
      render(
        <ExamRadioGroup options={OPTIONS} selectedIndex={2} onSelect={vi.fn()} />
      )

      const radios = screen.getAllByRole('radio')

      expect(radios[0]).toHaveAttribute('tabindex', '-1')
      expect(radios[1]).toHaveAttribute('tabindex', '-1')
      expect(radios[2]).toHaveAttribute('tabindex', '0')
      expect(radios[3]).toHaveAttribute('tabindex', '-1')
    })
  })

  describe('ArrowDown navigation', () => {
    it('pressing ArrowDown moves focus to the next option', async () => {
      const user = userEvent.setup()

      render(
        <ExamRadioGroup options={OPTIONS} selectedIndex={null} onSelect={vi.fn()} />
      )

      const radios = screen.getAllByRole('radio')

      // Focus the first option
      radios[0].focus()
      expect(radios[0]).toHaveFocus()

      // Press ArrowDown
      await user.keyboard('{ArrowDown}')

      // Second option should now be focused
      expect(radios[1]).toHaveFocus()
      expect(radios[1]).toHaveAttribute('tabindex', '0')
      expect(radios[0]).toHaveAttribute('tabindex', '-1')
    })

    it('pressing ArrowDown wraps from last to first option', async () => {
      const user = userEvent.setup()

      render(
        <ExamRadioGroup options={OPTIONS} selectedIndex={3} onSelect={vi.fn()} />
      )

      const radios = screen.getAllByRole('radio')

      // Focus the last option
      radios[3].focus()
      expect(radios[3]).toHaveFocus()

      // Press ArrowDown
      await user.keyboard('{ArrowDown}')

      // First option should now be focused (wrap around)
      expect(radios[0]).toHaveFocus()
      expect(radios[0]).toHaveAttribute('tabindex', '0')
      expect(radios[3]).toHaveAttribute('tabindex', '-1')
    })
  })
})
