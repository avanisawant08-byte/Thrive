/**
 * Computes the real-time status of an event based on its date and duration.
 * Ignores the DB status field entirely — uses actual clock time as source of truth.
 *
 * @param {Object} event - event object with `date` and `duration` fields
 * @returns {'upcoming' | 'active' | 'completed'}
 */
export const getEventStatus = (event) => {
  if (event?.status === 'cancelled') return 'cancelled';
  if (event?.status === 'rejected') return 'rejected';
  if (event?.status === 'pending_approval' || event?.isApproved === false) return 'pending_approval';

  if (!event?.date) return 'upcoming';

  const now = new Date();
  const start = new Date(event.date);
  const durationMs = (event.duration || 1) * 60 * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);

  if (start > now) return 'upcoming';   // hasn't started yet
  if (end > now)   return 'active';     // currently running
  return 'completed';                    // finished
};

export const STATUS_STYLES = {
  upcoming:  {
    chip: 'bg-[#00b8ff]/10 text-[#00b8ff] border-[#00b8ff]/20',
    dot:  'bg-[#00b8ff]',
    label: 'Upcoming',
  },
  active: {
    chip: 'bg-[#00ff87]/10 text-[#00ff87] border-[#00ff87]/20',
    dot:  'bg-[#00ff87] animate-pulse',
    label: 'Active',
  },
  completed: {
    chip: 'bg-white/5 text-on-surface-variant border-white/10',
    dot:  'bg-on-surface-variant',
    label: 'Completed',
  },
  cancelled: {
    chip: 'bg-red-500/10 text-red-500 border-red-500/20',
    dot:  'bg-red-500',
    label: 'Cancelled',
  },
  rejected: {
    chip: 'bg-red-500/10 text-red-500 border-red-500/20',
    dot:  'bg-red-500',
    label: 'Rejected',
  },
  pending_approval: {
    chip: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    dot:  'bg-yellow-500',
    label: 'Pending Approval',
  }
};
