import React from 'react';
import {
  Shield,
  Lock,
  ArrowLeft,
  Database,
  Cpu,
  Clock,
  EyeOff,
  Scale,
  Mail,
  UserCheck,
  Download,
  Trash2,
  AlertTriangle,
  FileText,
  Building,
} from 'lucide-react';
import { ViewMode } from '../../types';

interface PrivacyPolicyProps {
  onNavigate?: (view: ViewMode) => void;
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onNavigate, onBack }) => {
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
          <span className="cursor-pointer hover:underline" onClick={() => onNavigate('terms')}>
            Terms of Use
          </span>
          <span>•</span>
          <span className="text-emerald-500 font-semibold">Privacy Policy</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="p-8 rounded-3xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-4 shadow-sm backdrop-blur-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" />
          <span>Official Privacy Policy</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Effective Date: November 11, 2026 • Last Updated: November 11, 2026
        </p>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Welcome to <strong>Somotoz</strong>. This Privacy Policy details how we collect, process, store, retain, and protect your information across our mindful journaling suite, Ask AI multimodal workspace, and SomoChat real-time messaging platform. We believe in absolute transparency: we describe exactly what the platform does without exaggerated claims.
        </p>
      </div>

      {/* Key Architectural Disclosures Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-2">
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase">
            <UserCheck className="w-4 h-4" />
            <span>18+ Adults Only</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Strict age verification is required at registration. Users under 18 are not permitted on the platform.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-2">
          <div className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase">
            <Database className="w-4 h-4" />
            <span>Server-Stored Chats</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Messages are stored securely on cloud servers and are <strong>not end-to-end encrypted</strong>.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-2">
          <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase">
            <Clock className="w-4 h-4" />
            <span>90-Day Retention</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Deleted messages and accounts scheduled for deletion are permanently purged after 90 days.
          </p>
        </div>
      </div>

      {/* Policy Sections */}
      <div className="space-y-6 text-xs text-[var(--text-secondary)] leading-relaxed">
        {/* Section 1 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            1. Strict Adults-Only Policy (Minimum Age 18)
          </h2>
          <p>
            Somotoz is designed exclusively for adults. You must be at least 18 years old to create an account, access SomoChat, or use any interactive features.
          </p>
          <p>
            During account registration, you are required to submit your Date of Birth (DOB). Anyone under the age of 18 is prohibited from completing registration. We do not knowingly solicit or collect personal information from individuals under 18. If we discover or receive an underage report concerning an account, that account is immediately frozen and scheduled for permanent deletion.
          </p>
        </section>

        {/* Section 2 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            2. How SomoChat Messages Are Stored (Server-Stored, Not End-to-End Encrypted)
          </h2>
          <p>
            In transparency to our users: <strong>SomoChat communications are stored on secure cloud servers and are NOT end-to-end encrypted (E2EE).</strong>
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong>Storage Location:</strong> Real-time messages, media links, voice note audio files, and stickers are stored on Google Cloud Firestore and Google Cloud Storage.
            </li>
            <li>
              <strong>Transit & Rest Encryption:</strong> Data is encrypted in transit using industry-standard TLS 1.3 cryptographic protocols and encrypted at rest using Google Cloud AES-256 keys.
            </li>
            <li>
              <strong>Disappearing Messages:</strong> Disappearing messages are automatically made invisible to recipient clients once their timer expires, and are removed from operational servers following our 90-day retention schedule.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            3. AI Multimodal Processing via Google Gemini
          </h2>
          <p>
            Somotoz incorporates Google Gemini AI models to power interactive features:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong>Mindful Reflection Studio:</strong> When you request an AI reflection on a journal entry, the entry text is sent to the Gemini API to generate supportive takeaways, mood tags, and conversational guidance.
            </li>
            <li>
              <strong>Ask AI Chat Companion:</strong> Questions and chat prompts are processed in real-time by Gemini models (including `gemini-3.6-flash` and `gemini-3.1-flash-lite`).
            </li>
            <li>
              <strong>Audio Transcription:</strong> When you record voice notes or dictate thoughts, audio data is sent to Gemini for punctuated speech-to-text transcription.
            </li>
            <li>
              <strong>Wisdom Explorer:</strong> Philosophical searches query Gemini with Google Search Grounding to return factual citations and perspectives.
            </li>
          </ul>
          <p>
            Our server-side architecture logs only metadata (user UID, timestamp, token count, feature name, and success status) into audit logs. <strong>Raw user prompts and private journal texts are never stored in admin telemetry logs.</strong>
          </p>
        </section>

        {/* Section 4 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            4. 90-Day Retention Schedule After Deletion
          </h2>
          <p>
            We implement a strict, automated 90-day data retention standard:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong>Soft-Deleted Messages:</strong> When you delete a message in SomoChat, it is marked with a deletion timestamp (`deletedAt`) and disappears from client conversation screens immediately. It is retained on backend servers for up to 90 days for safety and legal compliance, after which automated background cleanup jobs permanently erase it.
            </li>
            <li>
              <strong>Expired Disappearing Messages:</strong> Disappearing messages are permanently purged from database records once 90 days have elapsed after their expiration.
            </li>
            <li>
              <strong>Account Deletion:</strong> When you request account deletion in Settings, your account is placed into a 30-day grace/schedule period, followed by permanent purging from all database collections within 90 days.
            </li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-emerald-500" />
            5. Strict Administrative Access Boundaries (Zero Chat Viewer)
          </h2>
          <p>
            Somotoz is engineered with constitutional safeguards that protect personal communications:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong>No Chat or Journal Browsing:</strong> Platform administrators have <strong>no client interface, tool, or database viewer</strong> to browse private conversations, chat history, or personal journal entries.
            </li>
            <li>
              <strong>Reported Content Only:</strong> When a user reports conduct or harassment in SomoChat, the reporter may attach up to the last 20 messages from that conversation. Platform moderators can view <em>only those specifically attached messages</em> to evaluate the incident.
            </li>
            <li>
              <strong>5-Minute Re-Authentication Gate:</strong> All administrative moderation actions require cryptographic re-authentication via Google within the preceding 300 seconds (5 minutes) and require a mandatory explanatory note recorded in immutable audit logs.
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-500" />
            6. Disclosures to Authorities & Valid Legal Orders Only
          </h2>
          <p>
            We respect user privacy and do not sell, rent, or monetize your personal data. Data is shared with government authorities or law enforcement agencies <strong>strictly and solely upon receipt of a valid, enforceable court order, warrant, or formal subpoena</strong> issued by a competent legal authority.
          </p>
          <p>
            Legal request exports are executed server-side by authorized compliance officers using dedicated legal export endpoints. Every legal export compile account details, login/IP logs, chat requests, and user messages within the 90-day retention window. Every export is recorded immutably in our <code className="text-emerald-500">legal_exports</code> and <code className="text-emerald-500">admin_action_logs</code> collections, including the court order reference number, requesting authority, and timestamp.
          </p>
        </section>

        {/* Section 7 */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-500" />
            7. Your Rights: "Download My Data" and "Delete My Account"
          </h2>
          <p>
            You hold complete agency over your data stored in Somotoz. Under platform settings:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>
              <strong>Download My Data:</strong> You can download a complete, machine-readable JSON copy of your personal data at any time, including your account profile, reflections, journal entries, and chat request history.
            </li>
            <li>
              <strong>Delete My Account:</strong> You can schedule your account for permanent deletion directly from Settings, releasing your username and initiating the data purge workflow.
            </li>
          </ul>
        </section>

        {/* Section 8: Grievance Officer */}
        <section className="p-6 rounded-2xl bg-[var(--surface-color)] border border-[var(--border-color)] space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" />
              8. Grievance Officer & Contact Information
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              In accordance with applicable privacy regulations and the Information Technology rules:
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-2 text-xs">
            <p><strong>Designated Grievance Officer:</strong> Som Maurya</p>
            <p><strong>Organization:</strong> Somotoz Technologies / Trust & Safety Division</p>
            <p><strong>Email:</strong> <a href="mailto:grievance@somotoz.ai" className="text-emerald-500 hover:underline">grievance@somotoz.ai</a></p>
            <p><strong>Administrator Contact:</strong> <a href="mailto:privacy@somotoz.ai" className="text-emerald-500 hover:underline">privacy@somotoz.ai</a></p>
            <p><strong>Response Timeline:</strong> We acknowledge complaints within 24 to 48 hours and resolve reported grievances within 15 business days.</p>
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
