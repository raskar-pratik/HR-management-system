import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console in development
        console.error('Error Boundary caught an error:', error, errorInfo);

        this.setState({ errorInfo });

        // In production, you could send this to an error tracking service
        // logErrorToService(error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <div className="error-icon">
                            <AlertTriangle size={64} />
                        </div>
                        <h1>Oops! Something went wrong</h1>
                        <p className="error-message">
                            We're sorry, but something unexpected happened.
                            Please try again or contact support if the problem persists.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="error-details">
                                <h3>
                                    <Bug size={16} />
                                    Error Details (Development Only)
                                </h3>
                                <pre>{this.state.error.toString()}</pre>
                                {this.state.errorInfo && (
                                    <pre className="stack-trace">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div className="error-actions">
                            <button onClick={this.handleRetry} className="btn-retry">
                                <RefreshCw size={18} />
                                Try Again
                            </button>
                            <button onClick={this.handleGoHome} className="btn-home">
                                <Home size={18} />
                                Go to Dashboard
                            </button>
                            <button onClick={this.handleReload} className="btn-reload">
                                <RefreshCw size={18} />
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
