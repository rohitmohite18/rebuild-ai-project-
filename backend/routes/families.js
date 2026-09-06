const express = require('express');
const Family = require('../../database/models/Family');
const Notification = require('../../database/models/Notification');
const { protect, isStaff } = require('../middleware/auth');
const { generateRecoveryId } = require('../utils/recoveryId');

const router = express.Router();

function canAccessFamily(user, family) {
  return isStaff(user) || String(family.createdBy) === String(user._id);
}

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
