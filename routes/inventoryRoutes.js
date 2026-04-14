const express = require('express');
const router = express.Router();
const { 
  getInventory, 
  createItem, 
  updateItem, 
  deleteItem 
} = require('../controllers/inventoryController');

router.route('/')
  .get(getInventory)
  .post(createItem);

router.route('/:id')
  .put(updateItem)
  .delete(deleteItem);

module.exports = router;
