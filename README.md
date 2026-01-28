
# Bingo Me This

A modern, interactive bingo game app built with React Native and Expo. Play themed bingo games with friends, create custom cards, and share your wins!

## Features

- 🎮 **Multiple Themed Bingo Cards** - Choose from pre-made themes like birds, customers, office jargon, and more
- ✨ **Custom Themes** - Create your own personalized bingo cards
- 👥 **Multiplayer** - Play with friends using share codes
- 📊 **Game History** - Track your past games and achievements
- 🎉 **Celebrations** - Confetti animations when you win
- 📱 **Cross-Platform** - Works on iOS, Android, and Web

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Wllaby/BingoMeTis.git
cd BingoMeTis
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open the app:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
├── app/                    # App screens and navigation
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── create-theme.tsx   # Custom theme creation
│   ├── join-game.tsx      # Join game with code
│   └── history.tsx        # Game history
├── components/            # Reusable UI components
├── contexts/              # React contexts (Premium, Widget)
├── utils/                 # Utility functions and API client
├── styles/                # Common styles and theme
├── assets/                # Images and fonts
└── backend/               # Backend API (Fastify + Drizzle)
```

## Tech Stack

- **Frontend**: React Native, Expo 54, TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Fastify, Drizzle ORM, PostgreSQL
- **Animations**: React Native Reanimated
- **Monetization**: Google AdMob, Superwall (IAP)

## Building for Production

### iOS

```bash
eas build --platform ios --profile production
```

### Android

```bash
eas build --platform android --profile production
```

## Environment Variables

Create a `.env` file in the backend directory:

```
DATABASE_URL=your_database_url
RESEND_API_KEY=your_resend_api_key
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For support, email support@bingomethis.com or open an issue on GitHub.
