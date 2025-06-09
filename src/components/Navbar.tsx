import React from 'react'
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
} from 'lucide-react'

interface NavbarProps {
  title?: string;
  category?: { name: string; color: string };
  onHomeClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ title, category, onHomeClick }) => {
  const [showMobileMenu, setShowMobileMenu] = React.useState(false)
  const [openMenu, setOpenMenu] = React.useState<string | null>(null)
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link
              to="/"
              onClick={onHomeClick}
              className="text-lg sm:text-2xl font-bold text-gray-900"
            >
              Task Tracker
            </Link>
            {title && (
              <span className="hidden sm:inline text-gray-500">/ {title}</span>
            )}
            {category && (
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-gray-500">/</span>
                <div className="flex items-center space-x-2 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium text-gray-700 truncate">
                    {category.name}
                  </span>
                </div>
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
            <DropdownMenu
              open={openMenu === 'dashboard'}
              onOpenChange={(open) => setOpenMenu(open ? 'dashboard' : null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onMouseEnter={() => setOpenMenu('dashboard')}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  Dashboard
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-white z-50"
                onMouseEnter={() => setOpenMenu('dashboard')}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <DropdownMenuItem asChild>
                  <Link to="/" className="flex items-center">
                    <LayoutGrid className="h-4 w-4 mr-2" /> Übersicht
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/statistics" className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" /> Statistiken
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu
              open={openMenu === 'planning'}
              onOpenChange={(open) => setOpenMenu(open ? 'planning' : null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onMouseEnter={() => setOpenMenu('planning')}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  Planung
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-white z-50"
                onMouseEnter={() => setOpenMenu('planning')}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <DropdownMenuItem asChild>
                  <Link to="/calendar" className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" /> Kalender
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/pomodoro" className="flex items-center">
                    <Timer className="h-4 w-4 mr-2" /> Pomodoro
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/kanban" className="flex items-center">
                    <Columns className="h-4 w-4 mr-2" /> Kanban
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
                  onMouseEnter={() => setOpenMenu('learning')}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  Lernen
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-white z-50"
                onMouseEnter={() => setOpenMenu('learning')}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <DropdownMenuItem asChild>
                  <Link to="/flashcards" className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" /> Karten
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/flashcards/manage" className="flex items-center">
                    <Pencil className="h-4 w-4 mr-2" /> Decks
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/flashcards/stats" className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" /> Statistiken
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu
              open={openMenu === 'more'}
              onOpenChange={(open) => setOpenMenu(open ? 'more' : null)}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onMouseEnter={() => setOpenMenu('more')}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  Mehr
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-white z-50"
                onMouseEnter={() => setOpenMenu('more')}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <DropdownMenuItem asChild>
                  <Link to="/notes" className="flex items-center">
                    <List className="h-4 w-4 mr-2" /> Notizen
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Cog className="h-4 w-4 mr-2" /> Einstellungen
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {showMobileMenu && (
          <div className="sm:hidden pb-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">Dashboard</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Übersicht
                  </Button>
                </Link>
                <Link to="/statistics" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Statistiken
                  </Button>
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">Planung</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/calendar" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Kalender
                  </Button>
                </Link>
                <Link to="/pomodoro" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Timer className="h-4 w-4 mr-2" />
                    Pomodoro
                  </Button>
                </Link>
                <Link to="/kanban" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Columns className="h-4 w-4 mr-2" />
                    Kanban
                  </Button>
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">Lernen</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/flashcards" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Karten
                  </Button>
                </Link>
                <Link to="/flashcards/manage" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Pencil className="h-4 w-4 mr-2" />
                    Decks
                  </Button>
                </Link>
                <Link to="/flashcards/stats" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Statistiken
                  </Button>
                </Link>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">Mehr</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/notes" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <List className="h-4 w-4 mr-2" />
                    Notizen
                  </Button>
                </Link>
                <Link to="/settings" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Cog className="h-4 w-4 mr-2" />
                    Einstellungen
                  </Button>
                </Link>
              </div>
            </div>
            {category && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">In:</span>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium text-gray-700">{category.name}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
