import { Query } from 'mongoose';
import AppError from './AppError';

class APIFeatures<T> {
  constructor(
    public query: Query<(Document & T)[], Document & T>,
    private queryString: qs.ParsedQs,
  ) {}

  public filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advance filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (matchedStr) => `$${matchedStr}`,
    );

    this.query.find(JSON.parse(queryStr));

    return this;
  }

  public sort() {
    if (this.queryString.sort) {
      const sortBy = (this.queryString.sort as string).split(',').join(' ');
      this.query.sort(sortBy);
      // query.sort('-price ratingsAverage') ---> price descending & ratingsAverage ascending if there is tie
    } else {
      // Default sorting
      this.query.sort('-createdAt');
    }

    return this;
  }

  public limitFields() {
    if (this.queryString.fields) {
      const fields = (this.queryString.fields as string).split(',').join(' ');
      this.query.select(fields);
    } else {
      // Default field limiting
      this.query.select('-__v');
    }

    return this;
  }

  public paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 100;
    const skip = limit * (page - 1);

    if (page < 0)
      throw new AppError('page number should be positive integer', 400);

    this.query.skip(skip).limit(limit);

    return this;
  }
}

export default APIFeatures;
