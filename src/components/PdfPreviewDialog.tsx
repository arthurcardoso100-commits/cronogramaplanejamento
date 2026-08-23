import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Trash2, RotateCcw } from "lucide-react";
import { Activity } from "@/pages/Schedule";
import { buildPdfPages, generatePDF } from "@/lib/pdfGenerator";
import { format, differenceInDays } from "date-fns";
import { enUS } from "date-fns/locale";
import vestasLogo from "@/assets/vestas-logo.png";

interface EditableRow {
  id: string;
  activityDescription: string;
  functionalDescription: string;
  serialNumber: string;
  team: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  duration: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: Activity[];
  activityName: string;
  windfarmName: string;
  useProvidedDuration?: boolean;
}

const toInput = (d: Date) => format(d, "yyyy-MM-dd");
const fromInput = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const PdfPreviewDialog = ({
  open,
  onOpenChange,
  activities,
  activityName,
  windfarmName,
  useProvidedDuration = false,
}: Props) => {
  const [title, setTitle] = useState(activityName);
  const [park, setPark] = useState(windfarmName);
  const [weeksPerPage, setWeeksPerPage] = useState(8);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [excludedPages, setExcludedPages] = useState<number[]>([]);


  useEffect(() => {
    if (!open) return;
    setTitle(activityName);
    setPark(windfarmName);
    setRows(
      activities.map((a) => ({
        id: a.id,
        activityDescription: a.activityDescription,
        functionalDescription: a.functionalDescription,
        serialNumber: a.serialNumber,
        team: a.team || "",
        startDate: toInput(a.startDate),
        endDate: toInput(a.endDate),
        duration: a.duration,
      }))
    );
    setExcludedPages([]);
  }, [open, activities, activityName, windfarmName]);

  useEffect(() => {
    setExcludedPages([]);
  }, [weeksPerPage, rowsPerPage]);

  const builtActivities: Activity[] = useMemo(
    () =>
      rows.map((r, i) => ({
        id: r.id || String(i),
        serialNumber: r.serialNumber,
        functionalDescription: r.functionalDescription,
        activityDescription: r.activityDescription,
        startDate: fromInput(r.startDate),
        endDate: fromInput(r.endDate),
        includeWeekends: false,
        duration: Number(r.duration) || 1,
        predecessor: "",
        team: r.team,
      })),
    [rows]
  );

  const allPages = useMemo(
    () => buildPdfPages(builtActivities, { weeksPerPage, rowsPerPage }),
    [builtActivities, weeksPerPage, rowsPerPage]
  );

  const pages = useMemo(
    () => allPages.map((p, i) => ({ page: p, index: i })).filter(({ index }) => !excludedPages.includes(index)),
    [allPages, excludedPages]
  );

  const update = (index: number, field: keyof EditableRow, value: string) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, [field]: field === "duration" ? Number(value) : value } : r
      )
    );
  };

  const handleExport = () => {
    generatePDF(builtActivities, title, park, useProvidedDuration, {
      weeksPerPage,
      rowsPerPage,
      excludedPages,
    });
  };


  // ---- preview geometry (mm, matching the PDF) ----
  const PAGE_W = 420;
  const PAGE_H = 297;
  const margin = 15;
  const contentWidth = PAGE_W - 2 * margin;
  const headerHeight = 25;
  const availableHeight = PAGE_H - 2 * margin - headerHeight - 16;
  const rowHeight = availableHeight / rowsPerPage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Pré-visualização do Cronograma</DialogTitle>
          <DialogDescription>
            Ajuste o cabeçalho, os dados e o layout antes de exportar o PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label>Nome da Atividade</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Nome do Parque</Label>
            <Input value={park} onChange={(e) => setPark(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Semanas por página</Label>
            <Select value={String(weeksPerPage)} onValueChange={(v) => setWeeksPerPage(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? "semana" : "semanas"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Functional locations por página</Label>
            <Select value={String(rowsPerPage)} onValueChange={(v) => setRowsPerPage(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background max-h-64">
                {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="preview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="preview">Pré-visualização</TabsTrigger>
            <TabsTrigger value="data">Editar dados</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-auto bg-muted/40 rounded-md p-4">
            <div className="space-y-6">
              {pages.map(({ page, index: realIdx }, pIdx) => {
                const hasTeam = page.activities.some((a) => a.team && a.team.trim() !== "");
                const cols = {
                  seq: 15,
                  functional: 70,
                  serial: 30,
                  team: hasTeam ? 20 : 0,
                  start: 28,
                  end: 28,
                  duration: 22,
                };
                const usedWidth =
                  cols.seq + cols.functional + cols.serial + cols.team + cols.start + cols.end + cols.duration;
                const ganttWidth = contentWidth - usedWidth - 4;
                const totalDays = page.weeks.length * 7;

                return (
                  <div key={realIdx} className="mx-auto" style={{ width: PAGE_W * 2.2 }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-muted-foreground">Página {pIdx + 1} de {pages.length}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive gap-1"
                        onClick={() => setExcludedPages((prev) => [...prev, realIdx])}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Apagar página
                      </Button>
                    </div>

                    <div
                      className="bg-white shadow-md origin-top-left relative"
                      style={{
                        width: PAGE_W,
                        height: PAGE_H,
                        transform: "scale(2.2)",
                        marginBottom: PAGE_H * 1.2,
                      }}
                    >
                      {/* header */}
                      <img
                        src={vestasLogo}
                        alt="Vestas"
                        style={{ position: "absolute", left: margin, top: margin, width: 40, height: 18, objectFit: "contain" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: margin + 4,
                          left: 0,
                          width: PAGE_W,
                          textAlign: "center",
                          color: "rgb(33,87,138)",
                          fontWeight: 700,
                          fontSize: 6.5,
                        }}
                      >
                        {`Cronograma ${title} - ${park}`}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          top: margin + 6,
                          right: margin,
                          color: "rgb(100,100,100)",
                          fontSize: 3.6,
                        }}
                      >
                        {`Page ${pIdx + 1}`}
                      </div>

                      {/* table header */}
                      <div
                        style={{
                          position: "absolute",
                          left: margin,
                          top: margin + headerHeight,
                          width: contentWidth,
                          height: 16,
                          background: "rgb(33,87,138)",
                          color: "white",
                          fontSize: 2.9,
                          fontWeight: 700,
                        }}
                      >
                        {[
                          ["ID", cols.seq],
                          ["Description of functional location", cols.functional],
                          ["Serial Number", cols.serial],
                          ...(hasTeam ? ([["Team", cols.team]] as [string, number][]) : []),
                          ["Start", cols.start],
                          ["End", cols.end],
                          ["Duration (days)", cols.duration],
                        ].map(([label, w], i, arr) => {
                          const left = (arr.slice(0, i) as [string, number][]).reduce((s, c) => s + c[1], 0);
                          return (
                            <div
                              key={i}
                              style={{
                                position: "absolute",
                                left: left + 2,
                                top: 6,
                                width: (w as number) - 3,
                                overflow: "hidden",
                              }}
                            >
                              {label as string}
                            </div>
                          );
                        })}

                        {/* calendar */}
                        {page.weekDates.map((d, i) => {
                          const weekWidth = ganttWidth / page.weeks.length;
                          return (
                            <div
                              key={i}
                              style={{
                                position: "absolute",
                                left: usedWidth + i * weekWidth,
                                top: 6,
                                width: weekWidth,
                                height: 10,
                                borderLeft: i > 0 ? "0.1mm solid white" : "none",
                                textAlign: "center",
                                fontWeight: 400,
                                fontSize: 2.4,
                              }}
                            >
                              <div>Week</div>
                              <div>{String(page.weeks[i]).padStart(2, "0")}</div>
                            </div>
                          );
                        })}
                        {/* month labels */}
                        {(() => {
                          const weekWidth = ganttWidth / page.weeks.length;
                          const segs: { label: string; start: number; end: number }[] = [];
                          page.weekDates.forEach((d, i) => {
                            const label = format(d, "MMM/yyyy");
                            const last = segs[segs.length - 1];
                            if (last && last.label === label) last.end = i + 1;
                            else segs.push({ label, start: i, end: i + 1 });
                          });
                          return segs.map((s, i) => (
                            <div
                              key={i}
                              style={{
                                position: "absolute",
                                left: usedWidth + s.start * weekWidth,
                                top: 1.2,
                                width: (s.end - s.start) * weekWidth,
                                textAlign: "center",
                                fontSize: 2.8,
                              }}
                            >
                              {s.label}
                            </div>
                          ));
                        })()}
                        <div
                          style={{
                            position: "absolute",
                            left: usedWidth,
                            top: 6,
                            width: ganttWidth,
                            borderTop: "0.3mm solid white",
                          }}
                        />
                      </div>

                      {/* rows */}
                      {page.activities.map((a, rIdx) => {
                        const top = margin + headerHeight + 16 + rIdx * rowHeight;
                        const daysFromStart = differenceInDays(a.startDate, page.windowStart);
                        const activityDays = differenceInDays(a.endDate, a.startDate) + 1;
                        const clipStart = Math.max(0, daysFromStart);
                        const clipEnd = Math.min(totalDays, daysFromStart + activityDays);
                        const durationToDisplay = useProvidedDuration
                          ? a.duration
                          : differenceInDays(a.endDate, a.startDate) + 1;
                        const cells: [string, number][] = [
                          [a.activityDescription, cols.seq],
                          [a.functionalDescription, cols.functional],
                          [a.serialNumber, cols.serial],
                          ...(hasTeam ? ([[a.team || "-", cols.team]] as [string, number][]) : []),
                          [`${format(a.startDate, "EEE", { locale: enUS })} ${format(a.startDate, "dd/MM/yyyy")}`, cols.start],
                          [`${format(a.endDate, "EEE", { locale: enUS })} ${format(a.endDate, "dd/MM/yyyy")}`, cols.end],
                          [`${durationToDisplay}d`, cols.duration],
                        ];
                        return (
                          <div
                            key={rIdx}
                            style={{
                              position: "absolute",
                              left: margin,
                              top,
                              width: contentWidth,
                              height: rowHeight,
                              background: rIdx % 2 === 0 ? "rgb(248,250,252)" : "transparent",
                              border: "0.2mm solid rgb(226,232,240)",
                              color: "rgb(60,60,60)",
                              fontSize: 2.5,
                            }}
                          >
                            {cells.map(([text, w], i) => {
                              const left = cells.slice(0, i).reduce((s, c) => s + c[1], 0);
                              return (
                                <div
                                  key={i}
                                  style={{
                                    position: "absolute",
                                    left: left + 2,
                                    top: rowHeight / 2 - 1.4,
                                    width: w - 3,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                  }}
                                >
                                  {text}
                                </div>
                              );
                            })}
                            {clipEnd > clipStart && (
                              <div
                                style={{
                                  position: "absolute",
                                  left: usedWidth + (clipStart / totalDays) * ganttWidth,
                                  top: Math.min(1.2, rowHeight * 0.15),
                                  width: ((clipEnd - clipStart) / totalDays) * ganttWidth,
                                  height: Math.max(1.2, rowHeight - Math.min(1.2, rowHeight * 0.15) * 2),
                                  background: "rgb(59,130,246)",
                                  borderRadius: 1,
                                }}
                              />
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="data" className="flex-1 overflow-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[70px_1fr_130px_90px_140px_140px_90px] gap-2 text-xs font-semibold px-1 py-2 sticky top-0 bg-background">
                <div>ID</div>
                <div>Functional Location</div>
                <div>Serial Number</div>
                <div>Equipe</div>
                <div>Início</div>
                <div>Fim</div>
                <div>Duração</div>
              </div>
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-[70px_1fr_130px_90px_140px_140px_90px] gap-2 px-1 py-1">
                  <Input value={r.activityDescription} onChange={(e) => update(i, "activityDescription", e.target.value)} />
                  <Input value={r.functionalDescription} onChange={(e) => update(i, "functionalDescription", e.target.value)} />
                  <Input value={r.serialNumber} onChange={(e) => update(i, "serialNumber", e.target.value)} />
                  <Input value={r.team} onChange={(e) => update(i, "team", e.target.value)} />
                  <Input type="date" value={r.startDate} onChange={(e) => update(i, "startDate", e.target.value)} />
                  <Input type="date" value={r.endDate} onChange={(e) => update(i, "endDate", e.target.value)} />
                  <Input type="number" min={1} value={r.duration} onChange={(e) => update(i, "duration", e.target.value)} />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
