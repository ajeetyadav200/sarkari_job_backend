const mongoose = require('mongoose');

/**
 * Dynamic Content Schema - Reusable for Jobs, Admit Cards, Results, etc.
 * Supports flexible type+value structure for various content types
 *
 * Examples:
 * - Physical Standards: { type: 'table', value: { male: {...}, female: {...} } }
 * - Selection Process: { type: 'list', value: ['Written', 'PET', 'PST'] }
 * - Instructions: { type: 'text', value: 'Read notification carefully' }
 * - Important Note: { type: 'alert', value: 'Last date extended', alertType: 'warning' }
 */

const dynamicContentItemSchema = new mongoose.Schema({
  // Type of content
  type: {
    type: String,
    required: true,
    enum: [
      // Text-based
      'label',           // Plain heading/label
      'text',            // Regular text paragraph
      'html',            // Raw HTML content
      'heading',         // Main heading (h1, h2 style)
      'subheading',      // Subheading

      // Interactive/Form elements
      'input',           // Text input field
      'textarea',        // Multi-line text area
      'radio',           // Radio button group
      'checkbox',        // Checkbox group
      'select',          // Dropdown/select

      // Data structures
      'list',            // Ordered/unordered list
      'table',           // Table data (e.g., physical standards, age limits)
      'json',            // Raw JSON data

      // Media
      'link',            // Hyperlink
      'image',           // Image URL
      'file',            // File/PDF download link
      'video',           // Video embed

      // Informational
      'date',            // Date information
      'number',          // Numeric data
      'alert',           // Alert/warning/info box
      'notice',          // Important notice
      'accordion',       // Collapsible content
      'tabs',            // Tab-based content

      // Special
      'divider',         // Horizontal line separator
      'spacer',          // Vertical spacing
      'card'             // Card/box container
    ]
  },

  // Single value (for most types)
  value: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Multiple values (for radio, checkbox, list, etc.)
  values: {
    type: [mongoose.Schema.Types.Mixed],
    default: undefined
  },

  // Label/title for the content
  label: {
    type: String,
    trim: true,
    default: ''
  },

  // Description or help text
  description: {
    type: String,
    trim: true,
    default: ''
  },

  // Additional metadata
  metadata: {
    // For alerts: 'info', 'warning', 'error', 'success'
    alertType: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },

    // For lists: 'ordered', 'unordered'
    listType: { type: String, enum: ['ordered', 'unordered'], default: 'unordered' },

    // For links/files
    url: String,
    urlText: String,
    openInNewTab: { type: Boolean, default: true },

    // For images
    imageUrl: String,
    imageAlt: String,
    imageCaption: String,

    // For tables
    tableHeaders: [String],
    tableRows: [mongoose.Schema.Types.Mixed],
    tableCaption: String,

    // For styling
    className: String,
    style: String,

    // For accordions/tabs
    items: [mongoose.Schema.Types.Mixed],

    // Generic additional data
    extra: mongoose.Schema.Types.Mixed
  },

  // Is this field required for frontend validation
  required: {
    type: Boolean,
    default: false
  },

  // Display order
  order: {
    type: Number,
    default: 0
  },

  // Visibility flag
  isVisible: {
    type: Boolean,
    default: true
  },

  // Section/category for grouping
  section: {
    type: String,
    trim: true,
    default: 'general'
  }
}, { _id: false });

/**
 * Section Schema - For organizing dynamic content into sections
 */
const contentSectionSchema = new mongoose.Schema({
  sectionId: {
    type: String,
    required: true,
    trim: true
  },

  sectionTitle: {
    type: String,
    required: true,
    trim: true
  },

  sectionDescription: {
    type: String,
    trim: true,
    default: ''
  },

  order: {
    type: Number,
    default: 0
  },

  isCollapsible: {
    type: Boolean,
    default: false
  },

  isExpandedByDefault: {
    type: Boolean,
    default: true
  },

  icon: {
    type: String,
    trim: true,
    default: ''
  },

  content: {
    type: [dynamicContentItemSchema],
    default: []
  }
}, { _id: false });

module.exports = {
  dynamicContentItemSchema,
  contentSectionSchema
};
