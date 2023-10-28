import React, { useEffect, useState } from "react";
import Movie from "./Movie";
import { client, createPost } from "@/config/client";
import { Modal } from "./modal/Modal";
import ModalMovie from "./modal/ModalMovie";
import { ColorRing } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  centerStyle,
  moviesAtom,
  moviesSortedAtom,
  moviesFilteredAtom,
} from "@/pages";
import { useQuery } from "@tanstack/react-query";
import { atom, useAtom } from "jotai";
import { signIn, useSession } from "next-auth/react";
import { moviesQuery } from "@/utils/groqQueries";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";

export const searchTermJotai = atom("");
function Movies() {
  const [movies, setMovies] = useAtom(moviesAtom);
  const [sortMovies, setSortedMovies] = useAtom(moviesSortedAtom);

  const [allMovies, setAllMovies] = useState<any[]>([]);

  const { isLoading, error, data } = useQuery({
    queryKey: ["movies"],
    queryFn: () => client.fetch(moviesQuery),
    onSuccess: () => {
      setMovies(data);
      setAllMovies(data);
    },
  });
  const { data: session, status } = useSession();

  const [tmdbMovies, setTmdbMovies] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const [selectValue, setSelectValue] = useAtom(moviesFilteredAtom);

  const [searchTerm, setSearchTerm] = useAtom(searchTermJotai);

  const getMovieRequest = async () => {
    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${input}&page=1&include_adult=false`;

      const response = await fetch(url);
      const responseJson = await response.json();
      setTmdbMovies(responseJson.results);
    } catch (error) {
      console.log("error", error);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [loading, setLoading] = useState(false);

  async function refetchMovies() {
    try {
      const refetchedData = await client.fetch(moviesQuery);
      setMovies(refetchedData);
    } catch (error) {
      console.log("error", error);
    }
  }

  async function addMovie(mov: any) {
    try {
      setLoading(true);
      const movieDetails = `https://api.themoviedb.org/3/movie/${mov.id}?api_key=${process.env.TMDB_API_KEY}`;
      const fetchDetails = await fetch(movieDetails);
      const responeDetails = await fetchDetails.json();
      const imageUrl = `https://image.tmdb.org/t/p/original${mov.poster_path}`;
      const imageAsset = await uploadExternalImage(imageUrl);
      const imageAssetId = imageAsset._id;

      const imageUrlBackdrop = `https://image.tmdb.org/t/p/original${mov.backdrop_path}`;
      const imageAssetBackdrop = await uploadExternalImage(imageUrlBackdrop);
      const imageAssetIdBackdrop = imageAssetBackdrop._id;

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
        plot: mov.overview,

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
      };

      const movieExists = movies.some(
        (movie: any) => movie.title === mov.title
      );

      if (!movieExists) {
        setLoading(false);
        console.log("Created movie:", mov);

        toast.success(`${mov.title} lagt til 😁`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });

        closeModal();
        await createPost(movieData);
        const newMovies: any = [...movies, movieData];
        setMovies(newMovies);
        refetchMovies();
      } else {
        toast.error(`${mov.title} finnes allerede 😅`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });
        setLoading(false);
        closeModal();
      }
    } catch (error) {
      console.log("error", error);
    }
  }

  useEffect(() => {
    if (searchTerm === "") {
      // If the search bar is empty, show all movies
      setMovies(allMovies);
    } else {
      // If there's a search term, filter movies based on it
      const results = movies.filter((movie: any) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSortedMovies([]);
      setMovies(results);
    }
  }, [searchTerm, allMovies]);

  function filterMoviesByHighestAverageRating(movies: any) {
    const moviesWithAverageRating = movies.map((movie: any) => {
      const ratings = movie.ratings;

      const averageRating = ratings
        ? ratings.reduce((a: any, b: any) => a + b.rating, 0) / ratings.length
        : 0;
      return { ...movie, averageRating };
    });

    const sortedMovies = moviesWithAverageRating.sort((a: any, b: any) => {
      return b.averageRating - a.averageRating;
    });

    return sortedMovies;
  }

  function filterMoviesByLowestAverageRating(movies: any) {
    const moviesWithAverageRating = movies.map((movie: any) => {
      const ratings = movie.ratings;

      const averageRating = ratings
        ? ratings.reduce((a: any, b: any) => a + b.rating, 0) / ratings.length
        : 0;
      return { ...movie, averageRating };
    });

    const sortedMovies = moviesWithAverageRating.sort((a: any, b: any) => {
      return a.averageRating - b.averageRating;
    });

    return sortedMovies;
  }

  function fulterMoviesByHighestTotalComments(movies: any) {
    const moviesWithTotalComments = movies.map((movie: any) => {
      const comments = movie.comments;

      const totalComments = comments ? comments.length : 0;
      return { ...movie, totalComments };
    });

    const sortedMovies = moviesWithTotalComments.sort((a: any, b: any) => {
      return b.totalComments - a.totalComments;
    });

    return sortedMovies;
  }

  if (movies.length === 0 && !isLoading && searchTerm !== "")
    return (
      <div
        draggable={false}
        className="flex flex-col justify-center items-center h-screen w-screen"
      >
        <div>
          <h2 className="text-2xl font-bold mb-6 sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl">
            Ingen filmer
          </h2>
        </div>
      </div>
    );

  const handleSortByAverageRating = (filter: string) => {
    setSelectValue(filter);
    if (filter == "highestRating") {
      const sorted = filterMoviesByHighestAverageRating(movies);
      setSortedMovies(sorted);
    } else if (filter == "lowestRating") {
      const sorted = filterMoviesByLowestAverageRating(movies);
      setSortedMovies(sorted);
    } else if (filter == "highestComments") {
      const sorted = fulterMoviesByHighestTotalComments(movies);
      setSortedMovies(sorted);
    } else {
      setSortedMovies([]);
    }
  };

  return (
    <div draggable={false} className="mt-52 md:mt-auto">
      <div className="flex flex-col max-w-[90%] justify-end items-end z-50">
        <div className="flex flex-col justify-end items-end">
          {/* Select element for sorting options */}
          <select
            value={selectValue}
            onChange={(e) => {
              const selectedOption = e.target.value;
              handleSortByAverageRating(selectedOption);
            }}
            className="text-gray-400 hover:text-gray-300 cursor-pointer bg-gray-800 rounded-xl p-3 h-full w-full
              focus:outline-none     
                  
            "
          >
            <option value="default">Sist lagt til</option>
            <option value="highestRating">Høyest vurdering</option>
            <option value="lowestRating">Lavest vurdering</option>
            <option value="highestComments">Flest kommentarer</option>
            {/* Add more sorting options as needed */}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 p-10 sm:px-8 md:px-16 lg:px-20 xl:px-32 2xl:px-40 justify-center sm:justify-items-stretch items-center text-gray-800 text-xl">
        {session && status === "authenticated" ? (
          <button
            className="text-gray-400 hover:text-gray-300 transition duration-300 ease-in-out cursor-pointer border-2 border-opacity-60 border-gray-300 hover:border-gray-400 rounded-2xl p-2 h-full w-full"
            onClick={openModal}
          >
            Legg til film
          </button>
        ) : (
          <button
            className="text-gray-400 hover:text-gray-300 transition duration-300 ease-in-out cursor-pointer border-2 border-opacity-60 border-gray-300 hover:border-gray-400 rounded-2xl p-2 h-full w-full"
            onClick={() => signIn()}
          >
            Logg inn for å legge til filmer
          </button>
        )}

        <Modal isOpen={isModalOpen} onClose={closeModal}>
          <div className="flex flex-col justify-center items-center z-50">
            <h2 className="text-lg font-bold mb-6 sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl">
              Legg til film
            </h2>
            <input
              type="text"
              placeholder="Søk film"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  getMovieRequest();
                }
              }}
              onChange={(e) => setInput(e.target.value)}
              className="border-2 text-black border-gray-300 rounded-lg p-2 mb-4 w-[60%] z-50 focus:outline-none md:text-md"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 z-50 gap-14 p-10 sm:px-8 md:px-16 lg:px-20 xl:px-32 2xl:px-40 justify-items-center">
            {loading ? (
              <div className="fixed inset-0 flex justify-center items-center">
                <div style={centerStyle}>
                  <ColorRing
                    visible={true}
                    height="80"
                    width="80"
                    ariaLabel="blocks-loading"
                    wrapperStyle={{}}
                    wrapperClass="blocks-wrapper"
                    colors={[
                      "#cacaca",
                      "#cacaca",
                      "#cacaca",
                      "#cacaca",
                      "#cacaca",
                    ]}
                  />
                </div>
              </div>
            ) : (
              tmdbMovies &&
              tmdbMovies.map((movie: any, index) => (
                <div key={uuidv4()} onClick={() => addMovie(movie)}>
                  <ModalMovie
                    key={uuidv4()}
                    title={movie.title}
                    year={movie.release_date}
                    id={movie.id}
                    poster={movie.poster_path}
                    movie={movie}
                  />
                </div>
              ))
            )}
          </div>
        </Modal>

        {
          //if sortMovies is not empty, map over sortMovies, else map over movies
          sortMovies.length > 0
            ? sortMovies.map((movie: any, index: number) => (
                <Movie
                  key={uuidv4()}
                  title={movie.title}
                  year={movie.year}
                  poster={movie.poster.asset}
                  movie={movie}
                />
              ))
            : movies.map((movie: any, index: number) => (
                <Movie
                  key={uuidv4()}
                  title={movie.title}
                  year={movie.year}
                  poster={movie.poster.asset}
                  movie={movie}
                />
              ))
        }
        <ToastContainer />
      </div>
    </div>
  );
}
export default Movies;
