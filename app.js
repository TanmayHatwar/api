const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from .env file

const app = express();

app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Get API key from environment variable
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

app.get('/', (req, res) => {
    console.log("Hello World");
    res.send('Hello World!')
  })
  

app.post('/format-data', async (req, res) => {
    const { text } = req.body;
    console.log("text " + text);
    console.log(OPENAI_API_KEY);
    if (!text) {
        return res.status(400).json({ error: 'Text data is required' });
    }

    const prompt = `
    if it is a ticket do doc type as ticket
    if it looks like an aadhar card, pan card, passport then give the doc type accordingly and put Passenger Name as the name of teh person of this card
    When you get the name of station or Passenger name you format it like first letter capital for first letter and rest all small
    In case of timings convert it into AM/PM 12 hrs format
    In case of dates follow DD/MM/YYYY format
        Please extract and format the following booking details into a JSON format. Include only the following information:
        - Doc Type
        - PNR
        - Train Number
        - Passenger Name
        - Arrival Date
        - Arrival Time
        - Arrival Station
        - Departure Date
        - Departure Time
        - Departure Station

        Here are the details:
        ${text}

        Provide the information in this JSON format:
        {
          "Doc Type": "value",
          "pnr": "value",
          "train_number": "value",
          "passenger_name": "value",
          "arrival_date": "value",
          "arrival_time": "value",
          "arrival_station": "value",
          "departure_date": "value",
          "departure_time": "value",
          "departure_station": "value"
        }
    `;

    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 1500,
                temperature: 0.5
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Log the full response to debug
        console.log('Raw response data:', response.data);

        // Access the message content directly
        let messageContent = response.data.choices[0].message.content;

        // Log the message content to debug
        console.log('Message content:', messageContent);

        // Clean up the message content
        messageContent = messageContent
            .replace(/^```json/, '') // Remove leading triple backticks and json label
            .replace(/```$/, '') // Remove trailing triple backticks
            .trim(); // Remove any extra whitespace

        // Debug output
        console.log('Cleaned message content:', messageContent);

        // Try to parse the cleaned JSON response
        try {
            const formattedJson = JSON.parse(messageContent);
            res.json(formattedJson);
        } catch (parseError) {
            console.error('Failed to parse JSON:', parseError.message);
            res.status(500).json({ error: 'Failed to parse JSON response' });
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to process the text' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
