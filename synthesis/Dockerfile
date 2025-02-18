FROM node:18-slim

WORKDIR /app

# Copy everything at once
COPY . .

# Install and build
RUN npm install
RUN npm run build

# Cloud Run will use PORT environment variable
EXPOSE 8080

CMD [ "npm", "start" ] 