export function computeOnTrackStatus(
  fundraiserDate: Date,
  goalPaise: number,
  raisedPaise: number,
  tasksTotal: number,
  tasksDone: number,
  hasOverdueTasks: boolean,
  now: Date = new Date()
): 'At risk' | 'Behind' | 'On track' {
  const msLeft = fundraiserDate.getTime() - now.getTime();
  const daysLeft = msLeft / (1000 * 60 * 60 * 24);
  const donePercent = tasksTotal > 0 ? (tasksDone / tasksTotal) * 100 : 100;

  if (hasOverdueTasks || (daysLeft <= 2 && daysLeft >= 0 && donePercent < 70)) {
    return 'At risk';
  }

  if (now > fundraiserDate && goalPaise > 0 && raisedPaise < (goalPaise / 2)) {
    return 'Behind';
  }

  return 'On track';
}

