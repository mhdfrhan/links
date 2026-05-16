# Portfolio Redesign Prompt — mhdfarhan.vercel.app

## Konteks

Kamu adalah senior frontend developer dengan keahlian UI/UX dan design engineering. Tugasmu adalah melakukan **redesign visual total** pada portfolio `mhdfarhan.vercel.app` menggunakan stack yang sudah ada (Next.js + Tailwind CSS + Framer Motion).

Pemilik portfolio ini adalah seorang **web developer dengan pengalaman 4 tahun**. Desain harus mencerminkan bahwa orang ini bukan pemula — dia sudah punya jam terbang dan tahu apa yang dia kerjakan.

**Satu aturan tidak boleh dilanggar: jangan sentuh backend sama sekali.** Semua data fetching, API calls, dan logika yang sudah ada tetap berjalan persis seperti semula. Yang berubah hanya cara data itu ditampilkan.

---

## Filosofi Desain: "Clean Developer Space"

Portfolio ini harus terasa seperti workspace seorang developer yang rapi tapi hidup — bukan galeri kosong, bukan juga ruang yang berantakan. Ada identitas teknis yang terasa natural: terminal kecil yang menampilkan data, code snippet yang relevan, tapi semuanya tetap dalam tatanan yang bersih dan terorganisir.

Prinsip utama:

1. **Clean, bukan kosong.** Ada elemen visual yang menunjukkan identitas developer (terminal, code block, monospace label), tapi semuanya punya tempat dan tidak saling berebut perhatian.
2. **Personality lewat detail teknis.** Terminal section, tech stack tags, dan code-style formatting adalah cara menunjukkan "orang ini developer" — bukan lewat efek visual yang berlebihan.
3. **Foto tetap ada dan menonjol.** Orang harus langsung tahu siapa yang memiliki portfolio ini. Foto bukan dekorasi — itu bagian penting dari personal branding.

---

## Palet Warna: Neutral dengan Satu Accent

Palet gelap yang tenang, berbasis neutral tone. Satu accent color dipakai secukupnya untuk memberikan focal point — bukan untuk mendominasi.

### Dark Mode (Default)

| Token            | Hex       | Penggunaan                              |
|------------------|-----------|-----------------------------------------|
| `--bg-primary`   | `#0f1117` | Background utama — dark navy-black       |
| `--bg-secondary` | `#161820` | Card background, panel terminal          |
| `--bg-tertiary`  | `#1e2028` | Hover state, code block background       |
| `--bg-code`      | `#1a1d26` | Terminal & code snippet background       |
| `--border`       | `#282a33` | Border antar elemen                      |
| `--border-hover` | `#3a3d47` | Border saat hover                        |
| `--text-primary` | `#e8e9ed` | Heading, nama, teks utama                |
| `--text-secondary`| `#9da1ae`| Body text, deskripsi                     |
| `--text-muted`   | `#5c6070` | Caption, metadata, timestamp             |
| `--accent`       | `#6c9ef5` | Link, CTA button, active indicator — muted soft blue |
| `--accent-hover` | `#85b0f7` | Accent saat hover                        |
| `--green`        | `#4ade80` | Status dot "available", terminal prompt  |

### Penggunaan Accent

Accent (`--accent`) dipakai untuk:
- Link teks saat hover
- Satu CTA button per halaman
- Active nav indicator
- Terminal prompt symbol

**Tidak untuk**: heading, seluruh border, atau background area besar.

---

## Tipografi: Dua Font, Gaya Normal

Dua font saja. Tidak ada italic. Heading tidak terlalu tebal — cukup medium/semibold supaya tetap clean tapi readable.

- **Inter** (400, 500) — Untuk heading, body, dan navigation. Weight 500 untuk heading (bukan 700). Weight 400 untuk body. Tidak ada italic sama sekali.
- **JetBrains Mono** (400) — Untuk terminal output, code snippet, tech tags, label metadata, dan monospace accent.

### Skala Tipografi

