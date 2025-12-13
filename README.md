# SiteHub - Your Personal Web Dashboard

A modern web application that provides instant access to 300+ top websites with a Chrome-like new tab experience, featuring user authentication, data persistence, and customization.

## 🚀 Features

- **300+ Pre-loaded Sites** - Access popular websites instantly
- **User Authentication** - Guest and authenticated user modes
- **Data Persistence** - Save favorites and custom sites permanently
- **Guest Session Management** - 10-minute trial with data loss warnings
- **Drag & Drop** - Reorder sites with intuitive interface
- **Search & Filter** - Find sites quickly by category
- **Custom Sites** - Add your own websites
- **Favorites System** - Mark and organize favorite sites
- **Responsive Design** - Works on all devices
- **Modern UI** - Built with Tailwind CSS and Radix UI

## 🛠️ Tech Stack

- **Framework:** Next.js 14 with React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **Drag & Drop:** @dnd-kit
- **Deployment:** Vercel
- **Package Manager:** pnpm

## 🏃‍♂️ Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yuxuanzhouo3/mvp_8.git
   cd mvp_8
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Live Demo

Visit the live application: [SiteHub on Vercel](https://mvp-8-eeisyjc1e-yzcmf94-4399s-projects.vercel.app)

## 🔐 User Modes

### Guest Mode
- **10-minute session** with countdown timer
- **Data loss warnings** when session expires
- **Can use all features** but data is temporary
- **Clear messaging** about data being lost

### Authenticated Mode
- **Permanent data storage** with user-specific keys
- **Cloud sync** across devices (simulated)
- **Unlimited access** to all features
- **Data migration** from guest to authenticated

## 🎯 Key Features

### Data Persistence
- **Guest Data:** Stored in localStorage with expiration
- **User Data:** User-specific storage with email-based keys
- **Data Migration:** Automatic transfer when signing up

### Site Management
- **Add Custom Sites** - Create your own shortcuts
- **Favorites System** - Mark important sites
- **Drag & Drop** - Reorder sites intuitively
- **Search & Filter** - Find sites by category

### User Experience
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern UI** - Clean, intuitive interface
- **Fast Loading** - Optimized for performance
- **Accessibility** - Built with accessibility in mind

## 📁 Project Structure

```
mvp_8/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── integrations/      # Integration pages
│   ├── playground/        # Playground pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── ui/               # UI primitives (Radix UI)
│   ├── header.tsx        # Header component
│   ├── guest-timer.tsx   # Guest session timer
│   ├── upgrade-modal.tsx # Authentication modal
│   └── ...               # Feature components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── public/               # Static assets
└── styles/               # Global styles
```

## 🔧 Configuration

### Environment Variables
No environment variables required for basic functionality.

### Customization
- **Sites:** Modify `getDefaultSites()` in `app/page.tsx`
- **Styling:** Update Tailwind classes or modify `globals.css`
- **Features:** Extend components in the `components/` directory

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on push to main branch
3. Custom domain support available

### Other Platforms
- **Netlify:** Compatible with Next.js
- **Railway:** Easy deployment with database support
- **Self-hosted:** Standard Next.js deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Yuxuan Zhou**
- GitHub: [@yuxuanzhouo3](https://github.com/yuxuanzhouo3)
- Email: yuxuanzhouo3@gmail.com

## 🙏 Acknowledgments

- **Next.js** team for the amazing framework
- **Vercel** for seamless deployment
- **Tailwind CSS** for the utility-first CSS framework
- **Radix UI** for accessible component primitives
- **@dnd-kit** for drag and drop functionality

---

**© 2025 Yuxuan Zhou. All rights reserved.**

*SiteHub - Organize your web, one site at a time.* 