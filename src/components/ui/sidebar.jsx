export const SidebarProvider = ({ children }) => <>{children}</>;
export const Sidebar = ({ children, className = "" }) => (
  <aside className={`w-64 ${className}`}>{children}</aside>
);
export const SidebarHeader = ({ children }) => <div>{children}</div>;
export const SidebarContent = ({ children }) => <div>{children}</div>;
export const SidebarFooter = ({ children }) => <div>{children}</div>;
export const SidebarGroup = ({ children }) => <div>{children}</div>;
export const SidebarGroupLabel = ({ children }) => (
  <div className="text-xs px-3 py-2">{children}</div>
);
export const SidebarGroupContent = ({ children }) => <div>{children}</div>;
export const SidebarMenu = ({ children }) => <div>{children}</div>;
export const SidebarMenuItem = ({ children }) => <div>{children}</div>;
export const SidebarMenuButton = ({ children }) => children;
export const SidebarTrigger = () => null;
