# Contracts/dev image for arena-sc
FROM node:20-alpine
WORKDIR /workspace
COPY package*.json ./
RUN npm ci || npm install
COPY . .
# Ensure hardhat is available
RUN npx hardhat --version || (echo "Hardhat not found" && exit 1)
