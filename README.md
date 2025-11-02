# 🎯 Mautic Centralized Dashboard

A modern, full-stack web application to manage and monitor multiple Mautic instances from a single, centralized dashboard. Built with React, Node.js, Express, Prisma, and MySQL.

## ✨ Features

- **Multi-Client Management**: Add and manage unlimited Mautic instances
- **OAuth2 Authentication**: Secure API authentication with automatic token refresh
- **Real-time Data Sync**: Manual and scheduled automatic synchronization
- **Comprehensive Analytics**:
  - Contact statistics and growth trends
  - Campaign performance metrics
  - Email analytics (open rates, click rates)
  - Visual charts and graphs
- **Responsive UI**: Modern, mobile-friendly interface with Tailwind CSS
- **Encrypted Storage**: Secure credential storage with AES-256 encryption

## 🏗️ Tech Stack

### Backend

- **Node.js** + **Express** (ES6 modules)
- **Prisma ORM** with **MySQL**
- **Axios** for Mautic API calls
- **node-cron** for scheduled tasks
- **Crypto** for encryption

### Frontend

- **React 18** with **Vite**
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **date-fns** for date formatting

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **MySQL** 8.x or higher
- **npm** or **yarn**
- One or more **Mautic v6** instances with API access

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
cd /Users/mahesh/DigitalBevy/mautic
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="mysql://username:password@localhost:3306/mautic_dashboard"
PORT=5000
NODE_ENV=development
ENCRYPTION_KEY="your-32-character-random-string-here"
FRONTEND_URL=http://localhost:5173
```

**Generate a secure encryption key:**

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 5. Start Development Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Access the application at: **http://localhost:5173**

## 🔧 Mautic Configuration

### 1. Create OAuth2 Credentials in Mautic

1. Log in to your Mautic instance
2. Go to **Settings** (gear icon) → **API Credentials**
3. Click **New**
4. Fill in the form:
   - **Name**: "Dashboard App"
   - **Redirect URI**: `http://localhost:5173` (or your frontend URL)
   - **Authorization Protocol**: OAuth 2
5. Save and note down:
   - **Client ID**
   - **Client Secret**

### 2. Enable API in Mautic

1. Go to **Settings** → **Configuration** → **API Settings**
2. Enable **API**
3. Set **API enabled?** to **Yes**
4. Choose **OAuth 2** authentication
5. Save configuration

## 📖 Usage Guide

### Adding a Mautic Client

1. Click **"Add Client"** button on the Clients page
2. Fill in the form:
   - **Client Name**: A friendly name for your Mautic instance
   - **Mautic Base URL**: Full URL (e.g., `https://mautic.example.com`)
   - **OAuth2 Client ID**: From Mautic API Credentials
   - **OAuth2 Client Secret**: From Mautic API Credentials
   - **Username** (optional): Mautic admin username for automatic token fetch
   - **Password** (optional): Mautic admin password
3. Click **"Add Client"**

### Syncing Data

**Manual Sync:**

- Click the **refresh icon** on any client card
- Or click **"Sync Now"** on the dashboard

**Automatic Sync:**

- Runs daily at 2:00 AM automatically
- Configure in `backend/src/utils/scheduler.js`

### Viewing Analytics

1. Click **"View Dashboard"** on any client
2. Navigate through tabs:
   - **Overview**: Summary stats, charts, top campaigns/emails
   - **Contacts**: Full contact list with search and pagination
   - **Campaigns**: All campaigns with performance metrics
   - **Emails**: Email statistics with open/click rates

## 📁 Project Structure

