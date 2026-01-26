/**
 * Script to add new resources to resources.json
 * Filters out duplicates based on domain matching
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESOURCES_JSON_PATH = path.join(__dirname, '..', 'src', 'data', 'resources.json');

interface Resource {
  id: number;
  name: string;
  url: string;
  description: string;
  category: string;
  subCategory: string;
  pricing: string;
  featured: boolean;
  opensource: boolean;
  tags: string[];
  count: null;
  tier: number;
  thumbnail: null;
  screenshot: null;
}

// New resources to add
const newResources: Omit<Resource, 'id'>[] = [
  {
    name: "Y2Mate",
    url: "https://y2mate.nu/",
    description: "Free YouTube to MP3 converter. Download YouTube videos as MP3 audio files quickly and easily.",
    category: "Tools",
    subCategory: "Converters",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["youtube", "mp3", "converter", "download"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "FreeConvert",
    url: "https://www.freeconvert.com/",
    description: "Free online file converter. Convert videos, audio, images, documents, and more.",
    category: "Tools",
    subCategory: "Converters",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["converter", "file", "video", "audio"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "CloudConvert",
    url: "https://cloudconvert.com/",
    description: "Online file converter supporting 200+ formats. Convert anything to anything.",
    category: "Tools",
    subCategory: "Converters",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["converter", "cloud", "file", "formats"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Compress JPEG",
    url: "https://compressjpeg.com/",
    description: "Compress JPEG images online. Reduce file size while maintaining quality.",
    category: "Tools",
    subCategory: "Image Tools",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["compression", "jpeg", "images", "optimization"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Flowkeeper",
    url: "https://flowkeeper.webflow.io/",
    description: "Webflow resources and templates for designers. Curated collection of Webflow assets.",
    category: "Templates",
    subCategory: "Webflow",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["webflow", "templates", "resources", "design"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Good Design Tools",
    url: "https://www.gooddesign.tools/",
    description: "Curated collection of the best design tools. Find the perfect tools for your design workflow.",
    category: "Learning",
    subCategory: "Resources",
    pricing: "Free",
    featured: true,
    opensource: false,
    tags: ["tools", "curated", "design", "collection"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Lindy",
    url: "https://www.lindy.ai/",
    description: "AI assistant that automates your work. Create custom AI employees for repetitive tasks.",
    category: "AI",
    subCategory: "Automation",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["ai", "automation", "assistant", "workflow"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "VEED.io",
    url: "https://www.veed.io/",
    description: "Online video editor. Edit, record, and stream videos with AI-powered tools.",
    category: "Tools",
    subCategory: "Video",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["video", "editor", "ai", "streaming"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Higgsfield",
    url: "https://higgsfield.ai/",
    description: "AI-powered video generation platform. Create stunning videos with artificial intelligence.",
    category: "AI",
    subCategory: "Video Generation",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["ai", "video", "generation", "creative"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Google Flow",
    url: "https://labs.google/fx/tools/flow",
    description: "Google's experimental creative flow tool. Generate and manipulate visual content with AI.",
    category: "AI",
    subCategory: "Image Generation",
    pricing: "Free",
    featured: true,
    opensource: false,
    tags: ["google", "ai", "creative", "experimental"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Google AI Studio",
    url: "https://aistudio.google.com/",
    description: "Build with Gemini. Google's platform for prototyping and building AI applications.",
    category: "AI",
    subCategory: "Development",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["google", "gemini", "ai", "development"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Sprout Social",
    url: "https://sproutsocial.com/",
    description: "Social media management platform. Schedule, analyze, and engage across all social networks.",
    category: "Tools",
    subCategory: "Social Media",
    pricing: "Paid",
    featured: false,
    opensource: false,
    tags: ["social media", "management", "analytics", "scheduling"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Social Blade",
    url: "https://socialblade.com/",
    description: "Track social media statistics. Analytics for YouTube, Twitch, Instagram, and more.",
    category: "Tools",
    subCategory: "Analytics",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["analytics", "social media", "youtube", "statistics"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Shopify Themes",
    url: "https://themes.shopify.com/",
    description: "Official Shopify theme store. Premium and free themes for your e-commerce store.",
    category: "Templates",
    subCategory: "E-commerce",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["shopify", "themes", "ecommerce", "templates"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Framer Marketplace",
    url: "https://www.framer.com/marketplace/templates/",
    description: "Official Framer template marketplace. Premium templates for building stunning websites.",
    category: "Templates",
    subCategory: "Framer",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["framer", "templates", "marketplace", "website"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Framer Globe",
    url: "https://globe.framer.website/",
    description: "Interactive 3D globe component for Framer. Add beautiful globe visualizations to your site.",
    category: "Templates",
    subCategory: "Framer",
    pricing: "Paid",
    featured: false,
    opensource: false,
    tags: ["framer", "3d", "globe", "component"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Shader Gradient",
    url: "https://www.shadergradient.co/",
    description: "Create beautiful animated gradients. Real-time shader-based gradient generator.",
    category: "Tools",
    subCategory: "Design",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["gradient", "shader", "animation", "design"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Framer Library",
    url: "https://bento.me/framerlib",
    description: "Curated collection of Framer resources. Components, templates, and tutorials.",
    category: "Templates",
    subCategory: "Framer",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["framer", "library", "components", "resources"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Nav Supply",
    url: "https://nav.supply/",
    description: "Premium navigation components for Framer. Beautiful, animated navigation menus.",
    category: "Templates",
    subCategory: "Framer",
    pricing: "Paid",
    featured: false,
    opensource: false,
    tags: ["framer", "navigation", "components", "menu"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Framer Things",
    url: "https://framerthings.com/",
    description: "Framer templates and components marketplace. High-quality resources for Framer.",
    category: "Templates",
    subCategory: "Framer",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["framer", "templates", "components", "marketplace"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Framer Fuel",
    url: "https://www.framerfuel.com/",
    description: "Framer templates and UI kits. Modern designs for Framer websites.",
    category: "Templates",
    subCategory: "Framer",
    pricing: "Paid",
    featured: false,
    opensource: false,
    tags: ["framer", "templates", "ui kits", "design"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Frameplate",
    url: "https://frameplate.co/",
    description: "Framer template library. Collection of ready-to-use Framer templates.",
    category: "Templates",
    subCategory: "Framer",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["framer", "templates", "library", "website"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "ASCII Shader",
    url: "https://github.com/AbstractBorderStudio/Ascii_Shader",
    description: "Open source ASCII shader effect. Convert images and video to ASCII art in real-time.",
    category: "Tools",
    subCategory: "Graphics",
    pricing: "Free",
    featured: false,
    opensource: true,
    tags: ["ascii", "shader", "graphics", "open-source"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "React Bits",
    url: "https://www.reactbits.dev/",
    description: "Animated React components library. Copy-paste components with beautiful animations.",
    category: "Tools",
    subCategory: "Components",
    pricing: "Free",
    featured: true,
    opensource: true,
    tags: ["react", "components", "animation", "library"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Aceternity UI",
    url: "https://ui.aceternity.com/",
    description: "Beautiful UI components with stunning animations. Copy and paste into your React projects.",
    category: "Tools",
    subCategory: "Components",
    pricing: "Free",
    featured: true,
    opensource: true,
    tags: ["react", "components", "animation", "ui"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Open Alternative",
    url: "https://openalternative.co/",
    description: "Discover open source alternatives to popular software. Find free replacements for paid tools.",
    category: "Learning",
    subCategory: "Resources",
    pricing: "Free",
    featured: true,
    opensource: true,
    tags: ["open-source", "alternatives", "software", "free"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Untitled UI",
    url: "https://www.untitledui.com/",
    description: "The largest Figma UI kit. 10,000+ components for designing beautiful interfaces.",
    category: "Templates",
    subCategory: "UI Kits",
    pricing: "Paid",
    featured: true,
    opensource: false,
    tags: ["figma", "ui kit", "components", "design system"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Thind UI",
    url: "https://thind.dev/ui",
    description: "Modern UI components for React. Beautiful, accessible components built with Tailwind.",
    category: "Tools",
    subCategory: "Components",
    pricing: "Free",
    featured: false,
    opensource: true,
    tags: ["react", "tailwind", "components", "ui"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Blank",
    url: "https://useblank.design/",
    description: "Minimal design system for Figma. Clean, simple components for modern interfaces.",
    category: "Templates",
    subCategory: "UI Kits",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["figma", "minimal", "design system", "components"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Lumos",
    url: "https://lumos.timothyricks.com/",
    description: "Figma design system by Timothy Ricks. Comprehensive UI kit for modern applications.",
    category: "Templates",
    subCategory: "UI Kits",
    pricing: "Paid",
    featured: false,
    opensource: false,
    tags: ["figma", "design system", "ui kit", "components"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "TweakCN",
    url: "https://tweakcn.com/",
    description: "Customize shadcn/ui themes visually. Generate and export custom color schemes.",
    category: "Tools",
    subCategory: "Design",
    pricing: "Free",
    featured: false,
    opensource: true,
    tags: ["shadcn", "themes", "customization", "tailwind"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Studio 2AM",
    url: "https://studio2am.co/",
    description: "Creative tools for designers. Unique effects and plugins for design workflows.",
    category: "Tools",
    subCategory: "Design",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["design", "tools", "effects", "creative"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Brand Toolkit",
    url: "https://brandtoolk.it/",
    description: "Essential branding resources and tools. Everything you need to build a strong brand.",
    category: "Tools",
    subCategory: "Branding",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["branding", "toolkit", "resources", "design"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "TextureLib",
    url: "https://texturelib.com/",
    description: "Free texture library. High-quality textures for 3D, games, and design projects.",
    category: "Templates",
    subCategory: "Textures",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["textures", "3d", "design", "free"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Halftoner",
    url: "https://studio2am.co/products/halftoner",
    description: "Halftone effect generator by Studio 2AM. Create retro halftone patterns easily.",
    category: "Tools",
    subCategory: "Graphics",
    pricing: "Paid",
    featured: false,
    opensource: false,
    tags: ["halftone", "effects", "retro", "graphics"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "TextureLabs",
    url: "https://texturelabs.org/",
    description: "Free textures and materials. Seamless textures for 3D and design work.",
    category: "Templates",
    subCategory: "Textures",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["textures", "materials", "3d", "seamless"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Endless Tools",
    url: "https://app.endlesstools.io/",
    description: "AI-powered design tools. Generate patterns, gradients, and graphics with AI.",
    category: "AI",
    subCategory: "Design",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["ai", "design", "patterns", "graphics"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "DITHR Tool",
    url: "https://antlii.work/DITHR-Tool",
    description: "Dithering effect tool. Apply retro dither effects to images.",
    category: "Tools",
    subCategory: "Graphics",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["dither", "retro", "effects", "graphics"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "STL to ASCII",
    url: "https://andrewsink.github.io/STL-to-ASCII-Generator/",
    description: "Convert 3D STL files to ASCII art. Visualize 3D models as text-based graphics.",
    category: "Tools",
    subCategory: "3D",
    pricing: "Free",
    featured: false,
    opensource: true,
    tags: ["3d", "ascii", "converter", "stl"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Kurt Mock-ups",
    url: "https://www.kurtwinterdesign.com/mock-ups",
    description: "Premium device mockups. High-quality mockup templates for presentations.",
    category: "Templates",
    subCategory: "Mockups",
    pricing: "Paid",
    featured: false,
    opensource: false,
    tags: ["mockups", "devices", "presentations", "design"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Supernova",
    url: "https://app.supernova.io/",
    description: "Design system platform. Build, manage, and scale design systems efficiently.",
    category: "Tools",
    subCategory: "Design Systems",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["design system", "documentation", "collaboration", "tokens"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Freepik",
    url: "https://www.freepik.com/",
    description: "Free vectors, photos, and PSD files. Millions of graphic resources for download.",
    category: "Templates",
    subCategory: "Images",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["vectors", "photos", "graphics", "free"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Pixabay",
    url: "https://pixabay.com/",
    description: "Free images and royalty-free stock. Photos, illustrations, vectors, and videos.",
    category: "Templates",
    subCategory: "Images",
    pricing: "Free",
    featured: true,
    opensource: false,
    tags: ["images", "stock", "free", "royalty-free"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Hinto AI",
    url: "https://hintoai.com/",
    description: "AI-powered design feedback. Get instant design critiques and suggestions.",
    category: "AI",
    subCategory: "Design",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["ai", "design", "feedback", "critique"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "VidIQ",
    url: "https://vidiq.com/",
    description: "YouTube growth tool. Analytics, SEO tools, and insights for content creators.",
    category: "Tools",
    subCategory: "Video",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["youtube", "analytics", "seo", "growth"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Happy Editing",
    url: "https://www.happyediting.co/",
    description: "Video editing resources and tutorials. Learn professional editing techniques.",
    category: "Learning",
    subCategory: "Video",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["video", "editing", "tutorials", "resources"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Ungrid",
    url: "https://experiments.uninspired.studio/projects/grid/",
    description: "Experimental grid tool by Uninspired Studio. Create unique grid-based layouts.",
    category: "Tools",
    subCategory: "Design",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["grid", "layout", "experimental", "design"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Video to ASCII",
    url: "https://collidingscopes.github.io/ascii/",
    description: "Convert video to ASCII art in real-time. Browser-based ASCII video converter.",
    category: "Tools",
    subCategory: "Graphics",
    pricing: "Free",
    featured: false,
    opensource: true,
    tags: ["ascii", "video", "converter", "art"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Newhead Design",
    url: "https://newhead.design/",
    description: "Design agency portfolio and resources. Inspiration and tools for designers.",
    category: "Inspiration",
    subCategory: "Portfolios",
    pricing: "Free",
    featured: false,
    opensource: false,
    tags: ["portfolio", "agency", "design", "inspiration"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Motion Boutique",
    url: "https://www.motionboutique.com/",
    description: "After Effects plugins and tools. Professional motion design resources.",
    category: "Tools",
    subCategory: "Animation",
    pricing: "Paid",
    featured: false,
    opensource: false,
    tags: ["after effects", "plugins", "motion", "animation"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "21st.dev",
    url: "https://21st.dev/",
    description: "Modern development resources. Curated tools and libraries for developers.",
    category: "Learning",
    subCategory: "Resources",
    pricing: "Free",
    featured: true,
    opensource: false,
    tags: ["development", "resources", "tools", "curated"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Unicorn Studio",
    url: "https://www.unicorn.studio/",
    description: "WebGL visual effects editor. Create stunning visual effects without code.",
    category: "Tools",
    subCategory: "Graphics",
    pricing: "Freemium",
    featured: true,
    opensource: false,
    tags: ["webgl", "effects", "visual", "no-code"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Motion for React",
    url: "https://examples.motion.dev/",
    description: "Framer Motion examples and demos. Interactive examples for React animations.",
    category: "Learning",
    subCategory: "Resources",
    pricing: "Free",
    featured: true,
    opensource: true,
    tags: ["framer motion", "react", "animation", "examples"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Pastiche 2",
    url: "https://www.motionboutique.com/products/pastiche-2",
    description: "After Effects clone tool by Motion Boutique. Create complex clone animations easily.",
    category: "Tools",
    subCategory: "Animation",
    pricing: "Paid",
    featured: false,
    opensource: false,
    tags: ["after effects", "plugin", "clone", "animation"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Plunk",
    url: "https://www.useplunk.com/",
    description: "Open source email platform. Send transactional and marketing emails easily.",
    category: "Tools",
    subCategory: "Email",
    pricing: "Freemium",
    featured: false,
    opensource: true,
    tags: ["email", "transactional", "marketing", "open-source"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Notion Templates",
    url: "https://www.notion.com/templates",
    description: "Official Notion template gallery. Free templates for productivity and organization.",
    category: "Templates",
    subCategory: "Productivity",
    pricing: "Free",
    featured: true,
    opensource: false,
    tags: ["notion", "templates", "productivity", "organization"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Notionland",
    url: "https://www.notionland.co/",
    description: "Curated Notion templates marketplace. Premium templates for Notion users.",
    category: "Templates",
    subCategory: "Productivity",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["notion", "templates", "marketplace", "productivity"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Super",
    url: "https://super.so/",
    description: "Turn Notion into a website. Create fast, beautiful websites from Notion pages.",
    category: "Tools",
    subCategory: "No-Code",
    pricing: "Paid",
    featured: true,
    opensource: false,
    tags: ["notion", "website", "no-code", "cms"],
    count: null,
    tier: 1,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Thenty",
    url: "https://thenty.io/",
    description: "No-code website builder. Create beautiful websites without coding.",
    category: "Tools",
    subCategory: "No-Code",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["website", "no-code", "builder", "design"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  },
  {
    name: "Outseta",
    url: "https://www.outseta.com/",
    description: "All-in-one startup toolkit. Payments, auth, CRM, and email in one platform.",
    category: "Tools",
    subCategory: "Business",
    pricing: "Freemium",
    featured: false,
    opensource: false,
    tags: ["startup", "payments", "auth", "crm"],
    count: null,
    tier: 2,
    thumbnail: null,
    screenshot: null
  }
];

async function main() {
  console.log('📦 Adding new resources to resources.json\n');

  // Read existing resources
  const resourcesData = fs.readFileSync(RESOURCES_JSON_PATH, 'utf-8');
  const resources: Resource[] = JSON.parse(resourcesData);

  console.log(`📋 Existing resources: ${resources.length}`);

  // Get existing domains for duplicate detection
  const existingDomains = new Set(
    resources.map(r => {
      try {
        return new URL(r.url).hostname.replace('www.', '').toLowerCase();
      } catch {
        return r.url.toLowerCase();
      }
    })
  );

  // Filter out duplicates
  const toAdd: Omit<Resource, 'id'>[] = [];
  const skipped: string[] = [];

  for (const resource of newResources) {
    try {
      const domain = new URL(resource.url).hostname.replace('www.', '').toLowerCase();

      // Check for domain match (excluding subdomains for some services)
      const baseDomain = domain.split('.').slice(-2).join('.');

      if (existingDomains.has(domain) || existingDomains.has(baseDomain)) {
        skipped.push(`${resource.name} (${domain})`);
      } else {
        toAdd.push(resource);
        existingDomains.add(domain);
      }
    } catch {
      toAdd.push(resource);
    }
  }

  console.log(`\n⏭️  Skipped (duplicates): ${skipped.length}`);
  skipped.forEach(s => console.log(`   - ${s}`));

  console.log(`\n✅ Adding: ${toAdd.length} new resources`);

  // Get the next ID
  let nextId = Math.max(...resources.map(r => r.id)) + 1;

  // Add new resources with IDs
  for (const resource of toAdd) {
    resources.push({
      ...resource,
      id: nextId++
    } as Resource);
    console.log(`   + [${nextId - 1}] ${resource.name}`);
  }

  // Save updated resources
  fs.writeFileSync(
    RESOURCES_JSON_PATH,
    JSON.stringify(resources, null, 2) + '\n',
    'utf-8'
  );

  console.log(`\n💾 Saved! Total resources: ${resources.length}`);
  console.log(`\n📸 Run 'npm run capture-screenshots' to capture screenshots for new resources`);
}

main().catch(console.error);
