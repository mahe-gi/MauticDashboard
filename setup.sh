#!/bin/bash

# Mautic Dashboard - Setup Script
# This script helps you set up the Mautic Dashboard quickly

set -e

echo "🎯 Mautic Dashboard - Automated Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if MySQL is accessible
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL client not found in PATH${NC}"
    echo "Make sure MySQL is installed and running"
else
    echo -e "${GREEN}✅ MySQL detected${NC}"
fi

echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

echo ""
echo "🔐 Setting up backend environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Generate encryption key
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
    
    # Update .env with generated key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-32-character-encryption-key-here/$ENCRYPTION_KEY/" .env
    else
        # Linux
        sed -i "s/your-32-character-encryption-key-here/$ENCRYPTION_KEY/" .env
    fi
    
    echo -e "${GREEN}✅ Backend .env created with secure encryption key${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit backend/.env and update these values:${NC}"
    echo "   DATABASE_URL - Your MySQL connection string"
    echo ""
    read -p "Press Enter to continue after updating backend/.env..."
else
    echo -e "${BLUE}ℹ️  Backend .env already exists, skipping...${NC}"
fi

echo ""
echo "🗄️  Setting up database..."
npm run prisma:generate
echo ""
echo -e "${YELLOW}📝 Creating database migration...${NC}"
echo "When prompted for migration name, enter: init"
echo ""
npm run prisma:migrate

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "🔐 Setting up frontend environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Frontend .env created${NC}"
else
    echo -e "${BLUE}ℹ️  Frontend .env already exists, skipping...${NC}"
fi

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To start the application:"
echo ""
echo "1. Start the backend (in one terminal):"
echo -e "   ${BLUE}cd backend && npm run dev${NC}"
echo ""
echo "2. Start the frontend (in another terminal):"
echo -e "   ${BLUE}cd frontend && npm run dev${NC}"
echo ""
echo "3. Open your browser:"
echo -e "   ${BLUE}http://localhost:5173${NC}"
echo ""
echo "📚 Read QUICKSTART.md for next steps!"
echo ""
