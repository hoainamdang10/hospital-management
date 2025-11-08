import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'Không có dữ liệu',
  description = 'Chưa có dữ liệu để hiển thị',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-6">
        {icon || <FileQuestion className="h-12 w-12 text-gray-400" />}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mb-6 max-w-md text-gray-600">{description}</p>
      {action}
    </div>
  );
}
