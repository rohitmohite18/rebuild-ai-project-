const express = require('express');
const Family = require('../../database/models/Family');
const Shelter = require('../../database/models/Shelter');
const Notification = require('../../database/models/Notification');
const { protect, isStaff } = require('../middleware/auth');
const { generateRecoveryId } = require('../utils/recoveryId');

const router = express.Router();

function canAccessFamily(user, family) {
  return isStaff(user) || String(family.createdBy) === String(user._id);
}

// A survivor has one active family record.  Keep this route before `/:id` so
// Express does not interpret "mine" as a MongoDB id.
router.get('/mine', protect, async (req, res, next) => {
  try {
    let family = await Family.findOne({ createdBy: req.user._id }).sort({ createdAt: -1 }).populate('shelter');
    if (!family) return res.json({ family: null });

    // Existing local databases can contain records created before recovery IDs
    // were introduced. Generate one the first time that record is opened.
    if (!family.recoveryId) {
      const recoveryId = await generateRecoveryId();
      await Family.collection.updateOne({ _id: family._id }, { $set: { recoveryId } });
      family = await Family.findById(family._id).populate('shelter');
    }

    res.json({ family });
  } catch (err) {
    next(err);
  }
});

router.patch('/mine/members', protect, async (req, res, next) => {
  try {
    const family = await Family.findOne({ createdBy: req.user._id }).sort({ createdAt: -1 });
    if (!family) return res.status(404).json({ message: 'Family not found' });
    family.members = req.body.members || [];
    await family.save();
    res.json({ family });
  } catch (err) {
    next(err);
  }
});

router.get('/', protect, async (req, res, next) => {
  try {
    if (!isStaff(req.user)) return res.status(403).json({ message: 'Forbidden' });
    const families = await Family.find().populate('shelter').sort({ createdAt: -1 });
    res.json({ families });
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const recoveryId = await generateRecoveryId();
    const family = await Family.create({
      recoveryId,
      familyName: req.body.familyName,
      contactPhone: req.body.contactPhone,
      location: req.body.location,
      members: req.body.members,
      status: req.body.status,
      notes: req.body.notes,
      createdBy: req.user._id,
    });

    await Notification.create({
      user: req.user._id,
      title: 'Family registered',
      message: `Recovery ID ${recoveryId} was created for ${family.familyName}.`,
      type: 'family',
      relatedId: family._id,
    });

    res.status(201).json({ family });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/allocate-shelter', protect, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const [family, shelter] = await Promise.all([Family.findById(req.params.id), Shelter.findById(req.body.shelterId)]);
    if (!family) return res.status(404).json({ message: 'Family not found' });
    if (!shelter || !shelter.isActive) return res.status(404).json({ message: 'Active shelter not found' });
    if (family.shelter && String(family.shelter) !== String(shelter._id)) {
      return res.status(400).json({ message: 'Family is already allocated to a shelter' });
    }
    if (!family.shelter && shelter.occupied >= shelter.capacity) {
      return res.status(400).json({ message: 'Shelter is at capacity' });
    }
    if (!family.shelter) {
      shelter.occupied += 1;
      await shelter.save();
    }
    family.shelter = shelter._id;
    family.status = 'sheltered';
    await family.save();
    await Notification.create({
      user: family.createdBy,
      title: 'Shelter allocated',
      message: `${shelter.name} has been allocated to your family.`,
      type: 'shelter',
      relatedId: family._id,
    });
    res.json({ family: await family.populate('shelter') });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }
    if (!canAccessFamily(req.user, family)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json({ family });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }
    if (!canAccessFamily(req.user, family)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const allowed = ['familyName', 'contactPhone', 'location', 'members', 'status', 'notes'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        family[field] = req.body[field];
      }
    }

    await family.save();
    res.json({ family });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
