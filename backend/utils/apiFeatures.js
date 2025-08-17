class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  search() {
    let keyword = this.queryString.keyword
      ? {
          name: {
            $regex: this.queryString.keyword,
            $options: "i",
          },
        }
      : {};
    this.query = this.query.find({ ...keyword }); // <-- Fix here
    return this;
  }

  filter() {
    const queryStringCopy = { ...this.queryString };

    // Removing fields from the query
    const removeFields = ["keyword", "page", "limit"];
    removeFields.forEach((field) => delete queryStringCopy[field]);

    // Advanced filtering for operators like gt, gte, lt, lte
    let queryStr = JSON.stringify(queryStringCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }
  paginate(resPerPage) {
    const currentPage = Number(this.queryString.page) || 1;
    const skip = resPerPage * (currentPage - 1);
    this.query.limit(resPerPage).skip(skip);
    return this;
  }
}

module.exports = APIFeatures;
