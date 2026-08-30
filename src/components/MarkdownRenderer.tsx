import React, { useState, useMemo, memo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  accessibleReadingMode?: boolean;
}

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ inline, className, children }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 mx-0.5 rounded font-mono text-[12px] bg-[var(--bg-elevated)] text-[var(--border-active)] border border-[var(--border-color)] font-semibold break-words">
        {children}
      </code>
    );
  }

  return (
    <div className="my-3 border border-[var(--border-color)] bg-[var(--bg-elevated)] rounded-md overflow-hidden shadow-xs font-mono">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[11px] text-[var(--text-secondary)]">
        <div className="flex items-center space-x-1.5 font-bold tracking-wider uppercase text-[var(--border-active)]">
          <Terminal className="w-3.5 h-3.5 text-[var(--border-active)]" />
          <span>{language || 'CODE'}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1 text-[11px] hover:text-[var(--border-active)] text-[var(--text-secondary)] transition-colors px-2 py-0.5 rounded hover:bg-[var(--bg-card)] cursor-pointer"
          title="Copy code snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-[13px] leading-relaxed text-[var(--text-primary)] font-mono">
        <pre className="!m-0 !p-0 !bg-transparent">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
};

/**
 * Sanitize and fix imperfect or streaming markdown tokens before rendering.
 * Normalizes stray triple asterisks, unclosed bold/italic tags, and unclosed code blocks.
 */
function sanitizeMarkdownContent(raw: string): string {
  if (!raw) return '';
  let text = raw;

  // 1. Normalize triple asterisks with text to standard bold-italic markdown
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '**_$1_**');

  // 2. Fix dangling or unclosed triple asterisks at end of streaming tokens
  if (text.endsWith('***')) {
    text = text.slice(0, -3);
  }

  // 3. Balance unclosed double asterisks during streaming
  const doubleAsteriskMatches = text.match(/\*\*/g);
  if (doubleAsteriskMatches && doubleAsteriskMatches.length % 2 !== 0) {
    text += '**';
  }

  // 4. Balance unclosed code blocks during streaming
  const codeBlockMatches = text.match(/```/g);
  if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
    text += '\n```';
  }

  return text;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(({
  content,
  accessibleReadingMode = false,
}) => {
  const sanitizedContent = useMemo(() => sanitizeMarkdownContent(content || ''), [content]);

  return (
    <div
      className={`markdown-content w-full text-[var(--text-primary)] ${
        accessibleReadingMode
          ? 'text-[15px] leading-loose tracking-wide space-y-3 font-sans'
          : 'text-[14px] sm:text-[14.5px] leading-relaxed space-y-2.5 font-sans'
      }`}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-1.5 mt-4 mb-2 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-4 bg-[var(--border-active)] rounded-xs inline-block shrink-0" />
              <span>{children}</span>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)]/60 pb-1 mt-3.5 mb-2 tracking-tight flex items-center gap-2">
              <span className="w-1 h-3.5 bg-[var(--border-active)] rounded-xs inline-block shrink-0" />
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-3 mb-1.5 tracking-tight flex items-center gap-1.5">
              <span className="text-[var(--border-active)] font-mono">▸</span>
              <span>{children}</span>
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-2.5 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-1.5 leading-relaxed text-[var(--text-primary)] last:mb-0 break-words">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[var(--text-primary)]">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[var(--text-secondary)]">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="my-2 space-y-1.5 pl-4 sm:pl-5 list-none">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 space-y-1.5 pl-4 sm:pl-5 list-decimal text-[var(--text-primary)] marker:text-[var(--border-active)] marker:font-mono marker:font-bold">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="relative leading-relaxed pl-1.5 text-[var(--text-primary)] flex items-start gap-2">
              <span className="text-[var(--border-active)] text-xs mt-1 shrink-0 select-none">•</span>
              <div className="flex-1 min-w-0">{children}</div>
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 pl-3.5 py-1.5 border-l-3 border-[var(--border-active)] bg-[var(--bg-elevated)]/60 text-[var(--text-secondary)] italic rounded-r-md text-xs sm:text-sm">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-4 border-[var(--border-color)]" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--border-active)] underline decoration-[var(--border-active)]/50 hover:decoration-[var(--border-active)] font-medium transition-colors break-words"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto border border-[var(--border-color)] rounded-md">
              <table className="min-w-full divide-y divide-[var(--border-color)] text-xs sm:text-sm text-left">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold font-mono">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-[var(--text-primary)] font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-[var(--text-secondary)]">
              {children}
            </td>
          ),
          code: (props: any) => <CodeBlock {...props} />,
        }}
      >
        {sanitizedContent}
      </Markdown>
    </div>
  );
});
