# PatroArcade WebServer

PatroArcade WebServer is the backend server for the PatroArcade project, a gaming platform where players can view their profiles and access various game-related information. This server is designed to deliver dynamic web pages and manage user interactions securely and efficiently.

## Features

- **User Authentication:** Secure login and registration system for players and administrators.
- **Profile Management:** Players can view and manage their profiles.
- **Game Information:** Access details about available games and player statistics.
- **Admin Panel:** Dedicated admin login and management interface.
- **RESTful API:** Organized controllers and routes for handling requests and responses.
- **Security:** Middleware for enhanced security headers.
- **Modern UI:** Pug templates for dynamic and responsive web pages.

## Project Structure

```
├── public/           # Static assets (JS, CSS, images, fonts)
├── src/              # Source code
│   ├── controllers/  # Business logic for routes
│   ├── middlewares/  # Security and other middleware
│   ├── routes/       # Route definitions
│   └── server.ts     # Main server entry point
├── views/            # Pug templates for web pages
├── package.json      # Project dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── vercel.json       # Vercel deployment configuration
```

## Getting Started

1. **Install dependencies:**
   ```powershell
   npm install
   ```
2. **Run the server:**
   ```powershell
   npm start
   ```
3. **Access the web application:**
   Open your browser and navigate to `http://localhost:3000` (default port).

## Main Endpoints

- `/login` - Player login page
- `/register` - Player registration page
- `/home` - Main dashboard
- `/games` - List of available games
- `/players` - List and details of players
- `/adminLogin` - Admin login page

## Technologies Used

- **Node.js** & **Express.js**
- **TypeScript**
- **Pug** (template engine)
- **CSS/JavaScript** (frontend)

## Deployment

The project includes a `vercel.json` for easy deployment on Vercel. You can also deploy on any Node.js-compatible hosting.

## Contributing

Feel free to fork the repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is for academic purposes (TCC) and may be adapted for future public use.

---

**PatroArcade** - Empowering players to connect and explore their gaming profiles.
