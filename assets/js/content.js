/*
 * ---------------------------------------------------------------------------
 *  content.js: the one file to edit.
 *
 *  Every piece of text, every link and every skill on the site lives here.
 *  index.html also carries a pre-rendered copy of the same text so the page
 *  reads instantly (and without JavaScript). When the page loads, the values
 *  below replace that copy, so this file always wins.
 *
 *  Rules of thumb
 *  - Keep facts real. Placeholders are written in [square brackets].
 *  - Paths such as "assets/logos/deca.png" are relative to the site root.
 *  - After editing, refresh the page. There is no build step.
 * ---------------------------------------------------------------------------
 */

export const profile = {
  name: "Nikhil Sannidhi",
  // The one-line pitch under your name.
  target: "Data science & machine learning, with a finance edge.",
  school: "BBA '30 · Gies College of Business, UIUC",
  degree: "BBA, Business Undeclared · 2026–2030",
  hometown: "Frisco, TX",
  campus: "Champaign, IL",
  // Your LinkedIn About text (shown in Fig. 2).
  about:
    "I am a freshman in the Gies College of Business at the University of Illinois Urbana-Champaign with interests in finance, consulting, and data-driven business strategy. I am especially interested in understanding how businesses make decisions, evaluate opportunities, and use data to solve complex problems. I hope to continue exploring careers in consulting and investment management.",
  // The rotating line in Fig. 2: "I'm interested in how businesses ___."
  interestedIn: [
    "make decisions",
    "evaluate opportunities",
    "use data to solve complex problems",
  ],
  interests: ["Data Science", "Machine Learning", "Finance", "Consulting", "Investment Management"],
};

export const links = {
  emailSchool: "nikhil21@illinois.edu",
  emailPersonal: "nikhilsannidhi11@gmail.com",
  linkedin: "https://www.linkedin.com/in/nikhilsannidhi/",
  github: "https://github.com/Nikhil-Sannidhi",
  source: "https://github.com/Nikhil-Sannidhi/project-profile",
  // Replace this PDF with your real résumé (keep the same file name).
  resume: "assets/Nikhil-Sannidhi-Resume.pdf",
};

// Words that scroll past between the hero and Fig. 2.
export const marquee = [
  "Data Science", "Machine Learning", "Monte Carlo", "Regression", "Clustering",
  "Finance", "Consulting", "Investment Management", "Python",
];

// Summary statistics (Table 1 in Fig. 2). Real counts only.
export const stats = [
  { value: 3, label: "College roles" },
  { value: 5, label: "High-school organizations" },
  { value: 2, label: "States" },
  { value: 2030, label: "Class of" },
];

// The five "iterations" of Fig. 3, in order. The first is in Frisco,
// the rest in Champaign. Leave pill empty to hide it.
export const journey = [
  { title: "Independence High School", sub: "Frisco ISD · Frisco, TX", pill: "2022–2026",
    logo: "assets/logos/independence-hs.png", chip: "white" },
  { title: "Gies College of Business", sub: "BBA, Business Undeclared · UIUC", pill: "2026–2030",
    logo: "assets/logos/illinois.png", chip: "white" },
  { title: "Consultant, EntreCORPS", sub: "Consulting for Startups", pill: "Sep 2026–",
    logo: "assets/logos/entrecorps.png", chip: "navy" },
  { title: "Consultant, SCNO", sub: "Consulting for Nonprofit Organizations", pill: "Sep 2026–",
    logo: "assets/logos/scno.png", chip: "white" },
  { title: "Gies Ambassador", sub: "Tours, panels and recruitment events", pill: "",
    logo: "assets/logos/gies.png", chip: "white" },
];

/*
 * College experience (Fig. 4). Each case runs a small model:
 *   model: "logistic" | "kmeans" | "network"
 * Fill in the case-study pages in /work/*.html when you have details.
 */
