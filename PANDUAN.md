# Panduan SmartClassifier pada laptop Windows

Pakej ini ialah bahan pembelajaran tempatan untuk membina dan memahami website pengelasan Buku, Jam tangan dan Tetikus. Fail model yang diberikan oleh pengguna sudah dimasukkan. Label asal ialah Jam, Tetikus, Buku. Versi eksperimen perlu disahkan oleh pemilik; nama ZIP asal tidak membuktikannya.

## 1 Sediakan folder

Ekstrak keseluruhan ZIP. Buka folder SmartClassifier yang terus mengandungi index.html melalui File > Open Folder dalam VS Code. Jangan jalankan fail dari dalam ZIP.

## 2 Fahami setiap fail

index.html: struktur halaman, butang, canvas dan ruangan keputusan.
style.css: warna, susun atur, saiz dan paparan telefon.
script.js: memuatkan model, membaca gambar atau kamera, membuat ramalan, threshold dan reset.
model/: model.json, metadata.json, weights.bin daripada eksport yang sama.
vendor/: salinan pustaka TensorFlow.js dan Teachable Machine Image serta lesen.

## 3 Pilih sumber model

Cara tempatan sudah disediakan. Dalam script.js, MODEL_BASE_URL = './model/' bermaksud model dimuatkan daripada folder model.

Untuk ikut kaedah URL dalam tutorial pensyarah: buka projek Teachable Machine yang telah dilatih, pilih Export Model > TensorFlow.js > Upload my model dan salin URL yang diterima. Tukar hanya nilai MODEL_BASE_URL kepada URL sebenar tersebut. Kekalkan tanda petik dan '/' di akhir URL. Muat naik model bermaksud menerbitkan fail model melalui pautan perkongsian. Cara ini memerlukan akses internet semasa model dimuatkan.

Jangan menambah model.json di akhir MODEL_BASE_URL kerana kod telah menambahkannya. Tidak perlu menggunakan URL dan fail tempatan serentak. Muat naik URL adalah pilihan; model tempatan sudah berfungsi.

## 4 Jalankan website

Buka Terminal > New Terminal dalam VS Code. Pastikan terminal berada dalam folder SmartClassifier yang mengandungi index.html.

Semak Python:

```sh
python --version
```

Jika Python belum dipasang, pasang Python 3 daripada https://www.python.org/downloads/ dan buka semula VS Code. Pada Windows, jika arahan python tidak tersedia tetapi py tersedia, gunakan py.

Jalankan pelayan tempatan:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Alternatif Windows:

```sh
py -m http.server 8000 --bind 127.0.0.1
```

Buka http://localhost:8000 dalam Chrome atau Edge. Biarkan terminal berjalan sepanjang penggunaan. Ctrl+C menghentikan pelayan. Jangan buka index.html melalui file://.

Ini pelayan fail untuk pembangunan tempatan, bukan backend inferens FastAPI. Ramalan sebenar dibuat dalam pelayar melalui TensorFlow.js.

## 5 Uji input gambar

Tunggu Model sedia digunakan. Klik Muat naik gambar, pilih JPG/PNG/WebP kurang daripada atau sama dengan 10 MB. Satu objek di tengah gambar memberikan input yang lebih jelas. Aplikasi memotong bahagian tengah gambar menjadi segi empat sama; kawasan itu dipaparkan kepada pengguna dan dihantar kepada model. Semak nama kelas tertinggi, confidence dan skor semua kelas.

## 6 Uji kamera

Klik Mulakan kamera dan benarkan kamera. Letakkan satu objek dalam bingkai. Ramalan dikemas kini semasa kamera aktif. Hentikan kamera atau Reset menutup aliran kamera. Jika kamera tidak dibenarkan atau tiada, aplikasi memaparkan ralat dan muat naik gambar masih tersedia. Jangan anggap fungsi kamera sudah diuji pada peranti anda sebelum mencubanya sendiri.

## 7 Fahami kod utama

loadModel(): memuatkan model.json dan metadata.json; weights.bin diambil melalui rujukan model.json.
camera(): meminta akses kamera dan mengulangi inferens.
upload(file): menyemak fail, membaca gambar dan membuat satu inferens.
display(predictions): memilih kelas tertinggi dan mengemas kini paparan.
reset(): menghentikan kamera dan mengosongkan input serta keputusan.

THRESHOLD = 0.7 bermaksud confidence sekurang-kurangnya 70% memaparkan kelas ramalan. Di bawahnya, status Tidak pasti dipaparkan. Objek luar daripada tiga kelas masih boleh menerima confidence tinggi; threshold bukan pengesahan bahawa objek itu diketahui. Confidence satu gambar bukan accuracy set ujian.

## 8 Bukti pengujian aplikasi

Ambil tangkap layar halaman awal, ramalan buku, ramalan jam, ramalan tetikus, kamera, dan reset. Catat hasil sebenar sahaja. Jika tiada keputusan confidence rendah ditemui, jangan mereka-reka gambar atau hasil. Uji juga fail tidak sesuai, kamera ditolak dan kegagalan model jika berkaitan; rekod masalah dan penyelesaian sebenar.

## 9 Pengurusan kerja kumpulan

Simpan kod dalam repository GitHub projek. Setiap ahli membuat commit berdasarkan sumbangan sebenar. Fail projek Teachable Machine untuk menyunting dataset perlu disimpan berasingan; ia berbeza daripada eksport model untuk aplikasi.

## 10 Fasa FastAPI

Tutorial bergerak daripada inferens browser kepada backend. Pakej ini melengkapkan website dengan inferens browser, belum menyediakan POST /predict. Jika pensyarah mewajibkan inferens Python, sediakan eksport model yang sesuai untuk runtime Python; backend FastAPI menerima imej, mengesahkan input, memproses imej, menjalankan model dan memulangkan JSON yang disahkan dengan Pydantic. Frontend kemudian perlu menghantar gambar ke endpoint itu. Menghoskan HTML melalui Python sahaja tidak menjadikannya endpoint inferens.

## Penyelesaian masalah

- Paparan senarai fail: terminal mungkin di folder induk. Hentikan pelayan, buka folder yang mengandungi index.html dan jalankan semula.
- Model gagal dimuatkan: semak folder model lengkap dan fail daripada eksport sama; untuk kaedah URL, semak URL, internet dan '/' terakhir.
- Port 8000 digunakan: gantikan 8000 dengan 8001 dalam arahan dan alamat browser.
- Kamera gagal: benarkan kamera, tutup aplikasi yang sedang menggunakannya atau gunakan input gambar.
- Perubahan kod tidak kelihatan: simpan dengan Ctrl+S, kemudian muat semula pelayar.

## Semakan pakej

Model sumber telah berjaya dimuatkan dan diuji dengan tensor sintetik untuk memeriksa struktur output, bukan untuk mengukur accuracy. Logik paparan, threshold, reset dan pengendalian ralat diuji menggunakan DOM simulasi. Kamera sebenar dan penampilan dalam browser perlu disemak pada peranti pengguna. API WebMCP pilihan hanya aktif jika pelayar menyokongnya; konteks WebMCP sebenar tidak tersedia semasa semakan.

## Rujukan

https://github.com/googlecreativelab/teachablemachine-community/blob/master/libraries/image/README.md
https://docs.python.org/3/library/http.server.html
https://code.visualstudio.com/docs/terminal/basics
