# Single stage — React is pre-built locally, just serve with Nginx
FROM nginx:alpine

# Copy pre-built static files from local dist/ folder
COPY dist/ /usr/share/nginx/html

# Copy React Router fallback config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
