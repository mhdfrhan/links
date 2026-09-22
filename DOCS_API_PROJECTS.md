# Dokumentasi API Projek untuk Han Digital Solutions

Dokumentasi ini menjelaskan cara mengintegrasikan dan mengambil data portofolio dari **https://hannn.my.id** ke website **Han Digital Solutions**.

---

## 1. Endpoint Overview

- **Base URL**: `https://hannn.my.id`
- **Path**: `/api/projects`
- **Method**: `GET` (Mendukung `OPTIONS` untuk CORS Preflight)
- **Response Format**: JSON
- **CORS**: Didukung penuh (`Access-Control-Allow-Origin: *`)

---

## 2. Keamanan API (Security Features)

Endpoint ini telah dilengkapi dengan beberapa lapisan keamanan:
1. **Penyaringan Data Sensitif**: Hanya field publik yang dikembalikan. Kunci API internal, token Cloudinary, credential database tidak pernah diekspos.
2. **Filtering Otomatis**: Hanya projek yang dicentang **"Bagikan ke API (Han Digital Solutions)"** di Dashboard Admin yang akan keluar di response.
3. **Rate Limiting**: Maksimal **60 request per menit per IP** untuk mencegah spam/scraping berlebihan (HTTP `429 Too Many Requests`).
4. **Opsional API Key (Opsional / Recommended)**:
   - Jika Anda menambahkan `PROJECTS_API_KEY=kunci_rahasia_anda` di file `.env` portfolio, API otomatis mewajibkan autentikasi.
   - Kunci dapat dikirim melalui salah satu dari cara berikut:
     - Header `x-api-key: kunci_rahasia_anda`
     - Header `Authorization: Bearer kunci_rahasia_anda`
     - Query parameter: `?api_key=kunci_rahasia_anda`
   - *Catatan: Jika `PROJECTS_API_KEY` belum diset di `.env`, endpoint tetap dapat diakses secara publik dengan perlindungan Rate Limiter.*

---

## 3. Query Parameters

| Parameter | Tipe | Contoh | Keterangan |
|---|---|---|---|
| `limit` | integer | `?limit=6` | Batasi jumlah projek yang dikembalikan |
| `category` | string | `?category=Web` | Filter berdasarkan ID kategori atau nama kategori |
| `api_key` | string | `?api_key=...` | API Key (jika diaktifkan di .env) |

---

## 4. Contoh Response

### HTTP 200 OK
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "project_1710000000",
      "title": "Aplikasi POS Kedai Kopi",
      "title_en": "Coffee Shop POS App",
      "description": "Aplikasi kasir berbasis web yang responsif...",
      "description_en": "Responsive web-based cashier application...",
      "fullDescription": "Deskripsi lengkap...",
      "fullDescription_en": "Full description...",
      "imageUrl": "https://res.cloudinary.com/...",
      "cloudinaryPublicId": "portfolio/projects/...",
      "techStack": ["React", "Laravel", "MySQL"],
      "link": "https://github.com/mhdfrhan",
      "order": 0,
      "categoryId": "cat_web",
      "categoryName": "Web Development",
      "subCategoryId": "sub_fullstack",
      "subCategoryName": "Fullstack",
      "shareToApi": true
    }
  ]
}
```

---

## 5. Contoh Implementasi di Website Han Digital Solutions

### A. JavaScript / TypeScript (Fetch API / Next.js / React / Vue)
```javascript
async function getHanProjects() {
  try {
    const response = await fetch("https://hannn.my.id/api/projects", {
      headers: {
        // "x-api-key": "KUNCI_ANDA_JIKA_DIPAKAI",
      },
      next: { revalidate: 60 } // Jika menggunakan Next.js App Router (ISR Cache 60s)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data; // Array of projects
  } catch (error) {
    console.error("Gagal mengambil data projek:", error);
    return [];
  }
}
```

### B. PHP / Laravel (Http Client)
```php
use Illuminate\Support\Facades\Http;

$response = Http::withHeaders([
    // 'x-api-key' => env('HAN_PROJECTS_API_KEY'),
])->get('https://hannn.my.id/api/projects');

if ($response->successful()) {
    $projects = $response->json('data');
}
```

### C. cURL Terminal
```bash
curl -X GET "https://hannn.my.id/api/projects"
```
Dengan API Key:
```bash
curl -X GET "https://hannn.my.id/api/projects" -H "x-api-key: KUNCI_ANDA"
```

---

## 6. Cara Mengaktifkan / Menonaktifkan Projek di Dashboard

Anda memiliki 2 cara mudah:
1. **Cara Cepat (1-Klik langsung dari daftar projek)**:
   - Buka dashboard di [https://hannn.my.id/admin/projects](https://hannn.my.id/admin/projects).
   - Pada kartu projek yang diinginkan, langsung klik **toggle switch "API"** di samping tombol edit/hapus.
   - Status akan langsung terupdate ke Firebase secara instan (optimistic UI) dan badge hijau **"Shared to API"** akan otomatis aktif/nonaktif!
2. **Melalui Form Edit**:
   - Klik tombol **Edit (ikon pensil)** pada projek.
   - Centang/uncentang toggle **"Bagikan ke API (Han Digital Solutions)"**.
   - Klik **"Update Projek"**.
