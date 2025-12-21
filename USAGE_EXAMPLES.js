/**
 * USAGE EXAMPLES - Dynamic Content Feature
 *
 * This file shows practical examples of how to create jobs and admit cards
 * with dynamic content for different scenarios.
 */

// ============================================================
// EXAMPLE 1: UP Police Constable Job (with Physical Standards)
// ============================================================

const upPoliceJob = {
  // Basic job info
  departmentName: "Uttar Pradesh Police Recruitment Board",
  postName: "Constable (Male/Female) - 2024",
  totalPost: 5000,
  modeOfForm: "online",
  typeOfForm: "government",
  paymentMode: "paid",

  helpEmailId: "help@uppolice.gov.in",
  helpCareNo: "1800-180-0440",
  officialWebsite: "https://uppbpb.gov.in",

  eligibilityEducational1: "12th Pass from recognized board",

  // Category wise posts
  categoryPosts: {
    general: 2000,
    obc: 1500,
    sc: 1000,
    st: 500
  },

  // Category wise fees
  categoryFees: {
    general: 400,
    obc: 400,
    sc: 0,
    st: 0,
    ews: 0
  },

  // Important dates
  importantDates: {
    startDate: new Date("2024-01-01"),
    registrationLastDate: new Date("2024-01-31"),
    examDate: new Date("2024-03-15"),
    minimumAge: 18,
    maximumAge: 25
  },

  // 🔥 DYNAMIC CONTENT - Physical Standards
  dynamicContent: [
    {
      type: "heading",
      value: "Physical Standard Test (PST)",
      order: 1
    },
    {
      type: "alert",
      value: "Candidates must qualify in PST to proceed to written examination",
      metadata: {
        alertType: "warning"
      },
      order: 2
    },
    {
      type: "table",
      label: "Height Requirements",
      metadata: {
        tableHeaders: ["Category", "Male (cm)", "Female (cm)"],
        tableRows: [
          ["General/OBC/SC", "168", "152"],
          ["ST", "160", "147"]
        ],
        tableCaption: "Minimum height requirements for UP Police Constable"
      },
      order: 3
    },
    {
      type: "table",
      label: "Chest Measurements (Male Candidates Only)",
      metadata: {
        tableHeaders: ["Category", "Unexpanded (cm)", "Expanded (cm)", "Minimum Expansion (cm)"],
        tableRows: [
          ["General/OBC/SC", "79", "84", "5"],
          ["ST", "77", "82", "5"]
        ]
      },
      order: 4
    },
    {
      type: "subheading",
      value: "Physical Efficiency Test (PET)",
      order: 5
    },
    {
      type: "list",
      label: "Running Test Requirements",
      values: [
        "Male Candidates: 4.8 km in maximum 28 minutes",
        "Female Candidates: 2.4 km in maximum 16 minutes"
      ],
      metadata: {
        listType: "unordered"
      },
      order: 6
    }
  ],

  // Selection process
  selectionProcess: [
    "Online Application",
    "Physical Standard Test (PST)",
    "Physical Efficiency Test (PET)",
    "Written Examination",
    "Document Verification",
    "Medical Examination"
  ],

  // Documents required
  documentsRequired: [
    "10th Mark Sheet & Certificate",
    "12th Mark Sheet & Certificate",
    "Date of Birth Certificate",
    "Caste Certificate (if applicable)",
    "Domicile Certificate of UP",
    "Character Certificate",
    "Recent Passport Size Photographs"
  ]
};

// ============================================================
// EXAMPLE 2: SSC CGL Job (NO Physical Standards)
// ============================================================

