export const logError = (error, componentName = 'Unknown', context = {}) => {
  const errorData = {
    message: error.message || 'Unknown error',
    componentName,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    context
  };

  if (process.env.NODE_ENV === 'production') {
    // Send to your error tracking service
    console.error('Error logged:', errorData);
    // Example: sendToErrorService(errorData);
  } else {
    console.error(`Error in ${componentName}:`, error, context);
  }

  return errorData;
};

export const withErrorHandler = (fn, componentName) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, componentName);
      throw error;
    }
  };
};
