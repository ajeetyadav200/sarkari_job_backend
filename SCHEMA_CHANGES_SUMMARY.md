# Schema Changes Summary - Dynamic Content Feature

## 🎯 What Changed

Added flexible dynamic content support to **Job** and **Admit Card** schemas to handle different requirements for different job types (e.g., UP Police needs physical standards, SSC CGL doesn't).

---

## 📁 Files Created/Modified

### New Files:
1. **`src/models/common/dynamicContentSchema.js`**
   - Reusable schema for dynamic content
   - Supports 25+ content types (table, list, alert, link, etc.)
   - Used by both Job and Admit Card schemas

2. **`src/models/common/DYNAMIC_CONTENT_EXAMPLES.md`**
   - Complete examples for different job types
   - UP Police (with physical standards)
   - SSC CGL (without physical standards)
   - Railway exam centers
   - Bank PO documents
   - Admit card instructions

### Modified Files:
1. **`src/models/job/letestJob.js`**
   - Added `dynamicContent` array
   - Added `contentSections` for organized content
   - Added quick arrays: `selectionProcess`, `documentsRequired`, `importantInstructions`

2. **`src/models/admitCard/admitCard.js`**
   - Added `dynamicContent` array
   - Added `contentSections` for organized content
   - Added `examCenters` array
   - Added `downloadLinks` array
   - Added `importantInstructions` and `documentsRequired` arrays

---

## 🔥 Key Features

### 1. Type + Value Structure
Each dynamic content item has:
```javascript
{
  type: 'table',           // What kind of content
  value: { ... },          // The actual content
  label: 'Height Req.',    // Optional label
  metadata: { ... },       // Additional data
  order: 1                 // Display order
}
```

### 2. Supported Content Types

**Text-based:**
- `label`, `text`, `html`, `heading`, `subheading`

**Interactive:**
- `input`, `textarea`, `radio`, `checkbox`, `select`

**Data structures:**
- `list`, `table`, `json`

**Media:**
- `link`, `image`, `file`, `video`

**Informational:**
- `date`, `number`, `alert`, `notice`, `accordion`, `tabs`

**Special:**
- `divider`, `spacer`, `card`

### 3. Three Ways to Store Content

#### A. Simple Arrays (Quick & Easy)
```javascript
{
  "selectionProcess": ["Written Exam", "Interview", "Medical"],
  "documentsRequired": ["10th Certificate", "ID Proof"],
  "importantInstructions": ["Bring ID", "No phones"]
}
```

#### B. Dynamic Content Array (Flexible)
```javascript
{
  "dynamicContent": [
    {
      "type": "heading",
      "value": "Physical Test"
    },
    {
      "type": "table",
      "metadata": {
        "tableHeaders": ["Category", "Height"],
        "tableRows": [["General", "168 cm"]]
      }
    }
  ]
}
```

#### C. Content Sections (Organized)
```javascript
{
  "contentSections": [
    {
      "sectionId": "physical_test",
      "sectionTitle": "Physical Standards",
      "isCollapsible": true,
      "content": [
        { "type": "table", ... }
      ]
    }
  ]
}
```

---

## 📝 Real-World Examples

### Example 1: UP Police (with Physical Standards)

```javascript
const upPoliceJob = {
  departmentName: "Uttar Pradesh Police",
  postName: "Constable",
  totalPost: 5000,

  dynamicContent: [
    {
      type: "heading",
      value: "Physical Standard Test"
    },
    {
      type: "table",
      label: "Height Requirements",
      metadata: {
        tableHeaders: ["Category", "Male (cm)", "Female (cm)"],
        tableRows: [
          ["General/OBC", "168", "152"],
          ["ST", "160", "147"]
        ]
      }
    },
    {
      type: "table",
      label: "Chest Measurements (Male)",
      metadata: {
        tableHeaders: ["Category", "Unexpanded", "Expanded", "Expansion"],
        tableRows: [
          ["General", "79 cm", "84 cm", "5 cm"]
        ]
      }
    },
    {
      type: "list",
      label: "Running Test",
      values: [
        "Male: 4.8 km in 28 minutes",
        "Female: 2.4 km in 16 minutes"
      ]
    }
  ],

  selectionProcess: ["PST/PET", "Written Exam", "Document Verification", "Medical"]
}
```

### Example 2: SSC CGL (No Physical Standards)

```javascript
const sscCglJob = {
  departmentName: "Staff Selection Commission",
  postName: "Combined Graduate Level",
  totalPost: 3000,

  dynamicContent: [
    {
      type: "heading",
      value: "Selection Process"
    },
    {
      type: "list",
      values: [
        "Tier-I: Computer Based Exam",
        "Tier-II: Computer Based Exam",
        "Tier-III: Descriptive Paper",
        "Document Verification"
      ],
      metadata: {
        listType: "ordered"
      }
    },
    {
      type: "table",
      label: "Exam Pattern - Tier I",
      metadata: {
        tableHeaders: ["Subject", "Questions", "Marks"],
        tableRows: [
          ["Reasoning", "25", "50"],
          ["English", "25", "50"],
          ["Maths", "25", "50"],
          ["GK", "25", "50"]
        ]
      }
    }
  ]
}
```

### Example 3: Admit Card with Exam Centers

```javascript
const admitCard = {
  type: "Job",
  referenceId: "job_id_here",

  examCenters: [
    {
      centerName: "Delhi Public School",
      centerCode: "DPS001",
      address: "Mathura Road",
      city: "New Delhi",
      state: "Delhi"
    }
  ],

  downloadLinks: [
    {
      title: "Download Admit Card",
      url: "https://example.com/admit.pdf",
      fileType: "PDF",
      isActive: true
    }
  ],

  importantInstructions: [
    "Report 30 minutes before exam",
    "Bring original photo ID",
    "No mobile phones allowed"
  ],

  dynamicContent: [
    {
      type: "alert",
      value: "Gate closes at 9:45 AM sharp",
      metadata: {
        alertType: "warning"
      }
    }
  ]
}
```

---

## 🚀 How to Use

### Creating a Job with Physical Standards

```javascript
POST /api/jobs
Content-Type: application/json

{
  "departmentName": "UP Police",
  "postName": "Constable",
  "totalPost": 5000,
  "modeOfForm": "online",
  "typeOfForm": "government",
  "paymentMode": "paid",
  "helpEmailId": "help@uppolice.gov.in",
  "officialWebsite": "https://uppolice.gov.in",
  "eligibilityEducational1": "12th Pass",

  // Dynamic physical standards
  "dynamicContent": [
    {
      "type": "table",
      "label": "Height Requirements",
      "metadata": {
        "tableHeaders": ["Category", "Male", "Female"],
        "tableRows": [
          ["General", "168 cm", "152 cm"]
        ]
      }
    }
  ]
}
```

### Updating Validation (Optional)

If you want to validate dynamic content, update your validation schema:

```javascript
// In admitCardValidation.js or jobValidation.js

const dynamicContentItemValidation = Joi.object({
  type: Joi.string().required(),
  value: Joi.any(),
  values: Joi.array().items(Joi.any()),
  label: Joi.string(),
  description: Joi.string(),
  metadata: Joi.object(),
  order: Joi.number(),
  isVisible: Joi.boolean()
});

// Add to your create/update validation
{
  dynamicContent: Joi.array().items(dynamicContentItemValidation),
  contentSections: Joi.array(),
  selectionProcess: Joi.array().items(Joi.string()),
  documentsRequired: Joi.array().items(Joi.string()),
  importantInstructions: Joi.array().items(Joi.string())
}
```

---

## ✅ Benefits

1. **Flexible**: Each job can have different fields
2. **Type-safe**: Predefined content types prevent errors
3. **Organized**: Sections help structure complex content
4. **Reusable**: Same schema for jobs, admit cards, results, etc.
5. **Frontend-friendly**: Easy to render with type-based components
6. **Backward Compatible**: Old jobs without dynamic content still work

---

## 🎨 Frontend Rendering Example (React)

```jsx
function DynamicContentRenderer({ content }) {
  return content.map((item, index) => {
    switch (item.type) {
      case 'heading':
        return <h2 key={index}>{item.value}</h2>

      case 'table':
        return (
          <table key={index}>
            <caption>{item.metadata?.tableCaption}</caption>
            <thead>
              <tr>
                {item.metadata?.tableHeaders?.map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {item.metadata?.tableRows?.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => <td key={j}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )

      case 'list':
        return (
          <div key={index}>
            {item.label && <h4>{item.label}</h4>}
            <ul>
              {item.values?.map((val, i) => (
                <li key={i}>{val}</li>
              ))}
            </ul>
          </div>
        )

      case 'alert':
        return (
          <div key={index} className={`alert alert-${item.metadata?.alertType}`}>
            {item.value}
          </div>
        )

      default:
        return <div key={index}>{item.value}</div>
    }
  })
}

// Usage
<DynamicContentRenderer content={job.dynamicContent} />
```

---

## 📊 Database Impact

- **Backward Compatible**: Existing jobs/admit cards work fine
- **No migration needed**: New fields have defaults
- **Flexible storage**: MongoDB handles Mixed types well
- **Query support**: Can still filter by other fields

---

## 🔄 Next Steps

1. ✅ Schemas updated (DONE)
2. ⏳ Update validation schemas (Optional)
3. ⏳ Update frontend to render dynamic content
4. ⏳ Add UI for creating dynamic content
5. ⏳ Add examples in admin panel

---

## 📞 Questions?

See `DYNAMIC_CONTENT_EXAMPLES.md` for complete examples of:
- UP Police with physical standards
- SSC CGL without physical tests
- Railway exam centers
- Bank PO documents
- Admit card instructions
