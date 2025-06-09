import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Menu, BarChart3, Calendar as CalendarIcon, Columns, LayoutGrid, List, Cog } from 'lucide-react'

interface NavbarProps {
  title?: string
}

const Navbar: React.FC<NavbarProps> = ({ title }) => {
  const [showMobileMenu, setShowMobileMenu] = React.useState(false)
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link to="/" className="text-lg sm:text-2xl font-bold text-gray-900">
              Task Tracker
            </Link>
            {title && (
              <span className="hidden sm:inline text-gray-500">/ {title}</span>
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
            <Link to="/">
              <Button variant="outline" size="sm">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Übersicht
              </Button>
            </Link>
            <Link to="/statistics">
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Statistiken
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Kalender
              </Button>
            </Link>
            <Link to="/kanban">
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-2" />
                Kanban
              </Button>
            </Link>
            <Link to="/notes">
              <Button variant="outline" size="sm">
                <List className="h-4 w-4 mr-2" />
                Notizen
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline" size="sm">
                <Cog className="h-4 w-4 mr-2" />
                Einstellungen
              </Button>
            </Link>
          </div>
        </div>
        {showMobileMenu && (
          <div className="sm:hidden pb-4 space-y-3">
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
              <Link to="/calendar" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Kalender
                </Button>
              </Link>
              <Link to="/kanban" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Columns className="h-4 w-4 mr-2" />
                  Kanban
                </Button>
              </Link>
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
        )}
      </div>
    </header>
  )
}

export default Navbar