export const experience = [
  {
    id: "entrecorps",
    role: "Consultant",
    org: "EntreCORPS | Consulting for Startups",
    short: "EntreCORPS",
    dates: "Sep 2026 – Present",
    place: "Champaign, IL · On-site",
    logo: "assets/logos/entrecorps.png",
    logoChip: "navy", // the logo sits on its own navy panel
    blurb:
      "A student-run, pro bono growth and innovation consulting firm at Gies, part of the Origin Ventures Academy for Entrepreneurial Leadership. It advises startups and early-stage ventures.",
    url: "https://giesgroups.illinois.edu/entrecorps/home/",
    caseStudy: "work/entrecorps.html",
    model: "logistic",
    modelName: "Logistic growth fit",
    modelNote: "Startups live on S-curves: slow adoption, take-off, saturation.",
  },
  {
    id: "scno",
    role: "Consultant",
    org: "Illinois Students Consulting for Nonprofit Organizations",
    short: "SCNO",
    dates: "Sep 2026 – Present",
    place: "Champaign, IL · On-site",
    logo: "assets/logos/scno.png",
    logoChip: "white",
    blurb:
      "A student-led organization providing free consulting to nonprofits in Champaign-Urbana and beyond.",
    url: "https://giesgroups.illinois.edu/SCNO/club_signup",
    caseStudy: "work/scno.html",
    model: "kmeans",
    modelName: "k-means clustering",
    modelNote: "Different groups need different strategies. Clustering finds the groups.",
  },
  {
    id: "gies-ambassador",
    role: "Gies Ambassador",
    org: "Gies College of Business",
    short: "Gies Ambassador",
    dates: "", // add dates if you want them shown
    place: "Champaign, IL",
    logo: "assets/logos/gies.png",
    logoChip: "white",
    blurb:
      "Ambassadors represent Gies to prospective and admitted students and families through meetings, tours, student panels and recruitment events.",
    url: "https://giesbusiness.illinois.edu",
    caseStudy: "work/gies-ambassador.html",
    model: "network",
    modelName: "Force-directed network",
    modelNote: "One conversation at a time, people connect.",
  },
];

/*
 * Toolkit (Fig. 5). A tiny neural network is trained in the browser to map
 * each skill (input) to the goals (outputs) using the relevance weights
 * below (0 = unrelated, 1 = central). Add, remove or rename freely.
 *
 * editable: true marks skills that are placeholders. LinkedIn lists 16
 * skills; only Leadership and Microsoft Office are confirmed so far, and
 * Python is in progress. Swap the placeholders for your real skills.
 */
export const goals = [
  { id: "ds", name: "Data Science" },
  { id: "ml", name: "Machine Learning" },
  { id: "fin", name: "Finance" },
  { id: "con", name: "Consulting" },
];

export const skills = [
  { name: "Python (learning)", short: "Python (learning)", editable: false,
    note: "Learning in public: see the python-practice repo on GitHub.",
    relevance: { ds: 0.95, ml: 0.9, fin: 0.45, con: 0.3 } },
  { name: "Excel / Microsoft Office", short: "Excel / Office", editable: false,
    note: "Listed on LinkedIn. The everyday language of finance and consulting.",
    relevance: { ds: 0.45, ml: 0.1, fin: 0.9, con: 0.85 } },
  { name: "Data Analysis", short: "Data Analysis", editable: true,
    note: "[Editable: add a course or project where you analyzed data.]",
    relevance: { ds: 0.9, ml: 0.65, fin: 0.7, con: 0.6 } },
  { name: "Research", short: "Research", editable: true,
    note: "[Editable: add an example of research you have done.]",
    relevance: { ds: 0.6, ml: 0.55, fin: 0.6, con: 0.75 } },
  { name: "Leadership", short: "Leadership", editable: false,
    note: "Listed on LinkedIn. Built across DECA, BPA, Key Club, NHS and tennis.",
    relevance: { ds: 0.2, ml: 0.1, fin: 0.45, con: 0.9 } },
  { name: "Communication", short: "Communication", editable: true,
    note: "[Editable: add an example, e.g. presenting to a client or panel.]",
    relevance: { ds: 0.35, ml: 0.2, fin: 0.5, con: 0.95 } },
];

/*
 * High school (Fig. 6): Independence High School, Frisco ISD, 2022–2026.
 * "split" is the question on the branch; each leaf links to the org.
 */
export const highSchool = {
  name: "Independence High School",
  district: "Frisco ISD",
  years: "2022–2026",
  url: "https://www.friscoisd.org/o/ihs",
  logo: "assets/logos/independence-hs.png",
  splits: [
    { question: "business?", leaves: [
      { name: "DECA", note: "Business & entrepreneurship", logo: "assets/logos/deca.png", url: "https://www.deca.org" },
      { name: "BPA", note: "Business Professionals of America", logo: "assets/logos/bpa.png", url: "https://bpa.org" },
    ] },
    { question: "service?", leaves: [
      { name: "Key Club", note: "Student-led service", logo: "assets/logos/keyclub.png", url: "https://www.keyclub.org" },
      { name: "National Honor Society", note: "Scholarship, service, leadership", logo: "assets/logos/nhs.png", url: "https://www.nationalhonorsociety.org" },
    ] },
    { question: "athletics?", leaves: [
      { name: "Varsity Tennis", note: "Independence Knights", logo: "assets/logos/independence-hs.png", url: "https://www.friscoisd.org/o/ihs" },
    ] },
  ],
};
