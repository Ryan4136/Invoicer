import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Download, FileJson, Calendar, Package } from "lucide-react";
import { format } from "date-fns";

export default function Backup() {
  const [exporting, setExporting] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date', 1000),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date', 1000),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => base44.entities.MenuItem.list(),
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => base44.entities.Ingredient.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-expense_date', 1000),
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list(),
  });

  const exportData = (data, filename) => {
    setExporting(true);
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const exportAllData = () => {
    const allData = {
      exported_at: new Date().toISOString(),
      orders,
      customers,
      menu_items: menuItems,
      ingredients,
      expenses,
      reservations
    };
    exportData(allData, 'restaurant_backup_full');
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Backup & Export</h1>
        <p className="text-slate-600">Export your data for backup or analysis</p>
      </div>

      {/* Full Backup */}
      <Card className="border-none shadow-lg border-l-4 border-l-orange-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Complete Backup</CardTitle>
              <p className="text-sm text-slate-600">Export all data in a single file</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={exportAllData}
            disabled={exporting}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Complete Backup'}
          </Button>
        </CardContent>
      </Card>

      {/* Individual Exports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileJson className="w-8 h-8 text-blue-500" />
              <div>
                <CardTitle className="text-lg">Orders</CardTitle>
                <p className="text-sm text-slate-600">{orders.length} records</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => exportData(orders, 'orders')}
              disabled={exporting || orders.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Orders
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileJson className="w-8 h-8 text-green-500" />
              <div>
                <CardTitle className="text-lg">Customers</CardTitle>
                <p className="text-sm text-slate-600">{customers.length} records</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => exportData(customers, 'customers')}
              disabled={exporting || customers.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Customers
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileJson className="w-8 h-8 text-orange-500" />
              <div>
                <CardTitle className="text-lg">Menu Items</CardTitle>
                <p className="text-sm text-slate-600">{menuItems.length} records</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => exportData(menuItems, 'menu_items')}
              disabled={exporting || menuItems.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Menu
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-purple-500" />
              <div>
                <CardTitle className="text-lg">Inventory</CardTitle>
                <p className="text-sm text-slate-600">{ingredients.length} records</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => exportData(ingredients, 'inventory')}
              disabled={exporting || ingredients.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Inventory
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileJson className="w-8 h-8 text-red-500" />
              <div>
                <CardTitle className="text-lg">Expenses</CardTitle>
                <p className="text-sm text-slate-600">{expenses.length} records</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => exportData(expenses, 'expenses')}
              disabled={exporting || expenses.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Expenses
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-500" />
              <div>
                <CardTitle className="text-lg">Reservations</CardTitle>
                <p className="text-sm text-slate-600">{reservations.length} records</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => exportData(reservations, 'reservations')}
              disabled={exporting || reservations.length === 0}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Reservations
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-none shadow-lg bg-blue-50/50">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-900 mb-2">About Backups</h3>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• All exports are in JSON format for easy data portability</li>
            <li>• Complete backup includes all entities in a single file</li>
            <li>• Files are timestamped for easy organization</li>
            <li>• Data is exported as-is from the database</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}