import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Trash2, Edit, RefreshCw, Filter, X, Search, Grid3x3, List, Calendar, Tag, LayoutGrid, CheckCircle2, ListTree, MessageSquare, Flag, Circle, FileText } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { CreateCustomTagModal } from "@/components/modals/CreateCustomTagModal";
import { ModernSelect } from "@/components/ui/ModernSelect";
import { CategoryMindMap } from "@/components/categorias/CategoryMindMap";
import { supabase } from "@/integrations/supabase/client";
import { getVoterCountFromFilters } from "@/utils/voterFilters";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useAuthContext } from "@/components/AuthProvider";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PermissionGuard } from "@/components/PermissionGuard";

interface PublicoFiltros {
  sexo?: string;
  neighborhood?: string | string[];
  minAge?: number;
  maxAge?: number;
  tags?: string[];
  isLeader?: boolean;
  profession?: string | string[];
  city?: string | string[];
  birthdayMonth?: number;
  birthdayType?: 'month' | 'today' | 'week' | 'current_month' | 'next_x_days';
  birthdayDays?: number;
  demandasTotal?: number;
  demandasPeriod?: string;
  demandasType?: string;
  demandasFilterType?: 'total' | 'atendida' | 'pendente_x_dias' | 'sem_registro_x_dias';
  demandasDays?: number;
  indicacoesFilterType?: 'atendida' | 'pendente_x_dias' | 'sem_registro_x_dias';
  indicacoesDays?: number;
}

type FilterType = 'sexo' | 'neighborhood' | 'age' | 'isLeader' | 'profession' | 'birthday' | 'demandas' | 'indicacoes' | 'city';

interface Publico {
  id: string;
  nome: string;
  descricao: string | null;
  filtros: PublicoFiltros | any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  voter_count?: number;
  cor?: string;
}

interface CustomTag {
  id: string;
  ids: string[]; // List of all database IDs with this same name
  name: string;
  category: string;
  categories: string[]; // List of all categories this name belongs to
  subcategory?: string;
  color: string;
  icon: string;
  created_at: string;
  gabinete_id: string;
  voter_count?: number;
  demand_count?: number;
  indication_count?: number;
  project_count?: number;
}

const filterOptions = [
  { type: 'sexo' as FilterType, label: 'Sexo' },
  { type: 'age' as FilterType, label: 'Idade' },
  { type: 'neighborhood' as FilterType, label: 'Bairro' },
  { type: 'isLeader' as FilterType, label: 'Tipo de Eleitor' },
  { type: 'profession' as FilterType, label: 'Profissão' },
  { type: 'birthday' as FilterType, label: 'Aniversário' },
  { type: 'demandas' as FilterType, label: 'Demandas' },
  { type: 'indicacoes' as FilterType, label: 'Indicações' },
  { type: 'city' as FilterType, label: 'Cidade' },
];

