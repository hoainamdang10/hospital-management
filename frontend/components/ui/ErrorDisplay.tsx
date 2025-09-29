import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { useVietnameseError } from '../../hooks/useVietnameseError';

interface ErrorDisplayProps {
  error?: string | { message: string; code?: string };
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'inline' | 'toast' | 'banner';
  showIcon?: boolean;
  showDismiss?: boolean;
  showRetry?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = '',
  variant = 'inline',
  showIcon = true,
  showDismiss = true,
  showRetry = false
}) => {
  const { formatError } = useVietnameseError();

  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorCode = typeof error === 'object' ? error.code : undefined;
  const formattedMessage = formatError(errorMessage);

  const baseClasses = 'flex items-start gap-3 p-4 rounded-lg border';
  const variantClasses = {
    inline: 'bg-red-50 border-red-200 text-red-800',
    toast: 'bg-white border-red-300 shadow-lg text-red-800',
    banner: 'bg-red-100 border-red-300 text-red-900'
  };

  const iconClasses = {
    inline: 'text-red-500',
    toast: 'text-red-500',
    banner: 'text-red-600'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {showIcon && (
        <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconClasses[variant]}`} />
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-5">
          {formattedMessage}
        </p>
        
        {errorCode && (
          <p className="text-xs mt-1 opacity-75">
            Mã lỗi: {errorCode}
          </p>
        )}
        
        {(showRetry || onRetry) && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 mt-2 text-xs font-medium hover:underline focus:outline-none focus:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Thử lại
          </button>
        )}
      </div>
      
      {showDismiss && onDismiss && (
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 p-1 rounded-md hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${iconClasses[variant]}`}
          aria-label="Đóng thông báo lỗi"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Toast Error Component for global error handling
interface ErrorToastProps {
  isVisible: boolean;
  error?: string | { message: string; code?: string };
  onDismiss: () => void;
  onRetry?: () => void;
  duration?: number;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  isVisible,
  error,
  onDismiss,
  onRetry,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onDismiss]);

  if (!isVisible || !error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2">
      <ErrorDisplay
        error={error}
        variant="toast"
        onDismiss={onDismiss}
        onRetry={onRetry}
        showRetry={!!onRetry}
      />
    </div>
  );
};

// Form Error Component for inline form validation
interface FormErrorProps {
  error?: string;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ error, className = '' }) => {
  const { formatError } = useVietnameseError();

  if (!error) return null;

  return (
    <div className={`flex items-center gap-2 mt-1 text-sm text-red-600 ${className}`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{formatError(error)}</span>
    </div>
  );
};

// Page Error Component for full page errors
interface PageErrorProps {
  error?: string | { message: string; code?: string };
  onRetry?: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export const PageError: React.FC<PageErrorProps> = ({
  error,
  onRetry,
  title,
  description,
  className = ''
}) => {
  const { formatError } = useVietnameseError();

  const errorMessage = error ? (typeof error === 'string' ? error : error.message) : '';
  const formattedMessage = errorMessage ? formatError(errorMessage) : '';

  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] p-8 text-center ${className}`}>
      <div className="w-16 h-16 mb-4 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {title || 'Đã xảy ra lỗi'}
      </h2>
      
      {(description || formattedMessage) && (
        <p className="text-gray-600 mb-6 max-w-md">
          {description || formattedMessage}
        </p>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </button>
      )}
    </div>
  );
};

// Loading Error Component for async operations
interface LoadingErrorProps {
  isLoading: boolean;
  error?: string | { message: string; code?: string };
  onRetry?: () => void;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export const LoadingError: React.FC<LoadingErrorProps> = ({
  isLoading,
  error,
  onRetry,
  children,
  loadingComponent
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        {loadingComponent || (
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Đang tải...</span>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <PageError
        error={error}
        onRetry={onRetry}
        title="Không thể tải dữ liệu"
        description="Vui lòng thử lại hoặc liên hệ hỗ trợ kỹ thuật nếu lỗi vẫn tiếp tục."
      />
    );
  }

  return <>{children}</>;
};
