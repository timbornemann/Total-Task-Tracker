import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useTaskStore } from "@/hooks/useTaskStore";

const SearchBar: React.FC = () => {
  const { searchTasks } = useTaskStore();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const results = useMemo(
    () => (term ? searchTasks(term) : []),
    [term, searchTasks],
  );

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Search className="h-5 w-5" />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          value={term}
          onValueChange={setTerm}
          placeholder="Tasks suchen..."
          autoFocus
        />
        <CommandList>
          <CommandEmpty>Keine Ergebnisse.</CommandEmpty>
          {results.map((task) => (
            <CommandItem key={task.id}>{task.title}</CommandItem>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default SearchBar;
