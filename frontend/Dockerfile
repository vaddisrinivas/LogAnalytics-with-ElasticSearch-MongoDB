# Use node:latest as the base image for the build stage
FROM node:latest AS build

# Set the working directory to /build
WORKDIR /build

# Copy the client folder to /build
COPY . .
RUN rm -rf /build/node_modules

# Install npm packages using npm ci
RUN cd /build && npm install -g --save
RUN cd /build && npm i vite --save
CMD [ "npm","run","start" ]