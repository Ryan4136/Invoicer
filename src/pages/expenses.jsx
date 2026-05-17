import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Receipt as ReceiptIcon, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function Expenses() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    category: 'miscellaneous',
    description: '',
    amount: 0,
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    vendor: '',
    status: 'pending'
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-expense_date'),
  });

  const { data: outlets = [] } = useQuery({
    queryKey: ['outlets'],
    queryFn: () => base44.entities.Outlet.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create({
      ...data,
      outlet_id: outlets[0]?.id || 'default'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => {
      const expense = expenses.find(e => e.id === id);
      return base44.entities.Expense.update(id, { ...expense, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const resetForm = () => {
    setFormData({
      category: 'miscellaneous',
      description: '',
      amount: 0,
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      vendor: '',
      status: 'pending'
    });
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700'
    };
    return colors[status] || colors.pending;
  };

  const getCategoryColor = (category) => {
    const colors = {
      utilities: 'bg-blue-100 text-blue-700',
      rent: 'bg-purple-100 text-purple-700',
      repairs: 'bg-red-100 text-red-700',
      marketing: 'bg-pink-100 text-pink-700',
      insurance: 'bg-indigo-100 text-indigo-700',
      licenses: 'bg-green-100 text-green-700',
      miscellaneous: 'bg-slate-100 text-slate-700'
    };
    return colors[category] || colors.miscellaneous;
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>
          <p className="text-slate-600">Track and manage business expenses</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setShowDialog(true); }}
          className="bg-gradient-to-r from-orange-500 to-amber-600"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-slate-900">${totalExpenses.toFixed(2)}</p>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-slate-500 mt-1">{expenses.length} transactions</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Paid Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-green-600">${paidExpenses.toFixed(2)}</p>
              <ReceiptIcon className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {expenses.filter(e => e.status === 'paid').length} paid
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-yellow-600">
                ${expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}
              </p>
              <ReceiptIcon className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {expenses.filter(e => e.status === 'pending').length} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <div className="space-y-4">
        {expenses.map(expense => (
          <Card key={expense.id} className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={getCategoryColor(expense.category)}>
                      {expense.category.replace('_', ' ')}
                    </Badge>
                    <Badge className={getStatusColor(expense.status)}>
                      {expense.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg mb-1">{expense.description}</h3>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p><span className="font-medium">Date:</span> {format(new Date(expense.expense_date), 'MMM d, yyyy')}</p>
                    {expense.vendor && (
                      <p><span className="font-medium">Vendor:</span> {expense.vendor}</p>
                    )}
                    {expense.is_recurring && (
                      <Badge variant="outline" className="text-xs">
                        Recurring
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-red-600 mb-2">
                    ${(expense.amount || 0).toFixed(2)}
                  </p>
                  {expense.status === 'pending' && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => updateStatusMutation.mutate({ id: expense.id, status: 'approved' })}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                  {expense.status === 'approved' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateStatusMutation.mutate({ id: expense.id, status: 'paid' })}
                    >
                      Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {expenses.length === 0 && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <ReceiptIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No expenses recorded yet</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record New Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData({...formData, category: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="repairs">Repairs & Maintenance</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="licenses">Licenses & Permits</SelectItem>
                  <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the expense..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label>Expense Date *</Label>
                <Input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vendor</Label>
              <Input
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                placeholder="Vendor or payee name"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                className="bg-gradient-to-r from-orange-500 to-amber-600"
                disabled={!formData.description || formData.amount <= 0}
              >
                Record Expense
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}