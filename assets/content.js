/*
 * ─────────────────────────────────────────────────────────────
 *  EDIT THIS FILE to update the site.
 *  Everything on the page is generated from the data below.
 * ─────────────────────────────────────────────────────────────
 *
 *  Fields for each involvement:
 *    org          Organization / club / team name
 *    role         Your title or position
 *    start, end   Optional display dates, e.g. "Sep 2024", "Present"
 *                 (adding dates turns on the Timeline section)
 *    category     Consulting, Outreach, Leadership, Academic, Athletics, Service, Arts, Tech
 *    leader       true if this was a leadership position (counts in the stats)
 *    hours        Optional – service/volunteer hours (summed in the stats)
 *    summary      One or two sentences about what you did
 *    highlights   Bullet points – replace with your own projects, clients and results
 *
 *  Empty sections (e.g. highSchool: []) and empty contact details are hidden.
 */

window.PROFILE = {
  name: "Nikhil Sannidhi",
  tagline: "Student consultant at the University of Illinois Urbana-Champaign",
  intro:
    "I'm a student at the University of Illinois Urbana-Champaign. Outside the classroom I do pro bono consulting for startups and nonprofits and represent the Gies College of Business to prospective students and families.",
  college: "University of Illinois Urbana-Champaign",
  major: "",          // e.g. "B.S. Finance"
  gradYear: "",       // e.g. "2028"
  collegeStartYear: "", // e.g. "2024"
  highSchool: "",
  hsGradYear: "",
  location: "Urbana-Champaign, IL",
  email: "",          // e.g. "nikhil@example.com"
  links: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/nikhilsannidhi/" },
    // { label: "Résumé (PDF)", url: "resume.pdf" },
  ],
};

window.INVOLVEMENTS = {
  college: [
    {
      org: "EntreCorps",
      role: "Consultant",
      category: "Consulting",
      leader: false,
      summary:
        "Student-run, pro bono growth and innovation consulting firm at Gies, part of the Origin Ventures Academy for Entrepreneurial Leadership, advising startups and early-stage ventures.",
      highlights: [
        "Work on client projects with startups and early-stage ventures",
        "Help with growth strategy, market research, and innovation problems",
      ],
    },
    {
      org: "Students Consulting for Non-Profit Organizations (SCNO)",
      role: "Consultant",
      category: "Consulting",
      leader: false,
      summary:
        "Student-led consulting organization that provides free consulting services to nonprofits in Champaign-Urbana and beyond.",
      highlights: [
        "Work on pro bono consulting engagements for nonprofit clients",
        "Turn research and analysis into recommendations clients can act on",
      ],
    },
    {
      org: "Gies College of Business",
      role: "Gies Ambassador",
      category: "Outreach",
      leader: false,
      summary:
        "Represent the Gies College of Business to prospective and admitted students and their families.",
      highlights: [
        "Meet with prospective and admitted students and families",
        "Lead tours and serve on student panels",
        "Support Gies recruitment and admissions events",
      ],
    },
  ],

  // Add high school involvements here – the section appears automatically.
  highSchool: [],
};
