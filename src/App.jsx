import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import POS from "./pages/pos";
import DineInManagement from "./pages/DineInManagement";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import KitchenDisplay from "./pages/KitchenDisplay";
import Orders from "./pages/Orders";
import Reservations from "./pages/Reservations";
import Updates from "./pages/Updates";
import Support from "./pages/Support";
import Profile from "./pages/Profile";
import MenuManagement from "./pages/MenuManagement";
import Tables from "./pages/tables";
import PurchaseOrders from "./pages/PurchaseOrders";
import Expenses from "./pages/expenses";
import Staff from "./pages/Staff";
import Reports from "./pages/Reports";
import AdminPanel from "./pages/AdminPanel";
import Backup from "./pages/Backup";
import SalesInvoice from "./pages/SalesInvoice";
import SalesReturns from "./pages/SalesReturns";
import Quotations from "./pages/Quotations";
import PurchaseInvoice from "./pages/PurchaseInvoice";
import PurchaseReturns from "./pages/PurchaseReturns";
import PurchaseReport from "./pages/PurchaseReport";
import Items from "./pages/Items";
import StockReport from "./pages/StockReport";
import StockTransfer from "./pages/StockTransfer";
import Receipts from "./pages/Receipts";
import Payments from "./pages/Payments";
import SalesReport from "./pages/SalesReport";
import GSTReport from "./pages/GSTReport";
import LedgerReport from "./pages/LedgerReport";
import CompanyManagement from "./pages/CompanyManagement";
import CompanySettings from "./pages/CompanySettings";
import UserManagement from "./pages/UserManagement";
import AuditTrail from "./pages/AuditTrail";
import BackupRestore from "./pages/BackupRestore";
import Settings from "./pages/Settings";
import AccountSettings from "./pages/AccountSettings";
import StockStatement from "./pages/StockStatement";
import Categories from "./pages/Categories";
import Brands from "./pages/Brands";
import Godowns from "./pages/Godowns";
import StockAdjustment from "./pages/StockAdjustment";
import Suppliers from "./pages/Suppliers";
import SuperAdmin from "./pages/SuperAdmin";
import ProtectedRoute from "./components/ProtectedRoute";



