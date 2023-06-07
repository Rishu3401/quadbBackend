const express = require('express');
const mongoose = require('mongoose');
const dotenv = require("dotenv");

const axios = require('axios');
const app = express();
dotenv.config({ path: './config.env' });
require('./db/conn');
const PORT = process.env.PORT || 5000;
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

mongoose.connect('mongodb+srv://rishukumar3401:8tqbQXx2F6yqNLFp@cluster0.oe1sxnd.mongodb.net/information', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const tickerSchema = new mongoose.Schema({
    name: String,
    last: Number,
    buy: Number,
    sell: Number,
    volume: Number,
    base_unit: String,
});

const tickers1Schema = new mongoose.Schema({
    market: Number,
    buy: Number,
    sell: Number,
    currency: String,
    virtualCurrency: String,
});

const Ticker = mongoose.model('Ticker', tickerSchema);
const Tickers1 = mongoose.model('Tickers1', tickers1Schema);

axios.get('https://api.wazirx.com/api/v2/tickers')
    .then(response => {
        const tickers = response.data;
        const top10Tickers = Object.values(tickers).slice(0, 10);

        top10Tickers.forEach(ticker => {
            const { name, last, buy, sell, volume, base_unit } = ticker;

            const newTicker = new Ticker({
                name,
                last,
                buy,
                sell,
                volume,
                base_unit,
            });

            newTicker.save()
                .then(() => console.log('Ticker saved to database'))
                .catch(error => console.log('Error saving ticker:', error));
        });
    })
    .catch(error => console.log('Error fetching tickers:', error));

axios.get('https://www.zebapi.com/pro/v1/market/')
    .then(response => {
        const zebapiTickers = response.data;

        zebapiTickers.forEach(ticker => {
            const { market, buy, sell, currency, virtualCurrency } = ticker;

            const newTicker1 = new Tickers1({
                market,
                buy,
                sell,
                currency,
                virtualCurrency,
            });

            newTicker1.save()
                .then(() => console.log('Zebapi Ticker saved to database'))
                .catch(error => console.log('Error saving Zebapi ticker:', error));
        });
    })
    .catch(error => console.log('Error fetching Zebapi tickers:', error));

app.get('/tickersdetails', (req, res) => {
    Ticker.find({})
        .limit(10)
        .then(tickers => {
            const tickersWithDetails = tickers.map(ticker => {
                const { name, last, buy, sell, volume, base_unit } = ticker;
                const difference = ((sell - buy) / buy) * 100;
                const saving = buy - last;

                return {
                    name,
                    last,
                    buy,
                    sell,
                    difference,
                    saving,
                    base_unit
                };
            });

            res.json(tickersWithDetails);
        })
        .catch(err => {
            res.status(500).json({ error: err.message });
        });
});

app.get('/zebapitickersdetails', (req, res) => {
    const allowedVirtualCurrencies = ['ETH', 'BTC', 'XRP', 'TRX', 'DASH', 'ZEC', 'WIN'];
  
    Tickers1.find({
        currency: 'INR',
        virtualCurrency: { $in: allowedVirtualCurrencies }
    })
        .limit(10)
        .then(tickers => {
            const tickersWithDetails = tickers.map(ticker => {
                const { market, buy, sell, currency, virtualCurrency } = ticker;
                const difference = ((sell - buy) / buy) * 100;
                const saving = buy - sell;

                return {
                    market,
                    buy,
                    sell,
                    difference,
                    saving,
                    currency,
                    virtualCurrency,
                };
            });

            res.json(tickersWithDetails);
        })
        .catch(err => {
            res.status(500).json({ error: err.message });
        });
});

app.listen(PORT, () => {
    console.log(`Server Started ${PORT}`);
  });






