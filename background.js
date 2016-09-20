chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('SpecRunner.html', {
    'outerBounds': {
      'width': 800,
      'height': 600,
      'top': 0,
      'left': 0
    }
  });

  chrome.app.window.create('window.html', {
    'outerBounds': {
      'width': 800,
      'height': 600,
      'top': 0,
      'left': 800
    }
  });
});
