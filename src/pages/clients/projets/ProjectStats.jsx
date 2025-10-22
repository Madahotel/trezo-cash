import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Building2, PartyPopper, Home, FolderOpen } from 'lucide-react';

const ProjectStats = ({ stats }) => {
    const statItems = [
        {
            label: 'Total projets',
            value: stats.total,
            icon: FolderOpen,
            color: 'text-gray-600'
        },
        {
            label: 'Projets Business',
            value: stats.business,
            icon: Building2,
            color: 'text-blue-500'
        },
        {
            label: 'Événements',
            value: stats.events,
            icon: PartyPopper,
            color: 'text-purple-500'
        },
        {
            label: 'Ménages',
            value: stats.menages,
            icon: Home,
            color: 'text-green-500'
        }
    ];

    return (
        <div className="grid md:grid-cols-4 gap-3">
            {statItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                    <Card key={index} className="border border-gray-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-medium text-gray-500 flex items-center">
                                <IconComponent className="w-3 h-3 mr-1" />
                                {item.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${item.color}`}>
                                {item.value}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

export default ProjectStats;