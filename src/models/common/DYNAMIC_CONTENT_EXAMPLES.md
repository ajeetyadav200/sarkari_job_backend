# Dynamic Content Examples

This document shows how to use the dynamic content feature for different job types.

## Table of Contents
1. [UP Police Physical Standards](#up-police-physical-standards)
2. [SSC CGL Selection Process](#ssc-cgl-selection-process)
3. [Railway Exam Centers](#railway-exam-centers)
4. [Bank PO Document Requirements](#bank-po-document-requirements)
5. [Admit Card Instructions](#admit-card-instructions)

---

## UP Police Physical Standards

### Example 1: Physical Standards Table

```javascript
{
  "dynamicContent": [
    {
      "type": "heading",
      "value": "Physical Standard Test (PST)",
      "order": 1
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
        "tableCaption": "Minimum height requirements for UP Police"
      },
      "order": 2
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
      "order": 3
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
      "order": 4
    },
    {
      "type": "alert",
      "value": "Candidates who fail in PST will be disqualified immediately",
      "metadata": {
        "alertType": "warning"
      },
      "order": 5
    }
  ]
}
```

---

## SSC CGL Selection Process

### Example 2: Selection Process (No Physical Tests)

```javascript
{
  "dynamicContent": [
    {
      "type": "heading",
      "value": "Selection Process",
      "order": 1
    },
    {
      "type": "list",
      "label": "Examination Stages",
      "values": [
        "Tier-I: Computer Based Examination",
        "Tier-II: Computer Based Examination",
        "Tier-III: Descriptive Paper (Pen & Paper Mode)",
        "Tier-IV: Computer Proficiency Test / Skill Test"
      ],
      "metadata": {
        "listType": "ordered"
      },
      "order": 2
    },
    {
      "type": "table",
      "label": "Exam Pattern - Tier I",
      "metadata": {
        "tableHeaders": ["Subject", "Questions", "Marks", "Duration"],
        "tableRows": [
          ["General Intelligence", "25", "50", "60 min"],
          ["General Awareness", "25", "50", "60 min"],
          ["Quantitative Aptitude", "25", "50", "60 min"],
          ["English Comprehension", "25", "50", "60 min"]
        ],
        "tableCaption": "Total: 100 Questions, 200 Marks"
      },
      "order": 3
    },
    {
      "type": "notice",
      "value": "There will be negative marking of 0.50 marks for each wrong answer",
      "metadata": {
        "alertType": "info"
      },
      "order": 4
    }
  ],

  "selectionProcess": [
    "Tier-I Exam",
    "Tier-II Exam",
    "Tier-III Descriptive Paper",
    "Document Verification",
    "Final Merit List"
  ]
}
```

---

## Railway Exam Centers

### Example 3: Admit Card with Exam Centers

```javascript
{
  "type": "Admission",
  "dynamicContent": [
    {
      "type": "heading",
      "value": "RRB NTPC Exam Centers - Zone wise",
      "order": 1
    },
    {
      "type": "accordion",
      "label": "Exam Centers by State",
      "metadata": {
        "items": [
          {
            "title": "Uttar Pradesh",
            "content": "Lucknow, Kanpur, Varanasi, Allahabad, Agra, Meerut"
          },
          {
            "title": "Maharashtra",
            "content": "Mumbai, Pune, Nagpur, Nashik, Aurangabad"
          },
          {
            "title": "Delhi NCR",
            "content": "New Delhi, Noida, Ghaziabad, Faridabad, Gurgaon"
          }
        ]
      },
      "order": 2
    }
  ],

  "examCenters": [
    {
      "centerName": "St. Xavier's College",
      "centerCode": "CTR001",
      "address": "5, Mahapalika Marg, Mumbai",
      "city": "Mumbai",
      "state": "Maharashtra"
    },
    {
      "centerName": "Delhi Public School",
      "centerCode": "CTR002",
      "address": "Mathura Road, New Delhi",
      "city": "New Delhi",
      "state": "Delhi"
    }
  ],

  "importantInstructions": [
    "Candidates must report at the exam center 30 minutes before exam time",
    "Original Photo ID proof is mandatory",
    "Mobile phones and electronic devices are strictly prohibited",
    "No candidate will be allowed after gate closing time"
  ]
}
```

---

## Bank PO Document Requirements

### Example 4: Document Checklist

```javascript
{
  "dynamicContent": [
    {
      "type": "heading",
      "value": "Documents Required for Verification",
      "order": 1
    },
    {
      "type": "text",
      "value": "Candidates must bring the following documents in original along with one self-attested photocopy:",
      "order": 2
    },
    {
      "type": "checkbox",
      "label": "Educational Documents",
      "values": [
        "10th Class Mark Sheet and Certificate",
        "12th Class Mark Sheet and Certificate",
        "Graduation Degree and Mark Sheets (All Semesters/Years)",
        "Post Graduation Degree (if applicable)"
      ],
      "order": 3
    },
    {
      "type": "checkbox",
      "label": "Identity Proof",
      "values": [
        "Aadhaar Card",
        "PAN Card",
        "Passport (if available)",
        "Driving License (if available)"
      ],
      "order": 4
    },
    {
      "type": "checkbox",
      "label": "Category/Caste Certificate",
      "values": [
        "SC/ST Certificate (issued by competent authority)",
        "OBC-NCL Certificate (issued within last 6 months)",
        "EWS Certificate (issued within current financial year)"
      ],
      "order": 5
    },
    {
      "type": "alert",
      "value": "Candidates failing to produce original documents will not be allowed to appear for interview",
      "metadata": {
        "alertType": "error"
      },
      "order": 6
    }
  ],

  "documentsRequired": [
    "10th Certificate",
    "12th Certificate",
    "Graduation Degree",
    "Caste Certificate (if applicable)",
    "Photo ID Proof",
    "Recent Passport Size Photographs"
  ]
}
```

---

## Admit Card Instructions

### Example 5: Comprehensive Admit Card

```javascript
{
  "type": "Job",
  "referenceId": "6123456789abcdef12345678",
  "referenceModel": "Job",

  "contentSections": [
    {
      "sectionId": "general_instructions",
      "sectionTitle": "General Instructions",
      "sectionDescription": "Please read carefully before exam",
      "order": 1,
      "isCollapsible": true,
      "isExpandedByDefault": true,
      "content": [
        {
          "type": "list",
          "values": [
            "Bring this admit card and original photo ID to exam center",
            "Report at center 30 minutes before exam time",
            "Late entry will not be permitted under any circumstances",
            "Rough sheets will be provided at the center"
          ],
          "metadata": {
            "listType": "ordered"
          }
        }
      ]
    },
    {
      "sectionId": "prohibited_items",
      "sectionTitle": "Prohibited Items",
      "sectionDescription": "Items not allowed in examination hall",
      "order": 2,
      "isCollapsible": true,
      "content": [
        {
          "type": "alert",
          "value": "Following items are strictly prohibited:",
          "metadata": {
            "alertType": "warning"
          }
        },
        {
          "type": "list",
          "values": [
            "Mobile phones, smartwatches, calculators",
            "Books, notes, written material",
            "Electronic devices of any kind",
            "Bags, purses (except small transparent wallet)"
          ],
          "metadata": {
            "listType": "unordered"
          }
        }
      ]
    },
    {
      "sectionId": "exam_pattern",
      "sectionTitle": "Examination Pattern",
      "order": 3,
      "isCollapsible": true,
      "content": [
        {
          "type": "table",
          "metadata": {
            "tableHeaders": ["Subject", "Questions", "Marks", "Time"],
            "tableRows": [
              ["Reasoning", "35", "35", "20 min"],
              ["English", "30", "30", "20 min"],
              ["Quantitative Aptitude", "35", "35", "20 min"]
            ],
            "tableCaption": "Total: 100 Questions, 100 Marks, 60 Minutes"
          }
        }
      ]
    }
  ],

  "downloadLinks": [
    {
      "title": "Download Admit Card PDF",
      "url": "https://example.com/admit-cards/12345.pdf",
      "fileType": "PDF",
      "description": "Main admit card with roll number and exam details",
      "isActive": true
    },
    {
      "title": "Exam Instructions",
      "url": "https://example.com/instructions.pdf",
      "fileType": "PDF",
      "description": "Detailed instructions for candidates",
      "isActive": true
    }
  ]
}
```

---

## Using Sections vs Flat Dynamic Content

### When to use `contentSections`:
- Complex admit cards/jobs with multiple distinct sections
- Need collapsible/expandable sections
- Want to organize content into categories

### When to use flat `dynamicContent`:
- Simple, linear content
- Small amount of information
- Don't need section organization

### Example: Both Together

```javascript
{
  // Simple quick arrays for basic info
  "importantInstructions": [
    "Bring admit card",
    "Bring photo ID",
    "No mobile phones"
  ],

  "documentsRequired": [
    "Admit Card",
    "Photo ID",
    "Photograph"
  ],

  // Flat dynamic content for simple items
  "dynamicContent": [
    {
      "type": "alert",
      "value": "Gate closes 15 minutes before exam start time",
      "metadata": { "alertType": "warning" }
    }
  ],

  // Organized sections for complex content
  "contentSections": [
    {
      "sectionId": "physical_standards",
      "sectionTitle": "Physical Standards",
      "content": [
        // Physical test details here
      ]
    },
    {
      "sectionId": "written_exam",
      "sectionTitle": "Written Examination",
      "content": [
        // Exam pattern details here
      ]
    }
  ]
}
```

---

## API Usage

### Creating a Job with Dynamic Content

```javascript
POST /api/jobs

{
  "departmentName": "Uttar Pradesh Police",
  "postName": "Constable Recruitment 2024",
  "totalPost": 5000,
  "modeOfForm": "online",
  "typeOfForm": "government",
  "paymentMode": "paid",

  // ... other required fields ...

  "dynamicContent": [
    {
      "type": "heading",
      "value": "Physical Standard Test",
      "order": 1
    },
    {
      "type": "table",
      "label": "Height Requirements",
      "metadata": {
        "tableHeaders": ["Category", "Male", "Female"],
        "tableRows": [
          ["General", "168 cm", "152 cm"],
          ["ST", "160 cm", "147 cm"]
        ]
      },
      "order": 2
    }
  ]
}
```

### Creating an Admit Card with Dynamic Content

```javascript
POST /api/admit-cards

{
  "type": "Job",
  "referenceId": "6123...",
  "referenceModel": "Job",

  "dynamicContent": [
    {
      "type": "list",
      "label": "Important Instructions",
      "values": [
        "Report 30 min early",
        "Bring original ID",
        "No mobile phones"
      ]
    }
  ],

  "examCenters": [
    {
      "centerName": "ABC School",
      "centerCode": "CTR001",
      "city": "Mumbai",
      "state": "Maharashtra"
    }
  ]
}
```
