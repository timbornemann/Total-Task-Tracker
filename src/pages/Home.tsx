import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { LayoutGrid, BookOpen, List } from 'lucide-react';

const Home: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/tasks">
          <Card className="hover:shadow-md transition-all text-center">
            <CardContent className="py-8">
              <LayoutGrid className="h-8 w-8 mx-auto mb-2" />
              <CardTitle>Tasks</CardTitle>
            </CardContent>
          </Card>
        </Link>
        <Link to="/flashcards">
          <Card className="hover:shadow-md transition-all text-center">
            <CardContent className="py-8">
              <BookOpen className="h-8 w-8 mx-auto mb-2" />
              <CardTitle>Flashcards</CardTitle>
            </CardContent>
          </Card>
        </Link>
        <Link to="/notes">
          <Card className="hover:shadow-md transition-all text-center">
            <CardContent className="py-8">
              <List className="h-8 w-8 mx-auto mb-2" />
              <CardTitle>Notizen</CardTitle>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  </div>
);

export default Home;
