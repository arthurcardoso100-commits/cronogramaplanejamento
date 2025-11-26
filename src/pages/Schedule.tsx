import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wind, Download, Plus, Trash2, LogOut, ArrowLeft } from "lucide-react";
import { ActivityForm } from "@/components/ActivityForm";
import { ActivityList } from "@/components/ActivityList";
import { generatePDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import { PARK_NAMES, getHolidaysByPark } from "@/data/parksData";

export interface Activity {
  id: string;
  serialNumber: string;
  functionalDescription: string;
  activityDescription: string;
  startDate: Date;
  endDate: Date;
  includeWeekends: boolean;
  duration: number;
  predecessor: string;
  team?: string;
}

const Schedule = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [parkName, setParkName] = useState("");
  const [holidays, setHolidays] = useState<Date[]>([]);

  useEffect(() => {
    if (sessionStorage.getItem("authenticated") !== "true") {
      navigate("/");
    }
  }, [navigate]);

  const handleAddActivities = (newActivities: Activity[]) => {
    setActivities(newActivities);
    setShowForm(false);
    toast.success(`${newActivities.length} atividades adicionadas`);
  };

  const handleRemoveActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
    toast.success("Atividade removida");
  };

  const handleParkSelect = (value: string) => {
    setParkName(value);
    const parkHolidays = getHolidaysByPark(value);
    setHolidays(parkHolidays);
  };

  const handleGeneratePDF = () => {
    if (activities.length === 0) {
      toast.error("Adicione pelo menos uma atividade");
      return;
    }
    
    if (!activityName || !parkName) {
      toast.error("Informe o nome da atividade e do parque");
      return;
    }
    
    generatePDF(activities, activityName, parkName);
    toast.success("PDF gerado com sucesso");
  };

  const handleClearData = () => {
    setActivities([]);
    setActivityName("");
    setParkName("");
    setHolidays([]);
    toast.success("Dados limpos com sucesso");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("authenticated");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-vestas-blue-light">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
              <Wind className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Vestas Planejamento</h1>
              <p className="text-muted-foreground">Gerador de Cronogramas</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <div className="grid gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Informações do Cronograma</CardTitle>
                  <CardDescription>
                    Preencha as informações básicas e importe as atividades
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleClearData} variant="outline" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Limpar Dados
                  </Button>
                  <Button onClick={handleGeneratePDF} variant="default" className="gap-2">
                    <Download className="w-4 h-4" />
                    Gerar PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activityName">Nome da Atividade *</Label>
                  <Input
                    id="activityName"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    placeholder="Ex: Service 1Y"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parkName">Nome do Parque *</Label>
                  <Select value={parkName} onValueChange={handleParkSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o parque" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {PARK_NAMES.map((park) => (
                        <SelectItem key={park} value={park}>
                          {park}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Atividades</h3>
                    <p className="text-sm text-muted-foreground">
                      Cole os dados do Excel com todas as atividades
                    </p>
                  </div>
                  {!showForm && activities.length > 0 && (
                    <Button onClick={() => setShowForm(true)} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Importar Mais
                    </Button>
                  )}
                </div>
                {showForm ? (
                  <ActivityForm
                    onSubmit={handleAddActivities}
                    onCancel={() => setShowForm(false)}
                    parkName={parkName}
                    holidays={holidays}
                  />
                ) : activities.length === 0 ? (
                  <div className="text-center py-12">
                    <Button onClick={() => setShowForm(true)} size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Importar Atividades
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      Cole os dados do Excel: Seq | Description | Serial Number | Equipe | Data Início | Data Fim | Predecessora
                    </p>
                  </div>
                ) : (
                  <ActivityList
                    activities={activities}
                    onRemove={handleRemoveActivity}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
