import numpy as np
import pandas as pd
import os
import seaborn as sb

import matplotlib.pyplot as plt

from mpl_toolkits.mplot3d import Axes3D

from matplotlib import cm

plt.rcParams['figure.figsize'] = (16, 9)

plt.style.use('ggplot')

from sklearn import linear_model

from sklearn.metrics import mean_squared_error, r2_score

#cargamos los datos de entrada

data = pd.read_csv("./articulos_ml.csv")
data2 = pd.read_csv("./monitoreo_red.infoaps_test.csv")

#veamos cuantas dimensiones y registros contiene

#data.shape
data2.shape

# Ahora veamos algunas estadísticas de nuestros datos

#data.describe()

data2.describe()

# Visualizamos rápidamente las caraterísticas de entrada

#data.drop(['Title','url','Elapsed days'],1).hist()

#plt.show()

#data2.drop(['mac','interface','date'],1).hist()

#plt.show()

# Imprimir la matriz de covarianzas

matriz_covarianzas = data2.cov()

print(matriz_covarianzas)

#correlación entre las variables

matriz_correlacion = data2.corr()

# Imprimir la matriz de correlación

print(matriz_correlacion)

# Selección de características univariadas

""" X = data2.drop('variable_objetivo', axis=1)  # Features

y = data2['variable_objetivo']  # Target variable

# Seleccionar las K mejores características

k_best_features = SelectKBest(score_func=f_classif, k=5)  # Cambiar el valor de 'k' según tu preferencia

X_new = k_best_features.fit_transform(X, y)

# Obtener los índices de las características seleccionadas

feature_indices = k_best_features.get_support(indices=True)

# Imprimir las características seleccionadas

selected_features = X.columns[feature_indices]

print("Características seleccionadas:")

print(selected_features) """

#predict multivar
#throughput: # pkts / tiempo

# Vamos a RECORTAR los datos en la zona donde se concentran más los puntos
# esto es en el eje X: entre 0 y 3.500
# y en el eje Y: entre 0 y 80.000
filtered_data = data2[(data2['tx'] <= 10000000) & (data2['rx'] <= 10000000)]
 
colores=['orange','blue']
tamanios=[30,60]
 
f1 = filtered_data['tx'].values
f2 = filtered_data['rx'].values
 
# Vamos a pintar en colores los puntos por debajo y por encima de la media de Cantidad de Palabras
asignar=[]
for index, row in filtered_data.iterrows():
    if(row['tx']>1000000):
        asignar.append(colores[0])
    else:
        asignar.append(colores[1])
    
plt.scatter(f1, f2, c=asignar, s=tamanios[0])
plt.show()

# Asignamos nuestra variable de entrada X para entrenamiento y las etiquetas Y.
dataX =filtered_data[["tx"]]
X_train = np.array(dataX)
y_train = filtered_data['rx'].values
 
# Creamos el objeto de Regresión Linear
regr = linear_model.LinearRegression()
 
# Entrenamos nuestro modelo
regr.fit(X_train, y_train)
 
# Hacemos las predicciones que en definitiva una línea (en este caso, al ser 2D)
y_pred = regr.predict(X_train)
 
# Veamos los coeficienetes obtenidos, En nuestro caso, serán la Tangente
print('Coefficients: \n', regr.coef_)
# Este es el valor donde corta el eje Y (en X=0)
print('Independent term: \n', regr.intercept_)
# Error Cuadrado Medio
print("Mean squared error: %.2f" % mean_squared_error(y_train, y_pred))
# Puntaje de Varianza. El mejor puntaje es un 1.0
print('Variance score: %.2f' % r2_score(y_train, y_pred))

#De la ecuación de la recta y = mX + b nuestra pendiente “m” es el coeficiente 5,69 y el término independiente “b” es 11200. 
# Tenemos un Error Cuadrático medio enorme… por lo que en realidad este modelo no será muy bueno

#Vamos a comprobar:
# Quiero predecir cuántos "Shares" voy a obtener por un artículo con 2.000 palabras,
# según nuestro modelo, hacemos:
y_Dosmil = regr.predict([[2000]])
print(int(y_Dosmil))

#multivariable
#Y = b + m1 X1 + m2 X2 + … + m(n) X(n)

#Vamos a intentar mejorar el Modelo, con una dimensión más: 
# Para poder graficar en 3D, haremos una variable nueva que será la suma de los enlaces, comentarios e imágenes
suma = (filtered_data["transmitted"] + filtered_data['received'].fillna(0) + filtered_data['__v'])
 
dataX2 =  pd.DataFrame()
dataX2["tx"] = filtered_data["rx"]
dataX2["suma"] = suma
XY_train = np.array(dataX2)
z_train = filtered_data['# Shares'].values

# Creamos un nuevo objeto de Regresión Lineal
regr2 = linear_model.LinearRegression()
 
# Entrenamos el modelo, esta vez, con 2 dimensiones
# obtendremos 2 coeficientes, para graficar un plano
regr2.fit(XY_train, z_train)
 
# Hacemos la predicción con la que tendremos puntos sobre el plano hallado
z_pred = regr2.predict(XY_train)
 
# Los coeficientes
print('Coefficients: \n', regr2.coef_)
# Error cuadrático medio
print("Mean squared error: %.2f" % mean_squared_error(z_train, z_pred))
# Evaluamos el puntaje de varianza (siendo 1.0 el mejor posible)
print('Variance score: %.2f' % r2_score(z_train, z_pred))

fig = plt.figure()
ax = Axes3D(fig)
 
# Creamos una malla, sobre la cual graficaremos el plano
xx, yy = np.meshgrid(np.linspace(0, 3500, num=10), np.linspace(0, 60, num=10))
 
# calculamos los valores del plano para los puntos x e y
nuevoX = (regr2.coef_[0] * xx)
nuevoY = (regr2.coef_[1] * yy) 
 
# calculamos los correspondientes valores para z. Debemos sumar el punto de intercepción
z = (nuevoX + nuevoY + regr2.intercept_)
 
# Graficamos el plano
ax.plot_surface(xx, yy, z, alpha=0.2, cmap='hot')
 
# Graficamos en azul los puntos en 3D
ax.scatter(XY_train[:, 0], XY_train[:, 1], z_train, c='blue',s=30)
 
# Graficamos en rojo, los puntos que 
ax.scatter(XY_train[:, 0], XY_train[:, 1], z_pred, c='red',s=40)
 
# con esto situamos la "camara" con la que visualizamos
ax.view_init(elev=30., azim=65)
        
ax.set_xlabel('Tasa Tx')
ax.set_ylabel('Throughput')
ax.set_zlabel('Rx')
ax.set_title('Regresión Lineal con Múltiples Variables')

# Si quiero predecir cuántos "Shares" voy a obtener por un artículo con: 
# 2000 palabras y con enlaces: 10, comentarios: 4, imagenes: 6
# según nuestro modelo, hacemos:
 
z_Dosmil = regr2.predict([[2000, 10+4+6]])
print(int(z_Dosmil))
