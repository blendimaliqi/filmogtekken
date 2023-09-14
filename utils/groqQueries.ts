export const movieQuery = `*[_type == "movie" && _id == $movieId] {
    _id,
    title,
    releaseDate,
    poster,
    poster_backdrop,
    plot,
    genres,
    castMembers,
    'comments': *[
      _type == "comment" && 
      movie._ref == ^._id ],
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
