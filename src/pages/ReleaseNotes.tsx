import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import ReactMarkdown from "react-markdown";

const ReleaseNotesPage: React.FC = () => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState("");

  useEffect(() => {
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
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("releaseNotes.title")} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <ReactMarkdown className="prose dark:prose-invert">
          {notes || t("releaseNotes.none")}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ReleaseNotesPage;
