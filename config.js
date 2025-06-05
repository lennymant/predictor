const CONFIG = {
    MAX_VOTES: 4,
    BASE_PATH: '/predictor',
    IGNORED_TEAMS: ['BRN'], // Burnley's team code
    IGNORED_TEAM_NAMES: ['Burnley'] // Full team name for reference
};

// Helper function to get full path
function getPath(path) {
    return `${CONFIG.BASE_PATH}${path}`;
}

module.exports = { CONFIG, BASE_PATH, getPath };

// Export for use in browser
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
} 