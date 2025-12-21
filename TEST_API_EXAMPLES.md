# API Testing Examples for Dynamic Content

Test these endpoints with Postman or similar tools.

## 1. Create Job with Physical Standards (UP Police Example)

```http
POST http://localhost:5000/api/jobs
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "departmentName": "Uttar Pradesh Police Recruitment Board",
  "postName": "Constable (Male/Female) - 2024",
  "totalPost": 5000,
  "modeOfForm": "online",
  "typeOfForm": "government",
  "paymentMode": "paid",
  "helpEmailId": "help@uppolice.gov.in",
  "helpCareNo": "1800-180-0440",
  "officialWebsite": "https://uppbpb.gov.in",
  "eligibilityEducational1": "12th Pass from recognized board",

  "categoryPosts": {
    "general": 2000,
    "obc": 1500,
    "sc": 1000,
    "st": 500
  },

  "categoryFees": {
    "general": 400,
    "obc": 400,
    "sc": 0,
    "st": 0
  },

  "importantDates": {
    "startDate": "2024-01-01",
    "registrationLastDate": "2024-01-31",
    "examDate": "2024-03-15",
    "minimumAge": 18,
    "maximumAge": 25
  },

  "dynamicContent": [
    {
      "type": "heading",
      "value": "Physical Standard Test (PST)",
      "order": 1
    },
    {
      "type": "alert",
      "value": "Candidates must qualify in PST to proceed to written examination",
      "metadata": {
        "alertType": "warning"
      },
      "order": 2
    },
    {
      "type": "table",
      "label": "Height Requirements",
      "metadata": {
        "tableHeaders": ["Category", "Male (cm)", "Female (cm)"],
        "tableRows": [
          ["General/OBC/SC", "168", "152"],
          ["ST", "160", "147"]
        ],
        "tableCaption": "Minimum height requirements"
      },
      "order": 3
    },
    {
      "type": "table",
      "label": "Chest Measurements (Male Only)",
      "metadata": {
        "tableHeaders": ["Category", "Unexpanded (cm)", "Expanded (cm)", "Expansion (cm)"],
        "tableRows": [
          ["General/OBC/SC", "79", "84", "5"],
          ["ST", "77", "82", "5"]
        ]
      },
      "order": 4
    },
    {
      "type": "list",
      "label": "Running Test",
      "values": [
        "Male candidates: 4.8 km in 28 minutes",
        "Female candidates: 2.4 km in 16 minutes"
      ],
      "metadata": {
        "listType": "unordered"
      },
      "order": 5
    }
  ],

  "selectionProcess": [
    "Online Application",
    "Physical Standard Test (PST)",
    "Physical Efficiency Test (PET)",
    "Written Examination",
    "Document Verification",
    "Medical Examination"
  ],

  "documentsRequired": [
    "10th Certificate & Mark Sheet",
    "12th Certificate & Mark Sheet",
    "Date of Birth Certificate",
    "Caste Certificate (if applicable)",
    "Domicile Certificate of UP",
    "Character Certificate",
    "Recent Passport Size Photographs"
  ]
}
```

---

## 2. Create SSC CGL Job (NO Physical Standards)

```http
POST http://localhost:5000/api/jobs
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "departmentName": "Staff Selection Commission",
  "postName": "Combined Graduate Level Examination 2024",
  "totalPost": 3000,
  "modeOfForm": "online",
  "typeOfForm": "government",
  "paymentMode": "conditional",
  "helpEmailId": "ssc-cgl@nic.in",
  "helpCareNo": "011-24363343",
  "officialWebsite": "https://ssc.nic.in",
  "eligibilityEducational1": "Bachelor's Degree from recognized university",

  "categoryPosts": {
    "general": 1200,
    "obc": 900,
    "sc": 600,
    "st": 300
  },

  "categoryFees": {
    "general": 100,
    "obc": 100,
    "sc": 0,
    "st": 0
  },

  "dynamicContent": [
    {
      "type": "heading",
      "value": "Examination Pattern"
    },
    {
      "type": "list",
      "label": "Selection Process",
      "values": [
        "Tier-I: Computer Based Examination (Objective)",
        "Tier-II: Computer Based Examination (Objective)",
        "Tier-III: Descriptive Paper (Pen & Paper)",
        "Tier-IV: Computer Proficiency Test / Skill Test",
        "Document Verification"
      ],
      "metadata": {
        "listType": "ordered"
      }
    },
    {
      "type": "table",
      "label": "Tier-I Exam Pattern",
      "metadata": {
        "tableHeaders": ["Subject", "Questions", "Marks", "Duration"],
        "tableRows": [
          ["General Intelligence", "25", "50", "60 min"],
          ["General Awareness", "25", "50", "60 min"],
          ["Quantitative Aptitude", "25", "50", "60 min"],
          ["English", "25", "50", "60 min"]
        ],
        "tableCaption": "Total: 100 Questions, 200 Marks"
      }
    },
    {
      "type": "alert",
      "value": "Negative marking: 0.50 marks for each wrong answer",
      "metadata": {
        "alertType": "error"
      }
    }
  ],

  "selectionProcess": [
    "Tier-I Exam",
    "Tier-II Exam",
    "Tier-III Descriptive",
    "Document Verification",
    "Final Merit List"
  ]
}
```

