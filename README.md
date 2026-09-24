# SmartClassify

Projek PB DKA3223: aplikasi pengelasan imej menggunakan Google Teachable Machine dan FastAPI.

## Pengenalan

SmartClassify mengenal pasti tiga kategori objek:
- Buku
- Jam tangan (label model: Jam)
- Tetikus komputer

Pengguna boleh memuat naik gambar atau menggunakan webcam untuk mendapatkan ramalan kelas dan skor keyakinan model.

## Objektif

1. Membangunkan model pengelasan imej untuk tiga kategori objek.
2. Mengintegrasikan model dengan aplikasi web melalui FastAPI.
3. Menilai keputusan ramalan dan menguji fungsi aplikasi.

## Teknologi

- Google Teachable Machine
- HTML, CSS dan JavaScript
- Python 3.12
- FastAPI dan Uvicorn
- TensorFlow 2.16.1
- tf-keras 2.16.0

## Fungsi Utama

- Muat naik gambar.
- Pengelasan melalui webcam.
- Paparan ramalan dan skor keyakinan.
- Status tidak yakin apabila skor kurang daripada 70%.
- Butang reset.

## Fail Utama

| Fail / folder | Kegunaan |
|---|---|
| main.py | Backend FastAPI dan pemuatan model |
| index.html | Antaramuka aplikasi |
| script.js | Logik antaramuka, webcam dan panggilan API |
| style.css | Reka bentuk aplikasi |
| keras_model.h5 | Model yang digunakan oleh backend |
| labels.txt | Susunan label model |
| requirements.txt | Kebergantungan Python |
| run.bat | Skrip menjalankan aplikasi pada Windows |
| model/ | Model TensorFlow.js untuk mod pelayar alternatif |
| vendor/ | Pustaka JavaScript tempatan |

## Cara Menjalankan Sistem pada Windows

1. Pasang Python 3.12.
2. Muat turun repository melalui Code → Download ZIP.
3. Ekstrak ZIP dan buka terminal dalam folder yang mengandungi main.py.
4. Jalankan arahan berikut:

```bat
py -3.12 -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

5. Buka alamat berikut:

- Aplikasi: http://127.0.0.1:8000/
- Dokumentasi API: http://127.0.0.1:8000/docs
- Status model: http://127.0.0.1:8000/health

Biarkan terminal berjalan semasa menggunakan aplikasi.
Tekan Ctrl+C untuk menghentikan pelayan.

Aplikasi ini dijalankan secara tempatan pada komputer pengguna.

## Pengujian API

1. Buka halaman /docs.
2. Pilih POST /predict.
3. Klik Try it out.
4. Pilih gambar JPG, PNG atau WebP pada medan file.
5. Klik Execute.

Respons yang berjaya menggunakan kod HTTP 200 dan mengandungi:
- prediction: kelas ramalan.
- confidence: skor keyakinan antara 0 hingga 1.
- status: recognized atau uncertain.
- scores: skor bagi setiap kelas.

## Keputusan Eksperimen

| Eksperimen | Jumlah gambar ujian | Ramalan betul | Ketepatan |
|---|---:|---:|---:|
| Eksperimen 1 | 60 | 60 | 100% |
| Eksperimen 2 | 60 | 60 | 100% |

Setiap eksperimen menggunakan 20 gambar bagi setiap kelas.
Set gambar ujian berbeza antara kedua-dua eksperimen.
Keputusan ini terhad kepada gambar yang diuji.

## Pengujian Fungsi

Berdasarkan pengujian kumpulan:
- Muat naik gambar: berfungsi.
- Webcam: berfungsi.
- Reset: berfungsi.
- API: berjaya mengembalikan ramalan bagi ketiga-tiga kelas.

## Ahli Kumpulan dan Sumbangan

| Nama | Sumbangan |
|---|---|
| Muhammad Farizd Miqkhail bin Mohd Fazli |
| Faiz Hakimi bin Mohamad Kamar Sharil |
| Ajmal Hifzi bin Ahmad Suhaili |

## Penggunaan AI Code Assistant

AI digunakan untuk membantu menyelesaikan masalah persekitaran Python dan keserasian pemuatan model Keras. Cadangan disemak melalui arahan diagnostik, pemuatan model dan ujian API. Bukti perbualan serta hasil semakan disertakan dalam dokumentasi projek.
