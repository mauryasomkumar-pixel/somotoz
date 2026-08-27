import { jsPDF } from 'jspdf';
import { ChatMessage, JournalEntry } from '../types';

/**
 * Strips basic Markdown characters for clean plain-text PDF rendering
 */
function cleanMarkdownForPdf(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{3}[\s\S]*?`{3}/g, (code) => code.replace(/`{3}/g, ''))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s?/g, '')
    .trim();
}

/**
 * Formats a single AI Response to a clean, high-contrast PDF document
 */
export function exportMessageToPdf(
  message: ChatMessage,
  promptText?: string,
  metaInfo?: { mode?: string; role?: string }
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  let yCursor = margin;

  // 1. Top Neo-Brutalist Header Bar
  doc.setFillColor(10, 10, 10);
  doc.rect(margin, yCursor, contentWidth, 22, 'F');
  doc.setDrawColor(38, 38, 38);
  doc.setLineWidth(0.5);
  doc.rect(margin, yCursor, contentWidth, 22, 'S');

  // Accent Green Tag Indicator
  doc.setFillColor(0, 255, 65);
  doc.rect(margin, yCursor, 3.5, 22, 'F');

  // Header Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(237, 237, 237);
  doc.text('SOMOTOZ AI SUITE // INTELLIGENCE EXPORT', margin + 8, yCursor + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(161, 161, 170);
  doc.text('Dev: Som Maurya | Encrypted Workspace Output', margin + 8, yCursor + 15);

  const dateStr = new Date(message.timestamp).toLocaleString();
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 255, 65);
  doc.text(dateStr, pageWidth - margin - 6, yCursor + 13, { align: 'right' });

  yCursor += 28;

  // 2. Metadata Specs Strip
  doc.setFillColor(18, 18, 18);
  doc.rect(margin, yCursor, contentWidth, 10, 'F');
  doc.setDrawColor(38, 38, 38);
  doc.rect(margin, yCursor, contentWidth, 10, 'S');

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);

  const modeBadge = `MODE: ${(message.mode || metaInfo?.mode || 'TEXT').toUpperCase()}`;
  const roleBadge = metaInfo?.role ? `ROLE: ${metaInfo.role.toUpperCase()}` : 'ENGINE: GEMINI 2.5 FLASH';
  const statusBadge = 'STATUS: VERIFIED';

  doc.text(modeBadge, margin + 4, yCursor + 6.5);
  doc.text(roleBadge, margin + 55, yCursor + 6.5);
  doc.text(statusBadge, pageWidth - margin - 4, yCursor + 6.5, { align: 'right' });

  yCursor += 16;

  // 3. User Query Box (if prompt exists)
  if (promptText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text('INPUT QUERY / PROMPT', margin, yCursor);
    yCursor += 4;

    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);

    const cleanPrompt = cleanMarkdownForPdf(promptText);
    const splitPrompt = doc.splitTextToSize(cleanPrompt, contentWidth - 8);
    const promptBoxHeight = Math.max(12, splitPrompt.length * 4.5 + 6);

    doc.rect(margin, yCursor, contentWidth, promptBoxHeight, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(splitPrompt, margin + 4, yCursor + 6);

    yCursor += promptBoxHeight + 8;
  }

  // 4. Model Output Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 15, 15);
  doc.text('AI SYNTHESIS & RESPONSE', margin, yCursor);
  yCursor += 5;

  const cleanContent = cleanMarkdownForPdf(message.content);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);

  const lines = doc.splitTextToSize(cleanContent, contentWidth);
  const lineHeight = 5;

  lines.forEach((line: string) => {
    if (yCursor + lineHeight > pageHeight - 20) {
      // Add footer to current page
      addPdfFooter(doc, pageHeight, pageWidth, margin);
      doc.addPage();
      yCursor = margin + 5;
    }
    doc.text(line, margin, yCursor);
    yCursor += lineHeight;
  });

  // 5. Media Footnote / Details if media generated
  if (message.media) {
    yCursor += 8;
    if (yCursor > pageHeight - 35) {
      addPdfFooter(doc, pageHeight, pageWidth, margin);
      doc.addPage();
      yCursor = margin + 5;
    }

    doc.setFillColor(248, 250, 248);
    doc.setDrawColor(0, 180, 50);
    doc.rect(margin, yCursor, contentWidth, 18, 'FD');

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 120, 35);
    doc.text(`[ATTACHED MEDIA ARTIFACT: ${message.media.type.toUpperCase()}]`, margin + 4, yCursor + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const mediaDetail =
      message.media.type === 'image'
        ? `Vector Artwork SVG generated for prompt: "${message.media.prompt}"`
        : message.media.type === 'video'
        ? `Motion Keyframes & 60FPS Scene generated: ${message.media.videoFrames?.length || 3} frames`
        : `Synthesized 432Hz Melody: ${message.media.audioNotes?.length || 6} tones at ${message.media.tempo || 120} BPM`;

    doc.text(doc.splitTextToSize(mediaDetail, contentWidth - 8), margin + 4, yCursor + 12);
    yCursor += 22;
  }

  // Final page footer
  addPdfFooter(doc, pageHeight, pageWidth, margin);

  // Save the document
  const fileName = `somotoz-response-${Date.now()}.pdf`;
  doc.save(fileName);
}

