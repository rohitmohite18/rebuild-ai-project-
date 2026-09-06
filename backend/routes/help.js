const express = require('express');
const HelpRequest = require('../../database/models/HelpRequest');
const Family = require('../../database/models/Family');
const Notification = require('../../database/models/Notification');
const { protect, isStaff } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, async (req, res, next) => {
  try {
    const { family: familyId, category, description } = req.body;
    if (familyId) {
      const family = await Family.findById(familyId);
      if (!family) {
        return res.status(404).json({ message: 'Family not found' });
      }
      const ownsFamily = String(family.createdBy) === String(req.user._id);
      if (!ownsFamily && !isStaff(req.user)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const help = await HelpRequest.create({
      family: familyId,
      requestedBy: req.user._id,
      category,
      description,
    });

    await Notification.create({
      user: req.user._id,
      title: 'Help request submitted',
      message: `Your ${category || 'help'} request is open.`,
      type: 'help',
      relatedId: help._id,
    });

    res.status(201).json({ help });
  } catch (err) {
    next(err);
  }
});

router.get('/', protect, async (req, res, next) => {
  try {
    const filter = isStaff(req.user) ? {} : { requestedBy: req.user._id };
    const help = await HelpRequest.find(filter)
      .populate('family', 'familyName recoveryId')
      .sort({ createdAt: -1 });
    res.json({ help });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const help = await HelpRequest.findById(req.params.id);
    if (!help) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    const isOwner = String(help.requestedBy) === String(req.user._id);
    if (!isOwner && !isStaff(req.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (req.body.status !== undefined) {
      if (!isStaff(req.user) && req.body.status !== 'cancelled') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      help.status = req.body.status;
    }

    if (req.body.assignedTo !== undefined) {
      if (!isStaff(req.user)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      help.assignedTo = req.body.assignedTo;
    }

    if (req.body.description !== undefined && isOwner) {
      help.description = req.body.description;
    }

    if (req.body.category !== undefined && isOwner) {
      help.category = req.body.category;
    }

    await help.save();

    if (req.body.status) {
      await Notification.create({
        user: help.requestedBy,
        title: 'Help request updated',
        message: `Status is now ${help.status}.`,
        type: 'help',
        relatedId: help._id,
      });
    }

    res.json({ help });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
