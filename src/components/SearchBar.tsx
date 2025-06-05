import React, { useState, useEffect } from 'react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command';
import { useTaskStore } from '@/hooks/useTaskStore';
import { useNavigate } from 'react-router-dom';

const SearchBar: React.FC = () => {
  const { searchTasks } = useTaskStore();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const results = term ? searchTasks(term) : [];

  const handleSelect = (id: string) => {
    setOpen(false);
    navigate(`/?task=${id}`); // navigate to dashboard with query
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Task suchen..."
        value={term}
        onValueChange={setTerm}
        autoFocus
      />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse.</CommandEmpty>
        {results.map(task => (
          <CommandItem key={task.id} onSelect={() => handleSelect(task.id)}>
            {task.title}
          </CommandItem>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default SearchBar;
