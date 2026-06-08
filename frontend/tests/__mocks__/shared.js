/**
 * Shared Mocks for Testing
 * Generic mocks for API client and hooks
 */

/**
 * Mock API Client
 */
export const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

/**
 * Create mock response
 */
export const createMockResponse = (data, status = 'success') => ({
  data: {
    status,
    data,
    timestamp: new Date().toISOString(),
  },
});

/**
 * Create mock hook response
 */
export const createMockHookState = (data = null, loading = false, error = null) => ({
  data,
  loading,
  error,
  isError: !!error,
  isLoading: loading,
  isSuccess: !loading && !error,
});

/**
 * Mock hook factory for creating consistent mock hooks
 */
export const createMockHook = (name, initialState = {}) => {
  return jest.fn(() => ({
    loading: false,
    error: null,
    ...initialState,
    [name]: [],
  }));
};

/**
 * Mock notification function
 */
export const mockAddNotification = jest.fn();
export const createMockNotificationStore = () => ({
  addNotification: mockAddNotification,
  notifications: [],
});

/**
 * Mock Zustand store
 */
jest.mock('zustand', () => {
  return {
    create: jest.fn((fn) => fn({
      getState: jest.fn(),
      setState: jest.fn(),
      subscribe: jest.fn(),
    })),
  };
});

/**
 * Mock React Router
 */
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
  useLocation: jest.fn(() => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  })),
}));

/**
 * Mock Axios client
 */
export const mockAxios = {
  create: jest.fn(() => mockApiClient),
  get: mockApiClient.get,
  post: mockApiClient.post,
  put: mockApiClient.put,
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
};

jest.mock('axios', () => mockAxios);

/**
 * Mock window functions
 */
export const mockFetch = jest.fn();
global.fetch = mockFetch;

/**
 * Mock console methods
 */
export const mockConsole = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
};