---

## 3. Create Admit Card with Dynamic Content

```http
POST http://localhost:5000/api/admit-cards
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "Job",
  "referenceId": "YOUR_JOB_ID_HERE",
  "referenceModel": "Job",
  "linkMenuField": "RRB NTPC Admit Card 2024",
  "category": "Railway Exam",
  "publishDate": "2024-02-01",
  "lastDate": "2024-03-15",
  "admitCardStatus": "active",

  "description": "Download RRB NTPC 2024 Admit Card for Computer Based Test (CBT)",

  "importantInstructions": [
    "Report at exam center 30 minutes before scheduled time",
    "Bring original photo ID proof",
    "No candidate will be allowed after gate closing time",
    "Mobile phones are strictly prohibited"
  ],

  "documentsRequired": [
    "Admit Card (Printout)",
    "Original Photo ID",
    "Additional photo ID (if name differs)",
    "Recent passport size photograph"
  ],

  "dynamicContent": [
    {
      "type": "alert",
      "value": "Exam Date: March 15, 2024 | Reporting Time: 9:00 AM | Gate Closes: 9:45 AM",
      "metadata": {
        "alertType": "warning"
      }
    },
    {
      "type": "heading",
      "value": "Examination Schedule"
    },
    {
      "type": "table",
      "label": "Exam Timings",
      "metadata": {
        "tableHeaders": ["Activity", "Time"],
        "tableRows": [
          ["Entry to Exam Center", "9:00 AM"],
          ["Gate Closes", "9:45 AM"],
          ["Instructions Reading", "9:45 AM - 10:00 AM"],
          ["Exam Duration", "10:00 AM - 11:30 AM"]
        ]
      }
    },
    {
      "type": "heading",
      "value": "Prohibited Items"
    },
    {
      "type": "list",
      "label": "NOT allowed in exam hall:",
      "values": [
        "Mobile phones, smartwatches",
        "Books, notes, written material",
        "Electronic devices",
        "Bags, purses (except small transparent pouch)"
      ]
    }
  ]
}
```

---

## 4. Update Job with Dynamic Content

```http
PUT http://localhost:5000/api/jobs/YOUR_JOB_ID
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "departmentName": "Updated Department Name",

  "dynamicContent": [
    {
      "type": "heading",
      "value": "Updated Physical Standards"
    },
    {
      "type": "table",
      "label": "New Height Requirements",
      "metadata": {
        "tableHeaders": ["Category", "Male", "Female"],
        "tableRows": [
          ["General", "170 cm", "155 cm"]
        ]
      }
    }
  ],

  "selectionProcess": [
    "Updated Step 1",
    "Updated Step 2",
    "Updated Step 3"
  ]
}
```

---

## 5. Get All Jobs (Filter by dynamic content)

```http
GET http://localhost:5000/api/jobs?page=1&limit=10&status=verified
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response will include dynamic content:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "departmentName": "UP Police",
      "postName": "Constable",
      "dynamicContent": [
        {
          "type": "heading",
          "value": "Physical Standards"
        }
      ],
      "selectionProcess": ["PST", "PET", "Written"],
      "documentsRequired": ["10th", "12th"]
    }
  ]
}
```

---

## Expected Success Responses

### Create Job Success
```json
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "_id": "65abc123...",
    "departmentName": "UP Police",
    "dynamicContent": [...],
    "selectionProcess": [...],
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Create Admit Card Success
```json
{
  "success": true,
  "message": "Admit card created successfully",
  "data": {
    "_id": "65def456...",
    "type": "Job",
    "dynamicContent": [...],
    "importantInstructions": [...],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "departmentName",
      "message": "Department name is required"
    },
    {
      "field": "dynamicContent.0.type",
      "message": "Type is required"
    }
  ]
}
```

### Not Found
```json
{
  "success": false,
  "message": "Job not found"
}
```

### Unauthorized
```json
{
  "success": false,
  "message": "You do not have permission to update this job"
}
```

---

## Console Logs to Check

When you make API calls, check the server console for these logs:

### On Create Job:
```
Incoming job data: { ... }
Creating job with dynamic content: {
  hasDynamicContent: true,
  hasContentSections: false,
  hasSelectionProcess: true
}
```

### On Create Admit Card:
```
Incoming admit card data: { ... }
Creating admit card with data: { ... }
```

### On Update:
```
Updating job with data: { ... }
Job updated with dynamic content: {
  hasDynamicContent: true,
  hasContentSections: true
}
```

---

## Testing Checklist

- [ ] Create job WITHOUT dynamic content (basic fields only)
- [ ] Create job WITH physical standards (UP Police example)
- [ ] Create job WITH exam pattern (SSC CGL example)
- [ ] Create job WITH content sections
- [ ] Update job to ADD dynamic content
- [ ] Update job to MODIFY existing dynamic content
- [ ] Create admit card WITHOUT dynamic content
- [ ] Create admit card WITH dynamic content
- [ ] Get all jobs and verify dynamic content is returned
- [ ] Get single job by ID and verify complete data
