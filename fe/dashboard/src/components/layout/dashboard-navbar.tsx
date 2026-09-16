import React from "react";
import { useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/contexts/LanguageContext";

export function DashboardNavbar() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();

  // Generate breadcrumbs based on current location
  const getBreadcrumbs = () => {
    const paths = location.split("/").filter(Boolean);

    // Map path segments to translation keys
    const labelMap: Record<string, string> = {
      admin: "nav.dashboard",
      organizations: 'Organizaciones',
      users: 'Usuarios',
      tickets: 'Tickets de soporte',
      incidents: 'Incidentes',
      data: 'Catálogos de datos',
    };

    const breadcrumbs: Array<{ label: string; href: string; isLast: boolean }> = [];

    // Build breadcrumb trail
    let currentPath = "";
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const translationKey = labelMap[segment];
      let label = translationKey ? t(translationKey) : segment;
      
      const isLast = index === paths.length - 1;

      breadcrumbs.push({
        label,
        href: currentPath,
        isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                setLocation("/admin");
              }}
            >
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.length > 0 && (
            <BreadcrumbSeparator className="hidden md:block">
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
          )}
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem>
                {!crumb.isLast ? (
                  <BreadcrumbLink
                    href={crumb.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setLocation(crumb.href);
                    }}
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right side - Theme and Language toggles */}
      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
