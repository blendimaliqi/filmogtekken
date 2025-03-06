import { atom } from "jotai";
import type { Movie } from "@/typings";

export const moviesAtom = atom<Movie[]>([]);
export const moviesSortedAtom = atom<Movie[]>([]);
export const moviesFilteredAtom = atom<string>("default");
export const searchTermJotai = atom<string>("");
