import { useState } from "react";
import { User, Mail, Phone, MapPin, Tag, Calendar, Camera, ArrowLeft, ArrowRight, Upload, Users, Briefcase, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRealEleitores } from "@/hooks/useRealEleitores";

interface EnhancedVoterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const availableTags = [
  "Liderança Comunitária",
  "Jovem",
  "Idoso",
  "Comerciante",
  "Professor",
  "Empresário",
  "Estudante",
  "Servidor Público",
  "Aposentado",
  "Influenciador",
  "Líder Religioso",
  "Artista",
  "Esportista"
];

export function EnhancedVoterModal({ open, onOpenChange }: EnhancedVoterModalProps) {
  const { toast } = useToast();
  const { createEleitor } = useRealEleitores();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    sex: "",
    profession: "",
    whatsapp: "",
    email: "",
    cep: "",
    address: "",
    neighborhood: "",
    socialMedia: "",
    socialMediaUsername: "",
    selectedTags: [] as string[],
    profilePhoto: null as File | null,
    isLeader: false,
    leaderType: "",
    leaderSubtype: "",
  });

  const fetchAddressByCep = async (cep: string) => {
    try {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: `${data.logradouro}, ${data.bairro}`,
            neighborhood: data.bairro
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build social media string
      const socialMediaString = formData.socialMedia && formData.socialMediaUsername
        ? `${formData.socialMedia}:${formData.socialMediaUsername}`
        : formData.socialMedia || null;

      let profilePhotoUrl = null;
      if (formData.profilePhoto) {
        // TODO: Upload photo to storage and get URL
        // For now, create a data URL
        profilePhotoUrl = URL.createObjectURL(formData.profilePhoto);
      }

      await createEleitor({
        name: formData.name,
        whatsapp: formData.whatsapp,
        email: formData.email || null,
        address: formData.address,
        neighborhood: formData.neighborhood,
        birth_date: formData.birthDate || null,
        social_media: socialMediaString,
        tags: formData.selectedTags,
        profile_photo_url: profilePhotoUrl,
        sex: formData.sex || null,
        profession: formData.profession || null,
        cep: formData.cep || null,
        is_leader: formData.isLeader,
        leader_type: formData.isLeader ? formData.leaderType : null,
        leader_subtype: formData.isLeader ? formData.leaderSubtype : null,
      });

      toast({
        title: "Eleitor cadastrado!",
        description: "O eleitor foi adicionado com sucesso ao sistema.",
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating eleitor:', error);
      toast({
        title: "Erro ao cadastrar eleitor",
        description: "Ocorreu um erro ao cadastrar o eleitor. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      name: "",
      birthDate: "",
      sex: "",
      profession: "",
      whatsapp: "",
      email: "",
      cep: "",
      address: "",
      neighborhood: "",
      socialMedia: "",
      socialMediaUsername: "",
      selectedTags: [],
      profilePhoto: null,
      isLeader: false,
      leaderType: "",
      leaderSubtype: "",
    });
  };

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return value.slice(0, 15);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 8) {
      return numbers.replace(/^(\d{5})(\d)/, "$1-$2");
    }
    return value.slice(0, 9);
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'whatsapp') {
      formattedValue = formatWhatsApp(value);
    } else if (field === 'cep') {
      formattedValue = formatCEP(value);
      const cleanCep = formattedValue.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        fetchAddressByCep(cleanCep);
      }
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name && formData.sex;
      case 2:
        return formData.whatsapp;
      case 3:
        return formData.address && formData.neighborhood;
      case 4:
        return true; // Leadership and tags are optional
      case 5:
        return true; // Review step
      default:
        return false;
    }
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  };

  const renderStep = () => {
    const stepTitles = [
      "Perfil Pessoal",
      "Contato e Social",
      "Endereço",
      "Classificação",
      "Revisão Final"
    ];

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center relative overflow-hidden ring-4 ring-primary/5 shadow-inner">
                {formData.profilePhoto ? (
                  <img
                    src={URL.createObjectURL(formData.profilePhoto)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-10 w-10 text-zinc-400" />
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px] font-bold"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Trocar Foto
                </Button>
                {formData.profilePhoto && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setFormData(prev => ({ ...prev, profilePhoto: null }))}
                  >
                    Remover
                  </Button>
                )}
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData(prev => ({ ...prev, profilePhoto: file }));
                  }
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nome Completo*</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Nome completo do eleitor"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange("birthDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Sexo*</Label>
                  <Select value={formData.sex} onValueChange={(value) => handleInputChange("sex", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="nao_binario">Não Binário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Profissão</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    value={formData.profession}
                    onChange={(e) => handleInputChange("profession", e.target.value)}
                    placeholder="Ocupação ou cargo"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-xs font-bold uppercase tracking-wider text-zinc-500 text-emerald-500">WhatsApp*</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-emerald-500/50" />
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="pl-10 border-emerald-100 dark:border-emerald-900/30 focus-visible:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-500">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="email@exemplo.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Redes Sociais</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['Instagram', 'Facebook', 'Twitter', 'LinkedIn'].map((platform) => (
                    <Button
                      key={platform}
                      type="button"
                      variant={formData.socialMedia.toLowerCase() === platform.toLowerCase() ? "default" : "outline"}
                      className="h-9 text-xs justify-start px-3"
                      onClick={() => handleInputChange("socialMedia", platform.toLowerCase())}
                    >
                      {platform}
                    </Button>
                  ))}
                </div>

                {formData.socialMedia && (
                  <div className="space-y-2 animate-in zoom-in-95 duration-200">
                    <Label className="text-[10px] font-bold text-zinc-400 uppercase">Username / Link</Label>
                    <Input
                      value={formData.socialMediaUsername}
                      onChange={(e) => handleInputChange("socialMediaUsername", e.target.value)}
                      placeholder={`@usuario no ${formData.socialMedia}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-2">
                  <Label htmlFor="cep" className="text-xs font-bold uppercase tracking-wider text-zinc-500">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleInputChange("cep", e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="neighborhood" className="text-xs font-bold uppercase tracking-wider text-zinc-500 text-blue-500">Bairro*</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange("neighborhood", e.target.value)}
                    placeholder="Nome do bairro"
                    className="border-blue-100 dark:border-blue-900/30"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-zinc-500 text-blue-500">Endereço Completo*</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-blue-500/50" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Rua, número, complemento..."
                    className="pl-10 border-blue-100 dark:border-blue-900/30 focus-visible:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4 pt-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">Liderança</p>
                      <p className="text-[10px] text-zinc-500">Este eleitor é um líder na comunidade?</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isLeader}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isLeader: e.target.checked,
                      leaderType: e.target.checked ? prev.leaderType : "",
                      leaderSubtype: e.target.checked ? prev.leaderSubtype : ""
                    }))}
                    className="h-4 w-4 accent-orange-500"
                  />
                </div>

                {formData.isLeader && (
                  <div className="space-y-3 p-3 pt-0 border-l-2 border-orange-500/20 ml-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-orange-500/70">Tipo</Label>
                      <Select value={formData.leaderType} onValueChange={(value) => setFormData(prev => ({ ...prev, leaderType: value, leaderSubtype: "" }))}>
                        <SelectTrigger className="h-8 text-xs border-orange-200/50 dark:border-orange-900/30">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="religiosa">Religiosa</SelectItem>
                          <SelectItem value="comunitaria">Comunitária/Social</SelectItem>
                          <SelectItem value="esporte_cultura">Esporte/Cultura</SelectItem>
                          <SelectItem value="digital">Digital</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.leaderType && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-orange-500/70">Subtipo</Label>
                        <Select value={formData.leaderSubtype} onValueChange={(value) => setFormData(prev => ({ ...prev, leaderSubtype: value }))}>
                          <SelectTrigger className="h-8 text-xs border-orange-200/50 dark:border-orange-900/30">
                            <SelectValue placeholder="Selecione o subtipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.leaderType === "religiosa" && (
                              <>
                                <SelectItem value="pastor_padre">Pastor / Padre / Líder religioso</SelectItem>
                                <SelectItem value="missionario_obreiro">Missionário / Obreiro / Diácono</SelectItem>
                                <SelectItem value="lider_jovem">Líder de grupo jovem ou ministério</SelectItem>
                              </>
                            )}
                            {formData.leaderType === "comunitaria" && (
                              <>
                                <SelectItem value="lider_comunitario">Líder comunitário</SelectItem>
                                <SelectItem value="presidente_associacao">Presidente de associação de moradores</SelectItem>
                                <SelectItem value="presidente_sindicato">Presidente de sindicato</SelectItem>
                                <SelectItem value="representante_ong">Representante de ONG</SelectItem>
                              </>
                            )}
                            {formData.leaderType === "digital" && (
                              <>
                                <SelectItem value="influenciador">Influenciador local</SelectItem>
                                <SelectItem value="admin_grupos">Admin de grupos WhatsApp</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5" />
                  Interesses e Tags
                </Label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={formData.selectedTags.includes(tag) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-[10px] py-0.5 h-6 transition-all",
                        formData.selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground border-transparent shadow-md"
                          : "bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 space-y-4 shadow-inner">
              <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm">
                  {formData.profilePhoto ? (
                    <img src={URL.createObjectURL(formData.profilePhoto)} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                      <User className="h-6 w-6 text-zinc-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">{formData.name}</h4>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{formData.whatsapp}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-y-3 text-[11px]">
                <div className="flex justify-between items-center group/item hover:bg-zinc-100 dark:hover:bg-zinc-800/50 p-1.5 rounded-lg transition-colors">
                  <span className="text-zinc-500 font-bold uppercase tracking-tighter">Bairro</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{formData.neighborhood || "---"}</span>
                </div>
                <div className="flex justify-between items-center group/item hover:bg-zinc-100 dark:hover:bg-zinc-800/50 p-1.5 rounded-lg transition-colors">
                  <span className="text-zinc-500 font-bold uppercase tracking-tighter">Endereço</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate max-w-[200px]">{formData.address || "---"}</span>
                </div>
                <div className="flex justify-between items-center group/item hover:bg-zinc-100 dark:hover:bg-zinc-800/50 p-1.5 rounded-lg transition-colors">
                  <span className="text-zinc-500 font-bold uppercase tracking-tighter">Liderança</span>
                  <span className={cn(
                    "font-bold uppercase tracking-widest",
                    formData.isLeader ? "text-orange-500" : "text-zinc-400"
                  )}>
                    {formData.isLeader ? "Ativo" : "Não"}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-zinc-500 font-bold uppercase tracking-tighter">Interesses</span>
                  <div className="flex flex-wrap gap-1">
                    {formData.selectedTags.length > 0 ? (
                      formData.selectedTags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9px] font-bold mr-1">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-400 italic">Nenhuma tag selecionada</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-tight">
                Tudo pronto para cadastrar. Verifique se os dados estão corretos antes de salvar no banco de dados do seu gabinete.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Cadastrar Novo Eleitor
          </DialogTitle>
          <DialogDescription>
            Etapa {currentStep} de {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-zinc-100/50 dark:bg-zinc-800/50 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-primary h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(var(--primary),0.4)]"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        <div className="min-h-[420px] flex flex-col justify-between">
          <div className="flex-1">
            {renderStep()}
          </div>

          <div className="flex justify-between items-center pt-8 mt-6 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="h-10 px-4 text-zinc-500 hover:text-zinc-900 transition-colors gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {currentStep === totalSteps ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="h-10 px-8 bg-black dark:bg-white dark:text-black font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Finalizar Cadastro"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="h-10 px-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-lg active:scale-95 transition-all gap-2"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}