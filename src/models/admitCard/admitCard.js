// const mongoose = require('mongoose');

// const admitCardSchema = new mongoose.Schema(
//   {
//     type: {
//       type: String,
//       enum: ["job", "admission", "latestNotice", "other"],
//       required: true,
//     },

//     referenceId: {
//       type: mongoose.Schema.Types.ObjectId,
//       refPath: "referenceModel",
//       required: false,
//     },

//     referenceModel: {
//       type: String,
//       enum: ["Job", "Admission", "LatestNotice", "OtherModel"],
//       required: false,
//     },

//     directWebURL: {
//       type: String,
//       trim: true,
//     },

//     linkMenuField: {
//       type: String,
//       trim: true,
//     },

//     postTypeDetails: {
//       type: String,
//       trim: true,
//     },

//     alsoShowLink: {
//       type: Boolean,
//       default: false,
//     },

//     postDetails: {
//       type: String,
//       required: true,
//     },

//     publishDate: {
//       type: Date,
//       default: Date.now,
//     },

//     lastDate: {
//       type: Date,
//     },

//     status: {
//       type: String,
//       enum: ["pending", "verified", "rejected", "onHold"],
//       default: "pending",
//     },

//     admitCardStatus: {
//       type: String,
//       enum: ["active", "inactive"],
//       required: true,
//       default: "active",
//     },

//     verifiedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },

//     verifiedAt: {
//       type: Date,
//     },

//     rejectionReason: {
//       type: String,
//       trim: true,
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     tags: [
//       {
//         type: String,
//         trim: true,
//       },
//     ],

//     category: {
//       type: String,
//       trim: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("AdmitCard", admitCardSchema);



const mongoose = require('mongoose');


const admitCardSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["job", "admission", "latestNotice", "other"],
      required: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel",
      required: false,
    },

    referenceModel: {
      type: String,
      enum: ["Job", "Admission", "LatestNotice", "OtherModel"],
      required: false,
    },

    directWebURL: {
      type: String,
      trim: true,
    },

    linkMenuField: {
      type: String,
      trim: true,
    },

    postTypeDetails: {
      type: String,
      trim: true,
    },

    alsoShowLink: {
      type: Boolean,
      default: false,
    },

    postDetails: {
      type: String,
      required: true,
    },

    publishDate: {
      type: Date,
      default: Date.now,
    },

    lastDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "onHold"],
      default: "pending",
    },

    admitCardStatus: {
      type: String,
      enum: ["active", "inactive"],
      required: true,
      default: "active",
    },

    // -------------------------------
    // USER WHO CREATED THE ADMIT CARD
    // -------------------------------
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdByDetails: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      role: { type: String, trim: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },

    // -------------------------------
    // USER WHO VERIFIED THE ADMIT CARD
    // -------------------------------
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verifiedByDetails: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      role: { type: String, trim: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },

    verifiedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    category: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AdmitCard", admitCardSchema);
