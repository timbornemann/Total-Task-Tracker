import React from "react";
import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface CategoryFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sort: string;
  onSortChange: (value: string) => void;
  filterColor: string;
  onFilterColorChange: (value: string) => void;
  colorOptions: number[];
  colorPalette: Record<number, string>;
}

const CategoryFilterSheet: React.FC<CategoryFilterSheetProps> = ({
  open,
  onOpenChange,
  sort,
  onSortChange,
  filterColor,
  onFilterColorChange,
  colorOptions,
  colorPalette,
}) => {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-72 sm:w-80">
        <SheetHeader>
          <SheetTitle>{t("dashboard.filterTitle")}</SheetTitle>
        </SheetHeader>
        <Accordion type="multiple" className="mt-4">
          <AccordionItem value="sort">
            <AccordionTrigger>{t("dashboard.sortLabel")}</AccordionTrigger>
            <AccordionContent>
              <Select value={sort} onValueChange={onSortChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("dashboard.sortLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">
                    {t("dashboard.sort.manual")}
                  </SelectItem>
                  <SelectItem value="created-desc">
                    {t("dashboard.sort.createdDesc")}
                  </SelectItem>
                  <SelectItem value="created-asc">
                    {t("dashboard.sort.createdAsc")}
                  </SelectItem>
                  <SelectItem value="title-asc">
                    {t("dashboard.sort.titleAsc")}
                  </SelectItem>
                  <SelectItem value="title-desc">
                    {t("dashboard.sort.titleDesc")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="color">
            <AccordionTrigger>{t("dashboard.colorLabel")}</AccordionTrigger>
            <AccordionContent>
              <Select value={filterColor} onValueChange={onFilterColorChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("dashboard.colorLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("dashboard.filter.all")}
                  </SelectItem>
                  {colorOptions.map((color) => (
                    <SelectItem key={color} value={String(color)}>
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colorPalette[color] }}
                        />
                        <span>{colorPalette[color]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SheetContent>
    </Sheet>
  );
};

export default CategoryFilterSheet;
