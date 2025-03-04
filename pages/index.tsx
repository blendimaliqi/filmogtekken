import React, { useState } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import HomepageImage from "@/components/HomepageImage";
import MovieTitle from "@/components/MovieTitle";
import { client, urlFor } from "../config/client";
import { ColorRing } from "react-loader-spinner";
import { useQuery } from "@tanstack/react-query";
import { atom, useAtom } from "jotai";
import Movies from "@/components/Movies";
import { moviesQuery } from "@/utils/groqQueries";
import { Movie } from "@/typings";
import { uuidv4 } from "@/utils/helperFunctions";

export const centerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
};

export const moviesAtom = atom<Movie[]>([]);
export const moviesSortedAtom = atom<Movie[]>([]);
export const moviesFilteredAtom = atom("default");

export default function Home() {
  const [movies, setMovies] = useAtom(moviesAtom);
  const [isMoviesLoaded, setIsMoviesLoaded] = useState(false);

  const { isLoading, error, refetch } = useQuery<Movie[]>({
    queryKey: ["movies"],
    queryFn: () => client.fetch(moviesQuery),
    onSuccess: (data) => {
      setMovies(data);
      // Add a small delay to ensure DOM is fully updated
      setTimeout(() => {
        setIsMoviesLoaded(true);
      }, 100);
    },
    onError: (error) => refetch(),
  });

  if (isLoading || !isMoviesLoaded)
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black z-50">
        <ColorRing
          visible={true}
          height="80"
          width="80"
          ariaLabel="blocks-loading"
          wrapperStyle={{}}
          wrapperClass="blocks-wrapper"
          colors={["#cacaca", "#cacaca", "#cacaca", "#cacaca", "#cacaca"]}
        />
      </div>
    );

  if (error) return "An error has occurred: ";

  const sortedMovies = movies.sort((a: Movie, b: Movie) => {
    return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime();
  });

  const moviesToDisplay = sortedMovies.slice(0, 5);

  return (
    <main className="bg-black">
      <div className="relative">
        <Carousel
          className="hidden md:block"
          autoPlay={true}
          interval={10000}
          stopOnHover={false}
          infiniteLoop={true}
          showThumbs={false}
          showStatus={false}
          showArrows={true}
          swipeable={true}
          emulateTouch={true}
          dynamicHeight={false}
          renderIndicator={(onClickHandler, isSelected, index, label) => {
            const indicatorClasses = isSelected
              ? "w-12 bg-yellow-600"
              : "w-8 bg-gray-700 hover:bg-gray-600";
            
            return (
              <button
                type="button"
                onClick={onClickHandler}
                className={`h-1.5 rounded-full mx-1 transition-all duration-300 ${indicatorClasses}`}
                aria-label={`Slide ${index + 1}`}
                title={`${label} ${index + 1}`}
              />
            );
          }}
          renderArrowPrev={(onClickHandler, hasPrev) => 
            hasPrev && (
              <button 
                type="button" 
                onClick={onClickHandler} 
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300"
                aria-label="Previous slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )
          }
          renderArrowNext={(onClickHandler, hasNext) => 
            hasNext && (
              <button 
                type="button" 
                onClick={onClickHandler} 
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300"
                aria-label="Next slide"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )
          }
        >
          {moviesToDisplay.map((movie: Movie) => (
            <HomepageImage
              key={uuidv4()}
              url={urlFor(movie.poster_backdrop.asset).url() ?? ""}
            >
              <MovieTitle movie={movie} />
            </HomepageImage>
          ))}
        </Carousel>
        
        {/* Gradient overlay to create seamless transition to movies section */}
        <div className="hidden md:block absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent"></div>
      </div>
      
      {isMoviesLoaded && <Movies />}
    </main>
  );
}
