// Singleton holder for the Socket.io server so controllers can emit events
// without a circular import on the bootstrap file.
let io = null;

export function setIo(instance) {
  io = instance;
}

export function getIo() {
  return io;
}

// Room helpers — events are scoped so only relevant clients receive them.
export const rooms = {
  ride: (rideId) => `ride:${rideId}`,
  route: (routeId) => `route:${routeId}`,
  user: (userId) => `user:${userId}`,
  drivers: () => 'drivers', // all connected drivers (for custom Ride Alerts)
};

export function emitToRide(rideId, event, payload) {
  io?.to(rooms.ride(rideId)).emit(event, payload);
}

export function emitToRoute(routeId, event, payload) {
  io?.to(rooms.route(routeId)).emit(event, payload);
}

export function emitToUser(userId, event, payload) {
  io?.to(rooms.user(userId)).emit(event, payload);
}

export function emitToDrivers(event, payload) {
  io?.to(rooms.drivers()).emit(event, payload);
}
