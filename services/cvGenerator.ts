import type { CvData } from '../types';

// --- Constants ---
const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const PRIMARY_COLOR = '#4f46e5'; // indigo-600
const TEXT_COLOR = '#1f2937'; // gray-800
const SUBTLE_TEXT_COLOR = '#6b7280'; // gray-500
const HEADING_FONT = '24px "Georgia", serif';
const SUBHEADING_FONT = '14px "Helvetica", sans-serif';
const BODY_FONT = '11px "Helvetica", sans-serif';
const SMALL_FONT = '10px "Helvetica", sans-serif';
const CREATIVE_HEADER_BG = '#334155'; // slate-700


// --- Helper Functions ---

/**
 * Wraps text to fit within a maximum width on the canvas.
 * @returns The y-coordinate after the wrapped text has been drawn.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

/** Draws a section heading with a line underneath. */
function drawSectionHeader(ctx: CanvasRenderingContext2D, text: string, y: number, x: number, width: number): number {
  ctx.font = SUBHEADING_FONT;
  ctx.fillStyle = PRIMARY_COLOR;
  ctx.textAlign = 'left';
  ctx.fillText(text.toUpperCase(), x, y);
  
  ctx.strokeStyle = '#e5e7eb'; // gray-200
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  ctx.lineTo(x + width, y + 8);
  ctx.stroke();

  return y + 25;
}

// --- Template Drawing Functions ---

const drawTemplateClassic = (ctx: CanvasRenderingContext2D, data: CvData) => {
  const MARGIN = 40;
  const contentWidth = A4_WIDTH - MARGIN * 2;
  let currentY = MARGIN;

  // --- Header ---
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = HEADING_FONT;
  ctx.textAlign = 'center';
  ctx.fillText(data.personalInfo.name || '[Votre Nom]', A4_WIDTH / 2, currentY);
  currentY += 20;

  const contactInfo = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.linkedin,
  ].filter(Boolean).join(' | ');
  ctx.font = SMALL_FONT;
  ctx.fillStyle = SUBTLE_TEXT_COLOR;
  ctx.fillText(contactInfo, A4_WIDTH / 2, currentY);
  currentY += 30;

  // --- Summary ---
  if (data.summary) {
    currentY = drawSectionHeader(ctx, 'Résumé', currentY, MARGIN, contentWidth);
    ctx.font = BODY_FONT;
    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = 'left';
    currentY = wrapText(ctx, data.summary, MARGIN, currentY, contentWidth, 14);
    currentY += 15;
  }
  
  // --- Experience ---
  if (data.experience && data.experience.length > 0 && data.experience[0].jobTitle) {
      currentY = drawSectionHeader(ctx, 'Expérience Professionnelle', currentY, MARGIN, contentWidth);
      data.experience.forEach(exp => {
        ctx.font = `bold ${BODY_FONT}`;
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(exp.jobTitle || '[Titre du poste]', MARGIN, currentY);
        
        ctx.font = BODY_FONT;
        ctx.textAlign = 'right';
        ctx.fillText(exp.duration || '[Durée]', A4_WIDTH - MARGIN, currentY);
        
        ctx.textAlign = 'left';
        ctx.fillStyle = SUBTLE_TEXT_COLOR;
        ctx.fillText(exp.company || '[Entreprise]', MARGIN, currentY + 14);
        currentY += 30;

        exp.responsibilities.forEach(resp => {
            if (resp) {
                ctx.fillText('•', MARGIN, currentY);
                currentY = wrapText(ctx, resp, MARGIN + 10, currentY, contentWidth - 10, 14);
            }
        });
        currentY += 10;
      });
  }

  // --- Education ---
  if (data.education && data.education.length > 0 && data.education[0].degree) {
      currentY = drawSectionHeader(ctx, 'Formation', currentY, MARGIN, contentWidth);
      data.education.forEach(edu => {
        ctx.font = `bold ${BODY_FONT}`;
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(edu.degree || '[Diplôme]', MARGIN, currentY);
        
        ctx.font = BODY_FONT;
        ctx.textAlign = 'right';
        ctx.fillText(edu.duration || '[Durée]', A4_WIDTH - MARGIN, currentY);
        
        ctx.textAlign = 'left';
        ctx.fillStyle = SUBTLE_TEXT_COLOR;
        ctx.fillText(edu.institution || '[Établissement]', MARGIN, currentY + 14);
        currentY += 35;
      });
  }

  // --- Skills ---
  if (data.skills && data.skills.length > 0) {
      currentY = drawSectionHeader(ctx, 'Compétences', currentY, MARGIN, contentWidth);
      ctx.font = BODY_FONT;
      ctx.fillStyle = TEXT_COLOR;
      currentY = wrapText(ctx, data.skills.join(' • '), MARGIN, currentY, contentWidth, 14);
  }
};

