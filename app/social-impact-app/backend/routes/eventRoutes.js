const express = require('express');
const router = express.Router();
const {
  getEvents, createEvent, getEventById,
  updateEvent, deleteEvent, joinEvent,
  leaveEvent, addComment, getComments,
  handleJoinRequest, getNearbyEvents,
  cancelEvent, getCreatedEvents, getJoinedEvents
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getEvents);
router.get('/nearby', getNearbyEvents);
router.get('/user/created', protect, getCreatedEvents);
router.get('/user/joined', protect, getJoinedEvents);
router.post('/', protect, createEvent);
router.get('/:id', getEventById);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.post('/:id/join', protect, joinEvent);
router.delete('/:id/join', protect, leaveEvent);
router.post('/:id/comments', protect, addComment);
router.get('/:id/comments', getComments);
router.put('/:id/requests/:userId', protect, handleJoinRequest);
router.put('/:id/cancel', protect, cancelEvent);

module.exports = router;