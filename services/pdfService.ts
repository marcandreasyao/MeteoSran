import html2pdfImport from 'html2pdf.js';
import { Message, MessageRole } from '../types';
import { Remarkable } from 'remarkable'; // Using remarkable for robust Markdown to HTML conversion

// More robust import for html2pdf.js from esm.sh
const html2pdf = (html2pdfImport as any).default || html2pdfImport;

const md = new Remarkable({
  html: true, // Enable HTML tags in source
  xhtmlOut: false, // Don't use XHTML syntax
  breaks: true, // Convert '\n' in paragraphs into <br>
  linkify: true, // Autoconvert URL-like text to links
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
      <div style="margin-bottom: 8px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; max-width: 300px; display: inline-block;">
        <img src="data:${message.image.mimeType};base64,${message.image.data}" alt="${message.image.name || 'User image'}" style="max-width: 100%; height: auto; display: block; border-radius: 7px;">
      </div>
    `;
  }

  // Convert markdown text to HTML
  const textHtml = message.text ? md.render(message.text) : (isUser && imageHtml ? '' : '<p style="font-style: italic; margin:0;">No text content.</p>');

  return `
    <div style="margin-bottom: 16px; display: flex; flex-direction: ${isUser ? 'row-reverse' : 'row'};">
      <div style="max-width: 80%;">
        <div style="font-size: 0.8em; color: #555; margin-bottom: 4px; text-align: ${isUser ? 'right' : 'left'};">
          <strong>${author}</strong> - ${getFormattedTimestamp(message.timestamp)}
        </div>
        <div style="padding: 10px 14px; border-radius: 12px; 
                    background-color: ${isUser ? '#007AFF' : '#E5E5EA'}; 
                    color: ${isUser ? '#FFFFFF' : '#000000'};
                    border: 1px solid ${isUser ? '#0056b3' : '#D1D1D6'};
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    word-wrap: break-word; overflow-wrap: break-word;">
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
  // Filter out the initial welcome message if it's the default one and only one.
  // For PDF, we typically only want the actual conversation.
  const conversationMessages = messages.filter(msg => msg.role === MessageRole.USER || 
    (msg.role === MessageRole.MODEL && messages.find(m => m.role === MessageRole.USER)) // only include model messages if there's a user msg
  );

  if (conversationMessages.length === 0 && messages.length > 0) {
     // This case means only the welcome message from the model exists.
     // We can choose to export it or notify the user. Let's include it for now if it's the only thing.
     // Or, if there's a welcome message and nothing else, perhaps don't export.
     // For this iteration, let's process all messages passed, simplifying logic.
  }
  
  const chatContentHtml = messages.map(generateMessageHtml).join('');

  const pdfHtml = `
    <html>
      <head>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap');
          body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            line-height: 1.6;
          }
          .pdf-container {
            padding: 25px; /* Roughly 1 inch margin for letter paper */
            max-width: 8.5in; /* Letter width */
            box-sizing: border-box;
          }
          .pdf-header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #007AFF;
          }
          .pdf-header h1 {
            font-size: 24px;
            color: #007AFF;
            margin: 0 0 5px 0;
          }
          .pdf-header p {
            font-size: 12px;
            color: #555;
            margin: 0;
          }
          .chat-log {
            /* Styles for individual messages are inline */
          }
          /* Markdown generated HTML styles */
          h1, h2, h3, h4, h5, h6 { margin-top: 1em; margin-bottom: 0.5em; color: #111; font-family: 'Poppins', sans-serif !important; }
          p { margin-top: 0; margin-bottom: 0.8em; font-family: 'Poppins', sans-serif !important;}
          ul, ol { margin-bottom: 0.8em; padding-left: 20px; font-family: 'Poppins', sans-serif !important;}
          li { margin-bottom: 0.2em; }
          strong, b { font-weight: 700; }
          em, i { font-style: italic; }
          a { color: #007AFF; text-decoration: none; }
          a:hover { text-decoration: underline; }
          pre {
            background-color: #f0f0f0;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-family: 'Courier New', Courier, monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          code {
             font-family: 'Courier New', Courier, monospace;
             background-color: #f0f0f0;
             padding: 0.2em 0.4em;
             border-radius: 3px;
             font-size: 0.9em;
          }
          blockquote {
            border-left: 3px solid #007AFF;
            padding-left: 10px;
            margin-left: 0;
            font-style: italic;
            color: #555;
          }
           table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1em;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <div class="pdf-header">
            <h1>MeteoSran</h1>
            <p>Chat Transcript - ${currentDate}</p>
          </div>
          <div class="chat-log">
            ${chatContentHtml}
          </div>
        </div>
      </body>
    </html>
  `;

  const elementToRender = document.createElement('div');
  elementToRender.innerHTML = pdfHtml;
  // Append to body and hide for html2pdf to process fonts and styles correctly, then remove
  elementToRender.style.position = 'absolute';
  elementToRender.style.left = '-9999px'; // Position off-screen
  elementToRender.style.top = '-9999px';   // Position off-screen
  elementToRender.style.width = '8.5in'; // Define width to help with layout, similar to PDF page
  document.body.appendChild(elementToRender);


  const now = new Date();
  const datePart = now.toISOString().split('T')[0];
  const timePart = now.toTimeString().slice(0,5).replace(':', '-');
  const filename = `MeteoSran_Chat_${datePart}_${timePart}.pdf`;

  try {
    // The element passed to .from() should be the one containing the content to be PDF'd.
    // In this case, it's the .pdf-container div inside the dynamically created elementToRender.
    const pdfContentElement = elementToRender.querySelector('.pdf-container');
    if (!pdfContentElement) {
        throw new Error("Could not find .pdf-container element for PDF generation.");
    }
    
    await html2pdf().from(pdfContentElement).set({
      margin: [0.5, 0.5, 0.5, 0.5], // inches [top, left, bottom, right]
      filename: filename,
      image: { type: 'jpeg', quality: 0.95 }, 
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false, 
        letterRendering: true,
        scrollX: 0,
        scrollY: 0, // Set to 0 as we are rendering an off-screen element
        windowWidth: pdfContentElement.scrollWidth,
        windowHeight: pdfContentElement.scrollHeight
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait' 
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } 
    }).save();
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Sorry, there was an error generating the PDF. Please try again or check the console for details.");
  } finally {
     if (document.body.contains(elementToRender)) {
        document.body.removeChild(elementToRender); // Clean up the temporary element
     }
  }
};
