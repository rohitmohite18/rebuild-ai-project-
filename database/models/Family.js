const mongoose = require('../mongoose');

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 0, max: 120 },
    relation: { type: String, trim: true },
    status: {
      type: String,
      enum: ['safe', 'missing', 'injured', 'unknown'],
      default: 'unknown',
    },
  },
  { _id: false }
);

const familySchema = new mongoose.Schema(
  {
    recoveryId: {
      type: String,
      required: true,
      unique: true,
      match: [/^RB-\d{4}-\d{5}$/, 'Recovery ID must be RB-YYYY-XXXXX'],
    },
    familyName: {
      type: String,
      required: [true, 'Family name is required'],
      trim: true,
      maxlength: 120,
    },
    contactPhone: { type: String, trim: true },
    location: {
      address: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['displaced', 'sheltered', 'reunited'],
      default: 'displaced',
    },
    notes: { type: String, trim: true, maxlength: 2000 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shelter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shelter',
    },
  },
  { timestamps: true }
);

familySchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Family', familySchema);
