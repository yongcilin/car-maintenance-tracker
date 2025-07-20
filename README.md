# 🚗 Car Maintenance Tracker

A comprehensive vehicle maintenance management system built with modern web technologies. Track your vehicle's service history, manage multiple cars, and never miss important maintenance schedules.

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://app.netlify.com/sites/gas-car-only/deploys)

## ✨ Features

### 🔐 User Authentication
- Secure user registration and login
- Password reset functionality
- Personal data management
- Data isolation (users only see their own data)

### 🚙 Vehicle Management
- Add multiple vehicles with details (nickname, license plate, brand, model, year)
- Edit vehicle information
- Delete vehicles
- Multi-vehicle support

### 🔧 Comprehensive Maintenance System
**14 Categories with 108+ Maintenance Items:**
- 🔧 Engine System (13 items)
- 🌪️ Filter System (5 items)
- 🛢️ Fluid System (7 items)
- 🛞 Tire System (7 items)
- 🛑 Brake System (7 items)
- ⚡ Electrical System (8 items)
- 🏃 Suspension System (7 items)
- ❄️ Air Conditioning (9 items)
- 🧽 Cleaning & Care (12 items)
- ⚙️ Transmission System (9 items)
- 🔩 Drivetrain System (6 items)
- 🪟 Body & Exterior (7 items)
- 🛡️ Safety Inspection (6 items)
- 🔧 Other Items (6 items)

### 🏪 Service Shop Management
- Add and manage service shop information
- Link maintenance records to specific shops
- Track service history by shop

### 📊 Advanced Features
- **Maintenance Summary Table** - View all items with replacement cycles and status
- **Smart Status Indicators** - Normal/Due Soon/Overdue
- **Intelligent Sorting** - Latest records first
- **Data Export** - Export records to Excel/CSV
- **Statistical Reports** - Charts and analytics
- **Offline Support** - LocalStorage fallback

## 🛠️ Tech Stack

- **Frontend**: HTML5, Bootstrap 5, Vanilla JavaScript
- **Backend**: Firebase Firestore, Firebase Authentication
- **Deployment**: Netlify
- **Offline**: LocalStorage support

## 🚀 Quick Start

### Prerequisites
- Modern web browser
- Firebase account (for cloud features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/car-maintenance-tracker.git
   cd car-maintenance-tracker
   ```

2. **Set up Firebase (Optional)**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database and Authentication
   - Copy `.env.example` to `.env` and fill in your Firebase config

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase configuration
   ```

4. **Deploy locally**
   - Open `index.html` in a web browser, or
   - Use a local server: `python -m http.server 8000`

### Firebase Setup

1. **Firestore Database Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
       }
     }
   }
   ```

2. **Authentication**
   - Enable Email/Password authentication in Firebase Console

## 📱 Usage

1. **Register/Login** - Create an account or sign in
2. **Add Vehicle** - Register your car with basic information
3. **Add Service Shop** - Register your preferred service shops
4. **Record Maintenance** - Log maintenance activities with detailed information
5. **View History** - Check maintenance history and upcoming services
6. **Export Data** - Download your records for backup

## 🏗️ Project Structure

```
car-maintenance-tracker/
├── 📄 index.html              # Main application page
├── 🎨 css/
│   └── style.css             # Application styles
├── 🔧 js/
│   ├── app.js               # Main application logic
│   ├── auth.js              # Authentication handling
│   ├── database.js          # Database operations
│   └── firebase-config.js   # Firebase configuration
├── 📁 docs/                  # Documentation and development notes
├── 📄 .env.example          # Environment variables template
├── 📄 .gitignore            # Git ignore rules
└── 📄 README.md             # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bootstrap team for the excellent CSS framework
- Firebase team for the backend services
- All contributors who help improve this project

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation in the `docs/` folder

---

**Happy car maintenance tracking!** 🚗✨