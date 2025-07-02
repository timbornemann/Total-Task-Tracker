import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";

const ReleaseNotesModal: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const lastSeen = localStorage.getItem("lastSeenVersion");
    if (lastSeen !== __APP_VERSION__) {
      const load = async () => {
        try {
          const res = await fetch(
            "https://api.github.com/repos/timbornemann/Total-Task-Tracker/releases/latest",
          );
          if (res.ok) {
            const data = await res.json();
            setNotes(data.body || "");
          }
        } catch (err) {
          console.error("Failed to load release notes", err);
        } finally {
          setOpen(true);
          localStorage.setItem("lastSeenVersion", __APP_VERSION__);
        }
      };
      load();
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t("releaseNotes.modalTitle", { version: __APP_VERSION__ })}
          </DialogTitle>
        </DialogHeader>
        <div className="prose dark:prose-invert max-h-[60vh] overflow-y-auto">
          <ReactMarkdown>{notes}</ReactMarkdown>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseNotesModal;
