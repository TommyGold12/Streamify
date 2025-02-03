import { children, useEffect, useState } from "react";

const KEY = "40a56a2c";

export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, isActive] = useState("home");
  const [activeIcon, setActiveIcon] = useState(false);
  const [message, setMessage] = useState("");
  const [headerMessage, setHeaderMessage] = useState(true);

  //* Aktivni button u mainCategory komponenti
  const handleActive = function (e) {
    isActive(e);
  };

  //* dohvaćeni filmovi po kategorijama
  const [categories, setCategories] = useState({
    home: [],
    myPlaylist: [],
    favourites: [],
    watchLater: [],
  });

  //* dinamičko dodavanje ključeva filmova u kategorije pomoću button na slikama, ključevi su pohranjeni u objektu u parovima ključ-vrijednost
  const addToCategory = function (selectedMovie, key) {
    setCategories((prevCategories) => {
      const categoryMovies = prevCategories[key] || [];
      //* provjera postojanosti filma
      const movieExist = categoryMovies.some(
        (e) => e.imdbID === selectedMovie.imdbID
      );

      //*ako film postoji, briše se, ako ne, dodaje se u listu
      const updatedMovies = movieExist
        ? categoryMovies.filter(
            (movie) => movie.imdbID !== selectedMovie.imdbID
          )
        : [...categoryMovies, selectedMovie];

      //* ispis poruke za dodavanje filma
      setMessage(
        movieExist
          ? `Movie removed from the ${key} category ⛔`
          : `Movie added to the ${key} category ✅`
      );
      setTimeout(() => setMessage(""), 1000);
      //* ispis filma u kategoriji
      return {
        ...prevCategories,
        [key]: updatedMovies,
      };
    });
  };

  const handleDeleteMovie = function (movie, active) {
    console.log(active);
    setCategories((prevCategories) => ({
      ...prevCategories, //* kopiramo sve postojeće kategorije
      [active]: prevCategories[active].filter((e) => e.imdbID !== movie.imdbID),
    }));

    setActiveIcon((prevState) => {
      if (!prevState[movie.imdbID]) return prevState; // Ako nema podataka za film, ne menjamo state
      const updatedIcons = { ...prevState[movie.imdbID] };
      console.log(updatedIcons);
      delete updatedIcons[active]; // Brišemo samo određenu kategoriju

      return {
        ...prevState,
        [movie.imdbID]: updatedIcons, // Ažuriramo stanje samo za taj film
      };
    });
  };

  //*Promjena aktivne ikona- watch later, my playlist, favourites
  const handleActiveIcon = function (category, id) {
    setActiveIcon((prevState) => ({
      ...prevState, //zadržava prethodne vrijednosti, tj kopiramo ga, npr sve ključeve
      [id]: {
        ...prevState[id], // kopiramo sva stanja unutar ključa, ne brišu se nego se samo mijenjaju
        // optional chaining- ako ne postoji kategorija, ne vraća error
        [category]: !prevState[id]?.[category], // ključ(kategorija): state sa id(ključ filma) uvjet koji mijenja vrijednost suprotno od sadašnje za tu kategoriju
      },
    }));
  };

  //* USE EFFECT - fetching data key
  useEffect(
    function () {
      async function fetchMovies() {
        try {
          setIsLoading(true);
          setError("");
          setHeaderMessage(false);
          const res = await fetch(
            `https://www.omdbapi.com/?apikey=${KEY}&s=${query}`
          );
          if (!res.ok)
            throw new Error("Something went wrong, try again later!");

          const data = await res.json();
          if (data.Response === "False") throw new Error("Movies not found");
          setMovies(data.Search);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }

      if (query.length < 3) {
        setMovies([]);
        setError("");
        setHeaderMessage(true);
        return;
      }
      fetchMovies();
    },
    [query]
  );

  return (
    <div className="container">
      <NavBar>
        <SearchInput setQuery={setQuery}></SearchInput>
        <NumResults movies={movies}></NumResults>
      </NavBar>
      <Main>
        <MainCategory
          active={active}
          onActive={handleActive}
          setCategories={setCategories}
        ></MainCategory>

        <FilteredMovies data={movies}>
          {headerMessage && <MessageSearch></MessageSearch>}
          {error && <ErrorMessage message={error}></ErrorMessage>}
          {!isLoading && !error && active === "home" && (
            <MovieList
              active={active}
              addToCategory={addToCategory}
              setError={setError}
              movies={movies}
              onActiveIcon={handleActiveIcon}
              activeIcon={activeIcon}
              message={message}
            ></MovieList>
          )}

          {!isLoading && active !== "home" && (
            <SavedMovie
              categories={categories}
              active={active}
              onDeleteMovie={handleDeleteMovie}
            ></SavedMovie>
          )}
        </FilteredMovies>
      </Main>
    </div>
  );
}

