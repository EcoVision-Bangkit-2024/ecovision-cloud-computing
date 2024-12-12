import pandas as pd
import tensorflow as tf
import numpy as np
from tensorflow import keras
from keras import layers, models, optimizers
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller
from fastapi import FastAPI, HTTPException
import base64
import io
import json
import datetime


#membuka file data
dataframe = pd.read_csv(f"waste_data.csv")
dataframe.head(10)

# Pilih kolom data yang akan digunakan
dataframe = dataframe[['date', 'type','amount']]

# Menampilkan data yang telah dipilih
print(dataframe.head(50))

#melihat dimensi data
dataframe.shape

# melihat informasi data, berupa tipe data dan apakah ada missing values
dataframe.info()

#Menetapkan kolom 'date' sebagai indeks
dataframe['date'] = pd.to_datetime(dataframe['date'], errors='coerce')
dataframe.set_index('date', inplace=False)



# Tambahkan kolom 'day_of_week' untuk hari dalam minggu (0 = Senin, 6 = Minggu)
dataframe['day_of_week'] = dataframe['date'].dt.dayofweek

# Agregasi data per hari, jenis sampah, dan hari dalam minggu
daily_data = (
    dataframe.groupby([pd.Grouper(key='date', freq='D'), 'type'])['amount']
    .sum()
    .unstack(fill_value=0)  # Membuat kolom per jenis sampah
)

# Menampilkan data hasil agregasi
print(daily_data.head(50))
daily_data.shape
# melihat deskripsi keseluruhan data
daily_data.describe(include = "all")
# Plot data agregasi
daily_data.plot(kind='line', figsize=(10, 5))

# Inisialisasi aplikasi FastAPI
app = FastAPI()

# Fungsi untuk menyimpan grafik ke base64
def save_plot_to_base64(fig):
    buffer = io.BytesIO()
    fig.savefig(buffer, format='png')  # Simpan grafik ke buffer
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    buffer.close()
    return image_base64

# Fungsi untuk dekomposisi musiman
def seasonal_decomposition_plot(data, column_name, period=30, model='additive'):
    decomposition = seasonal_decompose(data[column_name], model=model, period=period)
    fig = decomposition.plot()
    fig.suptitle(f"Seasonal Decomposition of {column_name}", fontsize=12, y=1.05)
    plt.tight_layout()
    return fig

# Fungsi untuk normalisasi data
def normalize_all_columns(dataframe, exclude_columns=None):
    if exclude_columns is None:
        exclude_columns = []

    scaler = MinMaxScaler()
    numeric_columns = dataframe.select_dtypes(include=['float64', 'int64']).columns
    columns_to_normalize = [col for col in numeric_columns if col not in exclude_columns]

    dataframe[columns_to_normalize] = scaler.fit_transform(dataframe[columns_to_normalize])
    return dataframe, scaler

# Fungsi untuk membuat semua grafik
def generate_all_plots(data):
    plots = []

    # Grafik 1: Jumlah Sampah per Jenis per Hari
    fig1, ax1 = plt.subplots(figsize=(10, 5))
    data.plot(kind='line', ax=ax1)
    ax1.set_title('Jumlah Sampah per Jenis per Hari', fontsize=16)
    ax1.set_xlabel('Hari', fontsize=14)
    ax1.set_ylabel('Jumlah Sampah', fontsize=14)
    ax1.legend(title='Jenis Sampah', fontsize=12)
    ax1.grid(True, linestyle='--', alpha=0.6)
    plots.append(save_plot_to_base64(fig1))

    # Grafik 2-5: Seasonal Decomposition untuk setiap jenis sampah
    for col in ['Organic', 'Non Organic', 'Residue', 'Other']:
        fig2 = seasonal_decomposition_plot(data, col, period=30)
        plots.append(save_plot_to_base64(fig2))

    # Grafik 6: Data yang Dinormalisasi
    fig6, ax6 = plt.subplots(figsize=(10, 5))
    normalized_data.plot(kind='line', ax=ax6)
    ax6.set_title('Data yang Dinormalisasi', fontsize=16)
    ax6.set_xlabel('Hari', fontsize=14)
    ax6.set_ylabel('Jumlah Sampah', fontsize=14)
    ax6.grid(True, linestyle='--', alpha=0.6)
    plots.append(save_plot_to_base64(fig6))

    # Grafik 7: Training Loss vs Validation Loss
    fig7, ax7 = plt.subplots(figsize=(10, 5))
    ax7.plot(history.history['loss'], label='Training Loss')
    ax7.plot(history.history['val_loss'], label='Validation Loss')
    ax7.set_title('Training vs Validation Loss', fontsize=16)
    ax7.set_xlabel('Epochs', fontsize=14)
    ax7.set_ylabel('Loss', fontsize=14)
    ax7.legend()
    ax7.grid(True)
    plots.append(save_plot_to_base64(fig7))

    # Grafik 8: Prediksi vs Aktual
    fig8, axes = plt.subplots(nrows=2, ncols=2, figsize=(12, 8), constrained_layout=True)
    axes = axes.flatten()
    for i, col in enumerate(['Organic', 'Non Organic', 'Residue', 'Other']):
        ax = axes[i]
        ax.plot(y_test_df[col], label=f"Actual {col}", color="blue")
        ax.plot(predictions[:, i], label=f"Predicted {col}", color="red")
        ax.set_title(f"Actual vs Predicted for {col}")
        ax.legend()
    plots.append(save_plot_to_base64(fig8))

    return plots

# Membaca dan memproses data
dataframe = pd.read_csv("waste_data.csv")
dataframe['date'] = pd.to_datetime(dataframe['date'], errors='coerce')
dataframe.set_index('date', inplace=True)
daily_data = dataframe.groupby([pd.Grouper(freq='D'), 'type'])['amount'].sum().unstack(fill_value=0)
normalized_data, scaler = normalize_all_columns(daily_data)

# Membuat sequence untuk model ML
SEQ_LENGTH = 3

def create_sequences(data, seq_length):
    sequences = []
    labels = []
    for i in range(len(data) - seq_length):
        sequences.append(data[i:i + seq_length])
        labels.append(data[i + seq_length])
    return np.array(sequences), np.array(labels)

X, y = create_sequences(normalized_data.values, SEQ_LENGTH)
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.2, random_state=42)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)

# Membuat model default
def build_default_model():
    model = models.Sequential()
    model.add(layers.Bidirectional(layers.LSTM(128, return_sequences=True),
                                    input_shape=(SEQ_LENGTH, X_train.shape[-1])))
    model.add(layers.Bidirectional(layers.LSTM(64, return_sequences=False)))
    model.add(layers.Dense(4))
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

# Buat model langsung
best_model = build_default_model()

# Latih model
history = best_model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=50, batch_size=32)

# Menyimpan model
best_model.save("waste-prediction.h5")

# Prediksi
y_test_df = pd.DataFrame(y_test, columns=['Organic', 'Non Organic', 'Residue', 'Other'])
predictions = best_model.predict(X_test)

# Endpoint API
@app.get("/plots")
def get_all_plots():
    try:
        plots_base64 = generate_all_plots(daily_data)
        return {"plots": plots_base64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions")
def get_predictions():
    try:
        predictions_list = predictions.tolist()
        output = {
            "date": str(datetime.date.today()),
            "predictions": [
                {cat: pred for cat, pred in zip(['Organic', 'Non Organic', 'Residue', 'Other'], row)}
                for row in predictions_list
            ]
        }
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
