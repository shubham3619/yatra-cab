// Curated free Unsplash photos for each service (hotlink-friendly CDN).
// Every function gets a matching people-photo, per the product direction.
const u = (id, w = 640) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const PHOTOS = {
  oneWay: u('photo-1741389265274-fd22f41dd5e3'), // smiling man in a car
  roundTrip: u('photo-1756142007128-f431ede241cc'), // father & daughters selfie by the car
  seatShare: u('photo-1748882585283-1b71bbbec96b'), // friends enjoying a drive together
  bidding: u('photo-1604488912264-dfed70450d76'), // happy man giving a thumbs up
  refer: u('photo-1511988617509-a57c8a288659'), // friends laughing together
  womenOnly: u('photo-1529424601215-d2a3daf193ff', 320), // two women in a hatchback
};
