/**
 * queryHelper.js
 * Centralized utility for Mongoose pagination, searching, and sorting.
 * Optimized for handling 10,000+ records efficiently.
 */

exports.paginateQuery = async (model, queryOptions = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    searchFields = ['name'], // Fields to apply regex search on
    sortField = 'createdAt',
    sortOrder = 'desc',
    baseQuery = {}, // Base filter (e.g., non-deleted records)
    populate = '' // Mongoose populate string/array
  } = queryOptions;

  try {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    // ── Build Search Filter ───────────────────────────────────────────────────
    let query = { ...baseQuery };
    if (search && searchFields.length > 0) {
      const searchConditions = searchFields.map(field => ({
        [field]: { $regex: search, $options: 'i' }
      }));
      query = { ...query, $or: searchConditions };
    }

    // ── Build Sort Object ─────────────────────────────────────────────────────
    const sort = { [sortField]: sortOrder === 'desc' ? -1 : 1 };

    // ── Execute Optimized Query ───────────────────────────────────────────────
    // Using lean() for better performance as we don't need Mongoose documents here
    let mongoQuery = model.find(query).sort(sort).skip(skip).limit(limitNum).lean();
    
    if (populate) {
      mongoQuery = mongoQuery.populate(populate);
    }

    const results = await mongoQuery;

    // ── Get Total Count ───────────────────────────────────────────────────────
    // Using countDocuments is faster than loading all results
    const total = await model.countDocuments(query);

    return {
      data: results,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1
      }
    };
  } catch (err) {
    throw new Error(`Pagination Error: ${err.message}`);
  }
};
