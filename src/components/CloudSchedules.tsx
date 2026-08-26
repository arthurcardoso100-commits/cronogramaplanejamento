import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Cloud, CloudUpload, Copy, FolderOpen, Info, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface SavedSchedule {
  id: string;
  name: string;
  module: string;
  park_name: string | null;
  payload: any;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CloudSchedulesProps {
  module: "maintenance" | "vestas";
  parkName?: string;
  /** Returns the current state to be saved */
  getState: () => any;
  /** Applies a loaded state to the page */
  applyState: (payload: any) => void;
}

export const CloudSchedules = ({ module, parkName, getState, applyState }: CloudSchedulesProps) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SavedSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_schedules")
      .select("*")
      .eq("module", module)
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Erro ao carregar cronogramas da nuvem");
      return;
    }
    setItems((data as SavedSchedule[]) || []);
  };

  useEffect(() => {
    if (open) fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = async (asNew: boolean) => {
    if (!name.trim()) {
      toast.error("Informe um nome para o cronograma");
      return;
    }
    if (!userId) {
      toast.error("Faça login para salvar cronogramas");
      return;
    }
    setSaving(true);
    const payload = getState();

    if (!asNew && currentId) {
      const { error } = await supabase
        .from("saved_schedules")
        .update({ name: name.trim(), park_name: parkName || null, payload })
        .eq("id", currentId);
      setSaving(false);
      if (error) {
        toast.error("Erro ao atualizar cronograma");
        return;
      }
      toast.success("Cronograma atualizado na nuvem");
    } else {
      const { data, error } = await supabase
        .from("saved_schedules")
        .insert({ name: name.trim(), module, park_name: parkName || null, payload, user_id: userId })
        .select()
        .single();
      setSaving(false);
      if (error) {
        toast.error("Erro ao salvar cronograma");
        return;
      }
      setCurrentId((data as SavedSchedule).id);
      toast.success("Cronograma salvo na nuvem");
    }
    fetchItems();
  };

  const handleLoad = (item: SavedSchedule) => {
    applyState(item.payload);
    setCurrentId(item.user_id === userId ? item.id : null);
    setName(item.name);
    setOpen(false);
    toast.success(`Cronograma "${item.name}" carregado`);
  };

  const handleDuplicate = async (item: SavedSchedule) => {
    if (!userId) {
      toast.error("Faça login para duplicar cronogramas");
      return;
    }
    const { error } = await supabase.from("saved_schedules").insert({
      name: `${item.name} (cópia)`,
      module: item.module,
      park_name: item.park_name,
      payload: item.payload,
      user_id: userId,
    });
    if (error) {
      toast.error("Erro ao duplicar cronograma");
      return;
    }
    toast.success("Cronograma duplicado");
    fetchItems();
  };

  const handleDelete = async (item: SavedSchedule) => {
    const { error } = await supabase.from("saved_schedules").delete().eq("id", item.id);
    if (error) {
      toast.error("Erro ao excluir cronograma");
      return;
    }
    if (currentId === item.id) setCurrentId(null);
    toast.success("Cronograma excluído");
    fetchItems();
  };

  const handleQuickSave = () => {
    if (!name.trim()) {
      const suggested = [parkName, format(new Date(), "dd/MM/yyyy HH:mm")]
        .filter(Boolean)
        .join(" - ");
      setName(suggested);
    }
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Cloud className="w-4 h-4" />
                Cronogramas na Nuvem
                <Info className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Acesse aqui seu cronograma Salvo</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button variant="default" className="gap-2" onClick={handleQuickSave}>
        <CloudUpload className="w-4 h-4" />
        Salvar na Nuvem
      </Button>
      <DialogContent className="max-w-2xl bg-background">
        <DialogHeader>
          <DialogTitle>Cronogramas na Nuvem</DialogTitle>
          <DialogDescription>
            Salve o cronograma atual, carregue, duplique ou exclua cronogramas salvos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cloud-name">Nome do cronograma</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="cloud-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Service 1Y - Jerusalém 2026"
            />
            <div className="flex gap-2">
              <Button onClick={() => handleSave(!currentId)} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                {currentId ? "Atualizar" : "Salvar"}
              </Button>
              {currentId && (
                <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
                  Salvar como novo
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="border-t pt-4 max-h-[45vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum cronograma salvo ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.park_name ? `${item.park_name} • ` : ""}
                      Atualizado em {format(new Date(item.updated_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleLoad(item)} className="gap-1">
                      <FolderOpen className="w-4 h-4" />
                      Abrir
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => handleDuplicate(item)} title="Duplicar">
                      <Copy className="w-4 h-4" />
                    </Button>
                    {item.user_id === userId && (
                      <Button size="icon" variant="outline" onClick={() => handleDelete(item)} title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
