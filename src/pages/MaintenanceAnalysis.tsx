import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Download, Copy, List } from "lucide-react";
import { toast } from "sonner";
import { PARK_NAMES, getSerialsByPark, getHolidaysByPark, SerialData } from "@/data/parksData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, addDays } from "date-fns";

interface SequencedSerial extends SerialData {
  sequence: number;
}

interface ScheduleEntry {
  seq: number;
  functionalLocation: string;
  serialNumber: string;
  team: string;
  startDate: string;
  endDate: string;
}

const MaintenanceAnalysis = () => {
  const navigate = useNavigate();
  const [parkName, setParkName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [teamCount, setTeamCount] = useState<number>(1);
  const [duration, setDuration] = useState<number>(1);
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [serials, setSerials] = useState<SequencedSerial[]>([]);
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [showSerials, setShowSerials] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem("authenticated") !== "true") {
      navigate("/");
    }
  }, [navigate]);

  const handleParkSelect = (value: string) => {
    setParkName(value);
    const parkSerials = getSerialsByPark(value);
    const parkHolidays = getHolidaysByPark(value);
    
    setSerials(parkSerials.map((s, idx) => ({ ...s, sequence: 0 })));
    setHolidays(parkHolidays);
    setShowSerials(false);
    setSchedule([]);
  };

  const handleGenerateSerials = () => {
    if (!parkName) {
      toast.error("Selecione um parque");
      return;
    }
    if (!serviceDescription || !startDate || !teamCount || !duration) {
      toast.error("Preencha todos os campos");
      return;
    }
    setShowSerials(true);
    toast.success("Tabela de seriais gerada");
  };

  const handleAutoSequence = () => {
    setSerials(prev => prev.map((s, idx) => ({ ...s, sequence: idx + 1 })));
    toast.success("Sequência preenchida automaticamente");
  };

  const handleSequenceChange = (index: number, value: string) => {
    const newSerials = [...serials];
    newSerials[index].sequence = parseInt(value) || 0;
    setSerials(newSerials);
  };

  const calculateWorkingDays = (start: Date, daysToAdd: number): Date => {
    let currentDate = new Date(start);
    let daysAdded = 0;

    while (daysAdded < daysToAdd) {
      currentDate = addDays(currentDate, 1);
      
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.some(h => 
        h.getDate() === currentDate.getDate() &&
        h.getMonth() === currentDate.getMonth() &&
        h.getFullYear() === currentDate.getFullYear()
      );

      if (includeWeekends || (!isWeekend && !isHoliday)) {
        daysAdded++;
      }
    }

    return currentDate;
  };

  const handleGenerateSchedule = () => {
    const hasAllSequences = serials.every(s => s.sequence > 0);
    if (!hasAllSequences) {
      toast.error("Preencha todas as sequências");
      return;
    }

    const sortedSerials = [...serials].sort((a, b) => a.sequence - b.sequence);
    const scheduleData: ScheduleEntry[] = [];
    const [day, month, year] = startDate.split('/');
    const baseStartDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    let teamDates: { [key: number]: Date } = {};
    for (let i = 1; i <= teamCount; i++) {
      teamDates[i] = new Date(baseStartDate);
    }

    sortedSerials.forEach((serial) => {
      const teamNumber = ((serial.sequence - 1) % teamCount) + 1;
      const team = `Equipe ${teamNumber}`;
      
      const entryStartDate = new Date(teamDates[teamNumber]);
      const entryEndDate = calculateWorkingDays(entryStartDate, duration - 1);
      
      scheduleData.push({
        seq: serial.sequence,
        functionalLocation: serial.functionalLocation,
        serialNumber: serial.serialNumber,
        team,
        startDate: format(entryStartDate, 'dd/MM/yyyy'),
        endDate: format(entryEndDate, 'dd/MM/yyyy')
      });

      teamDates[teamNumber] = addDays(entryEndDate, 1);
    });

    setSchedule(scheduleData);
    toast.success("Cronograma gerado com sucesso");
  };

  const handleCopySchedule = () => {
    const text = schedule.map(s => 
      `${s.seq}\t${s.functionalLocation}\t${s.serialNumber}\t${s.team}\t${s.startDate}\t${s.endDate}`
    ).join('\n');
    
    navigator.clipboard.writeText(text);
    toast.success("Dados copiados para a área de transferência");
  };

  const handleExportToExcel = () => {
    const headers = "Seq\tDescription of functional location\tSerial Number\tEquipe\tData de início\tData de finalização\n";
    const rows = schedule.map(s => 
      `${s.seq}\t${s.functionalLocation}\t${s.serialNumber}\t${s.team}\t${s.startDate}\t${s.endDate}`
    ).join('\n');
    
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `cronograma_${parkName}_${format(new Date(), 'ddMMyyyy')}.tsv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Arquivo exportado com sucesso");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-vestas-blue-light">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Análise da Manutenção</h1>
            <p className="text-muted-foreground">Planejamento e sequenciamento de serviços</p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Parâmetros do Serviço</CardTitle>
              <CardDescription>
                Defina os parâmetros básicos para o planejamento da manutenção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="park">Nome do Parque *</Label>
                  <Select onValueChange={handleParkSelect} value={parkName}>
                    <SelectTrigger id="park">
                      <SelectValue placeholder="Selecione o parque" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARK_NAMES.map((park) => (
                        <SelectItem key={park} value={park}>
                          {park}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Descrição do Service *</Label>
                  <Input
                    id="service"
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Ex: Manutenção Preventiva Anual"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início (dd/mm/yyyy) *</Label>
                  <Input
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="23/03/2026"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teams">Quantidade de Equipes *</Label>
                  <Input
                    id="teams"
                    type="number"
                    min="1"
                    value={teamCount}
                    onChange={(e) => setTeamCount(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duração em Dias do Service *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="weekends"
                    checked={includeWeekends}
                    onCheckedChange={setIncludeWeekends}
                  />
                  <Label htmlFor="weekends">Trabalhar aos sábados, domingos e feriados</Label>
                </div>
              </div>

              <Button onClick={handleGenerateSerials} className="w-full md:w-auto">
                <List className="w-4 h-4 mr-2" />
                Gerar Tabela de Seriais
              </Button>
            </CardContent>
          </Card>

          {showSerials && (
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sequenciamento dos Seriais</CardTitle>
                    <CardDescription>
                      Defina a ordem de execução de cada serial
                    </CardDescription>
                  </div>
                  <Button onClick={handleAutoSequence} variant="outline">
                    Preencher Automaticamente
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sequence</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Description of Functional Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serials.map((serial, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={serial.sequence || ""}
                              onChange={(e) => handleSequenceChange(idx, e.target.value)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>{serial.serialNumber}</TableCell>
                          <TableCell>{serial.functionalLocation}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Button onClick={handleGenerateSchedule} className="mt-4 w-full md:w-auto">
                  Gerar Cronograma
                </Button>
              </CardContent>
            </Card>
          )}

          {schedule.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cronograma Gerado</CardTitle>
                    <CardDescription>
                      Cronograma final com datas e equipes
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCopySchedule} variant="outline">
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                    <Button onClick={handleExportToExcel}>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seq</TableHead>
                        <TableHead>Description of functional location</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Equipe</TableHead>
                        <TableHead>Data de início</TableHead>
                        <TableHead>Data de finalização</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedule.map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{entry.seq}</TableCell>
                          <TableCell>{entry.functionalLocation}</TableCell>
                          <TableCell>{entry.serialNumber}</TableCell>
                          <TableCell>{entry.team}</TableCell>
                          <TableCell>{entry.startDate}</TableCell>
                          <TableCell>{entry.endDate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceAnalysis;
