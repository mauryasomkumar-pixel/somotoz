import React from 'react';
import {
  FileText,
  Shield,
  ArrowLeft,
  AlertTriangle,
  UserCheck,
  UserX,
  AlertOctagon,
  Bot,
  Scale,
  Building,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { ViewMode } from '../../types';

interface TermsOfUseProps {
  onNavigate?: (view: ViewMode) => void;
  onBack?: () => void;
}

export const TermsOfUse: React.FC<TermsOfUseProps> = ({ onNavigate, onBack }) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 font-sans">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="text-emerald-500 font-semibold">Terms of Use</span>
          <span>•</span>
          <span className="cursor-pointer hover:underline" onClick={() => onNavigate('privacy')}>
            Privacy Policy
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="p-8 rounded-3xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-4 shadow-sm backdrop-blur-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5" />
          <span>User Agreement</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Terms of Use
        </h1>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Effective Date: November 11, 2026 • Last Updated: November 11, 2026
        </p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Please review these Terms of Use carefully before using <strong>Somotoz</strong>. By creating an account, accessing SomoChat, using Ask AI, or maintaining an active profile on Somotoz, you agree to be bound by these Terms. If you do not agree to these terms, you may not access or use the platform.
        </p>
      </div>

      {/* Core Rules Highlights Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-1.5">
          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 uppercase">
            <UserCheck className="w-4 h-4" /> 18+ Only
          </span>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Strict age restriction. Minor accounts are immediately banned and deleted.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-1.5">
          <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5 uppercase">
            <AlertOctagon className="w-4 h-4" /> Zero Child Harm
          </span>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Zero tolerance for content involving minors or exploitation of any kind.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-1.5">
          <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5 uppercase">
            <Bot className="w-4 h-4" /> No Bots or Spam
          </span>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Automated scripts, mass scraping, fake profiles, and link spam are banned.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-1.5">
          <span className="text-xs font-bold text-blue-500 flex items-center gap-1.5 uppercase">
            <UserX className="w-4 h-4" /> Immediate Suspension
          </span>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Accounts violating platform rules are suspended or banned without warning.
          </p>
        </div>
      </div>

      {/* Detailed Terms Sections */}
      <div className="space-y-6 text-xs text-[var(--text-secondary)] leading-relaxed">
        {/* Section 1 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            1. Eligibility: Mandatory 18+ Age Threshold
          </h2>
          <p>
            Somotoz is an adult-only platform. You must be at least <strong>18 years of age</strong> (or the legal age of majority in your jurisdiction, whichever is greater) to use this service.
          </p>
          <p>
            By creating an account or accessing Somotoz, you represent, warrant, and certify that you are at least 18 years old. You agree to provide an accurate date of birth during registration. Falsification of age constitutes a material breach of these Terms, resulting in immediate account termination.
          </p>
        </section>

        {/* Section 2 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            2. Prohibited Conduct & Community Rules
          </h2>
          <p>
            You agree not to engage in, facilitate, or promote any of the following prohibited behaviors:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-[var(--text-primary)]">Content Involving Minors (Absolute Zero Tolerance):</strong> Any generation, transmission, or depiction of Child Sexual Abuse Material (CSAM), Child Sexual Exploitation and Abuse (CSAE), or grooming is strictly prohibited. Violations result in immediate, permanent ban, preservation of records, and referral to the National Center for Missing & Exploited Children (NCMEC) and law enforcement.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Illegal Content & Unlawful Acts:</strong> You may not use Somotoz for unlawful purposes, to commit fraud, to sell controlled substances, or to plan or execute criminal acts.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Harassment, Stalking, & Hate Speech:</strong> You may not bully, intimidate, stalk, threaten, or harass other users, nor transmit content that demeans individuals based on race, ethnicity, religion, sexual orientation, disability, or gender.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Bots, Scrapers, & Automation:</strong> You may not deploy automated bots, web scrapers, crawlers, flood bots, or automated request generators against our web application or backend APIs.
            </li>
            <li>
              <strong className="text-[var(--text-primary)]">Impersonation & Deception:</strong> You may not impersonate any person, brand, creator, or Somotoz representative, nor misrepresent your affiliation with any entity.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <UserX className="w-4 h-4 text-amber-500" />
            3. Account Suspension & Termination for Violations
          </h2>
          <p>
            Somotoz enforces a proactive trust and safety program. We reserve the absolute right, without prior notice or liability, to:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Suspend, freeze, or terminate your account and revoke your access to Somotoz services for any violation of these Terms.</li>
            <li>Dismiss or enforce user reports submitted through our community reporting tools.</li>
            <li>Revoke active authorization tokens immediately upon detecting abuse or credential compromise.</li>
          </ul>
          <p>
            Decisions to suspend or ban accounts are recorded in administrative audit logs with a mandatory moderator note. Terminated accounts forfeit access to all associated feature credentials.
          </p>
        </section>

        {/* Section 4 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            4. Consent-Driven Social Interactions & User Controls
          </h2>
          <p>
            SomoChat operates under a strict consent model:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong>Connection Requests:</strong> You cannot send messages or initiate voice/video calls with another user until they have explicitly accepted your connection request.
            </li>
            <li>
              <strong>Block & Report:</strong> You maintain the unconditional right to block any user at any time. Blocking instantly severs conversation channels and prevents incoming contact. You may file conduct reports attaching up to the last 20 messages for moderator review.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-500" />
            5. Disclaimers & Limitation of Liability
          </h2>
          <p>
            Somotoz is provided on an "AS IS" and "AS AVAILABLE" basis. While our AI reflection features offer mindful and introspective prompts, <strong>Somotoz does not provide medical, psychological, psychiatric, or professional healthcare advice</strong>. Never disregard professional medical advice because of content generated within the application.
          </p>
          <p>
            To the maximum extent permitted by applicable law, Somotoz, its developers, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your access to or inability to use the platform.
          </p>
        </section>

        {/* Section 6 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" />
              6. Grievance Redressal & Contact Information
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              If you have any grievances, inquiries, or legal concerns regarding these Terms of Use:
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-2 text-xs">
            <p><strong>Grievance Officer:</strong> Som Maurya</p>
            <p><strong>Trust & Safety Organization:</strong> Somotoz Legal & Compliance Operations</p>
            <p><strong>Email:</strong> <a href="mailto:grievance@somotoz.ai" className="text-emerald-500 hover:underline">grievance@somotoz.ai</a></p>
            <p><strong>Administrative Contact:</strong> <a href="mailto:mauryasomkumar@gmail.com" className="text-emerald-500 hover:underline">mauryasomkumar@gmail.com</a></p>
            <p><strong>Notice Turnaround:</strong> Inquiries are acknowledged within 24-48 hours. Formal disputes are addressed in accordance with platform mediation procedures.</p>
          </div>
        </section>
      </div>

      {/* Footer Return Link */}
      <div className="pt-4 text-center">
        <button
          onClick={handleBack}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition shadow-md"
        >
          Return to Somotoz
        </button>
      </div>
    </div>
  );
};
