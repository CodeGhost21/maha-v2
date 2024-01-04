# build
FROM node:18 as build
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package.json ./
COPY yarn.lock ./
USER node
RUN yarn
COPY --chown=node:node . .
RUN yarn build

# run
FROM node:18 as deploy
EXPOSE 8080
COPY --from=build /home/node/app /home/node/app
CMD [ "node", "index.js" ]

# ---commands---
# docker build . -t api
# docker run api
