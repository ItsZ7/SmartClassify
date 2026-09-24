# SmartClassify dengan FastAPI

Pakej ini menggunakan eksport Keras Teachable Machine: `keras_model.h5` dan `labels.txt`. Website dan backend berjalan pada port yang sama. Endpoint utama ialah `POST /predict` dan menerima medan fail bernama `file`.

## Keperluan

Python 3.12 diperlukan untuk requirements ini kerana TensorFlow 2.16.1 mempunyai wheel Windows untuk Python 3.9 hingga 3.12. Python 3.14.6 awak boleh kekal terpasang, tetapi jangan gunakan Python 3.14 untuk persekitaran TensorFlow ini.

1. Pasang Python 3.12 daripada https://www.python.org/downloads/. Semasa pemasangan, tandakan **Add python.exe to PATH**.
2. Buka folder ini dalam VS Code.
3. Pastikan `keras_model.h5` dan `labels.txt` berada searas dengan `main.py`.
4. Klik Terminal > New Terminal.
5. Jalankan:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Jika PowerShell menyekat activation, jangan aktifkan persekitaran; gunakan terus:

```powershell
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Alternatif paling mudah ialah klik dua kali `run.bat`. Fail itu membuat `.venv`, memasang keperluan dan menjalankan API.

6. Buka http://127.0.0.1:8000/ untuk website.
7. Buka http://127.0.0.1:8000/docs untuk Swagger UI.
8. Buka http://127.0.0.1:8000/health untuk status model.

## Aliran data

```text
Webcam atau gambar -> index.html/script.js -> POST /predict -> FastAPI -> keras_model.h5 -> JSON prediction/confidence -> paparan website
```

Backend memeriksa jenis fail dan had 10 MB, memotong imej kepada 224 x 224 di bahagian tengah, menormalisasi piksel kepada julat -1 hingga 1, menjalankan model dan mengembalikan kelas serta confidence. `labels.txt` menentukan urutan label: Jam, Tetikus, Buku. Confidence kurang daripada 70% menerima status `uncertain`.

Contoh respons:

```json
{
  "prediction": "Buku",
  "confidence": 0.94,
  "status": "recognized",
  "scores": [
    {"label": "Jam", "confidence": 0.02},
    {"label": "Tetikus", "confidence": 0.04},
    {"label": "Buku", "confidence": 0.94}
  ]
}
```

Untuk menguji endpoint dalam Swagger, klik `POST /predict`, klik **Try it out**, pilih fail gambar pada medan `file`, kemudian klik **Execute**.

## Nota untuk laporan

Website lama menjalankan inferens TensorFlow.js dalam browser. Versi ini menunjukkan deployment FastAPI dengan Pydantic melalui `PredictionResponse` dan `HealthResponse`. `http://127.0.0.1` hanya boleh dicapai pada laptop sendiri sehingga backend dihoskan pada pelayan.

Jangan masukkan kata laluan, token atau data sulit ke repository. Simpan bukti `health`, Swagger `/predict`, gambar input, JSON output dan tangkap layar website selepas menerima hasil API.
