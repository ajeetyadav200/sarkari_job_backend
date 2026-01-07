# Answer Key Management API Documentation

## Overview
This API provides comprehensive answer key management functionality for SSC, UPSC, Railway, Banking, and other government exam answer keys. It includes dynamic file upload capabilities using Cloudinary and Multer.

## Setup Requirements

### 1. Install Required Packages
```bash
npm install cloudinary multer
```

### 2. Environment Variables
Add these to your `.env` file:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## API Endpoints

### Public Endpoints (No Authentication)

#### 1. Get All Answers
```
GET /api/answers
```
**Query Parameters:**
- `status` - Filter by status (pending, verified, rejected, onHold)
- `examType` - Filter by exam type (ssc, upsc, railway, banking, etc.)
- `category` - Filter by category (government, private, semi-government)
- `keyword` - Search by keyword
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sortBy` - Sort field (default: createdAt)
- `order` - Sort order (asc, desc)

**Example:**
```bash
GET /api/answers?examType=ssc&keyword=delhi&page=1&limit=20
```

#### 2. Get Answers List (with Date Filters & Infinite Scroll)
```
GET /api/answers/list
```
**Query Parameters:**
- `year` - Filter by year
- `month` - Filter by month (1-12)
- `date` - Filter by date
- `keyword` - Search keyword
- `isLatest` - Filter latest answers (true/false)
- `examType` - Filter by exam type
- `page` - Page number
- `limit` - Items per page

**Example:**
```bash
GET /api/answers/list?year=2025&month=1&isLatest=true&page=1
```

#### 3. Get Latest Answers
```
GET /api/answers/latest?limit=10
```

#### 4. Search Answers
```
GET /api/answers/search?keyword=driver&examType=ssc
```

#### 5. Get Answer by ID
```
GET /api/answers/:id
```

### Protected Endpoints (Authentication Required)

#### 6. Get My Answers
```
GET /api/answers/my/answers
Authorization: Bearer <token>
```

### Publisher/Assistant/Admin Endpoints

#### 7. Create Answer (with File Upload)
```
POST /api/answers
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data Fields:**
```javascript
{
  // Basic Information
  "title": "SSC Delhi Police Driver Answer Key 2025",
  "organizationName": "Staff Selection Commission (SSC)",
  "postName": "Driver",
  "examName": "SSC Delhi Police Driver Exam 2025",
  "category": "government",
  "examType": "ssc",
  "state": "Delhi",

  // Post/Vacancy Details
  "totalPosts": 1200,
  "categoryPosts": {
    "general": 500,
    "obc": 300,
    "sc": 200,
    "st": 100,
    "ews": 80,
    "ph": 20
  },

  // Application Fee
  "applicationFee": {
    "general": 100,
    "obc": 100,
    "sc": 0,
    "st": 0,
    "ews": 0,
    "ph": 0
  },

  // Age Limit
  "ageLimit": {
    "minimumAge": 18,
    "maximumAge": 27,
    "ageCalculationDate": "2025-01-01",
    "relaxation": "5 years for SC/ST, 3 years for OBC"
  },

  // Important Dates
  "importantDates": {
    "applicationStartDate": "2025-01-01",
    "applicationEndDate": "2025-01-31",
    "examDate": "2025-03-15",
    "answerKeyDate": "2025-03-20",
    "objectionStartDate": "2025-03-21",
    "objectionEndDate": "2025-03-25",
    "revisedAnswerKeyDate": "2025-03-30",
    "resultDate": "2025-04-15"
  },

  // Eligibility
  "eligibilityEducational": "10th Pass from recognized board",
  "eligibilityNationality": "Indian Citizen",

  // Selection Mode
  "selectionMode": ["Written Exam", "Driving Test", "Medical Test"],

  // Links
  "officialWebsite": "https://ssc.nic.in",
  "applyLink": "https://ssc.nic.in/apply",
  "answerKeyLink": "https://ssc.nic.in/answerkey",
  "admitCardLink": "https://ssc.nic.in/admitcard",
  "resultLink": "https://ssc.nic.in/result",

  // Contact
  "helpEmailId": "help@ssc.nic.in",
  "helpCareNo": "011-12345678",

  // Content
  "shortDescription": "SSC Delhi Police Driver recruitment 2025 - Apply for 1200 posts",
  "description": "Detailed description here...",

  // Other Details
  "modeOfApplication": "online",
  "modeOfExam": "offline",
  "paymentMode": "paid",
  "isLatest": true,
  "isFeatured": true,
  "showInPortal": true,

  // Important Links
  "importantLinks": [
    {
      "linkName": "Official Notification",
      "linkUrl": "https://ssc.nic.in/notification.pdf",
      "isActive": true
    },
    {
      "linkName": "Apply Online",
      "linkUrl": "https://ssc.nic.in/apply",
      "isActive": true
    }
  ],

  // FAQs
  "faqs": [
    {
      "question": "What is the application fee?",
      "answer": "Rs. 100 for General/OBC, Free for SC/ST/PH"
    },
    {
      "question": "What is the age limit?",
      "answer": "18-27 years with relaxation for reserved categories"
    }
  ],

  // FILE UPLOADS (Dynamic)
  // Each file field should have a corresponding _name field for custom naming

  "officialNotification": <File>,
  "officialNotification_name": "SSC Delhi Police Driver Notification 2025",

  "examDateNotice": <File>,
  "examDateNotice_name": "Exam Date Notice",

  "syllabusFile": <File>,
  "syllabusFile_name": "Syllabus & Exam Pattern",

  "admitCardFile": <File>,
  "admitCardFile_name": "Sample Admit Card",

  "answerKeyFile": <File>,
  "answerKeyFile_name": "Official Answer Key 2025",

  "resultFile": <File>,
  "resultFile_name": "Result PDF",

  "otherFiles": [<File1>, <File2>],
  "otherFiles_name": "Additional Documents"
}
```

