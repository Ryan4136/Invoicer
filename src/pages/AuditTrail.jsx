import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DataTable from '@/components/ui/DataTable';
import { ExportButton } from '@/components/ui/ExportImportButtons';
import {
  History,
  Filter,
  FileText,
  Edit,
  Trash2,
  Plus,
  Download,
  Eye,
  LogIn,
  LogOut,
  Printer
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';

const ACTION_CONFIG = {
  create: { icon: Plus, color: 'bg-emerald-100 text-emerald-700', label: 'Created' },
  update: { icon: Edit, color: 'bg-blue-100 text-blue-700', label: 'Updated' },
  delete: { icon: Trash2, color: 'bg-red-100 text-red-700', label: 'Deleted' },
  login: { icon: LogIn, color: 'bg-purple-100 text-purple-700', label: 'Login' },
  logout: { icon: LogOut, color: 'bg-gray-100 text-gray-700', label: 'Logout' },
  export: { icon: Download, color: 'bg-amber-100 text-amber-700', label: 'Exported' },
  import: { icon: FileText, color: 'bg-indigo-100 text-indigo-700', label: 'Imported' },
  print: { icon: Printer, color: 'bg-cyan-100 text-cyan-700', label: 'Printed' },
  view: { icon: Eye, color: 'bg-pink-100 text-pink-700', label: 'Viewed' },
};

export default function AuditTrail() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-timestamp', 500),
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;
    
    let matchesDate = true;
    if (dateRange !== 'all' && log.timestamp) {
      const logDate = parseISO(log.timestamp);
      const cutoffDate = subDays(new Date(), parseInt(dateRange));
      matchesDate = logDate >= cutoffDate;
    }

    return matchesSearch && matchesAction && matchesEntity && matchesDate;
  });

  const entityTypes = [...new Set(logs.map(l => l.entity_type).filter(Boolean))];

  const columns = [
    {
      header: 'Timestamp',
      render: (row) => (
        <div>
          <p className="font-medium text-[#0F1724]">{format(parseISO(row.timestamp), 'dd MMM yyyy')}</p>
          <p className="text-xs text-gray-400">{format(parseISO(row.timestamp), 'HH:mm:ss')}</p>
        </div>
      )
    },
    {
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xs font-semibold">
            {row.user_email?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm">{row.user_email}</span>
        </div>
      )
    },
    {
      header: 'Action',
      render: (row) => {
        const config = ACTION_CONFIG[row.action] || { color: 'bg-gray-100 text-gray-700', label: row.action };
        return (
          <Badge className={config.color}>
            {config.label}
          </Badge>
        );
      }
    },
    {
      header: 'Entity',
      render: (row) => (
        <div>
          <p className="font-medium text-[#0F1724]">{row.entity_type}</p>
          {row.entity_name && <p className="text-xs text-gray-400">{row.entity_name}</p>}
        </div>
      )
    },
    {
      header: 'Details',
      render: (row) => (
        <p className="text-sm text-gray-500 max-w-xs truncate">
          {row.details ? JSON.stringify(row.details) : '-'}
        </p>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Audit Trail</h1>
          <p className="text-gray-500 mt-1">Track all system activities and changes</p>
        </div>
        <ExportButton
          data={filteredLogs}
          filename="audit_trail"
          columns={[
            { header: 'Timestamp', accessor: 'timestamp' },
            { header: 'User', accessor: 'user_email' },
            { header: 'Action', accessor: 'action' },
            { header: 'Entity Type', accessor: 'entity_type' },
            { header: 'Entity Name', accessor: 'entity_name' },
            { header: 'Entity ID', accessor: 'entity_id' }
          ]}
        />
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by user or entity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#F7F9FA] border-0"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-40 bg-[#F7F9FA] border-0">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Object.entries(ACTION_CONFIG).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full md:w-40 bg-[#F7F9FA] border-0">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-40 bg-[#F7F9FA] border-0">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 Hours</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" />
            Activity Log ({filteredLogs.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredLogs}
            isLoading={isLoading}
            searchable={false}
            emptyMessage="No audit logs found"
          />
        </CardContent>
      </Card>
    </div>
  );
}