import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import { client, createPost } from "@/config/client";
import { Movie } from "@/typings";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";
import { useMovies } from "@/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { movieKeys } from "@/hooks/useMovie";
import CustomToast from "../ui/CustomToast";

// Import our components
import SearchAndFilter from "./SearchAndFilter";
import MovieGrid from "./MovieGrid";
import AddMovieModal from "./AddMovieModal";

// Import utility functions
import { applyMovieFilter } from "./MovieFilters";

interface MoviesContainerProps {
  isAddMovieModalOpen?: boolean;
  onMovieAdded?: () => void;
  filterGenre?: string;
}

function MoviesContainer({
  isAddMovieModalOpen = false,
  onMovieAdded,
  filterGenre,
}: MoviesContainerProps) {
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("newest");
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(isAddMovieModalOpen);
  const { data: session } = useSession();
  const [tmdbMovies, setTmdbMovies] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(false);
  const [optimizedMovies, setOptimizedMovies] = useState<Movie[]>([]);

  // Fetch movies with React Query
  const {
    data: moviesData,
    isLoading: isMoviesLoading,
    error,
  } = useMovies(filterGenre);

  // Check if device is mobile
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768);
    }
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Open the modal if isAddMovieModalOpen prop changes
  useEffect(() => {
    if (isAddMovieModalOpen) {
      setIsModalOpen(true);
    }
  }, [isAddMovieModalOpen]);

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Update movies when data or filters change
  useEffect(() => {
    if (moviesData && Array.isArray(moviesData)) {
      let moviesToFilter = [...moviesData];

      // Apply search filter if there's a search term
      if (debouncedSearchTerm !== "") {
        moviesToFilter = moviesToFilter.filter((movie: Movie) =>
          movie.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        );
        setHasSearched(true);
      } else {
        setHasSearched(false);
      }

      // Apply sorting filter
      if (activeFilter !== "default" && !debouncedSearchTerm) {
        moviesToFilter = applyMovieFilter(moviesToFilter, activeFilter);
      }

      // Update filtered movies
      setFilteredMovies(moviesToFilter);

      // For optimizedMovies, respect the mobile pagination
      if (isMobile) {
        setOptimizedMovies(moviesToFilter.slice(0, 10));
      } else {
        setOptimizedMovies(moviesToFilter);
      }
    }
  }, [moviesData, activeFilter, debouncedSearchTerm, isMobile]);

  // Handle sorting by different criteria
  function handleSortByAverageRating(filter: string) {
    setActiveFilter(filter);

    if (!moviesData) return;

    const filteredData = applyMovieFilter([...moviesData], filter);
    setFilteredMovies(filteredData);

    // Update optimized movies for display
    if (isMobile) {
      setOptimizedMovies(filteredData.slice(0, 10));
    } else {
      setOptimizedMovies(filteredData);
    }
  }

  // Search functionality
  function getMovieRequest() {
    try {
      // For regular search in the main page
      if (!isModalOpen) {
        if (debouncedSearchTerm !== "") {
          const searchResults =
            moviesData?.filter((movie: Movie) =>
              movie.title
                .toLowerCase()
                .includes(debouncedSearchTerm.toLowerCase())
            ) || [];
          setFilteredMovies(searchResults);
          setOptimizedMovies(
            isMobile ? searchResults.slice(0, 10) : searchResults
          );
          setHasSearched(true);
        } else {
          setHasSearched(false);
          if (activeFilter !== "default") {
            // Reapply the active filter when search is cleared
            handleSortByAverageRating(activeFilter);
          }
        }
      }
      // For TMDB search in the modal
      else if (isModalOpen) {
        if (input !== "") {
          setHasSearched(true);
          setIsLoading(true);
          // Call TMDB API to search for movies
          fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${input}&page=1&include_adult=false`
          )
            .then((response) => response.json())
            .then((data) => {
              // Limit results to improve performance on mobile
              const limitedResults = isMobile
                ? data.results.slice(0, 10)
                : data.results;
              setTmdbMovies(limitedResults);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error("Error searching TMDB:", error);
              setIsLoading(false);
            });
        } else {
          // Clear results if search term is empty
          setTmdbMovies([]);
          setHasSearched(false);
        }
      }
    } catch (error) {
      console.error("Error in getMovieRequest:", error);
      setIsLoading(false);
    }
  }

  // Modal functions
  function openModal() {
    setIsModalOpen(true);
  }

  function closeModal() {
    setInput("");
    setTmdbMovies([]);
    setHasSearched(false);
    setIsModalOpen(false);
  }

  // Function to get the correct movies to display
  function getMoviesToDisplay(): Movie[] {
    return filteredMovies.length > 0 ? filteredMovies : moviesData || [];
  }

  // Get the final list of movies to display
  const moviesToDisplay = getMoviesToDisplay();

  // Function to add a new movie from TMDB
  async function addMovie(mov: any) {
    try {
      console.log("Starting to add movie:", mov.title);
      setIsLoading(true);

      // Fetch detailed movie information from TMDB
      const movieDetails = `https://api.themoviedb.org/3/movie/${mov.id}?api_key=${process.env.TMDB_API_KEY}`;
      const fetchDetails = await fetch(movieDetails);
      const responeDetails = await fetchDetails.json();

      // Check if this movie already exists
      const movieExists = moviesData?.some(
        (movie: any) => movie.title === mov.title
      );

      if (movieExists) {
        toast.error(
          ({ closeToast }) => (
            <CustomToast
              title="Film finnes allerede"
              message={`${mov.title} er allerede i din samling`}
              type="error"
              closeToast={closeToast}
              posterUrl={mov.poster}
            />
          ),
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "dark",
            className:
              "!bg-transparent !shadow-none !p-0 !rounded-none !max-w-sm",
            bodyClassName: "!p-0 !m-0",
            icon: false,
          }
        );
        setIsLoading(false);
        closeModal();
        return;
      }

      // Upload images to Sanity
      const imageUrl = `https://image.tmdb.org/t/p/original${mov.poster_path}`;
      const imageAsset = await uploadExternalImage(imageUrl);
      const imageAssetId = imageAsset._id;

      const imageUrlBackdrop = `https://image.tmdb.org/t/p/original${mov.backdrop_path}`;
      const imageAssetBackdrop = await uploadExternalImage(imageUrlBackdrop);
      const imageAssetIdBackdrop = imageAssetBackdrop._id;

      // Prepare the movie data for Sanity
      const movieData = {
        _type: "movie",
        title: mov.title,
        releaseDate: mov.release_date,
        slug: {
          _type: "slug",
          current: mov.title,
        },
        genres: responeDetails.genres.map((genre: any) => genre.name),
        length: responeDetails.runtime,
        plot: mov.overview || responeDetails.overview || "",
        overview: {
          _type: "block",
          children: [
            {
              _type: "span",
              _key: uuidv4(),
              text: mov.overview || responeDetails.overview || "",
            },
          ],
        },
        poster: {
          _type: "image",
          asset: {
            _ref: imageAssetId,
            _type: "reference",
          },
        },
        poster_backdrop: {
          _type: "image",
          asset: {
            _ref: imageAssetIdBackdrop,
            _type: "reference",
          },
        },
        externalId: mov.id,
        popularity: mov.popularity || 0,
      };

      console.log("Creating movie in Sanity:", mov.title);

      // Create the movie in Sanity
      const createdMovie = await createPost(movieData);
      console.log("Movie created in Sanity with ID:", createdMovie._id);

      // Create a complete movie object for the UI
      const newMovieWithId = {
        ...movieData,
        _id: createdMovie._id,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        comments: [],
        ratings: [],
        year: new Date(mov.release_date).getFullYear().toString(),
      } as unknown as Movie;

      // Close the modal and cleanup search
      setTmdbMovies([]);
      setInput("");
      setIsLoading(false);
      closeModal();

      // Show success notification
      toast.success(
        ({ closeToast }) => (
          <CustomToast
            title="Film lagt til"
            message={`${mov.title} er nå lagt til i din samlingen`}
            type="success"
            closeToast={closeToast}
            posterUrl={mov.poster}
          />
        ),
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
          className:
            "!bg-transparent !shadow-none !p-0 !rounded-none !max-w-sm",
          bodyClassName: "!p-0 !m-0",
          icon: false,
        }
      );

      // Update all state variables directly with the new movie
      setFilteredMovies((prev) => [newMovieWithId, ...(prev || [])]);
      setOptimizedMovies((prev) => [newMovieWithId, ...(prev || [])]);

      // Force a complete cache reset and refetch
      await queryClient.resetQueries({ queryKey: movieKeys.all });

      // Explicitly refetch all movie data
      await queryClient.refetchQueries({
        queryKey: movieKeys.lists(),
        exact: false,
      });

      // Call the callback to trigger a refetch in the parent component
      if (onMovieAdded) {
        onMovieAdded();
      }

      console.log("All add movie operations completed");
    } catch (error) {
      console.error("Error adding movie:", error);
      toast.error(
        "Det oppstod en feil ved legge til filmen. Prøv igjen senere.",
        {
          position: "bottom-right",
        }
      );
      setIsLoading(false);
      closeModal();
    }
  }

  // Determine the overall loading state
  const isPageLoading = isLoading && (!moviesData || moviesData.length === 0);

  // Show loading spinner if loading and no data
  if (isPageLoading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-[6px] border-gray-600 border-t-yellow-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="container mx-auto py-4 md:py-8">
        {/* Search and filter section */}
        <SearchAndFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeFilter={activeFilter}
          handleSortByAverageRating={handleSortByAverageRating}
          getMovieRequest={getMovieRequest}
          openModal={openModal}
          session={session}
        />

        {/* Movie grid */}
        <MovieGrid
          optimizedMovies={optimizedMovies}
          isMobile={isMobile}
          moviesToDisplay={moviesToDisplay}
          setOptimizedMovies={setOptimizedMovies}
        />
      </div>

      {/* Modal for adding movies */}
      <AddMovieModal
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        input={input}
        setInput={setInput}
        getMovieRequest={getMovieRequest}
        isLoading={isLoading}
        hasSearched={hasSearched}
        tmdbMovies={tmdbMovies}
        addMovie={addMovie}
      />

      <ToastContainer limit={3} />
    </div>
  );
}

export default MoviesContainer;
