import React, { useState } from 'react';
import { Lock, Crown } from 'lucide-react';

interface FeatureGateProps {
  allowed: boolean;
  title: string;
  description: string;
  children: React.ReactNode;
}

const FeatureGate: React.FC<FeatureGateProps> = ({ allowed, title, description, children }) => {
  const [showPricing, setShowPricing] = useState(false);

  if (allowed) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-10 text-center animate-fade-in-up">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-muted border border-border">
        <Lock size={32} className="text-muted-foreground" />
      </div>
      <h2 className="text-xl font-extrabold mb-2 text-foreground">{title}</h2>
      <p className="text-sm mb-6 max-w-xs leading-relaxed text-muted-foreground">{description}</p>
      <button
        onClick={() => setShowPricing(!showPricing)}
        className="btn btn-primary px-6 py-3 text-sm font-bold"
      >
        <Crown size={16} />
        Ver planos Premium
      </button>
      <p className="text-xs mt-3 text-neutral-400">7 dias grátis · Cancele quando quiser</p>
    </div>
  );
};

export default FeatureGate;
