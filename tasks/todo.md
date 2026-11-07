# Task List & Todo Breakdown: 2026 Awwwards / 21st.dev / Framer Redesign (Lower Sections & ChatWidget)

> **Target Dokumen**: `tasks/todo.md` (mengacu pada `tasks/plan.md`)
> **Proteksi Backend & Admin**: 🔒 `app/api/**`, `lib/**`, `utils/**`, dan `app/admin/**` tidak diubah.

---

## Task 1: Redesign `ChatWidget.tsx` — iOS Smooth Bubbles & Fix Fullscreen-to-Minimize Bug

**Description:** Merombak `app/components/ChatWidget.tsx` dengan desain modern 2026 (21st.dev / Framer style), animasi bubble pesan sehalus iOS iMessage (`spring` physics dari sudut ekor bubble saat mengirim dan menerima stream), serta memperbaiki bug state ketika tombol Minimize ditekan saat berada di mode Fullscreen.

**Acceptance criteria:**
- [x] Menekan tombol Minimize saat mode Fullscreen aktif otomatis menonaktifkan `isFullscreen` (`setIsFullscreen(false)`), menghilangkan backdrop fullscreen, dan mengecilkan panel menjadi *Minimized Pill* di kanan bawah layar.
- [x] Bubble pesan user dan asisten memiliki geometri iOS modern (`20px 20px 4px 20px` dan `20px 20px 20px 4px`), animasi masuk `spring` (`stiffness: 520, damping: 34, mass: 0.7`) dari sudut ekor bubble, serta indikator mengetik beranimasi gelombang halus.
- [x] Input bar memiliki desain kapsul/dock modern dengan tombol kirim beranimasi pegas dan tombol *Reset Chat* di header.
- [x] Integrasi streaming `/api/chat` tetap berjalan 100% tanpa perubahan backend.

**Verification:**
- [x] Typecheck: `npx tsc --noEmit`
- [x] Manual check: Buka ChatWidget → klik Fullscreen → klik Minimize (pastikan mengecil ke pojok kanan bawah dan tidak menutupi layar) → klik Restore → kirim pesan.

**Dependencies:** None

**Files likely touched:**
- `app/components/ChatWidget.tsx`

**Estimated scope:** Small: 1 file

---

## Task 2: Redesign `SkillsSection.tsx` ("03. Teknologi yang Saya Gunakan")

**Description:** Merombak `app/components/SkillsSection.tsx` agar selaras dengan bagian atas website menggunakan tipografi editorial (`JetBrains Mono` label + `Playfair Display` heading), tab filter kategori interaktif dengan sliding pill `layoutId`, kartu kategori bergaya **21st.dev Spotlight Matrix** dengan nomor indeks (`/01`, `/02`), serta animasi masuk on-scroll dengan **GSAP `ScrollTrigger`**.

**Acceptance criteria:**
- [x] Header seksi menggunakan skala tipografi editorial yang konsisten dengan `PortfolioSection` dan `AboutSection`.
- [x] Memiliki filter tab kategori interaktif (`Semua` + masing-masing kategori) dengan transisi `layoutId` Framer Motion.
- [x] Kartu kategori memiliki efek hover spotlight yang mengikuti posisi kursor dan chip teknologi interaktif dengan indikator aksen.
- [x] Animasi reveal on-scroll berjalan halus menggunakan `useGSAP` / `ScrollTrigger`.

**Verification:**
- [x] Typecheck: `npx tsc --noEmit`
- [x] Manual check: Scroll ke seksi 03, uji filter kategori dan efek spotlight/hover pada chip teknologi.

**Dependencies:** None

**Files likely touched:**
- `app/components/SkillsSection.tsx`

**Estimated scope:** Small: 1 file

---

## Task 3: Redesign `ExperienceSection.tsx` ("04. Pengalaman Kerja / Organisasi / Kepanitiaan")

**Description:** Merombak `app/components/ExperienceSection.tsx` menjadi **Awwwards Editorial Interactive Timeline & Ledger** dengan garis progres vertikal yang terisi saat scroll (`GSAP ScrollTrigger`), indeks bernomor (`01`, `02`), tipografi `Playfair Display` & `Plus Jakarta Sans` yang tegas, serta akordeon detail poin beranimasi pegas halus.

**Acceptance criteria:**
- [x] Memiliki garis timeline vertikal yang teranimasi saat di-scroll serta indikator titik aktif.
- [x] Setiap item pengalaman tampil sebagai baris arsitektural modern dengan nomor urut, nama instansi/perusahaan, jabatan beraksen, badge periode `JetBrains Mono`, dan indikator ekspansi `+ / −`.
- [x] Akordeon poin pengalaman membuka/menutup dengan animasi spring halus dan stagger pada tiap poin.

**Verification:**
- [x] Typecheck: `npx tsc --noEmit`
- [x] Manual check: Scroll ke seksi 04, klik item pengalaman untuk membuka/menutup detail poin.

**Dependencies:** None

**Files likely touched:**
- `app/components/ExperienceSection.tsx`

**Estimated scope:** Small: 1 file

---

## Task 4: Redesign `EducationSection.tsx`, `AwardsSection.tsx`, and `CertificationsSection.tsx` ("05." s/d "07.")

**Description:** Merombak ketiga seksi terakhir (`EducationSection`, `AwardsSection`, `CertificationsSection`) dengan desain **2026 Awwwards / 21st.dev Editorial Ledger & Bento Showcase** lengkap dengan animasi on-scroll `GSAP ScrollTrigger`, tipografi `Playfair Display`, watermark indeks, hover row highlight, serta tombol magnetik verifikasi sertifikat.

**Acceptance criteria:**
- [x] `EducationSection.tsx` menampilkan kartu split arsitektural dengan watermark indeks, institusi dalam `Playfair Display`, gelar, dan blok callout skor/IPK beraksen `var(--accent)`.
- [x] `AwardsSection.tsx` menampilkan daftar penghargaan bergaya *Awwwards Interactive Ledger* dengan efek geser judul dan highlight baris saat di-hover.
- [x] `CertificationsSection.tsx` menampilkan grid sertifikasi profesional dengan bar metadata (`ISSUER` & `DATE`), masa berlaku, dan tombol interaktif `"Verify Credential ↗"`.
- [x] Ketiga seksi memiliki animasi on-scroll `useGSAP` / `ScrollTrigger` yang konsisten dengan bagian atas halaman.

**Verification:**
- [x] Typecheck: `npx tsc --noEmit`
- [x] Build check: `npm run build`
- [x] Manual check: Scroll dari bagian atas hingga bawah halaman untuk memastikan transisi visual dan ritme antar seksi terasa menyatu.

**Dependencies:** None

**Files likely touched:**
- `app/components/EducationSection.tsx`
- `app/components/AwardsSection.tsx`
- `app/components/CertificationsSection.tsx`

**Estimated scope:** Medium: 3 files

---

## Checkpoint: After Tasks 1-4
- [x] `npx tsc --noEmit` dan `npm run build` sukses tanpa error
- [x] Bug Fullscreen → Minimize pada `ChatWidget` terverifikasi hilang di browser
- [x] Seksi 03 s/d 07 tampil modern dan konsisten dengan seksi 01 & 02
