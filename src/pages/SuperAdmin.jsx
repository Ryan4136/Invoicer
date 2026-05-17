import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Shield, ShieldCheck, ShieldAlert, UserPlus, Search,
  Crown, Mail, Calendar, Edit2, RefreshCw, Key
} from 'lucide-react';
import { format } from 'date-fns';

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    description: 'Full access to all features'
  },
  user: {
    label: 'User',
    icon: Shield,
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
    description: 'Standard access'
  }
};

export default function SuperAdmin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [newRole, setNewRole] = useState('user');
  const [inviteStatus, setInviteStatus] = useState(null); // 'success' | 'error' | null
  const [inviteMessage, setInviteMessage] = useState('');

  const queryClient = useQueryClient();

const currentUser = { role: 'superadmin', email: 'admin@test.com' };

const API_BASE = 'http://localhost:8000/api';

const { data: users = [], isLoading, refetch } = useQuery({
  queryKey: ['allUsers'],
  queryFn: async () => {
    const res = await fetch(`${API_BASE}/users/list.php`);
    return res.json();
  },
});

const updateUserMutation = useMutation({
  mutationFn: async ({ id, data }) => {
    await fetch(`${API_BASE}/users/update.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['allUsers']);
    setShowRoleDialog(false);
    setSelectedUser(null);
  },
});
const handleInvite = async () => {
  if (!inviteEmail) return;

  try {
    await fetch(`${API_BASE}/users/create.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: inviteEmail,
        role: inviteRole,
        is_active: true,
        permissions: {},
        company_id: 1
      }),
    });

    setInviteStatus('success');
    setInviteMessage(`User created: ${inviteEmail}`);
    setInviteEmail('');
    queryClient.invalidateQueries(['allUsers']);
  } catch (err) {
    setInviteStatus('error');
    setInviteMessage('Failed to create user');
  }
};
const [editForm, setEditForm] = useState({
  username: '',
  email: '',
  password: '',
  role: 'user'
});
 const openRoleDialog = (user) => {
  setSelectedUser(user);
  setNewRole(user.role || 'user');

  setEditForm({
    username: user.username || '',
    email: user.email || '',
    password: '', // never prefill
    role: user.role || 'user'
  });

  setShowRoleDialog(true);
};


const filteredUsers = users.filter(u =>
  !searchQuery ||
  u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  u.role?.toLowerCase().includes(searchQuery.toLowerCase())
);

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role !== 'admin').length;

const getUserInitials = (user) => {
  if (user.username) return user.username.charAt(0).toUpperCase();
  return user.email?.charAt(0).toUpperCase() || '?';
};

  const getAvatarGradient = (role) => {
    return role === 'admin'
      ? 'from-red-500 to-orange-500'
      : 'from-blue-500 to-indigo-600';
  };
  const handleUpdateUser = () => {
  if (!selectedUser) return;

  updateUserMutation.mutate({
    id: selectedUser.id,
    data: {
      username: editForm.username,
      email: editForm.email,
      role: editForm.role,
      password: editForm.password
    }
  });
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Super Admin</h1>
            <p className="text-gray-500 text-sm mt-0.5">Platform-level user control & access management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} className="border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => { setInviteStatus(null); setShowInviteDialog(true); }} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, icon: Users, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
          { label: 'Admins', value: adminCount, icon: ShieldCheck, color: 'from-red-500 to-orange-500', bg: 'bg-red-50' },
          { label: 'Regular Users', value: userCount, icon: Shield, color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50' },
          { label: 'Logged In As', value: currentUser?.role || '—', icon: Crown, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', isText: true },
        ].map(({ label, value, icon: Icon, color, bg, isText }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${bg}`}>
                  <Icon className={`w-5 h-5 bg-gradient-to-br ${color} bg-clip-text`} style={{ color: 'inherit' }} />
                </div>
                <div>
                  <p className={`font-bold text-[#0F1724] ${isText ? 'text-base capitalize' : 'text-2xl'}`}>{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader className="border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" />
              All Platform Users
            </CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#F7F9FA] border-0"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredUsers.map((user) => {
                const roleConfig = ROLE_CONFIG[user.role] || ROLE_CONFIG.user;
                const RoleIcon = roleConfig.icon;
                const isCurrentUser = user.email === currentUser?.email;

                return (
                  <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarGradient(user.role)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {getUserInitials(user)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-[#0F1724] truncate">{user.username || user.email || 'No Name'}</p>
                        {isCurrentUser && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </span>
                        {user.created_date && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            Joined {format(new Date(user.created_date), 'dd MMM yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role Badge */}
                    <Badge className={`${roleConfig.badgeClass} border flex items-center gap-1.5`}>
                      <RoleIcon className="w-3 h-3" />
                      {roleConfig.label}
                    </Badge>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRoleDialog(user)}
                        className="h-8 px-2 text-gray-400 hover:text-blue-600"
                        title="Change Role"
                      >
                        <Key className="w-4 h-4" />
                        <span className="ml-1 text-xs hidden md:inline">Change Role</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-red-500" />
              Invite New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="mt-1.5"
                autoFocus
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      User — Standard access
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-red-500" />
                      Admin — Full access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inviteStatus === 'success' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                ✓ {inviteMessage}
              </div>
            )}
            {inviteStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                ✗ {inviteMessage}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-500" />
              Edit User
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">

  {/* Username */}
  <div>
    <Label>Username</Label>
    <Input
      value={editForm.username}
      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
    />
  </div>

  {/* Email */}
  <div>
    <Label>Email</Label>
    <Input
      value={editForm.email}
      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
    />
  </div>

  {/* Password */}
  <div>
    <Label>New Password</Label>
    <Input
      type="password"
      placeholder="Leave blank to keep old password"
      value={editForm.password}
      onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
    />
  </div>

  {/* Role */}
  <div>
    <Label>Role</Label>
    <Select value={editForm.role} onValueChange={(val) => setEditForm(prev => ({ ...prev, role: val }))}>
      <SelectTrigger className="mt-1.5">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">User</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  </div>


              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleUpdateUser}
                  disabled={updateUserMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600"
                >
                  {updateUserMutation.isPending ? 'Saving...' : 'Update Role'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}