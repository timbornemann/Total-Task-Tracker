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

interface KanbanFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sort: string;
  onSortChange: (value: string) => void;
  filterPriority: string;
  onFilterPriorityChange: (value: string) => void;
  filterColor: string;
  onFilterColorChange: (value: string) => void;
  filterPinned: string;
  onFilterPinnedChange: (value: string) => void;
  colorOptions: number[];
  colorPalette: Record<number, string>;
}

const KanbanFilterSheet: React.FC<KanbanFilterSheetProps> = ({
  open,
  onOpenChange,
  sort,
  onSortChange,
  filterPriority,
  onFilterPriorityChange,
  filterColor,
  onFilterColorChange,
  filterPinned,
  onFilterPinnedChange,
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
            <AccordionTrigger>{t("kanban.sortLabel")}</AccordionTrigger>
            <AccordionContent>
              <Select value={sort} onValueChange={onSortChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("kanban.sortLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">
                    {t("kanban.sort.manual")}
                  </SelectItem>
                  <SelectItem value="created-desc">
                    {t("kanban.sort.createdDesc")}
                  </SelectItem>
                  <SelectItem value="created-asc">
                    {t("kanban.sort.createdAsc")}
                  </SelectItem>
                  <SelectItem value="title-asc">
                    {t("kanban.sort.titleAsc")}
                  </SelectItem>
                  <SelectItem value="title-desc">
                    {t("kanban.sort.titleDesc")}
                  </SelectItem>
                  <SelectItem value="priority-asc">
                    {t("kanban.sort.priorityAsc")}
                  </SelectItem>
                  <SelectItem value="priority-desc">
                    {t("kanban.sort.priorityDesc")}
                  </SelectItem>
                  <SelectItem value="due-asc">
                    {t("kanban.sort.dueAsc")}
                  </SelectItem>
                  <SelectItem value="due-desc">
                    {t("kanban.sort.dueDesc")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="priority">
            <AccordionTrigger>{t("kanban.priorityLabel")}</AccordionTrigger>
            <AccordionContent>
              <Select
                value={filterPriority}
                onValueChange={onFilterPriorityChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("kanban.priorityLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("kanban.filter.all")}</SelectItem>
                  <SelectItem value="high">
                    {t("kanban.filter.high")}
                  </SelectItem>
                  <SelectItem value="medium">
                    {t("kanban.filter.medium")}
                  </SelectItem>
                  <SelectItem value="low">{t("kanban.filter.low")}</SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="color">
            <AccordionTrigger>{t("kanban.colorLabel")}</AccordionTrigger>
            <AccordionContent>
              <Select value={filterColor} onValueChange={onFilterColorChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("kanban.colorLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("kanban.filter.all")}</SelectItem>
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
          <AccordionItem value="pinned">
            <AccordionTrigger>{t("kanban.pinnedLabel")}</AccordionTrigger>
            <AccordionContent>
              <Select value={filterPinned} onValueChange={onFilterPinnedChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("kanban.pinnedLabel")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("kanban.filter.all")}</SelectItem>
                  <SelectItem value="pinned">
                    {t("kanban.filter.pinned")}
                  </SelectItem>
                  <SelectItem value="unpinned">
                    {t("kanban.filter.unpinned")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SheetContent>
    </Sheet>
  );
};

export default KanbanFilterSheet;
