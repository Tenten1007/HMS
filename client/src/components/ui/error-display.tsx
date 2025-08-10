import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "./button";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
  error?: Error | string | null;
  title?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  className?: string;
  showHomeButton?: boolean;
}

export const ErrorDisplay = ({ 
  error, 
  title = "เกิดข้อผิดพลาด",
  onRetry,
  onGoHome,
  className,
  showHomeButton = false
}: ErrorDisplayProps) => {
  const errorMessage = typeof error === 'string' ? error : error?.message || "ไม่สามารถโหลดข้อมูลได้";

  return (
    <div className={cn("flex items-center justify-center min-h-[200px]", className)}>
      <Alert className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-red-600">{title}</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-gray-600">{errorMessage}</p>
          <div className="flex gap-2">
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                ลองใหม่
              </Button>
            )}
            {(showHomeButton || onGoHome) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onGoHome}
                className="text-gray-600 hover:text-gray-700"
              >
                <Home className="mr-1 h-3 w-3" />
                กลับหน้าหลัก
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export const ErrorBoundary = ({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}) => {
  return (
    <div>
      {children}
    </div>
  );
};