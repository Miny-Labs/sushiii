'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CopyButton from './CopyButton'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorId?: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; errorId: string; retry: () => void }>
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorId) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent 
            error={this.state.error} 
            errorId={this.state.errorId}
            retry={this.handleRetry}
          />
        )
      }

      return (
        <Card className="border border-black">
          <CardHeader>
            <CardTitle className="font-sansation font-bold text-xl text-red-600">
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="font-zalando-expanded font-medium text-sm mb-2">Error ID</div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm">{this.state.errorId}</span>
                  <CopyButton text={this.state.errorId} />
                </div>
              </div>
              
              <div>
                <div className="font-zalando-expanded font-medium text-sm mb-2">Error Details</div>
                <div className="bg-black/5 p-3 border border-black/20">
                  <pre className="font-mono text-xs whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={this.handleRetry}
                  className="bg-black text-white hover:bg-black/80"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => {
                    const errorDetails = `Error ID: ${this.state.errorId}\nMessage: ${this.state.error?.message}\nStack: ${this.state.error?.stack}`
                    navigator.clipboard.writeText(errorDetails)
                  }}
                  variant="outline"
                  className="border-black hover:bg-black hover:text-white"
                >
                  Copy Error Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}