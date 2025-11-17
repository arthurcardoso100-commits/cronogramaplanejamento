import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, Download, Plus, Trash2, LogOut } from "lucide-react";
import { ActivityForm } from "@/components/ActivityForm";
import { ActivityList } from "@/components/ActivityList";
import { generatePDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";

export interface Activity {
  id: string;
  serialNumber: string;
  functionalDescription: string;
  activityDescription: string;
  startDate: Date;
  endDate: Date;
  includeWeekends: boolean;
  duration: number;
}

const Schedule = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("authenticated") !== "true") {
      navigate("/");
    }
  }, [navigate]);

  const handleAddActivity = (activity: Activity) => {
    setActivities([...activities, activity]);
    setShowForm(false);
    toast.success("Atividade adicionada");
  };

  const handleRemoveActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
    toast.success("Atividade removida");
  };

  const handleGeneratePDF = () => {
    if (activities.length === 0) {
      toast.error("Adicione pelo menos uma atividade");
      return;
    }
    
    generatePDF(activities);
    toast.success("PDF gerado com sucesso");
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
                  <CardTitle>Atividades do Cronograma</CardTitle>
                  <CardDescription>
                    Adicione atividades para gerar o cronograma em PDF
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!showForm && (
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Atividade
                    </Button>
                  )}
                  {activities.length > 0 && (
                    <Button onClick={handleGeneratePDF} variant="default">
                      <Download className="w-4 h-4 mr-2" />
                      Gerar PDF
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showForm ? (
                <ActivityForm
                  onSubmit={handleAddActivity}
                  onCancel={() => setShowForm(false)}
                />
              ) : activities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wind className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma atividade adicionada ainda</p>
                  <p className="text-sm mt-2">Clique em "Nova Atividade" para começar</p>
                </div>
              ) : (
                <ActivityList
                  activities={activities}
                  onRemove={handleRemoveActivity}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