/**
 * Formats the entire active chat thread to a multi-page PDF transcript
 */
export function exportConversationToPdf(messages: ChatMessage[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  let yCursor = margin;

  // Header Banner
  doc.setFillColor(10, 10, 10);
  doc.rect(margin, yCursor, contentWidth, 22, 'F');
  doc.setDrawColor(38, 38, 38);
  doc.rect(margin, yCursor, contentWidth, 22, 'S');

  doc.setFillColor(0, 255, 65);
  doc.rect(margin, yCursor, 3.5, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(237, 237, 237);
  doc.text('SOMOTOZ AI SUITE // COMPLETE SESSION LOG', margin + 8, yCursor + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(161, 161, 170);
  doc.text(`Total Messages: ${messages.length} | Dev: Som Maurya`, margin + 8, yCursor + 15);

  const dateStr = new Date().toLocaleDateString();
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 255, 65);
  doc.text(dateStr, pageWidth - margin - 6, yCursor + 13, { align: 'right' });

  yCursor += 28;

  messages.forEach((msg, idx) => {
    const isUser = msg.role === 'user';
    const cleanContent = cleanMarkdownForPdf(msg.content);
    const splitLines = doc.splitTextToSize(cleanContent, contentWidth - 10);
    const boxHeight = splitLines.length * 4.8 + 12;

    if (yCursor + boxHeight > pageHeight - 22) {
      addPdfFooter(doc, pageHeight, pageWidth, margin);
      doc.addPage();
      yCursor = margin + 5;
    }

    if (isUser) {
      // User message block
      doc.setFillColor(242, 244, 246);
      doc.setDrawColor(200, 205, 210);
      doc.setLineWidth(0.3);
      doc.rect(margin, yCursor, contentWidth, boxHeight, 'FD');

      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);
      doc.text(`[USER] • ${new Date(msg.timestamp).toLocaleTimeString()}`, margin + 4, yCursor + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(20, 20, 20);
      doc.text(splitLines, margin + 4, yCursor + 10);
    } else {
      // Model message block
      doc.setFillColor(252, 253, 252);
      doc.setDrawColor(180, 220, 190);
      doc.setLineWidth(0.3);
      doc.rect(margin, yCursor, contentWidth, boxHeight, 'FD');

      doc.setFillColor(0, 200, 50);
      doc.rect(margin, yCursor, 2, boxHeight, 'F');

      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 140, 40);
      doc.text(`[SOMOTOZ AI] • ${msg.mode?.toUpperCase() || 'RESPONSE'}`, margin + 5, yCursor + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(25, 25, 25);
      doc.text(splitLines, margin + 5, yCursor + 10);
    }

    yCursor += boxHeight + 4;
  });

  addPdfFooter(doc, pageHeight, pageWidth, margin);

  const fileName = `somotoz-session-${Date.now()}.pdf`;
  doc.save(fileName);
}

/**
 * Formats a Journal / Reflection Note to a clean PDF document
 */
export function exportJournalEntryToPdf(entry: JournalEntry): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  let yCursor = margin;

  // Header Banner
  doc.setFillColor(10, 10, 10);
  doc.rect(margin, yCursor, contentWidth, 22, 'F');
  doc.setDrawColor(38, 38, 38);
  doc.rect(margin, yCursor, contentWidth, 22, 'S');

  doc.setFillColor(0, 255, 65);
  doc.rect(margin, yCursor, 3.5, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(237, 237, 237);
  doc.text('SOMOTOZ AI SUITE // JOURNAL NOTE EXPORT', margin + 8, yCursor + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(161, 161, 170);
  doc.text(`Title: ${entry.title || 'Untitled Note'} | Dev: Som Maurya`, margin + 8, yCursor + 15);

  const dateStr = new Date(entry.createdAt).toLocaleDateString();
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 255, 65);
  doc.text(dateStr, pageWidth - margin - 6, yCursor + 13, { align: 'right' });

  yCursor += 28;

  // Tags and Meta
  if (entry.moodTags && entry.moodTags.length > 0) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 150, 45);
    doc.text(`TAGS: ${entry.moodTags.map(t => `#${t}`).join('  ')}`, margin, yCursor);
    yCursor += 7;
  }

  // Note Content Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(entry.title || 'Journal Note', margin, yCursor);
  yCursor += 5;

  const cleanContent = cleanMarkdownForPdf(entry.content);
  const contentLines = doc.splitTextToSize(cleanContent, contentWidth);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);

  contentLines.forEach((line: string) => {
    if (yCursor + 5 > pageHeight - 20) {
      addPdfFooter(doc, pageHeight, pageWidth, margin);
      doc.addPage();
      yCursor = margin + 5;
    }
    doc.text(line, margin, yCursor);
    yCursor += 5;
  });

  // AI Summary / Insights if present
  if (entry.aiResponse?.conversationalReply) {
    yCursor += 6;
    if (yCursor + 25 > pageHeight - 20) {
      addPdfFooter(doc, pageHeight, pageWidth, margin);
      doc.addPage();
      yCursor = margin + 5;
    }

    doc.setFillColor(248, 250, 248);
    doc.setDrawColor(0, 200, 60);
    doc.setLineWidth(0.3);

    const cleanAiReply = cleanMarkdownForPdf(entry.aiResponse.conversationalReply);
    const aiLines = doc.splitTextToSize(cleanAiReply, contentWidth - 8);
    const boxHeight = aiLines.length * 4.5 + 12;

    doc.rect(margin, yCursor, contentWidth, boxHeight, 'FD');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 140, 40);
    doc.text('[SOMOTOZ AI SUMMARY & INSIGHTS]', margin + 4, yCursor + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(aiLines, margin + 4, yCursor + 10);

    yCursor += boxHeight + 6;
  }

  addPdfFooter(doc, pageHeight, pageWidth, margin);

  const cleanTitle = (entry.title || 'note').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 25);
  const fileName = `somotoz-note-${cleanTitle}-${Date.now()}.pdf`;
  doc.save(fileName);
}

function addPdfFooter(doc: jsPDF, pageHeight: number, pageWidth: number, margin: number): void {
  const footerY = pageHeight - 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text('Somotoz AI Suite • Private & Encrypted Workspace', margin, footerY);

  const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
  doc.text(`Page ${pageNum}`, pageWidth - margin, footerY, { align: 'right' });
}
