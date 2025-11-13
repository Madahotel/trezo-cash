// components/StatusBadge.jsx
import React from 'react';
import Badge from '../../../components/ui/badge';

const StatusBadge = ({ status }) => {
  const statusMap = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
    accepted: { label: 'Acceptée', color: 'bg-green-100 text-green-700' },
    declined: { label: 'Refusée', color: 'bg-red-100 text-red-700' },
    expired: { label: 'Expirée', color: 'bg-gray-100 text-gray-700' },
    cancelled: { label: 'Annulée', color: 'bg-gray-100 text-gray-700' }
  };
  
  const statusInfo = statusMap[status] || statusMap.pending;
  return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
};

export default StatusBadge;