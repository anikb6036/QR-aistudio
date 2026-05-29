/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import qrcode from 'qrcode';
import { QRDesignConfig } from '../types';

/**
 * Loads an image from a URL or data URL and returns an HTMLImageElement.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('No logo source provided'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + src));
    img.src = src;
  });
}

/**
 * Checks if a grid coordinate falls inside one of the three 7x7 Finder Patterns.
 */
export function isFinderPattern(x: number, y: number, size: number): boolean {
  // Top-Left Finder
  if (x < 7 && y < 7) return true;
  // Top-Right Finder
  if (x >= size - 7 && y < 7) return true;
  // Bottom-Left Finder
  if (x < 7 && y >= size - 7) return true;
  return false;
}

/**
 * Checks if a grid coordinate is covered by the central logo mask.
 */
export function isLogoArea(
  x: number,
  y: number,
  size: number,
  logoScale: number
): boolean {
  if (logoScale <= 0) return false;
  
  // Choose how many modules to clear in the center based on logo scale
  // Scale usually is between 0.1 and 0.25
  const logoGridSize = Math.ceil(size * (logoScale + 0.04)); // add margin padding
  const center = (size - 1) / 2;
  const halfEmptyZone = logoGridSize / 2;
  
  return (
    Math.abs(x - center) <= halfEmptyZone &&
    Math.abs(y - center) <= halfEmptyZone
  );
}

/**
 * Draws a single customized eye (Finder Pattern) onto the canvas context.
 */
