import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: 'react' | 'network' | 'unknown';
}

/**
 * ErrorBoundary Component
 *
 * Catches React errors gracefully and displays user-friendly error messages.
 * Provides recovery options and logs errors for debugging.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorType: 'unknown'
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Determine error type based on error message/properties
    let errorType: State['errorType'] = 'unknown';

    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      errorType = 'network';
    } else if (error.name === 'ChunkLoadError' || error.message?.includes('Failed to fetch dynamically imported module')) {
      errorType = 'network';
    } else {
      errorType = 'react';
    }

    return { hasError: true, error, errorType };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you could send this to an error tracking service like Sentry
    // Example: Sentry.captureException(error, { extra: errorInfo });

    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown'
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/admin';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorType } = this.state;

      // Network error display
      if (errorType === 'network') {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
            <Card className="max-w-lg w-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                    <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                  </div>
                  <div>
                    <CardTitle>Connection Error</CardTitle>
                    <CardDescription>Unable to load the requested resource</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We're having trouble connecting to the server. This could be due to:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Slow or unstable internet connection</li>
                  <li>Server maintenance or temporary outage</li>
                  <li>Browser cache or extension conflicts</li>
                </ul>
                {process.env.NODE_ENV === 'development' && error && (
                  <details className="mt-4 p-3 bg-muted rounded-lg">
                    <summary className="cursor-pointer text-sm font-medium">Error Details</summary>
                    <pre className="mt-2 text-xs overflow-auto">
                      {error.toString()}
                    </pre>
                  </details>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button onClick={this.handleReload} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </CardFooter>
            </Card>
          </div>
        );
      }

      // React error display
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 dark:bg-destructive/20 rounded-full">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Something Went Wrong</CardTitle>
                  <CardDescription>The application encountered an unexpected error</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We apologize for the inconvenience. An unexpected error has occurred.
                You can try refreshing the page or returning to the home screen.
              </p>
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-4 p-3 bg-muted rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium">Error Details (Development Mode)</summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs font-semibold mb-1">Error Message:</p>
                      <pre className="text-xs overflow-auto bg-background p-2 rounded">
                        {error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Component Stack:</p>
                        <pre className="text-xs overflow-auto bg-background p-2 rounded max-h-48">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline">
                <Home className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based wrapper for functional components that need error boundary functionality
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
