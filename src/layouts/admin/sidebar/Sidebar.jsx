import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Users, Shield, History, Share2, UserCog, TrendingUp, BarChart2, LogOut, Info } from 'lucide-react';
import { cn } from '../../../components/lib/utils';
import { useAuth } from '../../../components/context/AuthContext';

const Sidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    cn(
      'flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    );

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card p-4 hidden md:flex md:flex-col">
      <div className="flex flex-col h-full">
        <div className="flex items-center mb-8">
          <h1 className="text-2xl font-bold text-primary">TRÉZO CASH</h1>
        </div>
        <nav className="flex flex-col space-y-2 flex-grow">
          <p className="px-4 pt-6 pb-2 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">Administration</p>
          <NavLink to="/admin/dashboard" className={navLinkClass}>
            <Shield className="mr-3 h-5 w-5" />
            Dashboard Admin
          </NavLink>
          <NavLink to="/admin/ambassadors" className={navLinkClass}>
            <UserCog className="mr-3 h-5 w-5" />
            Ambassadeurs
          </NavLink>
          <NavLink to="/admin/users" className={navLinkClass}>
            <Users className="mr-3 h-5 w-5" />
            Utilisateurs
          </NavLink>
          <NavLink to="/admin/revenue" className={navLinkClass}>
            <TrendingUp className="mr-3 h-5 w-5" />
            Chiffre d'affaires
          </NavLink>
           <NavLink to="/admin/analytics" className={navLinkClass}>
            <BarChart2 className="mr-3 h-5 w-5" />
            Analyse
          </NavLink>
        </nav>
        <div className="mt-auto">
          <button onClick={handleSignOut} className="flex w-full items-center px-4 py-2.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="mr-3 h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
