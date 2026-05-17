import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import DataTable from '@/components/ui/DataTable';
import {
  Database,
  Download,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const ENTITIES_TO_BACKUP = [
  { key: 'Item', label: 'Items', icon: '📦' },
  { key: 'Customer', label: 'Customers/Suppliers', icon: '👥' },
  { key: 'Invoice', label: 'Invoices', icon: '🧾' },
  { key: 'Payment', label: 'Payments', icon: '💰' },
  { key: 'StockEntry', label: 'Stock Entries', icon: '📊' },
  { key: 'Company', label: 'Company Settings', icon: '🏢' },
];

export default function BackupRestore() {
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState(ENTITIES_TO_BACKUP.map(e => e.key));
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);

  const queryClient = useQueryClient();

  const { data: backups = [], isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: () => base44.entities.Backup.list('-created_date'),
  });

  const createBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    const backupData = {};
    const recordCounts = {};

    for (let i = 0; i < selectedEntities.length; i++) {
      const entity = selectedEntities[i];
      setBackupProgress(Math.round((i / selectedEntities.length) * 80));
      
      try {
        const data = await base44.entities[entity].list();
        backupData[entity] = data;
        recordCounts[entity] = data.length;
      } catch (err) {
        console.error(`Failed to backup ${entity}:`, err);
      }
    }

    setBackupProgress(90);

    // Create backup record
    const backup = await base44.entities.Backup.create({
      backup_type: 'manual',
      status: 'completed',
      entities_included: selectedEntities,
      record_counts: recordCounts,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      notes: `Manual backup of ${selectedEntities.length} entities`
    });

    // Download as JSON
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setBackupProgress(100);
    queryClient.invalidateQueries({ queryKey: ['backups'] });
    
    setTimeout(() => {
      setIsBackingUp(false);
      setShowBackupDialog(false);
      setBackupProgress(0);
    }, 1000);
  };

  const handleRestore = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!confirm(`This will restore data for: ${Object.keys(data).join(', ')}. Existing data may be affected. Continue?`)) {
          return;
        }

        for (const [entity, records] of Object.entries(data)) {
          if (base44.entities[entity]) {
            for (const record of records) {
              const { id, created_date, updated_date, created_by, ...cleanRecord } = record;
              try {
                await base44.entities[entity].create(cleanRecord);
              } catch (err) {
                console.error(`Failed to restore ${entity} record:`, err);
              }
            }
          }
        }

        alert('Restore completed successfully!');
        queryClient.invalidateQueries();
      } catch (err) {
        alert('Failed to parse backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const columns = [
    {
      header: 'Date',
      render: (row) => (
        <div>
          <p className="font-medium text-[#0F1724]">{format(parseISO(row.created_date), 'dd MMM yyyy')}</p>
          <p className="text-xs text-gray-400">{format(parseISO(row.created_date), 'HH:mm:ss')}</p>
        </div>
      )
    },
    {
      header: 'Type',
      render: (row) => (
        <Badge variant="secondary" className={
          row.backup_type === 'full' ? 'bg-purple-100 text-purple-700' :
          row.backup_type === 'incremental' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }>
          {row.backup_type}
        </Badge>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(row.status)}
          <span className="text-sm capitalize">{row.status}</span>
        </div>
      )
    },
    {
      header: 'Entities',
      render: (row) => (
        <span className="text-sm text-gray-500">
          {row.entities_included?.length || 0} entities
        </span>
      )
    },
    {
      header: 'Records',
      render: (row) => {
        const total = Object.values(row.record_counts || {}).reduce((a, b) => a + b, 0);
        return <span className="text-sm text-gray-500">{total} records</span>;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F1724]">Backup & Restore</h1>
          <p className="text-gray-500 mt-1">Manage data backups and restoration</p>
        </div>
        <div className="flex gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleRestore(e.target.files[0])}
            />
            <Button variant="outline" className="border-gray-200" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Restore Backup
              </span>
            </Button>
          </label>
          <Button onClick={() => setShowBackupDialog(true)} className="bg-gradient-to-r from-emerald-500 to-green-600">
            <Download className="w-4 h-4 mr-2" />
            Create Backup
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <Database className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1724]">{backups.length}</p>
                <p className="text-sm text-gray-500">Total Backups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1724]">
                  {backups.filter(b => b.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-500">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0F1724]">
                  {backups[0] ? format(parseISO(backups[0].created_date), 'dd MMM') : '-'}
                </p>
                <p className="text-sm text-gray-500">Last Backup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card className="border-0 shadow-[0_6px_18px_rgba(15,23,36,0.06)]">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-500" />
            Backup History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={backups}
            isLoading={isLoading}
            searchable={false}
            emptyMessage="No backups found. Create your first backup!"
          />
        </CardContent>
      </Card>

      {/* Backup Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
          </DialogHeader>

          {isBackingUp ? (
            <div className="py-8 space-y-4">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 mx-auto mb-4 text-emerald-500 animate-spin" />
                <p className="font-medium">Creating backup...</p>
                <p className="text-sm text-gray-500">Please wait while we export your data</p>
              </div>
              <Progress value={backupProgress} className="h-2" />
              <p className="text-center text-sm text-gray-500">{backupProgress}%</p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <p className="text-sm text-gray-500">Select the data you want to include in this backup:</p>
              
              <div className="space-y-3">
                {ENTITIES_TO_BACKUP.map(entity => (
                  <div key={entity.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Checkbox
                      id={entity.key}
                      checked={selectedEntities.includes(entity.key)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEntities(prev => [...prev, entity.key]);
                        } else {
                          setSelectedEntities(prev => prev.filter(e => e !== entity.key));
                        }
                      }}
                    />
                    <Label htmlFor={entity.key} className="flex items-center gap-2 cursor-pointer flex-1">
                      <span>{entity.icon}</span>
                      <span>{entity.label}</span>
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowBackupDialog(false)}>Cancel</Button>
                <Button 
                  onClick={createBackup}
                  disabled={selectedEntities.length === 0}
                  className="bg-gradient-to-r from-emerald-500 to-green-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Start Backup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}