import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Sparkles, Users, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    name: "",
    role: "student",
  });

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Tutor IA</h1>
            <p className="text-muted-foreground mt-2">
              Aprende sobre Inteligencia Artificial de forma divertida
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">
                Registrarse
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Iniciar Sesión</CardTitle>
                  <CardDescription>
                    Ingresa tus credenciales para acceder
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Usuario</Label>
                      <Input
                        id="login-username"
                        data-testid="input-login-username"
                        placeholder="tu-usuario"
                        value={loginData.username}
                        onChange={(e) =>
                          setLoginData({ ...loginData, username: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <Input
                        id="login-password"
                        data-testid="input-login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({ ...loginData, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      data-testid="button-login-submit"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Iniciando..." : "Iniciar Sesión"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Crear Cuenta</CardTitle>
                  <CardDescription>
                    Regístrate para comenzar a aprender
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nombre</Label>
                      <Input
                        id="register-name"
                        data-testid="input-register-name"
                        placeholder="Tu nombre completo"
                        value={registerData.name}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Usuario</Label>
                      <Input
                        id="register-username"
                        data-testid="input-register-username"
                        placeholder="elige-un-usuario"
                        value={registerData.username}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, username: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Contraseña</Label>
                      <Input
                        id="register-password"
                        data-testid="input-register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-role">Tipo de Cuenta</Label>
                      <Select
                        value={registerData.role}
                        onValueChange={(value) =>
                          setRegisterData({ ...registerData, role: value })
                        }
                      >
                        <SelectTrigger id="register-role" data-testid="select-register-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student" data-testid="option-role-student">
                            Alumno
                          </SelectItem>
                          <SelectItem value="admin" data-testid="option-role-admin">
                            Administrador
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      data-testid="button-register-submit"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creando cuenta..." : "Crear Cuenta"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-lg space-y-8"
        >
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Descubre el mundo de la Inteligencia Artificial
            </h2>
            <p className="text-lg text-muted-foreground">
              Aprende sobre OpenAI y Gemini de forma interactiva y divertida
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Lecciones Interactivas</h3>
                <p className="text-sm text-muted-foreground">
                  Aprende con quizzes, imágenes y actividades dinámicas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Tutor IA Personal</h3>
                <p className="text-sm text-muted-foreground">
                  Pregunta lo que quieras a Profe DANA, tu asistente virtual
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Aprende a tu Ritmo</h3>
                <p className="text-sm text-muted-foreground">
                  Contenido adaptado para niños de 7 a 9 años
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Para Educadores</h3>
                <p className="text-sm text-muted-foreground">
                  Crea y gestiona lecciones personalizadas
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
