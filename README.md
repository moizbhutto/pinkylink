# 🌸 PinkyLink — Instagram-like Social Media App

A full-stack Instagram-style social media app built with the MERN stack.
Mobile-first, pink-themed UI. Built for your portfolio!

---

## 🗂️ Project Structure

```
pinkylink/
├── client/                  ← React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/      ← Sidebar, BottomNav, AppLayout
│   │   │   ├── post/        ← PostCard, CreatePostModal, CommentModal
│   │   │   └── ui/          ← Avatar, StoriesBar
│   │   ├── context/         ← AuthContext (global user state)
│   │   ├── pages/           ← HomePage, ProfilePage, ExplorePage, etc.
│   │   ├── styles/          ← global.css
│   │   └── utils/           ← api.js (axios instance)
│   └── vercel.json
│
└── server/                  ← Node/Express backend
    ├── config/              ← db.js, cloudinary.js
    ├── controllers/         ← authController, userController, postController, etc.
    ├── middleware/           ← auth.js (JWT protection)
    ├── models/              ← User, Post, Comment, Notification
    ├── routes/              ← auth, users, posts, comments, notifications
    └── index.js
```

---

## ⚙️ Step-by-Step Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/pinkylink.git
cd pinkylink

# Install root dependencies
npm install

# Install all (server + client)
npm run install:all
```

### 2. Set Up MongoDB Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a **free cluster**
3. Click **Connect** → **Drivers** → Copy the connection string
4. Replace `<username>` and `<password>` with your credentials

### 3. Set Up Cloudinary

1. Sign up at [https://cloudinary.com](https://cloudinary.com)
2. Go to your **Dashboard**
3. Copy: `Cloud Name`, `API Key`, `API Secret`

### 4. Configure Environment Variables

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI, JWT secret, Cloudinary credentials

# Client
cp client/.env.example client/.env
# The default VITE_API_URL=http://localhost:5000/api works for local dev
```

**server/.env:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/pinkylink
JWT_SECRET=super_secret_key_change_this_in_production_32chars
JWT_EXPIRE=30d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

### 5. Run Development Server

```bash
# From the root directory — runs BOTH server + client
npm run dev

# Or separately:
npm run dev:server   # runs on http://localhost:5000
npm run dev:client   # runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

---

## 🚀 Deployment

### Frontend → Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Set **Root Directory** to `client`
5. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
6. Click **Deploy** ✅

### Backend → Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
4. Add all environment variables from `server/.env`
5. Deploy! ✅

### Update CORS

After deploying, update `server/index.js` CORS origin to include your Vercel URL:
```js
origin: ['http://localhost:5173', 'https://pinkylink.vercel.app']
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/users/:username` | Get profile + posts |
| PUT  | `/api/users/edit` | Edit profile |
| POST | `/api/users/:id/follow` | Follow/unfollow |
| GET  | `/api/users/search?q=` | Search users |
| GET  | `/api/users/suggestions` | Suggested users |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create post (multipart) |
| GET  | `/api/posts/feed` | Home feed |
| GET  | `/api/posts/explore` | Explore feed |
| GET  | `/api/posts/:id` | Single post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/:id/like` | Like/unlike |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/comments/:postId` | Get comments |
| POST | `/api/comments/:postId` | Add comment |
| DELETE | `/api/comments/:commentId` | Delete comment |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get all + mark read |
| GET | `/api/notifications/unread-count` | Unread count |

---

## ✨ Features

- 🔐 JWT Authentication (register, login, protected routes)
- 👤 User profiles with avatar upload
- 📸 Image posts with captions & location
- ❤️ Like / unlike with double-tap animation
- 💬 Comment system with real-time UI updates
- 👥 Follow / unfollow system
- 🔍 User search
- 🏠 Personalized feed (posts from followed users)
- 🔔 Notifications (likes, comments, follows)
- 📱 Mobile-first responsive design
- ∞ Infinite scroll pagination

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, React Router v6, Axios, react-hot-toast  
**Backend:** Node.js, Express, JWT, bcrypt, Multer  
**Database:** MongoDB Atlas + Mongoose  
**Media:** Cloudinary  
**Deploy:** Vercel (frontend), Render (backend)
