import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, Plus, RefreshCcw, Trash2, Play } from "lucide-react";

interface ColumnInfo {
  name: string;
  type: string;
  notNull: boolean;
  pk: boolean;
  defaultValue: string | null;
}

interface DatabaseTableMeta {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
}

interface TableDataResponse {
  rows: Array<Record<string, unknown> & { rowid: number }>;
  columns: ColumnInfo[];
  total: number;
}

interface QueryResult {
  rows?: Array<Record<string, unknown>>;
  changes?: number;
  lastInsertRowid?: number | bigint;
  error?: string;
}

interface RowEditorState {
  mode: "add" | "edit";
  table: string;
  rowid?: number;
  value: string;
  error?: string;
}

const ROW_LIMIT = 200;

const DatabaseExplorer: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [tables, setTables] = React.useState<DatabaseTableMeta[]>([]);
  const [selectedTable, setSelectedTable] = React.useState<string>("");
  const [tablesLoading, setTablesLoading] = React.useState(false);
  const [tableData, setTableData] = React.useState<TableDataResponse | null>(
    null,
  );
  const [tableLoading, setTableLoading] = React.useState(false);
  const [queryText, setQueryText] = React.useState(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
  );
  const [queryResult, setQueryResult] = React.useState<QueryResult | null>(
    null,
  );
  const [queryLoading, setQueryLoading] = React.useState(false);
  const [rowEditor, setRowEditor] = React.useState<RowEditorState | null>(null);

  const currentTableMeta = React.useMemo(
    () => tables.find((table) => table.name === selectedTable),
    [tables, selectedTable],
  );

  const loadTables = React.useCallback(async () => {
    setTablesLoading(true);
    try {
      const res = await fetch("/api/database/tables");
      if (!res.ok) throw new Error("Failed to load tables");
      const data = (await res.json()) as DatabaseTableMeta[];
      setTables(data);
      setSelectedTable((prev) => prev || data[0]?.name || "");
    } catch (err) {
      toast({
        title: t("settingsPage.database.errors.loadTables"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setTablesLoading(false);
    }
  }, [t, toast]);

  const loadTableRows = React.useCallback(
    async (table: string) => {
      if (!table) return;
      setTableLoading(true);
      try {
        const res = await fetch(
          `/api/database/tables/${encodeURIComponent(table)}?limit=${ROW_LIMIT}`,
        );
        const payload = (await res
          .json()
          .catch(() => null)) as TableDataResponse | null;
        if (!res.ok || !payload) {
          throw new Error(
            ((payload as Record<string, unknown>)?.["error"] as string) ||
              "Failed to load table",
          );
        }
        setTableData(payload);
      } catch (err) {
        toast({
          title: t("settingsPage.database.errors.loadTable"),
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      } finally {
        setTableLoading(false);
      }
    },
    [t, toast],
  );

  React.useEffect(() => {
    loadTables();
  }, [loadTables]);

  React.useEffect(() => {
    if (selectedTable) {
      loadTableRows(selectedTable);
    }
  }, [selectedTable, loadTableRows]);

  const handleRefreshTable = React.useCallback(() => {
    if (selectedTable) {
      loadTableRows(selectedTable);
      loadTables();
    }
  }, [selectedTable, loadTableRows, loadTables]);

  const openEditor = (mode: "add" | "edit", row?: Record<string, unknown>) => {
    if (!selectedTable) return;
    const payload = { ...row };
    if (payload && "rowid" in payload) {
      delete (payload as Record<string, unknown>).rowid;
    }
    setRowEditor({
      mode,
      table: selectedTable,
      rowid: typeof row?.rowid === "number" ? row.rowid : undefined,
      value: JSON.stringify(payload ?? {}, null, 2),
    });
  };

  const saveRow = async () => {
    if (!rowEditor) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = rowEditor.value ? JSON.parse(rowEditor.value) : {};
    } catch (err) {
      setRowEditor((prev) =>
        prev
          ? {
              ...prev,
              error: t("settingsPage.database.errors.invalidJson"),
            }
          : null,
      );
      return;
    }
    const url =
      rowEditor.mode === "edit"
        ? `/api/database/tables/${encodeURIComponent(rowEditor.table)}/${rowEditor.rowid}`
        : `/api/database/tables/${encodeURIComponent(rowEditor.table)}`;
    try {
      const res = await fetch(url, {
        method: rowEditor.mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Request failed");
      }
      toast({
        title:
          rowEditor.mode === "edit"
            ? t("settingsPage.database.messages.rowUpdated")
            : t("settingsPage.database.messages.rowCreated"),
      });
      setRowEditor(null);
      loadTableRows(rowEditor.table);
      loadTables();
    } catch (err) {
      setRowEditor((prev) =>
        prev
          ? {
              ...prev,
              error: err instanceof Error ? err.message : String(err),
            }
          : null,
      );
    }
  };

  const deleteRow = async (rowid: number) => {
    if (!selectedTable) return;
    const shouldDelete =
      typeof window === "undefined"
        ? true
        : window.confirm(t("settingsPage.database.confirmDelete"));
    if (!shouldDelete) {
      return;
    }
    try {
      const res = await fetch(
        `/api/database/tables/${encodeURIComponent(selectedTable)}/${rowid}`,
        { method: "DELETE" },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Delete failed");
      }
      toast({ title: t("settingsPage.database.messages.rowDeleted") });
      loadTableRows(selectedTable);
      loadTables();
    } catch (err) {
      toast({
        title: t("settingsPage.database.errors.deleteRow"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const runQuery = async () => {
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const res = await fetch("/api/database/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: queryText }),
      });
      const payload = (await res.json().catch(() => ({}))) as QueryResult;
      if (!res.ok) {
        throw new Error(payload.error || "Query failed");
      }
      setQueryResult(payload);
    } catch (err) {
      setQueryResult({
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const renderValue = (value: unknown) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const renderQueryTable = () => {
    if (!queryResult?.rows || !queryResult.rows.length) {
      if (queryResult?.error) {
        return (
          <p className="text-sm text-destructive">
            {t("settingsPage.database.errors.queryFailed", {
              error: queryResult.error,
            })}
          </p>
        );
      }
      return (
        <p className="text-sm text-muted-foreground">
          {t("settingsPage.database.emptyResult")}
        </p>
      );
    }
    const headers = Object.keys(queryResult.rows[0] || {});
    return (
      <ScrollArea className="max-h-72 w-full">
        <div className="min-w-full">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {queryResult.rows.map((row, idx) => (
                <TableRow key={idx}>
                  {headers.map((header) => (
                    <TableCell key={`${idx}-${header}`}>
                      {renderValue(row[header])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("settingsPage.database.title")}</CardTitle>
          <CardDescription>
            {t("settingsPage.database.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1">
              <Label className="mb-1 block" htmlFor="table-select">
                {t("settingsPage.database.selectTable")}
              </Label>
              <Select
                value={selectedTable}
                onValueChange={(value) => setSelectedTable(value)}
                disabled={tablesLoading}
              >
                <SelectTrigger id="table-select">
                  <SelectValue
                    placeholder={t("settingsPage.database.selectPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.name} value={table.name}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={loadTables}
              disabled={tablesLoading}
            >
              {tablesLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              {t("settingsPage.database.refreshTables")}
            </Button>
          </div>
          {currentTableMeta && (
            <div>
              <p className="text-sm text-muted-foreground">
                {t("settingsPage.database.rowCount", {
                  count: currentTableMeta.rowCount,
                })}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {currentTableMeta.columns.map((column) => (
                  <Badge key={column.name} variant="secondary">
                    <span className="font-medium">{column.name}</span>
                    <span className="ml-2 text-xs uppercase text-muted-foreground">
                      {column.type || "TEXT"}
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("settingsPage.database.tablePreview")}</CardTitle>
            <CardDescription>
              {selectedTable
                ? t("settingsPage.database.tablePreviewDescription", {
                    table: selectedTable,
                    limit: ROW_LIMIT,
                  })
                : t("settingsPage.database.noTableSelected")}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefreshTable}
              disabled={!selectedTable || tableLoading}
            >
              {tableLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              {t("settingsPage.database.refreshTable")}
            </Button>
            <Button onClick={() => openEditor("add")} disabled={!selectedTable}>
              <Plus className="mr-2 h-4 w-4" />
              {t("settingsPage.database.addRow")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedTable ? (
            tableLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("settingsPage.database.loading")}
              </div>
            ) : tableData && tableData.rows.length ? (
              <ScrollArea className="max-h-[480px] w-full">
                <div className="min-w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>rowid</TableHead>
                        {tableData.columns.map((column) => (
                          <TableHead key={column.name}>{column.name}</TableHead>
                        ))}
                        <TableHead className="w-28">
                          {t("settingsPage.database.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.rows.map((row) => (
                        <TableRow key={row.rowid}>
                          <TableCell className="font-mono text-sm">
                            {row.rowid}
                          </TableCell>
                          {tableData.columns.map((column) => (
                            <TableCell key={`${row.rowid}-${column.name}`}>
                              {renderValue(row[column.name])}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditor("edit", row)}
                              >
                                <Pencil className="mr-1 h-4 w-4" />
                                {t("settingsPage.database.edit")}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteRow(row.rowid)}
                              >
                                <Trash2 className="mr-1 h-4 w-4" />
                                {t("settingsPage.database.delete")}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("settingsPage.database.noRows")}
              </p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("settingsPage.database.noTableSelected")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settingsPage.database.queryTitle")}</CardTitle>
          <CardDescription>
            {t("settingsPage.database.queryDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            rows={4}
            className="font-mono"
            placeholder={
              t("settingsPage.database.queryPlaceholder") ?? undefined
            }
          />
          <div className="flex items-center gap-2">
            <Button onClick={runQuery} disabled={queryLoading}>
              {queryLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {t("settingsPage.database.runQuery")}
            </Button>
            {queryResult?.error ? (
              <span className="text-sm text-destructive">
                {t("settingsPage.database.errors.queryFailed", {
                  error: queryResult.error,
                })}
              </span>
            ) : null}
            {typeof queryResult?.changes === "number" &&
            !queryResult.rows &&
            !queryResult?.error ? (
              <span className="text-sm text-muted-foreground">
                {t("settingsPage.database.queryMeta", {
                  changes: Number(queryResult.changes),
                  rowid:
                    typeof queryResult.lastInsertRowid === "number"
                      ? `(${t("settingsPage.database.rowId", {
                          id: queryResult.lastInsertRowid,
                        })})`
                      : typeof queryResult.lastInsertRowid === "bigint"
                        ? `(${t("settingsPage.database.rowId", {
                            id: queryResult.lastInsertRowid.toString(),
                          })})`
                        : "",
                })}
              </span>
            ) : null}
          </div>
          {queryResult && !queryResult.error ? renderQueryTable() : null}
        </CardContent>
      </Card>

      <Dialog
        open={!!rowEditor}
        onOpenChange={(open) => !open && setRowEditor(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {rowEditor?.mode === "edit"
                ? t("settingsPage.database.editRow", { table: rowEditor.table })
                : t("settingsPage.database.addRow")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="row-json">
              {t("settingsPage.database.rowJson")}
            </Label>
            <Textarea
              id="row-json"
              value={rowEditor?.value ?? ""}
              onChange={(event) =>
                setRowEditor((prev) =>
                  prev
                    ? {
                        ...prev,
                        value: event.target.value,
                        error: undefined,
                      }
                    : null,
                )
              }
              rows={12}
              className="font-mono"
            />
            {rowEditor?.error ? (
              <p className="text-sm text-destructive">{rowEditor.error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRowEditor(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={saveRow}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatabaseExplorer;