```
mautic/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── routes/
│   │   │   ├── client.js          # Client management endpoints
│   │   │   └── dashboard.js       # Dashboard data endpoints
│   │   ├── services/
│   │   │   ├── mauticAPI.js       # Mautic API client
│   │   │   └── dataSync.js        # Data synchronization service
│   │   ├── utils/
│   │   │   ├── encryption.js      # Encryption utilities
│   │   │   └── scheduler.js       # Cron job scheduler
│   │   └── server.js              # Express server
│   ├── .env                       # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── api.js             # API client & endpoints
    │   ├── components/
    │   │   ├── AddClientModal.jsx # Add client form
    │   │   ├── Layout.jsx         # Main layout wrapper
    │   │   └── LoadingSpinner.jsx # Loading component
    │   ├── pages/
    │   │   ├── ClientsPage.jsx    # Client management page
    │   │   └── DashboardPage.jsx  # Analytics dashboard
    │   ├── App.jsx                # Main app component
    │   ├── main.jsx               # React entry point
    │   └── index.css              # Global styles
    ├── .env                       # Environment variables
    └── package.json
```

## 🔌 API Endpoints

### Client Management

| Method | Endpoint                | Description         |
| ------ | ----------------------- | ------------------- |
| GET    | `/api/client/list`      | Get all clients     |
| GET    | `/api/client/:id`       | Get single client   |
| POST   | `/api/client/add`       | Add new client      |
| PUT    | `/api/client/:id`       | Update client       |
| DELETE | `/api/client/:id`       | Delete client       |
| POST   | `/api/client/:id/test`  | Test connection     |
| POST   | `/api/client/:id/sync`  | Sync client data    |
| POST   | `/api/client/:id/token` | Update OAuth tokens |

### Dashboard

| Method | Endpoint                             | Description            |
| ------ | ------------------------------------ | ---------------------- |
| GET    | `/api/dashboard/:clientId`           | Get dashboard overview |
| GET    | `/api/dashboard/:clientId/contacts`  | Get contacts list      |
| GET    | `/api/dashboard/:clientId/campaigns` | Get campaigns list     |
| GET    | `/api/dashboard/:clientId/emails`    | Get email statistics   |

## 🔒 Security Features

1. **Encrypted Credentials**: All OAuth credentials encrypted at rest using AES-256
2. **Token Refresh**: Automatic OAuth token refresh before expiration
3. **CORS Protection**: Configured CORS for frontend access only
4. **Environment Variables**: Sensitive data stored in .env files
5. **SQL Injection Protection**: Prisma ORM with parameterized queries

## 🎨 Customization

### Change Sync Schedule

Edit `backend/src/utils/scheduler.js`:

```javascript
// Run every 6 hours
startHourlySync() {
  const job = cron.schedule('0 */6 * * *', async () => {
    // sync logic
  });
}
```

### Modify Theme Colors

Edit `frontend/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      },
    },
  },
}
```

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check MySQL is running
mysql -u root -p

# Verify DATABASE_URL in backend/.env
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Mautic API Authentication Failed

1. Verify OAuth credentials in Mautic
2. Check redirect URI matches
3. Ensure API is enabled in Mautic settings
4. Try updating tokens manually via `/api/client/:id/token`

### Port Already in Use

```bash
# Backend (port 5000)
lsof -ti:5000 | xargs kill -9

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

## 📦 Production Deployment

### Backend

```bash
cd backend

# Build for production
npm install --production

# Set environment
export NODE_ENV=production

# Run with PM2
npm install -g pm2
pm2 start src/server.js --name mautic-api
pm2 save
pm2 startup
```

### Frontend

```bash
cd frontend

# Build for production
npm run build

# Serve with nginx or deploy to Vercel/Netlify
```

### Environment Variables (Production)

**Backend:**

- Use strong, unique `ENCRYPTION_KEY`
- Set `NODE_ENV=production`
- Use production database credentials
- Configure proper `FRONTEND_URL`

**Frontend:**

- Set `VITE_API_URL` to production backend URL

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- [Mautic](https://www.mautic.org/) - Open source marketing automation
- [React](https://react.dev/) - UI library
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Mautic API documentation: https://developer.mautic.org/
3. Open an issue in the repository

---

**Built with ❤️ for the Mautic community**
# MauticDashboard