const sscCglJob = {
  // Basic info
  departmentName: "Staff Selection Commission",
  postName: "Combined Graduate Level Examination 2024",
  totalPost: 3000,
  modeOfForm: "online",
  typeOfForm: "government",
  paymentMode: "conditional",

  helpEmailId: "ssc-cgl@nic.in",
  helpCareNo: "011-24363343",
  officialWebsite: "https://ssc.nic.in",

  eligibilityEducational1: "Bachelor's Degree from recognized university",

  categoryPosts: {
    general: 1200,
    obc: 900,
    sc: 600,
    st: 300
  },

  categoryFees: {
    general: 100,
    obc: 100,
    sc: 0,
    st: 0,
    female: 0
  },

  // 🔥 DYNAMIC CONTENT - Exam Pattern (NO Physical Test)
  dynamicContent: [
    {
      type: "heading",
      value: "Examination Pattern",
      order: 1
    },
    {
      type: "list",
      label: "Selection Process Stages",
      values: [
        "Tier-I: Computer Based Examination (Objective Type)",
        "Tier-II: Computer Based Examination (Objective Type)",
        "Tier-III: Descriptive Paper in English/Hindi (Pen and Paper Mode)",
        "Tier-IV: Computer Proficiency Test / Skill Test (wherever applicable)",
        "Document Verification"
      ],
      metadata: {
        listType: "ordered"
      },
      order: 2
    },
    {
      type: "table",
      label: "Tier-I Examination Pattern",
      metadata: {
        tableHeaders: ["Subject", "Questions", "Maximum Marks", "Duration"],
        tableRows: [
          ["General Intelligence & Reasoning", "25", "50", "60 minutes"],
          ["General Awareness", "25", "50", "60 minutes"],
          ["Quantitative Aptitude", "25", "50", "60 minutes"],
          ["English Comprehension", "25", "50", "60 minutes"]
        ],
        tableCaption: "Total: 100 Questions, 200 Marks"
      },
      order: 3
    },
    {
      type: "alert",
      value: "Negative marking: 0.50 marks for each wrong answer in Tier-I and Tier-II",
      metadata: {
        alertType: "error"
      },
      order: 4
    },
    {
      type: "table",
      label: "Tier-II Examination Pattern",
      metadata: {
        tableHeaders: ["Paper", "Subject", "Questions", "Marks", "Duration"],
        tableRows: [
          ["Paper-I", "Quantitative Abilities", "100", "200", "2 hours"],
          ["Paper-II", "English Language", "200", "200", "2 hours"],
          ["Paper-III", "Statistics", "100", "200", "2 hours"],
          ["Paper-IV", "General Studies", "100", "200", "2 hours"]
        ]
      },
      order: 5
    }
  ],

  selectionProcess: [
    "Tier-I Examination",
    "Tier-II Examination",
    "Tier-III Descriptive Paper",
    "Tier-IV Skill Test",
    "Document Verification",
    "Medical Examination (if applicable)"
  ]
};

// ============================================================
// EXAMPLE 3: Railway Recruitment (with Organized Sections)
// ============================================================

const railwayJob = {
  departmentName: "Railway Recruitment Board",
  postName: "Non-Technical Popular Categories (NTPC) 2024",
  totalPost: 35000,
  modeOfForm: "online",
  typeOfForm: "government",
  paymentMode: "paid",

  helpEmailId: "rrb@railnet.gov.in",
  officialWebsite: "https://rrbcdg.gov.in",

  eligibilityEducational1: "Graduation or equivalent",

  // 🔥 USING CONTENT SECTIONS for better organization
  contentSections: [
    {
      sectionId: "exam_pattern",
      sectionTitle: "Examination Pattern",
      sectionDescription: "Details about CBT stages and pattern",
      order: 1,
      isCollapsible: true,
      isExpandedByDefault: true,
      icon: "📝",
      content: [
        {
          type: "list",
          label: "CBT Stages",
          values: [
            "1st Stage CBT (Computer Based Test)",
            "2nd Stage CBT",
            "Typing Skill Test / Computer Based Aptitude Test",
            "Document Verification",
            "Medical Examination"
          ],
          metadata: { listType: "ordered" }
        },
        {
          type: "table",
          label: "1st Stage CBT Pattern",
          metadata: {
            tableHeaders: ["Subject", "Questions", "Marks", "Duration"],
            tableRows: [
              ["Mathematics", "30", "30", "90 minutes"],
              ["General Intelligence", "30", "30", ""],
              ["General Awareness", "40", "40", ""]
            ]
          }
        }
      ]
    },
    {
      sectionId: "post_preferences",
      sectionTitle: "Post Preferences",
      sectionDescription: "Available posts and eligibility",
      order: 2,
      isCollapsible: true,
      isExpandedByDefault: false,
      icon: "💼",
      content: [
        {
          type: "table",
          label: "Posts Available",
          metadata: {
            tableHeaders: ["Post Name", "Pay Level", "Educational Qualification"],
            tableRows: [
              ["Junior Clerk cum Typist", "Level 2", "12th Pass + Typing"],
              ["Accounts Clerk cum Typist", "Level 2", "12th Pass + Typing"],
              ["Junior Time Keeper", "Level 2", "12th Pass"],
              ["Trains Clerk", "Level 2", "12th Pass"]
            ]
          }
        }
      ]
    },
    {
      sectionId: "important_instructions",
      sectionTitle: "Important Instructions",
      order: 3,
      isCollapsible: true,
      icon: "⚠️",
      content: [
        {
          type: "alert",
          value: "Candidates can choose up to 7 posts in order of preference",
          metadata: { alertType: "info" }
        },
        {
          type: "list",
          values: [
            "Relaxation in upper age limit as per Government norms",
            "Free travel pass (II class) to SC/ST candidates",
            "PwBD candidates exempted from examination fee",
            "Candidates should fill only ONE application"
          ]
        }
      ]
    }
  ]
};