const drawTemplateModern = (ctx: CanvasRenderingContext2D, data: CvData) => {
    const SIDEBAR_WIDTH = 180;
    const MARGIN = 30;
    const MAIN_CONTENT_X = SIDEBAR_WIDTH + MARGIN;
    const MAIN_CONTENT_WIDTH = A4_WIDTH - MAIN_CONTENT_X - MARGIN;
    let sidebarY = 0;
    let mainY = MARGIN;

    // --- Sidebar Background ---
    ctx.fillStyle = '#f3f4f6'; // gray-100
    ctx.fillRect(0, 0, SIDEBAR_WIDTH, A4_HEIGHT);
    
    // --- Header ---
    ctx.fillStyle = PRIMARY_COLOR;
    ctx.fillRect(0, 0, A4_WIDTH, 100);
    
    ctx.font = '32px "Helvetica", sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(data.personalInfo.name || '[Votre Nom]', MAIN_CONTENT_X, MARGIN + 45);
    mainY = 120;
    
    // --- Sidebar Content ---
    sidebarY = MARGIN + 20;

    // Contact
    ctx.font = `bold ${SMALL_FONT}`;
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('CONTACT', MARGIN, sidebarY);
    sidebarY += 15;
    
    ctx.font = SMALL_FONT;
    ['email', 'phone'].forEach(key => {
        const value = data.personalInfo[key as keyof typeof data.personalInfo];
        if (value) {
            sidebarY = wrapText(ctx, value, MARGIN, sidebarY, SIDEBAR_WIDTH - MARGIN * 2, 14);
        }
    });
     if (data.linkedin) {
       sidebarY = wrapText(ctx, data.linkedin, MARGIN, sidebarY, SIDEBAR_WIDTH - MARGIN * 2, 14);
    }
    sidebarY += 20;

    // Skills
    if (data.skills && data.skills.length > 0) {
        ctx.font = `bold ${SMALL_FONT}`;
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText('COMPÉTENCES', MARGIN, sidebarY);
        sidebarY += 15;

        ctx.font = SMALL_FONT;
        data.skills.forEach(skill => {
            if (skill) {
                sidebarY = wrapText(ctx, `• ${skill}`, MARGIN, sidebarY, SIDEBAR_WIDTH - MARGIN * 2, 14);
            }
        });
        sidebarY += 20;
    }

    // Education
    if (data.education && data.education.length > 0 && data.education[0].degree) {
        ctx.font = `bold ${SMALL_FONT}`;
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText('FORMATION', MARGIN, sidebarY);
        sidebarY += 15;

        data.education.forEach(edu => {
            ctx.font = `bold ${SMALL_FONT}`;
            sidebarY = wrapText(ctx, edu.degree, MARGIN, sidebarY, SIDEBAR_WIDTH - MARGIN * 2, 14);
            ctx.font = SMALL_FONT;
            sidebarY = wrapText(ctx, edu.institution, MARGIN, sidebarY, SIDEBAR_WIDTH - MARGIN * 2, 14);
            sidebarY = wrapText(ctx, edu.duration, MARGIN, sidebarY, SIDEBAR_WIDTH - MARGIN * 2, 14);
            sidebarY += 10;
        });
    }

    // --- Main Content ---
    
    // Summary
    if (data.summary) {
        mainY = drawSectionHeader(ctx, 'Résumé', mainY, MAIN_CONTENT_X, MAIN_CONTENT_WIDTH);
        ctx.font = BODY_FONT;
        ctx.fillStyle = TEXT_COLOR;
        mainY = wrapText(ctx, data.summary, MAIN_CONTENT_X, mainY, MAIN_CONTENT_WIDTH, 14);
        mainY += 15;
    }

    // Experience
    if (data.experience && data.experience.length > 0 && data.experience[0].jobTitle) {
      mainY = drawSectionHeader(ctx, 'Expérience Professionnelle', mainY, MAIN_CONTENT_X, MAIN_CONTENT_WIDTH);
      data.experience.forEach(exp => {
        ctx.font = `bold ${BODY_FONT}`;
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(exp.jobTitle || '[Titre du poste]', MAIN_CONTENT_X, mainY);
        
        ctx.font = BODY_FONT;
        ctx.textAlign = 'right';
        ctx.fillText(exp.duration || '[Durée]', A4_WIDTH - MARGIN, mainY);
        
        ctx.textAlign = 'left';
        ctx.fillStyle = SUBTLE_TEXT_COLOR;
        ctx.fillText(exp.company || '[Entreprise]', MAIN_CONTENT_X, mainY + 14);
        mainY += 30;

        exp.responsibilities.forEach(resp => {
            if (resp) {
                ctx.fillText('•', MAIN_CONTENT_X, mainY);
                mainY = wrapText(ctx, resp, MAIN_CONTENT_X + 10, mainY, MAIN_CONTENT_WIDTH - 10, 14);
            }
        });
        mainY += 10;
      });
  }
};

