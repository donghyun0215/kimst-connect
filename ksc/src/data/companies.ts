export interface Company {
  slug: string;
  name: string;
  displayName: string;
  tagline: string;
  sector: string;
  stage: string;
  track: "track1" | "track2";
  website: string;
  email: string;
  phone: string;
  problem: string[];
  solution: string[];
  keyFeatures: string[];
  targetAudience: string[];
  businessModel: string[];
  businessSnapshot: string[];
  team: { name: string; role: string; bio: string[] }[];
  seekingOpportunities: string[];
}

export const TRACKS = {
  track1: {
    title: "Track 1: Green Advanced Maritime Track",
    theme: "AI-Powered Innovations in Maritime Engineering and Logistics",
    dates: "26 August – 4 September 2026",
  },
  track2: {
    title: "Track 2: Smart Blue Food Track",
    theme: "FoodTech Innovations for Sustainable Food Futures",
    dates: "1 – 9 September 2026",
  },
} as const;

export const companies: Company[] = [
  {
    slug: "cutshion",
    name: "Cutshion",
    displayName: "Cutshion",
    tagline:
      "Physical AI company enabling different robot brands to develop, deploy and operate through a unified platform, Pionoid",
    sector: "Robotics & AI Vision",
    stage: "Seed",
    track: "track1",
    website: "https://cutshion.com/",
    email: "cutshion@cutshion.com",
    phone: "+82 70-8959-2960",
    problem: [
      "Fragmented robot systems require repeated development, increasing deployment time and cost",
      "Lack of scalability creates a major bottleneck to market growth, limiting commercialization and widespread adoption of robotics",
    ],
    solution: [
      "Factory for developers: Web framework & SDKs, virtual simulation, unified API library",
      "Store for robot users: App distribution, license management, OTA updates",
    ],
    keyFeatures: [
      "Reuse the developed application and deploy it across different robot brands and models",
      "Connect and manage robots, equipment and applications through one platform",
    ],
    targetAudience: [
      "Companies seeking to adopt robotic automation, robot developers, and robot operators",
    ],
    businessModel: [
      "Pionoid Factory: Subscription and licensing revenue from robot application development tools",
      "Pionoid Store: Commission revenue from robot application sales and transactions",
    ],
    businessSnapshot: [
      "2025 investment from Evergreen Partners & CNT Tech, post-money valuation at KRW 5.5B (USD 3.89M); 93% YoY revenue growth as of January 2026",
      "Commercial deployment with one of Korea's largest coffee chains (Mega Coffee): signed annual supply contract for 100 units",
      "Developed and supplied a mobile welding robot in collaboration with HD Hyundai Heavy Industries",
      "US entity establishment in 2026",
    ],
    team: [
      {
        name: "Minseok LEE",
        role: "Founder & CEO",
        bio: ["Former VP, FutureRobot", "25 years of experience in tech & robotics", "Masters in Computer Science, Seoul National University"],
      },
      {
        name: "Shinhui MO",
        role: "COO",
        bio: ["10 years in IT venture management", "Ph.D.(ABD) in Architecture, Chosun University"],
      },
      {
        name: "Sangjo KIM",
        role: "CTO",
        bio: ["Former Senior Manager, LG Electronics R&D Center", "32 years of experience in robotics", "B.A. in Mechanical Design, Hanyang University"],
      },
    ],
    seekingOpportunities: ["Robot OEM/integrator partnerships, industrial robot deployment pilots"],
  },
  {
    slug: "doublt",
    name: "DoubleT",
    displayName: "DoubleT (HAIMDALL)",
    tagline:
      "HAIMDALL is an AI-powered industrial safety intelligence platform that transforms fragmented workplace data into real-time risk visibility, predictive insights, and preventive action",
    sector: "AI-based Safety Solutions",
    stage: "Series B",
    track: "track1",
    website: "https://doublt.com",
    email: "youngjunkim@doublt.com",
    phone: "+82-10-3039-5113",
    problem: [
      "Industrial safety data is scattered across work plans, risk assessments, incident records, near-miss reports, and field systems",
      "Because these signals are reviewed separately, recurring hazards, missing controls, and emerging risks often remain hidden until an accident occurs",
    ],
    solution: [
      "HAIMDALL connects fragmented safety data through an industrial safety ontology",
      "It compares current operations with regulations, company rules, past incidents, near misses, risk assessments, and location data to identify risks and recommend preventive actions",
    ],
    keyFeatures: [
      "AI infrastructure for continuous, preventative risk management before accidents occur",
      "Ontology-driven data standardization",
      "Dynamic risk mapping (DRM)",
      "Time-based risk accumulation analysis",
      "Continuous risk intelligence layer",
    ],
    targetAudience: [
      "Manufacturing, construction, energy, logistics, and public infrastructure",
      "Enterprises operating complex or high-risk industrial sites",
    ],
    businessModel: [
      "Enterprise SaaS, private-cloud, and on-premise deployment",
      "Recurring revenue through AI analysis, system integration, and site expansion",
    ],
    businessSnapshot: [
      "Annual revenue KRW 6.58B (USD 4.58M); Series B investment USD 3.6M (pre-valuation USD 21.5M); 50,000 active users",
      "Winner, WSHAsia Awards – Technology Category",
      "Selected as one of the Top 80 solutions in the NVIDIA Inception Grand Challenge",
      "Korea's only KOSHA-certified smart industrial safety solution",
      "Selected as the 2026 Next Unicorn Candidate Company by the Ministry of SMEs & Startups of Korea",
      "Expanding enterprise pilots and global commercialization",
    ],
    team: [
      {
        name: "Young-jun KIM",
        role: "CEO",
        bio: [
          "Leads HAIMDALL's product strategy, AI safety architecture, and global commercialization",
          "Former product and B2B strategy manager for gram (laptop brand) at LG Electronics",
        ],
      },
    ],
    seekingOpportunities: [
      "Enterprise and public-sector pilot projects",
      "Global distribution, system integration, and investment partners",
    ],
  },
  {
    slug: "willog",
    name: "Willog",
    displayName: "Willog",
    tagline: "AIoT-powered intelligence that turns invisible cargo conditions into AI-driven decisions across the global supply chain",
    sector: "Smart Logistics / Supply Chain Management",
    stage: "Growth",
    track: "track1",
    website: "https://willog.io",
    email: "rj@willog.io",
    phone: "+65 8123 3969",
    problem: [
      "Annually, $163B is lost and up to 8% of global stock is at risk, due to deterioration, breakage and spoilage in transit/storage (esp. in pharma, food, chemicals and high-value cargo)",
      "80% of physical supply-chain data never reach a digital decision system — anomalies surface only after the damage is done",
    ],
    solution: [
      "Capture — Willog SAFE: IoT edge devices track location, temperature, humidity, light, shock and tilt in real time",
      "Control — Willog CONTROL TOWER: one dashboard, in-transit data, exception alerts and compliance reports",
      "Predict — Willog INTELLIGENCE: AI (V.AI-RISC™) forecasts risk, finds root cause and triggers action",
    ],
    keyFeatures: [
      "Cargo visibility: warehouse, inland fleet, ocean/air freight",
      "Exception alerts and GxP/GDP compliance reports",
      "3 AI engines — V.AI-RISC™, DATALIFT™, LIVELOGIC™ — on 15.4B+ data points, 51,000+ devices",
      "41 IP rights (34 patents, 7 design)",
    ],
    targetAudience: [
      "Shippers and logistics operators, esp. for biopharma, semiconductor, food & beverage/seafood, chemicals, freight forwarders/3PLs",
    ],
    businessModel: ["Monthly rental/subscription: device rental + data platform & AI, billed monthly"],
    businessSnapshot: [
      "USD 3M revenue (2025); 286% YoY growth (Q1 2026)",
      "200+ enterprise customers, 8 verticals",
      "Global customers: Corning (manufacturing), Bayer (Pharma), Abbott (Pharma), Hyundai Motor Group (600 shipments/day digitized), Samsung BIOEPIS & SDS (GDP-compliant cold chain)",
      "100% contract renewal, 0% churn (2024–2025)",
      "51,000+ devices deployed (+77% YoY); 15.4B+ data points (+937% YoY)",
      "41 IP rights; 4 global offices (KR·US·SG·JP)",
    ],
    team: [
      {
        name: "RJ ROH",
        role: "CEO, SG & SEA",
        bio: ["Leading Southeast Asia sales and expansion", "Ex-BlackRock, VP of Tech Sales", "Ex-Meta, B2B Sales", "Ex-Hyperconnect, Head of Marketing & Sales (one of KR's largest tech exits at $1.7B+)"],
      },
      {
        name: "BAE Seong-hoon",
        role: "Co-founder & Co-CEO",
        bio: ["Leading Technology, Product Roadmap, IP Management & Gov't R&D Projects", "ISO TC315 Cold Chain International Standards Expert", "Vice Chairman, MOLIT Smart Logistics Committee", "Awarded No.1 Cold Chain Tech by MOLIT"],
      },
      {
        name: "YOON Ji-hyeon",
        role: "Co-founder & Co-CEO",
        bio: ["Leading Operations, Finance & Accounting, and Sales", "Recognized for \"Intelligent Cold Chain\" Innovation by Ministry of Economy & Finance"],
      },
    ],
    seekingOpportunities: [
      "Singapore partners for a 6-month complimentary pilot (PoC)",
      "Best fit: shippers, 3PLs, warehouse/cold-chain operators in Asia distribution and re-export",
    ],
  },
  {
    slug: "xylolabs",
    name: "Xylo Labs",
    displayName: "Xylo Labs",
    tagline: "Physical AI-based predictive maintenance that turns reactive port and industrial equipment care into real-time, on-device intelligence",
    sector: "Industrial Physical AI",
    stage: "Seed",
    track: "track1",
    website: "https://xylolabs.com/en/",
    email: "account@xylolabs.com",
    phone: "",
    problem: [
      "Port and industrial equipment operate continuously in harsh conditions; failures can trigger logistics disruption and safety incidents",
      "Existing maintenance is reactive, not preventive/predictive, and inspection windows are limited by continuous operations",
    ],
    solution: [
      "On-device Physical AI analyzes programmable logic controller (PLC) and acoustic signals for predictive maintenance at the edge",
      "Real-time monitoring via a digital-twin interface, paired with LLM-based decision support for field operators",
    ],
    keyFeatures: [
      "On-device AI anomaly detection from PLC and acoustic/state signals, no cloud dependency required",
      "Real-time digital-twin monitoring interface for equipment condition",
      "Compact edge hardware roadmap: Xylo-Zero, Xylo-Mini, Xylo-One, Xylo Solution",
    ],
    targetAudience: ["Ports, shipping companies, power plants, and manufacturing/industrial plant operators"],
    businessModel: [
      "Working with port authorities in Korea offering a total customized solution and expanding further into heavy industries and plants",
      "Deploy Xylo-Mini and Xylo-One based on the Xylo-Solution platform",
    ],
    businessSnapshot: [
      "Seed investment KRW 400M (USD 280K), post-money valuation at KRW 4.9B (USD 3.4M) in 2026",
      "Public and industrial projects utilizing physical AI technologies: Min. of Science and ICT, Nat. Inst. of Forest Science, LG CNS",
      "PoCs in Korea: Busan Port Authority (Mar–Jun 2026); SK Shipping (Apr–Jul 2026); KIMST's Smart Port Initiative (2026)",
      "Global PoC currently in discussion with manufacturing companies in Japan and Indonesia",
      "2026 targets: 10+ PoCs across ports and marine sectors, KRW 1B (USD 685K) in major-customer revenue",
    ],
    team: [
      {
        name: "Gwangseok AN",
        role: "Co-Founder & CEO",
        bio: ["Focusing on Acoustic Signal Processing & Physical AI", "Former Head of Corporate R&D, Perigee Aerospace Inc.", "Led development of electronic control hardware and satellite subsystems", "Ph.D., Convergence Science and Technology, Seoul National University (SNU)"],
      },
      {
        name: "Jiyong YOON",
        role: "Co-Founder & CTO",
        bio: ["Former Machine Learning Platform Engineer, MaumAI", "Former Software Engineer, Sendbird Korea", "Ph.D. Candidate, Electrical and Computer Engineering, SNU"],
      },
      {
        name: "Soohwan KIM",
        role: "Co-Founder & CFO",
        bio: ["Former CSO, Lion Robotics", "Former CFO, Perigee Aerospace Inc.", "KOSDAQ Technology Listing Examiner, Korea Exchange (KRX)", "B.A. Economics, SNU"],
      },
    ],
    seekingOpportunities: ["PoC and pilot partners in ports, shipping, power generation, and manufacturing"],
  },
  {
    slug: "eastsea-brother",
    name: "East Sea Brother",
    displayName: "Eastsea Brother",
    tagline: "Premium handcrafted pet food sourced sustainably from the East Sea of Korea",
    sector: "Premium Pet Food",
    stage: "Scale-up",
    track: "track2",
    website: "http://www.eastseabrother.com/en/",
    email: "info@eastseabrother.com",
    phone: "+82 10-9566-6028",
    problem: [
      "The pet food market lacks high-quality, traceable seafood-based options",
      "Conventional pet treats rely on land-based proteins, offering limited nutritional diversity for pets",
    ],
    solution: [
      "Premium handcrafted seafood treats sourced from the East Sea of Korea, combining marine nutrition with artisanal quality",
      "Small-batch, traceable production that connects local fisheries to pet owners",
    ],
    keyFeatures: [
      "East Sea-sourced seafood ingredients with traceable origins",
      "Handcrafted, small-batch production for consistent quality",
      "Community and pet wellbeing-driven brand positioning",
    ],
    targetAudience: ["Premium pet food distributors, pet specialty retailers, and health-conscious pet owners in Southeast Asia"],
    businessModel: ["D2C and B2B distribution of handcrafted seafood pet treats, with OEM/private-label potential for regional pet food brands"],
    businessSnapshot: [
      "1.2x–1.5x annual growth; NPS 76.3% (in Korea)",
      "Exporting to US, Singapore, Hong Kong, Philippines, Thailand and Saudi Arabia; export sales of USD 180K",
      "Products sold through 5 retailers in major US cities and Earthwise Pet (200 outlets in US), 14 premium pet shops in SG",
      "Online expansion in discussion: Chewy (leading US online pet retailer), Julius K9 (European retailer)",
      "Sold out on Day 2 of Singapore Pet Festival exhibition (2024)",
    ],
    team: [
      {
        name: "Eunyul KIM",
        role: "CEO & Founder",
        bio: ["17+ years of experience in branding, food & retail industry", "Former Fresh Food Strategist at Ebay Korea & NS Home Shopping", "First in the Korean pet industry to receive the Prime Minister's Award", "B.Arch, Sungkyunkwan University"],
      },
      {
        name: "Seoyul HWANG",
        role: "Manager",
        bio: ["7+ years of experience in business strategy & operations management", "Former Strategic Planner at fast-growing startups", "Directs brand strategy and digital marketing at Eastsea Brother"],
      },
    ],
    seekingOpportunities: [
      "Distribution partners and retail buyers in Southeast Asian pet food markets",
      "Co-development opportunities to reshape pet food culture with marine-sourced nutrition",
    ],
  },
  {
    slug: "haesong-snt",
    name: "HAESONG S&T",
    displayName: "Haesong S&T",
    tagline: "A seaweed-specialized technology company turning marine biomass into standardized, high-value ingredients and eco-friendly upcycled products",
    sector: "Eco-Friendly Alternative Seaweed",
    stage: "Growth",
    track: "track2",
    website: "http://haesongsnt.com",
    email: "info@haesongsnt.com",
    phone: "+82 62-972-0150",
    problem: [
      "The raw material for gim (nori) is produced only in Korea, China and Japan, and prices are doubling annually due to surging demand and productivity fluctuations from climate issues",
      "Many global brands struggle to secure supply of the raw material — a global market worth KRW 8T (USD 5.3B), growing 10+% annually",
    ],
    solution: [
      "Producing alternative gim by manipulating the biological characteristics (texture, nutritional content, flavor) of underutilized seaweed species to replicate natural gim",
      "The alternative gim can be used in snacks currently popular across the world",
      "Goal: commercialize underutilized seaweed varieties from various regions",
    ],
    keyFeatures: [
      "Technology patents: controlling harmful heavy metals (3 registered), modifying texture (2 registered), managing flavor (1 patent transaction completed), adjusting sheet flexibility and light reflectivity (2 applications filed)",
      "Expanding seaweed biomass enables year-round production, ensuring price stability and reducing cost burdens for clients",
    ],
    targetAudience: ["B2B partners to supply alternative gim"],
    businessModel: [
      "Artificial gim manufacturing platform transforming seaweed biomass waste into high-value seaweed products",
      "Integrated R&D and manufacturing model with proprietary technology to produce alternative gim at commercial scale",
      "B2B commercialization model supplying artificial gim sheets to global food companies, snack manufacturers, and distributors facing raw material supply constraints",
    ],
    businessSnapshot: [
      "Export revenue USD 8M (2025)",
      "Clients include brands from Vietnam, Thailand, Japan, China, and India",
      "A contract worth USD 100K for alternative gim products was signed in July 2026 with Maruka (Japan)",
      "PoC trials at local facilities with 2 seaweed snack manufacturers in Vietnam, 1 brand in Thailand, 2 brands in Japan and 1 distributor in India",
    ],
    team: [
      {
        name: "Joonhwa SONG",
        role: "CEO / Founder",
        bio: ["17+ years in the seaweed industry", "Ex-AhnLab Japan", "MBA, Chonnam National University", "B.Eng, Osaka Sangyo University"],
      },
      {
        name: "Younghoon SON",
        role: "CEO",
        bio: ["Former AI researcher, Ministry of Health and Welfare and Korea Health Promotion Institute", "5+ years in the seaweed industry", "M. Eng. AI, Sejong University (paused)", "B. Eng. Big Data, Hongik University"],
      },
    ],
    seekingOpportunities: [
      "Connections to Singapore-based distributors to establish partnerships with companies in Vietnam, Thailand and Indonesia",
      "Accelerating the commercialization and global expansion of alternative gim technology",
    ],
  },
  {
    slug: "contrau-eco",
    name: "Con Trau Eco",
    displayName: "Con Trau Eco",
    tagline: "Building, operating and transferring traceable food supply chains in Vietnam, funded by buyer pre-payments and repaid in product, not cash",
    sector: "AgTech & Smart Aquaculture",
    stage: "Growth",
    track: "track2",
    website: "https://contrau.eco/",
    email: "sangdon.joo@contrau.eco",
    phone: "",
    problem: [
      "Climate volatility and geopolitical risks make clean, traceable food inputs scarce and hard to source at scale through spot markets",
      "Fresh seafood is even harder — origin, air logistics and cold chain must align, and few suppliers own all three",
    ],
    solution: [
      "Build and run production in Vietnam, then hand the buyer a fully operating, traceable supply line, funded by product-repaid pre-payments, so they own a dedicated source",
      "Four lines run on one model: spirulina, shrimp, black soldier fly (BSF) protein; and a fresh crab and lobster line in development",
    ],
    keyFeatures: [
      "Spirulina operating with revenue: up to 300t/year by end-2026, scaling toward 600t/year in 2027 at EU-standard quality",
      "Shrimp expanding to a 25 ha Khanh Hoa site",
      "BSF protein exporting to Korea from 2026, domestic offtake from October",
      "Fresh crab and lobster in development",
    ],
    targetAudience: [
      "Fresh-seafood importers and distributors in Singapore and Southeast Asia",
      "Food, beverage and nutrition companies and natural-colour/functional-ingredient buyers needing a traceable, self-controlled source",
    ],
    businessModel: [
      "Buyers fund CapEx and are repaid in product; a multi-year off-take contract locks in demand and price",
      "The company operates the facility and ships a contracted volume under fixed supply terms",
      "The model replicates line by line, site by site",
    ],
    businessSnapshot: [
      "Revenue (USD 234K in 2025) already generated, with stable, continuous production",
      "Spirulina in production in Trà Vinh; second site in Ninh Thuận building out",
      "Shrimp operating in Ca Mau; BSF protein exporting from 2026",
    ],
    team: [
      {
        name: "Sangdon JOO",
        role: "Founder & CEO",
        bio: ["B.Eng. Naval Architecture and Marine Engineering, Seoul National University", "20-year serial entrepreneur", "$16.7M raised across ventures"],
      },
      {
        name: "Nguyen Van Cu",
        role: "Microalgae Lead",
        bio: ["16+ years of experience in food and bioprocess manufacturing", "Scaled ponds 2→20"],
      },
    ],
    seekingOpportunities: [
      "Distribution partners for fresh soft-shell crab and lobster",
      "Blended finance — equity plus debt — from impact or infrastructure investors for food supply-chain development where an off-taker is already committed",
    ],
  },
  {
    slug: "ys-bio",
    name: "YS Bio",
    displayName: "WISE BIO Inc. (YS Bio)",
    tagline: "WEASY – a rapid self-test kit for foodborne bacterial pathogens, enabling fast, accurate food safety inspection without lab delays",
    sector: "Point-of-Care Diagnostics",
    stage: "Series A",
    track: "track2",
    website: "http://ysbio.co.kr",
    email: "dykim@ysbio.co.kr",
    phone: "+82-70-5172-8444",
    problem: [
      "Food microbial contamination causes up to KRW 244B (USD 171.7M, 2025 est.) in national losses via recalls and brand damage",
      "Conventional lab testing takes 5 to 20 days and is costly, limiting routine self-inspection",
    ],
    solution: [
      "LAMP (loop-mediated isothermal amplification)-based rapid in-vitro molecular diagnostic kit",
      "Results within 20 minutes, 95%+ sensitivity, 100% specificity, targeting 10 pathogen species",
    ],
    keyFeatures: [
      "20-minute turnaround vs. days for PCR/lab tests, at KRW 18,000 (USD 12) per test",
      "PCR-comparable accuracy with a much simpler user workflow",
      "Partner ecosystem: Nanohelix, Bionics, Gyeongsang National University, Kyungpook National University",
    ],
    targetAudience: ["Food manufacturers, seafood processors and distributors, restaurants and cafes, institutional/B2G food services"],
    businessModel: ["B2C/B2B kit sales to food manufacturers and food-service operators, expanding into B2G and overseas (Vietnam, Indonesia from 2026)"],
    businessSnapshot: [
      "Facility certification (ISO13485:2016)",
      "PoC with a land-based aquaculture farm, TG Biotech, the Korean Army and cafes",
      "Supply to national and public childcare centers for food service management",
    ],
    team: [
      {
        name: "Dongyeon KIM",
        role: "Founder & CEO",
        bio: ["M.S. in Biotechnology", "Ph.D. candidate in Dental Science", "Professional experience in molecular diagnostic research", "Extensive research experience in life sciences"],
      },
      {
        name: "Aena YI",
        role: "R&D Team Leader",
        bio: ["M.S. in Biotechnology", "R&D experience in molecular diagnostics and biopharmaceuticals", "Expertise in assay development and bioprocess optimization"],
      },
    ],
    seekingOpportunities: ["B2B/B2G pilot partners and overseas distribution partners for regional expansion"],
  },
];

export function getCompanyBySlug(slug: string): Company | undefined {
  return companies.find((c) => c.slug === slug);
}
