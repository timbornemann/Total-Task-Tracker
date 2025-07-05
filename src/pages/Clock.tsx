import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";

const ClockPage: React.FC = () => {
  const { t } = useTranslation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar title={t("navbar.clock")}/> 
      <div className="flex-grow flex items-center justify-center">
        <span
          className="font-mono leading-none w-full text-center"
          style={{ fontSize: "20vw" }}
        >
          {time}
        </span>
      </div>
    </div>
  );
};

export default ClockPage;
