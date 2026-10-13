import { type LocaleDefinition, type LocaleMessages } from "@/lib/i18n";

const messages = {
  "Select language": "ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ", English: "ಇಂಗ್ಲಿಷ್", Academics: "ಶೈಕ್ಷಣಿಕ", Restaurants: "ಉಪಾಹಾರಗೃಹಗಳು",
  Hostels: "ವಸತಿ ನಿಲಯಗಳು", Travel: "ಪ್ರಯಾಣ", Emergency: "ತುರ್ತು", "Campus Life": "ಕ್ಯಾಂಪಸ್ ಜೀವನ",
  Services: "ಸೇವೆಗಳು", Tools: "ಉಪಕರಣಗಳು", "Grievance Redressal": "ಕುಂದುಕೊರತೆ ನಿವಾರಣೆ", Favorites: "ಮೆಚ್ಚಿನವುಗಳು",
  More: "ಇನ್ನಷ್ಟು", Theme: "ಥೀಮ್", "Open search": "ಹುಡುಕಾಟ ತೆರೆಯಿರಿ", "Toggle theme": "ಥೀಮ್ ಬದಲಾಯಿಸಿ",
  "Toggle navigation menu": "ನ್ಯಾವಿಗೇಶನ್ ಮೆನು ಬದಲಾಯಿಸಿ", "Search anything…": "ಯಾವುದನ್ನಾದರೂ ಹುಡುಕಿ…", Search: "ಹುಡುಕಿ",
  "Search directory": "ಡೈರೆಕ್ಟರಿ ಹುಡುಕಿ", "Close search": "ಹುಡುಕಾಟ ಮುಚ್ಚಿ", "No results": "ಫಲಿತಾಂಶಗಳಿಲ್ಲ",
  "Save your contacts": "ನಿಮ್ಮ ಸಂಪರ್ಕಗಳನ್ನು ಉಳಿಸಿ", "Your saved items": "ನಿಮ್ಮ ಉಳಿಸಿದ ವಸ್ತುಗಳು", "MIT Manipal": "ಎಂಐಟಿ ಮಣಿಪಾಲ",
  Directory: "ಡೈರೆಕ್ಟರಿ", "Campus Directory": "ಕ್ಯಾಂಪಸ್ ಡೈರೆಕ್ಟರಿ", "Install Campus Directory": "ಕ್ಯಾಂಪಸ್ ಡೈರೆಕ್ಟರಿ ಸ್ಥಾಪಿಸಿ",
  "Dismiss install prompt": "ಸ್ಥಾಪನೆ ಸಂದೇಶ ಮುಚ್ಚಿ", "Install app": "ಅಪ್ಲಿಕೇಶನ್ ಸ್ಥಾಪಿಸಿ", "Not now": "ಈಗ ಬೇಡ",
  "Got it": "ಅರ್ಥವಾಯಿತು", "Add to Home Screen": "ಮುಖಪುಟಕ್ಕೆ ಸೇರಿಸಿ",
  "Found something wrong or missing? Help improve this directory by contributing at": "ಏನಾದರೂ ತಪ್ಪು ಅಥವಾ ಕಾಣೆಯಾಗಿದೆ? ಇಲ್ಲಿ ಕೊಡುಗೆ ನೀಡಿ ಈ ಡೈರೆಕ್ಟರಿಯನ್ನು ಉತ್ತಮಗೊಳಿಸಿ",
  Main: "ಮುಖ್ಯ", "Campus essentials, organized.": "ಕ್ಯಾಂಪಸ್ ಅಗತ್ಯಗಳು, ವ್ಯವಸ್ಥಿತ.",
  "Everything you need around MIT Manipal, in one place.": "ಎಂಐಟಿ ಮಣಿಪಾಲದ ಸುತ್ತ ನಿಮಗೆ ಬೇಕಾದ ಎಲ್ಲವೂ ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ.",
  "Quick access": "ತ್ವರಿತ ಪ್ರವೇಶ", "Browse campus": "ಕ್ಯಾಂಪಸ್ ವೀಕ್ಷಿಸಿ", "Open now": "ಈಗ ತೆರೆದಿದೆ", Closed: "ಮುಚ್ಚಿದೆ",
  "View all": "ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ", Contact: "ಸಂಪರ್ಕ", "Download contact": "ಸಂಪರ್ಕ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ",
  "Add to favorites": "ಮೆಚ್ಚಿನವುಗಳಿಗೆ ಸೇರಿಸಿ", "Remove from favorites": "ಮೆಚ್ಚಿನವುಗಳಿಂದ ತೆಗೆದುಹಾಕಿ",
  "No saved items yet": "ಇನ್ನೂ ಉಳಿಸಿದ ವಸ್ತುಗಳಿಲ್ಲ", "Emergency contacts": "ತುರ್ತು ಸಂಪರ್ಕಗಳು",
  "Restaurant directory": "ಉಪಾಹಾರಗೃಹ ಡೈರೆಕ್ಟರಿ", "Hostel directory": "ವಸತಿ ನಿಲಯ ಡೈರೆಕ್ಟರಿ",
  "Academic resources": "ಶೈಕ್ಷಣಿಕ ಸಂಪನ್ಮೂಲಗಳು", "Travel services": "ಪ್ರಯಾಣ ಸೇವೆಗಳು", "General services": "ಸಾಮಾನ್ಯ ಸೇವೆಗಳು",
  "Campus tools": "ಕ್ಯಾಂಪಸ್ ಉಪಕರಣಗಳು", "Mail to warden": "ವಾರ್ಡನ್‌ಗೆ ಇಮೇಲ್", "Send leave request": "ರಜೆ ವಿನಂತಿ ಕಳುಹಿಸಿ",
  Submit: "ಸಲ್ಲಿಸಿ", Cancel: "ರದ್ದುಮಾಡಿ", "Required field": "ಅಗತ್ಯ ಕ್ಷೇತ್ರ", "Loading…": "ಲೋಡ್ ಆಗುತ್ತಿದೆ…", "Try again": "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
} satisfies LocaleMessages;

export const kannadaLocale: LocaleDefinition = { code: "kn", label: "ಕನ್ನಡ", messages };
