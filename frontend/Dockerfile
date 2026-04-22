FROM node:20

WORKDIR /app

COPY package.json package-lock.json* ./

CMD ["sh", "-c", "npm install && npm run dev -- --host"]