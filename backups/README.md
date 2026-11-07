# Backup Desain Frontend (Pre-Glisse Liquid Glass Redesign)

Backup ini dibuat sebelum melakukan redesign total ke **Apple Glisse Liquid Glass Frost**.
Seluruh kode backend (`app/api/**`, `lib/firebase/**`, `lib/cloudinary/**`, `lib/hooks/**`, `lib/contexts/**`, `utils/supabase/**`) **tidak disentuh sama sekali**.

## Lokasi Backup

1. **Git Branch Backup**:
   - Nama branch: `backup/design-v1-minimalist-editorial`
   - Cara melihat atau kembali ke desain lama via Git:
     ```bash
     git checkout backup/design-v1-minimalist-editorial
     ```
   - Cara mengembalikan satu file tertentu dari backup Git:
     ```bash
     git checkout backup/design-v1-minimalist-editorial -- app/page.tsx
     ```

2. **File Archive Backup (ZIP)**:
   - Lokasi file: `backups/frontend-design-v1-backup.zip`
   - Berisi seluruh file frontend desain sebelumnya:
     - `app/layout.tsx`
     - `app/page.tsx`
     - `app/globals.css`
     - `app/providers.tsx`
     - `app/components/**` (19 komponen)
     - `app/portfolio/page.tsx`
     - `app/admin/**` (layout, 10 komponen admin, dan 16 halaman admin)
     - `REDESIGN_PROMPT_mhdfarhan_2026.md`
