import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Store, Mail, Phone, MapPin, Save, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [userForm, setUserForm] = useState({});
  const [outletForm, setOutletForm] = useState({});

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: outlets = [] } = useQuery({
    queryKey: ['outlets'],
    queryFn: () => base44.entities.Outlet.list(),
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setEditingUser(false);
    },
  });

  const updateOutletMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Outlet.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      setEditingOutlet(null);
    },
  });

  const handleEditUser = () => {
    setUserForm({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      bio: user?.bio || ''
    });
    setEditingUser(true);
  };

  const handleSaveUser = () => {
    updateUserMutation.mutate(userForm);
  };

  const handleEditOutlet = (outlet) => {
    setOutletForm(outlet);
    setEditingOutlet(outlet.id);
  };

  const handleSaveOutlet = () => {
    updateOutletMutation.mutate({ id: editingOutlet, data: outletForm });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile Settings</h1>
        <p className="text-slate-600">Manage your personal and restaurant information</p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="restaurant">Restaurant Profile</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Personal Information</CardTitle>
              {!editingUser && (
                <Button variant="outline" onClick={handleEditUser}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {user?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  {editingUser ? (
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={userForm.full_name}
                        onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{user?.full_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-orange-100 text-orange-700 border-0 capitalize">
                          {user?.role}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input value={user?.email || ''} disabled className="bg-slate-50" />
                  <p className="text-xs text-slate-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </Label>
                  {editingUser ? (
                    <Input
                      value={userForm.phone}
                      onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <Input value={user?.phone || 'Not provided'} disabled className="bg-slate-50" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                {editingUser ? (
                  <Textarea
                    value={userForm.bio}
                    onChange={(e) => setUserForm({...userForm, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                ) : (
                  <p className="text-slate-600 p-3 bg-slate-50 rounded-lg min-h-[100px]">
                    {user?.bio || 'No bio provided'}
                  </p>
                )}
              </div>

              {editingUser && (
                <div className="flex gap-3">
                  <Button onClick={handleSaveUser} className="bg-gradient-to-r from-orange-500 to-amber-600">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditingUser(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restaurant Profile */}
        <TabsContent value="restaurant">
          <div className="space-y-6">
            {outlets.map(outlet => (
              <Card key={outlet.id} className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>{outlet.name}</CardTitle>
                      <Badge variant={outlet.is_active ? "default" : "secondary"} className="mt-1">
                        {outlet.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  {editingOutlet !== outlet.id && (
                    <Button variant="outline" onClick={() => handleEditOutlet(outlet)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingOutlet === outlet.id ? (
                    <>
                      <div className="space-y-2">
                        <Label>Restaurant Name</Label>
                        <Input
                          value={outletForm.name}
                          onChange={(e) => setOutletForm({...outletForm, name: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Address
                        </Label>
                        <Textarea
                          value={outletForm.address}
                          onChange={(e) => setOutletForm({...outletForm, address: e.target.value})}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone
                          </Label>
                          <Input
                            value={outletForm.phone}
                            onChange={(e) => setOutletForm({...outletForm, phone: e.target.value})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tax Rate (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={outletForm.tax_rate}
                            onChange={(e) => setOutletForm({...outletForm, tax_rate: parseFloat(e.target.value)})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>GSTIN Number</Label>
                          <Input
                            value={outletForm.gstin}
                            onChange={(e) => setOutletForm({...outletForm, gstin: e.target.value})}
                            placeholder="e.g., 22AAAAA0000A1Z5"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>FSSAI License</Label>
                          <Input
                            value={outletForm.fssai}
                            onChange={(e) => setOutletForm({...outletForm, fssai: e.target.value})}
                            placeholder="e.g., 12345678901234"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Input
                          value={outletForm.timezone}
                          onChange={(e) => setOutletForm({...outletForm, timezone: e.target.value})}
                          placeholder="e.g., America/New_York"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={handleSaveOutlet} className="bg-gradient-to-r from-orange-500 to-amber-600">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setEditingOutlet(null)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="flex items-center gap-2 text-slate-600 mb-2">
                            <MapPin className="w-4 h-4" />
                            Address
                          </Label>
                          <p className="text-slate-900">{outlet.address || 'Not provided'}</p>
                        </div>

                        <div>
                          <Label className="flex items-center gap-2 text-slate-600 mb-2">
                            <Phone className="w-4 h-4" />
                            Phone
                          </Label>
                          <p className="text-slate-900">{outlet.phone || 'Not provided'}</p>
                        </div>

                        <div>
                          <Label className="text-slate-600 mb-2">Tax Rate</Label>
                          <p className="text-slate-900">{outlet.tax_rate || 0}%</p>
                        </div>

                        <div>
                          <Label className="text-slate-600 mb-2">Timezone</Label>
                          <p className="text-slate-900">{outlet.timezone || 'UTC'}</p>
                        </div>

                        <div>
                          <Label className="text-slate-600 mb-2">GSTIN Number</Label>
                          <p className="text-slate-900">{outlet.gstin || 'Not provided'}</p>
                        </div>

                        <div>
                          <Label className="text-slate-600 mb-2">FSSAI License</Label>
                          <p className="text-slate-900">{outlet.fssai || 'Not provided'}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}