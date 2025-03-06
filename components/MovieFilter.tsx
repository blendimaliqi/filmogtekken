import React from "react";
import { useAtom } from "jotai";
import { moviesFilteredAtom } from "@/store/atoms";

interface MovieFilterProps {
  onFilterChange: (filter: string) => void;
}

export function MovieFilter({ onFilterChange }: MovieFilterProps) {
  const [moviesFiltered, setMoviesFiltered] = useAtom(moviesFilteredAtom);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setMoviesFiltered(value);
    onFilterChange(value);
  };

  return (
    <div className="relative w-full sm:w-auto">
      <select
        className="appearance-none w-full sm:w-auto bg-gray-800 text-white border border-gray-700 rounded-lg py-3 px-4 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
        value={moviesFiltered}
        onChange={handleChange}
      >
        <option value="default">Sist lagt til</option>
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
  );
}
