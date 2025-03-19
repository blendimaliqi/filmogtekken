export const movieQuery = `*[_type == "movie" && (slug.current == $movieId || _id == $movieId)][0] {
  _id,
  title,
  releaseDate,
  "poster": poster.asset->,
  "poster_backdrop": poster_backdrop.asset->,
  plot,
  overview,
  genres,
  castMembers,
  comments[] {
    person-> {
      name,
      "image": image.asset->,
      _id,
      _key,
    },
    comment,
    _key,
    _createdAt,
    createdAt
  },
  "ratings": ratings[] {
    _key,
    rating,
    person-> {
      _id,
      name,
      "image": image.asset->
    }
  },
  length,
  _createdAt
}`;

export const moviesQuery = `*[_type == "movie"] | order(_createdAt desc) {
  _id,
  title,
  releaseDate,
  "poster": poster.asset->,
  "poster_backdrop": poster_backdrop.asset->,
  plot,
  genres,
  castMembers,
  slug,
  _createdAt,
  length,
  comments[] {
    person-> {
      name,
      "image": image.asset->,
      _key,
      _id,
    },
    comment,
    _key,
    _createdAt,
    createdAt
  },
  "ratings": ratings[] {
    _key,
    rating,
    person-> {
      _id,
      name,
      "image": image.asset->
    }
  }
}`;
