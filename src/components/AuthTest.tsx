import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const AuthTest = () => {
  const [status, setStatus] = useState("Testing Supabase connection...");

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic supabase connection
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setStatus(`Auth error: ${error.message}`);
        } else {
          setStatus("Supabase connection working. Current session: " + (data.session ? "authenticated" : "not authenticated"));
        }
      } catch (error: any) {
        setStatus(`Connection failed: ${error.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-medium text-blue-900 mb-2">Auth Connection Test</h3>
      <p className="text-blue-800">{status}</p>
    </div>
  );
};