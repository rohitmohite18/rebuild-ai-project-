const mongoose = require('../mongoose');

const shelterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shelter name is required'],
      trim: true,
      maxlength: 150,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: { type: String, trim: true },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [0, 'Capacity cannot be negative'],
    },
    occupied: {
      type: Number,
      default: 0,
      min: [0, 'Occupied cannot be negative'],
    },
    contactPhone: { type: String, trim: true },
    amenities: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

shelterSchema.pre('validate', function checkOccupancy(next) {
  if (this.occupied > this.capacity) {
    this.invalidate('occupied', 'Occupied cannot exceed capacity');
  }
  next();
});

shelterSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Shelter', shelterSchema);
