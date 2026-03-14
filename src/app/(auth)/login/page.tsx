import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Sign In | SplitSend",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card p-8 shadow-card animate-pulse h-64" />}>
      <LoginForm />
    </Suspense>
  );
}
