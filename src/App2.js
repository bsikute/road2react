import { useCallback } from "react";
import { useEffect, useReducer } from "react";
import { useState } from "react";
import axios from "axios";

// const list = [
//     {
//         id: 1,
//         name: 'Ben Phiri',
//         age: 34
//     },
//     {
//         id: 2,
//         name: 'Mike Tembo',
//         age: 23
//     },
//     {
//         id: 3,
//         name: 'Jen Sikute',
//         age: 18
//     },
//     {
//         id: 4,
//         name: 'Kate Aviella',
//         age: 28
//     },
// ];

const storiesReducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_INIT_STORIES':
            return {
                ...state,
                isLoading: true,
                isError: false
            }
        case 'SET_STORIES':
            return {
                ...state,
                isLoading: false,
                isError: false,
                data: action.payload
            }
        case 'REMOVE_STORY':
            const newStories = state.data.filter(item =>
                item._id !== action.payload._id);
            return {
                ...state,
                data: newStories
            }
        case 'FETCH_FAILURE':
            return {
                ...state,
                isLoading: false,
                isError: true
            }
        default:
            return {
                ...state,
                data: action.payload
            }
    }
}

const API_ENDPOINT = 'https://shortstories-api.herokuapp.com/stories';

const App2 = () => {

    const initialState = {
        data: [],
        isLoading: false,
        isError: false
    }

    const [stories, dispatchStories] = useReducer(
        storiesReducer,
        initialState
    );

    const [searchString, setSearchString] = useState('');

    const [searchedString, setSearchedString] = useState(
        localStorage.getItem('searchedString') || ''
    );

    const handleSearchSubmit = useCallback(async () => {

        try {
            dispatchStories({
                type: 'FETCH_INIT_STORIES'
            });

            const result = await axios.get(API_ENDPOINT);

            dispatchStories({
                type: 'SET_STORIES',
                payload: result.data
            });
        }
        catch {
            dispatchStories({
                type: 'FETCH_FAILURE'
            });
        };
    }, [searchedString]);

    useEffect(() => {
        handleSearchSubmit();
    }, [handleSearchSubmit]);

    const handleChange = (event) => {
        setSearchString(event.target.value);
    }
    const handleSubmit = (event) => {
        event.preventDefault();
        setSearchedString(searchString);
        localStorage.setItem('searchedString', searchString);
    }

    const handleRemove = (item) => {
        dispatchStories({
            type: 'REMOVE_STORY',
            payload: item
        });
    };

    const selectedStories = stories.data.filter(story =>
        story.title
            .toLowerCase()
            .includes(searchedString.toLowerCase())
    );

    return (
        <div className="content">
            <br />
            <h1>Stories</h1>
            <hr />
            <Search
                searchString={searchString}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
            >
                <strong>Search: </strong>
            </Search>
            {stories.isError && <p>Error occurred fetching data...</p>}
            {stories.isLoading ? (<p>Loading...<img alt='loading' src='/img/loading.gif' /></p>)
                :
                <List selectedStories={selectedStories} handleRemove={handleRemove} />}
        </div>
    );
}

const Search = ({ searchString, handleChange, handleSubmit, children }) => {
    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label htmlFor="search">{children}</label>
                <input
                    id="search"
                    type='text'
                    value={searchString}
                    onChange={handleChange}
                />
                <button onClick={handleSubmit} type="submit">Submit</button>
            </form>
        </div>
    );
}

const List = ({ selectedStories, handleRemove }) => {
    return (
        <div className="blog-preview">
            {selectedStories.map(item =>
                <ul key={item._id}>
                    <h2>{item.title}</h2>
                    <span>{item.author} &nbsp;</span>
                    <div className="blog-details">{item.moral}</div>
                    <span><button className="blog-details" onClick={() => handleRemove(item)}>Dismiss</button></span>
                </ul>
            )
            }
        </div>
    );
}

export default App2;