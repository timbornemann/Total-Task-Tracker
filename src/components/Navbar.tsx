import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Menu,
  BarChart3,
  Calendar as CalendarIcon,
  Columns,
  LayoutGrid,
  List,
  Cog,
  Timer,
  BookOpen,
  Pencil,
  Search,
  ClipboardList,
  GraduationCap,
  ChevronDown,
} from 'lucide-react'

interface NavbarProps {
  title?: string;
  category?: { name: string; color: string };
  onHomeClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ title, category, onHomeClick }) => {
  const { t } = useTranslation()
  const [showMobileMenu, setShowMobileMenu] = React.useState(false)
  const [openMenu, setOpenMenu] = React.useState<string | null>(null)
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
              <span className="hidden sm:inline text-muted-foreground">/ {title}</span>
            )}
            {category && (
              <div className="hidden sm:flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
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
              onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
            >
              <Search className="h-4 w-4" />
            </Button>
            <DropdownMenu
              open={openMenu === 'tasks'}
              onOpenChange={(open) => setOpenMenu(open ? 'tasks' : null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenMenu(openMenu === 'tasks' ? null : 'tasks')}
                  className="flex items-center"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  {t('navbar.tasks')}
                  <ChevronDown
                    className={`ml-1 h-3 w-3 transition-transform ${openMenu === 'tasks' ? 'rotate-180' : ''}`}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background z-50">
                <DropdownMenuItem asChild>
                  <Link to="/tasks" className="flex items-center">
                    <LayoutGrid className="h-4 w-4 mr-2" /> {t('navbar.overview')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/kanban" className="flex items-center">
                    <Columns className="h-4 w-4 mr-2" /> {t('navbar.kanban')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/timeblocks" className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" /> {t('navbar.schedule')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/recurring" className="flex items-center">
                    <List className="h-4 w-4 mr-2" /> {t('navbar.recurring')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/statistics" className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" /> {t('navbar.statistics')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu
              open={openMenu === 'learning'}
              onOpenChange={(open) => setOpenMenu(open ? 'learning' : null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenMenu(openMenu === 'learning' ? null : 'learning')}
                  className="flex items-center"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  {t('navbar.learning')}
                  <ChevronDown
                    className={`ml-1 h-3 w-3 transition-transform ${openMenu === 'learning' ? 'rotate-180' : ''}`}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background z-50">
                <DropdownMenuItem asChild>
                  <Link to="/flashcards" className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" /> {t('navbar.cards')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/flashcards/manage" className="flex items-center">
                    <Pencil className="h-4 w-4 mr-2" /> {t('navbar.decks')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/pomodoro" className="flex items-center">
                    <Timer className="h-4 w-4 mr-2" /> {t('navbar.pomodoro')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/flashcards/stats" className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" /> {t('navbar.cardStatistics')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/notes">
              <Button variant="outline" size="sm">
                <List className="h-4 w-4 mr-2" /> {t('navbar.notes')}
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline" size="sm">
                <Cog className="h-4 w-4 mr-2" /> {t('navbar.settings')}
              </Button>
            </Link>
          </div>
        </div>
        {showMobileMenu && (
          <div className="sm:hidden pb-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">{t('navbar.tasks')}</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/tasks" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    {t('navbar.overview')}
                  </Button>
                </Link>
                <Link to="/kanban" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Columns className="h-4 w-4 mr-2" />
                    {t('navbar.kanban')}
                  </Button>
                </Link>
                <Link to="/timeblocks" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {t('navbar.schedule')}
                  </Button>
                </Link>
                <Link to="/recurring" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <List className="h-4 w-4 mr-2" />
                    {t('navbar.recurring')}
                  </Button>
                </Link>
                <Link to="/statistics" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {t('navbar.statistics')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">{t('navbar.learning')}</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/flashcards" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {t('navbar.cards')}
                  </Button>
                </Link>
                <Link to="/flashcards/manage" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Pencil className="h-4 w-4 mr-2" />
                    {t('navbar.decks')}
                  </Button>
                </Link>
                <Link to="/pomodoro" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Timer className="h-4 w-4 mr-2" />
                    {t('navbar.pomodoro')}
                  </Button>
                </Link>
                <Link to="/flashcards/stats" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {t('navbar.cardStatistics')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">{t('navbar.notes')}</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/notes" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <List className="h-4 w-4 mr-2" />
                    {t('navbar.notes')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">{t('navbar.search')}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    window.dispatchEvent(new Event('open-command-palette'))
                    setShowMobileMenu(false)
                  }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {t('navbar.search')}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">{t('navbar.settings')}</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/settings" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Cog className="h-4 w-4 mr-2" />
                    {t('navbar.settings')}
                  </Button>
                </Link>
              </div>
            </div>
            {category && (
              <div className="flex items-center space-x-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium text-foreground">{category.name}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
