import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, Clock, Zap } from "lucide-react";

export default function Updates() {
  const updates = [
    {
      version: "2.1.0",
      date: "2025-12-15",
      type: "major",
      features: [
        "Customer Management System with loyalty tracking",
        "Enhanced POS with customer selection",
        "Backup & Export functionality",
        "Priority Support portal"
      ]
    },
    {
      version: "2.0.0",
      date: "2025-12-10",
      type: "major",
      features: [
        "Dine-In Management with live table tracking",
        "Kitchen Display System with auto-refresh",
        "Advanced Reports & Analytics",
        "Recipe management for cost tracking"
      ]
    },
    {
      version: "1.5.0",
      date: "2025-12-01",
      type: "minor",
      features: [
        "Staff management and shift tracking",
        "Purchase order management",
        "Expense tracking by category",
        "Multi-outlet support"
      ]
    },
    {
      version: "1.0.0",
      date: "2025-11-15",
      type: "major",
      features: [
        "Initial release",
        "Point of Sale system",
        "Menu management",
        "Inventory tracking",
        "Order management",
        "Reservation system"
      ]
    }
  ];

  const getTypeBadge = (type) => {
    switch(type) {
      case 'major':
        return <Badge className="bg-orange-100 text-orange-700 border-0">Major Update</Badge>;
      case 'minor':
        return <Badge className="bg-blue-100 text-blue-700 border-0">Minor Update</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-0">Patch</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Updates</h1>
          <p className="text-slate-600">Latest features and improvements</p>
        </div>
      </div>

      {/* Current Version */}
      <Card className="border-none shadow-lg border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Version {updates[0].version}</CardTitle>
              <p className="text-sm text-slate-600 mt-1">{updates[0].date}</p>
            </div>
            <Badge className="bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0 text-sm">
              <Zap className="w-3 h-3 mr-1" />
              Current Version
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {updates[0].features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Update History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Update History</h2>
        {updates.slice(1).map((update, index) => (
          <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Version {update.version}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">{update.date}</span>
                  </div>
                </div>
                {getTypeBadge(update.type)}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {update.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coming Soon */}
      <Card className="border-none shadow-lg bg-gradient-to-r from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Mobile app for staff and customers</li>
            <li>• Online ordering integration</li>
            <li>• Advanced analytics and forecasting</li>
            <li>• Multi-language support</li>
            <li>• Payment gateway integration</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}