import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Activity } from "@/pages/Schedule";
import { differenceInBusinessDays, differenceInDays, parse } from "date-fns";
import { toast } from "sonner";

interface ActivityFormProps {
  onSubmit: (activities: Activity[]) => void;
  onCancel: () => void;
}

export const ActivityForm = ({ onSubmit, onCancel }: ActivityFormProps) => {
  const [pastedData, setPastedData] = useState("");
  const [includeWeekends, setIncludeWeekends] = useState(false);

  const parseExcelData = (data: string): Activity[] => {
    const lines = data.trim().split('\n');
    const activities: Activity[] = [];

    lines.forEach((line, index) => {
      const columns = line.split('\t');
      
      if (columns.length < 5) {
        return;
      }

      const serialNumber = columns[0]?.trim() || "";
      const functionalDescription = columns[1]?.trim() || "";
      const activityDescription = columns[2]?.trim() || "";
      const startDateStr = columns[3]?.trim() || "";
      const endDateStr = columns[4]?.trim() || "";
      const predecessor = columns[5]?.trim() || "";

      let startDate: Date;
      let endDate: Date;

      try {
        if (startDateStr.includes('/')) {
          startDate = parse(startDateStr, 'dd/MM/yyyy', new Date());
          endDate = parse(endDateStr, 'dd/MM/yyyy', new Date());
        } else if (startDateStr.includes('-')) {
          startDate = parse(startDateStr, 'yyyy-MM-dd', new Date());
          endDate = parse(endDateStr, 'yyyy-MM-dd', new Date());
        } else {
          throw new Error("Invalid date format");
        }

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error("Invalid date");
        }

        const duration = includeWeekends
          ? differenceInDays(endDate, startDate) + 1
          : differenceInBusinessDays(endDate, startDate) + 1;

        activities.push({
          id: `${Date.now()}-${index}`,
          serialNumber,
          functionalDescription,
          activityDescription,
          startDate,
          endDate,
          includeWeekends,
          duration,
          predecessor,
        });
      } catch (error) {
        console.error(`Error parsing line ${index + 1}:`, line, error);
      }
    });

    return activities;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pastedData.trim()) {
      toast.error("Cole os dados do Excel");
      return;
    }

    const activities = parseExcelData(pastedData);
    
    if (activities.length === 0) {
      toast.error("Nenhuma atividade válida encontrada. Verifique o formato dos dados.");
      return;
    }
    
    onSubmit(activities);
    setPastedData("");
    setIncludeWeekends(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="pastedData">Dados do Excel *</Label>
        <p className="text-sm text-muted-foreground">
          Cole os dados do Excel com as colunas: Serial Number | Functional Description | Descrição da Atividade | Data Início | Data Fim | Predecessor (opcional)
        </p>
        <Textarea
          id="pastedData"
          value={pastedData}
          onChange={(e) => setPastedData(e.target.value)}
          placeholder="Cole aqui os dados do Excel (use Ctrl+V)&#10;&#10;Exemplo:&#10;WTG-01	Foundation Works	Escavação e preparação do terreno	01/01/2024	15/01/2024	&#10;WTG-02	Foundation Works	Concretagem da fundação	16/01/2024	30/01/2024	WTG-01"
          rows={12}
          required
          className="font-mono text-sm"
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="weekends">Incluir finais de semana</Label>
          <p className="text-sm text-muted-foreground">
            Considerar sábado e domingo no cálculo de duração
          </p>
        </div>
        <Switch
          id="weekends"
          checked={includeWeekends}
          onCheckedChange={setIncludeWeekends}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Importar Atividades
        </Button>
      </div>
    </form>
  );
};
