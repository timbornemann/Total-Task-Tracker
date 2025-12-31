import React, { useState } from "react";
import { usePomodoroHistory } from "@/hooks/usePomodoroHistory.tsx";
import Navbar from "@/components/Navbar";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PomodoroSession } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const toLocalISOString = (timestamp: number) => {
  const d = new Date(timestamp);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

const fromLocalISOString = (s: string) => {
    const d = new Date(s);
    return d.getTime();
}

const PomodoroHistoryPage: React.FC = () => {
  const { sessions, updateSession, deleteSession, addSession } =
    usePomodoroHistory();
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSession, setNewSession] = useState<{
    start: string;
    end: string;
    type: "work" | "break";
  }>({
    start: toLocalISOString(Date.now()),
    end: toLocalISOString(Date.now() + 25 * 60000),
    type: "work",
  });

  const handleChange = (
    index: number,
    field: keyof PomodoroSession,
    value: string | number,
  ) => {
    let val = value;
    if (field === "start" || field === "end") {
        if (typeof value === 'string')
             val = fromLocalISOString(value);
    }
    updateSession(index, { [field]: val } as Partial<PomodoroSession>);
  };

  const handleCreate = () => {
      addSession(fromLocalISOString(newSession.start), fromLocalISOString(newSession.end), newSession.type);
      setIsAddOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar title={t("pomodoroSessions.title")} />
      <div className="flex-grow p-4 flex flex-col items-center">
        <div className="w-full max-w-2xl mb-4 flex justify-end">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("pomodoroSessions.add", "Add Session")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("pomodoroSessions.addTitle", "Add New Session")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label>{t("pomodoroSessions.type", "Type")}</label>
                  <Select
                    value={newSession.type}
                    onValueChange={(v) =>
                      setNewSession({
                        ...newSession,
                        type: v as "work" | "break",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">
                        {t("pomodoro.work", "Work")}
                      </SelectItem>
                      <SelectItem value="break">
                        {t("pomodoro.break", "Break")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label>{t("pomodoroSessions.start")}</label>
                  <Input
                    type="datetime-local"
                    value={newSession.start}
                    onChange={(e) =>
                      setNewSession({ ...newSession, start: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label>{t("pomodoroSessions.end")}</label>
                  <Input
                    type="datetime-local"
                    value={newSession.end}
                    onChange={(e) =>
                      setNewSession({ ...newSession, end: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">
                  {t("common.save", "Save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("pomodoroSessions.none")}
          </p>
        ) : (
          <div className="w-full max-w-2xl bg-card rounded-lg border shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">
                    {t("pomodoroSessions.type", "Type")}
                  </th>
                  <th className="text-left p-3 font-medium">
                    {t("pomodoroSessions.start")}
                  </th>
                  <th className="text-left p-3 font-medium">
                    {t("pomodoroSessions.end")}
                  </th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={i} className="border-t hover:bg-muted/10">
                    <td className="p-3">
                      <Select
                        value={s.type || "work"}
                        onValueChange={(v) => handleChange(i, "type", v)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="work">
                            {t("pomodoro.work", "Work")}
                          </SelectItem>
                          <SelectItem value="break">
                            {t("pomodoro.break", "Break")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      <Input
                        type="datetime-local"
                        value={toLocalISOString(s.start)}
                        onChange={(e) =>
                          handleChange(i, "start", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="datetime-local"
                        value={toLocalISOString(s.end)}
                        onChange={(e) => handleChange(i, "end", e.target.value)}
                      />
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteSession(i)}
                      >
                        {t("pomodoroSessions.delete")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PomodoroHistoryPage;
