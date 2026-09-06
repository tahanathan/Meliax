import { getAccessToken, loginWithGoogle } from './firebase';

export async function createGoogleCalendarEvent(trip: any) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  
  // Make it a full day event
  const event = {
    summary: `Viagem: ${trip.title}`,
    location: trip.destination,
    description: `Roteiro criado pelo app Voyager.\n\nDestino: ${trip.destination}\nCategoria: ${trip.category}\nStatus: ${trip.status}`,
    start: {
      date: startDate.toISOString().split('T')[0]
    },
    end: {
      date: endDate.toISOString().split('T')[0]
    }
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    throw new Error('Failed to create calendar event');
  }
  
  return await response.json();
}

export async function createGoogleTask(trip: any) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  const taskListResponse = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!taskListResponse.ok) {
    throw new Error('Failed to fetch task lists');
  }
  const taskLists = await taskListResponse.json();
  const defaultList = taskLists.items[0];

  const task = {
    title: `Preparativos para Viagem: ${trip.title}`,
    notes: `Verificar reservas, fazer malas e organizar roteiro para ${trip.destination}.`,
    due: new Date(trip.startDate).toISOString()
  };

  const response = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${defaultList.id}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(task)
  });

  if (!response.ok) {
    throw new Error('Failed to create task');
  }
  
  return await response.json();
}
