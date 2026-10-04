export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function getPagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_LIMIT),
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
  };
}

export async function paginate(
  model,
  filter,
  { page, limit, skip },
  { sort = { createdAt: -1 }, populate, select } = {},
) {
  let query = model.find(filter).sort(sort).skip(skip).limit(limit);
  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);

  const [items, total] = await Promise.all([
    query,
    model.countDocuments(filter),
  ]);
  return { items, meta: buildPaginationMeta({ page, limit, total }) };
}
