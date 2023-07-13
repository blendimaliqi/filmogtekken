export const movieQuery = `*[_type == "movie" && _id == $movieId] {
    _id,
    title,
    releaseDate,
    poster,
    poster_backdrop,
    plot,
    genres,
    castMembers,
    ratings[] {
      person-> {
        name,
        image
      },
      rating
    },
    length
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
    ratings[] {
      person-> {
        name,
        image
      },
      rating
    }}`;
