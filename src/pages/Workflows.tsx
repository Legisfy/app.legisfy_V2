import React, { useState, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  Handle,
  Position,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';

const DYNAMIC_TAGS = {
  eleitor: ['name', 'whatsapp', 'email', 'neighborhood', 'cidade', 'address', 'profession'],
  demanda: ['titulo', 'descricao', 'status', 'prioridade', 'data_limite'],
  indicacao: ['titulo', 'tipo', 'endereco_rua', 'endereco_bairro', 'observacoes']
};
import '@xyflow/react/dist/style.css';

import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users,
  Plus, 
  Save, 
  Play, 
  Trash2, 
  Settings2, 
  Zap, 
  Database,
  MessageSquare,
  UserPlus,
  FileText,
  Calendar,
  Loader2,
  Info,
  ChevronDown,
  FolderPlus,
  Folder,
  MoreVertical,
  ChevronRight,
  Search,
  CalendarClock,
  CircleDot,
  Power,
  FileAudio,
  Paperclip,
  Tag,
  Edit3,
  ArrowLeft,
  X,
  StickyNote,
  ClipboardCheck,
  Clock,
  Image
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useActiveInstitution } from "@/hooks/useActiveInstitution";
import { useEffect } from "react";

const initialNodes: any[] = [];
const initialEdges: any[] = [];

// Custom Node Component
const WorkflowNode = ({ data, id }: { data: any, id: string }) => {
  const Icon = data.icon || Zap;
  const [selectedAction, setSelectedAction] = useState('nova');
  
  return (
    <div className="group relative">
      <div 
        onClick={() => {
          console.log('Opening settings for node:', id);
          window.dispatchEvent(new CustomEvent('open-node-settings', { detail: { id } }));
        }}
        className="flex flex-col items-center justify-center min-w-[120px] min-h-[130px] p-4 rounded-3xl border-2 transition-all duration-300 bg-white dark:bg-zinc-900 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 cursor-pointer"
        style={{ 
          borderColor: data.color || '#3b82f6',
        }}
      >
        <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-muted-foreground/30 border-none" />
        
        {/* Delete Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('delete-workflow-node', { detail: { id } }));
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg z-50"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        <div 
          className="flex items-center justify-center w-12 h-12 rounded-2xl mb-3 transition-transform group-hover:scale-110 shadow-inner"
          style={{ backgroundColor: `${data.color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color: data.color }} />
        </div>
        
        <div className="flex flex-col items-center gap-1 w-full">
          <span className="text-[10px] font-black uppercase tracking-tight text-center px-1 leading-tight text-foreground font-outfit">
            {data.label}
          </span>
          
          <div className="mt-2 w-full space-y-1.5 pt-2 border-t border-border/10">
            {data.label === 'Eleitor' && (
              <div className="relative group/sel w-full">
                <select 
                  value={data.selectedAction || 'novo'}
                  onChange={(e) => {
                    window.dispatchEvent(new CustomEvent('update-node-data', { 
                      detail: { id, data: { selectedAction: e.target.value } } 
                    }));
                  }}
                  className="w-full bg-muted/40 dark:bg-zinc-800 border border-border/20 dark:border-white/10 rounded-lg py-1 px-2 pr-5 text-[8px] font-bold uppercase focus:ring-1 focus:ring-primary outline-none cursor-pointer text-foreground dark:text-zinc-100 appearance-none"
                >
                  <option value="novo" className="bg-background dark:bg-zinc-900">Novo Eleitor</option>
                  <option value="atualizado" className="bg-background dark:bg-zinc-900">Dados Atualizados</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground pointer-events-none opacity-50 group-hover/sel:opacity-100 transition-opacity" />
              </div>
            )}
            
            {(data.label === 'Demandas' || data.label === 'Indicação') && (
              <div className="space-y-1.5 w-full">
                <div className="relative group/sel w-full">
                  <select 
                    value={data.selectedAction || 'nova'}
                    onChange={(e) => {
                      window.dispatchEvent(new CustomEvent('update-node-data', { 
                        detail: { id, data: { selectedAction: e.target.value } } 
                      }));
                    }}
                    className="w-full bg-muted/40 dark:bg-zinc-800 border border-border/20 dark:border-white/10 rounded-lg py-1 px-2 pr-5 text-[8px] font-bold uppercase focus:ring-1 focus:ring-primary outline-none cursor-pointer text-foreground dark:text-zinc-100 appearance-none"
                  >
                    <option value="nova" className="bg-background dark:bg-zinc-900">Nova {data.label}</option>
                    <option value="status" className="bg-background dark:bg-zinc-900">Status Atualizado</option>
                    {data.label === 'Demandas' && (
                      <>
                        <option value="pendente_dias" className="bg-background dark:bg-zinc-900">Pendente {'>'} X Dias</option>
                        <option value="sem_registro" className="bg-background dark:bg-zinc-900">Sem registro {'>'} X Dias</option>
                      </>
                    )}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground pointer-events-none opacity-50 group-hover/sel:opacity-100 transition-opacity" />
                </div>
                
                {/* Secondary Select for Status - ONLY visible if 'status' is selected */}
                {(data.selectedAction === 'status') && (
                  <div className="relative group/sel w-full animate-in fade-in zoom-in-95 duration-200">
                    <select 
                      value={data.selectedStatus || (data.label === 'Demandas' ? 'pendente' : 'enviada')}
                      onChange={(e) => {
                        window.dispatchEvent(new CustomEvent('update-node-data', { 
                          detail: { id, data: { selectedStatus: e.target.value } } 
                        }));
                      }}
                      className="w-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 rounded-lg py-1 px-2 pr-5 text-[8px] font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-blue-600 dark:text-blue-400 appearance-none"
                    >
                      {data.label === 'Demandas' ? (
                        <>
                          <option value="pendente" className="bg-background dark:bg-zinc-900">Pendente</option>
                          <option value="em_andamento" className="bg-background dark:bg-zinc-900">Em Andamento</option>
                          <option value="atendido" className="bg-background dark:bg-zinc-900">Atendido</option>
                          <option value="cancelado" className="bg-background dark:bg-zinc-900">Cancelado</option>
                        </>
                      ) : (
                        <>
                          <option value="enviada" className="bg-background dark:bg-zinc-900">Enviada</option>
                          <option value="lida" className="bg-background dark:bg-zinc-900">Lida</option>
                          <option value="aprovada" className="bg-background dark:bg-zinc-900">Aprovada</option>
                          <option value="reprovada" className="bg-background dark:bg-zinc-900">Reprovada</option>
                          <option value="atendido" className="bg-background dark:bg-zinc-900">Atendido</option>
                        </>
                      )}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-blue-500 pointer-events-none opacity-50 group-hover/sel:opacity-100 transition-opacity" />
                  </div>
                )}

                {(data.selectedAction === 'pendente_dias' || data.selectedAction === 'sem_registro') && (
                  <div className="flex items-center gap-1 bg-muted/10 dark:bg-white/5 border border-border/10 dark:border-white/5 rounded-lg px-2 py-1 animate-in fade-in slide-in-from-top-1">
                    <span className="text-[7px] font-black text-muted-foreground uppercase opacity-50">Dias:</span>
                    <input 
                      type="number" 
                      value={data.days || 3} 
                      onChange={(e) => {
                        window.dispatchEvent(new CustomEvent('update-node-data', { 
                          detail: { id, data: { days: parseInt(e.target.value) } } 
                        }));
                      }}
                      className="w-full bg-transparent border-none p-0 text-[8px] font-bold focus:ring-0 outline-none text-foreground dark:text-zinc-100" 
                    />
                  </div>
                )}
              </div>
            )}

            {data.label === 'WhatsApp' && (
              <div className="w-full space-y-1.5 flex flex-col items-center">
                <div className="text-[7px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                  {data.actionType === 'ias' ? 'IA Ativada' : 'Mensagem'}
                </div>
                {data.message && (
                  <p className="text-[6px] text-muted-foreground line-clamp-2 text-center max-w-[100px] italic">
                    "{data.message}"
                  </p>
                )}
                {data.attachments?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {data.attachments.map((at: any, idx: number) => (
                      <div key={idx} className="w-3 h-3 rounded-full bg-emerald-100 flex items-center justify-center">
                        {at.type === 'audio' ? <FileAudio className="w-1.5 h-1.5 text-emerald-600" /> : <Paperclip className="w-1.5 h-1.5 text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('open-node-settings', { detail: { id } }));
                  }}
                  className="w-full h-5 text-[6px] font-bold uppercase hover:bg-emerald-500/10 text-emerald-600 border border-dashed border-emerald-500/20 mt-1"
                >
                  Configurar
                </Button>
              </div>
            )}
          </div>
        </div>

        <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-muted-foreground/30 border-none" />
      </div>
    </div>
  );
};

// Post-it / Note Node Component
const NoteNode = ({ data, id }: { data: any, id: string }) => {
  return (
    <div className="group relative">
      <div className="w-[180px] min-h-[140px] p-4 bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-400 shadow-lg rotate-1 hover:rotate-0 transition-all duration-300 rounded-sm">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('delete-workflow-node', { detail: { id } }));
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-md z-50"
        >
          <Trash2 className="w-3 h-3" />
        </button>
        
        <div className="flex items-center gap-2 mb-2 opacity-50 border-b border-yellow-600/10 pb-1">
          <StickyNote className="w-3 h-3" />
          <span className="text-[8px] font-black uppercase tracking-widest font-outfit">Lembrete</span>
        </div>
        
        <textarea 
          placeholder="Escreva seu comentário aqui..."
          className="w-full bg-transparent border-none p-0 text-[11px] h-[80px] resize-none focus:ring-0 outline-none font-medium text-yellow-900 dark:text-yellow-200 placeholder:text-yellow-700/30 font-outfit leading-snug"
          defaultValue={data.label === 'Nota' ? '' : data.label}
        />
      </div>
    </div>
  );
};

