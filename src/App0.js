import { useEffect, useState, useReducer, useRef, useCallback } from "react";
import axios from 'axios';

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

const useSemiPersistentState = (key, initialState) => {
  /*
  useState is a Hook that lets you add React state to function components.
  useState returns the current state and a function to update it.
  useState take as argument the initial state value.
  useState can be used for multiple state variables.
  useState can hold primitives, objects or arrays.
  useState always replace the state variable when updating it instead of merging it.
  The update state function can accept a function. This function receives the previous state value, and returns an updated value.
  */
  const [value, setValue] = useState(
    localStorage.getItem(key) || initialState
  );

  /*
  useEffect is a Hook that lets you perform "side effects" in function components, such as data fetching, manual DOM manipulation, and so on...
  useEffect accepts a function as argument.
  useEffect runs after every render.
  useEffect accepts a second argument: the dependencies array. It tells React to run the effect function only if one of the dependencies as changed.
  You can pass an empty array ([]) to run it only once.
  useEffect lets you clean up any effect you have used by returning clean up function.

   */
  useEffect(() => {
    localStorage.setItem(key, value);
  }, [value, key]);

  return [value, setValue];
};

const storiesReducer = (state, action) => {
  switch (action.type) {
    case 'STORIES_FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'STORIES_FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case 'STORIES_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case 'REMOVE_STORY':
      return {
        ...state,
        data: state.data.filter(
          story => action.payload.objectID !== story.objectID
        ),
      };
    default:
      throw new Error();
  }
};

/*
useMemo helps with performance optimization by returning a memoized value of an expensive computation.
useMemo accepts as arguments a function and a dependencies array.
useMemo will only recompute the memoized value if one of the dependencies has changed.
*/

const App = () => {
  const [searchTerm, setSearchTerm] = useSemiPersistentState(
    'search',
    'React'
  );

  const [url, setUrl] = useState(
    `${API_ENDPOINT}${searchTerm}`
  );

  /*
useReducer lets you use reducers to manage your application state. This is an alternative to the state hook, useState.
useReducer accepts as argument a reducer of type (state, action) => newState. It returns the current state and a dispatch method.
*/
  const [stories, dispatchStories] = useReducer(
    storiesReducer,
    { data: [], isLoading: false, isError: false }
  );


  /*
  useCallback returns a memoized version of a callback.
  useCallback accepts as arguments a callback and a dependencies array.
  The callback only changes if one of the dependencies has changed.
  */
  const handleFetchStories = useCallback(() => {
    dispatchStories({ type: 'STORIES_FETCH_INIT' });

    // fetch(url)
    //   .then(response => response.json())

    axios
      .get(url)
      .then(result => {
        dispatchStories({
          type: 'STORIES_FETCH_SUCCESS',
          payload: result.data.hits,
        });
      })
      .catch(() =>
        dispatchStories({ type: 'STORIES_FETCH_FAILURE' })
      );
  }, [url]);

  useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]);

  const handleRemoveStory = item => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item,
    });
  };

  const handleSearchInput = event => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = () => {
    setUrl(`${API_ENDPOINT}${searchTerm}`);
  };

  return (
    <div>
      <h1>My Hacker Stories</h1>

      <InputWithLabel
        id="search"
        value={searchTerm}
        isFocused
        onInputChange={handleSearchInput}
      >
        <strong>Search:</strong>
      </InputWithLabel>

      <button
        type="button"
        disabled={!searchTerm}
        onClick={handleSearchSubmit}
      >
        Submit
      </button>

      <hr />

      {stories.isError && <p>Something went wrong ...</p>}

      {stories.isLoading ? (
        <p>Loading ...</p>
      ) : (
        <List list={stories.data} onRemoveItem={handleRemoveStory} />
      )}
    </div>
  );
};

const InputWithLabel = ({
  id,
  value,
  type = 'text',
  onInputChange,
  isFocused,
  children,
}) => {
  const inputRef = useRef(); //useRef lets you access DOM element

  useEffect(() => {
    if (isFocused) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  return (
    <>
      <label htmlFor={id}>{children}</label>
      &nbsp;
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={onInputChange}
      />
    </>
  );
};

const List = ({ list, onRemoveItem }) =>
  list.map(item => (
    <Item
      key={item.objectID}
      item={item}
      onRemoveItem={onRemoveItem}
    />
  ));

const Item = ({ item, onRemoveItem }) => (
  <div>
    <span>
      <a href={item.url}>{item.title}</a>
    </span>
    <span>{item.author}</span>
    <span>{item.num_comments}</span>
    <span>{item.points}</span>
    <span>
      <button type="button" onClick={() => onRemoveItem(item)}>
        Dismiss
      </button>
    </span>
  </div>
);

export default App;