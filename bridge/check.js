try {
  require('node-zklib');
  require('express');
  require('cors');
  console.log('ALL_OK');
} catch(e) {
  console.error('FAIL: ' + e.message);
}
