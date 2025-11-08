'use client'

import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey
        const altMatches = !!shortcut.altKey === event.altKey

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault()
          shortcut.action()
          break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export function useFocusManagement() {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
    }
  }

  const focusFirstInput = () => {
    const firstInput = document.querySelector('input, textarea, select, button') as HTMLElement
    if (firstInput) {
      firstInput.focus()
    }
  }

  const focusNextElement = () => {
    const focusableElements = document.querySelectorAll(
      'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
    )
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement)
    const nextIndex = (currentIndex + 1) % focusableElements.length
    ;(focusableElements[nextIndex] as HTMLElement)?.focus()
  }

  const focusPreviousElement = () => {
    const focusableElements = document.querySelectorAll(
      'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
    )
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement)
    const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
    ;(focusableElements[prevIndex] as HTMLElement)?.focus()
  }

  return {
    focusElement,
    focusFirstInput,
    focusNextElement,
    focusPreviousElement
  }
}