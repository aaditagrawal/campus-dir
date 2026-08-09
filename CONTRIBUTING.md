# Contributing to MIT Manipal Campus Directory

Thank you for your interest in contributing to the MIT Manipal Campus Directory! This comprehensive guide covers both **data contributions** (most common) and **code contributions** to help maintain and improve this essential resource for the MIT Manipal community.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Data Contributions](#data-contributions)
- [Code Contributions](#code-contributions)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Data Structure Reference](#data-structure-reference)
- [Code Guidelines](#code-guidelines)
- [Tools Section](#tools-section)
- [Testing & Quality](#testing--quality)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## ⚡ Quick Start

### For Data Updates (No Coding Required)

1. **Fork the repository** on GitHub
2. **Edit JSON files** in `src/data/` directly on GitHub
3. **Submit a Pull Request** with your changes

### For Code Changes

1. **Set up development environment** (see [Development Setup](#development-setup))
2. **Create a feature branch**
3. **Make your changes** and test them
4. **Submit a Pull Request**

## 📊 Data Contributions

Data contributions are the most common and impactful way to help! Keeping campus information current and accurate is crucial for students.

### 🍽️ Restaurants (`src/data/restaurants.json`)

**What to Update:**

- **Contact numbers** - Add missing or update changed phone numbers
- **Business hours** - Add opening/closing times for each day of the week
- **Delivery fees** - Update delivery and packaging costs
- **Addresses** - Add or update location information
- **New restaurants** - Add newly opened establishments
- **Status changes** - Mark closed restaurants or update service status

**Data Structure:**

```json
[
  {
    "name": "Restaurant Name",
    "phones": ["+91 XXXXX XXXXX"],
    "deliveryFee": "₹50",
    "packagingFee": "₹10",
    "address": "Location description",
    "hours": [
      { "day": 0, "open": "09:00", "close": "22:00" },
      { "day": 1, "open": "09:00", "close": "22:00" },
      { "day": 2, "open": "09:00", "close": "22:00" },
      { "day": 3, "open": "09:00", "close": "22:00" },
      { "day": 4, "open": "09:00", "close": "22:00" },
      { "day": 5, "open": "09:00", "close": "22:00" },
      { "day": 6, "open": "09:00", "close": "22:00" }
    ]
  }
]
```

**Day Numbers:** 0 = Sunday, 1 = Monday, ..., 6 = Saturday

### 🏠 Hostels (`src/data/hostels.json`)

**What to Update:**

- **Warden details** - Update names, phone numbers, emails, designations
- **Reception contacts** - Update main hostel phone numbers and emails
- **New hostels** - Add information for new hostel blocks
- **Contact changes** - Update when wardens or contacts change
- **Block information** - Update campus, address, or email changes

**Data Structure:**

```json
[
  {
    "block": "Block Name",
    "campus": "T & M Campus Hostels",
    "address": "MAHE, Manipal - 576104",
    "receptionPhone": "0820 XXXXXXX",
    "email": "hbX.mit@manipal.edu",
    "wardens": [
      {
        "name": "Warden Full Name",
        "designation": "Position/Department",
        "officePhone": "0820 XXXXXXX",
        "mobiles": ["XXXXXXXXXX"],
        "email": "warden@manipal.edu"
      }
    ]
  }
]
```

### 🚑 Emergency Services (`src/data/emergency.json`)

**What to Update:**

- **Clinic contacts** - Update student clinic phone numbers and hours
- **Ambulance services** - Update emergency medical contacts
- **Security numbers** - Update campus security contacts
- **New emergency services** - Add new emergency resources
- **Service notes** - Update additional information or instructions

**Data Structure:**

```json
[
  {
    "name": "Service Name",
    "phones": ["Emergency Number"],
    "address": "Location",
    "notes": "Additional information",
    "accent": "red"
  }
]
```

### 🚗 Travel Services (`src/data/travel.json`)

**What to Update:**

- **Auto rickshaw stands** - Update contact numbers and locations
- **Cab services** - Add/update taxi company contacts
- **New transport options** - Add new transportation services
- **Service notes** - Update availability or special instructions

**Data Structure:**

```json
{
  "autos": [
    {
      "name": "Auto Stand Name",
      "phones": ["Contact Number"],
      "notes": "Additional information"
    }
  ],
  "cabs": [
    {
      "name": "Cab Service Name",
      "phones": ["Contact Number"],
      "notes": "Additional information"
    }
  ]
}
```

### 🔧 General Services (`src/data/services.json`)

**What to Update:**

- **Laundry services** - Update contact numbers and locations
- **Printing/Xerox shops** - Add/update printing service contacts
- **New service providers** - Add newly opened service establishments
- **Service changes** - Update when services or contacts change

**Data Structure:**

```json
{
  "laundry": [
    {
      "name": "Service Name",
      "phones": ["+91 XXXXX XXXXX"],
      "notes": "Additional information"
    }
  ],
  "xerox": [
    {
      "name": "Shop Name",
      "phones": ["Contact Number"],
      "notes": "Additional information"
    }
  ]
}
```

### 🛠️ Tools (`src/data/tools.json`)

**What to Update:**

- **Web resources** - Add useful external links for students
- **Internal tools** - Add new internal tool pages
- **Broken links** - Fix non-functional URLs
- **New tools** - Add both web resources and internal applications

**Data Structure:**

```json
{
  "web_resources": [
    {
      "name": "Resource Name",
      "url": "https://example.com",
      "description": "Brief description of the resource"
    }
  ],
  "internal_tools": [
    {
      "name": "Tool Name",
      "url": "/tools/tool-path",
      "description": "Description of the internal tool"
    }
  ]
}
```

### 📚 Academics (`src/data/academics.json`)

**What to Update:**

- **New academic portals** - Add new university systems
- **Updated URLs** - Fix broken or changed links
- **Login credentials** - Update shared credentials when they change
- **New resources** - Add new academic tools or platforms

**Data Structure:**

```json
[
  {
    "section": "Section Name",
    "items": [
      {
        "name": "Resource Name",
        "description": "Brief description",
        "url": "https://example.com",
        "credentials": {
          "userId": "username",
          "password": "password"
        }
      }
    ]
  }
]
```

## 💻 Code Contributions

### 🛠️ Development Setup

**Prerequisites:**

- **Node.js 18+** or **Bun** runtime
- **Git** for version control
- **Code editor** (VS Code recommended)

**Installation:**

```bash
# Clone your fork
git clone https://github.com/aaditagrawal/campus-dir.git
cd campus-dir

# Install dependencies
bun install  # or npm install

# Start development server
bun dev  # or npm run dev
```

**Verify Setup:**

- Open [http://localhost:3000](http://localhost:3000)
- Check that all pages load correctly
- Test search functionality
- Verify dark/light mode toggle

### 🏗️ Project Architecture

The project follows Next.js 15 App Router patterns with a clear separation of concerns:

```
src/
├── app/                    # Next.js App Router pages
│   ├── academics/         # Academic resources page
│   ├── emergency/         # Emergency services page
│   ├── hostels/           # Hostel information page
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   ├── restaurants/       # Restaurant directory page
│   ├── services/          # General services page
│   ├── tools/             # Tools and resources page
│   │   └── mail-to-warden/ # Leave request generator tool
│   ├── travel/            # Transportation services page
│   └── globals.css        # Global styles and design system
├── components/            # Reusable UI components
│   ├── ui/               # Radix UI component library
│   │   ├── badge.tsx     # Status indicators
│   │   ├── button.tsx    # Interactive buttons
│   │   ├── card.tsx      # Content containers
│   │   ├── input.tsx     # Form inputs
│   │   ├── label.tsx     # Form labels
│   │   ├── navigation-menu.tsx # Main navigation
│   │   ├── sheet.tsx     # Mobile navigation drawer
│   │   └── switch.tsx    # Toggle controls
│   ├── site-header.tsx   # Main navigation with search
│   └── theme-provider.tsx # Dark/light mode provider
├── data/                  # JSON data files
│   ├── academics.json     # Academic portals and resources
│   ├── emergency.json     # Emergency services contacts
│   ├── hostels.json       # Hostel information and warden details
│   ├── restaurants.json   # Restaurant directory with hours and contacts
│   ├── services.json      # General services (laundry, printing)
│   ├── tools.json         # Web resources and internal tools
│   └── travel.json        # Transportation services
└── lib/                   # Utility functions
    ├── search.ts          # Search functionality with Fuse.js
    ├── utils.ts           # General utilities and helpers
    └── vcard.ts           # vCard generation for contacts
```

### 🔧 Code Guidelines

#### **TypeScript Standards**

- **Strict typing** - Use proper TypeScript types for all functions and components
- **Interface definitions** - Define clear interfaces for data structures
- **Type safety** - Avoid `any` types, use proper type assertions

```typescript
// Good
interface Restaurant {
  name: string;
  phones: string[];
  deliveryFee?: string;
  hours?: Array<{ day: number; open: string; close: string }>;
}

// Avoid
const restaurant: any = { ... };
```

#### **Component Structure**

- **Functional components** with hooks
- **Proper prop typing** with interfaces
- **Consistent naming** - PascalCase for components, camelCase for functions

```typescript
// Good
interface RestaurantCardProps {
  restaurant: Restaurant;
  onContactClick: (phone: string) => void;
}

export function RestaurantCard({ restaurant, onContactClick }: RestaurantCardProps) {
  // Component logic
}
```

#### **File Organization**

- **kebab-case** for file names
- **PascalCase** for component names
- **One component per file** (except for related utilities)

#### **Styling Guidelines**

- **Tailwind CSS** for all styling
- **Consistent spacing** using Tailwind's spacing scale
- **Responsive design** - Mobile-first approach
- **Accessibility** - Proper ARIA labels and semantic HTML

```tsx
// Good
<button
  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
  aria-label="Download contact"
>
  Download Contact
</button>
```

### 🔍 Search System

The search functionality is powered by Fuse.js and located in `src/lib/search.ts`:

**Key Features:**

- **Fuzzy search** across all content types
- **Weighted search** - titles weighted higher than subtitles
- **Real-time results** with debouncing
- **Category filtering** and smart suggestions

**Adding New Searchable Content:**

1. Update the `getAllSearchItems()` function
2. Add proper TypeScript types
3. Include relevant search fields (title, subtitle, section)
4. Test search functionality

### 🎨 UI Components

The project uses Radix UI primitives for accessibility:

**Available Components:**

- `Button` - Interactive buttons with variants
- `Card` - Content containers with glass effect
- `Badge` - Status indicators
- `NavigationMenu` - Main navigation
- `Sheet` - Mobile navigation drawer
- `Switch` - Toggle controls

**Adding New Components:**

1. Create in `src/components/ui/`
2. Follow Radix UI patterns
3. Add proper TypeScript types
4. Include accessibility features
5. Document usage examples

### 📱 Responsive Design

**Breakpoints:**

- **Mobile**: Default (< 640px)
- **Tablet**: `sm:` (640px+)
- **Desktop**: `md:` (768px+)
- **Large**: `lg:` (1024px+)

**Grid Systems:**

- **Restaurants**: `columns-1 sm:columns-2` for masonry layout
- **Hostels**: `grid sm:grid-cols-2` for card grid
- **Services**: `grid sm:grid-cols-2` for uniform cards

## 🛠️ Tools Section

The tools section contains both external web resources and internal applications built into the platform.

### **Adding Web Resources**

To add a new external web resource:

1. **Update `src/data/tools.json`**:

```json
{
  "web_resources": [
    {
      "name": "New Resource",
      "url": "https://example.com",
      "description": "Useful description for students"
    }
  ]
}
```

2. **Test the link** - Ensure it opens correctly and is useful for students
3. **Update search** - New resources will be automatically included in search

### **Adding Internal Tools**

To create a new internal tool:

1. **Create the tool page** in `src/app/tools/your-tool/`:

```typescript
// src/app/tools/your-tool/page.tsx
"use client";

export default function YourToolPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl">Your Tool Name</h1>
        <p className="text-muted-foreground">Tool description</p>
      </div>
      {/* Tool content */}
    </main>
  );
}
```

2. **Update `src/data/tools.json`**:

```json
{
  "internal_tools": [
    {
      "name": "Your Tool",
      "url": "/tools/your-tool",
      "description": "Brief description of what the tool does"
    }
  ]
}
```

3. **Follow component patterns** - Use existing UI components and styling patterns
4. **Test thoroughly** - Ensure the tool works on all devices

### **Example: Mail to Warden Tool**

The existing mail-to-warden tool demonstrates best practices:

- **Form handling** with React state
- **Data integration** with hostels.json
- **Mail generation** and opening mail clients
- **Responsive design** with Tailwind CSS
- **TypeScript types** for form data
- **Validation** and user feedback

## 🧪 Testing & Quality

### **Code Quality Checks**

```bash
# Run ESLint
bun run lint

# Type checking (automatic with TypeScript)
bun run build
```

### **Manual Testing Checklist**

- [ ] All pages load without errors
- [ ] Search functionality works across all categories
- [ ] Dark/light mode toggle works
- [ ] Mobile navigation functions properly
- [ ] vCard downloads work for all contact types
- [ ] Phone numbers are clickable and functional
- [ ] Responsive design works on different screen sizes
- [ ] Tools pages function correctly (especially forms)
- [ ] External links open in new tabs
- [ ] Internal navigation works smoothly

### **Performance Considerations**

- **Image optimization** - Use Next.js Image component
- **Code splitting** - Automatic with Next.js App Router
- **Bundle size** - Monitor with `bun run build`
- **Search performance** - Debounce search queries
- **Tool performance** - Optimize form handling and data processing

## 🔄 Pull Request Process

### **For Data Updates**

1. **Fork the repository**
2. **Create a branch** (optional for simple data updates)
3. **Edit the relevant JSON file** in `src/data/`
4. **Verify your changes** follow the data structure
5. **Create a Pull Request** with:
   - Clear title describing the change
   - Description of what was updated
   - Any verification steps taken

**Example PR Titles:**

- "Update Taco House phone number"
- "Add business hours for Kamath Cafe"
- "Update warden contact for Block 19"
- "Add new laundry service provider"

### **For Code Changes**

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following code guidelines
4. **Test thoroughly** using the manual testing checklist
5. **Run quality checks:**
   ```bash
   bun run lint
   bun run build
   ```
6. **Create a Pull Request** with:
   - Detailed description of changes
   - Screenshots if UI changes
   - Testing steps performed
   - Any breaking changes noted
   - **AI-assisted contributions**: If you used AI tools (Claude, GPT, etc.) to generate code, please include the prompt(s) used in your PR description to help maintainers understand the context and approach

### **PR Review Process**

**For Maintainers:**

- Review data accuracy and formatting
- Test functionality on different devices
- Check code quality and adherence to guidelines
- Verify no breaking changes
- Merge after approval

**For Contributors:**

- Respond to feedback promptly
- Make requested changes
- Test thoroughly before resubmitting
- Keep PRs focused and atomic

## 🐛 Issue Reporting

### **Data Issues**

- **Outdated information** - Report incorrect or old data
- **Missing information** - Point out gaps in current data
- **New services** - Suggest additions to the directory
- **Broken links** - Report non-functional URLs

### **Technical Issues**

- **App bugs** - Report functionality problems
- **UI issues** - Point out display or usability problems
- **Performance issues** - Report slow loading or responsiveness
- **Feature requests** - Suggest new functionality

### **Issue Template**

When creating an issue, please include:

1. **Type**: Data Issue / Bug Report / Feature Request
2. **Description**: Clear description of the problem
3. **Steps to reproduce** (for bugs)
4. **Expected behavior**
5. **Screenshots** (if applicable)
6. **Device/browser** information

## 📋 Data Guidelines

### ✅ What to Include

- **Accurate contact information** - Verify phone numbers before adding
- **Complete business details** - Hours, fees, addresses when available
- **Clear location descriptions** - Specific building names, landmarks
- **Current information** - Remove outdated or closed establishments
- **Consistent formatting** - Follow existing data structure patterns

### ❌ What to Avoid

- **Unverified information** - Don't add contacts you haven't confirmed
- **Personal phone numbers** - Only add official business contacts
- **Incomplete data** - Use "—" for unknown information, don't leave blank
- **Outdated information** - Remove closed businesses rather than leaving them
- **Inconsistent formatting** - Follow the established JSON structure

### 🔍 Verification Steps

Before submitting data updates:

1. **Call the number** to verify it's working
2. **Visit the location** to confirm addresses
3. **Check with multiple sources** for accuracy
4. **Update hours** by visiting during different times
5. **Confirm with staff** for official information
6. **Test the change** by running the app locally

## 🎯 Impact of Your Contribution

Your contributions directly help:

- **Freshmen** find their way around campus and access resources
- **Students** get food delivered quickly and contact services efficiently
- **Residents** contact their wardens easily with automated mail generation
- **Everyone** access emergency services when needed

**Every update makes the campus directory more useful for the MIT Manipal community!**

## 📞 Getting Help

- **GitHub Discussions** - Ask questions and share ideas
- **GitHub Issues** - Report bugs and request features
- **Code Review** - Learn from maintainer feedback
- **Community** - Connect with other contributors

---

**Thank you for helping keep MIT Manipal's campus directory accurate and useful! 🎓📚**

_This guide is maintained by the project contributors. If you find any issues or have suggestions for improvement, please open an issue or submit a pull request._
