FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Use dev mode for development (with hot reload via volumes)
# For production, uncomment the build step and use "npm start"
CMD ["npm", "run", "dev"]

