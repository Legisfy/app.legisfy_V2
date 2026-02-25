import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, User, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface ProfilePhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProfilePhotoUploadModal = ({ isOpen, onClose, onSuccess }: ProfilePhotoUploadModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const { profile } = useCurrentUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError("Por favor, selecione uma imagem (JPEG, PNG ou WebP)");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError("A imagem deve ter no máximo 2MB");
        return;
      }

      setSelectedFile(file);
      setError('');
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedFile || !profile?.user_id) return;
    
    setLoading(true);
    setError('');

    try {
      // Upload da imagem para o storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${profile.user_id}/avatar/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Obter URL público
      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar perfil do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl.publicUrl })
        .eq('user_id', profile.user_id);

      if (updateError) throw updateError;

      toast({
        title: "Foto atualizada com sucesso!",
        description: "Sua foto de perfil foi atualizada."
      });

      onSuccess();
      onClose();
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl('');
      
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      setError(`Erro ao fazer upload: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Atualizar Foto do Perfil
          </DialogTitle>
          <DialogDescription>
            Escolha uma nova foto para seu perfil. Recomendamos uma imagem quadrada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="photo">Foto do Perfil</Label>
            
            {/* Preview da imagem */}
            {previewUrl && (
              <div className="flex justify-center">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-full border-4 border-muted"
                />
              </div>
            )}
            
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Clique para fazer upload</span>
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG ou WebP (MAX. 2MB)</p>
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                />
              </label>
            </div>
            
            {selectedFile && (
              <p className="text-sm text-green-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Arquivo selecionado: {selectedFile.name}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={uploadPhoto}
              className="flex-1"
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Atualizar Foto
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};