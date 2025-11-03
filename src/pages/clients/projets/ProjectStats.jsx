import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Briefcase, PartyPopper, Home, FolderOpen } from 'lucide-react';

const ProjectStats = ({ stats, loading = false }) => {
    const statItems = [
        {
            label: 'Total',
            value: stats.total,
            icon: FolderOpen,
            color: 'gray'
        },
        {
            label: 'Business',
            value: stats.business,
            icon: Briefcase,
            color: 'blue'
        },
        {
            label: 'Événements',
            value: stats.events,
            icon: PartyPopper,
            color: 'pink'
        },
        {
            label: 'Ménages',
            value: stats.menages,
            icon: Home,
            color: 'green'
        }
    ];

    const colorClasses = {
        gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
        pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
        green: { bg: 'bg-green-100', text: 'text-green-600' }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                    <Card key={index} className="animate-pulse">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statItems.map((item, index) => {
                const IconComponent = item.icon;
                const colorClass = colorClasses[item.color];
                
                return (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg ${colorClass.bg} flex items-center justify-center`}>
                                    <IconComponent className={`w-5 h-5 ${colorClass.text}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{item.label}</p>
                                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

export default ProjectStats;