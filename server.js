const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const { CONFIG, BASE_PATH } = require('./config');
const app = express();
const port = 3001;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure MIME types
app.use((req, res, next) => {
    if (req.path.endsWith('.js')) {
        res.type('application/javascript');
    }
    next();
});

// Serve static files from the public directory under /predictor
app.use(BASE_PATH, express.static('public'));

// Initialize predictions file if it doesn't exist
async function initializePredictionsFile() {
    try {
        await fs.access('predictions.txt');
    } catch (error) {
        // File doesn't exist, create it with empty array
        await fs.writeFile('predictions.txt', JSON.stringify([], null, 2));
    }
}

// Root route handler
app.get(BASE_PATH, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'name.html'));
});

// Vote route handler
app.get(`${BASE_PATH}/vote`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vote.html'));
});

// Review route handler
app.get(`${BASE_PATH}/review`, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'review.html'));
});

// Clear data endpoint
app.get(`${BASE_PATH}/clear`, async (req, res) => {
    console.log('Clear endpoint called');
    try {
        const timestamp = new Date().toISOString();
        const clearComment = ``;
        const emptyPredictions = JSON.stringify([], null, 2);
        
        console.log('Writing to predictions.txt:', clearComment + emptyPredictions);
        
        // Write the comment and empty array to the file
        await fs.writeFile('predictions.txt', clearComment + emptyPredictions);
        console.log('Predictions file cleared successfully at', timestamp);
        
        // Verify the file was written
        const fileContent = await fs.readFile('predictions.txt', 'utf8');
        console.log('File content after clearing:', fileContent);
        
        res.sendFile(path.join(__dirname, 'public', 'clear.html'));
    } catch (error) {
        console.error('Error clearing predictions:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        res.status(500).send('Error clearing predictions');
    }
});

// API endpoints
app.get(`${BASE_PATH}/api/teams`, async (req, res) => {
    try {
        const data = await fs.readFile('teams.json', 'utf8');
        const allTeams = JSON.parse(data);
        
        // Filter out ignored teams
        const teams = allTeams.filter(team => !CONFIG.IGNORED_TEAMS.includes(team.code));
        
        console.log('Filtered teams:', teams.length, 'of', allTeams.length, 'teams');
        console.log('Teams after filtering:', teams.map(t => t.team).join(', '));
        
        res.json(teams);
    } catch (error) {
        console.error('Error reading teams:', error);
        res.status(500).json({ error: 'Error reading teams' });
    }
});

app.get(`${BASE_PATH}/api/current-predictions`, async (req, res) => {
    try {
        let predictions = [];
        try {
            const data = await fs.readFile('predictions.txt', 'utf8');
            predictions = JSON.parse(data);
        } catch (error) {
            console.log('No predictions file or empty file, starting fresh');
            predictions = [];
        }
        
        const predictionDetails = {};
        
        // Initialize prediction details for each team (excluding ignored teams)
        const teams = JSON.parse(await fs.readFile('teams.json', 'utf8'));
        teams
            .filter(team => !CONFIG.IGNORED_TEAMS.includes(team.code))
            .forEach(team => {
                predictionDetails[team.code] = {
                    'first_home': [],
                    'first_away': [],
                    'last_home': [],
                    'last_away': []
                };
            });

        // Process predictions
        predictions.forEach(record => {
            if (record.predictions) {
                record.predictions.forEach(prediction => {
                    const [type, teamCode] = prediction.split(':');
                    if (!CONFIG.IGNORED_TEAMS.includes(teamCode) && 
                        predictionDetails[teamCode] && 
                        predictionDetails[teamCode][type]) {
                        predictionDetails[teamCode][type].push(record.name);
                    }
                });
            }
        });

        console.log('Processed prediction details:', predictionDetails);
        res.json(predictionDetails);
    } catch (error) {
        console.error('Error reading predictions:', error);
        res.status(500).json({ error: 'Error reading predictions' });
    }
});

app.get(`${BASE_PATH}/api/predictions`, async (req, res) => {
    try {
        let predictions = [];
        try {
            const data = await fs.readFile('predictions.txt', 'utf8');
            console.log('Raw predictions from file:', data);
            if (data && data.trim()) {
                predictions = JSON.parse(data);
            }
        } catch (error) {
            console.log('No predictions file or empty file, starting fresh');
            predictions = [];
        }
        
        console.log('Parsed predictions:', predictions);
        
        // Transform predictions into the expected format
        const transformedPredictions = predictions.map(pred => {
            const result = {
                name: pred.name || '',
                firstHome: '',
                firstAway: '',
                lastHome: '',
                lastAway: ''
            };
            
            if (pred.predictions && Array.isArray(pred.predictions)) {
                pred.predictions.forEach(p => {
                    if (typeof p === 'string') {
                        const [type, team] = p.split(':');
                        console.log('Processing prediction:', { type, team, prediction: p });
                        if (type && team && !CONFIG.IGNORED_TEAMS.includes(team)) {
                            switch(type) {
                                case 'first_home':
                                    result.firstHome = team;
                                    break;
                                case 'first_away':
                                    result.firstAway = team;
                                    break;
                                case 'last_home':
                                    result.lastHome = team;
                                    break;
                                case 'last_away':
                                    result.lastAway = team;
                                    break;
                            }
                        }
                    }
                });
            }
            
            console.log('Transformed prediction:', result);
            return result;
        });
        
        console.log('Sending transformed predictions:', transformedPredictions);
        res.json(transformedPredictions);
    } catch (error) {
        console.error('Error reading predictions:', error);
        res.json([]); // Return empty array instead of error
    }
});

app.get(`${BASE_PATH}/api/players`, async (req, res) => {
    try {
        const data = await fs.readFile('predictions.txt', 'utf8');
        // Remove any comment lines before parsing JSON
        const jsonData = data.replace(/^\/\/.*$/gm, '').trim();
        const predictions = JSON.parse(jsonData);
        const players = new Set();
        
        predictions.forEach(record => {
            if (record.name) {
                players.add(record.name);
            }
        });
        
        res.json(Array.from(players));
    } catch (error) {
        console.error('Error reading players:', error);
        res.status(500).json({ error: 'Error reading players' });
    }
});

// Form submission endpoint
app.post(`${BASE_PATH}/submit`, async (req, res) => {
    try {
        const { name, firstHome, firstAway, lastHome, lastAway } = req.body;
        
        console.log('Received prediction:', {
            name,
            firstHome,
            firstAway,
            lastHome,
            lastAway
        });
        
        // Validate input
        if (!name || !firstHome || !firstAway || !lastHome || !lastAway) {
            console.log('Missing required fields:', { name, firstHome, firstAway, lastHome, lastAway });
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Read current predictions
        let predictions = [];
        try {
            const data = await fs.readFile('predictions.txt', 'utf8');
            console.log('Read predictions file:', data);
            predictions = JSON.parse(data);
            console.log('Parsed predictions:', predictions);
        } catch (error) {
            console.log('No predictions file or empty file, starting fresh');
            predictions = [];
        }

        // Check if name has already been used
        const nameExists = predictions.some(pred => pred.name === name);
        if (nameExists) {
            console.log('Name already exists:', name);
            return res.status(400).json({ error: 'This name has already been used' });
        }

        // Add new prediction
        const newPrediction = {
            name,
            predictions: [
                `first_home:${firstHome}`,
                `first_away:${firstAway}`,
                `last_home:${lastHome}`,
                `last_away:${lastAway}`
            ],
            timestamp: new Date().toISOString()
        };
        console.log('Adding new prediction:', newPrediction);
        
        predictions.push(newPrediction);

        // Save updated predictions
        const predictionsJson = JSON.stringify(predictions, null, 2);
        console.log('Writing predictions to file:', predictionsJson);
        
        await fs.writeFile('predictions.txt', predictionsJson);
        console.log('Prediction saved successfully');
        
        res.redirect(`${BASE_PATH}/review`);
    } catch (error) {
        console.error('Error saving prediction:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        res.status(500).json({ error: 'Error saving prediction' });
    }
});

// Start endpoint
app.post(`${BASE_PATH}/start`, async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    res.redirect(`${BASE_PATH}/vote?name=${encodeURIComponent(name)}`);
});

// Debug route for root path
app.get('/', (req, res) => {
    console.log('📥 GET / received (direct root access)');
    const debugInfo = {
        timestamp: new Date().toISOString(),
        serverStatus: 'running',
        basePath: BASE_PATH,
        config: {
            maxVotes: CONFIG.MAX_VOTES,
            ignoredTeams: CONFIG.IGNORED_TEAMS,
            ignoredTeamNames: CONFIG.IGNORED_TEAM_NAMES
        },
        headers: req.headers,
        url: req.url
    };
    res.json(debugInfo);
});

// Initialize predictions file before starting server
initializePredictionsFile().then(() => {
    // Start server
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}${BASE_PATH}`);
    });
});
