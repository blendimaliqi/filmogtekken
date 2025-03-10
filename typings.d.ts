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
      _id?: string;
      name?: string;
      image?: SanityImage | string;
    };
    rating: number;
    _key?: string;
    _createdAt?: string;
  }[];
  length: number;
  plot: string;
  slug: {
    _type: "slug";
    current: string;
  };
  overview: BlockContent;
  releaseDate: string;
  poster: SanityImage | string;
  genres: string[];
  poster_backdrop: SanityImage | string;
  externalId: number;
  popularity: number;
  added?: string; // Date when the movie was added
}

// Define SanityImage type to handle both reference format and url format
export interface SanityImage {
  _type: "image";
  asset: {
    _type: "reference";
    _ref: string; // Reference to the actual image asset
  };
  url?: string; // For when the url is directly accessible
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
