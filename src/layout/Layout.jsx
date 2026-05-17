import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/lib/utils";  
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Package,
  Users,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Receipt,
  Wallet,
  CreditCard,
  TrendingUp,
  Boxes,
  FileBarChart,
  Bell,
  ShieldAlert,
   AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const navItems = [
  { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
  { 
    name: 'Sales', 
    icon: FileText,
    children: [
      { name: 'POS / Quick Bill', page: 'POS', icon: ShoppingCart },
      { name: 'Sales Invoice', page: 'SalesInvoice', icon: Receipt },
      { name: 'Sales Returns', page: 'SalesReturns', icon: FileText, role: 'super_admin' },
      { name: 'Quotations', page: 'Quotations', icon: FileText },
    ]
  },
  { 
    name: 'Purchase', 
    icon: Package,
    children: [
      { name: 'Purchase Invoice', page: 'PurchaseInvoice', icon: Receipt },
      { name: 'Purchase Returns', page: 'PurchaseReturns', icon: FileText },
      { name: 'Purchase Orders', page: 'PurchaseOrders', icon: FileText },
    ]
  },
  { 
    name: 'Inventory', 
    icon: Boxes,
    children: [
      { name: 'Items', page: 'Items', icon: Package },
      { name: 'Categories', page: 'Categories', icon: FileText },
      { name: 'Brands', page: 'Brands', icon: FileText },
      { name: 'Stock Statement', page: 'StockStatement', icon: FileText },
      { name: 'Stock Report', page: 'StockReport', icon: FileText },
      { name: 'Stock Transfer', page: 'StockTransfer', icon: TrendingUp },
      { name: 'Stock Adjustment', page: 'StockAdjustment', icon: BarChart3 },
      { name: 'Godowns', page: 'Godowns', icon: Building2 },
    ]
  },
  { 
    name: 'Parties', 
    icon: Users,
    children: [
      { name: 'Customers', page: 'Customers', icon: Users },
      { name: 'Suppliers', page: 'Suppliers', icon: Building2 },
    ]
  },
  { 
    name: 'Payments', 
    icon: Wallet,
    children: [
      { name: 'Receipts', page: 'Receipts', icon: CreditCard },
      { name: 'Payments', page: 'Payments', icon: Wallet },
    ]
  },
  { 
    name: 'Reports', 
    icon: FileBarChart,
    children: [
      { name: 'Sales Report', page: 'SalesReport', icon: BarChart3 },
      { name: 'Purchase Report', page: 'PurchaseReport', icon: BarChart3 },
      { name: 'GST Report', page: 'GSTReport', icon: FileText },
      { name: 'Ledger Report', page: 'LedgerReport', icon: FileText },
    ]
  },
  { 
    name: 'Admin', 
    icon: Building2,
    children: [
      { name: 'Companies', page: 'CompanyManagement', icon: Building2 },
      { name: 'Company Settings', page: 'CompanySettings', icon: Receipt },
      { name: 'Users & Roles', page: 'UserManagement', icon: Users },
      { name: 'Super Admin', page: 'SuperAdmin', icon: ShieldAlert, role: 'superadmin'},
      { name: 'Audit Trail', page: 'AuditTrail', icon: FileText },
      { name: 'Backup & Restore', page: 'BackupRestore', icon: Package },
    ]
  },
  { name: 'Settings', page: 'Settings', icon: Settings },
];



export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  useEffect(() => {
  const activeMenus = {};

  navItems.forEach(item => {
    if (item.children) {
      const activeChild = item.children.some(
        child => location.pathname === createPageUrl(child.page)
      );
      if (activeChild) {
        activeMenus[item.name] = true;
      }
    }
  });

  setExpandedMenus(activeMenus);
}, [location.pathname]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  const { data: items = [] } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/products/list.php', {
      credentials: 'include'
    });
    const json = await res.json();
return json.data || json;
  }
});

const { data: invoices = [] } = useQuery({
  queryKey: ['orders'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/orders/list.php', {
      credentials: 'include'
    });
    const json = await res.json();
    return json.data || [];
  }
});


