/*
 * ─────────────────────────────────────────────────────────────
 *  EDIT THIS FILE to make the site yours.
 *  Everything on the page is generated from the data below.
 *  Replace the sample entries with your real involvements.
 * ─────────────────────────────────────────────────────────────
 *
 *  Fields for each involvement:
 *    org          Organization / club / team name
 *    role         Your title or position
 *    start, end   Display dates, e.g. "Sep 2023", "Present"
 *    category     One of: Leadership, Academic, Athletics, Service, Arts, Tech
 *    leader       true if this was a leadership position (counts in the stats)
 *    hours        Optional – service/volunteer hours (summed in the stats)
 *    summary      One or two sentences about what you did
 *    highlights   Bullet points: wins, results, things you built or led
 */

window.PROFILE = {
  name: "Your Name",
  tagline: "Student, builder, and community organizer",
  intro:
    "A record of the clubs, teams, and causes I've been part of from high school through college, what I did in each, and what I learned along the way.",
  college: "State University",
  major: "B.S. Computer Science",
  gradYear: "2027",
  highSchool: "Lincoln High School",
  hsGradYear: "2023",
  location: "Your City, ST",
  email: "you@example.com",
  links: [
    { label: "LinkedIn", url: "https://www.linkedin.com/" },
    { label: "GitHub", url: "https://github.com/" },
    { label: "Résumé (PDF)", url: "#" },
  ],
};

window.INVOLVEMENTS = {
  college: [
    {
      org: "Student Government Association",
      role: "Academic Affairs Senator",
      start: "Sep 2024",
      end: "Present",
      category: "Leadership",
      leader: true,
      summary:
        "Represent 2,400 engineering students on the senate and chair the academic affairs committee.",
      highlights: [
        "Led a campaign that extended library hours to 24/7 during finals",
        "Wrote and passed a resolution funding free printing for first-years",
        "Run monthly open forums between students and department chairs",
      ],
    },
    {
      org: "Association for Computing Machinery (ACM)",
      role: "Vice President",
      start: "Jan 2024",
      end: "Present",
      category: "Tech",
      leader: true,
      summary:
        "Help run the largest tech club on campus: weekly workshops, interview prep, and industry talks.",
      highlights: [
        "Grew weekly workshop attendance from 25 to 90+",
        "Organized a 300-person, 24-hour hackathon with $8K in sponsorships",
        "Started a mock-interview program pairing juniors with alumni",
      ],
    },
    {
      org: "Campus Peer Tutoring Center",
      role: "Calculus & Intro CS Tutor",
      start: "Sep 2023",
      end: "Present",
      category: "Academic",
      leader: false,
      hours: 180,
      summary:
        "Hold drop-in and one-on-one sessions for students in Calculus I–II and Intro to Programming.",
      highlights: [
        "Tutored 150+ students across four semesters",
        "Built a practice-problem bank now used by all CS tutors",
      ],
    },
    {
      org: "Habitat for Humanity – Campus Chapter",
      role: "Build Team Volunteer",
      start: "Oct 2023",
      end: "Present",
      category: "Service",
      leader: false,
      hours: 120,
      summary: "Volunteer on weekend home builds and the annual spring-break build trip.",
      highlights: [
        "Helped complete three homes for local families",
        "Coordinated carpools and tools for a 20-person build day",
      ],
    },
    {
      org: "Intramural Soccer",
      role: "Team Captain",
      start: "Sep 2023",
      end: "Present",
      category: "Athletics",
      leader: true,
      summary: "Captain a co-ed intramural team that plays fall and spring seasons.",
      highlights: ["League champions, Spring 2025", "Recruited and organized a 16-player roster"],
    },
  ],

  highSchool: [
    {
      org: "FIRST Robotics Team",
      role: "Team Captain & Lead Programmer",
      start: "Sep 2020",
      end: "May 2023",
      category: "Tech",
      leader: true,
      summary:
        "Led a 30-member team designing, building, and programming a competition robot each season.",
      highlights: [
        "Regional finalists two years in a row",
        "Wrote the autonomous routine that scored our highest-ever match",
        "Mentored middle-school students at a summer robotics camp",
      ],
    },
    {
      org: "National Honor Society",
      role: "Chapter President",
      start: "Sep 2021",
      end: "May 2023",
      category: "Leadership",
      leader: true,
      hours: 90,
      summary: "Ran meetings, service projects, and the peer tutoring program for 85 members.",
      highlights: [
        "Organized a school-wide food drive that collected 4,000 lbs",
        "Launched free after-school homework help for underclassmen",
      ],
    },
    {
      org: "Varsity Tennis",
      role: "Varsity Player",
      start: "Mar 2020",
      end: "May 2023",
      category: "Athletics",
      leader: false,
      summary: "Four-year member, playing first doubles my junior and senior years.",
      highlights: ["All-Conference Second Team, 2022", "Team Sportsmanship Award, 2023"],
    },
    {
      org: "Model United Nations",
      role: "Delegate",
      start: "Sep 2020",
      end: "May 2022",
      category: "Academic",
      leader: false,
      summary: "Represented assigned countries at regional and state conferences.",
      highlights: ["Best Delegate, State MUN Conference 2022", "Honorable Mention, Regional MUN 2021"],
    },
    {
      org: "Jazz Band",
      role: "Alto Saxophone",
      start: "Sep 2019",
      end: "May 2021",
      category: "Arts",
      leader: false,
      summary: "Performed at school concerts, community events, and the district jazz festival.",
      highlights: ["Superior rating at District Jazz Festival 2021"],
    },
    {
      org: "Local Public Library",
      role: "Teen Volunteer",
      start: "Jun 2019",
      end: "Aug 2022",
      category: "Service",
      leader: false,
      hours: 140,
      summary: "Helped run the summer reading program and taught weekly basic-computer classes for seniors.",
      highlights: ["Taught 40+ seniors to use email and video calls"],
    },
  ],
};
