/**
 * Application Configuration
 */

export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "CyberCodex.io",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    description: "Master Cybersecurity & Ethical Hacking through interactive tutorials and hands-on labs",
  },

  routes: {
    home: "/",
    courses: "/courses",
    labs: "/labs",
    community: "/community",
    about: "/about",
    pricing: "/pricing",
    login: "/login",
    signup: "/signup",
    profile: "/profile",
    dashboard: "/dashboard",
    leaderboard: "/leaderboard",
  },

  navigation: {
    main: [
      { label: "Courses", href: "/courses" },
      { label: "Labs", href: "/labs" },
      { label: "Community", href: "/community" },
      { label: "Pricing", href: "/pricing" },
      { label: "About", href: "/about" },
    ],
  },

  features: {
    auth: true, // ✅ Enabled with NextAuth.js v5
    comments: false, // Will enable when comment system is ready
    labs: false, // Will enable when lab environment is ready
  },

  content: {
    coursesPerPage: 12,
    labsPerPage: 12,
    maxRecentCourses: 6,
  },

  social: {
    github: "https://github.com/cybercodex",
    twitter: "https://twitter.com/cybercodex",
    discord: "https://discord.gg/cybercodex",
  },
} as const;

/**
 * Course Categories
 */
export const courseCategories = [
    {
    id: "networking",
    name: "Networking",
    description: "Master network fundamentals, protocols, and infrastructure",
    icon: "🔌",
    iconGif: "/images/categories/clawMachine.gif",
    color: "cyber-secondary",
  },
  {
    id: "linux",
    name: "Linux",
    description: "Learn Linux system administration and command line",
    icon: "🐧",
    iconGif: "/images/categories/guyOnComputer.gif",
    color: "cyber-primary",
  },
  {
    id: "web-security",
    name: "Web Security",
    description: "Master web application security and common vulnerabilities",
    icon: "🔐",
    iconGif: "/images/categories/GameSpooky.gif",
    color: "cyber-primary",
  },
  {
    id: "network-security",
    name: "Network Security",
    description: "Learn network protocols and penetration testing",
    icon: "🌐",
    iconGif: "/images/categories/hack.gif",
    color: "cyber-secondary",
  },
  {
    id: "cryptography",
    name: "Cryptography",
    description: "Understand encryption and cryptographic protocols",
    icon: "🔑",
    iconGif: "/images/categories/CyberShop.webp",
    color: "cyber-warning",
  },
  {
    id: "penetration-testing",
    name: "Penetration Testing",
    description: "Hands-on ethical hacking techniques",
    icon: "🎯",
    iconGif: "/images/categories/GameSpooky3.gif",
    color: "cyber-danger",
  },
  {
    id: "malware-analysis",
    name: "Malware Analysis",
    description: "Analyze and reverse engineer malicious software",
    icon: "🦠",
    iconGif: "/images/categories/lightChase.gif",
    color: "cyber-primary",
  },
  {
    id: "cloud-security",
    name: "Cloud Security",
    description: "Secure cloud infrastructure and services",
    icon: "☁️",
    iconGif: "/images/categories/pink.gif",
    color: "cyber-secondary",
  },
  {
    id: "programming",
    name: "Programming",
    description: "Learn programming fundamentals and coding skills",
    icon: "💻",
    iconGif: "/images/categories/python-animated.gif",
    color: "cyber-primary",
  },
] as const;

/**
 * Difficulty Levels
 */
export const difficultyLevels = {
  beginner: {
    label: "Beginner",
    color: "green",
    description: "No prior knowledge required",
  },
  intermediate: {
    label: "Intermediate",
    color: "yellow",
    description: "Some basic knowledge required",
  },
  advanced: {
    label: "Advanced",
    color: "red",
    description: "Strong foundation required",
  },
} as const;

/**
 * Lab Environments
 */
export const labEnvironments = {
  web: {
    name: "Web Application",
    icon: "🌐",
    description: "Practice web security in a sandboxed environment",
  },
  terminal: {
    name: "Terminal",
    icon: "💻",
    description: "Command-line based challenges",
  },
  network: {
    name: "Network",
    icon: "🔗",
    description: "Network analysis and penetration testing",
  },
  binary: {
    name: "Binary Exploitation",
    icon: "⚙️",
    description: "Reverse engineering and exploitation",
  },
} as const;

/**
 * Pricing Configuration
 */
