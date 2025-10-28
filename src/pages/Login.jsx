import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { useAuth } from '../components/context/AuthContext';

const AuthPage = ({ mode: initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirm: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const { login, register, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;

      if (mode === 'signup') {
        result = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.password_confirm
        );
      } else {
        result = await login(formData.email, formData.password);
      }

      if (result.success) {
        // Redirection après succès
        navigate('/client/dashboard');
      } else {
        // L'erreur est déjà gérée dans le contexte
        console.error('Erreur:', result.message);
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const switchMode = () => {
    setMode(mode === 'signup' ? 'login' : 'signup');
    // Réinitialiser les erreurs lors du changement de mode
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirm: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </button>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TrezoCash
              </span>
            </div>
            <CardTitle className="text-2xl">
              {mode === 'signup' ? 'Créer un compte' : 'Connexion'}
            </CardTitle>
            <CardDescription>
              {mode === 'signup'
                ? 'Commencez à gérer votre trésorerie gratuitement'
                : 'Connectez-vous à votre compte'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Affichage des erreurs */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Jean Dupont"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      minLength={2}
                      maxLength={200}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="vous@exemple.fr"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    minLength={8}
                  />
                </div>
                {mode === 'signup' && (
                  <p className="text-xs text-gray-500">Minimum 8 caractères</p>
                )}
              </div>

              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="password_confirm">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password_confirm"
                      name="password_confirm"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password_confirm}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Chargement...' :
                  mode === 'signup' ? 'Créer mon compte' : 'Se connecter'
                }
              </Button>
            </form>

            {/* Social Login (optionnel) */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button variant="outline" type="button" disabled>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" type="button" disabled>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  GitHub
                </Button>
              </div>
            </div>

            {/* Toggle mode - Mettre l'accent sur la création de compte */}
            <div className="mt-6 text-center text-sm">
              {mode === 'signup' ? (
                <p className="text-gray-600">
                  Vous avez déjà un compte ?{' '}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Se connecter
                  </button>
                </p>
              ) : (
                <p className="text-gray-600">
                  Pas encore de compte ?{' '}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Créer un compte gratuitement
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          En continuant, vous acceptez les{' '}
          <a href="#" className="text-blue-600 hover:underline">Conditions d'utilisation</a>
          {' '}et la{' '}
          <a href="#" className="text-blue-600 hover:underline">Politique de confidentialité</a>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;