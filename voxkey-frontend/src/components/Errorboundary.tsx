import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h1>Oops! Une erreur s'est produite</h1>
            <p className="error-message">
              {this.state.error?.message || 'Une erreur inattendue s\'est produite'}
            </p>
            <details className="error-details">
              <summary>Détails techniques</summary>
              <pre>{this.state.error?.stack}</pre>
            </details>
            <div className="error-actions">
              <button onClick={this.resetError} className="btn-retry">
                Réessayer
              </button>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="btn-home"
              >
                Retourner au tableau de bord
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