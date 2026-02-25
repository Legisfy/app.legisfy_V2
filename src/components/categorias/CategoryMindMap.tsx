import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Folder, PlusCircle, ListTree, RefreshCw, CheckCircle2, X, ChevronRight, ChevronDown, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Category {
    id: string;
    nome: string;
    parent_id: string | null;
    destinado_a: string[];
    cor: string;
    icone: string;
    children: Category[];
}

const DESTINOS = [
    { id: 'demandas', label: 'Demandas' },
    { id: 'indicacoes', label: 'Indicações' },
    { id: 'projetos_lei', label: 'Projetos de Lei' }
];

export function CategoryMindMap() {
    const { activeInstitution } = useActiveInstitution();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const confirm = useConfirm();
    const [activeTab, setActiveTab] = useState<'demandas' | 'indicacoes' | 'projetos_lei'>('demandas');
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [parentId, setParentId] = useState<string | null>(null);
    const [parentName, setParentName] = useState<string | null>(null);
    const [nomes, setNomes] = useState<string[]>([""]);
    const [cor, setCor] = useState("#6366f1");
    const [destinadoA, setDestinadoA] = useState<string[]>(['demandas']);

    useEffect(() => {
        if (activeInstitution?.cabinet_id) {
            fetchCategories();
        }
    }, [activeInstitution?.cabinet_id, activeTab]);

    const fetchCategories = async () => {
        if (!activeInstitution?.cabinet_id) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase
                .from('gabinete_categorias' as any)
                .select('*')
                .eq('gabinete_id', activeInstitution.cabinet_id)
                .contains('destinado_a', [activeTab])
                .order('nome') as any);

            if (error) throw error;

            const buildTree = (list: Category[], pId: string | null = null): Category[] => {
                return list
                    .filter(item => item.parent_id === pId)
                    .map(item => ({
                        ...item,
                        children: buildTree(list, item.id)
                    }));
            };

            const tree = buildTree(data as Category[]);
            setCategories(tree);

            // Expand all roots by default if it's the first load
            if (Object.keys(expandedNodes).length === 0) {
                const initialExpanded: Record<string, boolean> = {};
                tree.forEach(node => {
                    initialExpanded[node.id] = true;
                });
                setExpandedNodes(initialExpanded);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Erro ao carregar categorias');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const validNomes = nomes.map(n => n.trim()).filter(n => n !== "");
        if (validNomes.length === 0 || !activeInstitution?.cabinet_id) return;
        if (destinadoA.length === 0) {
            toast.error('Selecione ao menos um destino');
            return;
        }

        setLoading(true);
        try {
            if (editingCategory) {
                const { error } = await (supabase
                    .from('gabinete_categorias' as any)
                    .update({
                        nome: validNomes[0],
                        cor,
                        destinado_a: destinadoA
                    })
                    .eq('id', editingCategory.id) as any);
                if (error) throw error;
            } else {
                const payloads = validNomes.map(n => ({
                    nome: n,
                    cor,
                    destinado_a: destinadoA,
                    gabinete_id: activeInstitution.cabinet_id,
                    parent_id: parentId
                }));

                const { error } = await (supabase
                    .from('gabinete_categorias' as any)
                    .insert(payloads) as any);
                if (error) throw error;
            }

            toast.success(editingCategory ? 'Categoria atualizada' : 'Categoria(s) criada(s)');
            setIsModalOpen(false);
            resetForm();
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error('Erro ao salvar categoria');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: "Excluir Categoria",
            description: "Deseja realmente excluir esta categoria e todas as suas subcategorias?",
            variant: "destructive",
            confirmText: "Excluir",
            cancelText: "Manter"
        });

        if (!confirmed) return;

        try {
            const { error } = await (supabase
                .from('gabinete_categorias' as any)
                .delete()
                .eq('id', id) as any);

            if (error) throw error;

            toast.success('Categoria excluída');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Erro ao excluir categoria');
        }
    };

    const resetForm = () => {
        setNomes([""]);
        setCor("#6366f1");
        setParentId(null);
        setParentName(null);
        setEditingCategory(null);
        setDestinadoA([activeTab]);
    };

    const toggleNode = (id: string) => {
        setExpandedNodes(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const openCreateModal = (pId: string | null = null, pName: string | null = null, pCor: string | null = null, pDestinos: string[] | null = null) => {
        resetForm();
        setParentId(pId);
        setParentName(pName);

        if (pCor) setCor(pCor);
        if (pDestinos) setDestinadoA(pDestinos);
        else setDestinadoA([activeTab]);

        setIsModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setNomes([category.nome]);
        setCor(category.cor);
        setParentId(category.parent_id);
        setDestinadoA(category.destinado_a || [activeTab]);
        setIsModalOpen(true);
    };

    const toggleDestino = (id: string) => {
        setDestinadoA(prev =>
            prev.includes(id)
                ? prev.filter(d => d !== id)
                : [...prev, id]
        );
    };

    const updateNome = (index: number, value: string) => {
        const newNomes = [...nomes];
        newNomes[index] = value;
        setNomes(newNomes);
    };

    const addNomeField = () => {
        setNomes([...nomes, ""]);
    };

    const removeNomeField = (index: number) => {
        if (nomes.length === 1) return;
        setNomes(nomes.filter((_, i) => i !== index));
    };

    const CategoryTreeNode = ({ category, level = 0 }: { category: Category, level?: number }) => {
        const isExpanded = expandedNodes[category.id] ?? false;
        const hasChildren = category.children && category.children.length > 0;

        return (
            <div className="flex flex-col items-start gap-4 animate-in slide-in-from-left duration-300">
                <div className="flex items-center gap-2">
                    {/* Node content */}
                    <div
                        className={cn(
                            "group relative flex items-center gap-3 p-2.5 rounded-2xl border bg-card/50 backdrop-blur-sm transition-all hover:scale-105 active:scale-95",
                            level === 0 ? "border-primary/20 shadow-lg shadow-primary/5 py-3" : "border-border/40"
                        )}
                        style={{ borderLeftColor: category.cor, borderLeftWidth: '4px' }}
                    >
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "flex items-center justify-center rounded-xl",
                                level === 0 ? "p-2 bg-muted/50" : "w-2 h-2 ml-1"
                            )}>
                                {level === 0 ? (
                                    <Folder className="w-4 h-4" style={{ color: category.cor }} />
                                ) : (
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.cor }} />
                                )}
                            </div>
                            <div className="flex flex-col pr-2">
                                <span className={cn(
                                    "font-outfit uppercase tracking-tight text-foreground/80 leading-tight",
                                    level === 0 ? "text-xs font-bold" : "text-[10px] font-semibold"
                                )}>
                                    {category.nome}
                                </span>
                                {category.destinado_a.length > 1 && level === 0 && (
                                    <span className="text-[7px] font-black uppercase tracking-[0.1em] text-muted-foreground/40 leading-none mt-0.5">
                                        Multidestino
                                    </span>
                                )}
                            </div>
                        </div>

                        <TooltipProvider>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openCreateModal(category.id, category.nome, category.cor, category.destinado_a)}>
                                            <PlusCircle className="w-3.5 h-3.5 text-primary/60" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-foreground text-background text-[10px] font-bold uppercase tracking-widest border-none">
                                        Adicionar subcategoria
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEditModal(category)}>
                                            <Edit className="w-3.5 h-3.5 text-muted-foreground/60" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-foreground text-background text-[10px] font-bold uppercase tracking-widest border-none">
                                        Editar
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/5" onClick={() => handleDelete(category.id)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-destructive text-white text-[10px] font-bold uppercase tracking-widest border-none">
                                        Excluir
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>
                    </div>

                    {/* Toggle Button if has children */}
                    {hasChildren && (
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => toggleNode(category.id)}
                            className={cn(
                                "h-6 w-6 rounded-full border-border/40 bg-card/80 shadow-sm transition-all text-muted-foreground hover:text-primary active:scale-95 shrink-0",
                                isExpanded ? "rotate-0 border-primary/20" : "-rotate-90"
                            )}
                        >
                            <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>

                {isExpanded && hasChildren && (
                    <div className="flex gap-8 ml-[1.1rem] border-l-2 border-dashed border-border/60 pl-8 pt-2 pb-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col gap-6 relative">
                            {category.children.map(child => (
                                <CategoryTreeNode key={child.id} category={child} level={level + 1} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex bg-muted/30 p-1 rounded-xl gap-1">
                    {DESTINOS.map(tab => (
                        <Button
                            key={tab.id}
                            variant="ghost"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "h-7 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                activeTab === tab.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const allExpanded: Record<string, boolean> = {};
                            const fill = (list: Category[]) => {
                                list.forEach(c => {
                                    allExpanded[c.id] = true;
                                    if (c.children) fill(c.children);
                                });
                            };
                            fill(categories);
                            setExpandedNodes(allExpanded);
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    >
                        Expandir Tudo
                    </Button>
                    <div className="w-1 h-1 rounded-full bg-border/40" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedNodes({})}
                        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
                    >
                        Recolher Tudo
                    </Button>

                    <Button
                        onClick={() => openCreateModal()}
                        className="h-9 px-4 ml-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-primary/10 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Categoria Raiz
                    </Button>
                </div>
            </div>

            <div className="relative min-h-[550px] w-full p-12 overflow-auto bg-muted/5 rounded-[2.5rem] border border-dashed border-border/20 backdrop-blur-[2px]">
                {loading ? (
                    <div className="flex items-center justify-center h-[350px] gap-2 text-muted-foreground">
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Sincronizando Mapa...</span>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[350px] gap-4">
                        <div className="p-5 rounded-full bg-muted/20">
                            <ListTree className="w-10 h-10 text-muted-foreground/20" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-bold text-foreground/40 uppercase tracking-tight">Vazio em {DESTINOS.find(d => d.id === activeTab)?.label}</p>
                            <p className="text-[10px] text-muted-foreground/30 font-medium leading-relaxed max-w-[220px]">Adicione sua primeira categoria para começar a organizar</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-12">
                        {categories.map(category => (
                            <CategoryTreeNode key={category.id} category={category} />
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[400px] w-[95vw] rounded-[2rem] border-border/20 p-8 overflow-hidden bg-background/95 backdrop-blur-xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-bold font-outfit uppercase tracking-tight break-words text-foreground/90 leading-normal">
                            {editingCategory ? 'Configurar Categoria' : parentId ? `Inserir Subcategorias em ${parentName}` : 'Nova Estrutura Raiz'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-6 py-6 max-h-[65vh] overflow-y-auto pr-3 custom-scrollbar">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                    {parentId ? 'Nomes das Subcategorias' : 'Identificação'}
                                </Label>
                                {!editingCategory && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={addNomeField}
                                        className="h-7 px-2.5 text-primary hover:text-primary hover:bg-primary/5 rounded-xl gap-1.5 transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Novo Campo</span>
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-3">
                                {nomes.map((n, i) => (
                                    <div key={i} className="flex gap-2 group animate-in slide-in-from-top-2 duration-300">
                                        <Input
                                            value={n}
                                            onChange={(e) => updateNome(i, e.target.value)}
                                            placeholder={parentId ? "Nome da sub-área..." : "Ex: PET, Obras, Saúde..."}
                                            className="h-11 rounded-[1.2rem] bg-muted/20 border-border/30 font-medium text-xs focus-visible:ring-primary/20 flex-1 min-w-0 placeholder:text-muted-foreground/30 transition-all focus:bg-background"
                                            autoFocus={i === nomes.length - 1}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (!editingCategory && i === nomes.length - 1 && n.trim() !== "") {
                                                        addNomeField();
                                                    } else {
                                                        handleSave();
                                                    }
                                                }
                                            }}
                                        />
                                        {nomes.length > 1 && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => removeNomeField(i)}
                                                className="h-11 w-11 rounded-[1.2rem] text-destructive/40 hover:text-destructive hover:bg-destructive/5 shrink-0 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {!parentId && (
                            <div className="space-y-6 animate-in fade-in duration-500 delay-100">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Módulos de Destino</Label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {DESTINOS.map(dest => (
                                            <button
                                                key={dest.id}
                                                onClick={() => toggleDestino(dest.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left active:scale-[0.98]",
                                                    destinadoA.includes(dest.id)
                                                        ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                                                        : "bg-muted/10 border-border/20 text-muted-foreground hover:bg-muted/20 hover:border-border/40"
                                                )}
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{dest.label}</span>
                                                {destinadoA.includes(dest.id) && <CheckCircle2 className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Identidade Visual</Label>
                                    <div className="flex flex-wrap gap-2.5 p-1">
                                        {['#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setCor(c)}
                                                className={cn(
                                                    "w-7 h-7 rounded-full transition-all border-2 active:scale-90",
                                                    cor === c ? "scale-125 border-foreground/50 shadow-md p-1" : "border-transparent hover:scale-110"
                                                )}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {parentId && (
                            <div className="p-4 rounded-[1.2rem] bg-primary/5 border border-primary/10 flex flex-col items-center gap-2 animate-in zoom-in-95 duration-300">
                                <Circle className="w-4 h-4 text-primary/40 fill-primary/10" />
                                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-primary/60 text-center leading-relaxed">
                                    Configuração automática via herança: <br />
                                    Ícone Ponto • Mesma Cor • Mesmos Módulos
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex gap-2 pt-6 border-t border-border/10 mt-2">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-[1.2rem] font-bold text-[10px] uppercase tracking-widest flex-1 h-12 transition-colors active:scale-95">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={loading || nomes.every(n => n.trim() === "")}
                            className="rounded-[1.2rem] bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] uppercase tracking-widest flex-1 h-12 shadow-xl shadow-primary/10 transition-all active:scale-95"
                        >
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : editingCategory ? 'Atualizar' : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
