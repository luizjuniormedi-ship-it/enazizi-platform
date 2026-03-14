import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import { Brain, Menu } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const MobileNav = () => {
  const location = useLocation();
  const navItems = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/dashboard/cronograma", label: "Cronograma" },
    { to: "/dashboard/flashcards", label: "Flashcards" },
    { to: "/dashboard/simulados", label: "Simulados" },
    { to: "/dashboard/uploads", label: "Uploads" },
    { to: "/dashboard/mentor", label: "Mentor IA" },
    { to: "/dashboard/analytics", label: "Analytics" },
    { to: "/admin", label: "Admin" },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="lg:hidden p-2"><Menu className="h-6 w-6" /></button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-sidebar border-sidebar-border w-64 p-0">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-bold">ENAZIZI</span>
          </Link>
        </div>
        <nav className="px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.to ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

const DashboardLayout = () => (
  <div className="flex min-h-screen bg-background">
    <DashboardSidebar />
    <div className="flex-1 flex flex-col">
      <header className="lg:hidden h-14 border-b border-border flex items-center px-4 gap-3">
        <MobileNav />
        <Brain className="h-5 w-5 text-primary" />
        <span className="font-bold text-sm">ENAZIZI</span>
      </header>
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  </div>
);

export default DashboardLayout;
