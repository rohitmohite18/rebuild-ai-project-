const express = require('express');
const Shelter = require('../../database/models/Shelter');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (_req, res, next) => {
  try {
    const shelters = await Shelter.find({ isActive: true }).sort({ name: 1 });
    res.json({ shelters });
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const shelter = await Shelter.create({
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      capacity: req.body.capacity,
      occupied: req.body.occupied,
      contactPhone: req.body.contactPhone,
      amenities: req.body.amenities,
      isActive: req.body.isActive,
      createdBy: req.user._id,
    });
    res.status(201).json({ shelter });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return res.status(404).json({ message: 'Shelter not found' });
    }

    const allowed = [
      'name',
      'address',
      'city',
      'capacity',
      'occupied',
      'contactPhone',
      'amenities',
      'isActive',
    ];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        shelter[field] = req.body[field];
      }
    }

    await shelter.save();
    res.json({ shelter });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
