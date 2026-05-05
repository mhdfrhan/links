# Panduan Detail Setup & Integrasi Firebase CMS

Dokumen ini menjelaskan secara teknis bagaimana backend Firebase bekerja pada portofolio Anda, struktur data yang diperlukan, serta cara kerja sistem keamanan admin.

---

## 1. Setup Awal (Firebase Console)

### 1.1. Registrasi Project
- Buka [Firebase Console](https://console.firebase.google.com/).
- Buat project baru bernama `portfolio-admin`.
- Daftarkan aplikasi Web (`</>`) dan simpan konfigurasi `firebaseConfig` Anda.

### 1.2. Konfigurasi Environment Variables
Buat file `.env.local` di root folder proyek:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
```

---

## 2. Konfigurasi Firestore (Database)

### 2.1. Struktur Koleksi & Dokumen
Anda perlu membuat koleksi berikut di Firestore agar data dinamis muncul. Jika kosong, sistem akan menggunakan **fallback data statis** dari `lib/data.ts`.

#### Koleksi: `portfolio`
Gunakan koleksi ini untuk data global yang hanya memiliki satu dokumen.
- **Document ID:** `about`
  - Field: `text` (string) -> Deskripsi diri Anda.

#### Koleksi: `projects`
Gunakan koleksi ini untuk daftar proyek portofolio.
- **Document ID:** (Auto-generated)
  - `title` (string)
  - `description` (string)
  - `fullDescription` (string)
  - `imageUrl` (string)
  - `techStack` (array of strings)
  - `link` (string, optional)
  - `order` (number) -> Untuk urutan tampilan.

#### Koleksi: `experiences`, `education`, `awards`, `skills`
- **Document ID:** (Auto-generated)
- Tambahkan field sesuai struktur di `lib/data.ts`.
- **Penting:** Tambahkan field `order` (number) pada setiap dokumen agar urutan tidak berantakan saat diambil dari database.

---

## 3. Sistem Keamanan & Admin (Auth)

### 3.1. Security Rules Firestore
Salin aturan ini ke tab **Rules** di Firestore Console Anda untuk mencegah orang asing mengedit data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Siapa saja bisa melihat data (About, Projects, dll)
    match /{document=**} {
      allow read: if true;
    }
    
    // HANYA Admin yang login yang bisa menulis/mengedit data
    match /{document=**} {
      allow write: if request.auth != null;
    }
    
    // Khusus koleksi 'config' untuk sistem kunci register
    match /config/admin {
      allow read: if true; // Diperlukan untuk cek apakah register sudah dikunci
    }
  }
}
```

### 3.2. Logika "Single Admin Lock"
Sistem CMS Anda memiliki fitur keamanan unik:
1. Saat pertama kali dijalankan, sistem mengecek dokumen `config/admin` di Firestore.
2. Jika dokumen tersebut belum ada, halaman `/admin/register` akan terbuka.
3. Begitu Anda mendaftarkan akun pertama, sistem secara otomatis membuat dokumen `config/admin` dengan field `{ registered: true }`.
4. Setelah itu, halaman pendaftaran akan **terkunci selamanya** dan hanya menampilkan pesan "Admin sudah terdaftar".

---

## 4. Cara Penggunaan Dashboard

1. **Login:** Akses `/admin/login`.
2. **Edit Konten:** Saat ini, fitur edit teks "Tentang Saya" sudah aktif di Dashboard.
3. **Data Lainnya:** Untuk Experience, Education, dan Projects, Anda bisa menambahkannya secara manual lewat Firestore Console terlebih dahulu dengan struktur field yang benar. Antarmuka form untuk bagian ini sedang dalam tahap pengembangan.

---

## 5. Troubleshooting (ERR_BLOCKED_BY_CLIENT)
Jika Anda melihat error ini di konsol browser:
- Itu artinya **AdBlocker** Anda memblokir script Firebase.
- **Solusi:** Matikan AdBlocker (uBlock, AdBlock, dll) untuk `localhost:3000`.
