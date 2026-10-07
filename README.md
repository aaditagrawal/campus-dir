# MIT Manipal Directory

Campus directory for MIT Manipal students. Look up restaurants, hostels, travel, services, academics, grievance contacts, and emergency numbers.

Live at https://cd.coolstuff.work

## What's in it

| Section             | What you get                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Restaurants         | 12+ listings with phone numbers, delivery fees, packaging costs, and live open/closed status. Taco House, Hungry House, Hit&Run, and more.                                                                         |
| Hostels             | Every block (4, 7, 8, 9, 10, 14, 15, 17, 18, 19, 20, 21, 22) with warden names, designations, office phones, mobiles, emails, and reception contacts.                                                              |
| Travel              | Auto rickshaw contacts for Gate 2 and Gate 4, individual drivers, cab services (Manipal Khaas, Manipal Cabs, Sashikant Taxi), airport pricing tables.                                                              |
| Services            | Laundry (Dhobimate) and xerox/printing (Om Xerox, Print Shop, Pratham Xerox, FC2 Xerox) with phone numbers and locations.                                                                                          |
| Academics           | Links to SLCM (new + legacy), library question papers, EBSCO, Lighthouse, Impartus, Brightspace Pulse, Manipal PURE, Microsoft 365.                                                                                |
| Grievance Redressal | Who to contact for what - emails and phones for hostel, welfare, academics, finance, IT, admissions, placement, research, and more (from MIT administration). Student Council listed separately. MIT Manipal only. |
| Emergency           | Campus numbers (Student Clinic, KMC Ambulance, MAHE Control Room, Campus Patrol, Fire), local police, national helplines (100, 101, 102, 112), suicide prevention (Aasra, Spandana).                               |
| Search              | Cmd+K / Ctrl+K fuzzy search across every contact, restaurant, warden, service, and page. Results link directly to the relevant card.                                                                               |
| Favorites           | Save any contact locally. Download vCards for any listing.                                                                                                                                                         |

Dark/light mode included.

Campus Life links to official club and project directories, counselling and routine
healthcare, sports, peer support, makerspaces, startup support, safety committees,
events, and hostel information. Academics also includes the unified MIT library
portal, SSO access instructions, official question papers, forms, dated regulations,
scholarships, and study abroad guidance.

New official resource cards show their source, campus, and the date the source was
checked. This date records a website check, not a phone call or an in-person check.
Calendar, curriculum, and scholarship entries state the year or scheme they apply
to. Confirm current schedules and fees with the responsible office.

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
  components/    UI components (site-header, favorite-button, StyleX-based primitives)
  data/          JSON files with all the directory content
  lib/           Utilities (search indexing, vCard generation, slugify)
  hooks/         React hooks (favorites)
```

All directory content lives in `src/data/*.json`. To update a phone number, restaurant, or warden, edit the relevant JSON file.

Academic and Campus Life resources share the `ResourceSection` type in
`src/lib/resources.ts`. Add a resource to `academics.json` or `campus-life.json` to
include it in the page and global search. For official additions, include `source`,
`checkedOn` in `YYYY-MM-DD` format, and `campus`. Use `appliesTo` for year or
curriculum restrictions, `steps` for short instructions, and `keywords` for names
students may search for. Keep source descriptions brief and write instructions in
your own words. Do not publish shared login credentials; link to the official SSO
instructions instead.

## Tech

Next.js 16 (App Router, static export), React 19, TypeScript, StyleX, Radix UI, and MiniSearch.

## Contributing

Edit the JSON data files to fix outdated info or add new entries. For code changes, open a PR.

## License

MIT
