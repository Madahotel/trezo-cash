import React, { useState, useMemo, useEffect } from 'react';
import { Search, Star, Users, LayoutTemplate } from 'lucide-react';
import TemplateGrid from '../TemplateGrid';
import TemplateFilters from '../TemplateFilters';
import axios from '../../../../components/config/Axios'; // Utilisez votre instance configurée

const TemplateSelectionStep = ({
  data,
  setData,
  currentUser,
  templatesLoading
}) => {
  const [activeTab, setActiveTab] = useState('official');
  const [searchTerm, setSearchTerm] = useState('');
  const [allTemplates, setAllTemplates] = useState({
    officials: [],
    personals: [],
    communities: []
  });
  const [loading, setLoading] = useState(true);

  // Récupérer TOUS les templates au chargement
  useEffect(() => {
    const fetchAllTemplates = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/templates');
        
        console.log('📡 Réponse API templates:', response.data); // Pour debug
        
        if (response.data.status === 200) {
          const templates = response.data.templates;
          setAllTemplates({
            officials: templates?.officials?.template_official_items?.data || [],
            personals: templates?.personals?.template_personal_items?.data || [],
            communities: templates?.communities?.template_community_items?.data || []
          });
          
          console.log('📦 Templates officiels:', templates?.officials?.template_official_items?.data); // Pour debug
        }
      } catch (error) {
        console.error('Erreur lors du chargement des templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTemplates();
  }, []);

  // Templates officiels (avec template vierge)
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

    // Transformer les templates officiels pour correspondre à votre structure
    const formattedOfficials = allTemplates.officials.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      color: template.color,
      type: 'official',
      user_id: template.user_subscriber_id,
      is_public: template.is_public,
      template_type_id: template.template_type_id,
      user_full_name: template.user_full_name // Inclure le nom complet
    }));

    console.log('✨ Templates officiels formatés:', formattedOfficials); // Pour debug
    
    return [blankTemplate, ...formattedOfficials];
  }, [allTemplates.officials]);

  // Templates communautaires
  const communityTemplates = useMemo(() => {
    return allTemplates.communities.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      color: template.color,
      type: 'community',
      user_id: template.user_subscriber_id,
      is_public: template.is_public,
      template_type_id: template.template_type_id,
      user_full_name: template.user_full_name
    }));
  }, [allTemplates.communities]);

  // Templates personnels de l'utilisateur
  const myTemplates = useMemo(() => {
    if (!currentUser?.id) return [];
    
    return allTemplates.personals
      .filter(template => template.user_subscriber_id === currentUser.id)
      .map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        type: 'personal',
        user_id: currentUser.id,
        is_public: template.is_public,
        template_type_id: template.template_type_id,
        user_full_name: template.user_full_name
      }));
  }, [allTemplates.personals, currentUser]);

  const filteredTemplates = useMemo(() => {
    let currentList = [];
    
    console.log(`🔍 Onglet actif: ${activeTab}`); // Pour debug
    
    switch (activeTab) {
      case 'official': 
        currentList = allOfficialTemplates; 
        console.log('📋 Templates officiels disponibles:', currentList);
        break;
      case 'community': 
        currentList = communityTemplates; 
        break;
      case 'my-templates': 
        currentList = myTemplates; 
        break;
      default: 
        currentList = allOfficialTemplates;
    }

    if (!searchTerm.trim()) return currentList;
    
    const searchLower = searchTerm.toLowerCase();
    return currentList.filter(t =>
      t.name?.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower)
    );
  }, [activeTab, searchTerm, allOfficialTemplates, communityTemplates, myTemplates]);

  // Debug: vérifier ce qui est affiché
  console.log('🎯 Templates à afficher:', {
    activeTab,
    filteredCount: filteredTemplates.length,
    filtered: filteredTemplates
  });

  return (
    <div className="text-center">
      <h2 className="mb-2 text-2xl font-bold text-gray-800">Choisissez un modèle</h2>
      <p className="mb-6 text-gray-600">Commencez avec un projet vierge ou choisissez un modèle pour démarrer plus rapidement.</p>

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
        isLoading={loading || templatesLoading}
      />
    </div>
  );
};

export default TemplateSelectionStep;