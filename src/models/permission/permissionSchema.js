const mongoose = require("mongoose");

/**
 * Permission Schema
 * Defines granular permissions that can be assigned to users
 */

// Available modules in the system
const MODULES = [
  'jobs',
  'admissions',
  'admit-cards',
  'answer-keys',
  'results',
  'government-services',
  'users',
  'cyber-cafe'
];

// Available actions for each module
const ACTIONS = ['create', 'read', 'update', 'delete', 'verify', 'publish'];

// Permission sub-schema for each module
const modulePermissionSchema = new mongoose.Schema({
  create: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
  verify: { type: Boolean, default: false },  // Can verify/approve content
  publish: { type: Boolean, default: false }  // Can publish content
}, { _id: false });

const permissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    // Module-wise permissions
    jobs: {
      type: modulePermissionSchema,
      default: () => ({})
    },
    admissions: {
      type: modulePermissionSchema,
      default: () => ({})
    },
    admitCards: {
      type: modulePermissionSchema,
      default: () => ({})
    },
    answerKeys: {
      type: modulePermissionSchema,
      default: () => ({})
    },
    results: {
      type: modulePermissionSchema,
      default: () => ({})
    },
    governmentServices: {
      type: modulePermissionSchema,
      default: () => ({})
    },
    users: {
      type: modulePermissionSchema,
      default: () => ({})
    },
    cyberCafe: {
      type: modulePermissionSchema,
      default: () => ({})
    },

    // Who assigned these permissions
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Notes/remarks about the permission assignment
    remarks: {
      type: String,
      maxlength: 500
    },

    // Is permission active
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for faster queries
permissionSchema.index({ userId: 1 });
permissionSchema.index({ isActive: 1 });

// Virtual to get user details
permissionSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Static method to get default permissions based on role
permissionSchema.statics.getDefaultPermissions = function(role) {
  const defaults = {
    admin: {
      jobs: { create: true, read: true, update: true, delete: true, verify: true, publish: true },
      admissions: { create: true, read: true, update: true, delete: true, verify: true, publish: true },
      admitCards: { create: true, read: true, update: true, delete: true, verify: true, publish: true },
      answerKeys: { create: true, read: true, update: true, delete: true, verify: true, publish: true },
      results: { create: true, read: true, update: true, delete: true, verify: true, publish: true },
      governmentServices: { create: true, read: true, update: true, delete: true, verify: true, publish: true },
      users: { create: true, read: true, update: true, delete: true, verify: true, publish: true },
      cyberCafe: { create: true, read: true, update: true, delete: true, verify: true, publish: true }
    },
    assistant: {
      jobs: { create: true, read: true, update: true, delete: false, verify: true, publish: false },
      admissions: { create: true, read: true, update: true, delete: false, verify: true, publish: false },
      admitCards: { create: true, read: true, update: true, delete: false, verify: true, publish: false },
      answerKeys: { create: true, read: true, update: true, delete: false, verify: true, publish: false },
      results: { create: true, read: true, update: true, delete: false, verify: true, publish: false },
      governmentServices: { create: true, read: true, update: true, delete: false, verify: true, publish: false },
      users: { create: false, read: true, update: false, delete: false, verify: false, publish: false },
      cyberCafe: { create: true, read: true, update: true, delete: false, verify: true, publish: false }
    },
    publisher: {
      jobs: { create: true, read: true, update: true, delete: false, verify: false, publish: false },
      admissions: { create: true, read: true, update: true, delete: false, verify: false, publish: false },
      admitCards: { create: true, read: true, update: true, delete: false, verify: false, publish: false },
      answerKeys: { create: true, read: true, update: true, delete: false, verify: false, publish: false },
      results: { create: true, read: true, update: true, delete: false, verify: false, publish: false },
      governmentServices: { create: true, read: true, update: true, delete: false, verify: false, publish: false },
      users: { create: false, read: false, update: false, delete: false, verify: false, publish: false },
      cyberCafe: { create: false, read: true, update: false, delete: false, verify: false, publish: false }
    }
  };

  return defaults[role] || defaults.publisher;
};

// Instance method to check if user has specific permission
permissionSchema.methods.hasPermission = function(module, action) {
  if (!this.isActive) return false;

  const modulePerms = this[module];
  if (!modulePerms) return false;

  return modulePerms[action] === true;
};

// Instance method to get all permissions as flat object
permissionSchema.methods.getAllPermissions = function() {
  const modules = ['jobs', 'admissions', 'admitCards', 'answerKeys', 'results', 'governmentServices', 'users', 'cyberCafe'];
  const permissions = {};

  modules.forEach(module => {
    permissions[module] = this[module] || {};
  });

  return permissions;
};

// Export constants for use in other files
module.exports = mongoose.model("Permission", permissionSchema);
module.exports.MODULES = MODULES;
module.exports.ACTIONS = ACTIONS;
