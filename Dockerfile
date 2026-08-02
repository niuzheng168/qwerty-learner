FROM node:20 AS build

# 设置工作目录
WORKDIR /app

COPY . .
RUN npm config set registry  https://registry.npmmirror.com  
RUN npm install
RUN npm run build

# 将构建好的 React 应用复制到 Nginx 容器的默认站点目录
FROM nginx:alpine
# nginx:alpine runs envsubst on /etc/nginx/templates/*.template at container start,
# producing the matching files in /etc/nginx/conf.d/. This lets us inject the
# Azure SPEECH_REGION/SPEECH_KEY env vars into the proxy config at runtime.
ENV NGINX_ENVSUBST_TEMPLATE_SUFFIX=.template
COPY ./public/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/build /app
