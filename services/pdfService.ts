import html2pdfImport from 'html2pdf.js';
import { Message, MessageRole } from '../types';
import { Remarkable } from 'remarkable';

const html2pdf = (html2pdfImport as any).default || html2pdfImport;

const md = new Remarkable({
  html: true,
  xhtmlOut: false,
  breaks: true,
  linkify: true,
});

const getFormattedTimestamp = (date: Date): string => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getFormattedDate = (date: Date): string => {
  return new Date(date).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
};

const generateMessageHtml = (message: Message): string => {
  const isUser = message.role === MessageRole.USER;
  const author = isUser ? "You" : "MeteoSran";

  let imageHtml = '';
  if (message.image && message.image.data && message.image.mimeType) {
    imageHtml = `
      <div style="margin-top: 12px; margin-bottom: 12px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <img src="data:${message.image.mimeType};base64,${message.image.data}" alt="${message.image.name || 'User image'}" style="width: 100%; height: auto; display: block;">
      </div>
    `;
  }

  const textHtml = message.text ? md.render(message.text) : (isUser && imageHtml ? '' : '<p style="font-style: italic; opacity: 0.4;">No text content provided.</p>');

  // Editorial Insight Card Style
  return `
    <div style="margin-bottom: 32px; position: relative;">
      <!-- Author Badge -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-left: 4px;">
        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${isUser ? '#1e293b' : 'linear-gradient(135deg, #0ea5e9, #6366f1)'}; border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: white;">
          ${isUser ? 'U' : 'M'}
        </div>
        <span style="font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">${author}</span>
        <span style="font-size: 10px; color: #475569;">• ${getFormattedTimestamp(message.timestamp)}</span>
      </div>

      <!-- Content Card -->
      <div style="
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 24px 28px;
        position: relative;
        backdrop-filter: blur(10px);
      ">
        <div style="
          color: #e2e8f0;
          font-size: 14px;
          line-height: 1.8;
          font-weight: 400;
        ">
          ${imageHtml}
          ${textHtml}
        </div>
      </div>
    </div>
  `;
};