// ============================================================
// EXAMPLE 4: Admit Card with Exam Centers and Instructions
// ============================================================

const admitCardExample = {
  type: "Job",
  referenceId: "507f1f77bcf86cd799439011", // Reference to Job ID
  referenceModel: "Job",

  // Basic info
  linkMenuField: "RRB NTPC Admit Card 2024",
  category: "Railway Exam",
  publishDate: new Date("2024-02-01"),
  lastDate: new Date("2024-03-15"),
  status: "verified",
  admitCardStatus: "active",

  // Description
  description: "Download RRB NTPC 2024 Admit Card for Computer Based Test (CBT). Candidates must bring this admit card along with original photo ID proof to the examination center.",

  // Exam centers
  examCenters: [
    {
      centerName: "Delhi Public School",
      centerCode: "DLH001",
      address: "Mathura Road, New Delhi",
      city: "New Delhi",
      state: "Delhi"
    },
    {
      centerName: "Modern School",
      centerCode: "DLH002",
      address: "Barakhamba Road, New Delhi",
      city: "New Delhi",
      state: "Delhi"
    },
    {
      centerName: "DAV Public School",
      centerCode: "MUM001",
      address: "Andheri East, Mumbai",
      city: "Mumbai",
      state: "Maharashtra"
    }
  ],

  // Download links
  downloadLinks: [
    {
      title: "Download Admit Card PDF",
      url: "https://rrbcdg.gov.in/admit-card/download",
      fileType: "PDF",
      description: "Download your admit card with roll number and exam details",
      isActive: true
    },
    {
      title: "Exam Instructions PDF",
      url: "https://rrbcdg.gov.in/instructions.pdf",
      fileType: "PDF",
      description: "Detailed instructions for examination day",
      isActive: true
    },
    {
      title: "Exam Center Location Map",
      url: "https://rrbcdg.gov.in/center-map.pdf",
      fileType: "PDF",
      description: "Google Maps location of all exam centers",
      isActive: true
    }
  ],

  // Important instructions
  importantInstructions: [
    "Report at exam center 30 minutes before scheduled time",
    "Bring original photo ID proof (Aadhaar/Driving License/Passport/Voter ID)",
    "No candidate will be allowed after gate closing time (9:45 AM)",
    "Mobile phones and electronic devices are strictly prohibited",
    "Rough sheets will be provided at the center"
  ],

  // Documents required
  documentsRequired: [
    "Admit Card (Printout)",
    "Original Photo ID Proof",
    "Additional photo ID (if name differs on admit card)",
    "PwBD Certificate (if applicable)",
    "Recent passport size photograph"
  ],

  // Dynamic content for exam details
  dynamicContent: [
    {
      type: "alert",
      value: "Exam Date: March 15, 2024 | Reporting Time: 9:00 AM | Gate Closes: 9:45 AM",
      metadata: {
        alertType: "warning"
      },
      order: 1
    },
    {
      type: "heading",
      value: "Examination Schedule",
      order: 2
    },
    {
      type: "table",
      label: "Exam Timings",
      metadata: {
        tableHeaders: ["Activity", "Time"],
        tableRows: [
          ["Entry to Exam Center", "9:00 AM"],
          ["Gate Closes", "9:45 AM"],
          ["Instructions Reading", "9:45 AM - 10:00 AM"],
          ["Examination Duration", "10:00 AM - 11:30 AM"]
        ]
      },
      order: 3
    },
    {
      type: "divider",
      order: 4
    },
    {
      type: "heading",
      value: "Prohibited Items",
      order: 5
    },
    {
      type: "list",
      label: "Following items are NOT allowed in exam hall:",
      values: [
        "Mobile phones, smartwatches, calculators",
        "Books, notes, or any written material",
        "Electronic devices (bluetooth, earphones, etc.)",
        "Bags, purses (except small transparent pouch)",
        "Food items (only water bottle allowed)"
      ],
      metadata: {
        listType: "unordered"
      },
      order: 6
    },
    {
      type: "alert",
      value: "Violation of examination rules may lead to cancellation of candidature",
      metadata: {
        alertType: "error"
      },
      order: 7
    }
  ],

  // Organized sections
  contentSections: [
    {
      sectionId: "covid_guidelines",
      sectionTitle: "Health & Safety Guidelines",
      sectionDescription: "COVID-19 safety measures",
      order: 1,
      isCollapsible: true,
      isExpandedByDefault: false,
      icon: "🏥",
      content: [
        {
          type: "list",
          values: [
            "Wearing mask is mandatory throughout the examination",
            "Maintain social distancing in queue and exam hall",
            "Sanitizers will be available at entry points",
            "Temperature check will be conducted at entry",
            "Candidates with fever/symptoms will not be allowed"
          ]
        }
      ]
    },
    {
      sectionId: "faq",
      sectionTitle: "Frequently Asked Questions",
      order: 2,
      isCollapsible: true,
      isExpandedByDefault: false,
      icon: "❓",
      content: [
        {
          type: "text",
          value: "<b>Q: What if my name is misspelled on admit card?</b><br>A: Bring additional ID proof and contact invigilator before exam starts."
        },
        {
          type: "text",
          value: "<b>Q: Can I bring calculator?</b><br>A: No, on-screen calculator will be provided in the system."
        },
        {
          type: "text",
          value: "<b>Q: What is the dress code?</b><br>A: Formal or semi-formal. Avoid clothes with large pockets."
        }
      ]
    }
  ],

  tags: ["RRB", "NTPC", "Railway", "Admit Card", "2024"]
};

