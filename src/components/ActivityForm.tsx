import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Activity } from "@/pages/Schedule";
import { differenceInBusinessDays, differenceInDays, parseISO } from "date-fns";

interface ActivityFormProps {
  onSubmit: (activity: Activity) => void;
  onCancel: () => void;
}

export const ActivityForm = ({ onSubmit, onCancel }: ActivityFormProps) => {
  const [serialNumber, setSerialNumber] = useState("");
  const [functionalDescription, setFunctionalDescription] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [includeWeekends, setIncludeWeekends] = useState(false);

  const calculateDuration = () => {
    if (!startDate || !endDate) return 0;
    
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (includeWeekends) {
      return differenceInDays(end, start) + 1;
    } else {
      return differenceInBusinessDays(end, start) + 1;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const activity: Activity = {
      id: Date.now().toString(),
      serialNumber,
      functionalDescription,
      activityDescription,
      startDate: parseISO(startDate),
      endDate: parseISO(endDate),
      includeWeekends,
      duration: calculateDuration(),
    };
    
    onSubmit(activity);
    
    // Reset form
    setSerialNumber("");
    setFunctionalDescription("");
    setActivityDescription("");
    setStartDate("");
    setEndDate("");
    setIncludeWeekends(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number *</Label>
          <Input
            id="serialNumber"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Ex: WTG-01"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="functionalDescription">Functional Description *</Label>
          <Input
            id="functionalDescription"
            value={functionalDescription}
            onChange={(e) => setFunctionalDescription(e.target.value)}
            placeholder="Ex: Foundation Works"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="activityDescription">Descrição da Atividade *</Label>
        <Textarea
          id="activityDescription"
          value={activityDescription}
          onChange={(e) => setActivityDescription(e.target.value)}
          placeholder="Descreva a atividade..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data de Início *</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endDate">Data de Término *</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="weekends">Incluir finais de semana</Label>
          <p className="text-sm text-muted-foreground">
            Considerar sábado e domingo no cálculo
          </p>
        </div>
        <Switch
          id="weekends"
          checked={includeWeekends}
          onCheckedChange={setIncludeWeekends}
        />
      </div>

      {startDate && endDate && (
        <div className="p-4 bg-vestas-blue-light rounded-lg">
          <p className="text-sm font-medium text-vestas-blue">
            Duração calculada: {calculateDuration()} dias
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Adicionar Atividade
        </Button>
      </div>
    </form>
  );
};