```
H1         : Inter 500   / 2.25rem / -0.02em / leading-[1.25]
H2         : Inter 500   / 1.5rem / -0.015em / leading-[1.3]
H3         : Inter 500   / 1.125rem / -0.01em / leading-[1.4]
Body       : Inter 400   / 0.9375rem / 0 / leading-[1.7]
Caption    : Inter 400   / 0.8125rem / 0.005em / leading-[1.5]
Mono       : JetBrains Mono 400 / 0.8125rem / 0.02em
Mono Small : JetBrains Mono 400 / 0.75rem / 0.03em
```

> ⚠️ Tidak ada `font-weight: 700` (bold) di heading. Gunakan `500` (medium) supaya clean tanpa terasa "teriak". Tidak ada `font-style: italic` di manapun.

---

## Layout Halaman

Layout bersih tapi tidak membosankan. Ada variasi visual lewat komponen teknis (terminal, code block) yang ditempatkan secara strategis.

### Struktur Desktop

```
┌──────────────────────────────────────────────────────┐
│  Navbar: sticky, backdrop-blur                        │
│  ~/mhdfarhan (mono) ──────── About  Projects  Contact │
│  ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ─── ───    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Hero Section (2 kolom):                              │
│  ┌───────────────────────┐  ┌──────────────────┐     │
│  │                        │  │                   │    │
│  │  Greeting mono kecil   │  │   FOTO PROFIL    │    │
│  │  "Hi, I'm"             │  │   (natural,      │    │
│  │  Nama (H1, medium)     │  │    rounded-xl,   │    │
│  │  Role — text-secondary  │  │    aspect 3:4)   │    │
│  │  Bio 2-3 baris          │  │                   │    │
│  │                        │  │   Di bawah foto:  │    │
│  │  Social icons (subtle)  │  │   Experience tag  │    │
│  │                        │  │   "4+ years"      │    │
│  └───────────────────────┘  └──────────────────┘     │
│                                                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Terminal Section:                                    │
│  ┌──────────────────────────────────────────────┐    │
│  │ ● ● ●  terminal — mhdfarhan                  │    │
│  │─────────────────────────────────────────────  │    │
│  │ $ whoami                                      │    │
│  │ > Muhammad Farhan — Web Developer             │    │
│  │ $ cat experience.json                         │    │
│  │ > { "years": 4, "focus": "fullstack web" }   │    │
│  │ $ ls skills/                                  │    │
│  │ > react/  nextjs/  tailwind/  node/  ...      │    │
│  │ $ echo $STATUS                                │    │
│  │ > "Open to opportunities" █                   │    │
│  │                                               │    │
│  └──────────────────────────────────────────────┘    │
│  Terminal menggunakan data dari backend,              │
│  diformat menjadi CLI output.                        │
│                                                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  About Section:                                      │
│  Teks paragraf natural, ditulis secara personal.      │
│  Bisa sisipkan inline code (`teknologi`) dalam teks.  │
│  Layout single column, max-width 680px, centered.     │
│                                                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Projects Section:                                   │
│  Grid 2 kolom:                                       │
│  ┌─────────────────┐  ┌─────────────────┐            │
│  │  Thumbnail       │  │  Thumbnail       │           │
│  │  ──────────────  │  │  ──────────────  │           │
│  │  Project Name    │  │  Project Name    │           │
│  │  Deskripsi       │  │  Deskripsi       │           │
│  │  [react] [next]  │  │  [vue] [node]    │           │
│  └─────────────────┘  └─────────────────┘            │
│                                                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Skills Section:                                     │
│  Dikelompokkan per kategori.                          │
│  Tampil sebagai label/chip dengan monospace font.     │
│  Layout flow (flexbox wrap).                          │
│                                                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Contact / Footer:                                   │
│  Heading: "Let's connect"                             │
│  Email (monospace, klikabel)                          │
│  Social links row                                     │
│  Copyright (small, muted)                             │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Responsivitas

- **Desktop (≥1024px)**: Max-width `1080px`, centered. Hero 2 kolom (teks + foto). Projects grid 2 kolom.
- **Tablet (768–1023px)**: Hero stack vertikal (foto di atas, teks di bawah). Projects tetap 2 kolom.
- **Mobile (<768px)**: Semua single column. Padding `1.25rem`. Foto lebih kecil tapi tetap ada.

---

## Komponen Visual

### Navbar
- Sticky top, background `--bg-primary` dengan `backdrop-blur-md` dan `bg-opacity-80`.
- Kiri: `~/mhdfarhan` dalam JetBrains Mono, ukuran kecil, warna `--text-muted`.
- Kanan: 3-4 nav link, font Inter 400, warna `--text-secondary`. Saat hover: warna `--text-primary`, underline tipis.
- Optional: Dot hijau kecil (`--green`) dengan label mono "available" di sebelah nav links.

### Hero + Foto Profil
- **Foto menonjol** di sisi kanan hero. Bukan tersembunyi di bawah atau kecil di sudut.
- Foto: `rounded-xl`, aspect ratio 3:4, border 1px `--border`. Tidak ada ring efek, tidak ada overlay, tidak ada filter.
- Di bawah foto: tag kecil monospace `"4+ years experience"` dengan warna `--text-muted`.
- Sisi kiri: greeting, nama (Inter 500, bukan bold), role, bio singkat, social icons.

### Terminal Block
- Ini adalah elemen signature yang menunjukkan identitas developer. **Tidak boleh dihilangkan.**
- Tampilan menyerupai window terminal: title bar dengan 3 dots (merah, kuning, hijau — kecil dan subtle), judul "terminal" dalam monospace.
- Background `--bg-code` dengan border `--border`, `rounded-lg`.
- Isi terminal menampilkan **data dari backend** yang diformat sebagai CLI output:
  - `$ whoami` → nama dan role
  - `$ cat about.json` → bio singkat dalam format JSON
  - `$ ls skills/` → daftar skill sebagai directory listing
  - Baris terakhir: blinking cursor (`█`) — ini satu-satunya animasi looping yang diizinkan.
- Font: JetBrains Mono 400, ukuran 0.8125rem.
- Warna prompt `$`: `--green`. Warna output: `--text-secondary`. Warna key JSON: `--accent`.

### Card Project
- Background `--bg-secondary`, border 1px `--border`, `rounded-lg`.
- Tidak ada shadow besar. Subtle shadow sangat tipis boleh (`box-shadow: 0 1px 3px rgba(0,0,0,0.1)`).
- Hover: border → `--border-hover`, `translateY(-2px)`, transition 200ms ease.
- Thumbnail di atas (rounded-t-lg), judul + deskripsi + tech tags di bawah.
- Tech tags: JetBrains Mono, ukuran kecil, background `--bg-tertiary`, `rounded-md`, padding kecil.

### Skill Chips
- Flexbox wrap layout.
- Chip: JetBrains Mono 400, background `--bg-tertiary`, border 1px `--border`, text `--text-secondary`, `rounded-md`.
- Grouped by kategori (Frontend, Backend, Tools, dll) dengan label H3 Inter 500.
- Tidak ada progress bar. Tidak ada persentase. Cukup nama skill.

### Inline Code dalam Teks
- Kapanpun menyebut teknologi dalam body text, bungkus dengan inline code styling: background `--bg-tertiary`, padding horizontal kecil, `rounded-sm`, JetBrains Mono.
- Contoh: "Saya sering bekerja dengan `React` dan `Next.js` untuk project fullstack."

---

## Animasi & Interaksi

### Prinsip
Animasi bersih dan cepat. Tidak ada yang dramatis, tapi juga tidak mati total. Tujuannya membuat interface terasa responsif dan hidup.

### Yang Diizinkan
- **Fade-in on scroll**: Opacity 0 → 1, translateY 16px → 0, duration 400ms, ease-out. `viewport={{ once: true }}`.
- **Staggered entrance**: Section children muncul satu per satu dengan delay 50ms antar item.
- **Hover card**: `translateY(-2px)`, border color shift, subtle shadow appear, transition 200ms.
- **Link hover**: Warna shift ke `--accent`, underline appear.
- **Terminal cursor blink**: `█` berkedip 1 detik interval. Ini satu-satunya looping animation.
- **Nav scroll effect**: Background opacity dari transparent → solid saat user scroll melewati hero.

### Yang Dilarang
- ❌ Particle effect / floating dots
- ❌ Custom cursor
- ❌ Glow blob / gradient blur di background
- ❌ Scanlines / CRT effect
- ❌ Parallax scrolling berlebihan
- ❌ Typing animation (kecuali terminal cursor blink)
- ❌ Warna neon (cyan terang, magenta, electric blue, lime green)
- ❌ Font italic di manapun
- ❌ Font weight 700+ di heading

---

## Tekstur & Kedalaman

- **Grain overlay** tipis (`opacity: 0.02`) di background — cukup untuk menghilangkan kesan flat.
- **Subtle shadow** hanya pada card project dan terminal block: `box-shadow: 0 1px 3px rgba(0,0,0,0.12)`.
- **Divider** antar section: garis horizontal 1px `--border`, margin vertikal `5rem`.
- **Terminal** dan **code blocks** punya background sedikit berbeda (`--bg-code`) untuk memberi kedalaman tanpa shadow.

---

## Yang Tidak Boleh Berubah

Semua data tetap dari backend. Nama, bio, skills, projects, social links — semuanya tetap diambil dari sumber yang sama seperti sebelumnya. Tidak ada data yang diubah, dikurangi, atau ditambah secara manual. Jika backend mengembalikan 5 project, tetap tampilkan 5 project. Jika ada field kosong dari API, tangani dengan graceful fallback seperti yang sudah ada.

---

## Referensi Visual

Portfolio yang dijadikan benchmark estetika:

- **[brittanychiang.com](https://brittanychiang.com)** — Dark theme bersih, ada unsur teknis tapi tetap rapi. Terminal-like element yang tidak berlebihan.
- **[leerob.io](https://leerob.io)** — Content-first, tipografi bersih, foto profil yang natural.
- **[joshwcomeau.com](https://joshwcomeau.com)** — Developer personality terasa kuat tapi layout tetap clean. Code block yang well-styled.
- **[zenorocha.com](https://zenorocha.com)** — Terminal aesthetic yang subtle, dark theme yang nyaman di mata.

---

## Checklist Final

Sebelum dianggap selesai, pastikan:

- [ ] Palet warna neutral + satu accent soft blue — tidak ada warna mencolok lainnya
- [ ] Foto profil terlihat jelas dan menonjol di hero section
- [ ] Terminal section ada dan menampilkan data dari backend sebagai CLI output
- [ ] Semua heading menggunakan Inter weight 500 (bukan 700)
- [ ] Tidak ada font italic di seluruh halaman
- [ ] Semua teks readable: contrast ratio minimal 4.5:1 untuk body
- [ ] Mobile view tetap menampilkan foto dan terminal
- [ ] Semua data masih di-fetch dari backend tanpa perubahan
- [ ] Hanya 2 font: Inter dan JetBrains Mono
- [ ] Terminal cursor blink adalah satu-satunya looping animation
- [ ] Inline code styling untuk menyebut teknologi dalam teks
- [ ] Lighthouse Performance score ≥ 85

---

## Hasil Akhir yang Diharapkan

Seseorang yang membuka portfolio ini langsung tahu dua hal: **siapa orangnya** (foto profil yang jelas) dan **apa keahliannya** (terminal, code blocks, tech tags yang naturally embedded). Desainnya bersih dan terorganisir, tapi tidak steril — ada kehangatan dari foto, ada karakter dari terminal, dan ada profesionalisme dari layout yang rapi.

Kesan yang ingin ditinggalkan: *"Orang ini developer yang berpengalaman, punya taste yang bagus, dan memperhatikan detail."*