**Example using FormData (JavaScript):**
```javascript
const formData = new FormData();

// Add text fields
formData.append('title', 'SSC Delhi Police Driver Answer Key 2025');
formData.append('organizationName', 'Staff Selection Commission');
formData.append('examType', 'ssc');
formData.append('isLatest', true);

// Add nested objects as JSON strings
formData.append('categoryPosts', JSON.stringify({
  general: 500,
  obc: 300,
  sc: 200
}));

formData.append('importantDates', JSON.stringify({
  examDate: '2025-03-15',
  answerKeyDate: '2025-03-20'
}));

// Add files with custom names
formData.append('answerKeyFile', answerKeyFile);
formData.append('answerKeyFile_name', 'Official Answer Key 2025');

formData.append('officialNotification', notificationFile);
formData.append('officialNotification_name', 'SSC Notification PDF');

// Send request
const response = await fetch('/api/answers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

#### 8. Update Answer (with File Upload)
```
PUT /api/answers/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
Same fields as Create Answer. Files can be updated individually.

#### 9. Delete Answer
```
DELETE /api/answers/:id
Authorization: Bearer <token>
```

#### 10. Upload Single File to Existing Answer
```
POST /api/answers/:id/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```javascript
{
  "file": <File>,
  "fileName": "Custom File Name",
  "fileFieldName": "answerKeyFile" // Optional: officialNotification, examDateNotice, etc.
}
```

#### 11. Delete File from Answer
```
DELETE /api/answers/:id/files/:fileId
Authorization: Bearer <token>
```

### Admin Only Endpoints

#### 12. Change Answer Status
```
PATCH /api/answers/:id/status
Authorization: Bearer <token>
```

**Body:**
```json
{
  "status": "verified",
  "remark": "Approved and published",
  "rejectionReason": "" // Required if status is "rejected"
}
```

#### 13. Get Answer Statistics
```
GET /api/answers/admin/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAnswers": 150,
    "totalViews": 45000,
    "statusWise": [
      { "_id": "verified", "count": 120 },
      { "_id": "pending", "count": 25 },
      { "_id": "rejected", "count": 5 }
    ],
    "examTypeStats": [
      { "_id": "ssc", "count": 50 },
      { "_id": "railway", "count": 30 }
    ],
    "categoryStats": [
      { "_id": "government", "count": 140 },
      { "_id": "private", "count": 10 }
    ],
    "recentAnswers": [...]
  }
}
```

## File Upload Details

### Supported File Types
- PDF (.pdf)
- Images (.jpg, .jpeg, .png)
- Documents (.doc, .docx)

### File Size Limit
- Maximum 10MB per file

### File Fields
1. **officialNotification** - Official notification PDF
2. **examDateNotice** - Exam date notice
3. **syllabusFile** - Syllabus and exam pattern
4. **admitCardFile** - Admit card sample/download
5. **answerKeyFile** - Official answer key
6. **resultFile** - Result PDF
7. **otherFiles** - Other supporting documents (max 5 files)

### Dynamic File Naming
Each file upload can have a custom name by including a corresponding `_name` field:
```javascript
formData.append('answerKeyFile', file);
formData.append('answerKeyFile_name', 'SSC Delhi Police Answer Key 2025');
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Answer created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "SSC Delhi Police Driver Answer Key 2025",
    "organizationName": "Staff Selection Commission",
    "uploadedFiles": [
      {
        "fileName": "Official Answer Key 2025",
        "fileUrl": "https://res.cloudinary.com/...",
        "cloudinaryId": "answer-keys/abc123",
        "fileType": "pdf",
        "uploadedAt": "2025-01-07T10:00:00.000Z"
      }
    ],
    ...
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Failed to create answer",
  "error": "Detailed error message"
}
```

## Enums

### Answer Status
- `pending` - Newly created, awaiting verification
- `verified` - Approved and published
- `rejected` - Rejected by admin
- `onHold` - Temporarily on hold

### Category
- `government` - Government organization
- `private` - Private organization
- `semi-government` - Semi-government organization

### Exam Type
- `ssc` - Staff Selection Commission
- `upsc` - Union Public Service Commission
- `railway` - Railway Recruitment Board
- `banking` - Banking exams (IBPS, SBI, etc.)
- `state-govt` - State government exams
- `police` - Police recruitment
- `teaching` - Teaching exams (CTET, TET, etc.)
- `defense` - Defense exams
- `psu` - Public Sector Undertakings
- `other` - Other exam types

### Mode of Application
- `online` - Online application
- `offline` - Offline application
- `both` - Both online and offline

### Mode of Exam
- `online` - Online exam (CBT)
- `offline` - Offline exam (pen-paper)
- `both` - Both modes

### Payment Mode
- `free` - No application fee
- `paid` - Paid application
- `conditional` - Fee waiver for certain categories

## Features

### 1. Dynamic File Upload
- Upload multiple files with custom names
- Cloudinary integration for reliable file storage
- Support for various file formats
- Automatic file cleanup on errors

### 2. Comprehensive Search & Filter
- Search by keyword, exam type, category
- Date-based filtering (year, month, date)
- Latest/featured filters
- Pagination support

### 3. Role-Based Access Control
- Public endpoints for viewing
- Protected endpoints for creators
- Admin-only endpoints for verification

### 4. Advanced Features
- View counting
- Status management workflow
- Audit trail (creator and approver snapshots)
- FAQ and Important Links sections
- Dynamic content sections

### 5. Infinite Scroll Support
- Efficient pagination with `hasMore` flag
- Optimized queries for large datasets

## Example Usage

### Creating an Answer with Files (React/JavaScript)

```javascript
const createAnswer = async () => {
  const formData = new FormData();

  // Basic info
  formData.append('title', 'SSC Delhi Police Driver Answer Key 2025');
  formData.append('organizationName', 'Staff Selection Commission');
  formData.append('postName', 'Driver');
  formData.append('examType', 'ssc');
  formData.append('category', 'government');
  formData.append('state', 'Delhi');

  // Important dates (as JSON)
  formData.append('importantDates', JSON.stringify({
    examDate: '2025-03-15',
    answerKeyDate: '2025-03-20',
    resultDate: '2025-04-15'
  }));

  // Upload files
  formData.append('answerKeyFile', selectedFile);
  formData.append('answerKeyFile_name', 'Official Answer Key 2025');

  try {
    const response = await fetch('/api/answers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();
    console.log('Answer created:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Testing

### 1. Test File Upload
```bash
curl -X POST http://localhost:7777/api/answers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Answer Key" \
  -F "organizationName=Test Org" \
  -F "examType=ssc" \
  -F "answerKeyFile=@/path/to/file.pdf" \
  -F "answerKeyFile_name=Test Answer Key File"
```

### 2. Test Search
```bash
curl "http://localhost:7777/api/answers/search?keyword=delhi&examType=ssc"
```

### 3. Test Status Update
```bash
curl -X PATCH http://localhost:7777/api/answers/ANSWER_ID/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"verified","remark":"Approved"}'
```

## Notes

1. Always use `multipart/form-data` when uploading files
2. For nested objects (like `importantDates`, `ageLimit`), send as JSON strings
3. Files are automatically uploaded to Cloudinary and temporary files are cleaned up
4. Each file can have a custom display name using the `_name` suffix
5. The system is scalable and production-ready with proper error handling
6. All file operations include cleanup mechanisms to prevent storage leaks
