const express = require('express');
const router = express.Router();
const {
  getEvents, createEvent, getEventById,
  updateEvent, deleteEvent, joinEvent,
  leaveEvent, addComment, getComments
} = require('../controllers/eventController');
const { protect } = require('../controllers/authMiddleware');

router.get('/', getEvents);
router.post('/', protect, createEvent);
router.get('/:id', getEventById);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/join', protect, joinEvent);
router.delete('/:id/join', protect, leaveEvent);
router.post('/:id/comments', protect, addComment);
router.get('/:id/comments', getComments);

module.exports = router;