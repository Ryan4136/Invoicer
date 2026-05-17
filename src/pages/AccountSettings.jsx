import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Shield,
  Save,
  CheckCircle,
  LogOut,
  Key
} from 'lucide-react';

export default function AccountSettings() {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    full_name: ''
  });

  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userRole } = useQuery({
    queryKey: ['userRole', user?.email],
    queryFn: () => base44.entities.UserRole.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || ''
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

const handleLogout = async () => {
  if (!confirm('Are you sure you want to logout?')) return;

  await fetch("http://localhost:8000/api/logout.php", {
    credentials: "include"
  });

  queryClient.clear();
  window.location.href = "/login";
};

  const role = userRole?.[0];
  const getRoleLabel = (roleKey) => {
    const labels = {
      admin: 'Administrator',
      accountant: 'Accountant',
      store_manager: 'Store Manager',
      counter_operator: 'Counter Operator',
      auditor: 'Auditor'
    };
    return labels[roleKey] || roleKey || 'User';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Account Settings</h1>
          <p className="text-gray-500 mt-1">Manage your personal account information</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Saved!</span>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0F1724]">{user?.full_name || 'User'}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-emerald-100 text-emerald-700">{getRoleLabel(role?.role || user?.role)}</Badge>
                {role?.is_active !== false && <Badge variant="secondary">Active</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Your full name"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="mt-1.5 bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-green-600" disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Permissions */}
      {role?.permissions && (
        <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              Your Permissions
            </CardTitle>
            <CardDescription>What you can access in this application</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(role.permissions).map(([key, value]) => (
                <div key={key} className={`flex items-center gap-2 p-3 rounded-lg ${value ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                  <div className={`w-2 h-2 rounded-full ${value ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <span className={`text-sm capitalize ${value ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {key.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#0F1724]">Sign Out</h3>
              <p className="text-sm text-gray-500">Log out of your account on this device</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}