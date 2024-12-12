import base64
import json

# Membuka file base64
with open("image642.txt", "r") as file:
    data = json.load(file)

# Mengambil data base64 dari key "plots"
plots = data.get("plots", [])

# Iterasi dan konversi setiap base64 menjadi gambar
for idx, plot_base64 in enumerate(plots):
    # Konversi base64 menjadi gambar
    img_data = base64.b64decode(plot_base64)
    filename = f"plot_{idx + 1}.png"  # Nama file output
    with open(filename, "wb") as img_file:
        img_file.write(img_data)
    print(f"Gambar {idx + 1} berhasil disimpan sebagai {filename}")
