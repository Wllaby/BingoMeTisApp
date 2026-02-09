# Complete Beginner's Guide to Building Your Bingo App

**Don't worry - this guide will walk you through EVERYTHING step by step!**

---

## Part 1: Understanding What You Need

### What is EAS CLI?

EAS CLI is a **tool** (a program) made by Expo that helps you build your app for iPhones and Android phones. Think of it like a helper that packages up your app so it can run on mobile devices.

- **EAS** stands for "Expo Application Services"
- **CLI** means "Command Line Interface" (just a fancy way of saying "text-based tool")

**The good news:** You don't need to download it separately! We'll install it directly from the terminal using a simple command.

---

## Part 2: Opening the Terminal

### On Mac:

1. Click the magnifying glass icon in the top-right corner of your screen (Spotlight)
2. Type: `Terminal`
3. Press Enter
4. You'll see a window that looks like this:

```
Last login: Sun Feb  9 10:30:00 on ttys000
YourName@YourComputer ~ %
```

That blinking cursor is waiting for you to type commands!

### On Windows:

1. Press the Windows key on your keyboard
2. Type: `PowerShell`
3. Press Enter
4. You'll see a blue window with text

---

## Part 3: Navigate to Your Project

You need to tell the terminal where your project folder is.

### Finding Your Project Location:

**On Mac:**
1. Find your project folder in Finder
2. Right-click (or Control+click) on the folder
3. Hold down the **Option** key on your keyboard
4. You'll see "Copy as Pathname" appear - click it!

**On Windows:**
1. Find your project folder in File Explorer
2. Click on the address bar at the top (where it shows the folder path)
3. Copy the entire path (Ctrl+C)

### Going to Your Project:

In the terminal, type:
```bash
cd
```
(That's the letters c and d, then a space)

Then **paste** the path you copied (Cmd+V on Mac, Ctrl+V on Windows)

Press **Enter**

**You should now see your project name in the terminal!**

---

## Part 4: Installing EAS CLI (First Time Only)

You only need to do this once ever. Type this command and press Enter:

```bash
npm install -g @expo/eas-cli
```

**What will happen:**
- You'll see lots of text scrolling by - this is normal!
- It might take 1-2 minutes
- When it's done, you'll see the cursor blinking again, ready for the next command

**If you see an error about "permission denied":**
- On Mac, try typing: `sudo npm install -g @expo/eas-cli`
- It will ask for your computer password (the one you use to log in)
- Type it (you won't see it appear, but it's working!) and press Enter

---

## Part 5: Creating an Expo Account (If You Don't Have One)

1. Go to: https://expo.dev
2. Click "Sign Up" in the top right
3. Create an account with your email
4. **Write down your username and password somewhere safe!**

---

## Part 6: Log In to EAS

In the terminal, type:
```bash
eas login
```

Press Enter.

**What will happen:**
1. It will ask: "Email or username:"
   - Type your Expo username or email
   - Press Enter

2. It will ask: "Password:"
   - Type your password (you won't see it appearing - this is for security!)
   - Press Enter

3. You should see: "Logged in as YourUsername"

✅ **Success!** You're now logged in.

---

## Part 7: Building for iOS (iPhone/iPad)

Now for the big moment! Type:

```bash
eas build --platform ios
```

Press Enter.

### What Questions Will It Ask?

The first time you run this, it will ask several questions. Here's what to expect:

1. **"Would you like to automatically create an EAS project for @yourname/projectname?"**
   - Type: `Y` (yes)
   - Press Enter

2. **"Generate a new Apple Distribution Certificate?"**
   - Type: `Y` (yes)
   - Press Enter

3. **"Generate a new Apple Provisioning Profile?"**
   - Type: `Y` (yes)
   - Press Enter

4. **"What would you like your iOS bundle identifier to be?"**
   - It will suggest something like: `com.yourname.bingometis`
   - Just press Enter to accept it

### What Happens Next?

1. You'll see: "Build in progress..."
2. You'll get a link you can click to watch the build online
3. **This takes 10-20 minutes** - go grab a coffee! ☕
4. The terminal will show progress updates

When it's done, you'll see:
```
✔ Build finished
```

And you'll get a link to download your app!

---

## Part 8: Building for Android

Very similar! Type:

```bash
eas build --platform android
```

Press Enter.

It will ask similar questions. For most, just press Enter to accept the defaults.

---

## Part 9: What Could Go Wrong?

### "Command not found: eas"
- **Problem:** EAS CLI didn't install properly
- **Solution:** Try the install command again from Part 4

### "Not logged in"
- **Problem:** Your login expired
- **Solution:** Run `eas login` again

### "Build failed"
- **Problem:** Something in the code needs fixing
- **Solution:** Look at the error message - it will tell you what's wrong
- Copy and paste the error message and ask for help!

---

## Part 10: What Comes After Building?

Once your build is complete:

### For iOS:
1. You'll get a `.ipa` file (that's an iPhone app file)
2. You can test it on your own iPhone using TestFlight
3. Or submit it to the App Store

### For Android:
1. You'll get a `.aab` or `.apk` file
2. You can install it on your Android phone
3. Or submit it to the Google Play Store

---

## Quick Reference Card

**Open Terminal:**
- Mac: Spotlight → "Terminal"
- Windows: Windows Key → "PowerShell"

**Navigate to project:**
```bash
cd /path/to/your/project
```

**Install EAS (one time):**
```bash
npm install -g @expo/eas-cli
```

**Log in:**
```bash
eas login
```

**Build iOS:**
```bash
eas build --platform ios
```

**Build Android:**
```bash
eas build --platform android
```

---

## Getting Help

If you get stuck:
1. Take a screenshot of the error
2. Copy the text from the terminal
3. Ask for help and include both!

**Remember:** Everyone starts as a beginner. You're doing great by asking questions! 🎉
