const express = require('express');
const User = require('../../database/models/User');
const Family = require('../../database/models/Family');
const HelpRequest = require('../../database/models/HelpRequest');
const Shelter = require('../../database/models/Shelter');
const Notification = require('../../database/models/Notification');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, authorize('admin'), async (_req, res, next) => {
  try {
    const [users, families, helpOpen, helpAssigned, helpFulfilled, shelters, unread] =
      await Promise.all([
        User.countDocuments(),
        Family.countDocuments(),
        HelpRequest.countDocuments({ status: 'open' }),
        HelpRequest.countDocuments({ status: 'assigned' }),
        HelpRequest.countDocuments({ status: 'fulfilled' }),
        Shelter.find().select('name capacity occupied isActive'),
        Notification.countDocuments({ read: false }),
      ]);

    const shelterCapacity = shelters.reduce((sum, s) => sum + s.capacity, 0);
    const shelterOccupied = shelters.reduce((sum, s) => sum + s.occupied, 0);

    res.json({
      dashboard: {
        users,
        families,
        helpRequests: {
          open: helpOpen,
          assigned: helpAssigned,
          fulfilled: helpFulfilled,
        },
        shelters: {
          count: shelters.length,
          capacity: shelterCapacity,
          occupied: shelterOccupied,
        },
        unreadNotifications: unread,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
