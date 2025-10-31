import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  requireAdmin = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  requireAdmin?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (requireAdmin && user.role !== "admin") {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Acceso Denegado</h1>
            <p className="text-muted-foreground">
              No tienes permisos para acceder a esta página
            </p>
            <Redirect to="/" />
          </div>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
