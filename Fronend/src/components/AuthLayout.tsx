import type { ReactNode } from "react";
import logo from "../assets/brand/logo-onlight.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand">
          <img src={logo} alt="ABOFIT" />
          <span className="brand-sub">Portal de entrenamiento</span>
        </div>
        {children}
      </div>
    </div>
  );
}