const nodeTypes = {
  workflow: WorkflowNode,
  note: NoteNode,
};

export default function Workflows() {
  const { toast } = useToast();
  const { activeInstitution } = useActiveInstitution();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workflowName, setWorkflowName] = useState("Minha Automação");
  const [workflowMeta, setWorkflowMeta] = useState<{ created_at?: string; created_by_name?: string }>({});
  const [activeTab, setActiveTab] = useState("builder");
  const [logs, setLogs] = useState<any[]>([]);

  // Dashboard State
  const [view, setView] = useState<"listing" | "builder">("listing");
  const [workflowsList, setWorkflowsList] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}

// Separate component for the editor to use useReactFlow
function WorkflowEditor() {
  const { toast } = useToast();
  const { activeInstitution } = useActiveInstitution();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workflowName, setWorkflowName] = useState("Minha Automação");
  const [workflowMeta, setWorkflowMeta] = useState<{ created_at?: string; created_by_name?: string }>({});
  const [activeTab, setActiveTab] = useState("builder");
  const [view, setView] = useState<"listing" | "builder">("listing");
  const [workflowsList, setWorkflowsList] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const { screenToFlowPosition } = useReactFlow();
  const [logs, setLogs] = useState<any[]>([]);
  const [demands, setDemands] = useState<any[]>([]);
  const [sidePanelWidth, setSidePanelWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testData, setTestData] = useState({ 
    number: '', 
    name: 'João Silva', 
    demandaId: '' 
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, blockId: string, nodeId: string) => {
    const file = event.target.files?.[0];
    if (!file || !activeInstitution?.cabinet_id) return;

    setUploadingBlockId(blockId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${nodeId}/${blockId}/${Date.now()}.${fileExt}`;
      const filePath = `${activeInstitution.cabinet_id}/${fileName}`;

      const { error } = await supabase.storage
        .from('whatsapp-media')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('whatsapp-media')
        .getPublicUrl(filePath);

      const blocks = [...(nodes.find(n => n.id === nodeId)?.data.blocks || [])];
      const blockIdx = blocks.findIndex(b => b.id === blockId);
      if (blockIdx !== -1) {
        blocks[blockIdx].content = publicUrl;
        blocks[blockIdx].fileName = file.name;
        updateNodeData(nodeId, { blocks });
      }

      toast({ title: "Arquivo carregado", description: file.name });
    } catch (err: any) {
      console.error('Erro no upload:', err);
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploadingBlockId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 400 && newWidth <= 1000) {
        setSidePanelWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Load logs
  const loadLogs = useCallback(async () => {
    if (!activeInstitution?.cabinet_id) return;
    try {
      const { data, error } = await (supabase as any)
        .from('workflow_logs')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('created_at', { descending: true })
        .limit(20);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    }
  }, [activeInstitution]);

  const loadDemands = useCallback(async () => {
    if (!activeInstitution?.cabinet_id) return;
    try {
      const { data, error } = await (supabase as any)
        .from('demandas')
        .select('id, titulo')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .limit(10);
      if (error) throw error;
      setDemands(data || []);
    } catch (err) {
      console.error('Erro ao carregar demandas para teste:', err);
    }
  }, [activeInstitution]);

  useEffect(() => {
    if (activeTab === "logs") loadLogs();
  }, [activeTab, loadLogs]);

  useEffect(() => {
    if (isTestModalOpen) loadDemands();
  }, [isTestModalOpen, loadDemands]);

  // Load Workflows and Folders
  const loadDashboardData = useCallback(async () => {
    if (!activeInstitution?.cabinet_id) return;
    setLoading(true);
    try {
      // Load Folders
      const { data: foldersData } = await (supabase as any)
        .from('workflow_folders')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('name');
      setFolders(foldersData || []);

      // Load Workflows
      console.log('Carregando workflows para gabinete:', activeInstitution.cabinet_id);
      const { data: workflowsData, error } = await (supabase as any)
        .from('workflows')
        .select('*')
        .eq('gabinete_id', activeInstitution.cabinet_id)
        .order('updated_at', { descending: true });

      if (error) {
        console.error('Erro detalhado Supabase (workflows):', error);
        throw error;
      }
      
      console.log('Workflows carregados do banco:', workflowsData?.length, workflowsData);
      setWorkflowsList(workflowsData || []);
    } catch (err) {
      console.error('Erro ao carregar dashboard (catch):', err);
    } finally {
      setLoading(false);
    }
  }, [activeInstitution]);

  useEffect(() => {
    if (view === "listing") loadDashboardData();
    
    // Listen for node deletion and configuration from custom components
    const handleDeleteNode = (e: any) => {
      const nodeId = e.detail.id;
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    };

    const handleOpenSettings = (e: any) => {
      setSelectedNodeId(e.detail.id);
    };

    const handleUpdateData = (e: any) => {
      updateNodeData(e.detail.id, e.detail.data);
    };

    window.addEventListener('delete-workflow-node', handleDeleteNode);
    window.addEventListener('open-node-settings', handleOpenSettings);
    window.addEventListener('update-node-data', handleUpdateData);

    return () => {
      window.removeEventListener('delete-workflow-node', handleDeleteNode);
      window.removeEventListener('open-node-settings', handleOpenSettings);
      window.removeEventListener('update-node-data', handleUpdateData);
    };
  }, [view, loadDashboardData, setNodes]);

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim() || !activeInstitution?.cabinet_id) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await (supabase as any)
        .from('workflows')
        .insert([{
          name: newWorkflowName,
          gabinete_id: activeInstitution.cabinet_id,
          user_id: user.id,
          folder_id: selectedFolderId,
          nodes: [],
          edges: [],
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      
      setNewWorkflowName("");
      setIsCreateModalOpen(false);
      
      // Open builder for the new workflow
      setSelectedWorkflowId(data.id);
      setWorkflowName(data.name);
      setNodes([]);
      setEdges([]);
      setView("builder");
      
      toast({ title: "Workflow Criado", description: "O novo fluxo foi criado com sucesso." });
    } catch (err) {
      console.error('Erro ao criar workflow:', err);
      toast({ title: "Erro ao criar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !activeInstitution?.cabinet_id) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('workflow_folders')
        .insert([{
          name: newFolderName,
          gabinete_id: activeInstitution.cabinet_id,
          user_id: user?.id
        }]);

      if (error) throw error;
      setNewFolderName("");
      setIsFolderModalOpen(false);
      loadDashboardData();
      toast({ title: "Pasta Criada" });
    } catch (err) {
      console.error('Erro ao criar pasta:', err);
    }
  };

  const toggleWorkflowStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('workflows')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      loadDashboardData();
      toast({ title: !currentStatus ? "Workflow Ativado" : "Workflow Desativado" });
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este workflow?")) return;
    try {
      const { error } = await (supabase as any)
        .from('workflows')
        .delete()
        .eq('id', id);
      if (error) throw error;
      loadDashboardData();
      toast({ title: "Workflow Excluído" });
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const openWorkflow = (workflow: any) => {
    setSelectedWorkflowId(workflow.id);
    setWorkflowName(workflow.name);
    
    // Restore nodes with icons
    const iconMap: Record<string, any> = {
      'Eleitor': UserPlus,
      'Demandas': MessageSquare,
      'Projetos de Lei': FileText,
      'Agendas': Calendar,
      'Tags': Database,
      'WhatsApp': Zap,
      'Público': Users,
    };

    const restoredNodes = (workflow.nodes as Node[] || []).map(node => ({
      ...node,
      type: 'workflow',
      data: {
        ...node.data,
        icon: iconMap[String(node.data?.label || '')] || Zap
      }
    }));

    setNodes(restoredNodes);
    setEdges(workflow.edges as Edge[] || []);
    setSelectedFolderId(workflow.folder_id);
    setWorkflowMeta({
      created_at: workflow.created_at,
      created_by_name: workflow.profiles?.full_name
    });
    setView("builder");
  };

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, color: string, iconName: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, label, color, iconName }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const data = event.dataTransfer.getData('application/reactflow');
      if (!data) return;

      try {
        const { type, label, color, iconName } = JSON.parse(data);

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        // Map icon name to Lucide Component
        const iconMap: Record<string, any> = {
          UserPlus,
          MessageSquare,
          FileSignature: FileText,
          FileText,
          Calendar,
          Database,
          Zap,
          Users,
          Clock,
          StickyNote,
          ClipboardCheck
        };

        const newNode: Node = {
          id: `node_${Date.now()}`,
          type: type === 'note' ? 'note' : 'workflow',
          position,
          data: { 
            label: type === 'note' ? '' : label, 
            color, 
            icon: type === 'note' ? StickyNote : (iconMap[iconName] || Zap),
            role: type,
            actionType: label === 'WhatsApp' ? 'msg' : undefined,
            message: label === 'WhatsApp' ? '' : undefined,
            attachments: label === 'WhatsApp' ? [] : [],
            blocks: label === 'WhatsApp' ? [{ id: `b_${Date.now()}`, type: 'text', content: '' }] : undefined,
            selectedAction: (label === 'Demandas' || label === 'Indicação' || label === 'Eleitor') ? (label === 'Eleitor' ? 'novo' : 'nova') : undefined,
            selectedStatus: (label === 'Demandas') ? 'pendente' : (label === 'Indicação' ? 'enviada' : undefined),
            days: (label === 'Demandas') ? 3 : undefined
          },
        };

        setNodes((nds: any[]) => nds.concat(newNode));
      } catch (err) {
        console.error('Erro no onDrop:', err);
      }
    },
    [screenToFlowPosition, setNodes]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onSave = useCallback(async () => {
    if (!selectedWorkflowId || !activeInstitution?.cabinet_id) {
      toast({ title: "Erro", description: "Workflow não selecionado.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const workflowData = {
        name: workflowName,
        nodes,
        edges,
        folder_id: selectedFolderId,
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any)
        .from('workflows')
        .update(workflowData)
        .eq('id', selectedWorkflowId);
      
      if (error) throw error;

      toast({
        title: "Workflow salvo",
        description: "Suas alterações foram salvas com sucesso.",
      });
      loadDashboardData();
    } catch (err) {
      console.error('Erro ao salvar workflow:', err);
      toast({
        title: "Erro ao salvar",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, workflowName, selectedWorkflowId, activeInstitution, toast, loadDashboardData]);

  const filteredWorkflows = workflowsList.filter(wf => {
    const matchesSearch = wf.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // If searching, ignore folder filter to help find the workflow
    if (searchQuery.trim() !== "") return matchesSearch;
    
    // Otherwise, filter by folder
    const matchesFolder = selectedFolderId ? wf.folder_id === selectedFolderId : !wf.folder_id;
    return matchesSearch && matchesFolder;
  });

  if (view === "listing") {
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden">
          {/* Sidebar - Folders */}
          <div className="w-64 border-r border-border/40 bg-muted/5 group/sidebar flex flex-col p-4 transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/40">Pastas</h2>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsFolderModalOpen(true)}>
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1">
              <button 
                onClick={() => setSelectedFolderId(null)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${!selectedFolderId ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                <Database className="h-4 w-4" /> Geral
              </button>
              {folders.map(folder => (
                <button 
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${selectedFolderId === folder.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
                >
                  <Folder className="h-4 w-4" /> {folder.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main List */}
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/20 dark:bg-muted/5">
            <header className="p-6 border-b border-border/40 bg-background/50 backdrop-blur-sm flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter font-outfit">Workflows</h1>
                <p className="text-xs text-muted-foreground">Gerencie suas automações e fluxos de trabalho</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Buscar automação..." 
                    className="w-full bg-muted/20 border border-border/40 rounded-full py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-primary outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button className="rounded-full gap-2 px-6 font-bold uppercase text-[10px] tracking-widest" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Criar Workflow
                </Button>
              </div>
            </header>

            <ScrollArea className="flex-1 p-6">
              {filteredWorkflows.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredWorkflows.map(wf => (
                    <Card key={wf.id} className="group overflow-hidden border-border/40 bg-white dark:bg-background hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer flex flex-col h-full rounded-2xl" onClick={() => openWorkflow(wf)}>
                      <div className="p-5 flex-1">
                        <div className="flex items-start justify-between mb-5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${wf.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            <Zap className="h-5 w-5" />
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={`h-8 w-8 rounded-full transition-colors ${wf.is_active ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground'}`}
                              onClick={() => toggleWorkflowStatus(wf.id, wf.is_active)}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-500 hover:bg-red-500/10" onClick={() => deleteWorkflow(wf.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">{wf.name}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                          <CalendarClock className="h-3 w-3" />
                          {new Date(wf.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="px-4 py-3 bg-muted/5 border-t border-border/40 flex items-center justify-between">
                         <Badge variant="outline" className={`h-4 text-[7px] font-black uppercase tracking-widest rounded-full ${wf.is_active ? 'border-emerald-500/20 text-emerald-500' : 'border-muted-foreground/20 text-muted-foreground'}`}>
                            {wf.is_active ? 'Ativo' : 'Pausado'}
                         </Badge>
                         <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                    <Database className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-lg font-bold">Nenhuma automação encontrada</h3>
                  <p className="text-sm text-muted-foreground mb-6">Comece criando seu primeiro fluxo de trabalho.</p>
                  <Button variant="outline" className="rounded-full gap-2" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4" /> Criar Workflow
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Modals */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md p-6 border-border/40 shadow-2xl animate-in zoom-in-95 duration-200">
              <h2 className="text-xl font-black uppercase tracking-tight font-outfit mb-4">Novo Workflow</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome da Automação</label>
                  <input 
                    autoFocus
                    className="w-full bg-muted/20 border border-border/40 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Ex: Boas Vindas Eleitor"
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pasta</label>
                  <select 
                    className="w-full bg-muted/20 border border-border/40 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none appearance-none"
                    value={selectedFolderId || ""}
                    onChange={(e) => setSelectedFolderId(e.target.value || null)}
                  >
                    <option value="">Geral (Sem Pasta)</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button variant="ghost" className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
                  <Button className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest" onClick={handleCreateWorkflow} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Workflow'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {isFolderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-sm p-6 border-border/40 shadow-2xl animate-in zoom-in-95 duration-200">
              <h2 className="text-xl font-black uppercase tracking-tight font-outfit mb-4">Nova Pasta</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome da Pasta</label>
                  <input 
                    autoFocus
                    className="w-full bg-muted/20 border border-border/40 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Ex: Campanha 2026"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="ghost" className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest" onClick={() => setIsFolderModalOpen(false)}>Cancelar</Button>
                  <Button className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest" onClick={handleCreateFolder}>Criar Pasta</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/40 bg-background/95 backdrop-blur flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setView("listing")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-0.5">
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="bg-transparent border-none p-0 h-auto text-sm font-bold tracking-tight text-foreground/80 font-outfit uppercase focus:ring-0 focus:outline-none w-48"
                    placeholder="Nome da Automação"
                  />
                  <Badge variant="outline" className="h-4 px-1.5 text-[7px] font-bold border-border/60 text-primary bg-primary/5 uppercase tracking-[0.2em] rounded-full">
                    Workflow Builder
                  </Badge>
                  <div className="flex items-center gap-1 border-l border-border/40 ml-2 pl-2">
                    <Folder className="h-3 w-3 text-muted-foreground/40" />
                    <select 
                      className="bg-transparent border-none text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 outline-none cursor-pointer hover:text-primary transition-colors pr-4 appearance-none"
                      value={selectedFolderId || ""}
                      onChange={(e) => setSelectedFolderId(e.target.value || null)}
                    >
                      <option value="">Geral</option>
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   {workflowMeta.created_at && (
                    <div className="flex items-center gap-2 text-[8px] text-muted-foreground/30 uppercase tracking-tighter">
                      <CircleDot className="h-2 w-2 text-primary" />
                      <span>Criado em: {new Date(workflowMeta.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Por: {workflowMeta.created_by_name || 'Sistema'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-48 h-8 mr-4">
              <TabsList className="grid w-full grid-cols-2 h-8 bg-muted/20">
                <TabsTrigger value="builder" className="text-[9px] font-bold uppercase tracking-widest">Builder</TabsTrigger>
                <TabsTrigger value="logs" className="text-[9px] font-bold uppercase tracking-widest">Logs</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2" onClick={() => { setNodes([]); setEdges([]); }}>
              <Trash2 className="h-3 w-3" /> Limpar
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} 
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button variant="default" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90">
              <Play className="h-3 w-3" /> Publicar
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {activeTab === "builder" ? (
            <>
              {/* Node Palette */}
              <div className="w-80 border-r border-border/40 bg-muted/5 p-6 overflow-y-auto space-y-10">
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-6 flex items-center justify-between">
                    Trigger ( Gatilhos )
                    <Zap className="h-3 w-3 opacity-30" />
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Eleitor */}
                    <div 
                      draggable onDragStart={(e) => onDragStart(e, 'trigger', 'Eleitor', '#3b82f6', 'UserPlus')}
                      className="flex flex-col items-center justify-center aspect-square gap-2 p-3 border border-border/40 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md border-border/40 hover:border-primary/40 transition-all group rounded-3xl p-3 aspect-square flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UserPlus className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-center opacity-60">Eleitor</span>
                    </div>

                    {/* Demandas */}
                    <div 
                      draggable onDragStart={(e) => onDragStart(e, 'trigger', 'Demandas', '#3b82f6', 'MessageSquare')}
                      className="flex flex-col items-center justify-center aspect-square gap-2 p-3 border border-border/40 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md border-border/40 hover:border-primary/40 transition-all group rounded-3xl p-3 aspect-square flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-center opacity-60">Demandas</span>
                    </div>

                    {/* Projetos de Lei */}
                    <div 
                      draggable onDragStart={(e) => onDragStart(e, 'trigger', 'Projetos de Lei', '#3b82f6', 'FileText')}
                      className="flex flex-col items-center justify-center aspect-square gap-2 p-3 border border-border/40 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md border-border/40 hover:border-primary/40 transition-all group rounded-3xl p-3 aspect-square flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-center opacity-60">P. Lei</span>
                    </div>

                    {/* Agendas */}
                    <div 
                      draggable onDragStart={(e) => onDragStart(e, 'trigger', 'Agendas', '#3b82f6', 'Calendar')}
                      className="flex flex-col items-center justify-center aspect-square gap-2 p-3 border border-border/40 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md border-border/40 hover:border-primary/40 transition-all group rounded-3xl p-3 aspect-square flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calendar className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-center opacity-60">Agendas</span>
                    </div>

                    {/* Indicação */}
                    <div 
                      draggable onDragStart={(e) => onDragStart(e, 'trigger', 'Indicação', '#3b82f6', 'ClipboardCheck')}
                      className="flex flex-col items-center justify-center aspect-square gap-2 p-3 border border-border/40 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md border-border/40 hover:border-primary/40 transition-all group rounded-3xl p-3 aspect-square flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing"
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ClipboardCheck className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-center opacity-60">Indicação</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-6 flex items-center justify-between">
                    Ações (Actions)
                    <Plus className="h-3 w-3 opacity-30" />
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* WhatsApp */}
                    <div 
                      draggable onDragStart={(e) => onDragStart(e, 'action', 'WhatsApp', '#10b981', 'Zap')}
                      className="flex flex-col items-center justify-center aspect-square gap-2 p-3 border border-border/40 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md border-border/40 hover:border-emerald-500/40 cursor-grab active:cursor-grabbing transition-all group rounded-3xl p-3 aspect-square flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-center opacity-60">WhatsApp</span>
                    </div>

                    {/* Tags */}
                    <div 
                      draggable onDragStart={(e) => onDragStart(e, 'action', 'Tags', '#10b981', 'Database')}
                      className="flex flex-col items-center justify-center aspect-square gap-2 p-3 border border-border/40 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md border-border/40 hover:border-emerald-500/40 cursor-grab active:cursor-grabbing transition-all group rounded-3xl p-3 aspect-square flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Database className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-center opacity-60">Tags</span>
                    </div>

                    {/* Público */}
                    <div 
                      draggable onDragStart={(e) => onDragStart(e, 'action', 'Público', '#10b981', 'Users')}
                      className="flex flex-col items-center justify-center aspect-square gap-2 p-3 border border-border/40 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md border-border/40 hover:border-emerald-500/40 cursor-grab active:cursor-grabbing transition-all group rounded-3xl p-3 aspect-square flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-center opacity-60">Público</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-6 flex items-center justify-between">
                    Extras
                    <Plus className="h-3 w-3 opacity-30" />
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Nota / Post-it */}
                    <div 
                      draggable onDragStart={(e) => onDragStart(e, 'note', 'Nota', '#facc15', 'StickyNote')}
                      className="flex flex-col items-center justify-center aspect-square gap-2 p-3 border border-border/40 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md border-border/40 hover:border-yellow-500/40 cursor-grab active:cursor-grabbing transition-all group rounded-3xl p-3 aspect-square flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <StickyNote className="h-4 w-4 text-yellow-500" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-center opacity-60">Nota</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Canvas */}
              <div className="flex-1 bg-muted/10 relative">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Carregando Fluxo...</p>
                    </div>
                  </div>
                ) : null}
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                  nodeTypes={nodeTypes}
                  fitView
                  className="bg-dot-pattern"
                >
                  <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                  <Controls className="dark:bg-zinc-900 dark:border-white/10 dark:fill-white [&_button]:dark:bg-zinc-800 [&_button]:dark:border-white/5 [&_svg]:dark:fill-white" />
                  <MiniMap 
                    className="dark:bg-zinc-900 dark:border-white/10"
                    maskColor="rgba(0, 0, 0, 0.2)"
                    nodeStrokeColor={(n) => {
                      if (n.type === 'input') return '#3b82f6';
                      return '#10b981';
                    }}
                    nodeColor={(n) => {
                      if (n.type === 'input') return '#3b82f6';
                      return '#10b981';
                    }}
                  />
                  <Panel position="top-right">
                    <Card className="p-2 border-border/40 bg-background/80 backdrop-blur shadow-sm">
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                        <Settings2 className="h-3 w-3" /> Configurações do Fluxo
                      </p>
                    </Card>
                  </Panel>
                </ReactFlow>
              </div>

              {/* Node Configuration Sidebar */}
              <Sheet open={!!selectedNodeId} onOpenChange={(open) => !open && setSelectedNodeId(null)}>
                <SheetContent 
                  side="right" 
                  className="bg-background dark:bg-zinc-950 p-0 overflow-hidden flex flex-col border-l border-border/40 transition-none sm:max-w-none shadow-2xl"
                  style={{ width: `${sidePanelWidth}px` }}
                >
                  {/* Resize handle */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary/20 transition-colors z-50 group flex items-center justify-center"
                    onMouseDown={startResizing}
                  >
                    <div className="w-[2px] h-10 bg-border/20 group-hover:bg-primary/40 rounded-full transition-colors" />
                  </div>
                  {selectedNode && (
                    <>
                      <SheetHeader className="p-6 border-b border-border/10 bg-muted/5 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <selectedNode.data.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <SheetTitle className="text-xl font-black uppercase tracking-tight font-outfit">
                              Configurar {selectedNode.data.label}
                            </SheetTitle>
                            <SheetDescription className="text-xs uppercase tracking-widest font-bold opacity-50">
                              ID: {selectedNode.id}
                            </SheetDescription>
                          </div>
                        </div>
                      </SheetHeader>

                      <div className="flex-1 overflow-hidden flex flex-col">
                        {selectedNode.data.label === 'WhatsApp' ? (
                          <div className="flex-1 flex overflow-hidden">
                            {/* Palette of Blocks */}
                            <div className="w-20 border-r border-border/10 bg-muted/5 p-4 flex flex-col gap-4 items-center overflow-y-auto shrink-0">
                              <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 text-center">Blocos</Label>
                              {[
                                { type: 'text', icon: MessageSquare, label: 'Texto' },
                                { type: 'audio', icon: FileAudio, label: 'Áudio' },
                                { type: 'image', icon: Paperclip, label: 'Imagem' },
                                { type: 'file', icon: FileText, label: 'Arquivo' },
                                { type: 'ai', icon: Zap, label: 'IA' },
                                { type: 'delay', icon: Clock, label: 'Intervalo' },
                              ].map((b) => (
                                <button
                                  key={b.type}
                                  onClick={() => {
                                    const blocks = selectedNode.data.blocks || [];
                                    updateNodeData(selectedNode.id, { 
                                      blocks: [...blocks, { id: `b_${Date.now()}`, type: b.type, content: '' }] 
                                    });
                                  }}
                                  className="w-12 h-12 rounded-2xl bg-background border border-border/40 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm group shrink-0"
                                >
                                  <b.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-[7px] font-bold uppercase tracking-tighter opacity-50 group-hover:opacity-100">{b.label}</span>
                                </button>
                              ))}
                            </div>

                            {/* Simulator Area */}
                            <div className="flex-1 flex flex-col bg-[#e5ddd5] dark:bg-zinc-950/50 relative overflow-hidden">
                              {/* WhatsApp Header Simulation */}
                              <div className="bg-[#075e54] dark:bg-emerald-900/80 p-3 flex items-center gap-3 shadow-md z-10 shrink-0">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white text-xs font-bold leading-none">Contato Simulado</p>
                                  <p className="text-white/60 text-[8px] uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Online
                                  </p>
                                </div>
                              </div>

                              {/* Chat Bubbles Container */}
                              <ScrollArea className="flex-1 p-4 bg-pattern opacity-90">
                                <div className="space-y-4 max-w-sm mx-auto">
                                  {(selectedNode.data.blocks || []).map((block: any, idx: number) => (
                                    <div key={block.id} className="relative group/bubble flex gap-2">
                                      <div className="flex-1 bg-white dark:bg-zinc-800 rounded-lg rounded-tl-none p-3 shadow-sm border border-black/5 relative animate-in slide-in-from-left-2 duration-300">
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between mb-1 opacity-40">
                                            <span className="text-[7px] font-black uppercase tracking-widest">
                                              {block.type === 'text' ? 'Mensagem de Texto' : 
                                               block.type === 'audio' ? 'Mensagem de Áudio' : 
                                               block.type === 'delay' ? 'Esperar Tempo' : 
                                               block.type === 'ai' ? 'Resposta por IA' : 'Arquivo/Imagem'}
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <button 
                                                disabled={idx === 0}
                                                onClick={() => {
                                                  const blocks = [...selectedNode.data.blocks];
                                                  [blocks[idx], blocks[idx-1]] = [blocks[idx-1], blocks[idx]];
                                                  updateNodeData(selectedNode.id, { blocks });
                                                }}
                                                className="hover:text-primary disabled:opacity-20"
                                              >
                                                <ChevronRight className="w-2.5 h-2.5 -rotate-90" />
                                              </button>
                                              <button 
                                                disabled={idx === (selectedNode.data.blocks.length - 1)}
                                                onClick={() => {
                                                  const blocks = [...selectedNode.data.blocks];
                                                  [blocks[idx], blocks[idx+1]] = [blocks[idx+1], blocks[idx]];
                                                  updateNodeData(selectedNode.id, { blocks });
                                                }}
                                                className="hover:text-primary disabled:opacity-20"
                                              >
                                                <ChevronRight className="w-2.5 h-2.5 rotate-90" />
                                              </button>
                                              <button 
                                                onClick={() => {
                                                  const blocks = selectedNode.data.blocks.filter((b: any) => b.id !== block.id);
                                                  updateNodeData(selectedNode.id, { blocks });
                                                }}
                                                className="hover:text-red-500"
                                              >
                                                <X className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          </div>

                                          {block.type === 'text' ? (
                                            <Textarea 
                                              className="min-h-[60px] text-xs bg-muted/20 border-none focus-visible:ring-0 p-0 shadow-none resize-none font-medium"
                                              value={block.content}
                                              onChange={(e) => {
                                                const blocks = [...selectedNode.data.blocks];
                                                blocks[idx].content = e.target.value;
                                                updateNodeData(selectedNode.id, { blocks });
                                              }}
                                              placeholder="Digite sua mensagem..."
                                            />
                                          ) : block.type === 'delay' ? (
                                            <div className="flex items-center gap-2 bg-muted/10 p-2 rounded-lg">
                                              <Clock className="w-4 h-4 text-primary" />
                                              <Input 
                                                type="number" 
                                                className="h-7 w-20 text-[10px] font-bold"
                                                value={block.content || 5}
                                                onChange={(e) => {
                                                  const blocks = [...selectedNode.data.blocks];
                                                  blocks[idx].content = e.target.value;
                                                  updateNodeData(selectedNode.id, { blocks });
                                                }}
                                              />
                                              <span className="text-[10px] font-bold opacity-40">SEGUNDOS</span>
                                            </div>
                                          ) : block.type === 'ai' ? (
                                            <div className="flex flex-col gap-2 bg-indigo-500/5 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                                              <div className="flex items-center gap-2">
                                                <Zap className="w-4 h-4 text-indigo-500 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Transição para IA</span>
                                              </div>
                                              <p className="text-[9px] font-bold opacity-60 leading-relaxed">
                                                A partir deste ponto, a automação encerra e a Inteligência Artificial assume a interação direta com o eleitor.
                                              </p>
                                            </div>
                                          ) : (
                                            <div 
                                              onClick={() => {
                                                if (!uploadingBlockId) {
                                                  setUploadingBlockId(block.id);
                                                  fileInputRef.current?.click();
                                                }
                                              }}
                                              className={cn(
                                                "flex items-center gap-3 bg-muted/10 p-4 rounded-xl border-2 border-dashed transition-all hover:bg-muted/20 cursor-pointer relative overflow-hidden",
                                                block.content ? "border-primary/40 bg-primary/5" : "border-border/20"
                                              )}
                                            >
                                              {uploadingBlockId === block.id && (
                                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
                                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                </div>
                                              )}
                                              
                                              <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover/media:scale-110",
                                                block.content ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                                              )}>
                                                {block.type === 'audio' ? <FileAudio className="w-5 h-5" /> : block.type === 'image' ? <Image className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                                              </div>
                                              <div className="flex flex-col flex-1 overflow-hidden">
                                                <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                                                  {block.content ? 'Arquivo Carregado' : `Anexo de ${block.type === 'audio' ? 'Áudio' : block.type === 'image' ? 'Imagem' : 'Arquivo'}`}
                                                </span>
                                                <span className="text-[8px] font-bold opacity-40 mt-1 truncate">
                                                  {block.fileName || (block.content ? 'Ver arquivo' : 'Clique para fazer upload')}
                                                </span>
                                              </div>
                                              
                                              {block.content && (
                                                <button 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    const blocks = [...selectedNode.data.blocks];
                                                    blocks[idx].content = '';
                                                    blocks[idx].fileName = '';
                                                    updateNodeData(selectedNode.id, { blocks });
                                                  }}
                                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex justify-end mt-1">
                                          <span className="text-[6px] opacity-40">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                              
                              <div className="p-3 bg-white/50 dark:bg-zinc-900/50 backdrop-blur border-t border-border/10 flex items-center justify-between shrink-0">
                                <div className="flex gap-1 flex-wrap max-w-[300px]">
                                  {Object.entries(DYNAMIC_TAGS).map(([category, tags]) => (
                                    <div key={category} className="flex flex-wrap gap-1 border-r border-border/10 pr-2 mr-1">
                                      {tags.slice(0, 3).map(tag => (
                                        <Button 
                                          key={tag}
                                          variant="outline" size="sm" 
                                          className="h-6 px-1.5 text-[7px] font-black uppercase tracking-widest hover:bg-primary/10 hover:border-primary/30 transition-all"
                                          onClick={() => {
                                            const blocks = [...(selectedNode.data.blocks || [])];
                                            const lastTextIdx = [...blocks].reverse().findIndex(b => b.type === 'text');
                                            if (lastTextIdx !== -1) {
                                              const realIdx = blocks.length - 1 - lastTextIdx;
                                              blocks[realIdx].content += ` {{${tag}}}`;
                                              updateNodeData(selectedNode.id, { blocks });
                                            }
                                          }}
                                        >
                                          +{tag}
                                        </Button>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                                <Button 
                                  onClick={() => setIsTestModalOpen(true)}
                                  variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase tracking-widest text-[#075e54] dark:text-emerald-400 hover:bg-emerald-500/10"
                                >
                                  <Play className="w-3 h-3 mr-2" /> Testar
                                </Button>
                              </div>
                            </div>
                            
                            {/* Hidden File Input for Attachments */}
                            <input 
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept={
                                uploadingBlockId ? (
                                  selectedNode.data.blocks.find((b: any) => b.id === uploadingBlockId)?.type === 'audio' ? 'audio/*' :
                                  selectedNode.data.blocks.find((b: any) => b.id === uploadingBlockId)?.type === 'image' ? 'image/*' :
                                  '*/*'
                                ) : '*/*'
                              }
                              onChange={(e) => {
                                if (uploadingBlockId) {
                                  handleFileUpload(e, uploadingBlockId, selectedNode.id);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <ScrollArea className="flex-1">
                            <div className="p-6 space-y-8">
                              {/* Gatilho Eleitor */}
                              {selectedNode.data.label === 'Eleitor' && (
                                <div className="space-y-6">
                                  <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">O que dispara este fluxo?</Label>
                                    <div className="grid grid-cols-1 gap-2">
                                      <Button 
                                        variant={selectedNode.data.selectedAction === 'novo' ? 'default' : 'outline'}
                                        className="h-12 font-black uppercase tracking-widest text-[10px] justify-start px-4 gap-3"
                                        onClick={() => updateNodeData(selectedNode.id, { selectedAction: 'novo' })}
                                      >
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                          <UserPlus className="w-3 h-3" />
                                        </div>
                                        Novo Eleitor Cadastrado
                                      </Button>
                                      <Button 
                                        variant={selectedNode.data.selectedAction === 'atualizado' ? 'default' : 'outline'}
                                        className="h-12 font-black uppercase tracking-widest text-[10px] justify-start px-4 gap-3"
                                        onClick={() => updateNodeData(selectedNode.id, { selectedAction: 'atualizado' })}
                                      >
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                          <Edit3 className="w-3 h-3" />
                                        </div>
                                        Dados do Eleitor Atualizados
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Gatilho Demandas e Indicação */}
                              {(selectedNode.data.label === 'Demandas' || selectedNode.data.label === 'Indicação') && (
                                <div className="space-y-6">
                                  <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Ação de Gatilho</Label>
                                    <div className="grid grid-cols-1 gap-2">
                                      <Button 
                                        variant={selectedNode.data.selectedAction === 'nova' ? 'default' : 'outline'}
                                        className="h-12 font-black uppercase tracking-widest text-[10px] justify-start px-4 gap-3"
                                        onClick={() => updateNodeData(selectedNode.id, { selectedAction: 'nova' })}
                                      >
                                        <Plus className="w-4 h-4" />
                                        Nova {selectedNode.data.label}
                                      </Button>
                                      <Button 
                                        variant={selectedNode.data.selectedAction === 'status' ? 'default' : 'outline'}
                                        className="h-12 font-black uppercase tracking-widest text-[10px] justify-start px-4 gap-3"
                                        onClick={() => updateNodeData(selectedNode.id, { selectedAction: 'status' })}
                                      >
                                        <Zap className="w-4 h-4" />
                                        Status da {selectedNode.data.label} Atualizado
                                      </Button>
                                      {selectedNode.data.label === 'Demandas' && (
                                        <>
                                          <Button 
                                            variant={selectedNode.data.selectedAction === 'pendente_dias' ? 'default' : 'outline'}
                                            className="h-12 font-black uppercase tracking-widest text-[10px] justify-start px-4 gap-3"
                                            onClick={() => updateNodeData(selectedNode.id, { selectedAction: 'pendente_dias' })}
                                          >
                                            <Clock className="w-4 h-4" />
                                            Pendente por mais de X dias
                                          </Button>
                                          <Button 
                                            variant={selectedNode.data.selectedAction === 'sem_registro' ? 'default' : 'outline'}
                                            className="h-12 font-black uppercase tracking-widest text-[10px] justify-start px-4 gap-3"
                                            onClick={() => updateNodeData(selectedNode.id, { selectedAction: 'sem_registro' })}
                                          >
                                            <Calendar className="w-4 h-4" />
                                            Sem novos registros por X dias
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {selectedNode.data.selectedAction === 'status' && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Qual Status?</Label>
                                      <div className="grid grid-cols-2 gap-2">
                                        {selectedNode.data.label === 'Demandas' ? (
                                          ['pendente', 'em_andamento', 'atendido', 'cancelado'].map((st) => (
                                            <Button 
                                              key={st}
                                              variant={selectedNode.data.selectedStatus === st ? 'secondary' : 'outline'}
                                              className="h-10 font-bold uppercase text-[9px]"
                                              onClick={() => updateNodeData(selectedNode.id, { selectedStatus: st })}
                                            >
                                              {st.replace('_', ' ')}
                                            </Button>
                                          ))
                                        ) : (
                                          ['enviada', 'lida', 'aprovada', 'reprovada', 'atendido'].map((st) => (
                                            <Button 
                                              key={st}
                                              variant={selectedNode.data.selectedStatus === st ? 'secondary' : 'outline'}
                                              className="h-10 font-bold uppercase text-[9px]"
                                              onClick={() => updateNodeData(selectedNode.id, { selectedStatus: st })}
                                            >
                                              {st}
                                            </Button>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {(selectedNode.data.selectedAction === 'pendente_dias' || selectedNode.data.selectedAction === 'sem_registro') && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Quantidade de Dias</Label>
                                      <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-2xl border border-border/40">
                                        <Input 
                                          type="number" 
                                          value={selectedNode.data.days || 3} 
                                          onChange={(e) => updateNodeData(selectedNode.id, { days: parseInt(e.target.value) })}
                                          className="w-20 font-bold"
                                        />
                                        <span className="text-xs font-bold uppercase tracking-widest opacity-60">Dias consecutivos</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {selectedNode.data.label === 'Nota' && (
                                <div className="flex flex-col items-center justify-center pt-20 gap-4 opacity-40">
                                  <StickyNote className="w-12 h-12" />
                                  <p className="text-xs font-black uppercase tracking-[0.2em] text-center max-w-[200px]">
                                    Edite o conteúdo da nota diretamente no bloco do canvas.
                                  </p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        )}
                      </div>

                      <div className="p-6 bg-muted/5 border-t border-border/10 shrink-0">
                        <Button 
                          className="w-full h-12 font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20"
                          onClick={() => setSelectedNodeId(null)}
                        >
                          Salvar Configurações
                        </Button>
                      </div>
                    </>
                  )}
                </SheetContent>
              </Sheet>
            </>
          ) : (
            /* Logs Tab */
            <div className="flex-1 bg-background p-6 overflow-hidden flex flex-col">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-tighter font-outfit">Execuções da Automação</h2>
                  <p className="text-xs text-muted-foreground">Histórico recente de processamento</p>
                </div>
                <Button variant="outline" size="sm" onClick={loadLogs} className="h-8 text-[10px] font-bold uppercase tracking-widest">
                  Atualizar
                </Button>
              </div>

              <ScrollArea className="flex-1 rounded-xl border border-border/40 bg-muted/5 p-4">
                {logs.length > 0 ? (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3 border border-border/40 rounded-lg bg-background flex items-center gap-4 group hover:border-primary/20 transition-colors">
                        <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest">{log.status === 'success' ? 'Sucesso' : 'Falha'}</span>
                            <span className="text-[8px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-foreground/80 leading-snug">{log.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3 grayscale">
                    <Info className="h-10 w-10" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Nenhum log encontrado</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Test Modal */}
      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background dark:bg-zinc-950 border-border/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight font-outfit">Testar Fluxo WhatsApp</DialogTitle>
            <SheetDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Prepare os dados para simular o recebimento do fluxo.</SheetDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Número de WhatsApp (Simular Destino)</Label>
              <Input 
                placeholder="+55 11 99999-9999" 
                value={testData.number}
                onChange={(e) => setTestData({...testData, number: e.target.value})}
                className="font-bold bg-muted/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nome do Eleitor (Variável Nome)</Label>
              <Input 
                value={testData.name}
                onChange={(e) => setTestData({...testData, name: e.target.value})}
                className="font-bold bg-muted/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Vincular a uma Demanda (Dados Dinâmicos)</Label>
              <Select 
                value={testData.demandaId}
                onValueChange={(val) => setTestData({...testData, demandaId: val})}
              >
                <SelectTrigger className="font-bold bg-muted/20">
                  <SelectValue placeholder="Escolha uma demanda de exemplo" />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 border-border/40">
                  {demands.length > 0 ? (
                    demands.map(d => (
                      <SelectItem key={d.id} value={d.id} className="text-xs font-bold uppercase">{d.titulo}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled className="text-xs font-bold opacity-40">Nenhuma demanda encontrada</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-14 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
              onClick={() => {
                setIsTestModalOpen(false);
                toast({
                  title: "🚀 Teste Iniciado",
                  description: `Simulando envio para ${testData.number || 'número padrão'} com dados de "${testData.name}"`,
                });
              }}
            >
              Disparar Teste de Fluxo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
