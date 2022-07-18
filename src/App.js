import { useReducer, useRef } from "react";
import { useCallback } from "react";
import { useState, useEffect } from "react";
import axios from 'axios';
import styles from './App.module.css';
import { ReactComponent as Check } from './check.svg';
import "@aws-amplify/ui-react/styles.css"; //for aws amplify
import {
  withAuthenticator,
  Button,
  Heading,
  Image,
  View,
  Card,
} from "@aws-amplify/ui-react";

// const initialStories = [
//     {
//         title: 'React',
//         url: 'https://reactjs.org/',
//         author: 'Jordan Walke',
//         num_comments: 3,
//         points: 4,
//         objectID: 0,
//     },
//     {
//         title: 'Redux',
//         url: 'https://redux.js.org/',
//         author: 'Dan Abramov, Andrew Clark',
//         num_comments: 2,
//         points: 5,
//         objectID: 1,
//     },
// ];

const storiesReducer = (state, action) => {
    switch (action.type) {
        case 'STORIES_FETCH_INIT':
            return {
                ...state,
                isLoading: true,
                isError: false
            };
        case 'STORIES_FETCH_SUCCESS':
            return {
                ...state,
                isLoading: false,
                isError: false,
                data: action.payload
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
            }
        default:
            throw new Error();
    }
};

// const getAsyncStories = () =>
// //new Promise((resolve, reject) => setTimeout(reject, 2000));
//     new Promise(resolve =>
//         setTimeout(() =>
//             resolve({ data: { stories: initialStories } }),
//             2000
//         )
//     );

const useSemiPersistentState = (key, initialState) => {
    const isMounted = useRef(false);

    const [value, setValue] = useState(
        localStorage.getItem(key) || initialState);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
        } else {
            console.log('A');
            localStorage.setItem(key, value);
        }
    }, [value, key]);

    return [value, setValue];
};

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

const App = ({ signOut }) => {

    const [searchTerm, setSearchTerm] = useSemiPersistentState('search', 'React');

    const [url, setUrl] = useState(`${API_ENDPOINT}${searchTerm}`);

    const [stories, dispatchStories] = useReducer(
        storiesReducer,
        { data: [], isLoading: false, isError: false }
    );
    // const [isLoading, setIsLoading] = useState(false);
    // const [isError, setIsError] = useState(false);

    const handleFetchStories = useCallback(async () => {

        dispatchStories({ type: 'STORIES_FETCH_INIT' });

        try {
            const result = await axios.get(url);

            dispatchStories({
                type: 'STORIES_FETCH_SUCCESS',
                payload: result.data.hits,
            });
        }
        catch {
            dispatchStories({ type: 'STORIES_FETCH_FAILURE' })
        };
    }, [url]);

    useEffect(() => {
        handleFetchStories();
    }, [handleFetchStories]);

    const handleRemoveStory = item => {
        dispatchStories({
            type: 'REMOVE_STORY',
            payload: item
        });
    };

    const handleSearchInput = (event) => {
        setSearchTerm(event.target.value);
    }
    const handleSearchSubmit = (event) => {
        setUrl(`${API_ENDPOINT}${searchTerm}`);
        event.preventDefault();
    }

    // const searchedStories = stories.data.filter(story => story.title
    //     .toLowerCase()
    //     .includes(searchTerm.toLowerCase()));

    return (
        <div className={styles.container}>
            <h1 className={styles.headlinePrimary}>My Hacker Stories</h1>
            <Button onClick={signOut}>Sign Out</Button>

            <SearchForm
                searchTerm={searchTerm}
                onSearchInput={handleSearchInput}
                onSearchSubmit={handleSearchSubmit}
            />
            <hr />
            {stories.isError && <p>Something went wrong......</p>}
            {stories.isLoading ? (<p>Loading...</p>) :
                <List list={stories.data} onRemoveItem={handleRemoveStory} />
            }

        </div>
    )
}

const SearchForm = ({ searchTerm, onSearchInput, onSearchSubmit }) =>
(
    <form onSubmit={onSearchSubmit} className={styles.searchForm}>
        <InputWithLabel
            id="search"
            value={searchTerm}
            type="text"
            isFocused
            onInputChange={onSearchInput}
        >
            <strong>Search:</strong>
        </InputWithLabel>
        <button
            type="submit"
            disabled={!searchTerm}
            className={`${styles.button} ${styles.buttonLarge}`}
        >
            Submit
        </button>
    </form>
);

const InputWithLabel = ({ id, value, type, onInputChange, isFocused, children }) => {
    const inputRef = useRef();

    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isFocused]);
    return (
        <>
            <label htmlFor={id} className={styles.label}>
                {children}
            </label>
            <input
                ref={inputRef}
                id={id}
                type={type}
                onChange={onInputChange}
                value={value}
                className={styles.input}
            />
        </>
    );
}

const List = ({ list, onRemoveItem }) =>
    //list.map(({objectID, ...item}) => <Item key={objectID} {...item} />);
    //above uses rest and spread operators
    list.map(item => <Item key={item.objectID} item={item} onRemoveItem={onRemoveItem} />);

//const Item = ({ title, url, author, num_comments, points }) => (
const Item = ({ item, onRemoveItem }) =>
(
    <div className={styles.item}>
        <span style={{ width: '40%' }}><a href={item.url}>{item.title}</a></span>
        <span style={{ width: '30%' }}>{item.author}</span>
        <span style={{ width: '10%' }}>{item.num_comments}</span>
        <span style={{ width: '10%' }}>{item.points}</span>
        <span style={{ width: '10%' }}>
            <button
                className={`${styles.button} ${styles.buttonSmall}`}
                type="button"
                onClick={() => onRemoveItem(item)}
            >
                <Check height="18px" width="18px" />
            </button>
        </span>
    </div>
);

//export default App;
export default withAuthenticator(App);