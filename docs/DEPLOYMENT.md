# 🚀 Deployment Guide

## 📋 Overview
This guide covers deploying the Car Maintenance Tracker to various platforms.

## 🌐 Netlify Deployment (Recommended)

### Prerequisites
- GitHub repository
- Netlify account

### Steps
1. **Connect Repository**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings**
   - Build command: (leave empty for static site)
   - Publish directory: `/` (root directory)

3. **Environment Variables**
   - Go to Site Settings > Environment Variables
   - Add your Firebase configuration:
     ```
     VITE_FIREBASE_API_KEY=your-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
     VITE_FIREBASE_APP_ID=your-app-id
     ```

4. **Deploy**
   - Click "Deploy site"
   - Your site will be available at a generated URL

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name
4. Enable/disable Google Analytics as needed

### 2. Enable Services
1. **Authentication**
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"

2. **Firestore Database**
   - Go to Firestore Database
   - Create database in production mode
   - Choose location closest to your users

### 3. Security Rules
Add these rules to Firestore:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

### 4. Get Configuration
1. Go to Project Settings > General
2. Scroll to "Your apps"
3. Click "Web app" icon
4. Register app and copy configuration

## 🔧 Local Development

### Setup
1. Clone repository
2. Copy `.env.example` to `.env`
3. Fill in Firebase configuration
4. Open `index.html` in browser or use local server

### Local Server Options
```bash
# Python
python -m http.server 8000

# Node.js (if you have http-server installed)
npx http-server

# PHP
php -S localhost:8000
```

## 📱 Testing

### Functionality Checklist
- [ ] User registration/login
- [ ] Add/edit/delete vehicles
- [ ] Add/edit/delete service shops
- [ ] Add/edit/delete maintenance records
- [ ] View maintenance history
- [ ] Export data functionality
- [ ] Responsive design on mobile

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🐛 Troubleshooting

### Common Issues
1. **Firebase Connection Failed**
   - Check environment variables
   - Verify Firebase project settings
   - Check browser console for errors

2. **Authentication Issues**
   - Ensure Email/Password is enabled in Firebase
   - Check security rules

3. **Data Not Saving**
   - Verify Firestore rules
   - Check user authentication status
   - Review browser console errors

### Fallback Mode
If Firebase is not configured, the app automatically switches to LocalStorage mode for offline functionality.

## 🔄 Updates and Maintenance

### Updating the App
1. Make changes to code
2. Commit to GitHub
3. Netlify will automatically redeploy

### Monitoring
- Check Netlify deploy logs
- Monitor Firebase usage in console
- Review user feedback

## 📞 Support
For deployment issues, check:
- Netlify documentation
- Firebase documentation
- GitHub Issues in this repository