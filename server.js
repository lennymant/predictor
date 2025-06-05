const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Clear module cache on startup
Object.keys(require.cache).forEach(key => {
    if (key.includes('teams.json')) {
        delete require.cache[key];
    }
});

const teams = require('./teams.json');
const TEAMS = teams.filter(team => team.team !== 'Burnley').map(team => team.team);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ status: 'ok' });
});

// Teams API endpoint
app.get('/api/teams', (req, res) => {
    console.log('Teams endpoint hit');
    res.json(teams.filter(team => team.team !== 'Burnley'));
});

// Predictions API endpoint
app.get('/api/current-predictions', (req, res) => {
    console.log('Predictions endpoint hit');
    try {
        // Check if file exists, if not create empty array
        if (!fs.existsSync('predictions.txt')) {
            console.log('predictions.txt does not exist, returning empty object');
            res.setHeader('Content-Type', 'application/json');
            return res.json({});
        }

        const data = fs.readFileSync('predictions.txt', 'utf8');
        console.log('Raw file data:', data);
        
        // If file is empty or invalid, return empty object
        if (!data.trim() || data.trim() === '[]') {
            console.log('File is empty or contains only [], returning empty object');
            res.setHeader('Content-Type', 'application/json');
            return res.json({});
        }
        
        // Clean up the data - remove any trailing commas and ensure proper JSON array format
        let cleanedData = data.trim();
        console.log('Cleaned data before parsing:', cleanedData);
        
        if (cleanedData.startsWith('[') && cleanedData.endsWith(']')) {
            // Remove any trailing commas before the closing bracket
            cleanedData = cleanedData.replace(/,(\s*])/g, '$1');
        } else {
            // If not a proper array, wrap in array brackets
            cleanedData = '[' + cleanedData + ']';
        }
        
        console.log('Data after cleaning:', cleanedData);
        
        // Parse the cleaned data
        const predictions = JSON.parse(cleanedData);
        console.log('Parsed predictions:', predictions);
        
        const predictionDetails = {};

        // Initialize prediction details for all teams using codes
        teams.filter(team => team.team !== 'Burnley').forEach(team => {
            predictionDetails[team.code] = {
                'first_home': [],
                'first_away': [],
                'last_home': [],
                'last_away': []
            };
        });

        // Collect predictor names for each option
        predictions.forEach(record => {
            if (!record.predictions) {
                console.log('Skipping record without predictions:', record);
                return;
            }
            
            const predictions = Array.isArray(record.predictions) ? record.predictions : [record.predictions];
            predictions.forEach(prediction => {
                const [teamCode, type] = prediction.split(':');
                if (predictionDetails[teamCode] && predictionDetails[teamCode][type]) {
                    predictionDetails[teamCode][type].push(record.name);
                }
            });
        });

        console.log('Final prediction details:', predictionDetails);
        
        // Set proper content type and send JSON response
        res.setHeader('Content-Type', 'application/json');
        res.json(predictionDetails);
    } catch (error) {
        console.error('Error in /api/current-predictions:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: 'Error reading predictions' });
    }
});

// Function to inject navigation into HTML
function injectNavigation(html) {
    const navHtml = fs.readFileSync(__dirname + '/public/nav.html', 'utf8');
    return html.replace('</head>', `${navHtml}</head>`);
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/name.html');
});

app.post('/start', (req, res) => {
    const name = req.body.name.trim();
    if (!name) return res.redirect('/');

    // Load existing predictions to check for name
    let allPredictions = [];
    try {
        const data = fs.readFileSync('predictions.txt', 'utf8');
        allPredictions = JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is empty, start with empty array
        allPredictions = [];
    }

    // Check if name already exists in predictions
    const nameExists = allPredictions.some(pred => pred.name.toLowerCase() === name.toLowerCase());
    if (nameExists) {
        return res.status(400).json({ 
            error: 'This name has already been used. Please choose a different name.' 
        });
    }

    res.redirect(`/vote?name=${encodeURIComponent(name)}`);
});

app.get('/vote', (req, res) => {
    const name = req.query.name;
    if (!name) return res.redirect('/');
    res.sendFile(__dirname + '/public/vote.html');
});

app.post('/submit', (req, res) => {
    console.log('Submit endpoint hit with body:', req.body);
    const { name, predictions } = req.body;
    
    if (!name || !predictions) {
        console.error('Missing name or predictions:', req.body);
        return res.status(400).json({ error: 'Name and predictions are required' });
    }

    // Validate predictions
    if (!Array.isArray(predictions) || predictions.length !== 4) {
        return res.status(400).json({ error: 'Exactly 4 predictions are required' });
    }

    // Check for duplicate team selections in first match
    const firstMatchTeams = new Set();
    // Check for duplicate team selections in last match
    const lastMatchTeams = new Set();

    for (const prediction of predictions) {
        const [teamCode, type] = prediction.split(':');
        
        if (type === 'first_home' || type === 'first_away') {
            if (firstMatchTeams.has(teamCode)) {
                return res.status(400).json({ 
                    error: `Team ${teamCode} cannot be selected for both first match home and away` 
                });
            }
            firstMatchTeams.add(teamCode);
        }
        
        if (type === 'last_home' || type === 'last_away') {
            if (lastMatchTeams.has(teamCode)) {
                return res.status(400).json({ 
                    error: `Team ${teamCode} cannot be selected for both last match home and away` 
                });
            }
            lastMatchTeams.add(teamCode);
        }
    }

    // Load existing predictions
    let allPredictions = [];
    try {
        const data = fs.readFileSync('predictions.txt', 'utf8');
        allPredictions = JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is empty, start with empty array
        allPredictions = [];
    }

    // Check if name already exists in predictions
    const nameExists = allPredictions.some(pred => pred.name.toLowerCase() === name.toLowerCase());
    if (nameExists) {
        return res.status(400).json({ 
            error: 'This name has already been used. Please choose a different name.' 
        });
    }

    // Add new prediction
    allPredictions.push({
        name,
        predictions,
        timestamp: new Date().toISOString()
    });

    // Save updated predictions
    fs.writeFileSync('predictions.txt', JSON.stringify(allPredictions, null, 2));

    res.redirect('/review');
});

app.get('/review', (req, res) => {
    res.sendFile(__dirname + '/public/review.html');
});

// Admin endpoint to reset predictions
app.post('/api/reset-predictions', (req, res) => {
    try {
        // Clear the predictions file
        fs.writeFileSync('predictions.txt', '');
        res.status(200).json({ message: 'Predictions reset successfully' });
    } catch (error) {
        console.error('Error resetting predictions:', error);
        res.status(500).json({ error: 'Failed to reset predictions' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});
