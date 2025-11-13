import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';

const CollaborationStats = ({ stats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Collaborateurs actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{stats.collaborators}</div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Invitations en attente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">{stats.pendingInvitations}</div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">{stats.totalInvitations}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaborationStats;