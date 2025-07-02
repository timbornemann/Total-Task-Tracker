import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar title={t("notFound.title")} />
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-4">
            {t("notFound.message")}
          </p>
          <a href="/" className="text-primary hover:text-primary/80 underline">
            {t("notFound.backHome")}
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
