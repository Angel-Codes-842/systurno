# Construcción de React + Vite
FROM node:20-alpine as build
WORKDIR /app

# Instalar dependencias puras (sin dev si no quieres, pero a veces vite lo necesita)
COPY package.json package-lock.json* ./
RUN npm install

# Copiar el código y empaquetar
COPY . .
RUN npm run build

# Levantar con Nginx en producción
FROM nginx:alpine

# Copiar la configuración específica nuestra para proxy y SPA
COPY nginx-docker.conf /etc/nginx/conf.d/default.conf

# Copiar el compilado de dist (React) a la carpeta que Nginx escanea
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer puerto HTTP estándar
EXPOSE 80

# Run nginx forever
CMD ["nginx", "-g", "daemon off;"]
