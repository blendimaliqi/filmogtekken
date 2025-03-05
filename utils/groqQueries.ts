export const movieQuery = `*[_type == "movie" && (slug.current == $movieId || _id == $movieId)][0] {
  _id,
  title,
  releaseDate,
  poster,
  poster_backdrop,
  plot,
  genres,
  castMembers,
  comments[] {
    person-> {
      name,
      image,
      _id,
      _key,
    },
    comment,
    _key,
    _createdAt,
    createdAt
  },
  ratings[] {
    person-> {
      name,
      image,
      _id,
    },
    rating
  },
  length,
  _createdAt
}`;

export const moviesQuery = `*[_type == "movie"] {
  _id,
  title,
  releaseDate,
  poster,
  poster_backdrop,
  plot,
  genres,
  castMembers,
  slug,
  _createdAt,
  length,
  comments[] {
    person-> {
      name,
      image,
      _key,
      _id,
    },
    comment,
    _key,
    _createdAt,
    createdAt
  },
  ratings[] {
    person-> {
      name,
      image,
      _id,
    },
    rating
  }
}`;
