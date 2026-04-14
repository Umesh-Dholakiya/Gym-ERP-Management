const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Equipment', 'Supplements', 'Merchandise', 'Maintenance', 'Others']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0
  },
  unit: {
    type: String,
    default: 'pcs'
  },
  price: {
    type: Number,
    required: [true, 'Price is required']
  },
  minThreshold: {
    type: Number,
    default: 5,
    helpText: 'Notify when stock falls below this level'
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  supplier: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock'],
    compute: true // Visual helper, logic in controller
  }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
