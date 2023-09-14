FROM node:14-alpine

ARG PKG_AUTH_TOKEN
WORKDIR /src
ENV NODE_ENV=production
RUN apk add --update --no-cache openssl1.1-compat
COPY . .
EXPOSE 8080
RUN npm ci && \
    npm run db:generate && \
    npm run build:prod

CMD [ "node", "dist/src/index.js" ]
