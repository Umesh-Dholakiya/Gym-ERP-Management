const Inventory = require('../models/Inventory');

// Get all inventory items
exports.getInventory = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    
    // Add computed status
    const itemsWithStatus = items.map(item => {
      let status = 'In Stock';
      if (item.quantity === 0) status = 'Out of Stock';
      else if (item.quantity <= (item.minThreshold || 5)) status = 'Low Stock';
      return { ...item.toObject(), status };
    });

    res.json({ success: true, count: items.length, data: itemsWithStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Create inventory item
exports.createItem = async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Update inventory item
exports.updateItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete inventory item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
