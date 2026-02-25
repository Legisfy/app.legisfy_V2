import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('🔴 ErrorBoundary caught an error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontFamily: 'system-ui, sans-serif',
                    padding: '2rem',
                }}>
                    <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                            Ops! Algo deu errado
                        </h1>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                            Ocorreu um erro inesperado. Tente recarregar a página.
                        </p>
                        <pre style={{
                            backgroundColor: '#1e293b',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            textAlign: 'left',
                            overflow: 'auto',
                            maxHeight: '200px',
                            color: '#f87171',
                            marginBottom: '1.5rem',
                        }}>
                            {this.state.error?.message}
                            {'\n\n'}
                            {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                padding: '0.75rem 2rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: '500',
                            }}
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
