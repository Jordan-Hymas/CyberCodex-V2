import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CourseLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  hero?: ReactNode;
  className?: string;
}

export function CourseLayout({
  children,
  sidebar,
  hero,
  className,
}: CourseLayoutProps) {
  return (
    <div className={cn("w-full", className)}>
      {hero && <div className="w-full">{hero}</div>}

      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Main content area - scrolls with page */}
          <div className="lg:col-span-8 order-2 lg:order-1">
            <div className="pb-8">
              {children}
            </div>
          </div>

          {/* Sidebar - sticky positioned */}
          <div className="lg:col-span-4 order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto scrollbar-cyber">
              {sidebar}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
