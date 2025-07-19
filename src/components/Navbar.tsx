import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  BarChart3,
  Calendar as CalendarIcon,
  Columns,
  LayoutGrid,
  List,
  Flame,
  Cog,
  Timer,
  Clock,
  BookOpen,
  Pencil,
  Search,
  ClipboardList,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import { allNavbarItems } from "@/utils/navbarItems";

interface NavbarProps {
  title?: string;
  category?: { name: string; color: string };
  onHomeClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ title, category, onHomeClick }) => {
  const { t } = useTranslation();
  const { colorPalette, navbarItems, navbarItemOrder, navbarGroups } =
    useSettings();
  const itemMap = React.useMemo(() => {
    const map: Record<string, (typeof allNavbarItems)[0]> = {};
    allNavbarItems.forEach((i) => {
      map[i.key] = i;
    });
    return map;
  }, []);
  const iconMap: Record<string, JSX.Element> = {
    overview: <LayoutGrid className="h-4 w-4 mr-2" />,
    kanban: <Columns className="h-4 w-4 mr-2" />,
    schedule: <CalendarIcon className="h-4 w-4 mr-2" />,
    recurring: <List className="h-4 w-4 mr-2" />,
    habits: <Flame className="h-4 w-4 mr-2" />,
    statistics: <BarChart3 className="h-4 w-4 mr-2" />,
    cards: <BookOpen className="h-4 w-4 mr-2" />,
    decks: <Pencil className="h-4 w-4 mr-2" />,
    pomodoro: <Timer className="h-4 w-4 mr-2" />,
    timers: <Timer className="h-4 w-4 mr-2" />,
    clock: <Clock className="h-4 w-4 mr-2" />,
    worklog: <Clock className="h-4 w-4 mr-2" />,
    cardStatistics: <BarChart3 className="h-4 w-4 mr-2" />,
    notes: <List className="h-4 w-4 mr-2" />,
    inventory: <List className="h-4 w-4 mr-2" />,
    settings: <Cog className="h-4 w-4 mr-2" />,
  };
  const standalone = (navbarItemOrder["standalone"] || [])
    .filter((k) => (navbarItems.standalone || []).includes(k))
    .map((k) => itemMap[k])
    .filter(Boolean) as typeof allNavbarItems;
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  return (
    <header className="bg-background shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              to="/"
              onClick={onHomeClick}
              className="text-lg sm:text-2xl font-bold text-foreground"
            >
              Total-Task-Tracker
            </Link>
            {title && (
              <span className="hidden sm:inline text-muted-foreground">
                / {title}
              </span>
            )}
            {category && (
              <div className="hidden sm:flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colorPalette[category.color] }}
                />
                <span className="font-medium text-foreground truncate text-sm">
                  {category.name}
                </span>
              </div>
            )}
          </div>
          <div className="sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.dispatchEvent(new Event("open-command-palette"))
              }
            >
              <Search className="h-4 w-4" />
            </Button>
            {navbarGroups.map((grp) => {
              const keys = navbarItemOrder[grp] || [];
              const hasItems = keys.some((k) =>
                (navbarItems[grp] || []).includes(k),
              );
              if (!hasItems) return null;
              const groupIcon =
                grp === "tasks" ? (
                  <ClipboardList className="h-4 w-4 mr-2" />
                ) : grp === "learning" ? (
                  <GraduationCap className="h-4 w-4 mr-2" />
                ) : (
                  <List className="h-4 w-4 mr-2" />
                );
              return (
                <DropdownMenu
                  key={grp}
                  open={openMenu === grp}
                  onOpenChange={(open) => setOpenMenu(open ? grp : null)}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenMenu(openMenu === grp ? null : grp)}
                      className="flex items-center"
                    >
                      {groupIcon}
                      {t(`navbar.${grp}`, grp)}
                      <ChevronDown
                        className={`ml-1 h-3 w-3 transition-transform ${openMenu === grp ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background z-50">
                    {keys.map((k) => {
                      if (!(navbarItems[grp] || []).includes(k)) return null;
                      const item = itemMap[k];
                      if (!item) return null;
                      return (
                        <DropdownMenuItem asChild key={k}>
                          <Link to={item.path} className="flex items-center">
                            {iconMap[k]} {t(item.labelKey)}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}

            {standalone.map((item) => (
              <Link key={item.key} to={item.path}>
                <Button variant="outline" size="sm">
                  {iconMap[item.key]} {t(item.labelKey)}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        {showMobileMenu && (
          <div className="sm:hidden pb-4 space-y-4">
            {navbarGroups.map((grp) => {
              const keys = navbarItemOrder[grp] || [];
              const hasItems = keys.some((k) =>
                (navbarItems[grp] || []).includes(k),
              );
              if (!hasItems) return null;
              return (
                <div key={grp} className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t(`navbar.${grp}`, grp)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {keys.map((k) => {
                      if (!(navbarItems[grp] || []).includes(k)) return null;
                      const item = itemMap[k];
                      if (!item) return null;
                      return (
                        <Link to={item.path} className="flex-1" key={k}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            {iconMap[k]}
                            {t(item.labelKey)}
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {standalone.map((item) => (
              <div key={item.key} className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t(item.labelKey)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to={item.path} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      {iconMap[item.key]}
                      {t(item.labelKey)}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("navbar.search")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    window.dispatchEvent(new Event("open-command-palette"));
                    setShowMobileMenu(false);
                  }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {t("navbar.search")}
                </Button>
              </div>
            </div>
            {Object.values(navbarItems).some((arr) =>
              arr.includes("settings"),
            ) && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("navbar.settings")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/settings" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Cog className="h-4 w-4 mr-2" />
                      {t("navbar.settings")}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            {category && (
              <div className="flex items-center space-x-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colorPalette[category.color] }}
                />
                <span className="font-medium text-foreground">
                  {category.name}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
