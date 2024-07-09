FROM node:18.20-alpine
WORKDIR /app
COPY /src .
COPY package.json package-lock.json tsconfig.json .
RUN npm i && npm run build
CMD ["node", "./build/index.js"]