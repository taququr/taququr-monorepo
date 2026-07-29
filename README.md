# Portfolio Monorepo

A high-performance portfolio project built within a Turborepo workspace, showcasing my work as a Frontend Developer.

## 🚀 Tech Stack

- **Monorepo Management**: Turborepo
- **Package Manager**: Bun
- **Framework**: Next.js 16.2.4 (Portfolio App)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Animations**: tw-animate-css

## 📦 Installation & Development

Since this is a monorepo, all commands should be executed from the root directory.

```bash
# Install dependencies for all packages
bun install

# Run development server (starts all apps/dev scripts)
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

## 🎨 Features

- **Monorepo Architecture**: Shared configurations and components across multiple potential applications.
- **Modern UI**: Responsive design with Tailwind CSS 4 and shadcn/ui.
- **Performance**: Optimized builds using Turbopack and remote caching via Vercel.
- **Animations**: Smooth transitions for an enhanced user experience.

## 📄 Project Structure

The project follows the standard Turborepo workspace layout:

```
taququr-monorepo/
├── apps/
│ └── portfolio/ # The main Next.js portfolio application
├── packages/
│ ├── ui/ # Shared shadcn/ui components & primitives
│ ├── config/ # Shared ESLint, Tailwind, and TS configurations
│ └── utils/ # Shared helper functions and logic
├── turbo.json # Turborepo configuration
├── package.json # Root workspace dependencies
└── ...
```

## 🛠️ Development Tools

- **Turbopack**: Enabled for ultra-fast HMR during development.
- **Bun**: High-performance JavaScript runtime and package manager.
- **ESLint & Prettier**: Unified linting across the entire monorepo.
- **TypeScript**: Strict type checking for better developer experience.

## 📝 License

This project is private and for personal use.