export const pricingTiers = {
  free: {
    id: "free",
    name: "Explorer",
    price: "Free",
    period: "/forever",
    description: "Explore cybersecurity with basic access to learning content",
    features: [
      { text: "Access to first few chapters in most courses", included: true },
      { text: "Access to community and events", included: true },
      { text: "Basic lab environments", included: true },
      { text: "Exclusive Discord channels", included: false },
      { text: "Exclusive events and workshops", included: false },
      { text: "Code mentors and project reviews", included: false },
      { text: "Certificates of completion", included: false },
      { text: "Advanced lab environments", included: false },
      { text: "AI-powered learning assistant", included: false },
    ],
    ctaText: "Start for Free",
    ctaVariant: "secondary" as const,
  },
  pro: {
    id: "pro",
    name: "Elite Hacker",
    price: "$4.99",
    period: "/month",
    priceYearly: "$49.99",
    periodYearly: "/year",
    savingsPercentage: 33,
    description: "Unlock full access to all courses and premium features",
    features: [
      { text: "Full access to all courses and content", included: true },
      { text: "Access to community and events", included: true },
      { text: "Basic lab environments", included: true },
      { text: "Exclusive Discord channels", included: true },
      { text: "Exclusive events and workshops", included: true },
      { text: "Code mentors and project reviews", included: true },
      { text: "Certificates of completion", included: true },
      { text: "Advanced lab environments", included: true },
      { text: "Unlimited AI-powered assistance", included: true },
    ],
    ctaText: "Join Elite",
    ctaVariant: "primary" as const,
    badge: "MOST POPULAR",
    highlighted: true,
  },
} as const;

export const pricingFeatures = [
  {
    category: "LEARNING CONTENT",
    features: [
      {
        name: "Access to Courses",
        info: "Full catalog of cybersecurity courses",
        free: "Early chapters only",
        pro: "Full Access",
      },
      {
        name: "Project Tutorials",
        info: "Hands-on guided projects",
        free: true,
        pro: true,
      },
      {
        name: "Challenge Packs",
        info: "Practice challenges and CTF-style exercises",
        free: true,
        pro: true,
      },
    ],
  },
  {
    category: "COMMUNITY",
    features: [
      {
        name: "Access to Discord",
        info: "Join our community server",
        free: true,
        pro: true,
      },
      {
        name: "Exclusive Discord Channels",
        info: "Premium member-only channels",
        free: false,
        pro: true,
      },
      {
        name: "Weekly Events",
        info: "Live workshops and coding sessions",
        free: true,
        pro: true,
      },
      {
        name: "Exclusive Events",
        info: "Premium workshops with industry experts",
        free: false,
        pro: true,
      },
    ],
  },
  {
    category: "ONE-ON-ONE SUPPORT",
    features: [
      {
        name: "Code Mentors",
        info: "Get help from experienced mentors",
        free: false,
        pro: true,
      },
      {
        name: "Project Reviews",
        info: "Detailed feedback on your projects",
        free: false,
        pro: true,
      },
      {
        name: "Certificates",
        info: "Official certificates of completion",
        free: false,
        pro: true,
      },
    ],
  },
  {
    category: "ADDITIONAL FEATURES",
    features: [
      {
        name: "Lab Environments",
        info: "Sandboxed environments for practice",
        free: "Basic",
        pro: "Advanced",
      },
      {
        name: "AI Learning Assistant",
        info: "Get instant help with AI",
        free: "Limited",
        pro: "Unlimited",
      },
    ],
  },
] as const;

export const pricingFAQ = [
  {
    id: "club",
    question: "What is CyberCodex Elite?",
    answer:
      "CyberCodex Elite is our premium membership with full access to all courses, advanced labs, exclusive Discord channels, one-on-one mentorship, and certificates. Get personalized support and unlock your full potential in cybersecurity.",
  },
  {
    id: "contact",
    question: "How can I get in contact with someone from the CyberCodex team?",
    answer:
      "You can reach us through Discord for community support, or email us at support@cybercodex.io for direct assistance. Elite members get priority support and can schedule one-on-one sessions with mentors.",
  },
  {
    id: "contribute",
    question: "How can I contribute to CyberCodex?",
    answer:
      "We welcome contributions! You can submit course suggestions, report bugs, contribute to open-source projects, or create community tutorials. Join our Discord to learn more about contribution opportunities.",
  },
  {
    id: "request",
    question: "Can I request a new course or feature?",
    answer:
      "Absolutely! We value community feedback. Submit feature requests through our Discord or GitHub. Elite members get priority consideration for course requests and early access to new features.",
  },
  {
    id: "prerequisites",
    question: "What are the prerequisites for learning cybersecurity?",
    answer:
      "No prior experience required! Our beginner courses start from the basics. Having some programming knowledge helps, but we have courses for all skill levels from complete beginners to advanced practitioners.",
  },
  {
    id: "suitable",
    question: "Is CyberCodex suitable for beginners?",
    answer:
      "Yes! We designed CyberCodex for all skill levels. Start with our beginner-friendly courses in Python, Web Security Basics, or Networking Fundamentals. Our learning paths guide you step by step.",
  },
  {
    id: "cancel",
    question: "How do I cancel my subscription?",
    answer:
      "You can cancel anytime from your account settings. Your access continues until the end of your billing period. No long-term commitments or cancellation fees.",
  },
] as const;

export type CourseCategory = typeof courseCategories[number]["id"];
export type DifficultyLevel = keyof typeof difficultyLevels;
export type LabEnvironment = keyof typeof labEnvironments;
export type PricingTier = keyof typeof pricingTiers;
