# NextJS Project Template

A modern, production-ready NextJS template with NextUI components and Tailwind CSS v3.

## 🚀 Features

- **Next.js 15.5.4** - Latest stable version
- **NextUI v2.6.11** - Beautiful React components
- **Tailwind CSS v3.4.0** - Utility-first CSS framework
- **TypeScript** - Type safety out of the box
- **ESLint + Prettier** - Code quality and formatting
- **Framer Motion** - Smooth animations

## 🛠️ Tech Stack

- **Framework:** Next.js 15 with App Router
- **UI Library:** NextUI v2.6.11 (last stable before HeroUI transition)
- **Styling:** Tailwind CSS v3.4.0
- **Language:** TypeScript
- **Animations:** Framer Motion
- **Code Quality:** ESLint + Prettier

## 🚀 Quick Start

1. **Clone the template:**

   ```bash
   git clone <your-repo-url>
   cd nextjs-project-template
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```text
├── app/
│   ├── globals.css          # Global styles with Tailwind
│   ├── layout.tsx           # Root layout with NextUIProvider
│   └── page.tsx             # Home page with NextUI components
├── tailwind.config.js       # Tailwind + NextUI configuration
├── postcss.config.js        # PostCSS configuration
└── package.json             # Dependencies and scripts
```

## 🎨 Customization

### Adding New NextUI Components

```tsx
import { Button, Card, Input } from '@nextui-org/react';

export default function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter text..." />
      <Button color="primary">Submit</Button>
    </Card>
  );
}
```

### Tailwind CSS Classes

```tsx
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Custom styled content
</div>
```

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [NextUI Components](https://nextui.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🚀 Deployment

Deploy easily on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/nextjs-project-template)

## 📄 License

MIT License - feel free to use this template for your projects!
