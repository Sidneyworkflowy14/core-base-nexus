import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export default function AuthPage() {
  const { user, loading, signIn, signUp, resetPassword, signOut } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hash);
    const type = params.get('type');
    if (type === 'recovery') {
      setRecoveryMode(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (user && !recoveryMode) {
    return <Navigate to="/select-tenant" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Email ou senha incorretos.');
          } else {
            setError(error.message);
          }
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            setError('Este email já está cadastrado.');
          } else {
            setError(error.message);
          }
        } else {
          setMessage('Conta criada! Verifique seu email para confirmar.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setMessage(null);

    if (!email) {
      setError('Informe seu email para recuperar a senha.');
      return;
    }

    setSubmitting(true);
    const { error } = await resetPassword(email);
    if (error) {
      setError(error.message);
    } else {
      setMessage('Enviamos um link de recuperação para seu email.');
    }
    setSubmitting(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }

    setMessage('Senha atualizada! Faça login novamente.');
    setNewPassword('');
    setConfirmPassword('');
    setRecoveryMode(false);
    await signOut();
    setIsLogin(true);
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <img src="/workflowy.png" alt="Logo" className="h-16 w-auto" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{recoveryMode ? 'Redefinir senha' : isLogin ? 'Entrar' : 'Criar conta'}</CardTitle>
          <CardDescription>
            {recoveryMode
              ? 'Escolha uma nova senha para sua conta'
              : isLogin
              ? 'Entre com seu email e senha'
              : 'Crie uma nova conta para acessar o sistema'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recoveryMode ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                  {message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Aguarde...' : 'Atualizar senha'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-primary underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                  {message}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}
              </Button>
            </form>
          )}

          {!recoveryMode && (
            <div className="mt-4 text-center text-sm">
              {isLogin ? (
                <p>
                  Não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-primary underline"
                  >
                    Criar conta
                  </button>
                </p>
              ) : (
                <p>
                  Já tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-primary underline"
                  >
                    Entrar
                  </button>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
