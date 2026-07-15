# MIT Manipal Directory

Campus directory for MIT Manipal students. Look up restaurants, hostels, travel, services, academics, grievance contacts, and emergency numbers.

Live at https://cd.coolstuff.work

## What's in it

| Section | What you get |
|---|---|
| Restaurants | 12+ listings with phone numbers, delivery fees, packaging costs, and live open/closed status. Taco House, Hungry House, Hit&Run, and more. |
| Hostels | Every block (4, 7, 8, 9, 10, 14, 15, 17, 18, 19, 20, 21, 22) with warden names, designations, office phones, mobiles, emails, and reception contacts. |
| Travel | Auto rickshaw contacts for Gate 2 and Gate 4, individual drivers, cab services (Manipal Khaas, Manipal Cabs, Sashikant Taxi), airport pricing tables. |
| Services | Laundry (Dhobimate) and xerox/printing (Om Xerox, Print Shop, Pratham Xerox, FC2 Xerox) with phone numbers and locations. |
| Academics | Links to SLCM (new + legacy), library question papers, EBSCO, Lighthouse, Impartus, Brightspace Pulse, Manipal PURE, Microsoft 365. |
| Grievance Redressal | Who to contact for what — emails and phones for hostel, welfare, academics, finance, IT, admissions, placement, research, and more (from MIT administration). Student Council listed separately. MIT Manipal only. |
| Emergency | Campus numbers (Student Clinic, KMC Ambulance, MAHE Control Room, Campus Patrol, Fire), local police, national helplines (100, 101, 102, 112), suicide prevention (Aasra, Spandana). |
| Search | Cmd+K / Ctrl+K fuzzy search across every contact, restaurant, warden, service, and page. Results link directly to the relevant card. |
| Favorites | Save any contact locally. Download vCards for any listing. |

Dark/light mode included.

## Running locally

```bash
git clone https://github.com/aaditagrawal/campus-dir.git
cd campus-dir
bun install
bun dev
```

Open http://localhost:3000.

## Project structure

```
src/
  app/           Page routes (academics, restaurants, hostels, travel, services, emergency, grievance, tools, favorites)
  components/    UI components (site-header, favorite-button, shadcn/ui primitives)
  data/          JSON files with all the directory content
  lib/           Utilities (search indexing, vCard generation, slugify)
  hooks/         React hooks (favorites)
```

All directory content lives in `src/data/*.json`. To update a phone number, restaurant, or warden, edit the relevant JSON file.

## Tech

Next.js 15 (App Router, static export), React 19, TypeScript, Tailwind CSS 4, Radix UI, Fuse.js for search.

## Contributing

Edit the JSON data files to fix outdated info or add new entries. For code changes, open a PR.

## License

MIT