function MessageSearch() {
  return <p>Search movies</p>;
}

function NavBar({ children }) {
  return (
    <div className="header">
      <div className="navBar">
        <h2>🌟StarView</h2>
        {children}
      </div>
    </div>
  );
}

function SearchInput({ setQuery }) {
  return (
    <div className="inputField">
      <input
        onChange={(e) => {
          setQuery(e.target.value);
        }}
        placeholder="Search...."
      ></input>
    </div>
  );
}
function NumResults({ movies }) {
  return (
    <p>
      Found <b>{movies.length}</b> results
    </p>
  );
}

function Main({ children }) {
  return <div className="main">{children}</div>;
}

//* ******************************** NAVIGATION; CATEGORY MENU ****************************************
//* Lista sa kategorijama na stranici--> manu, favourites, myplaylist
function MainCategory({ onActive, active }) {
  const categories = [
    { id: "home", label: "Home", icon: "img/home-smile-svgrepo-com.svg" },
    {
      id: "myPlaylist",
      label: "My playlist",
      icon: "img/bookmark-empty-svgrepo-com.svg",
    },
    {
      id: "favourites",
      label: "Favourites",
      icon: "img/favourites-stars-svgrepo-com.svg",
    },
    {
      id: "watchLater",
      label: "Watch later",
      icon: "img/clock-three-svgrepo-com.svg",
    },
  ];

  return (
    <div className="mainCategory">
      <ul>
        {categories.map((category) => (
          <li
            key={category.id}
            onClick={(e) => {
              onActive(category.id);
              e.preventDefault();
            }}
            className={active === category.id ? "activeBtn" : ""}
          >
            <img alt={category.id} src={category.icon}></img>
            <a href={category.id}>{category.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilteredMovies({ children }) {
  return <div className="searchedMovies">{children}</div>;
}

//* movies? --- obratiti pažnju
//* postavljanje uvjeta selectedId &&, generira se novi element overlay koji sadrži skočni prozor sa informacijama o filmu
function MovieList({
  movies,
  setError,
  addToCategory,
  active,
  onActiveIcon,
  activeIcon,
  message,
}) {
  //* selectedId for handling operations
  const [selectedId, setSelectedId] = useState(null);
  //* fetched movie
  const [selectedMovie, setSelectedMovie] = useState([]);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  //* Klikom na zatvaranje filma,selectedMovie se prazni, overlay se postavlja na false
  const handleCloseMovieWindow = function () {
    setSelectedMovie([]);
    setOverlayOpen(false);
  };

  //* Klikom na film, poziva se useState koji mijenja selectedId i pokreće se useEffect funkcija zbog promjene istog, postavlja se overlayOpen = true
  const handleSelectedMovie = function (selectedID) {
    setSelectedId(selectedID);
    setOverlayOpen(true);
  };

  //* USE EFFECT - fetching data
  useEffect(
    function () {
      async function getMovieDetails() {
        try {
          setIsLoading(true);
          setError("");
          const res =
            await fetch(`https://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}
  `);
          if (!res.ok)
            throw new Error("Something went wrong, try again later!");

          const data = await res.json();

          setSelectedMovie(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }
      getMovieDetails();
    },
    [selectedId, setError]
  );

  return (
    <div className="heroMovies">
      {isLoading && <Loader className="loadingOverlay"></Loader>}
      {!overlayOpen && (
        <div className="movieGrid">
          {movies.map((movie) => (
            <Movie
              addToCategory={addToCategory}
              movie={movie}
              key={movie.imdbID}
              onSelectMovie={handleSelectedMovie}
              onActiveIcon={onActiveIcon}
            ></Movie>
          ))}
        </div>
      )}
      {isLoading && <Loader className="loadingOverlay"></Loader>}
      {overlayOpen && !isLoading && (
        <div className="movieOverlay">
          <OverlayMovie
            addToCategory={addToCategory}
            active={active}
            closeMovieWindow={handleCloseMovieWindow}
            selectedMovie={selectedMovie}
            onActiveIcon={onActiveIcon}
            activeIcon={activeIcon}
            message={message}
          ></OverlayMovie>
        </div>
      )}
    </div>
  );
}

function Movie({ movie, onSelectMovie }) {
  return (
    <div
      className="singleMovie"
      onClick={() => {
        onSelectMovie(movie.imdbID);
      }}
    >
      <img alt="#" src={movie.Poster}></img>
      <p>{movie.Title}</p>
      <p>{movie.Year}</p>
    </div>
  );
}

function OverlayMovie({
  selectedMovie,
  closeMovieWindow,
  addToCategory,
  onActiveIcon,
  activeIcon,
  message,
}) {
  const {
    Title: title,
    Actors: actors,
    Genre: genre,
    Poster: poster,
    Plot: plot,
    Released: released,
    Runtime: runtime,
    Year: year,
    imdbRating: rating,
    imdbID: imdbID,
    Director: director,
  } = selectedMovie;
  console.log(message);
  return (
    <div className="movieBox">
      <div className="movieImg">
        <img alt="#" src={poster}></img>
      </div>
      <div className="movieInfo">
        <header>
          <h2>{title}</h2>
          <span>{released}</span> | <span>{runtime}</span> | <span>18+</span>|
          <span>{rating}⭐</span>
        </header>
        <section>
          <p>{plot}</p>
        </section>
        <footer>
          <p>Genre: {genre}</p>
          <p>Director: {director}</p>
          <p>Actors: {actors}</p>
          <div>
            {
              <img
                alt="#"
                src={
                  !activeIcon[imdbID]?.myPlaylist
                    ? "img/bookmark-empty-svgrepo-com.svg"
                    : "img/bookmark-fill-svgrepo-com.svg"
                }
                onClick={(e) => {
                  onActiveIcon("myPlaylist", selectedMovie.imdbID);
                  addToCategory(selectedMovie, "myPlaylist");
                }}
              ></img>
            }
            <img
              alt="#"
              src={
                !activeIcon[imdbID]?.favourites
                  ? "img/favourites-stars-svgrepo-com.svg"
                  : "img/favourites-filled-star-symbol-svgrepo-com.svg"
              }
              onClick={(e) => {
                onActiveIcon("favourites", selectedMovie.imdbID);
                addToCategory(selectedMovie, "favourites");
              }}
            ></img>
            <img
              alt="#"
              src={
                !activeIcon[imdbID]?.watchLater
                  ? "img/clock-three-svgrepo-com.svg"
                  : "img/clock-svgrepo-fill-com.svg"
              }
              onClick={(e) => {
                onActiveIcon("watchLater", selectedMovie.imdbID);
                addToCategory(selectedMovie, "watchLater");
              }}
            ></img>
          </div>
          {message && (
            <div className="addMovieMessage">
              <p>{message}</p>
            </div>
          )}
        </footer>
      </div>
      <div className="movieButton">
        <button id="closeBtn" onClick={closeMovieWindow}>
          ❌
        </button>
      </div>
    </div>
  );
}

const SavedMovie = function ({ categories, active, onDeleteMovie }) {
  return (
    <>
      {categories[active].map((e, index) => (
        <div className="savedMovie" key={index}>
          <img alt="#" src={e.Poster}></img>
          <div className="savedMovieInfo">
            <h3 key={index}>{e.Title}</h3>
            <span>{e.Genre}</span>
            <span>{e.Year}</span>
          </div>
          <div className="savedMovieButton">
            <button onClick={() => onDeleteMovie(e, active)}>❌</button>
          </div>
        </div>
      ))}
    </>
  );
};

//* Small components for manipulation messages
function Loader({ className }) {
  return <p className={className}>Loading...</p>;
}

function ErrorMessage({ message }) {
  return <h3>⛔ {message}</h3>;
}
