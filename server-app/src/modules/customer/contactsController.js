import { Contact, User, normalizePhone, catchAsync, ok, created, ApiError } from '@yatracab/core';

// GET /customer/contacts — the people I've picked to invite.
export const listContacts = catchAsync(async (req, res) => {
  const contacts = await Contact.find({ owner: req.user._id })
    .sort({ createdAt: -1 })
    .populate('joinedUser', 'name')
    .lean();
  return ok(res, { contacts });
});

// POST /customer/contacts — store the entries the user just selected.
// The client sends only what the Contact Picker handed back (or one typed
// number), so the payload is capped small on purpose.
export const saveContacts = catchAsync(async (req, res) => {
  const incoming = req.body.contacts
    .map((c) => ({ name: c.name?.trim() || '', phone: normalizePhone(c.phone), source: c.source || 'picker' }))
    .filter((c) => c.phone.length >= 8);

  if (!incoming.length) throw new ApiError(400, 'No usable phone numbers in that selection');

  // Never store the owner's own number as a contact.
  const own = normalizePhone(req.user.phone);
  const usable = incoming.filter((c) => c.phone !== own);
  if (!usable.length) throw new ApiError(400, "That's your own number");

  await Contact.bulkWrite(
    usable.map((c) => ({
      updateOne: {
        filter: { owner: req.user._id, phone: c.phone },
        update: { $set: { name: c.name, source: c.source, consentedAt: new Date() }, $setOnInsert: { owner: req.user._id, phone: c.phone } },
        upsert: true,
      },
    }))
  );

  // Link any that already have an account, so invites aren't sent twice.
  const existing = await User.find({ phone: { $in: usable.map((c) => c.phone) } }).select('_id phone').lean();
  for (const u of existing) {
    await Contact.updateOne({ owner: req.user._id, phone: u.phone }, { $set: { joinedUser: u._id } });
  }

  const contacts = await Contact.find({ owner: req.user._id }).sort({ createdAt: -1 }).lean();
  return created(res, { saved: usable.length, alreadyOnYatraCab: existing.length, contacts });
});

// DELETE /customer/contacts/:id — remove one.
export const deleteContact = catchAsync(async (req, res) => {
  const result = await Contact.deleteOne({ _id: req.params.id, owner: req.user._id });
  if (!result.deletedCount) throw new ApiError(404, 'Contact not found');
  return ok(res, { deleted: true });
});

// DELETE /customer/contacts — purge everything this user stored.
export const purgeContacts = catchAsync(async (req, res) => {
  const { deletedCount } = await Contact.deleteMany({ owner: req.user._id });
  return ok(res, { deleted: deletedCount });
});
