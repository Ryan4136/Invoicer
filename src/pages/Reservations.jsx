import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, Users, Phone, Mail, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function Reservations() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    party_size: 2,
    reservation_date: format(new Date(), 'yyyy-MM-dd'),
    reservation_time: '19:00',
    special_requests: '',
    status: 'confirmed'
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list('-reservation_date'),
  });

  const { data: outlets = [] } = useQuery({
    queryKey: ['outlets'],
    queryFn: () => base44.entities.Outlet.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Reservation.create({
      ...data,
      outlet_id: outlets[0]?.id || 'default'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => {
      const reservation = reservations.find(r => r.id === id);
      return base44.entities.Reservation.update(id, { ...reservation, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      party_size: 2,
      reservation_date: format(new Date(), 'yyyy-MM-dd'),
      reservation_time: '19:00',
      special_requests: '',
      status: 'confirmed'
    });
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
      seated: 'bg-green-100 text-green-700 border-green-200',
      completed: 'bg-slate-100 text-slate-700 border-slate-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      no_show: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[status] || colors.confirmed;
  };

  const todayReservations = reservations.filter(r => {
    const resDate = new Date(r.reservation_date);
    const today = new Date();
    return resDate.toDateString() === today.toDateString();
  });

  const upcomingReservations = reservations.filter(r => {
    const resDate = new Date(r.reservation_date);
    return resDate >= new Date() && r.status === 'confirmed';
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reservations</h1>
          <p className="text-slate-600">Manage table bookings and guest reservations</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setShowDialog(true); }}
          className="bg-gradient-to-r from-orange-500 to-amber-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Reservation
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{reservations.length}</p>
            <p className="text-sm text-slate-500 mt-1">{upcomingReservations.length} upcoming</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Today's Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{todayReservations.length}</p>
            <p className="text-sm text-slate-500 mt-1">
              {todayReservations.reduce((sum, r) => sum + (r.party_size || 0), 0)} guests
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {reservations.filter(r => r.status === 'confirmed').length}
            </p>
            <p className="text-sm text-slate-500 mt-1">Awaiting arrival</p>
          </CardContent>
        </Card>
      </div>

      {/* Reservations List */}
      <div className="space-y-4">
        {reservations.map(reservation => (
          <Card key={reservation.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex flex-col items-center justify-center text-white">
                    <p className="text-2xl font-bold">{format(new Date(reservation.reservation_date), 'd')}</p>
                    <p className="text-xs">{format(new Date(reservation.reservation_date), 'MMM')}</p>
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-lg">
                        {reservation.customer_name}
                      </h3>
                      <Badge className={getStatusColor(reservation.status)}>
                        {reservation.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{reservation.party_size} guests</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{reservation.reservation_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{reservation.customer_phone}</span>
                      </div>
                      {reservation.customer_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{reservation.customer_email}</span>
                        </div>
                      )}
                    </div>
                    {reservation.special_requests && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <span className="font-medium">Special Request:</span> {reservation.special_requests}
                        </p>
                      </div>
                    )}
                    {reservation.table_number && (
                      <Badge variant="outline">
                        Table {reservation.table_number}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex md:flex-col gap-2">
                  {reservation.status === 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'seated' })}
                      >
                        Mark Seated
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'cancelled' })}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {reservation.status === 'seated' && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => updateStatusMutation.mutate({ id: reservation.id, status: 'completed' })}
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reservations.length === 0 && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No reservations yet</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Reservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email (Optional)</Label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Party Size *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.party_size}
                  onChange={(e) => setFormData({...formData, party_size: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.reservation_date}
                  onChange={(e) => setFormData({...formData, reservation_date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input
                  type="time"
                  value={formData.reservation_time}
                  onChange={(e) => setFormData({...formData, reservation_time: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Special Requests</Label>
              <Textarea
                value={formData.special_requests}
                onChange={(e) => setFormData({...formData, special_requests: e.target.value})}
                placeholder="Any special requirements or dietary restrictions..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                className="bg-gradient-to-r from-orange-500 to-amber-600"
                disabled={!formData.customer_name || !formData.customer_phone}
              >
                Create Reservation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}