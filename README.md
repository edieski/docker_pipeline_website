# DevOps Escape Room - Docker Pipeline Website

An interactive learning platform that teaches DevOps concepts through gamified missions focused on Docker, CI/CD pipelines, and deployment strategies.

## 🎮 Missions

1. **Dockerfile Jigsaw** - Build a valid Dockerfile by ordering directive blocks correctly
2. **Cache Crash** - Optimize your Dockerfile for faster builds and smaller images
3. **Pipeline Architect** - Design a CI/CD pipeline by connecting job nodes and configuring YAML
4. **Log Detective** - Debug a failing CI pipeline by analyzing logs and identifying errors
5. **Deploy or Die** - Configure deployment settings and successfully deploy to production
6. **Outage Simulator** - Respond to a production incident by choosing the right recovery strategy

## 🚀 Deployment to GitHub Pages

### Method 1: Manual Deployment

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add all missions and games"
   git push origin main
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

3. **Enable GitHub Pages:**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "Deploy from a branch"
   - Choose "gh-pages" branch
   - Your site will be available at: `https://yourusername.github.io/docker_pipeline_website/`

### Method 2: Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the main branch.

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add all missions and games"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "GitHub Actions" as the source
   - The workflow will automatically deploy your site

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Features

- **Interactive Learning**: Hands-on games that teach real DevOps concepts
- **Difficulty Levels**: Beginner, Intermediate, and Advanced modes
- **Progress Tracking**: Save progress and unlock missions sequentially
- **Hint System**: Get help when stuck without losing points
- **Real-world Scenarios**: Learn from practical, industry-relevant examples
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Drag & Drop**: React DnD
- **State Management**: Zustand
- **Build Tool**: Vite
- **Deployment**: GitHub Pages

## 📚 Learning Objectives

By completing all missions, students will understand:

- Docker containerization fundamentals
- Dockerfile optimization techniques
- CI/CD pipeline design and implementation
- Log analysis and debugging strategies
- Production deployment best practices
- Incident response and recovery procedures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).