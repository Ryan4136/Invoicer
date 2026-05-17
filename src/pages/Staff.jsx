import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, UserCheck, UserX, Clock, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function Staff() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    job_title: 'Waiter',
    hourly_rate: 15,
    assigned_outlets: [],
    is_active: true
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: outlets = [] } = useQuery({
    queryKey: ['outlets'],
    queryFn: () => base44.entities.Outlet.list(),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list('-shift_date', 100),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setShowDialog(false);
      setEditingStaff(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      job_title: 'Waiter',
      hourly_rate: 15,
      assigned_outlets: [],
      is_active: true
    });
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      full_name: staffMember.full_name,
      email: staffMember.email,
      phone: staffMember.phone || '',
      job_title: staffMember.job_title || 'Waiter',
      hourly_rate: staffMember.hourly_rate || 15,
      assigned_outlets: staffMember.assigned_outlets || [],
      is_active: staffMember.is_active !== false
    });
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (editingStaff) {
      updateUserMutation.mutate({ id: editingStaff.id, data: formData });
    }
  };

  const getStaffShifts = (email) => {
    return shifts.filter(s => s.employee_email === email);
  };

  const getTotalHours = (email) => {
    const staffShifts = getStaffShifts(email);
    return staffShifts.reduce((sum, s) => sum + (s.hours_worked || 0), 0);
  };

  const activeStaff = staff.filter(s => s.is_active !== false);
  const inactiveStaff = staff.filter(s => s.is_active === false);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-slate-600">Manage team members and track performance</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-slate-900">{activeStaff.length}</p>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Shifts (Period)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-blue-600">{shifts.length}</p>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-orange-600">
                {shifts.reduce((sum, s) => sum + (s.hours_worked || 0), 0).toFixed(1)}h
              </p>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Staff List */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Active Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeStaff.map(member => {
              const totalHours = getTotalHours(member.email);
              const estimatedEarnings = totalHours * (member.hourly_rate || 0);

              return (
                <div key={member.id} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {member.full_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900 text-lg">{member.full_name}</h3>
                          <Badge className="bg-blue-100 text-blue-700">
                            {member.job_title || 'Staff'}
                          </Badge>
                          {member.role === 'admin' && (
                            <Badge className="bg-purple-100 text-purple-700">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                          <p><span className="font-medium">Email:</span> {member.email}</p>
                          <p><span className="font-medium">Phone:</span> {member.phone || 'Not set'}</p>
                          <p><span className="font-medium">Hourly Rate:</span> ${member.hourly_rate?.toFixed(2) || '0.00'}/hr</p>
                          <p><span className="font-medium">Hours (Period):</span> {totalHours.toFixed(1)}h</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-green-600 font-medium">
                            Est. Earnings: ${estimatedEarnings.toFixed(2)}
                          </p>
                        </div>
                        {member.assigned_outlets && member.assigned_outlets.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {member.assigned_outlets.map((outletId, idx) => {
                              const outlet = outlets.find(o => o.id === outletId);
                              return outlet ? (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {outlet.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(member)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inactive Staff */}
      {inactiveStaff.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-slate-500" />
              Inactive Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactiveStaff.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{member.full_name}</p>
                    <p className="text-sm text-slate-600">{member.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(member)}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Select 
                  value={formData.job_title} 
                  onValueChange={(val) => setFormData({...formData, job_title: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                    <SelectItem value="Chef">Chef</SelectItem>
                    <SelectItem value="Waiter">Waiter</SelectItem>
                    <SelectItem value="Inventory Manager">Inventory Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hourly Rate ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(val) => setFormData({...formData, is_active: val})}
              />
              <Label>Active Employee</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => { setShowDialog(false); setEditingStaff(null); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                className="bg-gradient-to-r from-orange-500 to-amber-600"
              >
                Update Staff
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}