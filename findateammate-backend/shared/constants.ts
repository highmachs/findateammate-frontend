/**
 * Predefined departments and skills for FindATeammate
 * Used for validation and dropdown options
 */

export const DEPARTMENTS = [
  "OTHER",
  "CYBER",
  "CSE",
  "CCE",
  "ECE",
  "CIVIL",
  "EEE",
  "MECHANICAL",
  "MECH AND AUTO",
  "EIE",
  "EICE",
  "IT",
  "AIDS",
  "AIML",
  "IOT",
  "MBA",
  "MECHATRONICS",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

// Tamil Nadu Colleges/Universities List (Anna University Affiliated + Autonomous)
export const COLLEGES = [
  // Sairam Group
  "SAIRAM ENGINEERING COLLEGE",
  "SAIRAM INSTITUTE OF TECHNOLOGY",
  
  // Chennai - Top Tier
  "ANNA UNIVERSITY",
  "COLLEGE OF ENGINEERING GUINDY",
  "MIT CAMPUS - ANNA UNIVERSITY",
  "MADRAS INSTITUTE OF TECHNOLOGY",
  "SSN COLLEGE OF ENGINEERING",
  "SRM INSTITUTE OF SCIENCE AND TECHNOLOGY",
  "VIT CHENNAI",
  "SAVEETHA ENGINEERING COLLEGE",
  "RAJALAKSHMI ENGINEERING COLLEGE",
  "ST. JOSEPH'S COLLEGE OF ENGINEERING",
  "VELAMMAL ENGINEERING COLLEGE",
  "R.M.K. ENGINEERING COLLEGE",
  "R.M.D. ENGINEERING COLLEGE",
  "EASWARI ENGINEERING COLLEGE",
  "SRI SIVASUBRAMANIYA NADAR COLLEGE OF ENGINEERING",
  "PANIMALAR ENGINEERING COLLEGE",
  "SRI SAIRAM INSTITUTE OF MANAGEMENT STUDIES",
  
  // Coimbatore
  "PSG COLLEGE OF TECHNOLOGY",
  "COIMBATORE INSTITUTE OF TECHNOLOGY",
  "KUMARAGURU COLLEGE OF TECHNOLOGY",
  "AMRITA VISHWA VIDYAPEETHAM - COIMBATORE",
  "KARUNYA INSTITUTE OF TECHNOLOGY AND SCIENCES",
  "SNS COLLEGE OF TECHNOLOGY",
  "KGISL INSTITUTE OF TECHNOLOGY",
  
  // Vellore & Katpadi
  "VIT VELLORE",
  "VIT UNIVERSITY",
  
  // Trichy
  "NIT TIRUCHIRAPPALLI",
  "NATIONAL INSTITUTE OF TECHNOLOGY TRICHY",
  "BHARATHIDASAN INSTITUTE OF TECHNOLOGY",
  "K.L.N. COLLEGE OF ENGINEERING",
  
  // Thanjavur
  "SASTRA DEEMED UNIVERSITY",
  "MIT ANNA UNIVERSITY - THANJAVUR",
  
  // Madurai
  "THIAGARAJAR COLLEGE OF ENGINEERING",
  "PSG INSTITUTE OF TECHNOLOGY AND APPLIED RESEARCH",
  "MEPCO SCHLENK ENGINEERING COLLEGE",
  
  // Salem
  "SONA COLLEGE OF TECHNOLOGY",
  "BANNARI AMMAN INSTITUTE OF TECHNOLOGY",
  
  // Kanchipuram & Surrounding
  "SRI VENKATESWARA COLLEGE OF ENGINEERING",
  "AARUPADAI VEEDU INSTITUTE OF TECHNOLOGY",
  "MEENAKSHI SUNDARARAJAN ENGINEERING COLLEGE",
  "MEENAKSHI COLLEGE OF ENGINEERING",
  
  // Erode
  "KONGU ENGINEERING COLLEGE",
  "BANNARI AMMAN INSTITUTE OF TECHNOLOGY",
  
  // Other Notable
  "HINDUSTAN INSTITUTE OF TECHNOLOGY AND SCIENCE",
  "SRM INSTITUTE OF SCIENCE AND TECHNOLOGY - RAMAPURAM",
  "JEPPIAAR ENGINEERING COLLEGE",
  "VEL TECH RANGARAJAN DR. SAGUNTHALA R&D INSTITUTE",
  "SRI KRISHNA COLLEGE OF ENGINEERING AND TECHNOLOGY",
  "ADHIYAMAAN COLLEGE OF ENGINEERING",
  "VALLIAMMAI ENGINEERING COLLEGE",
  "KINGS ENGINEERING COLLEGE",
  
  // Management Institutes
  "GREAT LAKES INSTITUTE OF MANAGEMENT",
  "LOYOLA INSTITUTE OF BUSINESS ADMINISTRATION",
  "SRM INSTITUTE OF HOTEL MANAGEMENT",
  
  // Other (catch-all for unlisted)
  "OTHER",
] as const;

export type College = (typeof COLLEGES)[number];

export const SKILLS = [
  // Programming Languages
  "Python",
  "C",
  "C++",
  "Java",
  "JavaScript",
  "TypeScript",
  "Go (Golang)",
  "Rust",
  "Swift",
  "Kotlin",
  "Scala",
  "R Programming",
  "MATLAB",
  "Julia",
  "Haskell",

  // Web Technologies
  "HTML",
  "CSS",
  "React",
  "Angular",
  "Vue.js",
  "Node.js",
  "Express.js",
  "REST API",
  "GraphQL",

  // Backend Frameworks
  "Django",
  "Flask",
  "Spring Boot",
  ".NET",

  // Databases
  "SQL",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Oracle Database",
  "Firebase",

  // DevOps & Infrastructure
  "Git",
  "GitHub",
  "GitLab",
  "Docker",
  "Kubernetes",
  "Linux",
  "Bash Scripting",
  "PowerShell",
  "Cloud Computing",
  "AWS",
  "Microsoft Azure",
  "Google Cloud",
  "DevOps",
  "CI/CD",
  "Jenkins",
  "Terraform",
  "Ansible",

  // System & Architecture
  "Microservices",
  "System Design",
  "Data Structures",
  "Algorithms",
  "Object-Oriented Programming",
  "Functional Programming",
  "Networking",
  "Operating Systems",

  // AI & Machine Learning
  "Machine Learning",
  "Deep Learning",
  "Artificial Intelligence",
  "Natural Language Processing",
  "Computer Vision",
  "TensorFlow",
  "PyTorch",
  "Scikit-learn",
  "Pandas",
  "NumPy",
  "MLOps",

  // Data & Analytics
  "Data Science",
  "Data Analysis",
  "Tableau",
  "Power BI",
  "Statistics",
  "Big Data",
  "Hadoop",
  "Spark",
  "Kafka",

  // Cybersecurity
  "Cybersecurity",
  "Ethical Hacking",
  "Penetration Testing",
  "Network Security",
  "Cryptography",
  "Digital Forensics",
  "Reverse Engineering",
  "Malware Analysis",
  "Vulnerability Assessment",
  "Risk Management",
  "SIEM",
  "Splunk",
  "Threat Hunting",
  "Cloud Security",
  "DevSecOps",
  "OSINT",

  // Blockchain & Web3
  "Blockchain",
  "Smart Contracts",
  "Solidity",
  "Web3",

  // IoT & Embedded
  "IoT",
  "Embedded Systems",
  "Robotics",
  "Automation",
  "CUDA",
  "FPGA Development",
  "Signal Processing",
  "OpenCL",

  // Testing & QA
  "Testing",
  "Unit Testing",
  "API Testing",
  "Selenium",

  // Mobile Development
  "Mobile App Development",
  "Android Development",
  "iOS Development",
  "Flutter",
  "React Native",

  // Design & Creative
  "UI/UX Design",
  "Figma",
  "Adobe XD",
  "3D Modelling",
  "Blender",
  "AR/VR",
  "Poster Making",
  "Graphic Design",
  "Adobe Photoshop",
  "Adobe Illustrator",
  "Canva",
  "Video Editing",
  "Adobe Premiere Pro",
  "After Effects",
  "Animation",

  // Game Development
  "Game Development",
  "Unity",
  "Unreal Engine",

  // CAD & Engineering Design
  "AutoCAD",
  "SolidWorks",
  "CATIA",

  // Content & Marketing
  "Content Writing",
  "Technical Writing",
  "Copywriting",
  "Digital Marketing",
  "SEO",
  "Social Media Marketing",
  "Email Marketing",
  "Photography",
  "Videography",

  // Business & Management
  "Project Management",
  "Product Management",
  "Fintech",
  "Agile",
  "Scrum",
  "Leadership",
  "Team Management",
  "Business Analysis",
  "Public Speaking",
  "Presentation Skills",
  "Research",
  "Microsoft Excel",
  "Microsoft Office",
  "Event Management",
] as const;

export type Skill = (typeof SKILLS)[number];

/**
 * Validate if a department is in the whitelist
 */
export function isValidDepartment(dept: unknown): dept is Department {
  return typeof dept === "string" && DEPARTMENTS.includes(dept as Department);
}

/**
 * Validate if a skill is in the whitelist
 */
export function isValidSkill(skill: unknown): skill is Skill {
  return typeof skill === "string" && SKILLS.includes(skill as Skill);
}

/**
 * Filter array to only include valid skills
 */
export function filterValidSkills(skills: unknown[]): Skill[] {
  return Array.isArray(skills)
    ? skills.filter(isValidSkill)
    : [];
}

/**
 * Filter array to only include valid interests
 * (same as skills - users can choose interests from skills list)
 */
export function filterValidInterests(interests: unknown[]): Skill[] {
  return filterValidSkills(interests);
}

/**
 * Get a skill suggestion based on partial input (case-insensitive)
 * Useful for migration of existing skills
 */
export function findClosestSkillMatch(input: string): Skill | null {
  if (!input || typeof input !== "string") return null;

  const normalized = input.toLowerCase().trim();

  // Exact match (case-insensitive)
  const exact = SKILLS.find((s) => s.toLowerCase() === normalized);
  if (exact) return exact;

  // Partial match - word boundary match
  const partial = SKILLS.find((s) =>
    s.toLowerCase().includes(normalized)
  );
  if (partial) return partial;

  // Fallback: first character match
  const firstChar = SKILLS.find((s) =>
    s.toLowerCase().startsWith(normalized.charAt(0))
  );
  if (firstChar) return firstChar;

  return null;
}
