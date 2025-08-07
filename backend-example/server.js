const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for demo (use database in production)
const parcels = new Map();

// Create Parcel Endpoint
app.post('/api/parcels', (req, res) => {
  try {
    console.log('Create Parcel Request:', JSON.stringify(req.body, null, 2));
    
    const parcelData = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'Pending Pickup'
    };
    
    parcels.set(parcelData.id, parcelData);
    
    console.log(`Parcel created: ${parcelData.trackingNumber}`);
    
    res.status(201).json({
      success: true,
      parcel: parcelData
    });
  } catch (error) {
    console.error('Parcel creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Parcel by Tracking Number
app.get('/api/parcels/track/:trackingNumber', (req, res) => {
  const { trackingNumber } = req.params;
  
  const parcel = Array.from(parcels.values()).find(p => p.trackingNumber === trackingNumber);
  
  if (!parcel) {
    return res.status(404).json({ error: 'Parcel not found' });
  }
  
  res.json({
    success: true,
    parcel
  });
});

// Update Parcel Status
app.put('/api/parcels/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const parcel = parcels.get(id);
  
  if (!parcel) {
    return res.status(404).json({ error: 'Parcel not found' });
  }
  
  parcel.status = status;
  parcel.updatedAt = new Date().toISOString();
  
  parcels.set(id, parcel);
  
  res.json({
    success: true,
    parcel
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Parcel Tracker API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 