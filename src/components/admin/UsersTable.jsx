import React from 'react';
import { Card, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { cn } from '../../lib/utils';
import { ArrowUpDown } from 'lucide-react';

const statusStyles = {
  abonné: 'bg-green-500/20 text-green-400 border-green-500/30',
  essai: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const SortableHeader = ({ children, sortKey, onSort, sortConfig, className }) => {
    const isSorted = sortConfig.key === sortKey;
    return (
        <th scope="col" className={cn("px-6 py-3", className)}>
            <button onClick={() => onSort(sortKey)} className="flex items-center gap-2 group">
                {children}
                <ArrowUpDown className={cn(
                    "h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground",
                    isSorted && "text-foreground"
                )} />
            </button>
        </th>
    );
};

const UsersTable = ({ users, onSort, sortConfig }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
              <tr>
                <SortableHeader sortKey="name" onSort={onSort} sortConfig={sortConfig}>Utilisateur</SortableHeader>
                <SortableHeader sortKey="status" onSort={onSort} sortConfig={sortConfig}>Statut</SortableHeader>
                <th scope="col" className="px-6 py-3">Pack</th>
                <SortableHeader sortKey="sponsorName" onSort={onSort} sortConfig={sortConfig}>Parrain</SortableHeader>
                <SortableHeader sortKey="registrationDate" onSort={onSort} sortConfig={sortConfig}>Date d'inscription</SortableHeader>
                <SortableHeader sortKey="lastConnectionDate" onSort={onSort} sortConfig={sortConfig}>Dernière connexion</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? users.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium">
                    <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={cn(statusStyles[user.status])}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.packName || 'N/A'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{user.sponsorName || 'Aucun'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(user.registrationDate)}</td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(user.lastConnectionDate)}</td>
                </tr>
              )) : (
                <tr>
                    <td colSpan="6" className="text-center py-16 text-muted-foreground">
                        Aucun utilisateur ne correspond à vos critères.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersTable;
