// Client-side configuration
const CONFIG = {
    MAX_VOTES: 4
};

// Base path configuration
const BASE_PATH = '/predictor';

// Helper function to get full path
function getPath(path) {
    return `${BASE_PATH}${path}`;
}

// Export for browser
window.CONFIG = CONFIG;
window.BASE_PATH = BASE_PATH;
window.getPath = getPath; 