export default function Publicos() {
  const { user } = useAuthContext();
  const { activeInstitution } = useActiveInstitution();
  const [contentType, setContentType] = useState<"publicos" | "tags" | "categorias">("publicos");
  const [publicos, setPublicos] = useState<Publico[]>([]);
  const [tags, setTags] = useState<CustomTag[]>([]);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPublico, setEditingPublico] = useState<Publico | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [tagModalOpen, setTagModalOpen] = useState(false);

  // Form state
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState("#6366f1");

  // Active filters
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);

  // Filter values
  const [sexo, setSexo] = useState("todos");
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [isLeader, setIsLeader] = useState("todos");

  const renderTagIcon = (iconName: string, className?: string, style?: React.CSSProperties) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className={className || "h-4 w-4"} style={style} /> : <Tag className={className || "h-4 w-4"} style={style} />;
  };
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [birthdayMonth, setBirthdayMonth] = useState("");
  const [birthdayType, setBirthdayType] = useState<string>("month");
  const [birthdayDays, setBirthdayDays] = useState("7");
  const [demandasTotal, setDemandasTotal] = useState("");
  const [demandasPeriod, setDemandasPeriod] = useState("7");
  const [demandasType, setDemandasType] = useState("todos");
  const [demandasFilterType, setDemandasFilterType] = useState<string>("total");
  const [demandasDays, setDemandasDays] = useState("30");
  const [indicacoesFilterType, setIndicacoesFilterType] = useState<string>("atendida");
  const [indicacoesDays, setIndicacoesDays] = useState("30");



  // Neighborhoods, professions and cities list
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [professions, setProfessions] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (activeInstitution?.cabinet_id) {
      if (contentType === "publicos") {
        fetchPublicos();
      } else {
        fetchTags();
      }
      fetchNeighborhoods();
      fetchProfessions();
      fetchCities();
    }
  }, [activeInstitution?.cabinet_id, contentType]);

  const fetchNeighborhoods = async () => {
    if (!activeInstitution?.cabinet_id) return;

    const { data } = await supabase
      .from('eleitores')
      .select('neighborhood')
      .eq('gabinete_id', activeInstitution.cabinet_id)
      .not('neighborhood', 'is', null);

    if (data) {
      const uniqueNeighborhoods = [...new Set(data.map(e => e.neighborhood).filter(Boolean))] as string[];
      setNeighborhoods(uniqueNeighborhoods);
    }
  };

  const fetchProfessions = async () => {
    if (!activeInstitution?.cabinet_id) return;

    const { data } = await supabase
      .from('eleitores')
      .select('profession')
      .eq('gabinete_id', activeInstitution.cabinet_id)
      .not('profession', 'is', null);

    if (data) {
      const uniqueProfessions = [...new Set(data.map(e => e.profession).filter(Boolean))] as string[];
      setProfessions(uniqueProfessions);
    }
  };

  const fetchCities = async () => {
    if (!activeInstitution?.cabinet_id) return;

    const { data } = await supabase
      .from('eleitores')
      .select('cidade')
      .eq('gabinete_id', activeInstitution.cabinet_id)
      .not('cidade', 'is', null);

    if (data) {
      const uniqueCities = [...new Set(data.map(e => e.cidade).filter(Boolean))] as string[];
      setCities(uniqueCities);
    }
  };

  const filteredPublicos = publicos.filter((publico) =>
    publico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    publico.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTags = tags.filter((tag) =>
    (tag.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tag.categories || []).some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fetchPublicos = async () => {
    if (!activeInstitution?.cabinet_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('publicos')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Optimizar: buscar contagem em paralelo mas com tratamento de erro individual
      const publicosWithCount = await Promise.all(
        (data || []).map(async (publico) => {
          try {
            const count = await getVoterCount(publico.filtros);
            return { ...publico, voter_count: count };
          } catch (err) {
            console.error(`Error counting voters for publico ${publico.id}:`, err);
            return { ...publico, voter_count: 0 };
          }
        })
      );

      setPublicos(publicosWithCount);
    } catch (error: any) {
      console.error('Error fetching publicos:', error);
      toast.error('Erro ao carregar públicos');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    if (!activeInstitution?.cabinet_id) return;

    setLoading(true);
    try {
      const [
        customTagsResponse,
        eleitorTagsResponse,
        eleitoresCountResponse,
        demandasCountResponse,
        indicacoesCountResponse
      ] = await Promise.all([
        supabase
          .from('gabinete_custom_tags')
          .select('*')
          .eq('gabinete_id', activeInstitution.cabinet_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('eleitor_tags')
          .select('*')
          .eq('gabinete_id', activeInstitution.cabinet_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('eleitores')
          .select('id, tags')
          .eq('gabinete_id', activeInstitution.cabinet_id),
        supabase
          .from('demandas')
          .select('id, tag_id' as any)
          .eq('gabinete_id', activeInstitution.cabinet_id),
        supabase
          .from('indicacoes')
          .select('id, tag')
          .eq('gabinete_id', activeInstitution.cabinet_id)
      ]);

      const errors = [
        customTagsResponse.error,
        eleitorTagsResponse.error,
        eleitoresCountResponse.error,
        demandasCountResponse.error,
        indicacoesCountResponse.error
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('Errors fetching tag-related data:', errors);
      }

      const rawCustomTags = customTagsResponse.data || [];
      const rawEleitorTags = (eleitorTagsResponse.data || []).map(tag => ({
        ...tag,
        category: 'eleitores',
        subcategory: undefined,
        color: tag.color || '#94a3b8',
        icon: tag.icon || 'tag'
      }));

      const allRawTags = [...rawCustomTags, ...rawEleitorTags];
      const eleitores = eleitoresCountResponse.data || [];
      const demandas = (demandasCountResponse.data || []) as any[];
      const indicacoes = indicacoesCountResponse.data || [];

      // Grouping logic
      const groupedTagsMap: Record<string, CustomTag> = {};

      allRawTags.forEach(rawTag => {
        const normalizedName = rawTag.name.trim().toUpperCase();

        if (!groupedTagsMap[normalizedName]) {
          groupedTagsMap[normalizedName] = {
            id: rawTag.id,
            ids: [rawTag.id],
            name: rawTag.name,
            category: rawTag.category,
            categories: [rawTag.category],
            subcategory: (rawTag as any).subcategory,
            color: rawTag.color || '#6366f1',
            icon: rawTag.icon || 'Tag',
            created_at: rawTag.created_at || new Date().toISOString(),
            gabinete_id: rawTag.gabinete_id || '',
            voter_count: 0,
            demand_count: 0,
            indication_count: 0,
            project_count: 0
          };
        } else {
          // Merge logic
          const existing = groupedTagsMap[normalizedName];
          existing.ids.push(rawTag.id);
          if (!existing.categories.includes(rawTag.category)) {
            existing.categories.push(rawTag.category);
          }
          // Prioritize non-empty subcategories
          if (!existing.subcategory && (rawTag as any).subcategory) {
            existing.subcategory = (rawTag as any).subcategory;
          }
        }
      });

      const tagsWithCount = Object.values(groupedTagsMap).map(tag => {
        const voterCount = eleitores.filter(e =>
          e.tags && Array.isArray(e.tags) && e.tags.includes(tag.name)
        ).length;

        const demandCount = demandas.filter(d =>
          tag.ids.includes(d.tag_id)
        ).length;

        const indicationCount = indicacoes.filter(i =>
          i.tag === tag.name
        ).length;

        // Note: Project tagging mapping might be needed in the future
        const projectCount = 0;

        return {
          ...tag,
          voter_count: voterCount,
          demand_count: demandCount,
          indication_count: indicationCount,
          project_count: projectCount
        };
      });

      setTags(tagsWithCount);
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      toast.error('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const getTagVoterCount = async (tagName: string) => {
    if (!activeInstitution?.cabinet_id) return 0;

    const { data } = await supabase
      .from('eleitores')
      .select('id, tags')
      .eq('gabinete_id', activeInstitution.cabinet_id);

    if (!data) return 0;

    // Count eleitores that have this tag in their tags array
    const count = data.filter(eleitor =>
      eleitor.tags && Array.isArray(eleitor.tags) && eleitor.tags.includes(tagName)
    ).length;

    return count;
  };

  const getVoterCount = async (filtros: any) => {
    if (!activeInstitution?.cabinet_id) return 0;
    return getVoterCountFromFilters(supabase, activeInstitution.cabinet_id, filtros);
  };

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setCor("#6366f1");
    setActiveFilters([]);
    setSexo("todos");
    setSelectedNeighborhoods([]);
    setMinAge("");
    setMaxAge("");
    setIsLeader("todos");
    setSelectedProfessions([]);
    setSelectedCities([]);
    setBirthdayMonth("");
    setBirthdayType("month");
    setBirthdayDays("7");
    setDemandasTotal("");
    setDemandasPeriod("7");
    setDemandasType("todos");
    setDemandasFilterType("total");
    setDemandasDays("30");
    setIndicacoesFilterType("atendida");
    setIndicacoesDays("30");
    setEditingPublico(null);
  };

  const addFilter = (filterType: FilterType) => {
    if (!activeFilters.includes(filterType)) {
      setActiveFilters([...activeFilters, filterType]);
    }
  };

  const removeFilter = (filterType: FilterType) => {
    setActiveFilters(activeFilters.filter(f => f !== filterType));

    // Reset filter values completely to prevent them from being saved if the rule is removed
    switch (filterType) {
      case 'sexo':
        setSexo("todos");
        break;
      case 'neighborhood':
        setSelectedNeighborhoods([]);
        break;
      case 'city':
        setSelectedCities([]);
        break;
      case 'age':
        setMinAge("");
        setMaxAge("");
        break;
      case 'isLeader':
        setIsLeader("todos");
        break;
      case 'profession':
        setSelectedProfessions([]);
        break;
      case 'birthday':
        setBirthdayMonth("");
        setBirthdayType("month");
        setBirthdayDays("7");
        break;
      case 'demandas':
        setDemandasTotal("");
        setDemandasPeriod("7");
        setDemandasType("todos");
        setDemandasFilterType("total");
        setDemandasDays("30");
        break;
      case 'indicacoes':
        setIndicacoesFilterType("atendida");
        setIndicacoesDays("30");
        break;
    }
  };

  const availableFilters = [
    { type: 'sexo' as FilterType, label: 'Sexo' },
    { type: 'age' as FilterType, label: 'Idade' },
    { type: 'neighborhood' as FilterType, label: 'Bairro' },
    { type: 'isLeader' as FilterType, label: 'Tipo de Eleitor' },
    { type: 'profession' as FilterType, label: 'Profissão' },
    { type: 'birthday' as FilterType, label: 'Aniversário' },
    { type: 'demandas' as FilterType, label: 'Demandas' },
    { type: 'indicacoes' as FilterType, label: 'Indicações' },
    { type: 'city' as FilterType, label: 'Cidade' },
  ].filter(f => !activeFilters.includes(f.type));

  const handleOpenCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (publico: Publico) => {
    setEditingPublico(publico);
    setNome(publico.nome);
    setDescricao(publico.descricao || "");
    setCor(publico.cor || "#6366f1");

    // Detect active filters from existing publico
    const filters: FilterType[] = [];
    if (publico.filtros.sexo) filters.push('sexo');
    if (publico.filtros.neighborhood) {
      if (Array.isArray(publico.filtros.neighborhood)) {
        setSelectedNeighborhoods(publico.filtros.neighborhood);
      } else {
        setSelectedNeighborhoods([publico.filtros.neighborhood]);
      }
      filters.push('neighborhood');
    }
    if (publico.filtros.city) {
      if (Array.isArray(publico.filtros.city)) {
        setSelectedCities(publico.filtros.city);
      } else {
        setSelectedCities([publico.filtros.city]);
      }
      filters.push('city');
    }
    if (publico.filtros.minAge || publico.filtros.maxAge) filters.push('age');
    if (publico.filtros.isLeader !== undefined) filters.push('isLeader');
    if (publico.filtros.profession) {
      if (Array.isArray(publico.filtros.profession)) {
        setSelectedProfessions(publico.filtros.profession);
      } else {
        setSelectedProfessions([publico.filtros.profession]);
      }
      filters.push('profession');
    }
    if (publico.filtros.birthdayMonth || publico.filtros.birthdayType) filters.push('birthday');
    if (publico.filtros.demandasTotal || publico.filtros.demandasPeriod || publico.filtros.demandasFilterType) filters.push('demandas');
    if (publico.filtros.indicacoesFilterType) filters.push('indicacoes');

    setActiveFilters(filters);
    setSexo(publico.filtros.sexo || "todos");
    setMinAge(publico.filtros.minAge?.toString() || "");
    setMaxAge(publico.filtros.maxAge?.toString() || "");
    setIsLeader(publico.filtros.isLeader !== undefined ? String(publico.filtros.isLeader) : "todos");
    setBirthdayMonth(publico.filtros.birthdayMonth?.toString() || "");
    setBirthdayType(publico.filtros.birthdayType || (publico.filtros.birthdayMonth ? "month" : "today"));
    setBirthdayDays(publico.filtros.birthdayDays?.toString() || "7");
    setDemandasTotal(publico.filtros.demandasTotal?.toString() || "");
    setDemandasPeriod(publico.filtros.demandasPeriod || "7");
    setDemandasType(publico.filtros.demandasType || "todos");
    setDemandasFilterType(publico.filtros.demandasFilterType || "total");
    setDemandasDays(publico.filtros.demandasDays?.toString() || "30");
    setIndicacoesFilterType(publico.filtros.indicacoesFilterType || "atendida");
    setIndicacoesDays(publico.filtros.indicacoesDays?.toString() || "30");

    setCreateModalOpen(true);
  };

  const handleSavePublico = async () => {
    if (!nome.trim()) {
      toast.error('Nome do público é obrigatório');
      return;
    }

    if (!activeInstitution?.cabinet_id || !user?.id) return;

    // Only save filters that are currently active in the UI
    const filtros: any = {};
    
    if (activeFilters.includes('sexo') && sexo !== 'todos') {
      filtros.sexo = sexo;
    }
    if (activeFilters.includes('neighborhood') && selectedNeighborhoods.length > 0) {
      filtros.neighborhood = selectedNeighborhoods;
    }
    if (activeFilters.includes('city') && selectedCities.length > 0) {
      filtros.city = selectedCities;
    }
    if (activeFilters.includes('age')) {
      if (minAge) filtros.minAge = parseInt(minAge);
      if (maxAge) filtros.maxAge = parseInt(maxAge);
    }
    if (activeFilters.includes('isLeader') && isLeader !== 'todos') {
      filtros.isLeader = isLeader === 'true';
    }
    if (activeFilters.includes('profession') && selectedProfessions.length > 0) {
      filtros.profession = selectedProfessions;
    }
    if (activeFilters.includes('birthday')) {
      filtros.birthdayType = birthdayType;
      if (birthdayType === 'month' && birthdayMonth) {
        filtros.birthdayMonth = parseInt(birthdayMonth);
      } else if (birthdayType === 'next_x_days' && birthdayDays) {
        filtros.birthdayDays = parseInt(birthdayDays);
      }
    }
    if (activeFilters.includes('demandas')) {
      filtros.demandasFilterType = demandasFilterType;
      if (demandasFilterType === 'total') {
        if (demandasTotal) filtros.demandasTotal = parseInt(demandasTotal);
        if (demandasPeriod) filtros.demandasPeriod = demandasPeriod;
        if (demandasType !== 'todos') filtros.demandasType = demandasType;
      } else if (demandasFilterType === 'pendente_x_dias' || demandasFilterType === 'sem_registro_x_dias') {
        if (demandasDays) filtros.demandasDays = parseInt(demandasDays);
      }
    }
    if (activeFilters.includes('indicacoes')) {
      filtros.indicacoesFilterType = indicacoesFilterType;
      if (indicacoesFilterType === 'pendente_x_dias' || indicacoesFilterType === 'sem_registro_x_dias') {
        if (indicacoesDays) filtros.indicacoesDays = parseInt(indicacoesDays);
      }
    }

    try {
      if (editingPublico) {
        // Update
        const { error } = await supabase
          .from('publicos')
          .update({
            nome,
            descricao: descricao || null,
            cor,
            filtros: filtros as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPublico.id);

        if (error) throw error;
        toast.success('Público atualizado com sucesso');
      } else {
        // Create
        const { error } = await supabase
          .from('publicos')
          .insert([{
            gabinete_id: activeInstitution.cabinet_id,
            created_by: user.id,
            nome,
            descricao: descricao || null,
            cor,
            filtros: filtros as any,
          }]);

        if (error) throw error;
        toast.success('Público criado com sucesso');
      }

      setCreateModalOpen(false);
      resetForm();
      fetchPublicos();
    } catch (error) {
      console.error('Error saving publico:', error);
      toast.error('Erro ao salvar público');
    }
  };

  const handleDeletePublico = async (id: string) => {
    const confirmed = await confirm({
      title: "Excluir Público",
      description: "Tem certeza que deseja excluir este público?",
      variant: "destructive",
      confirmText: "Excluir",
      cancelText: "Manter"
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('publicos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Público excluído com sucesso');
      fetchPublicos();
    } catch (error) {
      console.error('Error deleting publico:', error);
      toast.error('Erro ao excluir público');
    }
  };

  const handleRefresh = () => {
    if (contentType === "publicos") {
      fetchPublicos();
    } else {
      fetchTags();
    }
    toast.success('Dados atualizados');
  };

  const handleDeleteTag = async (tag: CustomTag) => {
    const confirmed = await confirm({
      title: "Excluir TAG",
      description: `Tem certeza que deseja excluir a TAG "${tag.name}"? Isso removerá a TAG de todas as áreas associadas.`,
      variant: "destructive",
      confirmText: "Excluir",
      cancelText: "Manter"
    });

    if (!confirmed) return;

    try {
      // Split IDs by table
      const eleitorTagIds = tag.ids.filter(id => {
        // Find which raw tag this ID belonged to
        // If it was in rawEleitorTags (mocked category 'eleitores')
        // In this simplified logic, we'll try both or use the categories list
        return tag.categories.includes('eleitores');
      });

      const promises = [];

      // Delete from eleitor_tags if applicable
      if (tag.categories.includes('eleitores')) {
        // We need to find the specific ID for 'eleitores' in tag.ids
        // But the consolidation lost that direct map. 
        // Safer: delete by name and cabinet_id for this user's context
        promises.push(
          supabase
            .from('eleitor_tags')
            .delete()
            .eq('name', tag.name)
            .eq('gabinete_id', activeInstitution?.cabinet_id)
        );
      }

      // Delete from gabinete_custom_tags for other categories
      const otherCategories = tag.categories.filter(c => c !== 'eleitores');
      if (otherCategories.length > 0) {
        promises.push(
          supabase
            .from('gabinete_custom_tags')
            .delete()
            .eq('name', tag.name)
            .eq('gabinete_id', activeInstitution?.cabinet_id)
        );
      }

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) throw errors[0].error;

      toast.success('Tag excluída com sucesso');
      fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Erro ao excluir tag');
    }
  };

  const getFilterDescription = (filtros: any) => {
    const parts = [];
    if (filtros.sexo) {
      const label = filtros.sexo === 'masculino' || filtros.sexo === 'M' ? 'Homens' : 
                   filtros.sexo === 'feminino' || filtros.sexo === 'F' ? 'Mulheres' : 
                   filtros.sexo === 'nao_binario' ? 'Não Binário' : 
                   filtros.sexo === 'todos' ? 'Todos' : filtros.sexo;
      parts.push(label);
    }
    if (filtros.neighborhood) {
      const value = Array.isArray(filtros.neighborhood) ? filtros.neighborhood.join(', ') : filtros.neighborhood;
      parts.push(`Bairros: ${value}`);
    }
    if (filtros.minAge) parts.push(`Idade mín: ${filtros.minAge}`);
    if (filtros.maxAge) parts.push(`Idade máx: ${filtros.maxAge}`);
    if (filtros.isLeader !== undefined) parts.push(filtros.isLeader ? 'Lideranças' : 'Não lideranças');
    if (filtros.profession) {
      const value = Array.isArray(filtros.profession) ? filtros.profession.join(', ') : filtros.profession;
      parts.push(`Profissões: ${value}`);
    }
    if (filtros.city) {
      const value = Array.isArray(filtros.city) ? filtros.city.join(', ') : filtros.city;
      parts.push(`Cidades: ${value}`);
    }
    if (filtros.birthdayType || filtros.birthdayMonth) {
      if (filtros.birthdayType === 'today') parts.push('Aniversário: Hoje');
      else if (filtros.birthdayType === 'week') parts.push('Aniversário: Esta semana');
      else if (filtros.birthdayType === 'current_month') parts.push('Aniversário: Este mês');
      else if (filtros.birthdayType === 'next_x_days') parts.push(`Aniversário: Daqui a ${filtros.birthdayDays} dias`);
      else if (filtros.birthdayMonth) {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        parts.push(`Aniversário: ${meses[filtros.birthdayMonth - 1]}`);
      }
    }
    if (filtros.demandasFilterType) {
      if (filtros.demandasFilterType === 'total') {
        if (filtros.demandasTotal) parts.push(`${filtros.demandasTotal}+ demandas`);
        if (filtros.demandasPeriod) {
          const periodos: Record<string, string> = {
            '7': 'últimos 7 dias', '14': 'últimos 14 dias', '30': 'último mês', '90': 'últimos 3 meses', '365': 'último ano'
          };
          parts.push(`Período: ${periodos[filtros.demandasPeriod]}`);
        }
      } else if (filtros.demandasFilterType === 'atendida') parts.push('Demandas atendidas');
      else if (filtros.demandasFilterType === 'pendente_x_dias') parts.push(`Demanda pendente > ${filtros.demandasDays} dias`);
      else if (filtros.demandasFilterType === 'sem_registro_x_dias') parts.push(`Sem demandas > ${filtros.demandasDays} dias`);
    }

    if (filtros.indicacoesFilterType) {
      if (filtros.indicacoesFilterType === 'atendida') parts.push('Indicações atendidas');
      else if (filtros.indicacoesFilterType === 'pendente_x_dias') parts.push(`Indicação pendente > ${filtros.indicacoesDays} dias`);
      else if (filtros.indicacoesFilterType === 'sem_registro_x_dias') parts.push(`Sem indicações > ${filtros.indicacoesDays} dias`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'Sem filtros';
  };

  return (
    <AppLayout>
      <PermissionGuard module="publicos">
        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-base font-bold tracking-tight text-foreground/80 font-outfit uppercase">
                  Públicos
                </h1>
                <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-bold border-border/60 text-muted-foreground bg-transparent uppercase tracking-[0.2em] rounded-full">
                  Segmentação Ativa
                </Badge>
              </div>
              <p className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-widest leading-none">
                Crie e gerencie segmentos dinâmicos de eleitores
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-muted/30 p-1 rounded-xl">
                <div className="flex bg-transparent h-8 p-0 gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => setContentType("publicos")}
                    className={cn(
                      "h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                      contentType === "publicos" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <Users className="w-3 h-3 mr-1.5" />
                    Públicos
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setContentType("tags")}
                    className={cn(
                      "h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                      contentType === "tags" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <Tag className="w-3 h-3 mr-1.5" />
                    Tags
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setContentType("categorias")}
                    className={cn(
                      "h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                      contentType === "categorias" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <ListTree className="w-3 h-3 mr-1.5" />
                    Categorias
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider bg-transparent border-border/60 hover:bg-muted/50 transition-all active:scale-95"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2 text-muted-foreground/60", loading && "animate-spin")} />
                  Atualizar
                </Button>

                {contentType === "tags" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTagModalOpen(true)}
                    className="h-10 px-4 rounded-xl font-bold text-[10px] uppercase tracking-wider bg-transparent border-border/60 hover:bg-muted/50 transition-all active:scale-95 animate-in fade-in zoom-in duration-200"
                  >
                    <Tag className="h-4 w-4 mr-2 text-muted-foreground/60" />
                    Nova TAG
                  </Button>
                )}

                {contentType === "publicos" && (
                  <Button
                    onClick={handleOpenCreateModal}
                    variant="success"
                    className="h-10 px-4 gap-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-95 animate-in fade-in zoom-in duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Novo Público</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Filters and Search Bar - Hidden for categories since it has its own layout */}
          {contentType !== "categorias" && (
            <div className="bg-card/50 border border-border/40 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center animate-in slide-in-from-top-2 duration-300">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                <Input
                  placeholder={contentType === "publicos" ? "BUSCAR PÚBLICOS..." : "BUSCAR TAGS..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-transparent border-border/40 rounded-xl text-[11px] font-bold uppercase tracking-widest placeholder:text-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "h-8 w-8 rounded-lg transition-all",
                    viewMode === "grid" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "h-8 w-8 rounded-lg transition-all",
                    viewMode === "list" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-t-2 border-primary/30 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-primary animate-pulse" />
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Sincronizando dados...</p>
            </div>
          ) : contentType === "categorias" ? (
            <CategoryMindMap />
          ) : contentType === "publicos" ? (
            // PÚBLICOS SECTION
            filteredPublicos.length === 0 ? (
              <Card className="border-dashed border-2 border-border/40 bg-muted/5 rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center h-64 p-0">
                  <div className="bg-muted/20 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-12 w-12 text-muted-foreground/20" />
                  </div>
                  <h3 className="text-[14px] font-bold uppercase tracking-tight text-foreground/70 font-outfit">
                    {publicos.length === 0 ? 'Nenhum público criado' : 'Nenhum resultado'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-widest font-medium">
                    {publicos.length === 0
                      ? 'Segmentar seus eleitores ajuda na comunicação'
                      : 'Tente ajustar os termos de busca'
                    }
                  </p>
                  {publicos.length === 0 && (
                    <Button onClick={handleOpenCreateModal} variant="outline" className="mt-6 rounded-xl border-border/60 font-bold text-[10px] uppercase tracking-widest px-6 h-10 hover:bg-primary hover:text-white transition-all">
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      Criar Primeiro Público
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredPublicos.map((publico) => (
                  <Card key={publico.id} className="group border border-border/60 bg-card/95 dark:bg-card/10 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                    <CardHeader className="pb-2 space-y-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1.5 h-10 rounded-full"
                            style={{ backgroundColor: publico.cor || "#6366f1" }}
                          />
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-bold font-outfit truncate text-foreground/80 group-hover:text-primary transition-colors">{publico.nome}</CardTitle>
                            <p className="text-[8px] text-muted-foreground/40 font-black uppercase tracking-widest mt-0.5">
                              ID: {publico.id.split('-')[0]}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => handleOpenEditModal(publico)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => handleDeletePublico(publico.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {publico.descricao && (
                        <CardDescription className="text-[10px] line-clamp-1 mt-2 leading-relaxed font-medium text-muted-foreground/60">
                          {publico.descricao}
                        </CardDescription>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {getFilterDescription(publico.filtros).split(' • ').map((part, i) => (
                          <Badge key={i} variant="secondary" className="text-[7px] h-3.5 px-1 font-bold uppercase tracking-tighter bg-muted/30 text-muted-foreground/60 border-none">
                            {part}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      <div className="flex items-end justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black font-outfit text-foreground group-hover:scale-110 transition-transform inline-block origin-left">{publico.voter_count || 0}</span>
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Eleitores</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-full border border-border/40">
                          <Calendar className="h-2.5 w-2.5 text-muted-foreground/40" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">{format(new Date(publico.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-border/40 overflow-hidden rounded-2xl shadow-none bg-card/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-none hover:bg-muted/50">
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 h-10">Público</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 h-10">Descrição</TableHead>
                      <TableHead className="text-center w-32 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 h-10">Base</TableHead>
                      <TableHead className="w-32 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 h-10">Data</TableHead>
                      <TableHead className="text-right w-40 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 h-10">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPublicos.map((publico) => (
                      <TableRow key={publico.id} className="group border-border/40 hover:bg-muted/20">
                        <TableCell>
                          <div
                            className="w-1.5 h-8 rounded-full shadow-sm"
                            style={{ backgroundColor: publico.cor || "#6366f1" }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-foreground/80">{publico.nome}</span>
                            {publico.descricao && (
                              <span className="text-[9px] text-muted-foreground/40 line-clamp-1">{publico.descricao}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground/60 max-w-md truncate font-medium">
                          {publico.descricao || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-muted/40 font-black text-[9px] rounded-lg border-none px-2 h-5">
                            {publico.voter_count || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-medium text-muted-foreground/40">{format(new Date(publico.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                              onClick={() => handleOpenEditModal(publico)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                              onClick={() => handleDeletePublico(publico.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )
          ) : (
            // TAGS SECTION
            filteredTags.length === 0 ? (
              <Card className="border-dashed border-2 border-border/40 bg-muted/5 rounded-3xl">
                <CardContent className="flex flex-col items-center justify-center h-64 p-0">
                  <div className="bg-muted/20 p-4 rounded-2xl mb-4">
                    <Tag className="h-12 w-12 text-muted-foreground/20" />
                  </div>
                  <h3 className="text-[14px] font-bold uppercase tracking-tight text-foreground/70 font-outfit">
                    {tags.length === 0 ? 'Nenhuma tag encontrada' : 'Nenhum resultado'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-widest font-medium">
                    {tags.length === 0
                      ? 'Use tags para categorizar seus eleitores manualmente'
                      : 'Tente ajustar os termos de busca'
                    }
                  </p>
                  {tags.length === 0 && (
                    <Button onClick={() => setTagModalOpen(true)} variant="outline" className="mt-6 rounded-xl border-border/60 font-bold text-[10px] uppercase tracking-widest px-6 h-10 hover:bg-primary hover:text-white transition-all">
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      Criar Primeira TAG
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTags.map((tag) => (
                  <Card key={tag.id} className="group border border-border/40 bg-card/50 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: tag.color || "#6366f1" }}
                    />

                    <CardHeader className="pb-3 space-y-0 pl-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all group-hover:scale-110"
                            style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                          >
                            {renderTagIcon(tag.icon, "h-5 w-5")}
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm font-bold font-outfit uppercase tracking-tight text-foreground/80 leading-tight">
                              {tag.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-black border-border/40 text-muted-foreground/40 bg-transparent uppercase tracking-widest rounded-full">
                                {(tag.categories || []).join(", ")}
                              </Badge>
                              {tag.subcategory && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">
                                  {tag.subcategory}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/5 transition-all"
                          onClick={() => handleDeleteTag(tag)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-2 pl-6 pb-6 space-y-4">
                      <div className="flex flex-wrap gap-x-8 gap-y-2">
                        {(tag.categories?.some(c => c.toLowerCase() === 'eleitores') || (tag.voter_count || 0) > 0) && (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-muted-foreground/40">
                              <Users className="w-2.5 h-2.5" />
                              <span className="text-[8px] font-black uppercase tracking-tighter">Eleitores</span>
                            </div>
                            <span className="text-xl font-black font-outfit text-foreground/80">
                              {tag.voter_count || 0}
                            </span>
                          </div>
                        )}

                        {(tag.categories?.some(c => c.toLowerCase() === 'demandas') || (tag.demand_count || 0) > 0) && (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-muted-foreground/40">
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span className="text-[8px] font-black uppercase tracking-tighter">Demandas</span>
                            </div>
                            <span className="text-xl font-black font-outfit text-foreground/80">
                              {tag.demand_count || 0}
                            </span>
                          </div>
                        )}

                        {(tag.categories?.some(c => c.toLowerCase() === 'indicacoes') || (tag.indication_count || 0) > 0) && (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-muted-foreground/40">
                              <Flag className="w-2.5 h-2.5" />
                              <span className="text-[8px] font-black uppercase tracking-tighter">Indicações</span>
                            </div>
                            <span className="text-xl font-black font-outfit text-foreground/80">
                              {tag.indication_count || 0}
                            </span>
                          </div>
                        )}

                        {(tag.categories?.some(c => c.toLowerCase() === 'projetos' || c.toLowerCase() === 'projetos_lei') || (tag.project_count || 0) > 0) && (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-muted-foreground/40">
                              <FileText className="w-2.5 h-2.5" />
                              <span className="text-[8px] font-black uppercase tracking-tighter">Projetos</span>
                            </div>
                            <span className="text-xl font-black font-outfit text-foreground/80">
                              {tag.project_count || 0}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/20">
                        <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/30">
                          {format(new Date(tag.created_at), "dd MMMM yyyy", { locale: ptBR })}
                        </span>
                        <div className="flex items-center gap-1 opacity-20">
                          <Circle className="w-1.5 h-1.5 fill-current" style={{ color: tag.color }} />
                          <span className="text-[7px] font-bold uppercase tracking-widest">Ativa</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-border/40 overflow-hidden rounded-2xl shadow-none bg-card/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 border-none hover:bg-muted/50 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                      <TableHead className="w-12 h-10"></TableHead>
                      <TableHead className="h-10">Tag</TableHead>
                      <TableHead className="h-10">Categoria</TableHead>
                      <TableHead className="text-center w-24 h-10">Eleitores</TableHead>
                      <TableHead className="text-center w-24 h-10">Demandas</TableHead>
                      <TableHead className="text-center w-24 h-10">Indicações</TableHead>
                      <TableHead className="text-center w-24 h-10">Projetos</TableHead>
                      <TableHead className="w-32 h-10">Data</TableHead>
                      <TableHead className="text-right w-24 h-10">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTags.map((tag) => (
                      <TableRow key={tag.id} className="group border-border/40 hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: `${tag.color}15`, color: tag.color }}
                          >
                            {renderTagIcon(tag.icon, "h-3.5 w-3.5")}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-xs font-outfit text-foreground/80 uppercase tracking-tight">{tag.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{(tag.categories || []).join(", ")}</span>
                            <span className="text-[8px] text-muted-foreground/30 uppercase tracking-tighter">{tag.subcategory || "Geral"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {(tag.categories?.some(c => c.toLowerCase() === 'eleitores') || (tag.voter_count || 0) > 0) ? (
                            <Badge variant="secondary" className="bg-muted/40 font-black text-[9px] rounded-lg border-none px-2 h-5">
                              {tag.voter_count || 0}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/20 italic text-[10px]">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {(tag.categories?.some(c => c.toLowerCase() === 'demandas') || (tag.demand_count || 0) > 0) ? (
                            <Badge variant="outline" className="border-border/40 font-black text-[9px] rounded-lg px-2 h-5">
                              {tag.demand_count || 0}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/20 italic text-[10px]">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {(tag.categories?.some(c => c.toLowerCase() === 'indicacoes') || (tag.indication_count || 0) > 0) ? (
                            <Badge variant="outline" className="border-border/40 font-black text-[9px] rounded-lg px-2 h-5">
                              {tag.indication_count || 0}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/20 italic text-[10px]">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {(tag.categories?.some(c => c.toLowerCase() === 'projetos' || c.toLowerCase() === 'projetos_lei') || (tag.project_count || 0) > 0) ? (
                            <Badge variant="outline" className="border-border/40 font-black text-[9px] rounded-lg px-2 h-5">
                              {tag.project_count || 0}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/20 italic text-[10px]">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-[10px] font-medium text-muted-foreground/40">
                          {format(new Date(tag.created_at), "dd/MM", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground opacity-40 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/5 transition-all"
                            onClick={() => handleDeleteTag(tag)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )
          )}

          {/* Modal: Create/Edit Publico */}
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-border/40 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-outfit font-black text-xl uppercase tracking-tight flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  {editingPublico ? 'Editar Público' : 'Criar Novo Segmento'}
                </DialogTitle>
                <DialogDescription className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/40">
                  Configure os filtros inteligentes para segmentar sua base de eleitores
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-8 mt-4">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="nome" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">NOME DO SEGMENTO *</Label>
                      <Input
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Jovens Universitários"
                        className="rounded-xl border-border/40 h-11 text-xs font-bold font-outfit focus-visible:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="descricao" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">DESCRIÇÃO ESTRATÉGICA</Label>
                      <Textarea
                        id="descricao"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descreva o objetivo deste público..."
                        rows={3}
                        className="rounded-xl border-border/40 text-xs font-medium focus-visible:ring-primary/20 resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-border/40">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">ESTÉTICA DO CARD</Label>
                    <div className="flex flex-col gap-4 items-center justify-center h-full pb-6">
                      <div
                        className="w-16 h-16 rounded-3xl shadow-xl transition-all border-4 border-background"
                        style={{ backgroundColor: cor }}
                      />
                      <div className="flex gap-2 w-full">
                        <Input
                          id="cor"
                          type="color"
                          value={cor}
                          onChange={(e) => setCor(e.target.value)}
                          className="w-12 h-9 p-1 border-none bg-transparent cursor-pointer"
                        />
                        <Input
                          value={cor}
                          onChange={(e) => setCor(e.target.value)}
                          placeholder="#6366f1"
                          className="flex-1 h-9 rounded-lg border-border/40 text-[10px] font-mono uppercase text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">REGRAS DE SEGMENTAÇÃO</Label>
                    {availableFilters.length > 0 && (
                      <ModernSelect
                        value=""
                        onChange={(val: any) => addFilter(val as FilterType)}
                        searchable={false}
                        className="w-48 h-8"
                        options={availableFilters.map(f => ({ label: f.label, value: f.type }))}
                        placeholder="ADICIONAR REGRA"
                      />
                    )}
                  </div>

                  {activeFilters.length === 0 ? (
                    <div className="border-2 border-dashed border-border/40 rounded-2xl p-10 text-center bg-muted/5 group">
                      <Filter className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20 group-hover:scale-110 transition-transform" />
                      <p className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                        Nenhuma regra de filtragem ativa
                      </p>
                      <p className="text-[9px] text-muted-foreground/20 mt-1 uppercase tracking-widest font-bold max-w-[200px] mx-auto leading-relaxed">
                        Adicione critérios para definir quem fará parte deste segmento
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                      {/* Render dynamic filters here - same as before but styled */}
                      {activeFilters.map(type => {
                        const filterMeta = filterOptions.find(f => f.type === type);
                        if (!filterMeta) return null;

                        return (
                          <div key={type} className="bg-card border border-border/40 p-3 rounded-2xl shadow-sm space-y-3 hover:border-primary/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">{filterMeta.label}</Label>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => removeFilter(type)} className="h-6 w-6 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Filter Controls */}
                            {type === 'sexo' && (
                              <ModernSelect
                                value={sexo}
                                onChange={setSexo}
                                searchable={false}
                                options={[
                                  { label: 'Todos', value: 'todos' },
                                  { label: 'Masculino', value: 'masculino' },
                                  { label: 'Feminino', value: 'feminino' },
                                  { label: 'Não Binário', value: 'nao_binario' }
                                ]}
                                placeholder="Selecione o sexo"
                              />
                            )}

                            {type === 'age' && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[8px] font-black text-muted-foreground/40 uppercase">Mínima</Label>
                                  <Input type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} className="h-8 rounded-lg text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[8px] font-black text-muted-foreground/40 uppercase">Máxima</Label>
                                  <Input type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} className="h-8 rounded-lg text-xs" />
                                </div>
                              </div>
                            )}

                            {type === 'neighborhood' && (
                              <ModernSelect
                                options={neighborhoods}
                                value={selectedNeighborhoods}
                                onChange={setSelectedNeighborhoods}
                                placeholder="Selecione os bairros"
                                isMulti={true}
                              />
                            )}

                            {type === 'city' && (
                              <ModernSelect
                                options={cities}
                                value={selectedCities}
                                onChange={setSelectedCities}
                                placeholder="Selecione as cidades"
                                isMulti={true}
                              />
                            )}

                            {/* ... other filters same logic, just simplified UI ... */}
                            {/* For brevity and stability, I'll keep the logic consistent */}
                            {type === 'isLeader' && (
                              <ModernSelect
                                value={isLeader}
                                onChange={setIsLeader}
                                searchable={false}
                                options={[
                                  { label: 'Todos', value: 'todos' },
                                  { label: 'Lideranças', value: 'true' },
                                  { label: 'Eleitor Comum', value: 'false' }
                                ]}
                                placeholder="Tipo de Eleitor"
                              />
                            )}

                            {type === 'profession' && (
                              <ModernSelect
                                options={professions}
                                value={selectedProfessions}
                                onChange={setSelectedProfessions}
                                placeholder="Selecione as profissões"
                                isMulti={true}
                              />
                            )}

                            {type === 'birthday' && (
                              <div className="space-y-3">
                                <ModernSelect
                                  value={birthdayType}
                                  onChange={setBirthdayType}
                                  searchable={false}
                                  options={[
                                    { label: 'Aniversariante do Dia', value: 'today' },
                                    { label: 'Aniversariante da Semana', value: 'week' },
                                    { label: 'Aniversariante do Mês', value: 'current_month' },
                                    { label: 'Aniversário daqui a X dias', value: 'next_x_days' },
                                    { label: 'Mês Específico', value: 'month' }
                                  ]}
                                  placeholder="Tipo de filtro"
                                />

                                {birthdayType === 'month' && (
                                  <ModernSelect
                                    value={birthdayMonth}
                                    onChange={setBirthdayMonth}
                                    placeholder="Escolha o mês"
                                    options={[
                                      { label: 'Qualquer Mês', value: 'todos' },
                                      ...['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((mes, idx) => ({
                                        label: mes,
                                        value: String(idx + 1)
                                      }))
                                    ]}
                                  />
                                )}

                                {birthdayType === 'next_x_days' && (
                                  <div className="space-y-1">
                                    <Label className="text-[8px] font-black text-muted-foreground/40 uppercase">Dias para o aniversário</Label>
                                    <Input 
                                      type="number" 
                                      value={birthdayDays} 
                                      onChange={(e) => setBirthdayDays(e.target.value)} 
                                      placeholder="Ex: 5"
                                      className="h-8 rounded-lg text-xs" 
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {type === 'demandas' && (
                              <div className="space-y-3">
                                <ModernSelect
                                  value={demandasFilterType}
                                  onChange={setDemandasFilterType}
                                  searchable={false}
                                  options={[
                                    { label: 'Total de Demandas', value: 'total' },
                                    { label: 'Demanda atendida', value: 'atendida' },
                                    { label: 'Demanda pendente > X dias', value: 'pendente_x_dias' },
                                    { label: 'Sem registrar demandas a > X dias', value: 'sem_registro_x_dias' }
                                  ]}
                                  placeholder="Tipo de filtro"
                                />

                                {demandasFilterType === 'total' && (
                                  <>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-[8px] font-black text-muted-foreground/40 uppercase">Mín. Atendimentos</Label>
                                        <Input type="number" value={demandasTotal} onChange={(e) => setDemandasTotal(e.target.value)} className="h-8 rounded-lg text-xs" />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[8px] font-black text-muted-foreground/40 uppercase">Período</Label>
                                        <ModernSelect
                                          value={demandasPeriod}
                                          onChange={setDemandasPeriod}
                                          searchable={false}
                                          options={[
                                            { label: '7 dias', value: '7' },
                                            { label: '14 dias', value: '14' },
                                            { label: '30 dias', value: '30' },
                                            { label: '3 meses', value: '90' },
                                            { label: '1 ano', value: '365' }
                                          ]}
                                          placeholder="Período"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-[8px] font-black text-muted-foreground/40 uppercase">Status do Atendimento</Label>
                                      <ModernSelect
                                        value={demandasType}
                                        onChange={setDemandasType}
                                        searchable={false}
                                        options={[
                                          { label: 'Todos os Status', value: 'todos' },
                                          { label: 'Resolvidas', value: 'resolvida' },
                                          { label: 'Em Andamento', value: 'em_atendimento' },
                                          { label: 'Pendentes', value: 'pendente' }
                                        ]}
                                        placeholder="Status"
                                      />
                                    </div>
                                  </>
                                )}

                                {(demandasFilterType === 'pendente_x_dias' || demandasFilterType === 'sem_registro_x_dias') && (
                                  <div className="space-y-1">
                                    <Label className="text-[8px] font-black text-muted-foreground/40 uppercase">Quantidade de dias</Label>
                                    <Input 
                                      type="number" 
                                      value={demandasDays} 
                                      onChange={(e) => setDemandasDays(e.target.value)} 
                                      placeholder="Ex: 30"
                                      className="h-8 rounded-lg text-xs" 
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {type === 'indicacoes' && (
                              <div className="space-y-3">
                                <ModernSelect
                                  value={indicacoesFilterType}
                                  onChange={setIndicacoesFilterType}
                                  searchable={false}
                                  options={[
                                    { label: 'Indicação atendida', value: 'atendida' },
                                    { label: 'Indicação pendente > X dias', value: 'pendente_x_dias' },
                                    { label: 'Sem registrar Indicação > X dias', value: 'sem_registro_x_dias' }
                                  ]}
                                  placeholder="Tipo de filtro"
                                />

                                {(indicacoesFilterType === 'pendente_x_dias' || indicacoesFilterType === 'sem_registro_x_dias') && (
                                  <div className="space-y-1">
                                    <Label className="text-[8px] font-black text-muted-foreground/40 uppercase">Quantidade de dias</Label>
                                    <Input 
                                      type="number" 
                                      value={indicacoesDays} 
                                      onChange={(e) => setIndicacoesDays(e.target.value)} 
                                      placeholder="Ex: 30"
                                      className="h-8 rounded-lg text-xs" 
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-8 pt-6 border-t border-border/40 gap-3">
                <Button variant="ghost" onClick={() => setCreateModalOpen(false)} className="rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground">
                  Cancelar
                </Button>
                <Button onClick={handleSavePublico} className="rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  {editingPublico ? 'Atualizar Público' : 'Gerar Segmento'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* TAG Modal */}
          {activeInstitution?.cabinet_id && (
            <CreateCustomTagModal
              open={tagModalOpen}
              onOpenChange={setTagModalOpen}
              gabineteId={activeInstitution.cabinet_id}
              onSuccess={() => {
                toast.success("TAG criada com sucesso.");
                handleRefresh();
              }}
            />
          )}
        </div>
      </PermissionGuard>
    </AppLayout>
  );
}
