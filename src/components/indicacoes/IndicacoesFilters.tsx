import { useState, useMemo } from "react";
import { Search, Filter, MapPin, Tag, Calendar, User, SortAsc, FileText, CheckCircle2, Send, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface IndicacoesFiltersProps {
  onFiltersChange: (filters: any) => void;
  totalIndicacoes: number;
  indicacoes: any[];
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export function IndicacoesFilters({
  onFiltersChange,
  totalIndicacoes,
  indicacoes,
  statusFilter = "todos",
  onStatusFilterChange
}: IndicacoesFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBairro, setSelectedBairro] = useState("todos");
  const [selectedAutor, setSelectedAutor] = useState("todos");
  const [selectedEleitor, setSelectedEleitor] = useState("todos");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasVoterRequest, setHasVoterRequest] = useState(false);

  // Extrair dados reais das indicações
  const bairrosReais = useMemo(() => {
    const bairros = indicacoes
      .map((ind: any) => ind.endereco_bairro)
      .filter(Boolean);
    return Array.from(new Set(bairros)).sort();
  }, [indicacoes]);

  const autoresReais = useMemo(() => {
    const autores = indicacoes
      .map((ind: any) => ind.userName || 'Sistema')
      .filter(Boolean);
    return Array.from(new Set(autores)).sort();
  }, [indicacoes]);

  const tagsReais = useMemo(() => {
    const todasTags = indicacoes
      .map((ind: any) => ind.tag)
      .filter(Boolean);
    return Array.from(new Set(todasTags)).sort();
  }, [indicacoes]);

  const eleitoresReais = useMemo(() => {
    const eleitores = indicacoes
      .map((ind: any) => ind.eleitor_nome)
      .filter(Boolean);
    return Array.from(new Set(eleitores)).sort();
  }, [indicacoes]);

  const statusOptions = [
    { value: "todos", label: "Todos os Status" },
    { value: "criada", label: "Criada" },
    { value: "formalizada", label: "Formalizada" },
    { value: "protocolada", label: "Protocolada" },
    { value: "pendente", label: "Pendente" },
    { value: "atendida", label: "Atendida" }
  ];

  const bairrosOptions = bairrosReais;

  const tagsOptions = tagsReais;

  const dateOptions = [
    { value: "todos", label: "Todo período" },
    { value: "hoje", label: "Hoje" },
    { value: "7dias", label: "Últimos 7 dias" },
    { value: "30dias", label: "Últimos 30 dias" },
    { value: "90dias", label: "Últimos 90 dias" }
  ];

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    updateFilters({ tags: newTags });
  };

  const updateFilters = (newFilters: any) => {
    const filters = {
      search: searchTerm,
      bairro: selectedBairro,
      autor: selectedAutor,
      eleitor: selectedEleitor,
      tags: selectedTags,
      hasVoterRequest,
      ...newFilters
    };
    onFiltersChange(filters);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedBairro("todos");
    setSelectedAutor("todos");
    setSelectedEleitor("todos");
    setSelectedTags([]);
    setHasVoterRequest(false);
    onFiltersChange({
      search: "",
      bairro: "todos",
      autor: "todos",
      eleitor: "todos",
      tags: [],
      hasVoterRequest: false
    });
  };

  const activeFiltersCount = [
    searchTerm,
    selectedBairro !== "todos" ? selectedBairro : null,
    selectedAutor !== "todos" ? selectedAutor : null,
    selectedEleitor !== "todos" ? selectedEleitor : null,
    selectedTags.length > 0 ? selectedTags : null,
    hasVoterRequest ? "voter" : null
  ].filter(Boolean).length;

  return (
    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex flex-col gap-3">
          {/* Main Search Row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 max-w-[240px] relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/40 w-3 h-3 group-focus-within:text-primary/50 transition-colors" />
              <Input
                placeholder="Buscar proposição..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  updateFilters({ search: e.target.value });
                }}
                className="pl-9 h-8 text-[11px] bg-muted/20 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/10 rounded-lg placeholder:text-muted-foreground/30 font-medium"
              />
            </div>

            {/* Mini Status Selectors - Ultra Minimalist */}
            <div className="flex-1 flex justify-center items-center gap-0.5 overflow-x-auto hide-scrollbar px-2 border-l border-r border-border/20">
              {[
                { id: "todos", label: "Tudo" },
                { id: "criada", label: "Criada" },
                { id: "formalizada", label: "Formaliz." },
                { id: "protocolada", label: "Protoc." },
                { id: "pendente", label: "Pend." },
                { id: "atendida", label: "Atend." }
              ].map((status) => {
                const count = status.id === "todos"
                  ? indicacoes.length
                  : indicacoes.filter(i => i.status === status.id).length;
                const isActive = statusFilter === status.id;

                return (
                  <button
                    key={status.id}
                    onClick={() => onStatusFilterChange?.(status.id)}
                    className={`flex items-center gap-1.5 px-2.5 h-7 rounded-md transition-all whitespace-nowrap ${isActive
                      ? 'bg-primary/5 text-primary border border-primary/20'
                      : 'text-muted-foreground/40 hover:text-foreground/60'
                      }`}
                  >
                    <span className={`text-[10px] font-bold tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                      {count}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest hidden lg:inline">
                      {status.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={`h-8 px-3 gap-2 rounded-lg transition-all text-muted-foreground/40 hover:text-primary ${activeFiltersCount > (searchTerm ? 1 : 0) ? 'text-primary' : ''}`}
                >
                  <Filter className="w-3.5 h-3.5 opacity-50" />
                  <span className="hidden md:inline text-[9px] font-bold uppercase tracking-[0.1em]">Filtrar</span>
                  {activeFiltersCount > (searchTerm ? 1 : 0) && (
                    <Badge className="h-4 min-w-4 rounded-full p-0 text-[8px] flex items-center justify-center bg-primary text-primary-foreground border-none">
                      {activeFiltersCount - (searchTerm ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-4 space-y-4 rounded-2xl shadow-2xl border-border/50 bg-card z-50 overflow-y-auto max-h-[80vh]" align="end">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Otimizar Busca</h4>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-[9px] font-bold uppercase text-primary hover:text-primary/80 px-2">
                      Limpar Tudo
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Território (Bairro)</Label>
                    <Select
                      value={selectedBairro}
                      onValueChange={(value) => {
                        setSelectedBairro(value);
                        updateFilters({ bairro: value });
                      }}
                    >
                      <SelectTrigger className="h-10 bg-muted/30 border-none rounded-xl text-xs font-medium">
                        <SelectValue placeholder="Todas as regiões" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/50 shadow-xl z-[60]">
                        <SelectItem value="todos">Todos os bairros</SelectItem>
                        {bairrosOptions.map(bairro => (
                          <SelectItem key={bairro} value={bairro}>{bairro}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Autoria</Label>
                    <Select
                      value={selectedAutor}
                      onValueChange={(value) => {
                        setSelectedAutor(value);
                        updateFilters({ autor: value });
                      }}
                    >
                      <SelectTrigger className="h-10 bg-muted/30 border-none rounded-xl text-xs font-medium">
                        <SelectValue placeholder="Todos os autores" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/50 shadow-xl z-[60]">
                        <SelectItem value="todos">Todos os autores</SelectItem>
                        {autoresReais.map(autor => (
                          <SelectItem key={autor} value={autor}>{autor}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Eleitor Solicitante</Label>
                    <Select
                      value={selectedEleitor}
                      onValueChange={(value) => {
                        setSelectedEleitor(value);
                        updateFilters({ eleitor: value });
                      }}
                    >
                      <SelectTrigger className="h-10 bg-muted/30 border-none rounded-xl text-xs font-medium">
                        <SelectValue placeholder="Filtrar por eleitor" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/50 shadow-xl z-[60]">
                        <SelectItem value="todos">Todos os eleitores</SelectItem>
                        {eleitoresReais.map(eleitor => (
                          <SelectItem key={eleitor} value={eleitor}>{eleitor}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground/70 ml-1">Tags (Categorias)</Label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-muted/20 rounded-xl border border-border/30">
                      {tagsOptions.length > 0 ? tagsOptions.map(tag => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? "default" : "outline"}
                          className={`cursor-pointer text-[9px] uppercase font-bold py-0.5 px-2 transition-all ${selectedTags.includes(tag) ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted opacity-60 hover:opacity-100'}`}
                          onClick={() => handleTagToggle(tag)}
                        >
                          {tag}
                        </Badge>
                      )) : <span className="text-[9px] text-muted-foreground p-1 italic leading-none">Nenhuma tag cadastrada</span>}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtros ativos */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>

              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Busca: "{searchTerm}"
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      updateFilters({ search: "" });
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}


              {selectedBairro !== "todos" && (
                <Badge variant="secondary" className="gap-1">
                  Bairro: {selectedBairro}
                  <button
                    onClick={() => {
                      setSelectedBairro("todos");
                      updateFilters({ bairro: "todos" });
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  Tag: {tag}
                  <button
                    onClick={() => handleTagToggle(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}

              {selectedAutor !== "todos" && (
                <Badge variant="secondary" className="gap-1">
                  Autor: {selectedAutor}
                  <button
                    onClick={() => {
                      setSelectedAutor("todos");
                      updateFilters({ autor: "todos" });
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}

              {selectedEleitor !== "todos" && (
                <Badge variant="secondary" className="gap-1">
                  Eleitor: {selectedEleitor}
                  <button
                    onClick={() => {
                      setSelectedEleitor("todos");
                      updateFilters({ eleitor: "todos" });
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Contador de resultados */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{totalIndicacoes} indicações encontradas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}