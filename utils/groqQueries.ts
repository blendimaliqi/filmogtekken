export const movieQuery = `*[_type == "movie" && _id == $movieId] {
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
      image
    },
    comment,
    _createdAt
  },
  ratings[] {
    person-> {
      name,
      image
    },
    rating
  },
  length,
  _createdAt
}[0]`;

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
      image
    },
    comment,
    _createdAt
  },
  ratings[] {
    person-> {
      name,
      image
    },
    rating
  }
}`;