const drawTemplateCreative = (ctx: CanvasRenderingContext2D, data: CvData) => {
  const HEADER_HEIGHT = 120;
  const MARGIN = 40;
  let currentY = 0;

  // --- Header ---
  ctx.fillStyle = CREATIVE_HEADER_BG;
  ctx.fillRect(0, 0, A4_WIDTH, HEADER_HEIGHT);
  
  ctx.fillStyle = 'white';
  ctx.font = '36px "Helvetica Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.personalInfo.name || '[Votre Nom]', A4_WIDTH / 2, MARGIN + 30);
  
  const contactInfo = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.linkedin,
  ].filter(Boolean).join('  •  ');
  ctx.font = `12px "Helvetica Neue", sans-serif`;
  ctx.fillText(contactInfo, A4_WIDTH / 2, MARGIN + 65);

  currentY = HEADER_HEIGHT + MARGIN;
  
  // --- Two Column Layout ---
  const LEFT_COL_X = MARGIN;
  const LEFT_COL_WIDTH = 160;
  const RIGHT_COL_X = LEFT_COL_X + LEFT_COL_WIDTH + MARGIN;
  const RIGHT_COL_WIDTH = A4_WIDTH - RIGHT_COL_X - MARGIN;
  
  let leftY = currentY;
  let rightY = currentY;

  // --- Left Column ---
  // Summary
  if (data.summary) {
    leftY = drawSectionHeader(ctx, 'Résumé', leftY, LEFT_COL_X, LEFT_COL_WIDTH);
    ctx.font = BODY_FONT;
    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = 'left';
    leftY = wrapText(ctx, data.summary, LEFT_COL_X, leftY, LEFT_COL_WIDTH, 14);
    leftY += 25;
  }
  
  // Skills
  if (data.skills && data.skills.length > 0) {
    leftY = drawSectionHeader(ctx, 'Compétences', leftY, LEFT_COL_X, LEFT_COL_WIDTH);
    ctx.font = BODY_FONT;
    ctx.fillStyle = TEXT_COLOR;
    data.skills.forEach(skill => {
        if(skill) {
            leftY = wrapText(ctx, `• ${skill}`, LEFT_COL_X, leftY, LEFT_COL_WIDTH, 15);
        }
    });
    leftY += 25;
  }

  // --- Right Column ---
  // Experience
  if (data.experience && data.experience.length > 0 && data.experience[0].jobTitle) {
      rightY = drawSectionHeader(ctx, 'Expérience Professionnelle', rightY, RIGHT_COL_X, RIGHT_COL_WIDTH);
      data.experience.forEach(exp => {
        ctx.font = `bold ${BODY_FONT}`;
        ctx.fillStyle = TEXT_COLOR;
        ctx.textAlign = 'left';
        ctx.fillText(exp.jobTitle || '[Titre du poste]', RIGHT_COL_X, rightY);
        
        ctx.font = BODY_FONT;
        ctx.textAlign = 'right';
        ctx.fillText(exp.duration || '[Durée]', A4_WIDTH - MARGIN, rightY);
        
        ctx.textAlign = 'left';
        ctx.fillStyle = SUBTLE_TEXT_COLOR;
        ctx.fillText(exp.company || '[Entreprise]', RIGHT_COL_X, rightY + 14);
        rightY += 30;

        exp.responsibilities.forEach(resp => {
            if (resp) {
                ctx.fillText('•', RIGHT_COL_X, rightY);
                rightY = wrapText(ctx, resp, RIGHT_COL_X + 10, rightY, RIGHT_COL_WIDTH - 10, 14);
            }
        });
        rightY += 15;
      });
  }

  // Education
  if (data.education && data.education.length > 0 && data.education[0].degree) {
      rightY = drawSectionHeader(ctx, 'Formation', rightY, RIGHT_COL_X, RIGHT_COL_WIDTH);
      data.education.forEach(edu => {
        ctx.font = `bold ${BODY_FONT}`;
        ctx.fillStyle = TEXT_COLOR;
        ctx.textAlign = 'left';
        ctx.fillText(edu.degree || '[Diplôme]', RIGHT_COL_X, rightY);
        
        ctx.font = BODY_FONT;
        ctx.textAlign = 'right';
        ctx.fillText(edu.duration || '[Durée]', A4_WIDTH - MARGIN, rightY);
        
        ctx.textAlign = 'left';
        ctx.fillStyle = SUBTLE_TEXT_COLOR;
        ctx.fillText(edu.institution || '[Établissement]', RIGHT_COL_X, rightY + 14);
        rightY += 35;
      });
  }
};


// --- Main Export ---

const drawCv = (canvas: HTMLCanvasElement, data: CvData, templateKey: string) => {
  canvas.width = A4_WIDTH;
  canvas.height = A4_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

  const drawFunction = templates[templateKey]?.draw || drawTemplateModern;
  drawFunction(ctx, data);
};

export const templates: Record<string, { name: string, draw: (ctx: CanvasRenderingContext2D, data: CvData) => void }> = {
  modern: {
    name: 'Moderne',
    draw: drawTemplateModern,
  },
  classic: {
    name: 'Classique',
    draw: drawTemplateClassic,
  },
  creative: {
    name: 'Créatif',
    draw: drawTemplateCreative,
  }
};

export const cvGenerator = {
  drawCv,
  templates,
  dimensions: {
    width: A4_WIDTH,
    height: A4_HEIGHT,
  }
};