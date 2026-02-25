import { AppLayout } from "@/components/layouts/AppLayout";

export default function Ideias() {
  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Ideias</h1>
        <div className="bg-muted/50 p-8 rounded-lg text-center">
          <p className="text-muted-foreground">
            Página de Ideias em desenvolvimento. 
            Aqui ficará a lista de ideias do gabinete e suas funcionalidades.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}