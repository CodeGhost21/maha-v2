# build
# FROM node:18 as build
# RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
# WORKDIR /home/node/app
# COPY package.json ./
# COPY yarn.lock ./
# USER node
# RUN yarn
# COPY --chown=node:node . .
# RUN yarn build

# # run
# FROM node:18 as deploy
# EXPOSE 8080
# COPY --from=build /home/node/app /home/node/app
# CMD [ "node", "index.js" ]

# ---commands---
# docker build . -t api
# docker run api


# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory to /app
WORKDIR /app

# Copy package.json, yarn.lock, and tsconfig.json to the working directory
COPY package.json yarn.lock tsconfig.json ./

# Install dependencies
RUN yarn

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN yarn build

# Expose the port the app runs on
EXPOSE 80

# Set environment variables
ENV NODE_ENV=production
ENV ROOT_PATH=/app
# Add other environment variables as needed

# Run the application
CMD ["node", "index.js"]