# Use a smaller base image for the build stage
FROM node:18 AS build

# Set the working directory to /app
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn --production

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN yarn build

# Use a smaller base image for the final runtime stage
FROM node:18-alpine AS deploy

# Set the working directory to /app
WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=build /app .

# Expose the port the app runs on
EXPOSE 5002

# Set environment variables
ENV NODE_ENV=production
ENV ROOT_PATH=/app
# Add other environment variables as needed

# Run the application
CMD ["node", "index.js"]