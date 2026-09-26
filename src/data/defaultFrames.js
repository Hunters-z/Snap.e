// Default photostrip frames catalog: Graphic Designed & Solid Minimalist
export const DEFAULT_FRAMES = [
  // 1. GRAPHIC & ILLUSTRATED FRAMES
  {
    id: 'film_35mm_sprocket',
    name: '35mm Film Negative',
    category: 'graphic',
    badge: 'ANALOG',
    bg: '#141416',
    text: '#E5E7EB',
    tagline: 'Kodak Film Strip 35mm',
    overlayType: 'film',
    borderStyle: 'film-sprocket',
    description: 'Frame film negatif hitam legendaris lengkap dengan lubang sprocket dan nomor bingkai 35mm.'
  },
  {
    id: 'sakura_blossom',
    name: 'Sakura Blossom',
    category: 'graphic',
    badge: 'FLORAL',
    bg: '#FDF2F4',
    text: '#9F1239',
    tagline: 'Spring Cherry Petals',
    overlayType: 'sakura',
    borderStyle: 'floral-petal',
    description: 'Ilustrasi kelopak bunga sakura merah muda pastel yang manis dan estetik.'
  },
  {
    id: 'y2k_cyber_stars',
    name: 'Y2K Cyber Sparkle',
    category: 'graphic',
    badge: 'Y2K',
    bg: '#F5F3FF',
    text: '#4C1D95',
    tagline: 'Retro Digicam Stars',
    overlayType: 'y2k',
    borderStyle: 'cyber-sparkle',
    description: 'Nuansa digicam 2000-an dengan ornamen bintang krom 4-point dan kilau pop cyber.'
  },
  {
    id: 'coquette_ribbon',
    name: 'Coquette Bow Ribbon',
    category: 'graphic',
    badge: 'COQUETTE',
    bg: '#FFF8F6',
    text: '#831843',
    tagline: 'Sweet Ribbon & Pearls',
    overlayType: 'coquette',
    borderStyle: 'ribbon-pearl',
    description: 'Sentuhan pita satin merah muda dan bingkai mutiara vintage romantis.'
  },
  {
    id: 'korean_minimal_doodle',
    name: 'Korean Cafe Doodle',
    category: 'graphic',
    badge: 'DOODLE',
    bg: '#FAF7F2',
    text: '#451A03',
    tagline: 'Warm Cafe Illustrations',
    overlayType: 'doodle',
    borderStyle: 'minimal-doodle',
    description: 'Coretan ilustrasi kafe minimalis ala Seoul dengan cangkir kopi, tulip, dan hati kecil.'
  },
  {
    id: 'cat_cafe_illustrated',
    name: 'Aesthetic Cat & Coffee',
    category: 'graphic',
    badge: 'ARTWORK',
    bg: '#FFFDF9',
    text: '#5B3A29',
    tagline: 'Whiskers & Paw Latte',
    overlayType: 'cat_cafe',
    borderStyle: 'cat-doodle',
    description: 'Ilustrasi kucing lucu mengintip di sudut, jejak kaki paw cat, dan cangkir kopi hangat.'
  },
  {
    id: 'botanical_leaves',
    name: 'Botanical Watercolor',
    category: 'graphic',
    badge: 'NATURE',
    bg: '#F4F9F4',
    text: '#1C3A27',
    tagline: 'Eucalyptus & Wildflowers',
    overlayType: 'botanical',
    borderStyle: 'botanical-leaf',
    description: 'Bingkai dedaunan eucalyptus hijau alami dan kuntum bunga mekar estetik.'
  },
  {
    id: 'celebration_party',
    name: 'Party Balloons & Confetti',
    category: 'graphic',
    badge: 'PARTY',
    bg: '#FEF9F5',
    text: '#9A3412',
    tagline: 'Happy Moments Celebration',
    overlayType: 'party',
    borderStyle: 'party-confetti',
    description: 'Ilustrasi balon warna-warni ceria, topi pesta, pita emas, dan taburan konfeti.'
  },
  {
    id: 'vintage_newspaper',
    name: 'Vintage Newspaper',
    category: 'graphic',
    badge: 'RETRO',
    bg: '#F5EBE1',
    text: '#292524',
    tagline: 'The Daily Gazette 1984',
    overlayType: 'newspaper',
    borderStyle: 'retro-news',
    description: 'Koran antik tempo dulu dengan border tipografi editorial majalah klasik.'
  },

  // 2. SOLID MINIMALIST FRAMES
  {
    id: 'cream',
    name: 'Cream Warm',
    category: 'solid',
    badge: 'CLEAN',
    bg: '#F9F6F0',
    text: '#2A2521',
    description: 'Warna krem hangat lembut khas studio cetak Korea.'
  },
  {
    id: 'noir',
    name: 'Noir Dark',
    category: 'solid',
    badge: 'DARK',
    bg: '#111827',
    text: '#FFFFFF',
    description: 'Hitam pekat modern dengan kontras monokrom tajam.'
  },
  {
    id: 'minimal',
    name: 'Pure White',
    category: 'solid',
    badge: 'CLEAN',
    bg: '#FFFFFF',
    text: '#111827',
    description: 'Putih bersih minimalis tanpa distraksi.'
  },
  {
    id: 'pastel',
    name: 'Rose Pastel',
    category: 'solid',
    badge: 'PASTEL',
    bg: '#FDF2F8',
    text: '#831843',
    description: 'Rona mawar pastel feminin dan manis.'
  },
  {
    id: 'sepia',
    name: 'Vintage Sepia',
    category: 'solid',
    badge: 'RETRO',
    bg: '#FEF3C7',
    text: '#78350F',
    description: 'Nuansa cokelat keemasan klasik era fotografi lampau.'
  },
  {
    id: 'sage',
    name: 'Sage Green',
    category: 'solid',
    badge: 'PASTEL',
    bg: '#F0FDF4',
    text: '#14532D',
    description: 'Hijau sage menenangkan dengan rona alam segar.'
  },
  {
    id: 'lavender',
    name: 'Lavender Haze',
    category: 'solid',
    badge: 'PASTEL',
    bg: '#F5F3FF',
    text: '#4C1D95',
    description: 'Ungu lavender menawan bergradasi tenang.'
  }
];

