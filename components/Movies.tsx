//create movies component
import React, { useState } from "react";
import Movie from "./Movie";
import { client, createPost } from "@/config/client";
import { Modal } from "./modal/Modal";
import ModalMovie from "./modal/ModalMovie";
import { Audio, ColorRing, Puff } from "react-loader-spinner";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useQuery, useMutation, useQueryClient } from "react-query";

import { centerStyle } from "@/pages";

export async function uploadExternalImage(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const contentType = response.headers.get("content-type") || "image/jpeg"; // Provide a default value

  const asset = await client.assets.upload("image", blob, { contentType });
  return asset;
}

function Movies(movies: any) {
  const [omdbMovies, setOmdbMovies] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const queryClient = useQueryClient();
  const getMovieRequest = async () => {
    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=en-US&query=${input}&page=1&include_adult=false`;

      const response = await fetch(url);
      const responseJson = await response.json();
      setOmdbMovies(responseJson.results);
    } catch (error) {
      console.log("error", error);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [loading, setLoading] = useState(false);

  // create a new movie and update the "movies" query

  const { mutate } = useMutation(createPost, {
    onSuccess: () => {
      queryClient.invalidateQueries("movies");

      //wait for 3 seconds before refetching
      queryClient.refetchQueries("movies");
      // show success message, close modal, etc.
    },
    onError: () => {
      // show error message, etc.
    },
  });

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

      //check if movie exists in movies prop
      const movieExists = movies.movies.some(
        (movie: any) => movie.title === mov.title
      );

      if (!movieExists) {
        // const createdMovie = await createPost(movieData);
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

        mutate(movieData);
        queryClient.invalidateQueries("movies");

        // movies.revalidate("movies");
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

  return (
    <div draggable={false} className="mt-52 md:mt-auto ">
      <div
        className="
    grid
    grid-cols-1
    sm:grid-cols-2
    md:grid-cols-3
    lg:grid-cols-4
    xl:grid-cols-5
    2xl:grid-cols-6
    gap-8
    p-10
    sm:px-8
    md:px-16
    lg:px-20
    xl:px-32
    2xl:px-40
    justify-items-center
    sm:justify-items-stretch
    items-center
    text-gray-800
    text-xl
  "
      >
        <button
          className="
    text-gray-400
    hover:text-gray-300
    transition duration-300 ease-in-out
    cursor-pointer
    border-2
    border-opacity-60
    border-gray-300
    hover:border-gray-400
    rounded-2xl
    p-2
    h-full
    w-72
    sm:w-auto
  "
          onClick={openModal}
        >
          Legg til
        </button>

        <Modal isOpen={isModalOpen} onClose={closeModal}>
          <div
            className="
          flex
          flex-col
          justify-center
          items-center
          z-50
          "
          >
            <h2
              className="text-lg font-bold mb-6
            sm:text-lg
            md:text-xl
            lg:text-2xl
            xl:text-3xl
            2xl:text-4xl
            "
            >
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
              className="
    border-2
    text-black
    border-gray-300
    rounded-lg
    p-2
    mb-4
    w-[60%]
    z-50
    focus:outline-none
    md:text-md
 "
            />
          </div>
          <div
            className=" 
          grid
          grid-cols-1
          sm:grid-cols-1
          md:grid-cols-2
          lg:grid-cols-2
          xl:grid-cols-3
          z-50
          gap-14
          p-10
          sm:px-8
          md:px-16
          lg:px-20
          xl:px-32
          2xl:px-40
          justify-items-center

          "
          >
            {loading ? (
              <div
                className="
                fixed
                inset-0
                flex
                justify-center
                items-center
              "
              >
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
              omdbMovies &&
              omdbMovies.map((movie: any, index) => (
                <div key={index} onClick={() => addMovie(movie)}>
                  <ModalMovie
                    key={movie.id + index}
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

        {movies.movies.map((movie: any, index: number) => (
          <Movie
            key={movie._id + index}
            title={movie.title}
            year={movie.year}
            poster={movie.poster.asset}
            movie={movie}
          />
        ))}
        <ToastContainer />
      </div>
    </div>
  );
}

export default Movies;
