import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createMissingProfiles } from "@/utils/fixDatabaseTriggers";

const AuthDebugger = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error checking user:", error);
      }
    };

    checkUser();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    try {
      // Test connection to Supabase
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      
      setDebugInfo(prev => ({
        ...prev,
        connectionTest: { data, error: error?.message || null }
      }));

      if (error) {
        toast({
          title: "Connection test failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection successful",
          description: "Successfully connected to Supabase",
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection test error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      setDebugInfo(prev => ({
        ...prev,
        authTest: { user, error: error?.message || null }
      }));

      if (error) {
        toast({
          title: "Auth test failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (user) {
        setUser(user);
        toast({
          title: "Auth test successful",
          description: `Logged in as ${user.email}`,
        });
      } else {
        toast({
          title: "Not logged in",
          description: "No active session found",
        });
      }
    } catch (error: any) {
      toast({
        title: "Auth test error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fixProfiles = async () => {
    setLoading(true);
    try {
      const result = await createMissingProfiles();
      
      setDebugInfo(prev => ({
        ...prev,
        profileFix: result
      }));

      if (result.success) {
        toast({
          title: "Profile fix completed",
          description: result.message,
        });
      } else {
        toast({
          title: "Profile fix failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Profile fix error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Auth Debugger</CardTitle>
        <CardDescription>Debug and fix authentication issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Current Status</h3>
          {user ? (
            <div className="p-3 bg-green-50 rounded-md">
              <p className="font-medium">Logged in as: {user.email}</p>
              <p className="text-sm text-muted-foreground">User ID: {user.id}</p>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 rounded-md">
              <p>Not logged in</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={testConnection} disabled={loading}>
            {loading ? "Testing..." : "Test Connection"}
          </Button>
          <Button onClick={testAuth} disabled={loading}>
            {loading ? "Testing..." : "Test Auth"}
          </Button>
          <Button onClick={fixProfiles} disabled={loading} variant="secondary">
            {loading ? "Fixing..." : "Fix Missing Profiles"}
          </Button>
          <Button onClick={logout} disabled={loading} variant="outline">
            Logout
          </Button>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Debug Information</h3>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-60">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthDebugger;