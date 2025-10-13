import { 
  Building2, 
  Briefcase, 
  BarChart3, 
  Users,
  Leaf, 
  TreePine, 
  Flower2, 
  Sprout,
  Waves, 
  Fish, 
  Shell, 
  Anchor,
  Sun, 
  Flame, 
  Heart, 
  Star,
  Sparkles, 
  Moon, 
  Rocket, 
  Orbit,
  Crown, 
  Diamond, 
  Award, 
  Shield,
  Cherry, 
  Flower, 
  Wind,
  Gem, 
  Hexagon, 
  Triangle
} from 'lucide-react';

// Theme service for managing design themes and visual customization
class ThemeService {
  constructor() {
    this.currentTheme = this.loadCurrentTheme();
    this.themes = this.initializeThemes();
  }

  // Initialize all 8 design themes
  initializeThemes() {
    return {
      'classique-business': {
        id: 'classique-business',
        name: 'Classique Business',
        description: 'Design professionnel moderne avec tons bleus et gris',
        category: 'Professionnel',
        preview: '#2563eb',
        colors: {
          primary: '#2563eb',
          primaryHover: '#1d4ed8',
          primaryLight: '#3b82f6',
          secondary: '#64748b',
          secondaryLight: '#94a3b8',
          accent: '#8b5cf6',
          background: '#ffffff',
          backgroundSecondary: '#f8fafc',
          backgroundTertiary: '#f1f5f9',
          text: '#1e293b',
          textSecondary: '#64748b',
          textLight: '#94a3b8',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          border: '#e2e8f0',
          borderLight: '#f1f5f9'
        },
        icons: {
          project: Building2,
          dashboard: BarChart3,
          budget: Briefcase,
          collaborators: Users,
          primary: Building2
        }
      },

      'nature-zen': {
        id: 'nature-zen',
        name: 'Nature Zen',
        description: 'Harmonie naturelle avec verts apaisants et tons terre',
        category: 'Nature',
        preview: '#22c55e',
        colors: {
          primary: '#22c55e',
          primaryHover: '#16a34a',
          primaryLight: '#4ade80',
          secondary: '#8b5a3c',
          secondaryLight: '#a3a3a3',
          accent: '#84cc16',
          background: '#ffffff',
          backgroundSecondary: '#f0fdf4',
          backgroundTertiary: '#ecfdf5',
          text: '#1e293b',
          textSecondary: '#4b5563',
          textLight: '#6b7280',
          success: '#22c55e',
          warning: '#eab308',
          error: '#dc2626',
          border: '#d1fae5',
          borderLight: '#ecfdf5'
        },
        icons: {
          project: TreePine,
          dashboard: Leaf,
          budget: Sprout,
          collaborators: Flower2,
          primary: Leaf
        }
      },

      'ocean-profond': {
        id: 'ocean-profond',
        name: 'Océan Profond',
        description: 'Fraîcheur marine avec bleus océan et turquoise',
        category: 'Aquatique',
        preview: '#0ea5e9',
        colors: {
          primary: '#0ea5e9',
          primaryHover: '#0284c7',
          primaryLight: '#38bdf8',
          secondary: '#06b6d4',
          secondaryLight: '#67e8f9',
          accent: '#1e40af',
          background: '#ffffff',
          backgroundSecondary: '#f0f9ff',
          backgroundTertiary: '#e0f2fe',
          text: '#1e293b',
          textSecondary: '#475569',
          textLight: '#64748b',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          border: '#bae6fd',
          borderLight: '#e0f2fe'
        },
        icons: {
          project: Anchor,
          dashboard: Waves,
          budget: Shell,
          collaborators: Fish,
          primary: Waves
        }
      },

      'sunset-chaleureux': {
        id: 'sunset-chaleureux',
        name: 'Sunset Chaleureux',
        description: 'Énergie chaleureuse avec oranges et dorés du coucher de soleil',
        category: 'Énergique',
        preview: '#ea580c',
        colors: {
          primary: '#ea580c',
          primaryHover: '#dc2626',
          primaryLight: '#fb7185',
          secondary: '#f59e0b',
          secondaryLight: '#fbbf24',
          accent: '#eab308',
          background: '#ffffff',
          backgroundSecondary: '#fff7ed',
          backgroundTertiary: '#ffedd5',
          text: '#1e293b',
          textSecondary: '#92400e',
          textLight: '#a16207',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#dc2626',
          border: '#fed7aa',
          borderLight: '#ffedd5'
        },
        icons: {
          project: Sun,
          dashboard: Flame,
          budget: Star,
          collaborators: Heart,
          primary: Sun
        }
      },

      'cosmos-mystique': {
        id: 'cosmos-mystique',
        name: 'Cosmos Mystique',
        description: 'Mystère de l\'espace avec violets profonds et indigos',
        category: 'Futuriste',
        preview: '#7c3aed',
        colors: {
          primary: '#7c3aed',
          primaryHover: '#6d28d9',
          primaryLight: '#a78bfa',
          secondary: '#4f46e5',
          secondaryLight: '#818cf8',
          accent: '#581c87',
          background: '#ffffff',
          backgroundSecondary: '#faf5ff',
          backgroundTertiary: '#f3e8ff',
          text: '#1e293b',
          textSecondary: '#581c87',
          textLight: '#7c2d12',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#dc2626',
          border: '#c4b5fd',
          borderLight: '#f3e8ff'
        },
        icons: {
          project: Rocket,
          dashboard: Sparkles,
          budget: Moon,
          collaborators: Orbit,
          primary: Sparkles
        }
      },

      'elegance-luxe': {
        id: 'elegance-luxe',
        name: 'Élégance Luxe',
        description: 'Sophistication premium avec noirs profonds et dorés',
        category: 'Premium',
        preview: '#1f2937',
        colors: {
          primary: '#1f2937',
          primaryHover: '#111827',
          primaryLight: '#374151',
          secondary: '#f59e0b',
          secondaryLight: '#fbbf24',
          accent: '#6b7280',
          background: '#ffffff',
          backgroundSecondary: '#f9fafb',
          backgroundTertiary: '#f3f4f6',
          text: '#1f2937',
          textSecondary: '#4b5563',
          textLight: '#6b7280',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#dc2626',
          border: '#e5e7eb',
          borderLight: '#f3f4f6'
        },
        icons: {
          project: Crown,
          dashboard: Diamond,
          budget: Award,
          collaborators: Shield,
          primary: Crown
        }
      },

      'sakura-delicat': {
        id: 'sakura-delicat',
        name: 'Sakura Délicat',
        description: 'Douceur japonaise avec roses poudrés et blancs rosés',
        category: 'Zen',
        preview: '#f472b6',
        colors: {
          primary: '#f472b6',
          primaryHover: '#ec4899',
          primaryLight: '#f9a8d4',
          secondary: '#fdf2f8',
          secondaryLight: '#fce7f3',
          accent: '#ec4899',
          background: '#ffffff',
          backgroundSecondary: '#fdf2f8',
          backgroundTertiary: '#fce7f3',
          text: '#1e293b',
          textSecondary: '#be185d',
          textLight: '#db2777',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#dc2626',
          border: '#f9a8d4',
          borderLight: '#fce7f3'
        },
        icons: {
          project: Cherry,
          dashboard: Flower,
          budget: Wind,
          collaborators: Heart,
          primary: Cherry
        }
      },

      'emeraude-precieux': {
        id: 'emeraude-precieux',
        name: 'Émeraude Précieux',
        description: 'Raffinement précieux avec verts émeraude et mints',
        category: 'Précieux',
        preview: '#10b981',
        colors: {
          primary: '#10b981',
          primaryHover: '#059669',
          primaryLight: '#34d399',
          secondary: '#6ee7b7',
          secondaryLight: '#a7f3d0',
          accent: '#047857',
          background: '#ffffff',
          backgroundSecondary: '#ecfdf5',
          backgroundTertiary: '#d1fae5',
          text: '#1e293b',
          textSecondary: '#047857',
          textLight: '#065f46',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#dc2626',
          border: '#a7f3d0',
          borderLight: '#d1fae5'
        },
        icons: {
          project: Gem,
          dashboard: Hexagon,
          budget: Triangle,
          collaborators: Gem,
          primary: Gem
        }
      }
    };
  }

  // Get all available themes
  getAllThemes() {
    return Object.values(this.themes);
  }

  // Get theme by ID
  getThemeById(themeId) {
    return this.themes[themeId] || this.themes['classique-business'];
  }

  // Get current theme
  getCurrentTheme() {
    return this.getThemeById(this.currentTheme);
  }

  // Set current theme
  setCurrentTheme(themeId) {
    if (this.themes[themeId]) {
      this.currentTheme = themeId;
      this.saveCurrentTheme();
      this.applyTheme(themeId);
      return true;
    }
    return false;
  }

  // Apply theme to CSS variables
  applyTheme(themeId) {
    const theme = this.getThemeById(themeId);
    const root = document.documentElement;

    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply theme class to body for icon switching
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeId}`);
    
    // Trigger custom event for components that need to update icons
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { themeId, theme }
    }));
  }

  // Get theme categories
  getThemeCategories() {
    const categories = [...new Set(this.getAllThemes().map(theme => theme.category))];
    return categories.map(category => ({
      name: category,
      themes: this.getAllThemes().filter(theme => theme.category === category)
    }));
  }

  // Get theme icon for specific context
  getThemeIcon(context, themeId = null) {
    const theme = themeId ? this.getThemeById(themeId) : this.getCurrentTheme();
    return theme.icons[context] || theme.icons.primary;
  }

  // Generate CSS variables for theme
  generateCSSVariables(themeId) {
    const theme = this.getThemeById(themeId);
    let css = ':root {\n';
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      css += `  --color-${key}: ${value};\n`;
    });
    
    css += '}\n';
    return css;
  }

  // Preview theme (temporarily apply without saving)
  previewTheme(themeId) {
    const theme = this.getThemeById(themeId);
    const root = document.documentElement;

    // Temporarily apply colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Return cleanup function
    return () => {
      this.applyTheme(this.currentTheme);
    };
  }

  // Get theme-specific styling classes
  getThemeClasses(themeId = null) {
    const theme = themeId ? this.getThemeById(themeId) : this.getCurrentTheme();
    
    return {
      primary: `bg-[${theme.colors.primary}] text-white hover:bg-[${theme.colors.primaryHover}]`,
      secondary: `bg-[${theme.colors.secondary}] text-white hover:bg-[${theme.colors.secondaryLight}]`,
      backgroundMain: `bg-[${theme.colors.background}]`,
      backgroundSecondary: `bg-[${theme.colors.backgroundSecondary}]`,
      textPrimary: `text-[${theme.colors.text}]`,
      textSecondary: `text-[${theme.colors.textSecondary}]`,
      border: `border-[${theme.colors.border}]`
    };
  }

  // Check if theme supports dark mode
  isDarkTheme(themeId = null) {
    const theme = themeId ? this.getThemeById(themeId) : this.getCurrentTheme();
    return theme.id === 'elegance-luxe' || theme.id === 'cosmos-mystique';
  }

  // Get recommended themes for user type
  getRecommendedThemes(userType = 'business') {
    const recommendations = {
      business: ['classique-business', 'elegance-luxe', 'emeraude-precieux'],
      personal: ['nature-zen', 'sakura-delicat', 'ocean-profond'],
      creative: ['cosmos-mystique', 'sunset-chaleureux', 'sakura-delicat']
    };

    return recommendations[userType] || recommendations.business;
  }

  // Save current theme to localStorage
  saveCurrentTheme() {
    try {
      localStorage.setItem('currentTheme', this.currentTheme);
    } catch (error) {
      console.error('Error saving current theme:', error);
    }
  }

  // Load current theme from localStorage
  loadCurrentTheme() {
    try {
      return localStorage.getItem('currentTheme') || 'classique-business';
    } catch (error) {
      console.error('Error loading current theme:', error);
      return 'classique-business';
    }
  }

  // Export theme settings
  exportThemeSettings() {
    return {
      currentTheme: this.currentTheme,
      customizations: this.getCustomizations(),
      exportDate: new Date().toISOString()
    };
  }

  // Get any custom theme modifications
  getCustomizations() {
    try {
      const saved = localStorage.getItem('themeCustomizations');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      return {};
    }
  }

  // Apply theme customizations
  applyCustomizations(customizations) {
    try {
      localStorage.setItem('themeCustomizations', JSON.stringify(customizations));
      // Apply any custom CSS overrides
      this.applyCustomCSS(customizations);
    } catch (error) {
      console.error('Error applying customizations:', error);
    }
  }

  // Apply custom CSS overrides
  applyCustomCSS(customizations) {
    // Remove existing custom styles
    const existing = document.getElementById('theme-customizations');
    if (existing) existing.remove();

    // Create new style element with customizations
    const style = document.createElement('style');
    style.id = 'theme-customizations';
    style.textContent = this.generateCustomCSS(customizations);
    document.head.appendChild(style);
  }

  // Generate custom CSS from customizations
  generateCustomCSS(customizations) {
    let css = '';
    
    if (customizations.colors) {
      css += ':root {\n';
      Object.entries(customizations.colors).forEach(([key, value]) => {
        css += `  --color-${key}: ${value};\n`;
      });
      css += '}\n';
    }

    return css;
  }

  // Initialize theme on page load
  initializeTheme() {
    this.applyTheme(this.currentTheme);
  }
}

// Create and export singleton instance
export const themeService = new ThemeService();
export default themeService;