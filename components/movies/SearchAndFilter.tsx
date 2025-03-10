import React from "react";
import { signIn } from "next-auth/react";

interface SearchAndFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilter: string;
  handleSortByAverageRating: (filter: string) => void;
  getMovieRequest: () => void;
  openModal: () => void;
  session: any;
}

function SearchAndFilter({
  searchTerm,
  setSearchTerm,
  activeFilter,
  handleSortByAverageRating,
  getMovieRequest,
  openModal,
  session,
}: SearchAndFilterProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 px-4 md:px-8 space-y-4 md:space-y-0 pt-2 md:pt-0">
      {/* Search input */}
      <div className="relative w-full md:w-96 mb-2 md:mb-0">
        <input
          type="text"
          placeholder="Søk etter filmer..."
          className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 px-4 pl-12 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          onClick={getMovieRequest}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400 hover:text-yellow-500 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>

      {/* Filter dropdown and Add Movie button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
        <div className="relative w-full sm:w-auto z-10">
          <select
            className="appearance-none w-full sm:w-auto bg-gray-800 text-white border border-gray-700 rounded-lg py-3 px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
            value={activeFilter}
            onChange={(e) => handleSortByAverageRating(e.target.value)}
          >
            <option value="default">Ingen sortering</option>
            <option value="newest">Nyeste først</option>
            <option value="highest">Høyest vurdering</option>
            <option value="lowest">Lavest vurdering</option>
            <option value="comments">Flest kommentarer</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Add movie button */}
        {session ? (
          <button
            onClick={openModal}
            className="z-50 w-full sm:w-auto bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-medium py-3 px-6 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 flex items-center justify-center cursor-pointer relative hover:scale-105 active:scale-95"
            style={{ position: "relative", pointerEvents: "auto" }}
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Legg til film
          </button>
        ) : (
          <button
            onClick={() => signIn("discord")}
            className="z-50 w-full sm:w-auto bg-gradient-to-r from-yellow-700 to-yellow-600 text-white font-medium py-2 px-4 rounded-lg hover:from-yellow-600 hover:to-yellow-500 transition-all duration-300 flex flex-col items-center cursor-pointer relative hover:scale-105 active:scale-95 shadow-md"
            style={{ position: "relative", pointerEvents: "auto" }}
            type="button"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              <span>Logg inn</span>
            </div>
            <p className="text-xs mt-1">for å legge til filmer</p>
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchAndFilter;
