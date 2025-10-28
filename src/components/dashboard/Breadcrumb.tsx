import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb = ({ items, className }: BreadcrumbProps) => {
  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)}>
      <Home className="w-4 h-4 text-muted-foreground" />
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-muted-foreground hover:text-foreground transition-smooth"
            >
              {item.label}
            </button>
          ) : (
            <span className={cn(
              index === items.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};
