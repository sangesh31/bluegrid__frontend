import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { fixUserProfiles, assignUserRole } from "@/utils/fixUserProfiles";
import { Users, RefreshCw } from "lucide-react";

const AdminProfileManager = () => {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"user" | "admin" | "plumber" | "water_worker">("user");
  const { toast } = useToast();

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading profiles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixProfiles = async () => {
    setLoading(true);
    try {
      const result = await fixUserProfiles();
      if (result.success) {
        toast({
          title: "Profiles fixed",
          description: `Created ${result.createdCount} new profiles`,
        });
        loadProfiles(); // Refresh the list
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Error fixing profiles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUserId) {
      toast({
        title: "No user selected",
        description: "Please select a user to assign a role",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await assignUserRole(selectedUserId, selectedRole);
      if (result.success) {
        toast({
          title: "Role assigned",
          description: `Successfully assigned ${selectedRole} role`,
        });
        loadProfiles(); // Refresh the list
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Error assigning role",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Profile Management
        </CardTitle>
        <CardDescription>
          Manage user profiles and assign roles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleFixProfiles} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Fix Missing Profiles
          </Button>
          <Button onClick={loadProfiles} variant="outline" disabled={loading}>
            Refresh Profile List
          </Button>
        </div>

        {profiles.length > 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Assign Role to User</h3>
              <div className="flex flex-wrap gap-2">
                <select 
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-xs"
                >
                  <option value="">Select a user</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name} ({profile.role})
                    </option>
                  ))}
                </select>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="plumber">Plumber</option>
                  <option value="water_worker">Water Worker</option>
                </select>
                <Button onClick={handleAssignRole} disabled={loading || !selectedUserId}>
                  Assign Role
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">User Profiles ({profiles.length})</h3>
              <div className="border rounded-md max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile) => (
                      <tr key={profile.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">{profile.full_name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            profile.role === 'admin' ? 'bg-red-100 text-red-800' :
                            profile.role === 'plumber' ? 'bg-blue-100 text-blue-800' :
                            profile.role === 'water_worker' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {profile.role}
                          </span>
                        </td>
                        <td className="p-3">{profile.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminProfileManager;