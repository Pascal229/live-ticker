# Use an official Node.js runtime as a parent image
FROM node:16.13.1-alpine AS build

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and yarn.lock files for both client and server
COPY client/package.json client/yarn.lock ./client/
COPY server/package.json server/yarn.lock ./server/

# Install app dependencies for both client and server
RUN cd client && yarn
RUN cd server && yarn

# Copy the client and server code to the container
COPY client ./client
COPY server ./server

# Build the client for production
RUN cd client && yarn build

# Use a smaller base image for the server
FROM node:16.13.1-alpine

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and yarn.lock files for the server
COPY server/package.json server/yarn.lock ./

# Install app dependencies for the server
RUN yarn

# Copy the built client code from the previous stage to the container
COPY --from=build /app/client/dist ./client/dist

# Copy the server code to the container
COPY server ./server

# Start the server
CMD cd ./server && yarn build && yarn prisma && yarn start