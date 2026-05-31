import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-canvas px-6">
      <h1 className="text-base font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
