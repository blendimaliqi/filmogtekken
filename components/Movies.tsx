import React from "react";
import MoviesContainer from "./movies/MoviesContainer";

interface MoviesProps {
  isAddMovieModalOpen?: boolean;
  onMovieAdded?: () => void;
  filterGenre?: string;
}

// Re-export the MoviesContainer with the same interface as before
function Movies(props: MoviesProps) {
  return <MoviesContainer {...props} />;
}

export default Movies;
