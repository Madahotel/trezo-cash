import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { ArrowRight, UserCog } from 'lucide-react';

const AdminAmbassadorsSummaryCard = ({ totalAmbassadors }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Ambassadeurs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-secondary">
                <UserCog className="h-6 w-6 text-primary" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Total des ambassadeurs</p>
                <p className="text-2xl font-bold">{totalAmbassadors}</p>
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Link to="/admin/ambassadors" className="flex items-center text-sm font-semibold text-primary hover:underline">
          Voir la liste complète
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default AdminAmbassadorsSummaryCard;
