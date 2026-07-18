# LLAC_App — React/Ionic/Vite (build → dist) servido por nginx
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# El front pega a /api (mismo origen, proxyado por nginx al backend)
ENV VITE_API_BASE=/api
RUN npm run build

FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
