import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from statsmodels.tsa.arima_model import ARIMA
from statsmodels.tsa.stattools import adfuller
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf

# Cargar datos desde un archivo CSV
data1 = pd.read_csv('monitoreo_red.infohosts2')
data = pd.read_csv('monitoreo_red.infoaps.csv')

def generar_predicciones(archivo,fecha_inicio,fecha_fin):
    pred = []
    data = pd.read.csv(archivo)
    data["date"] = pd.to_datetime(data["date"])
    return pred

# Convertir la columna de fechas en formato datetime
data1['Date'] = pd.to_datetime(data1['Elapsed days'])
#data["date"] = pd.to_datetime(data["date"]) no descomentar formato de fecha 

#crear lista de throughput
#txpks = data["txPkts"]
#value_txpks = txpks.split(" ")

#si_valor = lambda valor, lista: lista.append(0) if valor.startswith("Pkts") or lista == ' ' else lista.append(valor)
""" valuesPKTstr = []

for val in value_txpks:
    if ((val == '0' or val > '0') and not val.startswith('P')):
        valuesPKTstr.append(val) """

        #print(type(val))
        #valuesPKT.append(si_valor(val,value_txpks))
#print(valuesPKT)
# Crear una serie temporal de pandas
#throughput_series = pd.Series(data['Throughput'], index=data['Date'])

# Generar datos de ejemplo (puedes reemplazar esto con tus propios datos)
#valuesPKT = []
#valuesPKT=((int(value) for value in valuesPKTstr)) # retorna objeto ubicado en memoria iteracion externa
#print(valuesPKT)

""" for value in valuesPKTstr:
    valuesPKT.append(int(value))
print(valuesPKT) """

np.random.seed(42)
num_samples = 100
#num_samples = len(valuesPKT)
#mean = DataFrame
mean = 50
std_dev = 10
throughput_data = np.random.normal(mean, std_dev, num_samples)

# Convertir los datos en una serie temporal de pandas
date_range = pd.date_range(start='2023-01-01', periods=num_samples, freq='D')
throughput_series = pd.Series(throughput_data, index=date_range)

# Análisis exploratorio de datos
plt.figure(figsize=(10, 6))
plt.plot(throughput_series)
plt.title("Throughput en la Red")
plt.xlabel("Fecha")
plt.ylabel("Throughput")
plt.show()

# Prueba de estacionariedad (usando la Prueba Aumentada de Dickey-Fuller)
result = adfuller(throughput_series)
print("ADF Statistic:", result[0])
print("p-value:", result[1])

# Descomposición de la serie temporal
from statsmodels.tsa.seasonal import seasonal_decompose

decomposition = seasonal_decompose(throughput_series, model='additive')
trend = decomposition.trend
seasonal = decomposition.seasonal
residual = decomposition.resid

# Plot de los componentes descompuestos
plt.figure(figsize=(12, 8))
plt.subplot(411)
plt.plot(throughput_series, label='Original')
plt.legend(loc='upper left')
plt.subplot(412)
plt.plot(trend, label='Tendencia')
plt.legend(loc='upper left')
plt.subplot(413)
plt.plot(seasonal, label='Estacionalidad')
plt.legend(loc='upper left')
plt.subplot(414)
plt.plot(residual, label='Residual')
plt.legend(loc='upper left')
plt.tight_layout()
plt.show()

# Diferenciación para hacer la serie estacionaria
differenced_series = throughput_series.diff().dropna()

# Plot de la serie diferenciada
plt.figure(figsize=(10, 6))
plt.plot(differenced_series)
plt.title("Diferenciación para hacer la serie estacionaria")
plt.xlabel("Fecha")
plt.ylabel("Diferencia de Throughput")
plt.show()

# Plots de ACF y PACF para identificar p y q
plot_acf(differenced_series, lags=20)
plot_pacf(differenced_series, lags=20)
plt.show()

# Entrenamiento del modelo ARIMA
p = 1  # Orden AR
d = 1  # Diferenciación
q = 1  # Orden MA

model = ARIMA(throughput_series, order=(p, d, q))
model_fit = model.fit()

# Resumen del modelo
print(model_fit.summary())

# Predicciones
forecast_steps = 10
forecast, stderr, conf_int = model_fit.forecast(steps=forecast_steps)

# Plot de las predicciones
plt.figure(figsize=(10, 6))
plt.plot(throughput_series, label='Datos reales')
plt.plot(pd.date_range(start=date_range[-1], periods=forecast_steps+1, freq='D')[1:], forecast, label='Predicciones')
plt.fill_between(pd.date_range(start=date_range[-1], periods=forecast_steps+1, freq='D')[1:], forecast - 1.96 * stderr, forecast + 1.96 * stderr, color='gray', alpha=0.2, label='Intervalo de confianza')
plt.title("Predicciones de Throughput en la Red")
plt.xlabel("Fecha")
plt.ylabel("Throughput")
plt.legend()
plt.show()

""" if __name__ == "__main__":
    generar_imagenes()
    generar_predicciones() """