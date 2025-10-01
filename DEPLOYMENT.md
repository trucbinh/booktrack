# Deployment Guide for Spark Applications

## Why GitHub Pages Won't Work

Your Spark application uses specialized runtime features that are not compatible with static hosting services like GitHub Pages:

### Spark-Specific Features
- **`useKV` hook**: Provides persistent key-value storage that requires a backend
- **`spark.llm()` API**: Enables AI functionality through server-side processing
- **`spark.user()` API**: Handles GitHub authentication and user management
- **Runtime environment**: Optimized Vite configuration and specialized build process

GitHub Pages only serves static HTML, CSS, and JavaScript files and cannot provide these backend services.

## Recommended Deployment Options

### 1. **Vercel** (Recommended)
- **Pros**: Excellent React support, automatic deployments, serverless functions
- **Setup**: Connect your GitHub repo to Vercel
- **Custom domains**: Free HTTPS with custom domains
- **Note**: You'd need to implement backend services for `useKV` functionality

### 2. **Netlify**
- **Pros**: Great for static sites with serverless functions
- **Setup**: Connect GitHub repo for automatic deploys
- **Custom domains**: Free HTTPS and custom domains

### 3. **Railway**
- **Pros**: Full-stack hosting with database support
- **Setup**: Deploy directly from GitHub
- **Custom domains**: Available on paid plans

### 4. **Render**
- **Pros**: Full-stack hosting with free tier
- **Setup**: Connect GitHub repo
- **Custom domains**: Free HTTPS

## Converting to Static Site (Advanced)

If you want to deploy to GitHub Pages, you'd need to:

1. **Remove Spark Dependencies**
   - Replace `useKV` with localStorage or external API
   - Remove `spark.llm()` and `spark.user()` calls
   - Implement custom authentication

2. **Update Build Configuration**
   - Modify `vite.config.ts` for static builds
   - Update imports and remove Spark-specific packages

3. **GitHub Pages Setup**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

## Current Application Features That Need Backend

Your BookVault application currently uses:

- **User Authentication**: `useAuth()` and GitHub user management
- **Persistent Storage**: `useKV` for books, reading sessions, and user preferences
- **User Isolation**: Data separation by user ID

These features require server-side functionality that GitHub Pages cannot provide.

## Quick Start with Vercel

1. **Push to GitHub**: Ensure your code is in a GitHub repository
2. **Connect Vercel**: Go to vercel.com and import your GitHub repo
3. **Configure Build**: Vercel auto-detects Vite projects
4. **Deploy**: Automatic deployment on every push to main branch

**Note**: You'll need to implement backend services to replace Spark's `useKV` functionality.

## Local Development

Continue developing locally with:
```bash
npm run dev
```

Your Spark application will continue to work perfectly in the local development environment with all Spark features intact.