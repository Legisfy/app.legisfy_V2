import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentTab } from "./ContentTab";
import { AppearanceTab } from "./AppearanceTab";
import { FormTab } from "./FormTab";
import { PublishTab } from "./PublishTab";
import { FileText, Palette, MessageSquare, Globe } from "lucide-react";

interface EditorTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  formData: any;
  onFormChange: (field: string, value: any) => void;
  gabineteData: any;
  publicPage: any;
}

export const EditorTabs = ({ 
  activeTab, 
  onTabChange, 
  formData, 
  onFormChange, 
  gabineteData, 
  publicPage 
}: EditorTabsProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 p-1">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Conteúdo</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Formulário</span>
          </TabsTrigger>
          <TabsTrigger value="publish" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Publicação</span>
          </TabsTrigger>
        </TabsList>

        <div className="p-6">
          <TabsContent value="content" className="mt-0">
            <ContentTab 
              formData={formData}
              onFormChange={onFormChange}
              gabineteData={gabineteData}
            />
          </TabsContent>

          <TabsContent value="appearance" className="mt-0">
            <AppearanceTab 
              formData={formData}
              onFormChange={onFormChange}
            />
          </TabsContent>

          <TabsContent value="form" className="mt-0">
            <FormTab 
              formData={formData}
              onFormChange={onFormChange}
            />
          </TabsContent>

          <TabsContent value="publish" className="mt-0">
            <PublishTab 
              formData={formData}
              onFormChange={onFormChange}
              publicPage={publicPage}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};