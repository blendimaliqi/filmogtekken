import { useState } from "react";
import React from "react";
import { Movie } from "@/typings";
import { toast } from "react-toastify";
import CustomToast from "@/components/ui/CustomToast";
import { createPost } from "@/config/client";
import { uploadExternalImage, uuidv4 } from "@/utils/helperFunctions";
import { useQueryClient } from "@tanstack/react-query";
import { movieKeys } from "@/hooks/useMovie";

interface UseMovieAdditionProps {
  moviesData: Movie[] | undefined;
  onMovieAdded?: () => void;
  setFilteredMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  setOptimizedMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
}

interface UseMovieAdditionReturn {
  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  addMovie: (mov: any) => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
}

function useMovieAddition({
  moviesData,
  onMovieAdded,
  setFilteredMovies,
  setOptimizedMovies,
}: UseMovieAdditionProps): UseMovieAdditionReturn {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  function openModal() {
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  async function addMovie(mov: any) {
    try {
      setIsLoading(true);

      const movieDetails = `https://api.themoviedb.org/3/movie/${mov.id}?api_key=${process.env.TMDB_API_KEY}`;
      const fetchDetails = await fetch(movieDetails);
      const responseDetails = await fetchDetails.json();

      const movieExists = moviesData?.some(
        (movie: any) => movie.title === mov.title
      );

      if (movieExists) {
        toast.error(
          ({ closeToast }) =>
            React.createElement(CustomToast, {
              title: "Film finnes allerede",
              message: `${mov.title} er allerede i din samling`,
              type: "error",
              closeToast,
              posterUrl: mov.poster,
            }),
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
        genres: responseDetails.genres.map((genre: any) => genre.name),
        length: responseDetails.runtime,
        plot: mov.overview || responseDetails.overview || "",
        overview: {
          _type: "block",
          children: [
            {
              _type: "span",
              _key: uuidv4(),
              text: mov.overview || responseDetails.overview || "",
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

      const createdMovie = await createPost(movieData);

      const newMovieWithId = {
        ...movieData,
        _id: createdMovie._id,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
        comments: [],
        ratings: [],
        year: new Date(mov.release_date).getFullYear().toString(),
      } as unknown as Movie;

      setIsLoading(false);
      closeModal();

      toast.success(
        ({ closeToast }) =>
          React.createElement(CustomToast, {
            title: "Film lagt til",
            message: `${mov.title} er nå lagt til i din samlingen`,
            type: "success",
            closeToast,
            posterUrl: mov.poster,
          }),
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

      setFilteredMovies((prev) => [newMovieWithId, ...(prev || [])]);
      setOptimizedMovies((prev) => [newMovieWithId, ...(prev || [])]);

      await queryClient.resetQueries({ queryKey: movieKeys.all });
      await queryClient.refetchQueries({
        queryKey: movieKeys.lists(),
        exact: false,
      });

      if (onMovieAdded) {
        onMovieAdded();
      }
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

  return {
    isModalOpen,
    setIsModalOpen,
    isLoading,
    setIsLoading,
    addMovie,
    openModal,
    closeModal,
  };
}

export default useMovieAddition;
