# Burnley FC Fixture Predictor

A web application that allows users to predict Burnley FC's first and last home/away fixtures for the 2025-26 season.

## Features

- User name validation to prevent duplicate entries
- Interactive fixture prediction interface
- Real-time validation of team selections
- Mobile-responsive design
- Admin panel for resetting predictions
- Review page to see all current predictions

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
node server.js
```

3. Access the application at `http://localhost:3000`

## Project Structure

- `public/` - Static files and client-side code
  - `name.html` - Name entry page
  - `vote.html` - Prediction interface
  - `review.html` - Current predictions view
  - `apckey25.html` - Admin panel
  - `styles.css` - Global styles
  - `config.js` - Configuration file
- `server.js` - Main server file
- `predictions.txt` - Storage for user predictions

## Technologies Used

- Node.js
- Express.js
- HTML5
- CSS3
- JavaScript (ES6+)
- Google Fonts (Open Sans)

## License

MIT 