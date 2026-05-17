import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DataTable from '@/components/ui/DataTable';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';
import { format } from 'date-fns';

const ROLES = {
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700', permissions: { sales: true, purchase: true, inventory: true, customers: true, payments: true, reports: true, settings: true, users: true, delete_records: true, export_data: true } },
  accountant: { label: 'Accountant', color: 'bg-purple-100 text-purple-700', permissions: { sales: true, purchase: true, inventory: false, customers: true, payments: true, reports: true, settings: false, users: false, delete_records: false, export_data: true } },
  store_manager: { label: 'Store Manager', color: 'bg-blue-100 text-blue-700', permissions: { sales: true, purchase: true, inventory: true, customers: true, payments: false, reports: true, settings: false, users: false, delete_records: false, export_data: true } },
  counter_operator: { label: 'Counter Operator', color: 'bg-green-100 text-green-700', permissions: { sales: true, purchase: false, inventory: false, customers: true, payments: false, reports: false, settings: false, users: false, delete_records: false, export_data: false } },
  auditor: { label: 'Auditor', color: 'bg-amber-100 text-amber-700', permissions: { sales: false, purchase: false, inventory: false, customers: false, payments: false, reports: true, settings: false, users: false, delete_records: false, export_data: true } },
};

const PERMISSION_LABELS = {
  sales: 'Sales & Invoicing',
  purchase: 'Purchase',
  inventory: 'Inventory Management',
  customers: 'Customers & Suppliers',
  payments: 'Payments & Receipts',
  reports: 'Reports',
  settings: 'Company Settings',
  users: 'User Management',
  delete_records: 'Delete Records',
  export_data: 'Export Data'
};

export default function UserManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    user_email: '',
    role: 'counter_operator',
    permissions: ROLES.counter_operator.permissions,
    is_active: true
  });

  const queryClient = useQueryClient();

const { data: userRoles = [], isLoading } = useQuery({
  queryKey: ['userRoles'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/company_users/list.php');
    return res.json();
  }
});

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
  });

const createMutation = useMutation({
  mutationFn: async (data) => {
    await fetch('http://localhost:8000/api/company_users/create.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['userRoles']);
    resetForm();
  },
});

const updateMutation = useMutation({
  mutationFn: async ({ id, data }) => {
    await fetch('http://localhost:8000/api/company_users/update.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['userRoles']);
    resetForm();
  },
});

const deleteMutation = useMutation({
  mutationFn: async (id) => {
    await fetch(`http://localhost:8000/api/company_users/delete.php?id=${id}`);
  },
  onSuccess: () =>
    queryClient.invalidateQueries(['userRoles']),
});

  const resetForm = () => {
    setFormData({
      user_email: '',
      role: 'counter_operator',
      permissions: ROLES.counter_operator.permissions,
      is_active: true
    });
    setEditingRole(null);
    setShowForm(false);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      user_email: role.user_email,
      role: role.role,
      permissions: role.permissions || ROLES[role.role]?.permissions || {},
      is_active: role.is_active !== false
    });
    setShowForm(true);
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({
      ...prev,
      role,
      permissions: { ...ROLES[role].permissions }
    }));
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      company_id: companies[0]?.id || ''
    };

    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

const filteredRoles = userRoles.filter(r => {
  const email = r.user_email || r.username || '';
  const role = r.role || '';

  return (
    email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.toLowerCase().includes(searchQuery.toLowerCase())
  );
});

  const columns = [
    {
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-semibold">
            {(row.user_email || row.email || row.name)?.charAt(0).toUpperCase()}
          </div>  
          <div>
            <p className="font-medium text-[#0F1724]">
  {row.user_email || row.email || row.name}
</p>
            <p className="text-xs text-gray-400">Added {format(new Date(row.created_date), 'dd MMM yyyy')}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      render: (row) => (
        <Badge className={ROLES[row.role]?.color || 'bg-gray-100 text-gray-700'}>
          {ROLES[row.role]?.label || row.role}
        </Badge>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant="secondary" className={row.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
          {row.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Permissions',
      render: (row) => {
        const perms = row.permissions || {};
        const activeCount = Object.values(perms).filter(Boolean).length;
        return <span className="text-sm text-gray-500">{activeCount} permissions</span>;
      }
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => handleEdit(row)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => deleteMutation.mutate(row.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">User Management</h1>
          <p className="text-gray-500 mt-1">Manage user roles and permissions</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Add User Role
        </Button>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(ROLES).map(([key, value]) => {
          const count = userRoles.filter(r => r.role === key).length;
          return (
            <Card key={key} className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-2xl font-bold text-[#0F1724]">{count}</p>
                <p className="text-xs text-gray-500">{value.label}s</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            User Roles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <DataTable
            columns={columns}
            data={filteredRoles}
            isLoading={isLoading}
            searchable={true}
            searchPlaceholder="Search users..."
            searchValue={searchQuery}
            onSearch={setSearchQuery}
            emptyMessage="No user roles found"
          />
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit User Role' : 'Add User Role'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>User Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="mt-1.5"
                  disabled={!!editingRole}
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active User</Label>
            </div>

            <div>
              <Label className="text-base font-semibold">Permissions</Label>
              <p className="text-sm text-gray-500 mb-4">Customize what this user can access</p>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">{label}</span>
                    <Switch
                      checked={formData.permissions[key] || false}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, [key]: checked }
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} className="bg-gradient-to-r from-emerald-500 to-green-600">
                {editingRole ? 'Update Role' : 'Add Role'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
