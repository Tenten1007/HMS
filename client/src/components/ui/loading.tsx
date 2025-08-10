import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export const Loading = ({ size = "md", text, className }: LoadingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-2", className)}>
      <div 
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size]
        )}
      />
      {text && (
        <p className="text-sm text-gray-500 animate-pulse">{text}</p>
      )}
    </div>
  );
};

export const LoadingOverlay = ({ text = "กำลังโหลด..." }: { text?: string }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <Loading size="lg" text={text} />
    </div>
  );
};

export const LoadingCard = ({ text = "กำลังโหลดข้อมูล..." }: { text?: string }) => {
  return (
    <div className="flex items-center justify-center min-h-[200px] rounded-lg border bg-card p-8">
      <Loading size="md" text={text} />
    </div>
  );
};