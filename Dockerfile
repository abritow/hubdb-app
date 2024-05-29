# Stage 1: Build the application
FROM node:20.8.1-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --production

# Stage 2: Create the production image
FROM gcr.io/distroless/nodejs20-debian12

ENV ADDRESS=0.0.0.0 PORT=3010

COPY --from=builder /app /app

WORKDIR /app

COPY . .

EXPOSE 3010

CMD ["server.js"]