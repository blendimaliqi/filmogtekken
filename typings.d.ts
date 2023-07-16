type Movie = {
  _id: string;
  _createdAt: string;
  _type: string;
  title: string;
  releaseDate: string;
  slug: {
    _type: string;
    current: string;
  };
  genres: string[];
  length: number;
  plot: string;
  poster: {
    _type: string;
    asset: {
      _ref: string;
      _type: string;
    };
  };
  poster_backdrop: {
    _type: string;
    asset: {
      _ref: string;
      _type: string;
    };
  };
};
