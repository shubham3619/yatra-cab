import { Server } from 'socket.io';
import { verifyAccessToken, User, Driver, logger } from '@yatracab/core';
import { setIo, rooms, emitToRide } from '../realtime.js';
import { appConfig } from '../config/loadEnv.js';

/**
 * Socket.io server sharing the HTTP server. Connections are JWT-authenticated
 * in the handshake. Rooms scope events:
 *   - user:<id>     personal channel (assignments, refunds)
 *   - ride:<id>     live bids + driver location for one ride
 *   - route:<id>    drivers subscribed to a route receive new Ride Alerts
 */
export function initSockets(server) {
  const io = new Server(server, {
    cors: { origin: appConfig.clientUrls, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Auth token required'));
      const claims = verifyAccessToken(token);
      const user = await User.findById(claims.sub).select('_id role isBlocked');
      if (!user || user.isBlocked) return next(new Error('Unauthorized'));
      socket.user = { id: String(user._id), role: user.role };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const { id, role } = socket.user;
    socket.join(rooms.user(id));
    logger.info(`[socket] ${role} ${id} connected (${socket.id})`);

    // Drivers join the global drivers room (custom Ride Alerts) + their route rooms.
    if (role === 'driver') {
      socket.join(rooms.drivers());
      const driver = await Driver.findOne({ user: id }).select('servesRoutes');
      driver?.servesRoutes?.forEach((r) => socket.join(rooms.route(String(r))));
    }

    // A customer/driver opens a specific ride view.
    socket.on('ride:join', (rideId) => rideId && socket.join(rooms.ride(rideId)));
    socket.on('ride:leave', (rideId) => rideId && socket.leave(rooms.ride(rideId)));

    // Driver streams live GPS during an ongoing ride → customer in that room.
    socket.on('driver:location', ({ rideId, lat, lng }) => {
      if (role !== 'driver' || !rideId) return;
      emitToRide(rideId, 'ride:driver_location', { rideId, lat, lng, at: Date.now() });
    });

    socket.on('disconnect', () => logger.info(`[socket] ${role} ${id} disconnected`));
  });

  setIo(io);
  return io;
}
