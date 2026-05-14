export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 px-4 pt-6 pb-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
