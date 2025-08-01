
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LineChart,
  Newspaper,
  Package2,
  Settings,
  Star,
  BarChart,
  Users,
  BookText,
  Bot,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NavItem {
    href: string;
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
}

interface SidebarProps {
    onBriefingClick: () => void;
}

export default function Sidebar({ onBriefingClick }: SidebarProps) {
  const pathname = usePathname();
  
  const navItems: NavItem[] = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/scanners", icon: BarChart, label: "Scanners" },
    { href: "/journal", icon: BookText, label: "Journal" },
    { href: "/watchlist", icon: Star, label: "Watchlists" },
    { href: "#", icon: Bot, label: "AI Briefing", onClick: onBriefingClick },
    { href: "/news", icon: Newspaper, label: "News" },
    { href: "#", icon: LineChart, label: "Charts" },
];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 py-4">
          <Link
            href="#"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
          >
            <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
            <span className="sr-only">Market Momentum</span>
          </Link>
          {navItems.map((item) => {
            const linkContent = (
                <span
                    className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                        pathname === item.href && item.href !== '#' && "bg-accent text-accent-foreground"
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                </span>
            );

            return (
                <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                        {item.onClick ? (
                            <button onClick={item.onClick} className="w-full">
                                {linkContent}
                            </button>
                        ) : (
                            <Link href={item.href}>
                                {linkContent}
                            </Link>
                        )}
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
            );
          })}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/admin"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Admin</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Admin</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
