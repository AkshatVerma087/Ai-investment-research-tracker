# Quantix Frontend

The frontend of Quantix is a modern, highly responsive single-page application built with **Next.js 15 (App Router)** and **React**. It features a premium, glassmorphic design system heavily reliant on **Tailwind CSS** and **Framer Motion** for micro-animations.

## 🚀 Tech Stack
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Authentication**: Custom JWT (HttpOnly Cookies) + Google OAuth (`@react-oauth/google`)
- **Markdown Rendering**: `react-markdown` with `remark-gfm`

## ⚙️ Environment Variables

To run the frontend locally or in production, you need the following environment variables:

```env
# URL of the Quantix Backend API (e.g., http://localhost:5000)
NEXT_PUBLIC_API_URL=http://localhost:5000

# Your Google Cloud OAuth 2.0 Client ID for "Continue with Google"
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 🛠️ Development

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## 🐳 Docker

The frontend is containerized using a multi-stage Dockerfile that leverages Next.js `standalone` output for an incredibly lightweight production image. Render uses this Dockerfile for automated deployments.
