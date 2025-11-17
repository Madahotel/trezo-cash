import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DollarSign, Mail, Lock, User, ArrowLeft, Gift } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/Label';
import { useAuth } from '../components/context/AuthContext';

const AuthPage = ({ mode: initialMode = 'login' }) => {
  const navigate = useNavigate();
  const { login, register, error } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");

  // 🧩 Si un ref est présent, on force le mode signup par défaut
  const [mode, setMode] = useState(referralCode ? 'signup' : initialMode);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirm: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Afficher un message de bienvenue si code parrain présent
  useEffect(() => {
    if (referralCode) {
      console.log("🎁 Code de parrainage détecté:", referralCode);
    }
  }, [referralCode]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;

      if (mode === 'signup') {
        console.log("📝 Inscription avec code parrain:", referralCode);
        // Passer le code de parrainage à la fonction register
        result = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.password_confirm,
          referralCode // Sera ajouté dans l'URL par la fonction register
        );
      } else {
        result = await login(formData.email, formData.password);
      }

      if (result.success) {
        navigate('/client/projets');
      } else {
        console.error('Erreur:', result.message);
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    // Si on a un code de parrainage et qu'on bascule vers login, on prévient l'utilisateur
    if (referralCode && mode === 'signup') {
      const confirm = window.confirm(
        "Vous avez un code de parrainage. En vous connectant, vous ne pourrez pas l'utiliser. Voulez-vous continuer ?"
      );
      if (!confirm) return;
    }

    setMode(mode === 'signup' ? 'login' : 'signup');
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirm: ''
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        {/* Retour à l'accueil */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center mb-6 text-gray-600 transition hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </button>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4 space-x-2">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                TrezoCash
              </span>
            </div>
            <CardTitle className="text-2xl">
              {mode === 'signup' ? 'Créer un compte' : 'Connexion'}
            </CardTitle>
            <CardDescription>
              {mode === 'signup'
                ? 'Commencez à gérer votre trésorerie gratuitement'
                : 'Connectez-vous à votre compte'}
            </CardDescription>

            {/* Badge code parrain */}
            {referralCode && mode === 'signup' && (
              <div className="flex items-center justify-center gap-2 p-3 mt-4 border border-green-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
                <Gift className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Inscription via un code parrain !
                </span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Affichage des erreurs */}
            {error && (
              <div className="p-3 mb-4 border border-red-200 rounded-md bg-red-50">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  {/* Champ nom */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
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

                  {/* Champ code parrain (lecture seule si présent dans l'URL) */}
                  {referralCode && (
                    <div className="space-y-2">
                      <Label htmlFor="referralCode" className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-green-600" />
                        Code parrain
                      </Label>
                      <Input
                        id="referralCode"
                        type="text"
                        value={referralCode}
                        readOnly
                        className="font-mono font-semibold text-green-700 border-green-200 cursor-not-allowed bg-green-50"
                      />
                      <p className="text-xs text-green-600">
                        ✓ Vous bénéficierez des avantages du parrainage
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Champ email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
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

              {/* Champ mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
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

              {/* Confirmation du mot de passe */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="password_confirm">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
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

              {/* Bouton principal */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? 'Chargement...'
                  : mode === 'signup'
                    ? referralCode ? 'Créer mon compte avec parrainage' : 'Créer mon compte'
                    : 'Se connecter'}
              </Button>
            </form>

            {/* Bascule entre login/signup */}
            <div className="mt-6 text-sm text-center">
              {mode === 'signup' ? (
                <p className="text-gray-600">
                  Vous avez déjà un compte ?{' '}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="font-medium text-blue-600 hover:underline"
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
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Créer un compte gratuitement
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-xs text-center text-gray-500">
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