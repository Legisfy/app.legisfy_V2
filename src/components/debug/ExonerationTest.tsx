import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ExonerationTest: React.FC = () => {
  const { isExonerated, user, cabinet } = useAuthContext();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Estado de Exoneração - Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p><strong>Usuário logado:</strong> {user ? 'Sim' : 'Não'}</p>
          <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
          <p><strong>Pertence ao gabinete:</strong> {cabinet ? 'Sim' : 'Não'}</p>
          <p><strong>Nome do gabinete:</strong> {cabinet?.cabinet_name || 'N/A'}</p>
          <p><strong>Cargo:</strong> {cabinet?.user_role || 'N/A'}</p>
          <p><strong>Foi exonerado:</strong> {isExonerated ? 'SIM' : 'Não'}</p>
        </div>
        
        {isExonerated && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive font-semibold">
              ⚠️ Este usuário foi exonerado e deveria ver o popup!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};