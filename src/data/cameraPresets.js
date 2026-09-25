export const FILTER_CATEGORIES = [
  { id: 'all', name: 'Semua Preset' },
  { id: 'fuji', name: 'Fujifilm Simulation' },
  { id: 'kodak', name: 'Kodak Analog' },
  { id: 'vintage', name: 'Vintage & Instant' },
  { id: 'digital', name: 'Digital & Y2K CCD' },
];

export const CAMERA_PRESETS = [
  // 1. FUJIFILM FILM SIMULATION
  {
    id: 'fuji_classic_chrome',
    name: 'Fujifilm Classic Chrome',
    shortName: 'Classic Chrome',
    brand: 'FUJIFILM',
    category: 'fuji',
    description: 'Tone dokumenter legendaris dengan saturasi kalem dan bayangan pekat khas film majalah.',
    tag: 'Documentary',
    accentColor: '#059669',
    css: 'contrast(116%) saturate(85%) sepia(12%) hue-rotate(-6deg) brightness(102%)'
  },
  {
    id: 'fuji_classic_neg',
    name: 'Fujifilm Classic Negative',
    shortName: 'Classic Neg',
    brand: 'FUJIFILM',
    category: 'fuji',
    description: 'Emulasi film warna Superia legendaris dengan kontras tinggi, warna hijau pekat, dan rona merah tegas.',
    tag: 'Superia 400',
    accentColor: '#15803D',
    css: 'contrast(130%) saturate(110%) sepia(18%) hue-rotate(-12deg) brightness(98%)'
  },
  {
    id: 'fuji_velvia_50',
    name: 'Fujichrome Velvia 50',
    shortName: 'Velvia 50',
    brand: 'FUJIFILM',
    category: 'fuji',
    description: 'Saturasi kaya & punchy, warna merah dan biru menyala, favorit foto lanskap & penuh energi.',
    tag: 'Vivid Slide',
    accentColor: '#10B981',
    css: 'contrast(128%) saturate(145%) brightness(104%)'
  },
  {
    id: 'fuji_provia',
    name: 'Fujichrome Provia 100F',
    shortName: 'Provia Standard',
    brand: 'FUJIFILM',
    category: 'fuji',
    description: 'Gradasi warna netral alami dan seimbang, setia mereproduksi pencahayaan asli.',
    tag: 'True Balance',
    accentColor: '#34D399',
    css: 'contrast(106%) saturate(110%) brightness(101%)'
  },
  {
    id: 'fuji_astia_soft',
    name: 'Fujifilm Astia Soft',
    shortName: 'Astia Soft',
    brand: 'FUJIFILM',
    category: 'fuji',
    description: 'Gradasi lembut dengan rona kulit halus berseri, sangat pas untuk potret wajah estetik.',
    tag: 'Portrait Soft',
    accentColor: '#F472B6',
    css: 'contrast(98%) brightness(107%) saturate(104%) sepia(10%)'
  },
  {
    id: 'fuji_pro_neg_hi',
    name: 'Fujifilm PRO Neg. Hi',
    shortName: 'Pro Neg Hi',
    brand: 'FUJIFILM',
    category: 'fuji',
    description: 'Profil studio profesional dengan gradasi tonal kulit presisi dan kontras berbobot.',
    tag: 'Studio Portrait',
    accentColor: '#047857',
    css: 'contrast(118%) saturate(102%) brightness(103%) sepia(6%)'
  },
  {
    id: 'fuji_acros',
    name: 'Fujifilm ACROS 100',
    shortName: 'ACROS B&W',
    brand: 'FUJIFILM',
    category: 'fuji',
    description: 'Film hitam-putih premium dengan ketajaman tonal tinggi dan bayangan hitam beludru.',
    tag: 'Fine Mono',
    accentColor: '#4B5563',
    css: 'grayscale(100%) contrast(138%) brightness(96%)'
  },

  // 2. KODAK ANALOG COLOR & MONO
  {
    id: 'kodak_portra_400',
    name: 'Kodak Portra 400',
    shortName: 'Portra 400',
    brand: 'KODAK',
    category: 'kodak',
    description: 'Preset potret nomor satu di dunia dengan warna kulit hangat keemasan dan highlight pastel.',
    tag: 'Golden Hour',
    accentColor: '#F59E0B',
    css: 'sepia(24%) saturate(118%) contrast(108%) brightness(104%) hue-rotate(-8deg)'
  },
  {
    id: 'kodacolor_gold_200',
    name: 'Kodacolor Gold 200',
    shortName: 'Kodak Gold 200',
    brand: 'KODAK',
    category: 'kodak',
    description: 'Nuansa ceria nostalgia 90-an dengan pendaran warna kuning hangat dan bayangan lembut.',
    tag: 'Nostalgic Sun',
    accentColor: '#D97706',
    css: 'sepia(38%) saturate(125%) contrast(106%) hue-rotate(-12deg) brightness(103%)'
  },
  {
    id: 'kodak_colorplus_200',
    name: 'Kodak ColorPlus 200',
    shortName: 'ColorPlus 200',
    brand: 'KODAK',
    category: 'kodak',
    description: 'Film analog harian dengan rona hangat kekuningan-hijau vintage yang autentik.',
    tag: 'Everyday Analog',
    accentColor: '#CA8A04',
    css: 'sepia(30%) saturate(115%) contrast(110%) hue-rotate(-15deg) brightness(101%)'
  },
  {
    id: 'kodak_ektar_100',
    name: 'Kodak Ektar 100',
    shortName: 'Ektar 100',
    brand: 'KODAK',
    category: 'kodak',
    description: 'Warna sangat tajam dan pekat dengan grain mikro ultra halus, warna merah menyala.',
    tag: 'Ultra Vivid',
    accentColor: '#EA580C',
    css: 'contrast(122%) saturate(136%) brightness(102%) hue-rotate(4deg)'
  },
  {
    id: 'kodachrome_64',
    name: 'Kodak Kodachrome 64',
    shortName: 'Kodachrome 64',
    brand: 'KODAK',
    category: 'kodak',
    description: 'Warna legendaris National Geographic 1970-an dengan kontras tebal dan warna merah menyala.',
    tag: 'Vintage 1970s',
    accentColor: '#B45309',
    css: 'contrast(126%) saturate(132%) sepia(22%) hue-rotate(-10deg) brightness(97%)'
  },
  {
    id: 'kodak_trix_400',
    name: 'Kodak Tri-X 400',
    shortName: 'Tri-X 400 B&W',
    brand: 'KODAK',
    category: 'kodak',
    description: 'Film monokrom jalanan legendaris dengan kontras dramatis dan bayangan tebal.',
    tag: 'Street Grit',
    accentColor: '#374151',
    css: 'grayscale(100%) contrast(152%) brightness(92%)'
  },

  // 3. VINTAGE, INSTANT & CLASSIC ANALOG
  {
    id: 'polaroid_600',
    name: 'Polaroid 600 Instant',
    shortName: 'Polaroid 600',
    brand: 'POLAROID',
    category: 'vintage',
    description: 'Sensasi cetak kamera polaroid dengan highlight dreamy dan bayangan kebiruan vintage.',
    tag: 'Dreamy Instant',
    accentColor: '#06B6D4',
    css: 'contrast(104%) brightness(110%) saturate(92%) sepia(22%) hue-rotate(14deg)'
  },
  {
    id: 'polaroid_sx70',
    name: 'Polaroid SX-70 Faded',
    shortName: 'Polaroid SX-70',
    brand: 'POLAROID',
    category: 'vintage',
    description: 'Warna cetak instan tahun 1972 dengan warna pudar pastel hangat dan kontras lembut.',
    tag: 'Faded Pastel',
    accentColor: '#0891B2',
    css: 'contrast(95%) brightness(112%) saturate(88%) sepia(28%) hue-rotate(8deg)'
  },
  {
    id: 'disposable_35mm',
    name: 'Disposable QuickSnap 35mm',
    shortName: 'Disposable 35mm',
    brand: 'ANALOG',
    category: 'vintage',
    description: 'Karakter kamera sekali pakai dengan kilap flash terang, vignetting, dan warna pop ceria.',
    tag: 'Flash Pop',
    accentColor: '#EC4899',
    css: 'contrast(124%) saturate(130%) brightness(112%) sepia(14%)'
  },
  {
    id: 'leica_m_mono',
    name: 'Leica M Monochrom',
    shortName: 'Leica M',
    brand: 'LEICA',
    category: 'vintage',
    description: 'Kemewahan lensa Jerman tanpa filter warna, menghasilkan tekstur abu-abu kaya beludru.',
    tag: 'Pure Rangefinder',
    accentColor: '#EF4444',
    css: 'grayscale(100%) contrast(128%) brightness(100%)'
  },
  {
    id: 'ilford_hp5',
    name: 'Ilford HP5 Plus 400',
    shortName: 'Ilford HP5',
    brand: 'ILFORD',
    category: 'vintage',
    description: 'Film hitam putih Inggris klasik dengan gradasi abu-abu fleksibel dan elegan.',
    tag: 'British Classic',
    accentColor: '#9CA3AF',
    css: 'grayscale(100%) contrast(118%) brightness(102%)'
  },
  {
    id: 'lomo_lca',
    name: 'Lomo LC-A Cross Process',
    shortName: 'Lomography LC-A',
    brand: 'LOMO',
    category: 'vintage',
    description: 'Eksperimen warna silang eksentrik ala kamera Rusia dengan saturasi liar dan vinyet kuat.',
    tag: 'Lomography',
    accentColor: '#8B5CF6',
    css: 'contrast(135%) saturate(155%) hue-rotate(-24deg) brightness(98%)'
  },

  // 4. DIGITAL ERA & Y2K CCD CAMERAS
  {
    id: 'canon_powershot_ccd',
    name: 'Canon PowerShot Y2K CCD',
    shortName: 'Y2K CCD Digicam',
    brand: 'DIGICAM',
    category: 'digital',
    description: 'Estetika kamera saku digital era 2000-an dengan warna sensor CCD punchy dan kilap flash.',
    tag: 'Y2K Flash',
    accentColor: '#2563EB',
    css: 'contrast(118%) saturate(125%) brightness(108%) hue-rotate(6deg)'
  },
  {
    id: 'sony_cybershot_ccd',
    name: 'Sony Cyber-shot Digicam',
    shortName: 'Cyber-shot 2005',
    brand: 'DIGICAM',
    category: 'digital',
    description: 'Warna khas sensor CCD Sony tahun 2000-an awal dengan tone kulit bening dan tint kebiruan segar.',
    tag: 'Early 2000s',
    accentColor: '#3B82F6',
    css: 'contrast(114%) saturate(118%) brightness(107%) hue-rotate(12deg)'
  },
  {
    id: 'cinestill_800t',
    name: 'CineStill 800T Cinema',
    shortName: 'CineStill 800T',
    brand: 'CINEMA',
    category: 'digital',
    description: 'Sensasi film gulung bioskop Hollywood dengan pencahayaan malam teal-orange puitis.',
    tag: 'Cinema Night',
    accentColor: '#0D9488',
    css: 'contrast(116%) saturate(122%) sepia(20%) hue-rotate(-15deg) brightness(102%)'
  },
  {
    id: 'ricoh_gr_positive',
    name: 'Ricoh GR Positive Film',
    shortName: 'Ricoh GR Positive',
    brand: 'RICOH',
    category: 'digital',
    description: 'Mode Positive Film favorit fotografer jalanan Tokyo dengan kontras tajam dan hitam solid.',
    tag: 'Tokyo Street',
    accentColor: '#EA580C',
    css: 'contrast(130%) saturate(118%) brightness(98%)'
  },

  // 5. STANDARD RAW
  {
    id: 'none',
    name: 'Standard Natural',
    shortName: 'Natural Raw',
    brand: 'RAW',
    category: 'all',
    description: 'Warna murni asli tangkapan sensor kamera tanpa rekayasa profil film.',
    tag: 'Unfiltered',
    accentColor: '#9CA3AF',
    css: 'none'
  }
];
