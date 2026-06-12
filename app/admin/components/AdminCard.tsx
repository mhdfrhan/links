interface AdminCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function AdminCard({ children, title, description, className = "" }: AdminCardProps) {
  return (
    <div className={`relative overflow-hidden  border border-border bg-card/40 backdrop-blur-md shadow-sm transition-all duration-300 ${className}`}>
      {(title || description) && (
        <div className="px-5 py-4 border-b border-border/50">
          {title && <h3 className="text-base font-semibold text-foreground leading-none">{title}</h3>}
          {description && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{description}</p>}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}
