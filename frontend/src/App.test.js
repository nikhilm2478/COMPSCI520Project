import { render, screen, fireEvent, waitFor} from '@testing-library/react';
import App from './App';
import UserLogin from './pages/UserLogin';
import { BrowserRouter } from 'react-router-dom';
import Landing from './pages/Landing';
import SearchMovie from './pages/SearchMovie';
import MovieRecommender from './components/MovieRecommender/MovieRecommender';
import DisplayMovie from './pages/DisplayMovie';

//tests for multiple pages are run in this file

//App.,js test
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

//UserLogin test
test('renders email input and login button', () => {
  render(
    <BrowserRouter>
      <UserLogin />
    </BrowserRouter>
  );
  
  const emailInput = screen.getByPlaceholderText('Enter Your Email');
  expect(emailInput).toBeInTheDocument();

  const loginButton = screen.getByText('Log In');
  expect(loginButton).toBeInTheDocument();
});

//Landing tests
describe('Landing Component', () => {
  test('renders Header component', () => {
    render(<Landing />);
    expect(screen.getByText('HeaderMock')).toBeInTheDocument();
  });

  test('renders ScrollableSection components', () => {
    render(<Landing />);
    expect(screen.getAllByText(/ScrollableSectionMock/)).toHaveLength(2);  // Expect two ScrollableSections
  });

  test('renders SearchMovie within ScrollableSection', () => {
    render(<Landing />);
    expect(screen.getByText('SearchMovieMock')).toBeInTheDocument();
  });

  test('renders Checkbox within ScrollableSection', () => {
    render(<Landing />);
    expect(screen.getByText('CheckboxMock')).toBeInTheDocument();
  });
});

//SearchMovie tests
// mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      results: [
        { id: 1, poster_path: '/path1.jpg', original_title: 'Movie Title 1', overview: 'Description 1' },
        { id: 2, poster_path: '/path2.jpg', original_title: 'Movie Title 2', overview: 'Description 2' }
      ]
    })
  })
);

// mock MovieRecommender
jest.mock('./components/MovieRecommender/MovieRecommender', () => (props) => (
  <div data-testid="movie-recommender">{props.movies.map(movie => movie.title).join(", ")}</div>
));

describe('SearchMovie Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('input updates on change', () => {
    render(<SearchMovie />);
    const inputElement = screen.getByPlaceholderText('Search for Movie');
    fireEvent.change(inputElement, { target: { value: 'Star Wars' } });
    expect(inputElement.value).toBe('Star Wars');
  });

  test('search triggers API call and displays results', async () => {
    render(<SearchMovie />);
    const inputElement = screen.getByPlaceholderText('Search for Movie');
    const searchButton = screen.getByText('Search');

    fireEvent.change(inputElement, { target: { value: 'Star Wars' } });
    fireEvent.click(searchButton);

    await screen.findByTestId('movie-recommender');

    expect(fetch).toHaveBeenCalled();
    expect(screen.getByTestId('movie-recommender').textContent).toContain('Movie Title 1, Movie Title 2');
  });

  test('does not render MovieRecommender without results', () => {
    render(<SearchMovie />);
    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);

    const movieRecommender = screen.queryByTestId('movie-recommender');
    expect(movieRecommender).toBeNull();
  });
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({})
  })
);

// Set up a sample movie data
const movie = {
  imdb_id: "tt1234567",
  original_title: "Sample Movie",
  original_language: "en",
  genres: [{ id: 1, name: "Action" }],
  poster_path: "sample.jpg",
  release_date: "2021-01-01",
  vote_average: 8.2,
  overview: "A brief overview of the movie."
};

describe('DisplayMovie Component', () => {
  beforeEach(() => {
    // Set global values
    globalThis.prefMovId = ["tt1234567"];
    globalThis.userName = "TestUser";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders movie details correctly', () => {
    render(<DisplayMovie movie={movie} />);

    expect(screen.getByText("Sample Movie")).toBeInTheDocument();
    expect(screen.getByText(/A brief overview of the movie./)).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  test('toggle favorite status and calls API', async () => {
    render(<DisplayMovie movie={movie} />);
    
    const starIcon = screen.getByRole('img'); // assuming the SVG has a role of 'img'
    fireEvent.click(starIcon);

    // After click, check if the global state has been updated and API was called
    expect(global.fetch).toHaveBeenCalled();
    expect(globalThis.prefMovId).not.toContain(movie.imdb_id); // assuming it was initially favorited

    // Simulate another click to re-favorite
    fireEvent.click(starIcon);
    expect(globalThis.prefMovId).toContain(movie.imdb_id);
  });

  test('does not show star icon if userName is undefined', () => {
    globalThis.userName = undefined; // User not logged in
    render(<DisplayMovie movie={movie} />);

    expect(screen.queryByRole('img')).toBeNull();
  });
});

