const CONFIG = {
    MAX_VOTES: 4,
    IGNORED_TEAMS: ['BRN'], // Burnley's team code
    IGNORED_TEAM_NAMES: ['Burnley'] // Full team name for reference
};

const BASE_PATH = '/predictor';

// Helper function to get full path
function getPath(path) {
    return `${BASE_PATH}${path}`;
}

module.exports = { CONFIG, BASE_PATH, getPath };

// Export for use in browser
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
} 