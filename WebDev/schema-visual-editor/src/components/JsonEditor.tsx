'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { AlertCircle, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JsonError {
  line: number
  column: number
  message: string
}

interface JsonEditorProps {
  value: string
  onChange: (value: string) => void
  error?: JsonError | null
  onAutofix?: () => void
  className?: string
  placeholder?: string
}

export function JsonEditor({ 
  value, 
  onChange, 
  error,
  onAutofix,
  className,
  placeholder = "Enter JSON here..."
}: JsonEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [lineCount, setLineCount] = useState(1)

  // Update line count when value changes
  useEffect(() => {
    const lines = value.split('\n').length
    setLineCount(Math.max(lines, 20)) // Minimum 20 lines for better UX
  }, [value])

  // Sync scrolling between textarea and line numbers
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }, [])

  // Jump to error line
  const jumpToError = useCallback(() => {
    if (!error || !textareaRef.current) return

    const lines = value.split('\n')
    let position = 0
    
    // Calculate position up to error line
    for (let i = 0; i < error.line - 1 && i < lines.length; i++) {
      position += lines[i].length + 1 // +1 for newline
    }
    
    // Add column position
    if (error.line - 1 < lines.length) {
      position += Math.min(error.column - 1, lines[error.line - 1].length)
    }

    // Set cursor position and scroll into view
    textareaRef.current.setSelectionRange(position, position)
    textareaRef.current.focus()
    
    // Scroll to make error visible (centered if possible)
    const lineHeight = 24 // Approximate line height in pixels
    const errorLineTop = (error.line - 1) * lineHeight
    const viewportHeight = textareaRef.current.clientHeight
    const scrollTo = Math.max(0, errorLineTop - viewportHeight / 2)
    
    textareaRef.current.scrollTop = scrollTo
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTo
    }
  }, [error, value])

  return (
    <div className={cn("relative flex flex-col h-full", className)}>
      {/* Error banner */}
      {error && (
        <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              JSON Error at line {error.line}, column {error.column}
            </p>
            <p className="text-sm text-red-700 mt-1">{error.message}</p>
          </div>
          <div className="flex gap-2">
            {onAutofix && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAutofix}
                className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
              >
                <Wand2 className="w-4 h-4 mr-1" />
                Autofix
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={jumpToError}
              className="text-red-700 hover:text-red-800 hover:bg-red-100"
            >
              Jump to Error
            </Button>
          </div>
        </div>
      )}

      {/* Editor container */}
      <div className="flex-1 flex border rounded-lg overflow-hidden bg-gray-50">
        {/* Line numbers */}
        <div 
          ref={lineNumbersRef}
          className="select-none bg-gray-100 text-gray-500 text-right font-mono text-sm border-r overflow-hidden"
          style={{ 
            width: '50px',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div className="py-3 px-2">
            {Array.from({ length: lineCount }, (_, i) => (
              <div 
                key={i + 1} 
                className={cn(
                  "leading-6 pr-2",
                  error && error.line === i + 1 && "bg-red-200 text-red-700 font-semibold"
                )}
                style={{ height: '24px' }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            className={cn(
              "absolute inset-0 w-full h-full font-mono text-sm border-0 resize-none focus-visible:ring-0 bg-white p-3 leading-6",
              error && "text-red-900"
            )}
            placeholder={placeholder}
            spellCheck={false}
            style={{
              lineHeight: '24px',
              tabSize: 2
            }}
          />
          
          {/* Error highlight overlay */}
          {error && (
            <div 
              className="absolute left-0 right-0 bg-red-100 opacity-30 pointer-events-none"
              style={{
                top: `${(error.line - 1) * 24 + 12}px`,
                height: '24px'
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}