export function drawEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  blockSize: number,
  outerStyle: string,
  innerStyle: string
) {
  const outerSize = 7 * blockSize;
  const innerSize = 3 * blockSize;
  const innerOffset = 2 * blockSize;

  ctx.save();

  // ----- Draw Outer Eye Frame -----
  ctx.beginPath();
  if (outerStyle === 'rounded') {
    ctx.roundRect(x, y, outerSize, outerSize, blockSize * 1.8);
  } else if (outerStyle === 'circle') {
    ctx.arc(x + outerSize / 2, y + outerSize / 2, outerSize / 2, 0, Math.PI * 2);
  } else if (outerStyle === 'leaf') {
    // Leaf shape: top-left and bottom-right are rounded, other two are square
    ctx.moveTo(x + outerSize, y);
    ctx.lineTo(x + outerSize, y + outerSize);
    ctx.lineTo(x, y + outerSize);
    ctx.arcTo(x, y, x + outerSize, y, outerSize); // round corner
    ctx.closePath();
  } else {
    // default: square
    ctx.rect(x, y, outerSize, outerSize);
  }

  // Draw transparent cutout for outer eye thickness
  // To draw a "ring", we can define the inner cutout using SVG fill rules
  // or simple drawing. Custom drawing: draw outer frame outline
  ctx.lineWidth = blockSize;
  ctx.stroke();

  // ----- Draw Inner Eye core -----
  ctx.beginPath();
  const ix = x + innerOffset;
  const iy = y + innerOffset;
  
  if (innerStyle === 'rounded') {
    ctx.roundRect(ix, iy, innerSize, innerSize, blockSize * 0.8);
    ctx.fill();
  } else if (innerStyle === 'circle') {
    ctx.beginPath();
    ctx.arc(ix + innerSize / 2, iy + innerSize / 2, innerSize / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (innerStyle === 'leaf') {
    ctx.moveTo(ix + innerSize, iy);
    ctx.lineTo(ix + innerSize, iy + innerSize);
    ctx.lineTo(ix, iy + innerSize);
    ctx.arcTo(ix, iy, ix + innerSize, iy, innerSize);
    ctx.closePath();
    ctx.fill();
  } else {
    // default: square
    ctx.rect(ix, iy, innerSize, innerSize);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Asynchronously draws the styled QR Code onto an HTML5 Canvas.
 */
export async function drawQRCodeOnCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  config: QRDesignConfig,
  pixelsSize: number
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set sizing
  canvas.width = pixelsSize;
  canvas.height = pixelsSize;

  // Resolve QR code modules matrix
  const qr = qrcode.create(text, {
    errorCorrectionLevel: config.errorCorrection,
  });

  const numModules = qr.modules.size;
  const marginBlocks = config.margin;
  const totalBlocks = numModules + marginBlocks * 2;
  const blockSize = pixelsSize / totalBlocks;

  // 1. Draw Background
  ctx.clearRect(0, 0, pixelsSize, pixelsSize);
  if (config.background !== 'transparent') {
    ctx.fillStyle = config.background;
    ctx.fillRect(0, 0, pixelsSize, pixelsSize);
  }

  ctx.save();

  // Set Foreground Stroke and Fill gradients or colors
  let fillStyle: string | CanvasGradient = config.foreground.solidColor;
  if (config.foreground.type === 'gradient') {
    if (config.foreground.gradientType === 'linear') {
      // Setup linear gradient bounding coordinates
      const radians = (config.foreground.gradientRotation * Math.PI) / 180;
      const x1 = Math.cos(radians) * 0 + pixelsSize / 2;
      const y1 = Math.sin(radians) * 0 + pixelsSize / 2;
      const x2 = Math.cos(radians) * pixelsSize + pixelsSize / 2;
      const y2 = Math.sin(radians) * pixelsSize + pixelsSize / 2;
      
      const grad = ctx.createLinearGradient(
        pixelsSize / 2 - Math.cos(radians) * (pixelsSize / 2),
        pixelsSize / 2 - Math.sin(radians) * (pixelsSize / 2),
        pixelsSize / 2 + Math.cos(radians) * (pixelsSize / 2),
        pixelsSize / 2 + Math.sin(radians) * (pixelsSize / 2)
      );
      grad.addColorStop(0, config.foreground.gradientColor1);
      grad.addColorStop(1, config.foreground.gradientColor2);
      fillStyle = grad;
    } else {
      // Radial Gradient
      const cx = pixelsSize / 2;
      const cy = pixelsSize / 2;
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, pixelsSize / 1.4);
      grad.addColorStop(0, config.foreground.gradientColor1);
      grad.addColorStop(1, config.foreground.gradientColor2);
      fillStyle = grad;
    }
  }

  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = fillStyle;

  // 2. Draw Eye Finder Patterns (Skip standard module rendering for these coordinates)
  const offsetMargin = marginBlocks * blockSize;
  
  // Top-Left Eye
  drawEye(
    ctx,
    offsetMargin,
    offsetMargin,
    blockSize,
    config.eyeStyleOuter,
    config.eyeStyleInner
  );

  // Top-Right Eye
  drawEye(
    ctx,
    offsetMargin + (numModules - 7) * blockSize,
    offsetMargin,
    blockSize,
    config.eyeStyleOuter,
    config.eyeStyleInner
  );

  // Bottom-Left Eye
  drawEye(
    ctx,
    offsetMargin,
    offsetMargin + (numModules - 7) * blockSize,
    blockSize,
    config.eyeStyleOuter,
    config.eyeStyleInner
  );

  // 3. Draw Data Modules / Patterns
  for (let r = 0; r < numModules; r++) {
    for (let c = 0; c < numModules; c++) {
      // Skip finder patterns inside 7x7 grid in top-left, top-right, bottom-left
      if (isFinderPattern(c, r, numModules)) {
        continue;
      }

      // Skip logo mask central zone if logo is configured
      if (config.logo.src && isLogoArea(c, r, numModules, config.logo.scale)) {
        continue;
      }

      // Check if module is filled
      const isFilled = qr.modules.get(c, r);
      if (!isFilled) {
        continue;
      }

      const bx = offsetMargin + c * blockSize;
      const by = offsetMargin + r * blockSize;

      ctx.beginPath();
      if (config.patternStyle === 'dots') {
        const cx = bx + blockSize / 2;
        const cy = by + blockSize / 2;
        const r = (blockSize / 2) * 0.88;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (config.patternStyle === 'smooth') {
        // Draw slightly rounded module block
        ctx.roundRect(bx + 0.5, by + 0.5, blockSize - 1, blockSize - 1, blockSize * 0.25);
        ctx.fill();
      } else if (config.patternStyle === 'extra-rounded') {
        // Draw heavily rounded module block
        ctx.roundRect(bx + 0.5, by + 0.5, blockSize - 1, blockSize - 1, blockSize * 0.45);
        ctx.fill();
      } else {
        // default: squares
        ctx.fillRect(bx, by, blockSize, blockSize);
      }
    }
  }

  ctx.restore();

  // 4. Draw Logo Overlay
  if (config.logo.src) {
    try {
      const logoImg = await loadImage(config.logo.src);
      
      const logoPixelSize = pixelsSize * config.logo.scale;
      const lx = (pixelsSize - logoPixelSize) / 2;
      const ly = (pixelsSize - logoPixelSize) / 2;
      
      // Draw background shield behind logo
      ctx.save();
      ctx.beginPath();
      const p = config.logo.padding * blockSize;
      const shieldX = lx - p;
      const shieldY = ly - p;
      const shieldSize = logoPixelSize + p * 2;
      
      if (config.logo.shape === 'circle') {
        ctx.arc(
          shieldX + shieldSize / 2,
          shieldY + shieldSize / 2,
          shieldSize / 2,
          0,
          Math.PI * 2
        );
      } else if (config.logo.shape === 'rounded') {
        ctx.roundRect(shieldX, shieldY, shieldSize, shieldSize, blockSize * 1.5);
      } else {
        ctx.rect(shieldX, shieldY, shieldSize, shieldSize);
      }

      if (config.logo.backgroundColor && config.logo.backgroundColor !== 'transparent') {
        ctx.fillStyle = config.logo.backgroundColor;
        ctx.fill();
      } else {
        // Clear background entirely under logo if no backgroundColor set
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();

      // Draw Logo Image
      ctx.save();
      // Apply clipping mask for logo shape if desired
      ctx.beginPath();
      if (config.logo.shape === 'circle') {
        ctx.arc(lx + logoPixelSize / 2, ly + logoPixelSize / 2, logoPixelSize / 2, 0, Math.PI * 2);
        ctx.clip();
      } else if (config.logo.shape === 'rounded') {
        ctx.roundRect(lx, ly, logoPixelSize, logoPixelSize, blockSize * 1);
        ctx.clip();
      }
      
      ctx.drawImage(logoImg, lx, ly, logoPixelSize, logoPixelSize);
      ctx.restore();
    } catch (err) {
      console.error('Error drawing logo inside QR code:', err);
    }
  }

  // 5. Draw Optional Footer Label
  if (config.label && config.label.text.trim()) {
    // Add extra padding at bottom or draw label in margin if spacing permits
    // Let's position label elegantly at bottom center in the quiet zone
    ctx.save();
    const fontSize = config.label.fontSize || Math.floor(pixelsSize * 0.04);
    ctx.font = `${fontSize}px ${config.label.fontFamily || 'sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = config.label.color || '#000000';
    
    // Position text label beautifully below the QR pattern
    const textY = pixelsSize - (offsetMargin / 3);
    ctx.fillText(config.label.text, pixelsSize / 2, textY);
    ctx.restore();
  }
}

/**
 * Generates an SVG String representing the styled QR Code (for professional-grade vector print design).
 */
export async function generateQRAsSVG(
  text: string,
  config: QRDesignConfig
): Promise<string> {
  // We can construct the SVG programmatically
  const qr = qrcode.create(text, {
    errorCorrectionLevel: config.errorCorrection,
  });

  const numModules = qr.modules.size;
  const marginBlocks = config.margin;
  const totalBlocks = numModules + marginBlocks * 2;
  const size = 500; // standard viewbox coordinates
  const blockSize = size / totalBlocks;

  let defs = '';
  let foregroundFill = config.foreground.solidColor;

  if (config.foreground.type === 'gradient') {
    foregroundFill = 'url(#qrGrad)';
    if (config.foreground.gradientType === 'linear') {
      const rad = (config.foreground.gradientRotation * Math.PI) / 180;
      const x1 = Math.round(50 + Math.cos(rad) * 50);
      const y1 = Math.round(50 + Math.sin(rad) * 50);
      const x2 = Math.round(50 - Math.cos(rad) * 50);
      const y2 = Math.round(50 - Math.sin(rad) * 50);
      defs = `
    <linearGradient id="qrGrad" x1="${100 - x1}%" y1="${100 - y1}%" x2="${x1}%" y2="${y1}%">
      <stop offset="0%" stop-color="${config.foreground.gradientColor1}" />
      <stop offset="100%" stop-color="${config.foreground.gradientColor2}" />
    </linearGradient>`;
    } else {
      defs = `
    <radialGradient id="qrGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="${config.foreground.gradientColor1}" />
      <stop offset="100%" stop-color="${config.foreground.gradientColor2}" />
    </radialGradient>`;
    }
  }

  let paths = '';
  const offsetMargin = marginBlocks * blockSize;

  // Background rect
  const backgroundXml =
    config.background !== 'transparent'
      ? `<rect width="${size}" height="${size}" fill="${config.background}" />`
      : '';

  // Draw eye frame helpers (outputs clean vector path strings for the SVG)
  const drawSvgEye = (ex: number, ey: number) => {
    const os = 7 * blockSize;
    const is = 3 * blockSize;
    const io = 2 * blockSize;
    let outerPath = '';
    let innerPath = '';

    // Outer
    if (config.eyeStyleOuter === 'rounded') {
      const r = blockSize * 1.8;
      outerPath = `M ${ex + r} ${ey} h ${os - 2 * r} a ${r} ${r} 0 0 1 ${r} ${r} v ${os - 2 * r} a ${r} ${r} 0 0 1 -${r} ${r} h -${os - 2 * r} a ${r} ${r} 0 0 1 -${r} -${r} v -${os - 2 * r} a ${r} ${r} 1 0 1 ${r} -${r} Z`;
    } else if (config.eyeStyleOuter === 'circle') {
      const r = os / 2;
      outerPath = `M ${ex + r} ${ey} a ${r} ${r} 0 1 1 0 ${os} a ${r} ${r} 0 1 1 0 -${os} Z`;
    } else if (config.eyeStyleOuter === 'leaf') {
      outerPath = `M ${ex + os} ${ey} v ${os} h -${os} a ${os} ${os} 0 0 1 ${os} -${os} Z`;
    } else {
      outerPath = `M ${ex} ${ey} h ${os} v ${os} h -${os} Z`;
    }

    // Outer inner cutout (to make eye frame thin)
    const co = blockSize;
    const ci = os - 2 * co;
    const cr = config.eyeStyleOuter === 'rounded' ? blockSize * 0.8 : 0;
    
    let innerCutout = '';
    if (config.eyeStyleOuter === 'rounded') {
      innerCutout = `M ${ex + co + cr} ${ey + co} h ${ci - 2 * cr} a ${cr} ${cr} 0 0 1 ${cr} ${cr} v ${ci - 2 * cr} a ${cr} ${cr} 0 0 1 -${cr} ${cr} h -${ci - 2 * cr} a ${cr} ${cr} 0 0 1 -${cr} -${cr} v -${ci - 2 * cr} a ${cr} ${cr} 1 0 1 ${cr} -${cr} Z`;
    } else if (config.eyeStyleOuter === 'circle') {
      const ir = ci / 2;
      innerCutout = `M ${ex + co + ir} ${ey + co} a ${ir} ${ir} 0 1 1 0 ${ci} a ${ir} ${ir} 0 1 1 0 -${ci} Z`;
    } else if (config.eyeStyleOuter === 'leaf') {
      innerCutout = `M ${ex + os - co} ${ey + co} v ${ci} h -${ci} a ${ci} ${ci} 0 0 1 ${ci} -${ci} Z`;
    } else {
      innerCutout = `M ${ex + co} ${ey + co} h ${ci} v ${ci} h -${ci} Z`;
    }

    // Inner Eyeball
    const ix = ex + io;
    const iy = ey + io;
    if (config.eyeStyleInner === 'rounded') {
      const r = blockSize * 0.8;
      innerPath = `M ${ix + r} ${iy} h ${is - 2 * r} a ${r} ${r} 0 0 1 ${r} ${r} v ${is - 2 * r} a ${r} ${r} 0 0 1 -${r} ${r} h -${is - 2 * r} a ${r} ${r} 0 0 1 -${r} -${r} v -${is - 2 * r} a ${r} ${r} 1 0 1 ${r} -${r} Z`;
    } else if (config.eyeStyleInner === 'circle') {
      const r = is / 2;
      innerPath = `M ${ix + r} ${iy} a ${r} ${r} 0 1 1 0 ${is} a ${r} ${r} 0 1 1 0 -${is} Z`;
    } else if (config.eyeStyleInner === 'leaf') {
      innerPath = `M ${ix + is} ${iy} v ${is} h -${is} a ${is} ${is} 0 0 1 ${is} -${is} Z`;
    } else {
      innerPath = `M ${ix} ${iy} h ${is} v ${is} h -${is} Z`;
    }

    // Combine paths with vector cutout rules
    return `<path d="${outerPath} ${innerCutout} ${innerPath}" fill="${foregroundFill}" fill-rule="evenodd" />`;
  };

  // 1. Render vector Eyes
  paths += drawSvgEye(offsetMargin, offsetMargin); // Top-Left
  paths += drawSvgEye(offsetMargin + (numModules - 7) * blockSize, offsetMargin); // Top-Right
  paths += drawSvgEye(offsetMargin, offsetMargin + (numModules - 7) * blockSize); // Bottom-Left

  // 2. Render vector Data modules
  let modulePaths = '';
  for (let r = 0; r < numModules; r++) {
    for (let c = 0; c < numModules; c++) {
      if (isFinderPattern(c, r, numModules)) continue;
      if (config.logo.src && isLogoArea(c, r, numModules, config.logo.scale)) continue;

      const isFilled = qr.modules.get(c, r);
      if (!isFilled) continue;

      const bx = offsetMargin + c * blockSize;
      const by = offsetMargin + r * blockSize;

      if (config.patternStyle === 'dots') {
        const cx = bx + blockSize / 2;
        const cy = by + blockSize / 2;
        const radius = (blockSize / 2) * 0.88;
        modulePaths += `M ${cx} ${cy} m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0 `;
      } else if (config.patternStyle === 'smooth' || config.patternStyle === 'extra-rounded') {
        const radius = blockSize * (config.patternStyle === 'extra-rounded' ? 0.45 : 0.25);
        modulePaths += `M ${bx + radius} ${by} h ${blockSize - radius * 2} a ${radius} ${radius} 0 0 1 ${radius} ${radius} v ${blockSize - radius * 2} a ${radius} ${radius} 0 0 1 -${radius} ${radius} h -${blockSize - radius * 2} a ${radius} ${radius} 0 0 1 -${radius} -${radius} v -${blockSize - radius * 2} a ${radius} ${radius} 0 0 1 ${radius} -${radius} Z `;
      } else {
        // squares
        modulePaths += `M ${bx} ${by} h ${blockSize} v ${blockSize} h -${blockSize} Z `;
      }
    }
  }

  if (modulePaths) {
    paths += `<path d="${modulePaths}" fill="${foregroundFill}" />`;
  }

  // 3. Logo Shield and Logo image embed
  let logoXml = '';
  if (config.logo.src) {
    const logoSize = size * config.logo.scale;
    const lx = (size - logoSize) / 2;
    const ly = (size - logoSize) / 2;
    const p = config.logo.padding * blockSize;
    
    // Shield
    const sx = lx - p;
    const sy = ly - p;
    const ss = logoSize + p * 2;
    let shieldPath = '';
    
    if (config.logo.shape === 'circle') {
      const r = ss / 2;
      shieldPath = `M ${sx + r} ${sy} a ${r} ${r} 0 1 1 0 ${ss} a ${r} ${r} 0 1 1 0 -${ss} Z`;
    } else if (config.logo.shape === 'rounded') {
      const r = blockSize * 1.5;
      shieldPath = `M ${sx + r} ${sy} h ${ss - 2 * r} a ${r} ${r} 0 0 1 ${r} ${r} v ${ss - 2 * r} a ${r} ${r} 0 0 1 -${r} ${r} h -${ss - 2 * r} a ${r} ${r} 0 0 1 -${r} -${r} v -${ss - 2 * r} a ${r} ${r} 0 0 1 ${r} -${r} Z`;
    } else {
      shieldPath = `M ${sx} ${sy} h ${ss} v ${ss} h -${sx} Z`;
    }

    const shieldColor = config.logo.backgroundColor || '#ffffff';
    if (shieldColor !== 'transparent') {
      logoXml += `<path d="${shieldPath}" fill="${shieldColor}" />`;
    }

    // Embed Logo image (using href data url or absolute)
    // Note: To preserve pure-vector SVG if logo is uploaded, logo is converted to Base64 in config.src
    let customMask = '';
    if (config.logo.shape === 'circle') {
      customMask = ` clip-path="inset(0% round 50%)"`;
    } else if (config.logo.shape === 'rounded') {
      customMask = ` clip-path="inset(0% round 8px)"`;
    }
    
    logoXml += `<image href="${config.logo.src}" x="${lx}" y="${ly}" width="${logoSize}" height="${logoSize}"${customMask} />`;
  }

  // 4. Draw Label
  let labelXml = '';
  if (config.label && config.label.text.trim()) {
    const fontSize = config.label.fontSize ? Math.floor(size * (config.label.fontSize / 500)) : 18;
    const labelY = size - (offsetMargin / 3);
    labelXml = `
    <text x="${size / 2}" y="${labelY}" 
          font-family="${config.label.fontFamily || 'sans-serif'}" 
          font-size="${fontSize}" 
          fill="${config.label.color || '#000000'}" 
          text-anchor="middle">${config.label.text}</text>`;
  }

  // Construct XML
  return `<?xml version="1.0" encoding="utf-8"?>
<svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}
  </defs>
  ${backgroundXml}
  ${paths}
  ${logoXml}
  ${labelXml}
</svg>`;
}
