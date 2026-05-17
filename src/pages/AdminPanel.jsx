import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Users, Store, Package, Settings, 
  Database, Activity, Plus, Edit, Trash2 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showOutletDialog, setShowOutletDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: outlets = [] } = useQuery({
    queryKey: ['outlets'],
    queryFn: () => base44.entities.Outlet.list(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 100),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setShowUserDialog(false);
      setEditingItem(null);
    },
  });

  const createOutletMutation = useMutation({
    mutationFn: (data) => base44.entities.Outlet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      setShowOutletDialog(false);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.Category.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowCategoryDialog(false);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Category.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowCategoryDialog(false);
      setEditingItem(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const [userForm, setUserForm] = useState({});
  const [outletForm, setOutletForm] = useState({ name: '', address: '', phone: '', tax_rate: 0 });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', color: '#f97316', is_active: true });

  const handleEditUser = (user) => {
    setEditingItem(user);
    setUserForm(user);
    setShowUserDialog(true);
  };

  const handleEditCategory = (category) => {
    setEditingItem(category);
    setCategoryForm(category);
    setShowCategoryDialog(true);
  };

  const handleSaveUser = () => {
    updateUserMutation.mutate({ id: editingItem.id, data: userForm });
  };

  const handleSaveOutlet = () => {
    createOutletMutation.mutate(outletForm);
  };

  const handleSaveCategory = () => {
    if (editingItem) {
      updateCategoryMutation.mutate({ id: editingItem.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  // System stats
  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0);
  const activeUsers = users.filter(u => u.role).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-600">System management and configuration</p>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-slate-900">{users.length}</p>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">{activeUsers} active</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Outlets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-slate-900">{outlets.length}</p>
              <Store className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-slate-900">{categories.length}</p>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="outlets">Outlets</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Users Management */}
        <TabsContent value="users">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.full_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{user.full_name}</p>
                        <p className="text-sm text-slate-600">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-orange-100 text-orange-700 border-0 capitalize">
                        {user.role}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outlets Management */}
        <TabsContent value="outlets">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Outlet Management</CardTitle>
              <Button onClick={() => { setShowOutletDialog(true); setOutletForm({ name: '', address: '', phone: '', tax_rate: 0 }); }} className="bg-gradient-to-r from-orange-500 to-amber-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Outlet
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {outlets.map(outlet => (
                  <div key={outlet.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Store className="w-5 h-5 text-orange-600" />
                        <div>
                          <p className="font-semibold text-slate-900">{outlet.name}</p>
                          <p className="text-sm text-slate-600">{outlet.address}</p>
                          <p className="text-xs text-slate-500 mt-1">Tax: {outlet.tax_rate}% • {outlet.phone}</p>
                        </div>
                      </div>
                      <Badge variant={outlet.is_active ? "default" : "secondary"}>
                        {outlet.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Management */}
        <TabsContent value="categories">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Category Management</CardTitle>
              <Button onClick={() => { setEditingItem(null); setCategoryForm({ name: '', description: '', color: '#f97316', is_active: true }); setShowCategoryDialog(true); }} className="bg-gradient-to-r from-orange-500 to-amber-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(category => (
                  <div key={category.id} className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: category.color }}>
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{category.name}</p>
                        <p className="text-xs text-slate-600">{category.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditCategory(category)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteCategoryMutation.mutate(category.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label className="text-slate-600">Database Status</Label>
                  <p className="text-lg font-semibold text-green-600">Connected</p>
                </div>
                <div>
                  <Label className="text-slate-600">Total Orders</Label>
                  <p className="text-lg font-semibold text-slate-900">{orders.length}</p>
                </div>
                <div>
                  <Label className="text-slate-600">Paid Orders</Label>
                  <p className="text-lg font-semibold text-slate-900">{orders.filter(o => o.payment_status === 'paid').length}</p>
                </div>
                <div>
                  <Label className="text-slate-600">Active Orders</Label>
                  <p className="text-lg font-semibold text-slate-900">{orders.filter(o => ['pending', 'preparing'].includes(o.status)).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={userForm.full_name} onChange={(e) => setUserForm({...userForm, full_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={userForm.role} onValueChange={(val) => setUserForm({...userForm, role: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveUser} className="bg-gradient-to-r from-orange-500 to-amber-600">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Outlet Dialog */}
      <Dialog open={showOutletDialog} onOpenChange={setShowOutletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Outlet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Outlet Name</Label>
              <Input value={outletForm.name} onChange={(e) => setOutletForm({...outletForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={outletForm.address} onChange={(e) => setOutletForm({...outletForm, address: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={outletForm.phone} onChange={(e) => setOutletForm({...outletForm, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input type="number" step="0.01" value={outletForm.tax_rate} onChange={(e) => setOutletForm({...outletForm, tax_rate: parseFloat(e.target.value)})} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowOutletDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveOutlet} className="bg-gradient-to-r from-orange-500 to-amber-600">Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Add'} Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={categoryForm.description} onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input type="color" value={categoryForm.color} onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveCategory} className="bg-gradient-to-r from-orange-500 to-amber-600">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}