const { data: notifications = [] } = useQuery({
  queryKey: ['notifications'],
  queryFn: async () => {
    const res = await fetch('http://localhost:8000/api/notifications/list.php', {
      credentials: 'include'
    });
    const json = await res.json();
    console.log("NOTIFICATIONS:", json);
    return Array.isArray(json?.data) ? json.data : [];
  },
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  staleTime: 0
});

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    initialData: [],
  });

  const activeCompany = companies?.[0];

  const toggleSubmenu = (name) => {
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const filteredNavItems = navItems
  .map(item => {

    // 🔒 Hide parent menu by role
    if (item.role && user?.role !== item.role) {
      return null;
    }

    // 🔒 Filter children
    if (item.children) {
      const filteredChildren = item.children.filter(
        child => !child.role || user?.role === child.role
      );

      // remove empty groups
      if (filteredChildren.length === 0) {
        return null;
      }

      return {
        ...item,
        children: filteredChildren
      };
    }

    return item;
  })
  .filter(Boolean);


const renderNavItem = (item, isMobile = false) => {
  if (item.children) {
    const isExpanded = expandedMenus[item.name];
    const hasActivePage = item.children.some(
      child => location.pathname === createPageUrl(child.page)
    );

    // ── COLLAPSED: floating hover panel ──────────────────────────────────
    if (!sidebarOpen && !isMobile) {
      return (
        <div key={item.name} className="relative group">
          <button
            className={`w-full flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${hasActivePage
                ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <item.icon className="w-5 h-5" />
          </button>

          {/* Floating submenu panel */}
          <div className="
            absolute left-full top-0 ml-2 z-[999]
            min-w-[180px] bg-white border border-gray-200 rounded-xl shadow-lg
            invisible opacity-0 translate-x-1
            group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
            transition-all duration-150
            pointer-events-none group-hover:pointer-events-auto
          ">
            {/* Group label */}
            <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {item.name}
              </span>
            </div>

            {/* Items */}
            <div className="p-1.5 max-h-72 overflow-y-auto">
              {item.children
                .filter(child => !child.role || user?.role === child.role)
                .map(child => (
                  <Link
                    key={child.page}
                    to={createPageUrl(child.page)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150
                      ${location.pathname === createPageUrl(child.page)
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <child.icon className="w-4 h-4 shrink-0" />
                    <span>{child.name}</span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      );
    }

    // ── EXPANDED sidebar or MOBILE: original accordion behavior ──────────
    return (
      <div key={item.name}>
        <button
          onClick={() => toggleSubmenu(item.name)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${hasActivePage
              ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600'
              : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        {isExpanded && (
          <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
            {item.children
              .filter(child => !child.role || user?.role === child.role)
              .map(child => (
                <Link
                  key={child.page}
                  to={createPageUrl(child.page)}
                  onClick={() => isMobile && setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200
                    ${location.pathname === createPageUrl(child.page)
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/20'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                >
                  <child.icon className="w-4 h-4" />
                  <span>{child.name}</span>
                </Link>
              ))}
          </div>
        )}
      </div>
    );
  }

  // ── Top-level non-parent items (Dashboard, Settings) ──────────────────
  return (
    <div key={item.page} className="relative group">
      <Link
        to={createPageUrl(item.page)}
        onClick={() => isMobile && setMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
          ${location.pathname === createPageUrl(item.page)
            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/20'
            : 'text-gray-600 hover:bg-gray-100'
          }`}
      >
        <item.icon className="w-5 h-5" />
        {(sidebarOpen || isMobile) && <span>{item.name}</span>}
      </Link>

      {/* Tooltip label when collapsed */}
      {!sidebarOpen && !isMobile && (
        <div className="
          absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
          px-2.5 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap
          invisible opacity-0 translate-x-1
          group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
          transition-all duration-150 pointer-events-none
        ">
          {item.name}
        </div>
      )}
    </div>
  );
};

  return (
    <div className="min-h-screen bg-[#F7F9FA]">
      <style>{`
        :root {
          --primary-gradient-start: #28a745;
          --primary-gradient-end: #2ecc71;
          --background: #FFFFFF;
          --surface: #F7F9FA;
          --text-primary: #0F1724;
          --text-secondary: #6B7280;
          --border: #E6EEF2;
        }
        
        * {
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #E6EEF2;
          border-radius: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #CBD5E0;
        }
        
        /* Fix dialog/modal visibility */
        [role="dialog"] {
          background-color: white !important;
          opacity: 1 !important;
        }
        
        [data-radix-popper-content-wrapper] {
          z-index: 100 !important;
        }
        
        .fixed[data-state="open"] {
          background-color: rgba(0, 0, 0, 0.5);
        }
        
        [data-radix-dialog-content] {
          background-color: white !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside 
  className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 shadow-[0_0_40px_rgba(15,23,36,0.04)] z-50 transition-all duration-300 hidden lg:block
    ${sidebarOpen ? 'w-64' : 'w-20'}`}
>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-[#0F1724] text-lg">BillFlow</span>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Receipt className="w-5 h-5 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-gray-600 h-8 w-8"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Active Company */}
        {activeCompany && sidebarOpen && (
          <Link to={createPageUrl('CompanyManagement')} className="block px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <p className="text-xs text-gray-400 mb-1">Active Company</p>
            <p className="text-sm font-medium text-[#0F1724] truncate">{activeCompany.name}</p>
            {activeCompany.gstin && (
              <p className="text-xs text-gray-400 mt-0.5">{activeCompany.gstin}</p>
            )}
          </Link>
        )}

        {/* Navigation */}
        <nav className={`p-3 space-y-1 h-[calc(100vh-180px)] scrollbar-thin ${sidebarOpen ? 'overflow-y-auto' : 'overflow-visible'}`}>
          {filteredNavItems.map(item => renderNavItem(item))}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 bg-white">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors ${!sidebarOpen && 'justify-center'}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-[#0F1724] truncate">{user?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                    <Link to={createPageUrl('AccountSettings')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-[#0F1724]">BillFlow</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="p-4 text-center text-sm text-gray-500">
                No new notifications
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-[#0F1724]">BillFlow</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
              {filteredNavItems.map(item => renderNavItem(item, true))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} pt-16 lg:pt-0 min-h-screen`}>
        {/* Desktop Top Bar */}
        <div className="hidden lg:flex h-14 items-center justify-end gap-3 px-6 bg-white border-b border-gray-100">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-gray-500" />
                {notifications.length > 0 && (
  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-medium rounded-full leading-none">
  {notifications.length}
</span>
)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold">Notifications</h3>
              </div>
<div className="max-h-80 overflow-y-auto">
  {notifications.length === 0 ? (
    <div className="py-8 text-center text-sm text-gray-500">
      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
      No new notifications
    </div>
  ) : (
    notifications.map((n, i) => {
  const Icon =
    n.type === "low_stock"
      ? AlertTriangle
      : n.type === "payment"
      ? CreditCard
      : Bell;

  return (
    <div
      key={`${n.type}-${i}`}
      onClick={() => {
  if (!n.link) return;

  const [page, query] = n.link.split("?");

  const url = createPageUrl(page);

  navigate(query ? `${url}?${query}` : url);
}}
      className="p-3 border-b text-sm hover:bg-gray-50 cursor-pointer flex items-start gap-3"
    >
      <Icon
        className={`w-5 h-5 mt-0.5 ${
          n.type === "low_stock"
            ? "text-red-500"
            : "text-yellow-500"
        }`}
      />

      <div className="flex-1">
        <p className="font-medium text-gray-800">{n.title}</p>
        <p className="text-xs text-gray-500">{n.message}</p>

        {n.amount && (
          <p className="text-xs text-emerald-600 font-medium">
            ₹{n.amount}
          </p>
        )}

        {n.extra && (
          <p className="text-xs text-gray-400">{n.extra}</p>
        )}
      </div>
    </div>
  );
})
  )}
</div>
      </PopoverContent>
          </Popover>

          {/* Help Center */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <HelpCircle className="w-5 h-5 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold">Help Center</h3>
              </div>
              <div className="p-3 space-y-2">
                <a href="#" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <p className="font-medium text-sm">Getting Started</p>
                  <p className="text-xs text-gray-500">Learn the basics of BillFlow</p>
                </a>
                <a href="#" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <p className="font-medium text-sm">GST & Invoicing</p>
                  <p className="text-xs text-gray-500">How to create GST compliant invoices</p>
                </a>
                <a href="#" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <p className="font-medium text-sm">Reports & Analytics</p>
                  <p className="text-xs text-gray-500">Understanding your business data</p>
                </a>
                <div className="pt-2 border-t border-gray-100">
                  <a href="mailto:support@billflow.in" className="block p-3 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors">
                    <p className="font-medium text-sm">Contact Support</p>
                    <p className="text-xs">support@billflow.in</p>
                  </a>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}