// ============================================================
// EXAMPLE 5: Bank PO with Document Requirements
// ============================================================

const bankPOAdmitCard = {
  type: "Job",

  description: "Download State Bank of India PO Prelims Admit Card 2024. Candidates qualifying in Prelims will be called for Mains examination.",

  // Simple document checklist
  documentsRequired: [
    "10th Class Certificate & Mark Sheet",
    "12th Class Certificate & Mark Sheet",
    "Graduation Degree & All Semester Mark Sheets",
    "Caste/Category Certificate (if applicable)",
    "PwBD Certificate (if applicable)",
    "EWS Certificate (for EWS candidates)",
    "Experience Certificate (if claiming)",
    "NOC from Current Employer (if working)",
    "Recent Passport Size Photographs (5 copies)"
  ],

  dynamicContent: [
    {
      type: "heading",
      value: "Document Verification Checklist"
    },
    {
      type: "text",
      value: "Candidates must bring ALL documents in ORIGINAL along with ONE self-attested photocopy of each:"
    },
    {
      type: "checkbox",
      label: "Educational Certificates",
      values: [
        "10th Certificate & Mark Sheet",
        "12th Certificate & Mark Sheet",
        "Graduation Degree Certificate",
        "All Semester/Year Mark Sheets",
        "Post Graduation (if applicable)"
      ],
      order: 1
    },
    {
      type: "checkbox",
      label: "Identity Documents",
      values: [
        "Aadhaar Card (Mandatory)",
        "PAN Card (Mandatory)",
        "Passport (if available)",
        "Driving License (if available)",
        "Voter ID Card"
      ],
      order: 2
    },
    {
      type: "checkbox",
      label: "Category/Reservation Certificates",
      values: [
        "Caste Certificate (SC/ST/OBC)",
        "OBC Non-Creamy Layer Certificate (within 1 year)",
        "EWS Certificate (current financial year)",
        "PwBD Disability Certificate (from Govt. Hospital)"
      ],
      order: 3
    },
    {
      type: "alert",
      value: "Candidates failing to produce original documents OR mismatch in information will be disqualified immediately",
      metadata: {
        alertType: "error"
      },
      order: 4
    }
  ]
};

// ============================================================
// How to use in API calls
// ============================================================

/*
// Creating UP Police Job
POST /api/jobs
Content-Type: application/json
Authorization: Bearer <token>

{
  ...upPoliceJob
}

// Creating SSC CGL Job
POST /api/jobs
{
  ...sscCglJob
}

// Creating Admit Card
POST /api/admit-cards
{
  ...admitCardExample
}

*/

module.exports = {
  upPoliceJob,
  sscCglJob,
  railwayJob,
  admitCardExample,
  bankPOAdmitCard
};
