export interface Movie {
  _type: "movie";
  _id: string;
  _rev: string;
  _createdAt: string;
  _updatedAt: string;
  title: string;
  comments: Comment[];
  ratings: {
    person: {
      _type: "reference";
      _ref: string; // Reference to the "person" type
    };
    rating: number;
  }[];
  length: number;
  plot: string;
  slug: {
    _type: "slug";
    current: string;
  };
  overview: BlockContent;
  releaseDate: string;
  poster: {
    _type: "image";
    asset: {
      _type: "reference";
      _ref: string; // Reference to the actual image asset
    };
  };
  genres: string[];
  poster_backdrop: {
    _type: "image";
    asset: {
      _type: "reference";
      _ref: string; // Reference to the actual image asset
    };
  };
  externalId: number;
  popularity: number;
  added?: string; // Date when the movie was added
}

// Assuming you have a BlockContent interface defined, you can define it like this:
interface BlockContent {
  _type: "block";
  children: Block[];
}

interface Block {
  _type: "span" | "strong" | "em" | "code" | "link";
  _key: string;
  text: string;
}

export interface Comment {
  comment: string;
  person: any;
  movie: {
    _ref: string;
    _type: string;
  };
  _createdAt: string;
  _id: string;
  _rev: string;
  _type: string;
  _updatedAt: string;
}
