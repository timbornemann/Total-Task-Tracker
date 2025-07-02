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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { LayoutGrid, List } from "lucide-react";

interface SubtaskFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sort: string;
  onSortChange: (value: string) => void;
  filterPriority: string;
  onFilterPriorityChange: (value: string) => void;
  filterColor: string;
  onFilterColorChange: (value: string) => void;
  colorOptions: number[];
  colorPalette: Record<number, string>;
  layout: "list" | "grid";
  onLayoutChange: (val: "list" | "grid") => void;
}

const SubtaskFilterSheet: React.FC<SubtaskFilterSheetProps> = ({
  open,
  onOpenChange,
  sort,
  onSortChange,
  filterPriority,
  onFilterPriorityChange,
  filterColor,
  onFilterColorChange,
  colorOptions,
  colorPalette,
  layout,
  onLayoutChange,
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
                  <SelectItem value="priority-asc">
                    {t("dashboard.sort.priorityAsc")}
                  </SelectItem>
                  <SelectItem value="priority-desc">
                    {t("dashboard.sort.priorityDesc")}
                  </SelectItem>
                  <SelectItem value="due-asc">
                    {t("dashboard.sort.dueAsc")}
                  </SelectItem>
                  <SelectItem value="due-desc">
                    {t("dashboard.sort.dueDesc")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="priority">
            <AccordionTrigger>{t("dashboard.priorityLabel")}</AccordionTrigger>
            <AccordionContent>
              <Select
                value={filterPriority}
                onValueChange={onFilterPriorityChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("dashboard.priorityLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("dashboard.filter.all")}
                  </SelectItem>
                  <SelectItem value="high">
                    {t("dashboard.filter.high")}
                  </SelectItem>
                  <SelectItem value="medium">
                    {t("dashboard.filter.medium")}
                  </SelectItem>
                  <SelectItem value="low">
                    {t("dashboard.filter.low")}
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
          <AccordionItem value="view">
            <AccordionTrigger>{t("dashboard.viewLabel")}</AccordionTrigger>
            <AccordionContent>
              <div className="flex items-center gap-1">
                <Button
                  variant={layout === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => onLayoutChange("list")}
                >
                  <List className="h-4 w-4" />
                  <span className="sr-only">{t("dashboard.listView")}</span>
                </Button>
                <Button
                  variant={layout === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => onLayoutChange("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only">{t("dashboard.gridView")}</span>
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SheetContent>
    </Sheet>
  );
};

export default SubtaskFilterSheet;
