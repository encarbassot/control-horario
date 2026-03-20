import { useRouteError, useNavigate } from 'react-router-dom';
import './RouteError.css';
import { useTranslation } from 'react-i18next';

export default function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { t } = useTranslation();

  console.error('Route error:', error);

  const extractComponentName = (error) => {
    if (!error?.stack) return null;

    // Try to extract component name from stack trace
    const lines = error.stack.split('\n');
    
    // Look for React component patterns in the stack
    for (const line of lines) {
      // Match patterns like "at ComponentName" or "at ComponentName ("
      const match = line.match(/at (\w+)/);
      if (match && match[1]) {
        const name = match[1];
        // Filter out common non-component names
        if (
          name !== 'eval' &&
          name !== 'Object' &&
          name !== 'new' &&
          name !== 'Timeout' &&
          name !== 'Array' &&
          !name.startsWith('_') &&
          name[0] === name[0].toUpperCase() // React components start with uppercase
        ) {
          return name;
        }
      }
    }

    return null;
  };

  const componentName = extractComponentName(error);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="route-error">
      <div className="route-error__content">
        <div className="route-error__icon">⚠️</div>
        <h1>{t('components.route_error.title')}</h1>
        <p className="route-error__message">
          {error?.statusText || error?.message || t('components.route_error.default_message')}
        </p>

        {componentName && (
          <div className="route-error__component-info">
            <h3>{t('components.route_error.affected_component')}</h3>
            <code className="route-error__component-name">
              {componentName}
            </code>
          </div>
        )}

        {process.env.NODE_ENV !== 'production' && error && (
          <details className="route-error__debug">
            <summary>{t('components.route_error.error_details')}</summary>
            <pre className="route-error__debug-content">
              {error?.stack || JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}

        <div className="route-error__actions">
          <button onClick={handleGoHome} className="route-error__btn">
            {t('components.route_error.go_home')}
          </button>
          <button onClick={handleReload} className="route-error__btn route-error__btn--secondary">
            {t('components.route_error.reload')}
          </button>
        </div>
      </div>
    </div>
  );
}
