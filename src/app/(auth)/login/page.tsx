import { Suspense } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Excellent Motors account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
        <div className="mt-6 rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground/80">Demo logins (password: password123)</p>
          <p className="mt-1">customer@example.com · admin@excellentmotors.pk · cashier@excellentmotors.pk</p>
        </div>
      </CardContent>
    </Card>
  );
}
