// Consistent JSON envelope helpers: { success:true, ...data } on success.
export function ok(res, data = {}, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

export function created(res, data = {}) {
  return ok(res, data, 201);
}

// Standard pagination shape for list endpoints.
export function paginate(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function pageMeta(page, limit, total) {
  return { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}