export default function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null); // 👈
  useEffect(() => {
    fetch("http://localhost:8000/api/me.php", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
  setIsAuthed(!!data.loggedIn);

  if (data.loggedIn) {
    setUser(data.user); // ✅ FIXED
  } else {
    setUser(null);
  }

  setCheckingAuth(false);
})
      .catch(() => {
        setIsAuthed(false);
        setCheckingAuth(false);
      });
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking session…
      </div>
    );
  }
  const ProtectedRoute = ({ children, role }) => {

  // 🔒 not logged in
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  // 🔒 role restricted
  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      {children}
    </Layout>
  );
};
  window.appUser = user;
  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthed ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/login"
        element={
          isAuthed ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onAuth={() => setIsAuthed(true)} />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          isAuthed ? (
            <Layout>
              <Dashboard />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/Quotations"
        element={
          isAuthed ? (
            <Layout>
              <Quotations />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/Categories"
        element={
          isAuthed ? (
            <Layout>
              <Categories />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/Brands"
        element={
          isAuthed ? (
            <Layout>
              <Brands />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/Suppliers"
        element={
          isAuthed ? (
            <Layout>
              <Suppliers   />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/StockAdjustment"
        element={
          isAuthed ? (
            <Layout>
              <StockAdjustment />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/BackupRestore"
        element={
          isAuthed ? (
            <Layout>
              <BackupRestore />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/Godowns"
        element={
          isAuthed ? (
            <Layout>
              <Godowns />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/StockStatement"
        element={
          isAuthed ? (
            <Layout>
              <StockStatement />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/Settings"
        element={
          isAuthed ? (
            <Layout>
              <Settings />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* POS ROUTE */}
      <Route
        path="/pos"
        element={
          isAuthed ? (
            <Layout>
              <POS />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
  path="/SuperAdmin"
  element={
    <ProtectedRoute role="superadmin">
      <SuperAdmin />
    </ProtectedRoute>
  }
/>
      <Route
        path="/AccountSettings"
        element={
          isAuthed ? (
            <Layout>
              <AccountSettings />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/CompanySettings"
        element={
          isAuthed ? (
            <Layout>
              <CompanySettings />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/SalesReport"
        element={
          isAuthed ? (
            <Layout>
              <SalesReport />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/AuditTrail"
        element={
          isAuthed ? (
            <Layout>
              <AuditTrail />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    
      <Route
        path="/Receipts"
        element={
          isAuthed ? (
            <Layout>
              <Receipts />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    
      <Route
        path="/UserManagement"
        element={
          isAuthed ? (
            <Layout>
              <UserManagement />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    
      <Route
        path="/CompanyManagement"
        element={
          isAuthed ? (
            <Layout>
              <CompanyManagement />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    
      <Route
        path="/LedgerReport"
        element={
          isAuthed ? (
            <Layout>
              <LedgerReport />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/Payments"
        element={
          isAuthed ? (
            <Layout>
              <Payments />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    
      <Route
        path="/Customers"
        element={
          isAuthed ? (
            <Layout>
              <Customers />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    
    
      <Route
        path="/StockTransfer"
        element={
          isAuthed ? (
            <Layout>
              <StockTransfer />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    

      <Route
        path="/StockReport"
        element={
          isAuthed ? (
            <Layout>
              <StockReport />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    
      <Route
        path="/GSTReport"
        element={
          isAuthed ? (
            <Layout>
              <GSTReport />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    

      <Route
        path="/Items"
        element={
          isAuthed ? (
            <Layout>
              <Items />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

<Route
        path="/PurchaseInvoice"
        element={
          isAuthed ? (
            <Layout>
              <PurchaseInvoice />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />


<Route
        path="/PurchaseReturns"
        element={
          isAuthed ? (
            <Layout>
              <PurchaseReturns />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />


<Route
        path="/PurchaseReport"
        element={
          isAuthed ? (
            <Layout>
              <PurchaseReport />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />


<Route
        path="/Inventory"
        element={
          isAuthed ? (
            <Layout>
              <Inventory />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
        path="/KitchenDisplay"
        element={
          isAuthed ? (
            <Layout>
              <KitchenDisplay />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
        path="/Orders"
        element={
          isAuthed ? (
            <Layout>
              <Orders />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
        path="/Reservations"
        element={
          isAuthed ? (
            <Layout>
              <Reservations />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
        path="/Updates"
        element={
          isAuthed ? (
            <Layout>
              <Updates />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
        path="/Support"
        element={
          isAuthed ? (
            <Layout>
              <Support />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
        path="/Profile"
        element={
          isAuthed ? (
            <Layout>
              <Profile />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
        path="/MenuManagement"
        element={
          isAuthed ? (
            <Layout>
              <MenuManagement />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
        path="/Tables"
        element={
          isAuthed ? (
            <Layout>
              <Tables />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
        path="/PurchaseOrders"
        element={
          isAuthed ? (
            <Layout>
              <PurchaseOrders />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
        path="/Expenses"
        element={
          isAuthed ? (
            <Layout>
              <Expenses  />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
        path="/Staff"
        element={
          isAuthed ? (
            <Layout>
              <Staff />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
        path="/Reports"
        element={
          isAuthed ? (
            <Layout>
              <Reports />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

<Route
        path="/Backup"
        element={
          isAuthed ? (
            <Layout>
              <Backup />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
  path="/AdminPanel"
  element={
    <ProtectedRoute isAuthed={isAuthed} user={user} role="superadmin">
      <Layout>
        <AdminPanel />
      </Layout>
    </ProtectedRoute>
  }
/>
<Route
        path="/SalesInvoice"
        element={
          isAuthed ? (
            <Layout>
              <SalesInvoice />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
<Route
  path="/SalesReturns"
  element={
    isAuthed ? (
      user?.role === 'superadmin' ? (
        <Layout>
          <SalesReturns />
        </Layout>
      ) : (
        <Navigate to="/dashboard" replace />
      )
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
      </Routes>
  );
}
