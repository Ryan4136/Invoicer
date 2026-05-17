import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Building2,
  Users,
  FileText,
  Printer,
  Database,
  Shield,
  Bell,
  Palette,
  ChevronRight,
  CreditCard,
  Globe,
  Download
} from 'lucide-react';

const settingsGroups = [
  {
    title: 'Business',
    items: [
      {
        icon: Building2,
        title: 'Company Settings',
        description: 'Manage your business information and GST details',
        page: 'CompanySettings',
        gradient: 'from-emerald-500 to-green-600'
      },
      {
        icon: Building2,
        title: 'Multi-Company',
        description: 'Manage multiple companies',
        page: 'CompanyManagement',
        gradient: 'from-teal-500 to-emerald-600'
      },
      {
        icon: Users,
        title: 'User Management',
        description: 'Add users and manage permissions',
        page: 'UserManagement',
        gradient: 'from-blue-500 to-indigo-600'
      }
    ]
  },
  {
    title: 'Invoicing',
    items: [
      {
        icon: FileText,
        title: 'Invoice Templates',
        description: 'Customize invoice format and design',
        page: 'Settings',
        gradient: 'from-amber-500 to-orange-600'
      },
      {
        icon: Printer,
        title: 'Print Settings',
        description: 'Configure thermal printer and print layouts',
        page: 'Settings',
        gradient: 'from-teal-500 to-cyan-600'
      },
      {
        icon: CreditCard,
        title: 'Payment Methods',
        description: 'Configure payment gateways and UPI',
        page: 'Settings',
        gradient: 'from-rose-500 to-red-600'
      }
    ]
  },
  {
    title: 'Data & Backup',
    items: [
      {
        icon: Database,
        title: 'Backup & Restore',
        description: 'Create backups and restore data',
        page: 'BackupRestore',
        gradient: 'from-violet-500 to-indigo-600'
      },
      {
        icon: Download,
        title: 'Import / Export',
        description: 'Import from CSV or export to Tally',
        page: 'Settings',
        gradient: 'from-lime-500 to-green-600'
      },
      {
        icon: Globe,
        title: 'Integrations',
        description: 'Connect with other services and APIs',
        page: 'Settings',
        gradient: 'from-sky-500 to-blue-600'
      }
    ]
  },
  {
    title: 'Audit & Security',
    items: [
      {
        icon: Shield,
        title: 'Audit Trail',
        description: 'View activity logs and changes',
        page: 'AuditTrail',
        gradient: 'from-fuchsia-500 to-pink-600'
      },
      {
        icon: Palette,
        title: 'Appearance',
        description: 'Theme, language and display preferences',
        page: 'Settings',
        gradient: 'from-orange-500 to-amber-600'
      }
    ]
  }
];

export default function Settings() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your application settings and preferences</p>
      </div>

      {/* Settings Groups */}
      {settingsGroups.map((group, groupIdx) => (
        <div key={groupIdx}>
          <h2 className="text-lg font-semibold text-[#0F1724] mb-4">{group.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.items.map((item, itemIdx) => (
              <Link key={itemIdx} to={createPageUrl(item.page)}>
                <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)] hover:shadow-lg transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#0F1724] group-hover:text-emerald-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* App Info */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)] bg-gradient-to-br from-gray-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#0F1724]">BillFlow ERP</h3>
              <p className="text-sm text-gray-500 mt-1">Version 1.0.0 • Built with ❤️ for Indian businesses</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Last sync</p>
              <p className="text-sm text-gray-600">Just now</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}