import { Component } from 'react';
import './ErrorBoundary.css';
import { withTranslation } from 'react-i18next';
import log from '../../utils/log';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      componentStack: []
    };
  }

  static getDerivedStateFromError(error) {
    log('ErrorBoundary caught error:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    log('ErrorBoundary componentDidCatch:', error, errorInfo);
    // Extract component names from component stack
    const componentStack = this.extractComponentNames(errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo,
      componentStack
    });

    // Log to your error tracking service in production
    this.logErrorToService(error, componentStack);
  }

  extractComponentNames(componentStack) {
    if (!componentStack) return [];
    
    // Extract component names from the stack
    const lines = componentStack.split('\n');
    const components = lines
      .filter(line => line.trim().startsWith('at '))
      .map(line => {
        // Extract component name (between "at " and first space or parenthesis)
        const match = line.match(/at (\w+)/);
        return match ? match[1] : null;
      })
      .filter(name => name && name !== 'div' && name !== 'span'); // Filter out HTML elements
    
    return [...new Set(components)]; // Remove duplicates
  }

  logErrorToService(error, componentStack) {
    const errorData = {
      message: error.message,
      name: error.name,
      componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In production, send to your error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to your API or service like Sentry
      console.error('Production Error:', errorData);
      // fetch('/api/log-error', { method: 'POST', body: JSON.stringify(errorData) });
    } else {
      console.error('Development Error:', error, errorData);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, componentStack: [] });
  };

  render() {
    if (this.state.hasError) {
      const isProduction = process.env.NODE_ENV === 'production';
      const { componentStack, error } = this.state;
      const { t } = this.props;

      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <div className="error-boundary__icon">⚠️</div>
            <h1>{t('components.error_boundary.title')}</h1>
            <p className="error-boundary__message">
              {t('components.error_boundary.message')}
            </p>

            {componentStack.length > 0 && (
              <div className="error-boundary__details">
                <h3>{t('components.error_boundary.affected_component')}</h3>
                <code className="error-boundary__component">
                  {componentStack[0]}
                </code>
              </div>
            )}

            {!isProduction && error && (
              <details className="error-boundary__debug">
                <summary>{t('components.error_boundary.dev_info')}</summary>
                <div className="error-boundary__debug-content">
                  <p><strong>{t('components.error_boundary.error_label')}</strong> {error.message}</p>
                  <p><strong>{t('components.error_boundary.component_stack')}</strong></p>
                  <ul>
                    {componentStack.map((comp, i) => (
                      <li key={i}>{comp}</li>
                    ))}
                  </ul>
                </div>
              </details>
            )}

            <div className="error-boundary__actions">
              <button onClick={this.handleGoBack} className="error-boundary__btn">
                {t('components.error_boundary.retry')}
              </button>
              <button onClick={this.handleReload} className="error-boundary__btn error-boundary__btn--secondary">
                {t('components.error_boundary.reload')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