export const generateChatPdf = async (messages: Message[]): Promise<void> => {
  if (messages.length === 0) {
    alert("No messages to export.");
    return;
  }

  const currentDate = getFormattedDate(new Date());
  const chatContentHtml = messages.map(generateMessageHtml).join('');

  const pdfHtml = `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
          
          * { box-sizing: border-box; margin: 0; padding: 0; }
          
          body {
            font-family: 'Poppins', sans-serif;
            background: #0a1020;
            color: #f1f5f9;
            line-height: 1.6;
          }
          
          .pdf-container {
            width: 8.5in;
            min-height: 11in;
            background: #0a1020;
            position: relative;
            overflow: hidden;
          }

          /* --- MESH GRADIENT SIMULATION --- */
          .mesh-orb-1 {
            position: absolute; width: 600px; height: 600px;
            top: -200px; right: -200px;
            background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
            border-radius: 50%; z-index: 0;
          }
          .mesh-orb-2 {
            position: absolute; width: 500px; height: 500px;
            bottom: -100px; left: -100px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
            border-radius: 50%; z-index: 0;
          }

          /* --- EDITORIAL HEADER --- */
          .journal-header {
            padding: 80px 48px 48px 48px;
            position: relative;
            z-index: 1;
          }

          .report-tag {
            font-size: 11px;
            font-weight: 700;
            color: #38bdf8;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 16px;
            display: inline-block;
            border-bottom: 2px solid #38bdf8;
            padding-bottom: 4px;
          }

          .report-title {
            font-size: 48px;
            font-weight: 800;
            line-height: 1.1;
            color: #ffffff;
            letter-spacing: -2px;
            margin-bottom: 16px;
          }

          .report-meta {
            display: flex;
            gap: 24px;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 16px;
            margin-top: 24px;
            font-size: 12px;
            color: #64748b;
          }

          .meta-item b { color: #f1f5f9; font-weight: 600; margin-right: 4px; }

          /* --- CONTENT AREA --- */
          .journal-content {
            padding: 0 48px 60px 48px;
            position: relative;
            z-index: 1;
          }

          /* Markdown styles */
          h1 { font-size: 24px; font-weight: 800; margin: 32px 0 16px 0; color: #fff; letter-spacing: -1px; }
          h2 { font-size: 20px; font-weight: 700; margin: 24px 0 12px 0; color: #f8fafc; letter-spacing: -0.5px; }
          h3 { font-size: 16px; font-weight: 600; margin: 20px 0 8px 0; color: #f1f5f9; }
          p { margin-bottom: 14px; }
          ul, ol { margin-bottom: 16px; padding-left: 20px; }
          li { margin-bottom: 6px; }
          strong { color: #fff; font-weight: 600; }
          code { 
            background: rgba(255,255,255,0.05); 
            padding: 4px 8px; 
            border-radius: 6px; 
            font-family: 'SF Mono', 'Fira Code', monospace; 
            font-size: 12px; 
            color: #38bdf8; 
            border: 1px solid rgba(255,255,255,0.05);
          }
          pre { 
            background: rgba(0,0,0,0.2); 
            padding: 20px; 
            border-radius: 16px; 
            font-family: 'SF Mono', 'Fira Code', monospace; 
            font-size: 12px; 
            color: #cbd5e1; 
            border: 1px solid rgba(255,255,255,0.05); 
            margin: 20px 0;
            white-space: pre-wrap;
          }
          
          blockquote { 
            border-left: 4px solid #0ea5e9; 
            padding: 12px 24px; 
            margin: 24px 0; 
            background: rgba(14,165,233,0.03); 
            color: #94a3b8; 
            font-style: italic;
            border-radius: 0 16px 16px 0;
          }

          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 24px 0;
            background: rgba(255,255,255,0.02);
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.05);
          }
          th, td {
            padding: 14px 18px;
            text-align: left;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
          th { background: rgba(56,189,248,0.05); font-weight: 700; color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          td { font-size: 13px; color: #cbd5e1; }
          tr:last-child td { border-bottom: none; }

          /* --- EDITORIAL FOOTER --- */
          .journal-footer {
            padding: 60px 48px 48px 48px;
            border-top: 1px solid rgba(255,255,255,0.05);
            text-align: left;
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .footer-info { font-size: 10px; color: #475569; letter-spacing: 0.5px; }
          .footer-brand { font-size: 14px; font-weight: 800; color: #1e293b; color: #38bdf8; }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <div class="mesh-orb-1"></div>
          <div class="mesh-orb-2"></div>

          <!-- HEADER -->
          <header class="journal-header">
            <span class="report-tag">Intelligence Report</span>
            <h1 class="report-title">The Weather<br>Journal</h1>
            <div class="report-meta">
              <div class="meta-item"><b>Date</b> ${currentDate}</div>
              <div class="meta-item"><b>Platform</b> MeteoSran v1.6.1</div>
              <div class="meta-item"><b>Curated For</b> Personalized User Insights</div>
            </div>
          </header>

          <!-- CONTENT -->
          <main class="journal-content">
            ${chatContentHtml}
          </main>

          <!-- FOOTER -->
          <footer class="journal-footer">
            <div class="footer-info">
              © ${new Date().getFullYear()} Marc Andréas Yao • All Intelligence Rights Reserved
            </div>
            <div class="footer-brand">MeteoSran</div>
          </footer>
        </div>
      </body>
    </html>
  `;

  const elementToRender = document.createElement('div');
  elementToRender.innerHTML = pdfHtml;
  elementToRender.style.position = 'absolute';
  elementToRender.style.left = '-9999px';
  elementToRender.style.top = '-9999px';
  elementToRender.style.width = '8.5in';
  document.body.appendChild(elementToRender);

  const filename = `MeteoSran_Journal_${new Date().toISOString().split('T')[0]}.pdf`;

  try {
    const pdfContentElement = elementToRender.querySelector('.pdf-container') as HTMLElement;
    
    // Use a slightly larger delay to ensure all fonts and orbs render
    await new Promise(resolve => setTimeout(resolve, 500));

    await html2pdf().from(pdfContentElement).set({
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0a1020',
        windowWidth: 1200, // Fixed width for consistent high-DPI rendering
      },
      jsPDF: {
        unit: 'in',
        format: 'letter',
        orientation: 'portrait'
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.pdf-footer'
      }
    }).save();
  } catch (error) {
    console.error("Error generating Weather Journal:", error);
    alert("There was an error generating your Premium Weather Journal.");
  } finally {
    if (document.body.contains(elementToRender)) {
      document.body.removeChild(elementToRender);
    }
  }
};
