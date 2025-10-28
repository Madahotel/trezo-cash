import React, { useState, useMemo } from 'react';
import { Search, Star, Users, LayoutTemplate } from 'lucide-react';
import TemplateGrid from '../TemplateGrid';
import TemplateFilters from '../TemplateFilters';

const TemplateSelectionStep = ({ 
  data, 
  setData, 
  currentUser, 
  userAndCommunityTemplates, 
  templatesLoading 
}) => {
  const [activeTab, setActiveTab] = useState('official');
  const [searchTerm, setSearchTerm] = useState('');

  // Logique de filtrage des templates (identique à avant)
  const allOfficialTemplates = useMemo(() => {
    const blankTemplate = {
      id: 'blank',
      name: 'Projet Vierge',
      description: 'Commencez avec une structure de base sans aucune donnée pré-remplie.',
      icon: 'FilePlus',
      color: 'gray',
      type: 'blank',
      user_id: null
    };
    return [blankTemplate];
  }, []);

  const communityTemplates = useMemo(() => {
    if (!userAndCommunityTemplates) return [];
    return userAndCommunityTemplates.filter(template => 
      template.is_public === 1 && template.user_subscriber_id !== currentUser?.id
    ).map(template => ({
      ...template,
      type: 'community',
      user_id: template.user_subscriber_id
    }));
  }, [userAndCommunityTemplates, currentUser]);

  const myTemplates = useMemo(() => {
    if (!userAndCommunityTemplates || !currentUser?.id) return [];
    return userAndCommunityTemplates.filter(template => 
      template.user_subscriber_id === currentUser.id
    ).map(template => ({
      ...template,
      type: 'personal',
      user_id: currentUser.id
    }));
  }, [userAndCommunityTemplates, currentUser]);

  const filteredTemplates = useMemo(() => {
    let currentList = [];
    switch (activeTab) {
      case 'official': currentList = allOfficialTemplates; break;
      case 'community': currentList = communityTemplates; break;
      case 'my-templates': currentList = myTemplates; break;
      default: currentList = allOfficialTemplates;
    }

    if (!searchTerm.trim()) return currentList;
    const searchLower = searchTerm.toLowerCase();
    return currentList.filter(t =>
      t.name?.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower)
    );
  }, [activeTab, searchTerm, allOfficialTemplates, communityTemplates, myTemplates]);

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Choisissez un modèle</h2>
      <p className="text-gray-600 mb-6">Commencez avec un projet vierge ou choisissez un modèle pour démarrer plus rapidement.</p>

      <TemplateFilters 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <TemplateGrid
        templates={filteredTemplates}
        selectedTemplateId={data.templateId}
        onTemplateSelect={(templateId) => setData(prev => ({ ...prev, templateId }))}
        currentUser={currentUser}
        isLoading={templatesLoading}
      />
    </div>
  );
};

export default TemplateSelectionStep;