// Helper to render graphic decorations onto HTML5 Canvas
export function drawFrameGraphicDecorations(ctx, frame, canvasWidth, canvasHeight, photoRects) {
  if (!frame || frame.category !== 'graphic') return;

  const type = frame.overlayType;

  if (type === 'film') {
    // 35mm film negative sprockets along left and right borders
    const sprocketW = 16;
    const sprocketH = 26;
    const sprocketRadius = 4;
    const spacing = 46;

    ctx.fillStyle = '#08080A';
    // Left sprocket gutter
    ctx.fillRect(0, 0, 34, canvasHeight);
    // Right sprocket gutter
    ctx.fillRect(canvasWidth - 34, 0, 34, canvasHeight);

    // Draw white/clear sprocket holes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let y = 20; y < canvasHeight - 20; y += spacing) {
      // Left hole
      drawRoundedRect(ctx, 9, y, sprocketW, sprocketH, sprocketRadius);
      // Right hole
      drawRoundedRect(ctx, canvasWidth - 25, y, sprocketW, sprocketH, sprocketRadius);
    }

    // Frame markings (Kodak 400, frame count numbers)
    ctx.save();
    ctx.fillStyle = '#EAB308';
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.textAlign = 'center';
    
    // Top & bottom edge text
    ctx.fillText('► KODAK PORTRA 400', canvasWidth / 2, 28);
    ctx.fillText('SAFETY FILM • 35MM • EXP 24', canvasWidth / 2, canvasHeight - 16);

    // Frame markers near each photo
    photoRects.forEach((rect, idx) => {
      ctx.fillStyle = '#EAB308';
      ctx.fillText(`2${idx + 1}A`, 20, rect.y + rect.h / 2);
      ctx.fillText(`2${idx + 1}A`, canvasWidth - 20, rect.y + rect.h / 2);
    });
    ctx.restore();
  } else if (type === 'sakura') {
    // Delicate cherry blossoms in corners and sides
    ctx.save();
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Top corners
    ctx.fillText('🌸', 45, 45);
    ctx.fillText('🌸', canvasWidth - 45, 45);

    // Floral motifs around photos
    photoRects.forEach((rect, idx) => {
      const petal = idx % 2 === 0 ? '💮' : '🌸';
      ctx.fillText(petal, rect.x - 14, rect.y + 20);
      ctx.fillText(petal, rect.x + rect.w + 14, rect.y + rect.h - 20);
    });

    // Japanese aesthetic text in header
    ctx.font = "bold 13px 'Playfair Display', serif";
    ctx.fillStyle = '#BE123C';
    ctx.fillText('✿ 桜の花 • SAKURA MEMORIES ✿', canvasWidth / 2, 32);
    ctx.restore();
  } else if (type === 'y2k') {
    // Chrome stars & cyber sparkles
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '26px sans-serif';
    ctx.fillText('✦', 35, 35);
    ctx.fillText('✦', canvasWidth - 35, 35);
    ctx.fillText('✧', canvasWidth / 2 - 90, 32);
    ctx.fillText('✧', canvasWidth / 2 + 90, 32);

    ctx.font = "bold 12px 'Inter', sans-serif";
    ctx.fillStyle = '#6D28D9';
    ctx.fillText('★ 2000s CYBER FLASH ★', canvasWidth / 2, 32);

    // Sparkles on side gutters
    photoRects.forEach((rect, idx) => {
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#8B5CF6';
      ctx.fillText('✨', 22, rect.y + 30);
      ctx.fillText('★', canvasWidth - 22, rect.y + rect.h - 30);
      if (idx === 1) {
        ctx.fillText('💖', canvasWidth - 22, rect.y + 30);
      }
    });
    ctx.restore();
  } else if (type === 'coquette') {
    // Bow ribbons and sweet pearl dots
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Header bows
    ctx.font = '28px sans-serif';
    ctx.fillText('🎀', canvasWidth / 2, 34);

    ctx.font = "italic bold 12px 'Playfair Display', serif";
    ctx.fillStyle = '#9D174D';
    ctx.fillText('~ with endless love ~', canvasWidth / 2, 60);

    // Side ribbons & hearts
    photoRects.forEach((rect) => {
      ctx.font = '18px sans-serif';
      ctx.fillText('🎀', 20, rect.y + rect.h / 2);
      ctx.fillText('🎀', canvasWidth - 20, rect.y + rect.h / 2);
    });
    ctx.restore();
  } else if (type === 'doodle') {
    // Cafe & Korean minimal line doodles
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '22px sans-serif';
    ctx.fillText('☕', 38, 36);
    ctx.fillText('🌷', canvasWidth - 38, 36);

    ctx.font = "500 13px 'Inter', sans-serif";
    ctx.fillStyle = '#78350F';
    ctx.fillText('daily moments in seoul ☕', canvasWidth / 2, 36);

    photoRects.forEach((rect, idx) => {
      const doodle = ['🐾', '🥐', '✨', '🤍'][idx % 4];
      ctx.fillText(doodle, 20, rect.y + rect.h - 15);
      ctx.fillText('☁️', canvasWidth - 20, rect.y + 15);
    });
    ctx.restore();
  } else if (type === 'newspaper') {
    // Editorial retro newspaper borders & volume stamp
    ctx.save();
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 1.5;
    
    // Double line under header
    ctx.beginPath();
    ctx.moveTo(35, 54);
    ctx.lineTo(canvasWidth - 35, 54);
    ctx.moveTo(35, 58);
    ctx.lineTo(canvasWidth - 35, 58);
    ctx.stroke();

    ctx.font = "bold 18px 'Playfair Display', serif";
    ctx.fillStyle = '#292524';
    ctx.textAlign = 'center';
    ctx.fillText('THE ATELIER TIMES', canvasWidth / 2, 36);

    ctx.font = "italic 11px 'Playfair Display', serif";
    ctx.fillText('VOL. XXIV • SPECIAL PHOTO EDITION', canvasWidth / 2, 50);
    ctx.restore();
  } else if (type === 'cat_cafe') {
    // Aesthetic Cat & Coffee illustrations
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '26px sans-serif';
    ctx.fillText('🐱', 38, 36);
    ctx.fillText('🐾', canvasWidth - 38, 36);

    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillStyle = '#5B3A29';
    ctx.fillText('🐾 CAT & COFFEE MEMORIES ☕', canvasWidth / 2, 36);

    photoRects.forEach((rect, idx) => {
      const catEmoji = ['🐈', '🐾', '🧶', '🐟'][idx % 4];
      ctx.font = '22px sans-serif';
      ctx.fillText(catEmoji, 22, rect.y + 35);
      ctx.fillText('🐾', canvasWidth - 20, rect.y + rect.h - 20);
      if (idx === 0) {
        ctx.fillText('☕', canvasWidth - 22, rect.y + 25);
      }
    });
    ctx.restore();
  } else if (type === 'botanical') {
    // Botanical Watercolor leaves & flora
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '24px sans-serif';
    ctx.fillText('🌿', 36, 36);
    ctx.fillText('🌿', canvasWidth - 36, 36);

    ctx.font = "italic bold 13px 'Playfair Display', serif";
    ctx.fillStyle = '#1C3A27';
    ctx.fillText('~ Botanical & Wildflowers ~', canvasWidth / 2, 36);

    photoRects.forEach((rect, idx) => {
      const flora = idx % 2 === 0 ? '🍃' : '🌱';
      ctx.font = '20px sans-serif';
      ctx.fillText(flora, 20, rect.y + 25);
      ctx.fillText('🌼', canvasWidth - 20, rect.y + rect.h - 25);
    });
    ctx.restore();
  } else if (type === 'party') {
    // Birthday & Celebration balloons and confetti
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '26px sans-serif';
    ctx.fillText('🎈', 36, 34);
    ctx.fillText('🎈', canvasWidth - 36, 34);

    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillStyle = '#C2410C';
    ctx.fillText('🎉 HAPPY CELEBRATION 🎂', canvasWidth / 2, 34);

    photoRects.forEach((rect, idx) => {
      const party = ['✨', '🎊', '🎁', '⭐'][idx % 4];
      ctx.font = '22px sans-serif';
      ctx.fillText(party, 20, rect.y + 30);
      ctx.fillText('🎈', canvasWidth - 20, rect.y + rect.h - 25);
    });
    ctx.restore();
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}
