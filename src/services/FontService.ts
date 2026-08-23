export const CURATED_FONTS = [
  'var(--font-text)',
  'Arial',
  'Calibri',
  'Cambria',
  'Cascadia Code',
  'Courier New',
  'Georgia',
  'Helvetica',
  'Inter',
  'JetBrains Mono',
  'Lato',
  'Merriweather',
  'Montserrat',
  'Noto Naskh Arabic',
  'Noto Sans',
  'Noto Sans Arabic',
  'Noto Serif',
  'Open Sans',
  'Poppins',
  'Roboto',
  'Scheherazade New',
  'Segoe UI',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  'Amiri',
  'Traditional Arabic',
  'Simplified Arabic',
  'Cairo',
  'Tajawal',
];

export class FontService {
  private cache: string[] | null = null;
  private pending: Promise<string[]> | null = null;

  public async getAvailableFonts(): Promise<string[]> {
    if (this.cache) return this.cache;
    if (this.pending) return this.pending;

    this.pending = this.loadAvailableFonts();
    try {
      this.cache = await this.pending;
      return this.cache;
    } finally {
      this.pending = null;
    }
  }

  private async loadAvailableFonts(): Promise<string[]> {
    const families = new Set<string>();

    const queryLocalFonts = (window as unknown as { queryLocalFonts?: () => Promise<Array<{ family?: string }>> }).queryLocalFonts;
    if (typeof queryLocalFonts === 'function') {
      try {
        const localFonts = await queryLocalFonts.call(window);
        for (const font of localFonts) {
          const family = font.family?.trim();
          if (family) families.add(family);
        }
      } catch {
        // Fall back to curated fonts
      }
    }

    if (families.size === 0) {
      for (const family of CURATED_FONTS) {
        if (family.startsWith('var(')) {
          families.add(family);
          continue;
        }
        try {
          if (document.fonts.check(`12px "${family}"`)) {
            families.add(family);
          }
        } catch {
          // Ignore check errors
        }
      }
    }

    return [...families].sort((a, b) => a.localeCompare(b));
  }

  public clearCache(): void {
    this.cache = null;
    this.pending = null;
  }
}
